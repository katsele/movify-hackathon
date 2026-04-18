"""Boond CRM connector — ingests consultants, deals (opportunities), projects.

Supports two auth modes against the Boondmanager REST API:
- x-Jwt-Client-BoondManager (preferred): HS256-signed JWT over
  {userToken, clientToken, time, mode} using clientKey as secret.
- HTTP Basic: account email + password (API access must be enabled).

Response format is JSON:API — `{meta, data: [{id, type, attributes, relationships}]}`.
Pagination uses `page` + `maxResults`, with totals at `meta.totals.rows`.
"""
from __future__ import annotations

import base64
import logging
import os
import time
from datetime import date
from typing import Any, Callable, Iterator

import httpx
import jwt

from .base import BaseConnector
from .skill_extractor import SkillExtractor

log = logging.getLogger(__name__)


class BoondConnector(BaseConnector):
    DEFAULT_API_BASE = "https://ui.boondmanager.com/api"
    PAGE_SIZE = 100
    MIN_SKILL_CONFIDENCE = 0.9
    MAX_OPPORTUNITY_PAGES = 2
    MAX_PROJECT_PAGES = 5

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        *,
        api_base: str | None = None,
        username: str | None = None,
        password: str | None = None,
        user_token: str | None = None,
        client_token: str | None = None,
        client_key: str | None = None,
    ) -> None:
        super().__init__(supabase_url, supabase_key)
        self.api_base = api_base or os.environ.get("BOOND_API_BASE") or self.DEFAULT_API_BASE
        self.username = username or os.environ.get("BOOND_USERNAME")
        self.password = password or os.environ.get("BOOND_PASSWORD")
        self.user_token = user_token or os.environ.get("BOOND_USER_TOKEN")
        self.client_token = client_token or os.environ.get("BOOND_CLIENT_TOKEN")
        self.client_key = client_key or os.environ.get("BOOND_CLIENT_KEY")
        self._extractor: SkillExtractor | None = None
        self._company_names: dict[str, str] = {}

    def _source_name(self) -> str:
        return "boond_crm"

    # ---- Auth -------------------------------------------------------------

    def _auth_headers(self) -> dict[str, str]:
        if self.user_token and self.client_token and self.client_key:
            payload = {
                "userToken": self.user_token,
                "clientToken": self.client_token,
                # 5-minute expiry per request — build fresh on every call.
                "time": int(time.time()),
                "mode": "normal",
            }
            token = jwt.encode(payload, self.client_key, algorithm="HS256")
            return {"X-Jwt-Client-BoondManager": token}
        if self.username and self.password:
            raw = f"{self.username}:{self.password}".encode()
            return {"Authorization": "Basic " + base64.b64encode(raw).decode()}
        raise RuntimeError(
            "No Boond credentials. Set BOOND_USER_TOKEN + BOOND_CLIENT_TOKEN + "
            "BOOND_CLIENT_KEY (JWT) or BOOND_USERNAME + BOOND_PASSWORD (Basic)."
        )

    def _paginate(
        self,
        path: str,
        params: dict[str, Any] | None = None,
        *,
        max_pages: int | None = None,
        on_included: Callable[[list[dict]], None] | None = None,
    ) -> Iterator[dict]:
        page = 1
        params = dict(params or {})
        with httpx.Client(base_url=self.api_base, timeout=30.0) as client:
            while True:
                params.update({"page": page, "maxResults": self.PAGE_SIZE})
                headers = {"Accept": "application/json", **self._auth_headers()}
                r = client.get(path, params=params, headers=headers)
                r.raise_for_status()
                body = r.json()
                data = body.get("data") or []
                if not data:
                    return
                if on_included:
                    on_included(body.get("included") or [])
                yield from data
                total = ((body.get("meta") or {}).get("totals") or {}).get("rows", 0)
                if page * self.PAGE_SIZE >= total:
                    return
                if max_pages is not None and page >= max_pages:
                    return
                page += 1

    # ---- Fetch ------------------------------------------------------------

    def fetch_raw(self) -> dict[str, list[dict]]:
        return {
            "consultants": self._fetch_consultants(),
            "deals": self._fetch_deals(),
            "projects": self._fetch_projects(),
        }

    def _fetch_consultants(self) -> list[dict]:
        # `period` filter is unreliable across tenants — fetch all resources and
        # derive status from the `availability` date attribute below.
        resources = list(self._paginate("/resources", {
            "columns": "lastName,availability,email1",
        }))
        log.info("boond: %d resources", len(resources))
        return resources

    def _fetch_deals(self) -> list[dict]:
        deals = list(self._paginate("/opportunities", {
            "columns": "title,company,state,startDate,duration,turnoverEstimatedExcludingTax",
            "include": "company",
        }, max_pages=self.MAX_OPPORTUNITY_PAGES, on_included=self._absorb_companies))
        log.info("boond: %d opportunities", len(deals))
        return deals

    def _fetch_projects(self) -> list[dict]:
        projects = list(self._paginate("/projects", {
            "columns": "startDate,endDate,reference,company",
            "include": "company",
        }, max_pages=self.MAX_PROJECT_PAGES, on_included=self._absorb_companies))
        log.info("boond: %d projects", len(projects))
        return projects

    def _absorb_companies(self, included: list[dict]) -> None:
        for rec in included:
            if rec.get("type") != "company":
                continue
            name = (rec.get("attributes") or {}).get("name")
            if name:
                self._company_names[str(rec.get("id"))] = name

    # ---- Transform --------------------------------------------------------

    def transform(self, raw_data: Any) -> dict[str, list[dict]]:
        extractor = self._skill_extractor()
        consultants_raw = raw_data.get("consultants", [])
        deals_raw = raw_data.get("deals", [])
        projects_raw = raw_data.get("projects", [])

        consultants = [self._map_consultant(c) for c in consultants_raw]
        consultant_skills: list[dict] = []
        for raw, mapped in zip(consultants_raw, consultants):
            text = (raw.get("attributes") or {}).get("skills") or ""
            for match in extractor.extract(text):
                consultant_skills.append({
                    "external_consultant_id": mapped["external_id"],
                    "skill_id": match["skill_id"],
                    "proficiency": "mid",
                })

        deals = [self._map_deal(d) for d in deals_raw]
        deal_profiles: list[dict] = []
        for raw, mapped in zip(deals_raw, deals):
            attrs = raw.get("attributes") or {}
            text = " ".join(filter(None, [attrs.get("title"), attrs.get("reference")]))
            matches = [m for m in extractor.extract(text) if m["confidence"] >= self.MIN_SKILL_CONFIDENCE]
            for match in matches:
                deal_profiles.append({
                    "external_deal_id": mapped["external_id"],
                    "skill_id": match["skill_id"],
                    "quantity": 1,
                    "seniority": "mid",
                    "notes": text[:250] or None,
                })
            if not matches and text:
                log.info("no skill match on opportunity %s: %r", mapped["external_id"], text)

        projects = [self._map_project(p) for p in projects_raw]

        return {
            "consultants": consultants,
            "consultant_skills": consultant_skills,
            "deals": deals,
            "deal_profiles": deal_profiles,
            "projects": projects,
        }

    def _skill_extractor(self) -> SkillExtractor:
        if self._extractor is None:
            self._extractor = SkillExtractor(self.db)
        return self._extractor

    # ---- Adapters: Boond → internal schema -------------------------------

    def _map_consultant(self, raw: dict) -> dict:
        attrs = raw.get("attributes") or {}
        first = attrs.get("firstName") or ""
        last = attrs.get("lastName") or ""
        name = f"{first} {last}".strip() or f"Resource {raw.get('id')}"
        availability = attrs.get("availability") or None
        # Boond's `availability` is the date the resource becomes free. Null/blank
        # typically means "assigned with no known end date" — treat as on_mission
        # so the dashboard's on-bench KPI isn't inflated by unknowns.
        status = "on_mission"
        if availability:
            try:
                status = (
                    "rolling_off"
                    if date.fromisoformat(availability) > date.today()
                    else "on_bench"
                )
            except ValueError:
                pass
        return {
            "external_id": f"boond:{raw.get('id')}",
            "name": name,
            "current_status": status,
            "available_from": availability,
        }

    def _map_deal(self, raw: dict) -> dict:
        attrs = raw.get("attributes") or {}
        start = attrs.get("startDate")
        if start == "immediate" or start == "":
            start = date.today().isoformat()
        status, probability = self._classify_state(attrs.get("state"))
        return {
            "external_id": f"boond:{raw.get('id')}",
            "title": attrs.get("title") or f"Opportunity {raw.get('id')}",
            "client_name": self._resolve_company(raw, attrs),
            "status": status,
            "expected_start": start,
            "expected_duration_weeks": attrs.get("duration"),
            "probability": probability,
        }

    def _map_project(self, raw: dict) -> dict:
        attrs = raw.get("attributes") or {}
        return {
            "external_id": f"boond:{raw.get('id')}",
            "title": attrs.get("reference") or f"Project {raw.get('id')}",
            "client_name": self._resolve_company(raw, attrs),
            "sector": None,
            "started_at": attrs.get("startDate"),
            "ended_at": attrs.get("endDate"),
        }

    # Boondmanager's opportunity `state` is tenant-configurable, but most tenants
    # keep keywords close to these defaults. Matching is case-insensitive and on
    # substrings so labels in FR/EN/NL all work. First match wins — order matters.
    _STATE_KEYWORDS: tuple[tuple[tuple[str, ...], str, float], ...] = (
        (("won", "gagn"),                        "won",         1.0),
        (("lost", "perd", "cancel", "abandon"),  "lost",        0.0),
        (("negot",),                             "negotiation", 0.7),
        (("propos", "offer", "devis"),           "proposal",    0.5),
        (("qualif", "analy", "lead", "prospect"),"prospect",    0.3),
    )

    def _classify_state(self, state: Any) -> tuple[str, float]:
        if not isinstance(state, str) or not state.strip():
            return ("proposal", 0.5)
        lower = state.lower()
        for needles, status, probability in self._STATE_KEYWORDS:
            if any(n in lower for n in needles):
                return (status, probability)
        return ("proposal", 0.5)

    def _resolve_company(self, raw: dict, attrs: dict) -> str | None:
        # Prefer the name from `?include=company` (cached in _company_names),
        # then the flat column, then the relationship id as last-resort label.
        rel = ((raw.get("relationships") or {}).get("company") or {}).get("data") or {}
        rel_id = str(rel.get("id")) if rel.get("id") is not None else None
        if rel_id and rel_id in self._company_names:
            return self._company_names[rel_id]
        if attrs.get("company"):
            return attrs.get("company")
        return f"Company {rel_id}" if rel_id else None

    # ---- Load -------------------------------------------------------------

    def load(self, data: Any) -> int:  # type: ignore[override]
        loaded = 0
        for c in data.get("consultants", []):
            self.db.table("consultants").upsert(c, on_conflict="external_id").execute()
            loaded += 1
        for d in data.get("deals", []):
            self.db.table("deals").upsert(d, on_conflict="external_id").execute()
            loaded += 1
        for p in data.get("projects", []):
            self.db.table("projects").upsert(p, on_conflict="external_id").execute()

        cs_rows = data.get("consultant_skills", [])
        if cs_rows:
            lookup = self._lookup_ids(
                "consultants", sorted({r["external_consultant_id"] for r in cs_rows})
            )
            for row in cs_rows:
                cid = lookup.get(row["external_consultant_id"])
                if not cid:
                    continue
                self.db.table("consultant_skills").upsert(
                    {"consultant_id": cid, "skill_id": row["skill_id"], "proficiency": row["proficiency"]},
                    on_conflict="consultant_id,skill_id",
                ).execute()

        dp_rows = data.get("deal_profiles", [])
        if dp_rows:
            lookup = self._lookup_ids(
                "deals", sorted({r["external_deal_id"] for r in dp_rows})
            )
            # deal_profiles has no natural key — wipe + reinsert per deal to stay idempotent.
            for deal_id in set(lookup.values()):
                self.db.table("deal_profiles").delete().eq("deal_id", deal_id).execute()
            for row in dp_rows:
                did = lookup.get(row["external_deal_id"])
                if not did:
                    log.warning("skipping deal_profile: unknown Boond deal %s", row["external_deal_id"])
                    continue
                self.db.table("deal_profiles").insert({
                    "deal_id": did,
                    "skill_id": row["skill_id"],
                    "quantity": row["quantity"],
                    "seniority": row["seniority"],
                    "notes": row.get("notes"),
                }).execute()

        return loaded

    def _lookup_ids(self, table: str, external_ids: list[str]) -> dict[str, str]:
        if not external_ids:
            return {}
        rows = (
            self.db.table(table)
            .select("id, external_id")
            .in_("external_id", external_ids)
            .execute()
            .data
            or []
        )
        return {r["external_id"]: r["id"] for r in rows}
