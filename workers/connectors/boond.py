"""Boond CRM connector — ingests consultants, deals, historical projects.

Supports two modes:
- API mode: live Boond REST API (if access granted)
- Export mode: periodic CSV/JSON imports
"""
from __future__ import annotations

import logging
import os
from typing import Any

from .base import BaseConnector

log = logging.getLogger(__name__)


class BoondConnector(BaseConnector):
    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        *,
        api_base: str | None = None,
        api_token: str | None = None,
        export_dir: str | None = None,
    ) -> None:
        super().__init__(supabase_url, supabase_key)
        self.api_base = api_base or os.environ.get("BOOND_API_BASE")
        self.api_token = api_token or os.environ.get("BOOND_API_TOKEN")
        self.export_dir = export_dir or os.environ.get("BOOND_EXPORT_DIR")
        self.api_available = bool(self.api_base and self.api_token)

    def _source_name(self) -> str:
        return "boond_crm"

    def fetch_raw(self) -> dict[str, list[dict]]:
        if self.api_available:
            return {
                "deals": self._fetch_deals(),
                "consultants": self._fetch_consultants(),
                "projects": self._fetch_projects(),
            }
        return self._read_exports()

    def transform(self, raw_data: Any) -> dict[str, list[dict]]:
        """Map Boond fields → our CRM-agnostic schema."""
        return {
            "consultants": [self._map_consultant(c) for c in raw_data.get("consultants", [])],
            "deals": [self._map_deal(d) for d in raw_data.get("deals", [])],
            "deal_profiles": [
                profile
                for d in raw_data.get("deals", [])
                for profile in self._map_deal_profiles(d)
            ],
            "projects": [self._map_project(p) for p in raw_data.get("projects", [])],
        }

    def load(self, data: Any) -> int:  # type: ignore[override]
        loaded = 0
        for consultant in data.get("consultants", []):
            self.db.table("consultants").upsert(consultant).execute()
            loaded += 1
        for deal in data.get("deals", []):
            self.db.table("deals").upsert(deal).execute()
            loaded += 1
        for profile in data.get("deal_profiles", []):
            self.db.table("deal_profiles").upsert(profile).execute()
        for project in data.get("projects", []):
            self.db.table("projects").upsert(project).execute()
        return loaded

    # ------ Boond API helpers (stub until credentials / API shape confirmed) --

    def _fetch_deals(self) -> list[dict]:
        raise NotImplementedError("Boond API deal endpoint — wire once access granted")

    def _fetch_consultants(self) -> list[dict]:
        raise NotImplementedError("Boond API consultant endpoint")

    def _fetch_projects(self) -> list[dict]:
        raise NotImplementedError("Boond API project endpoint")

    def _read_exports(self) -> dict[str, list[dict]]:
        raise NotImplementedError("Boond export reader — implement once export format known")

    # ------ Adapter: Boond → internal ----------------------------------------

    def _map_consultant(self, raw: dict) -> dict:
        return {
            "external_id": str(raw.get("id")),
            "name": raw.get("name"),
            "current_status": raw.get("status", "on_bench"),
            "available_from": raw.get("available_from"),
        }

    def _map_deal(self, raw: dict) -> dict:
        return {
            "external_id": str(raw.get("id")),
            "title": raw.get("title"),
            "client_name": raw.get("client"),
            "status": raw.get("status", "prospect"),
            "expected_start": raw.get("expected_start"),
            "expected_duration_weeks": raw.get("duration_weeks"),
            "probability": raw.get("probability", 0.5),
        }

    def _map_deal_profiles(self, raw_deal: dict) -> list[dict]:
        # Each Boond deal may list several requested profiles.
        return [
            {
                "deal_id": str(raw_deal.get("id")),
                "skill_id": profile.get("skill_id"),
                "quantity": profile.get("quantity", 1),
                "seniority": profile.get("seniority", "mid"),
                "notes": profile.get("notes"),
            }
            for profile in raw_deal.get("profiles", [])
        ]

    def _map_project(self, raw: dict) -> dict:
        return {
            "external_id": str(raw.get("id")),
            "title": raw.get("title"),
            "client_name": raw.get("client"),
            "sector": raw.get("sector"),
            "started_at": raw.get("started_at"),
            "ended_at": raw.get("ended_at"),
        }
