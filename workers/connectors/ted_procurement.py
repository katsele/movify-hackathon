"""TED procurement connector — Belgian IT/consulting notices from TED API v3."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx

from .base import BaseConnector
from .skill_extractor import SkillExtractor

log = logging.getLogger(__name__)


class TEDProcurementConnector(BaseConnector):
    TED_API_BASE = "https://api.ted.europa.eu/v3"

    # Belgian IT/consulting CPV codes
    CPV_FILTERS = [
        "72000000",  # IT services
        "79411000",  # Management consultancy
        "72224000",  # Project management consultancy
        "72221000",  # Business analysis
        "73220000",  # Development consultancy
    ]

    def _source_name(self) -> str:
        return "ted_procurement"

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        super().__init__(supabase_url, supabase_key)
        self.extractor = SkillExtractor(self.db)

    def fetch_raw(self) -> list[dict]:
        since = (datetime.now(timezone.utc) - timedelta(days=7)).date().isoformat()
        notices: list[dict] = []
        with httpx.Client(timeout=30.0) as client:
            for cpv in self.CPV_FILTERS:
                params = {
                    "country": "BE",
                    "cpv": cpv,
                    "publishedAfter": since,
                    "sort": "publishedDate,desc",
                }
                try:
                    response = client.get(
                        f"{self.TED_API_BASE}/notices", params=params
                    )
                    response.raise_for_status()
                    notices.extend(response.json().get("notices", []))
                except httpx.HTTPError as err:
                    log.warning("TED fetch failed for cpv=%s: %s", cpv, err)
        return notices

    def transform(self, raw_notices: Any) -> list[dict]:
        signals: list[dict] = []
        for notice in raw_notices:
            text = " ".join(
                filter(
                    None,
                    [notice.get("title"), notice.get("description"), notice.get("specifications")],
                )
            )
            signals.append(
                {
                    "source": self._source_name(),
                    "signal_type": "procurement_notice",
                    "title": notice.get("title"),
                    "url": f"https://ted.europa.eu/notice/{notice.get('id')}",
                    "raw_data": notice,
                    "region": self._extract_region(notice),
                    "detected_at": notice.get("publishedDate"),
                    "extracted_skills": self.extractor.extract(text),
                }
            )
        return signals

    @staticmethod
    def _extract_region(notice: dict) -> str:
        # Simplistic NUTS → region mapping; refine later.
        nuts = (notice.get("nutsCode") or "").upper()
        if nuts.startswith("BE1"):
            return "brussels"
        if nuts.startswith("BE2"):
            return "flanders"
        if nuts.startswith("BE3"):
            return "wallonia"
        return "belgium"
