"""Forecasting engine — weighted signal aggregation (V1).

Combines CRM pipeline, news intelligence, procurement notices and historical
patterns into a rolling 12-month demand forecast per skill. Trend and job-posting
weights are zeroed for the hackathon cut (those connectors ship in V1).
"""
from __future__ import annotations

import logging
import math
from datetime import date, datetime, timezone
from typing import Any

from supabase import Client, create_client

log = logging.getLogger(__name__)

CONVERGENCE_WINDOW_DAYS = 28
SIGNAL_RECENCY_WINDOW_DAYS = 90
MIN_PERSISTED_DEMAND = 0.1
SOURCE_CONFIDENCE_CAPS: dict[str, float] = {
    "crm_pipeline": 0.50,
    "procurement_notice": 0.75,
    "news_event": 0.55,
    "historical_pattern": 0.25,
    "trend_spike": 0.40,
    "job_posting": 0.55,
}


class ForecastEngine:
    DEFAULT_WEIGHTS: dict[str, float] = {
        "crm_pipeline": 0.35,
        "procurement_notice": 0.25,
        "historical_pattern": 0.15,
        "news_event": 0.05,
        "trend_spike": 0.10,
        "job_posting": 0.10,
    }

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        *,
        weights: dict[str, float] | None = None,
    ) -> None:
        self.db: Client = create_client(supabase_url, supabase_key)
        persisted = self._load_source_weights()
        self.weights = {**self.DEFAULT_WEIGHTS, **persisted, **(weights or {})}

    def _load_source_weights(self) -> dict[str, float]:
        try:
            rows = self.db.table("source_weights").select("source_key, weight").execute().data or []
        except Exception as exc:
            log.warning("failed to load source_weights, using defaults: %s", exc)
            return {}

        weights: dict[str, float] = {}
        for row in rows:
            key = row.get("source_key")
            value = row.get("weight")
            if not isinstance(key, str):
                continue
            try:
                weights[key] = float(value)
            except (TypeError, ValueError):
                continue
        return weights

    # ------------------------------------------------------------------ run --

    def run(self, months_ahead: int = 12) -> int:
        self._clear_future_forecasts()
        skills = self.db.table("skills").select("id, name").execute().data or []
        generated_at = datetime.now(timezone.utc).isoformat()
        rows_written = 0
        for skill in skills:
            forecasts = self.generate_forecast(
                skill["id"],
                months_ahead=months_ahead,
                generated_at=generated_at,
            )
            if not self._should_persist_skill(forecasts):
                continue
            for forecast in forecasts:
                self.db.table("forecasts").upsert(
                    forecast, on_conflict="forecast_month,skill_id"
                ).execute()
                rows_written += 1
        log.info("forecast engine wrote %d rows", rows_written)
        return rows_written

    # ---------------------------------------------------------- generation --

    def generate_forecast(
        self,
        skill_id: str,
        months_ahead: int = 12,
        *,
        generated_at: str | None = None,
    ) -> list[dict]:
        results: list[dict] = []
        stamp = generated_at or datetime.now(timezone.utc).isoformat()

        for offset in range(1, months_ahead + 1):
            target_month = _add_months(_start_of_month(date.today()), offset)

            crm = self._score_crm_pipeline(skill_id, target_month)
            procurement = self._score_procurement(skill_id, target_month)
            news = self._score_news_events(skill_id, target_month)
            trend = self._score_trends(skill_id, target_month)
            postings = self._score_job_postings(skill_id, target_month)
            has_current_signal = (
                crm > 0 or procurement > 0 or news > 0 or trend > 0 or postings > 0
            )
            historical = (
                self._score_historical_pattern(skill_id, target_month)
                if has_current_signal
                else 0.0
            )

            raw_demand = (
                crm * self.weights["crm_pipeline"]
                + procurement * self.weights["procurement_notice"]
                + historical * self.weights["historical_pattern"]
                + news * self.weights["news_event"]
                + trend * self.weights["trend_spike"]
                + postings * self.weights["job_posting"]
            )

            source_confidences = {
                "crm_pipeline": self._effective_source_confidence(
                    "crm_pipeline", crm
                ),
                "procurement_notice": self._effective_source_confidence(
                    "procurement_notice", procurement
                ),
                "news_event": self._effective_source_confidence("news_event", news),
                "trend_spike": self._effective_source_confidence(
                    "trend_spike", trend
                ),
                "job_posting": self._effective_source_confidence(
                    "job_posting", postings
                ),
                "historical_pattern": self._effective_source_confidence(
                    "historical_pattern", historical
                ),
            }
            confidence = self._combine_source_confidence(source_confidences)
            converging = sum(
                1
                for source, value in source_confidences.items()
                if value > 0 and source != "historical_pattern"
            ) >= 2
            supply = self._get_supply(skill_id, target_month)

            results.append(
                {
                    "generated_at": stamp,
                    "skill_id": skill_id,
                    "forecast_month": target_month.isoformat(),
                    "predicted_demand": round(raw_demand, 2),
                    "current_supply": supply,
                    "gap": round(raw_demand - supply, 2),
                    "confidence": round(confidence, 2),
                    "contributing_signals": self._contributing_signal_ids(
                        skill_id, target_month
                    ),
                    "notes": self._explain(
                        skill_id,
                        crm,
                        procurement,
                        news,
                        historical,
                        trend,
                        postings,
                        converging,
                    ),
                }
            )
        return results

    # ---------------------------------------------------- signal scorers ----

    def _clear_future_forecasts(self) -> None:
        start = _start_of_month(date.today()).isoformat()
        self.db.table("forecasts").delete().gte("forecast_month", start).execute()

    @staticmethod
    def _should_persist_skill(forecasts: list[dict]) -> bool:
        return any(
            float(forecast.get("predicted_demand") or 0) >= MIN_PERSISTED_DEMAND
            for forecast in forecasts
        )

    @staticmethod
    def _effective_source_confidence(source: str, score: float) -> float:
        if score <= 0:
            return 0.0
        cap = SOURCE_CONFIDENCE_CAPS[source]
        return min(cap, 1 - math.exp(-score))

    @staticmethod
    def _combine_source_confidence(source_confidences: dict[str, float]) -> float:
        active = {
            source: value for source, value in source_confidences.items() if value > 0
        }
        if not active:
            return 0.0

        combined = 1.0 - math.prod(1.0 - value for value in active.values())
        supporting = [
            source for source in active.keys() if source != "historical_pattern"
        ]

        if not supporting:
            return round(min(combined, 0.25), 2)
        if len(supporting) == 1:
            return round(min(combined, SOURCE_CONFIDENCE_CAPS[supporting[0]]), 2)
        return round(min(combined + 0.1, 0.95), 2)

    def _score_crm_pipeline(self, skill_id: str, target_month: date) -> float:
        deals = (
            self.db.table("deal_profiles")
            .select("quantity, deals(expected_start, probability, status)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        score = 0.0
        current_month = _start_of_month(date.today())
        target_offset = _month_diff(target_month, current_month)
        for row in deals:
            deal = row.get("deals") or {}
            if deal.get("status") in ("won", "lost"):
                continue
            start = deal.get("expected_start")
            probability = deal.get("probability", 0.5)
            if not start:
                continue
            start_month = _start_of_month(date.fromisoformat(start))
            months_from_now = _month_diff(start_month, current_month)
            proximity = max(0.0, 1 - abs(months_from_now - target_offset) / 12)
            score += row["quantity"] * probability * proximity
        return score

    def _score_procurement(self, skill_id: str, target_month: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("ted_procurement",),
            target_month=target_month,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_news_events(self, skill_id: str, target_month: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("news_intelligence", "news"),
            target_month=target_month,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_trends(self, skill_id: str, target_month: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("google_trends",),
            target_month=target_month,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_job_postings(self, skill_id: str, target_month: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("ats_greenhouse", "ats_lever"),
            target_month=target_month,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_signal_sources(
        self,
        skill_id: str,
        *,
        sources: tuple[str, ...],
        target_month: date,
        window_days: int,
    ) -> float:
        rows = (
            self.db.table("signal_skills")
            .select("confidence, signals(detected_at, source)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        score = 0.0
        allowed = set(sources)
        for row in rows:
            sig = row.get("signals") or {}
            if sig.get("source") not in allowed:
                continue
            detected = _parse_detected_at(sig.get("detected_at"))
            if detected is None:
                continue
            days_age = abs((target_month - detected).days)
            if days_age > window_days:
                continue
            decay = max(0.0, 1.0 - days_age / window_days)
            score += row["confidence"] * decay
        return score

    def _score_historical_pattern(self, skill_id: str, target_month: date) -> float:
        rows = (
            self.db.table("project_skills")
            .select("headcount, projects(started_at)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        if not rows:
            return 0.0
        month_counts: dict[int, int] = {}
        for row in rows:
            started_at = (row.get("projects") or {}).get("started_at")
            if not started_at:
                continue
            month = date.fromisoformat(started_at).month
            month_counts[month] = month_counts.get(month, 0) + row["headcount"]
        total = sum(month_counts.values()) or 1
        return month_counts.get(target_month.month, 0) / total

    def _get_supply(self, skill_id: str, target_month: date) -> int:
        rows = (
            self.db.table("consultant_skills")
            .select("consultants(current_status, available_from)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        available = 0
        for row in rows:
            consultant = row.get("consultants") or {}
            if consultant.get("current_status") == "on_mission":
                continue
            avail_from = consultant.get("available_from")
            if avail_from and date.fromisoformat(avail_from) > target_month:
                continue
            available += 1
        return available

    def _contributing_signal_ids(
        self, skill_id: str, target_month: date
    ) -> list[str]:
        rows = (
            self.db.table("signal_skills")
            .select("signal_id, signals(detected_at)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        ids: list[str] = []
        for row in rows:
            detected = _parse_detected_at((row.get("signals") or {}).get("detected_at"))
            if detected is None:
                continue
            if abs((target_month - detected).days) <= CONVERGENCE_WINDOW_DAYS:
                ids.append(row["signal_id"])
        return sorted(set(ids))

    def _explain(
        self,
        skill_id: str,
        crm: float,
        procurement: float,
        news: float,
        historical: float,
        trend: float,
        postings: float,
        converging: bool,
    ) -> str:
        skill = (
            self.db.table("skills")
            .select("name")
            .eq("id", skill_id)
            .single()
            .execute()
            .data
            or {}
        )
        name = skill.get("name", "this skill")
        parts: list[str] = []
        if crm > 0:
            parts.append(f"Pipeline deals request {name}")
        if procurement > 0:
            parts.append(f"Recent procurement notices mention {name}")
        if news > 0:
            parts.append(f"Belgian news coverage signals demand for {name}")
        if historical > 0:
            parts.append("Seasonality: demand typically rises this quarter")
        if trend > 0:
            parts.append(f"Trend signals show growing attention around {name}")
        if postings > 0:
            parts.append(f"Live job postings point to hiring pressure for {name}")
        if converging:
            parts.append("Multiple independent sources agree — confidence boosted")
        return ". ".join(parts) + "." if parts else "No strong signals detected."


def _parse_detected_at(value: Any) -> date | None:
    """Parse a Supabase `detected_at` timestamp into a date (best-effort)."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        if text.endswith("Z"):
            text = text[:-1] + "+00:00"
        try:
            return datetime.fromisoformat(text).astimezone(timezone.utc).date()
        except ValueError:
            try:
                return date.fromisoformat(text[:10])
            except ValueError:
                return None
    return None


def _start_of_month(value: date) -> date:
    return value.replace(day=1)


def _add_months(value: date, months: int) -> date:
    month_index = value.month - 1 + months
    year = value.year + month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _month_diff(a: date, b: date) -> int:
    return (a.year - b.year) * 12 + (a.month - b.month)
