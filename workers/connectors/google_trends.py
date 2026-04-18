"""Google Trends connector — tracks interest in key skills across Belgian regions."""
from __future__ import annotations

import logging
from typing import Any

from .base import BaseConnector
from .llm_skill_extractor import LLMSkillExtractor

log = logging.getLogger(__name__)


class GoogleTrendsConnector(BaseConnector):
    TRACKED_TERMS: tuple[str, ...] = (
        "React developer",
        "Next.js",
        "AI engineer",
        "LangChain",
        "dbt analytics",
        "platform engineering",
        "accessibility audit",
        "service design",
    )

    GEO_REGIONS: dict[str, str] = {
        "BE": "belgium",
        "BE-VLG": "flanders",
        "BE-WAL": "wallonia",
        "BE-BRU": "brussels",
    }

    SPIKE_THRESHOLD = 0.2  # 20% increase over 4 weeks

    def _source_name(self) -> str:
        return "google_trends"

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        super().__init__(supabase_url, supabase_key)
        self._llm_extractor = LLMSkillExtractor(self.db)

    def fetch_raw(self) -> list[dict]:
        from pytrends.request import TrendReq  # imported lazily

        pytrends = TrendReq(hl="en-US", tz=60)
        results: list[dict] = []
        terms = list(self.TRACKED_TERMS)

        for i in range(0, len(terms), 5):
            batch = terms[i : i + 5]
            for geo_code, region_name in self.GEO_REGIONS.items():
                try:
                    pytrends.build_payload(batch, timeframe="today 3-m", geo=geo_code)
                    interest = pytrends.interest_over_time()
                    raw_data = interest.to_dict() if not interest.empty else {}
                    # pandas Timestamp keys aren't JSON-serialisable. Coerce to
                    # ISO date strings so raw_data survives the Supabase upsert.
                    serialisable = {
                        term: {
                            (ts.isoformat() if hasattr(ts, "isoformat") else str(ts)): value
                            for ts, value in series.items()
                        }
                        for term, series in raw_data.items()
                    }
                    results.append(
                        {
                            "terms": batch,
                            "geo": geo_code,
                            "region": region_name,
                            "data": serialisable,
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
                spike_pct = self._spike_magnitude(trend)
                if spike_pct is None:
                    continue
                extracted = self._llm_extractor.extract(
                    term,
                    {
                        "source_type": "trend",
                        "term": term,
                        "region": result["region"],
                        "spike_pct": round(spike_pct * 100, 1),
                    },
                )
                if not extracted:
                    continue
                signals.append(
                    {
                        "source": self._source_name(),
                        "signal_type": "trend_spike",
                        "title": f"Rising interest: {term} in {result['region']}",
                        "raw_data": {
                            "term": term,
                            "trend": trend,
                            "spike_pct": round(spike_pct * 100, 1),
                            "tagger": "llm_haiku",
                        },
                        "region": result["region"],
                        "extracted_skills": extracted,
                    }
                )
        return signals

    def _spike_magnitude(self, trend_data: dict) -> float | None:
        """Return the relative spike (recent_avg - prior_avg) / prior_avg, or None if no spike."""
        if not trend_data:
            return None
        values = list(trend_data.values())
        if len(values) < 8:
            return None
        recent = sum(values[-4:]) / 4
        prior = sum(values[:4]) / 4 or 1
        spike = (recent - prior) / prior
        return spike if spike > self.SPIKE_THRESHOLD else None
