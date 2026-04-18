"""Forecasting engine — weighted signal aggregation (V1).

Combines CRM pipeline, news intelligence, procurement notices and historical
patterns into a rolling 12-week demand forecast per skill. Trend and job-posting
weights are zeroed for the hackathon cut (those connectors ship in V1).
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timedelta, timezone
from typing import Any

from supabase import Client, create_client

log = logging.getLogger(__name__)

CONVERGENCE_WINDOW_DAYS = 28
SIGNAL_RECENCY_WINDOW_DAYS = 90


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

    def run(self, weeks_ahead: int = 12) -> int:
        skills = self.db.table("skills").select("id, name").execute().data or []
        rows_written = 0
        for skill in skills:
            forecasts = self.generate_forecast(skill["id"], weeks_ahead=weeks_ahead)
            for forecast in forecasts:
                self.db.table("forecasts").upsert(
                    forecast, on_conflict="forecast_week,skill_id"
                ).execute()
                rows_written += 1
        log.info("forecast engine wrote %d rows", rows_written)
        return rows_written

    # ---------------------------------------------------------- generation --

    def generate_forecast(self, skill_id: str, weeks_ahead: int = 12) -> list[dict]:
        results: list[dict] = []
        today = date.today()

        for offset in range(1, weeks_ahead + 1):
            target_week = today + timedelta(weeks=offset)

            crm = self._score_crm_pipeline(skill_id, target_week)
            procurement = self._score_procurement(skill_id, target_week)
            news = self._score_news_events(skill_id, target_week)
            historical = self._score_historical_pattern(skill_id, target_week)
            trend = self._score_trends(skill_id, target_week)
            postings = self._score_job_postings(skill_id, target_week)

            raw_demand = (
                crm * self.weights["crm_pipeline"]
                + procurement * self.weights["procurement_notice"]
                + historical * self.weights["historical_pattern"]
                + news * self.weights["news_event"]
                + trend * self.weights["trend_spike"]
                + postings * self.weights["job_posting"]
            )

            active = sum(
                1
                for s in (crm, procurement, historical, news, trend, postings)
                if s > 0
            )
            base_confidence = min(active / 4.0, 1.0)
            sources = self._convergent_sources(skill_id, target_week)
            # When ≥2 independent sources hit the same skill within 4 weeks of
            # the target week, raise the confidence. Single-source (e.g. pipeline
            # only) stays at base — the UI then renders it with the low-confidence
            # opacity + hatched pattern.
            converging = len(sources) >= 2
            confidence = min(base_confidence + (0.2 if converging else 0.0), 1.0)
            supply = self._get_supply(skill_id, target_week)

            results.append(
                {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "skill_id": skill_id,
                    "forecast_week": target_week.isoformat(),
                    "predicted_demand": round(raw_demand, 2),
                    "current_supply": supply,
                    "gap": round(raw_demand - supply, 2),
                    "confidence": round(confidence, 2),
                    "contributing_signals": self._contributing_signal_ids(
                        skill_id, target_week
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

    def _score_crm_pipeline(self, skill_id: str, target_week: date) -> float:
        deals = (
            self.db.table("deal_profiles")
            .select("quantity, deals(expected_start, probability, status)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        score = 0.0
        for row in deals:
            deal = row.get("deals") or {}
            if deal.get("status") in ("won", "lost"):
                continue
            start = deal.get("expected_start")
            probability = deal.get("probability", 0.5)
            if not start:
                continue
            weeks_from_now = (date.fromisoformat(start) - date.today()).days / 7
            proximity = max(0.0, 1 - abs(weeks_from_now - (target_week - date.today()).days / 7) / 12)
            score += row["quantity"] * probability * proximity
        return score

    def _score_procurement(self, skill_id: str, target_week: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("ted_procurement",),
            target_week=target_week,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_news_events(self, skill_id: str, target_week: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("news_intelligence", "news"),
            target_week=target_week,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_trends(self, skill_id: str, target_week: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("google_trends",),
            target_week=target_week,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_job_postings(self, skill_id: str, target_week: date) -> float:
        return self._score_signal_sources(
            skill_id,
            sources=("ats_greenhouse", "ats_lever"),
            target_week=target_week,
            window_days=SIGNAL_RECENCY_WINDOW_DAYS,
        )

    def _score_signal_sources(
        self,
        skill_id: str,
        *,
        sources: tuple[str, ...],
        target_week: date,
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
            days_age = abs((target_week - detected).days)
            if days_age > window_days:
                continue
            decay = max(0.0, 1.0 - days_age / window_days)
            score += row["confidence"] * decay
        return score

    def _score_historical_pattern(self, skill_id: str, target_week: date) -> float:
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
        return month_counts.get(target_week.month, 0) / total

    def _get_supply(self, skill_id: str, target_week: date) -> int:
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
            if avail_from and date.fromisoformat(avail_from) > target_week:
                continue
            available += 1
        return available

    def _contributing_signal_ids(
        self, skill_id: str, target_week: date
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
            if abs((target_week - detected).days) <= CONVERGENCE_WINDOW_DAYS:
                ids.append(row["signal_id"])
        return ids

    def _convergent_sources(self, skill_id: str, target_week: date) -> set[str]:
        rows = (
            self.db.table("signal_skills")
            .select("signals(detected_at, source)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        sources: set[str] = set()
        for row in rows:
            sig = row.get("signals") or {}
            detected = _parse_detected_at(sig.get("detected_at"))
            if detected is None:
                continue
            if abs((target_week - detected).days) <= CONVERGENCE_WINDOW_DAYS:
                source = sig.get("source")
                if source:
                    sources.add(source)
        return sources

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
