"""Forecasting engine — weighted signal aggregation (V1).

Combines CRM pipeline, procurement notices, historical patterns, Google Trends
and job postings into a rolling 12-week demand forecast per skill.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Any

from supabase import Client, create_client

log = logging.getLogger(__name__)


class ForecastEngine:
    DEFAULT_WEIGHTS: dict[str, float] = {
        "crm_pipeline": 0.35,
        "procurement_notice": 0.25,
        "historical_pattern": 0.15,
        "trend_spike": 0.10,
        "job_posting": 0.10,
        "news_event": 0.05,
    }

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        *,
        weights: dict[str, float] | None = None,
    ) -> None:
        self.db: Client = create_client(supabase_url, supabase_key)
        self.weights = {**self.DEFAULT_WEIGHTS, **(weights or {})}

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
            procurement = self._score_procurement(skill_id)
            historical = self._score_historical_pattern(skill_id, target_week)
            trend = self._score_trends(skill_id)
            posting = self._score_job_postings(skill_id)

            raw_demand = (
                crm * self.weights["crm_pipeline"]
                + procurement * self.weights["procurement_notice"]
                + historical * self.weights["historical_pattern"]
                + trend * self.weights["trend_spike"]
                + posting * self.weights["job_posting"]
            )

            active = sum(1 for s in (crm, procurement, historical, trend, posting) if s > 0)
            confidence = min(active / 4.0, 1.0)
            supply = self._get_supply(skill_id, target_week)

            results.append(
                {
                    "skill_id": skill_id,
                    "forecast_week": target_week.isoformat(),
                    "predicted_demand": round(raw_demand, 2),
                    "current_supply": supply,
                    "gap": round(raw_demand - supply, 2),
                    "confidence": round(confidence, 2),
                    "contributing_signals": self._contributing_signal_ids(skill_id),
                    "notes": self._explain(skill_id, crm, procurement, historical, trend, posting),
                }
            )
        return results

    # ---------------------------------------------------- signal scorers ----
    # TODO: implement each scorer properly once seed data is in place.

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

    def _score_procurement(self, skill_id: str) -> float:
        rows = (
            self.db.table("signal_skills")
            .select("confidence, signals(detected_at, source)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        return sum(
            row["confidence"]
            for row in rows
            if (row.get("signals") or {}).get("source") == "ted_procurement"
        )

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

    def _score_trends(self, skill_id: str) -> float:
        rows = (
            self.db.table("signal_skills")
            .select("confidence, signals(signal_type)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        return sum(
            row["confidence"]
            for row in rows
            if (row.get("signals") or {}).get("signal_type") == "trend_spike"
        )

    def _score_job_postings(self, skill_id: str) -> float:
        rows = (
            self.db.table("signal_skills")
            .select("confidence, signals(signal_type)")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        return sum(
            row["confidence"]
            for row in rows
            if (row.get("signals") or {}).get("signal_type") == "job_posting"
        )

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

    def _contributing_signal_ids(self, skill_id: str) -> list[str]:
        rows = (
            self.db.table("signal_skills")
            .select("signal_id")
            .eq("skill_id", skill_id)
            .execute()
            .data
            or []
        )
        return [r["signal_id"] for r in rows]

    def _explain(self, skill_id: str, *scores: float) -> str:
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
        crm, procurement, historical, trend, posting = scores
        parts: list[str] = []
        if crm > 0:
            parts.append(f"Pipeline deals request {name}")
        if procurement > 0:
            parts.append(f"Recent procurement notices mention {name}")
        if historical > 0:
            parts.append("Seasonality: demand typically rises this quarter")
        if trend > 0:
            parts.append(f"Google Trends rising for {name} in Belgium")
        if posting > 0:
            parts.append(f"Active job postings mention {name}")
        return ". ".join(parts) + "." if parts else "No strong signals detected."

    # ------------------------------------------------------------- helpers --

    @staticmethod
    def _week_from_now(offset: int) -> date:
        return date.today() + timedelta(weeks=offset)

    @staticmethod
    def _now_iso() -> str:
        return date.today().isoformat()

    def _dump(self, obj: Any) -> Any:
        return obj
