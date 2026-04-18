"""News-intelligence connector — Belgian corporate announcements → skill priors.

Two-pass pipeline:

  Pass 1 — entity + event extraction (regex):
    - Match each entry's (title + summary) against the target-client alias list
      and the event-type lexicon. Triage: any entry matching either passes through.

  Pass 2 — LLM skill tagging (Claude Haiku):
    - Delegate skill extraction to `LLMSkillExtractor`, which combines the
      taxonomy, the handcrafted PRIORS table, and the article text. The LLM
      grounds its tags in what the article actually says rather than relying
      purely on industry priors.
    - A `score` in [0, 1] is still written to raw_data so the UI can rank.
    - Entries that resolve to zero skills are dropped — without a skill tag,
      a signal cannot inform the forecast.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

import feedparser

from .base import BaseConnector
from .llm_skill_extractor import LLMSkillExtractor
from .news_clients import TARGET_CLIENTS, TargetClient
from .news_events import EVENT_KEYWORDS
from .news_feeds import NEWS_FEEDS, NewsFeed

log = logging.getLogger(__name__)


class NewsIntelligenceConnector(BaseConnector):
    def _source_name(self) -> str:
        return "news_intelligence"

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        super().__init__(supabase_url, supabase_key)
        self._llm_extractor = LLMSkillExtractor(self.db)
        self._client_patterns = self._compile_client_patterns()
        self._event_patterns = self._compile_event_patterns()

    # -- index preloading ---------------------------------------------------

    @staticmethod
    def _compile_client_patterns() -> list[tuple[TargetClient, re.Pattern[str]]]:
        compiled: list[tuple[TargetClient, re.Pattern[str]]] = []
        for client in TARGET_CLIENTS:
            alt = "|".join(re.escape(a) for a in client.aliases)
            pattern = re.compile(rf"(?<![A-Za-z0-9])(?:{alt})(?![A-Za-z0-9])", re.IGNORECASE)
            compiled.append((client, pattern))
        return compiled

    @staticmethod
    def _compile_event_patterns() -> dict[str, re.Pattern[str]]:
        return {
            event_type: re.compile(
                rf"(?<![A-Za-z0-9])(?:{'|'.join(re.escape(k) for k in keywords)})(?![A-Za-z0-9])",
                re.IGNORECASE,
            )
            for event_type, keywords in EVENT_KEYWORDS.items()
        }

    # -- fetch --------------------------------------------------------------

    def fetch_raw(self) -> list[dict]:
        entries: list[dict] = []
        for feed in NEWS_FEEDS:
            try:
                parsed = feedparser.parse(feed.url)
            except Exception as err:  # feedparser rarely raises; keep broad.
                log.warning("failed to parse %s: %s", feed.url, err)
                continue
            if parsed.bozo and not parsed.entries:
                level = logging.INFO if feed.optional else logging.WARNING
                log.log(level, "feed %s returned no entries (%s)", feed.url, parsed.bozo_exception)
                continue
            for raw in parsed.entries:
                entries.append(self._normalise_entry(raw, feed))
        log.info("news_intelligence: pulled %d raw entries", len(entries))
        return entries

    @staticmethod
    def _normalise_entry(raw: Any, feed: NewsFeed) -> dict:
        return {
            "outlet": feed.outlet,
            "language": feed.language,
            "title": getattr(raw, "title", None) or "",
            "summary": getattr(raw, "summary", None) or getattr(raw, "description", None) or "",
            "link": getattr(raw, "link", None),
            "published": _parse_published(raw),
        }

    # -- transform ----------------------------------------------------------

    def transform(self, raw_entries: Any) -> list[dict]:
        signals: list[dict] = []
        dropped_neither = 0
        dropped_no_skills = 0
        for entry in raw_entries:
            text = f"{entry['title']} {entry['summary']}"
            client = self._match_client(text)
            event_types = self._match_events(text)
            if client is None and not event_types:
                dropped_neither += 1
                continue

            llm_context: dict[str, Any] = {
                "source_type": "news",
                "outlet": entry["outlet"],
                "language": entry["language"],
                "event_type": event_types[0] if event_types else None,
                "matched_events": event_types,
            }
            if client is not None:
                llm_context["client"] = client.legal_name
                llm_context["client_key"] = client.key
                llm_context["industry"] = client.industry
            extracted = self._llm_extractor.extract(text, llm_context)
            if not extracted:
                dropped_no_skills += 1
                continue

            match_tier = self._match_tier(client, event_types)
            score = self._score_signal(
                client=client,
                event_types=event_types,
                match_tier=match_tier,
                detected_at=entry["published"],
            )
            raw_data: dict[str, Any] = {
                "outlet": entry["outlet"],
                "language": entry["language"],
                "summary": entry["summary"][:500],
                "event_type": event_types[0] if event_types else None,
                "matched_events": event_types,
                "priors_tier": match_tier,
                "tagger": "llm_haiku",
                "score": round(score, 3),
            }
            if client is not None:
                raw_data["client"] = client.legal_name
                raw_data["client_key"] = client.key
                raw_data["industry"] = client.industry
            signals.append(
                {
                    "source": self._source_name(),
                    "signal_type": "news_event",
                    "title": entry["title"],
                    "url": entry["link"],
                    "detected_at": entry["published"],
                    "region": "belgium",
                    "raw_data": raw_data,
                    "extracted_skills": extracted,
                }
            )
        log.info(
            "news_intelligence: kept %d, dropped %d (neither client nor event), dropped %d (no skills)",
            len(signals), dropped_neither, dropped_no_skills,
        )
        return signals

    def _match_client(self, text: str) -> TargetClient | None:
        for client, pattern in self._client_patterns:
            if pattern.search(text):
                return client
        return None

    def _match_events(self, text: str) -> list[str]:
        hits: list[str] = []
        for event_type, pattern in self._event_patterns.items():
            if pattern.search(text):
                hits.append(event_type)
        return hits

    @staticmethod
    def _match_tier(client: TargetClient | None, event_types: list[str]) -> str:
        """Summarise how specific the Pass 1 match was — fed to raw_data and scoring.

        Values: "exact" (client + event) | "client_default" (client only) |
        "wildcard" (event only).
        """
        if client is not None and event_types:
            return "exact"
        if client is not None:
            return "client_default"
        return "wildcard"

    @staticmethod
    def _score_signal(
        client: TargetClient | None,
        event_types: list[str],
        match_tier: str,
        detected_at: str,
    ) -> float:
        """Compose a 0-1 relevance score for the UI to rank/threshold on.

        Weights:
          - client matched: 0.4
          - event matched:  0.3
          - match tier:     0.2 exact / 0.1 client_default|wildcard
          - recency:        up to 0.1 (linear decay over 14 days)
        """
        score = 0.0
        if client is not None:
            score += 0.4
        if event_types:
            score += 0.3
        score += 0.2 if match_tier == "exact" else 0.1

        try:
            published = datetime.fromisoformat(detected_at.replace("Z", "+00:00"))
        except ValueError:
            published = datetime.now(timezone.utc)
        age_days = (datetime.now(timezone.utc) - published).total_seconds() / 86400
        score += max(0.0, 1.0 - age_days / 14.0) * 0.1

        return max(0.0, min(1.0, score))

    # -- load ---------------------------------------------------------------

    def load(self, signals: list[dict]) -> int:
        """Upsert on `url` so reruns don't duplicate signals."""
        loaded = 0
        for signal in signals:
            extracted = signal.pop("extracted_skills", [])
            url = signal.get("url")
            if url:
                result = self.db.table("signals").upsert(signal, on_conflict="url").execute()
            else:
                result = self.db.table("signals").upsert(signal).execute()
            if not result.data:
                continue
            signal_id = result.data[0]["id"]
            for match in extracted:
                self.db.table("signal_skills").upsert(
                    {
                        "signal_id": signal_id,
                        "skill_id": match["skill_id"],
                        "confidence": match.get("confidence", 0.5),
                    }
                ).execute()
            loaded += 1
        return loaded


def _parse_published(raw: Any) -> str:
    """Coerce feedparser's date fields into an ISO-8601 string."""
    struct = getattr(raw, "published_parsed", None) or getattr(raw, "updated_parsed", None)
    if struct is None:
        return datetime.now(timezone.utc).isoformat()
    return datetime(*struct[:6], tzinfo=timezone.utc).isoformat()
