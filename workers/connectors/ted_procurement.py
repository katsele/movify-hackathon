"""TED procurement connector — Belgian IT/consulting notices from TED API v3.

Fetches notices from `POST /v3/notices/search` using the Expert Search query
syntax. One request per CPV code (the search parameter takes a scalar). Each
response notice is transformed into a `signals` row plus `signal_skills`
entries tagged by the shared `LLMSkillExtractor` (Claude Haiku).

Confidence is judged per-signal by the LLM against the taxonomy and CPV
context, replacing the old fixed `0.80` override. The upsert on `url` makes
reruns idempotent.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable

import httpx

from .base import BaseConnector
from .llm_skill_extractor import LLMSkillExtractor

log = logging.getLogger(__name__)

# Coarse labels for the display chip. We only name CPV roots we actually query.
CPV_LABELS: dict[str, str] = {
    "72000000": "IT services",
    "79411000": "Management consultancy",
    "72224000": "Project management consultancy",
    "72221000": "Business analysis",
    "73220000": "Development consultancy",
}

LOOKBACK_DAYS = 60  # generous window → Story 4 AC6 wants ≥5 hits


class TEDProcurementConnector(BaseConnector):
    TED_SEARCH_URL = "https://api.ted.europa.eu/v3/notices/search"

    CPV_FILTERS = list(CPV_LABELS.keys())

    # TED's `fields` parameter takes eForms BT-* codes. Requesting unsupported
    # fields fails the whole request, so this list is narrow and tested.
    RESPONSE_FIELDS = [
        "publication-number",
        "publication-date",
        "place-of-performance",
        "links",
        "BT-21-Lot",                    # lot title (multilingual)
        "BT-24-Lot",                    # lot description (multilingual)
        "classification-cpv",
        "organisation-name-buyer",
        "notice-type",
        "deadline-receipt-tender-date-lot",
    ]

    def _source_name(self) -> str:
        return "ted_procurement"

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        super().__init__(supabase_url, supabase_key)
        self.extractor = LLMSkillExtractor(self.db)

    # -- fetch --------------------------------------------------------------

    def fetch_raw(self) -> list[dict]:
        since = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).date()
        notices: list[dict] = []
        seen_publication_numbers: set[str] = set()

        with httpx.Client(timeout=30.0) as client:
            for cpv in self.CPV_FILTERS:
                body = {
                    "query": (
                        f"classification-cpv={cpv} "
                        f"AND place-of-performance=BEL "
                        f"AND publication-date>={since.strftime('%Y%m%d')}"
                    ),
                    "fields": self.RESPONSE_FIELDS,
                    "limit": 50,
                    "scope": "ALL",
                }
                try:
                    response = client.post(self.TED_SEARCH_URL, json=body)
                    response.raise_for_status()
                except httpx.HTTPError as err:
                    log.warning("TED fetch failed for cpv=%s: %s", cpv, err)
                    continue

                for notice in response.json().get("notices", []):
                    pub_number = notice.get("publication-number")
                    if not pub_number or pub_number in seen_publication_numbers:
                        continue
                    seen_publication_numbers.add(pub_number)
                    notice["_matched_cpv"] = cpv
                    notices.append(notice)

        log.info("ted_procurement: pulled %d unique notices", len(notices))
        return notices

    # -- transform ----------------------------------------------------------

    def transform(self, raw_notices: Any) -> list[dict]:
        signals: list[dict] = []
        for notice in raw_notices:
            pub_number = notice.get("publication-number") or ""
            title = self._pick_lang(notice.get("BT-24-Lot"))
            if not title:
                title = self._pick_lang(notice.get("BT-21-Lot")) or f"TED notice {pub_number}"

            skill_text = self._build_skill_text(notice)
            cpv_codes = notice.get("classification-cpv") or []
            primary_cpv = self._primary_cpv(cpv_codes, notice.get("_matched_cpv"))
            buyer_name = self._first(notice.get("organisation-name-buyer"))
            extracted = self.extractor.extract(
                skill_text,
                {
                    "source_type": "procurement",
                    "cpv_code": primary_cpv,
                    "cpv_label": CPV_LABELS.get(primary_cpv or "", None),
                    "buyer": buyer_name,
                    "notice_type": notice.get("notice-type"),
                },
            )
            # Keep notices without matched skills — Sebastiaan reviews them to
            # spot taxonomy gaps. recent_signals LEFT-joins signal_skills so
            # skill-less notices still surface on the feed.

            raw_data: dict[str, Any] = {
                "contracting_authority": buyer_name,
                # SignalCard's existing client-chip contract — alias buyer → client.
                "client": buyer_name or "Contracting authority",
                # SignalCard's event-type contract — keep news and procurement chips aligned.
                "event_type": "procurement",
                "cpv_code": primary_cpv,
                "cpv_label": CPV_LABELS.get(primary_cpv or "", None),
                "cpv_codes": cpv_codes,
                "notice_type": notice.get("notice-type"),
                "deadline": self._first(notice.get("deadline-receipt-tender-date-lot")),
                "publication_number": pub_number,
                "title_multilingual": notice.get("BT-24-Lot") or notice.get("BT-21-Lot"),
            }

            signals.append(
                {
                    "source": self._source_name(),
                    "signal_type": "procurement_notice",
                    "title": title[:400],
                    "url": self._pick_link(notice.get("links")),
                    "raw_data": raw_data,
                    "region": self._extract_region(notice.get("place-of-performance") or []),
                    "detected_at": self._normalise_date(notice.get("publication-date")),
                    "extracted_skills": extracted,
                }
            )
        with_skills = sum(1 for s in signals if s["extracted_skills"])
        log.info(
            "ted_procurement: transformed %d notices (%d with matched skills)",
            len(signals),
            with_skills,
        )
        return signals

    # -- load ---------------------------------------------------------------

    def load(self, signals: list[dict]) -> int:
        """Upsert on `url` so reruns don't duplicate notices (mirrors news)."""
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

    # -- helpers ------------------------------------------------------------

    @staticmethod
    def _pick_lang(field: Any, prefer: Iterable[str] = ("eng", "fra", "nld", "deu")) -> str | None:
        """TED multilingual fields come as `{"nld": [...], "fra": [...]}`.

        Pick the first non-empty value in the preferred language order. If none
        of the preferred languages are present, fall back to any language.
        """
        if not isinstance(field, dict):
            return None
        for lang in prefer:
            value = field.get(lang)
            if value:
                return value[0] if isinstance(value, list) else str(value)
        for value in field.values():
            if value:
                return value[0] if isinstance(value, list) else str(value)
        return None

    def _build_skill_text(self, notice: dict) -> str:
        """Concatenate all multilingual title + description strings for the
        skill matcher. Skill names and framework tokens are Anglo-dominant, so
        it is safe to throw every language at the matcher — false positives
        from Dutch or French common words are rare for the skill taxonomy.
        """
        chunks: list[str] = []
        for key in ("BT-21-Lot", "BT-24-Lot"):
            field = notice.get(key)
            if not isinstance(field, dict):
                continue
            for values in field.values():
                if isinstance(values, list):
                    chunks.extend(str(v) for v in values if v)
                elif values:
                    chunks.append(str(values))
        return " ".join(chunks)

    @staticmethod
    def _first(value: Any) -> str | None:
        if isinstance(value, list):
            return str(value[0]) if value else None
        return str(value) if value else None

    @staticmethod
    def _primary_cpv(cpv_codes: list[str], fallback: str | None) -> str | None:
        if cpv_codes:
            return str(cpv_codes[0])
        return fallback

    @staticmethod
    def _pick_link(links: Any, prefer: Iterable[str] = ("ENG", "FRA", "NLD")) -> str | None:
        if not isinstance(links, dict):
            return None
        html = links.get("html")
        if not isinstance(html, dict):
            return None
        for lang in prefer:
            url = html.get(lang)
            if url:
                return url
        for url in html.values():
            if url:
                return url
        return None

    @staticmethod
    def _extract_region(nuts_codes: list[str]) -> str:
        for code in nuts_codes:
            upper = str(code).upper()
            if upper.startswith("BE1"):
                return "brussels"
            if upper.startswith("BE2"):
                return "flanders"
            if upper.startswith("BE3"):
                return "wallonia"
        return "belgium"

    @staticmethod
    def _normalise_date(raw: Any) -> str:
        """TED returns dates like `2026-02-02+01:00`. Postgres accepts ISO-8601
        but the bare offset suffix is the date's timezone, not a time. Coerce
        to midnight UTC on that date so `detected_at` lands sensibly.
        """
        if not raw:
            return datetime.now(timezone.utc).isoformat()
        try:
            # Pull the leading YYYY-MM-DD.
            date_part = str(raw)[:10]
            return datetime.fromisoformat(date_part).replace(tzinfo=timezone.utc).isoformat()
        except ValueError:
            return datetime.now(timezone.utc).isoformat()
