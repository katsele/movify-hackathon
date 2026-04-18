"""News-intelligence connector — Belgian corporate announcements → skill priors.

Two-pass pipeline (Tier D per `docs/research/per-source-heuristics.md §8`):

  Pass 1 — entity + event extraction:
    - Regex-match each entry's (title + summary) against the target-client
      alias list. First client match wins.
    - Regex-match against the event-type lexicon. Multiple event types are
      allowed per entry.

  Pass 2 — priors lookup (inference, not extraction):
    - For each matched (client, event_type), look up likely-skill-demand in
      `PRIORS[(client_key, event_type)]`.
    - Fall back to `PRIORS[(industry, event_type)]`, then to `PRIORS[("*", event_type)]`.
    - If a client matched but no event did, fall back to *all* priors registered
      for that client/industry, capped at 0.4 confidence.
    - Resolve skill names to skill IDs via a one-shot skills table load.

  Triage (instead of hard filter):
    - Any entry matching *either* a client or an event passes through.
    - A `score` in [0, 1] is written to raw_data so the UI can rank/threshold.
    - Entries that resolve to zero skills are still dropped — without a skill
      tag, a signal cannot inform the forecast.
"""
from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

import feedparser

from .base import BaseConnector
from .news_clients import TARGET_CLIENTS, TargetClient
from .news_events import EVENT_KEYWORDS
from .news_feeds import NEWS_FEEDS, NewsFeed
from .news_priors import PRIORS

log = logging.getLogger(__name__)


class NewsIntelligenceConnector(BaseConnector):
    def _source_name(self) -> str:
        return "news_intelligence"

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        super().__init__(supabase_url, supabase_key)
        self._skill_name_to_id = self._load_skill_index()
        self._client_patterns = self._compile_client_patterns()
        self._event_patterns = self._compile_event_patterns()

    # -- index preloading ---------------------------------------------------

    def _load_skill_index(self) -> dict[str, str]:
        response = self.db.table("skills").select("id, name").execute()
        return {row["name"].lower(): row["id"] for row in (response.data or [])}

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
            extracted, priors_tier = self._infer_skills(client, event_types)
            if not extracted:
                dropped_no_skills += 1
                continue
            score = self._score_signal(
                client=client,
                event_types=event_types,
                priors_tier=priors_tier,
                detected_at=entry["published"],
            )
            raw_data: dict[str, Any] = {
                "outlet": entry["outlet"],
                "language": entry["language"],
                "summary": entry["summary"][:500],
                "event_type": event_types[0] if event_types else None,
                "matched_events": event_types,
                "priors_tier": priors_tier,
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

    def _infer_skills(
        self, client: TargetClient | None, event_types: list[str]
    ) -> tuple[list[dict], str]:
        """Return (extracted_skills, tier).

        `tier` describes which priors layer fired — useful for scoring and
        surfaced in raw_data so the eval panel can explain the confidence.
        Values: "exact" | "industry" | "wildcard" | "client_default" | "none".
        """
        seen: dict[str, float] = {}  # skill_id -> best confidence
        tier = "none"
        tier_rank = {"none": 0, "client_default": 1, "wildcard": 2, "industry": 3, "exact": 4}

        def _record(priors: list[tuple[str, float]], hit_tier: str, cap: float | None = None) -> None:
            nonlocal tier
            for skill_name, confidence in priors:
                skill_id = self._skill_name_to_id.get(skill_name.lower())
                if skill_id is None:
                    log.debug("priors reference unknown skill %r", skill_name)
                    continue
                effective = min(confidence, cap) if cap is not None else confidence
                if seen.get(skill_id, 0.0) < effective:
                    seen[skill_id] = effective
                if tier_rank[hit_tier] > tier_rank[tier]:
                    tier = hit_tier

        if client is not None and event_types:
            for event_type in event_types:
                if (client.key, event_type) in PRIORS:
                    _record(PRIORS[(client.key, event_type)], "exact")
                elif (client.industry, event_type) in PRIORS:
                    _record(PRIORS[(client.industry, event_type)], "industry")
                elif ("*", event_type) in PRIORS:
                    _record(PRIORS[("*", event_type)], "wildcard", cap=0.4)
        elif client is not None:
            # Client hit but no event matched — sweep every prior registered
            # for this client or industry, capped because there's no event
            # context narrowing it.
            for (key, _event), priors in PRIORS.items():
                if key == client.key or key == client.industry:
                    _record(priors, "client_default", cap=0.4)
        elif event_types:
            # Event hit but no client — only wildcard priors can help.
            for event_type in event_types:
                if ("*", event_type) in PRIORS:
                    _record(PRIORS[("*", event_type)], "wildcard", cap=0.4)

        extracted = [{"skill_id": sid, "confidence": conf} for sid, conf in seen.items()]
        return extracted, tier

    @staticmethod
    def _score_signal(
        client: TargetClient | None,
        event_types: list[str],
        priors_tier: str,
        detected_at: str,
    ) -> float:
        """Compose a 0-1 relevance score for the UI to rank/threshold on.

        Weights:
          - client matched: 0.4
          - event matched:  0.3
          - priors tier:    0.2 exact / 0.15 industry / 0.10 wildcard|client_default
          - recency:        up to 0.1 (linear decay over 14 days)
        """
        score = 0.0
        if client is not None:
            score += 0.4
        if event_types:
            score += 0.3
        score += {"exact": 0.2, "industry": 0.15}.get(priors_tier, 0.1)

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
