"""Google Trends connector — tracks interest in key skills across Belgian regions."""
from __future__ import annotations

import logging
from typing import Any

from .base import BaseConnector

log = logging.getLogger(__name__)


class GoogleTrendsConnector(BaseConnector):
    TRACKED_TERMS: dict[str, str] = {
        "React developer": "react",
        "Next.js": "nextjs",
        "AI engineer": "ai_engineering",
        "LangChain": "langchain",
        "dbt analytics": "dbt",
        "platform engineering": "platform_engineering",
        "accessibility audit": "accessibility",
        "service design": "service_design",
    }

    GEO_REGIONS: dict[str, str] = {
        "BE": "belgium",
        "BE-VLG": "flanders",
        "BE-WAL": "wallonia",
        "BE-BRU": "brussels",
    }

    SPIKE_THRESHOLD = 0.2  # 20% increase over 4 weeks

    def _source_name(self) -> str:
        return "google_trends"

    def fetch_raw(self) -> list[dict]:
        from pytrends.request import TrendReq  # imported lazily

        pytrends = TrendReq(hl="en-US", tz=60)
        results: list[dict] = []
        terms = list(self.TRACKED_TERMS.keys())

        for i in range(0, len(terms), 5):
            batch = terms[i : i + 5]
            for geo_code, region_name in self.GEO_REGIONS.items():
                try:
                    pytrends.build_payload(batch, timeframe="today 3-m", geo=geo_code)
                    interest = pytrends.interest_over_time()
                    results.append(
                        {
                            "terms": batch,
                            "geo": geo_code,
                            "region": region_name,
                            "data": interest.to_dict() if not interest.empty else {},
                        }
                    )
                except Exception as err:
                    log.warning("pytrends fetch failed batch=%s geo=%s: %s", batch, geo_code, err)
        return results

    def transform(self, raw_results: Any) -> list[dict]:
        signals: list[dict] = []
        for result in raw_results:
            for term in result["terms"]:
                trend = result["data"].get(term, {})
                if self._is_spike(trend):
                    signals.append(
                        {
                            "source": self._source_name(),
                            "signal_type": "trend_spike",
                            "title": f"Rising interest: {term} in {result['region']}",
                            "raw_data": {"term": term, "trend": trend},
                            "region": result["region"],
                            "extracted_skills": [
                                {
                                    "skill_id": self._resolve_skill(term),
                                    "confidence": 0.7,
                                }
                            ],
                        }
                    )
        return signals

    def _is_spike(self, trend_data: dict) -> bool:
        if not trend_data:
            return False
        values = list(trend_data.values())
        if len(values) < 8:
            return False
        recent = sum(values[-4:]) / 4
        prior = sum(values[:4]) / 4 or 1
        return (recent - prior) / prior > self.SPIKE_THRESHOLD

    def _resolve_skill(self, term: str) -> str | None:
        """Resolve a tracked search term to a skill.id via the taxonomy."""
        slug = self.TRACKED_TERMS.get(term)
        if not slug:
            return None
        # Simple lookup by slug in aliases / name — extend with a cache in V1.
        response = (
            self.db.table("skills").select("id, name, aliases").execute()
        )
        for row in response.data or []:
            terms = [row["name"].lower()] + [a.lower() for a in row.get("aliases") or []]
            if slug in terms or any(slug in t for t in terms):
                return row["id"]
        return None
