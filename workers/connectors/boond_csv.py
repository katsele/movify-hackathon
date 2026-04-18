"""Boond CSV connector — loads from mockdata/ when the live API is sandboxed.

Writes to the same internal tables as BoondConnector (consultants,
consultant_skills, projects, project_skills) via CSV-aware transforms.
No deal/pipeline data in the CSVs, so `deals` + `deal_profiles` are untouched.
"""
from __future__ import annotations

import csv
import logging
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any

from .base import BaseConnector
from .skill_extractor import SkillExtractor

log = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent


class BoondCsvConnector(BaseConnector):
    BENCH_FILE = "mock-boond-bench-data.csv"
    PROJECT_FILE = "mock-boond-project-data.csv"
    ID_PREFIX = "boond_csv"

    _STATUS_MAP = {
        "available": "on_bench",
        "ramping down": "rolling_off",
    }
    _SENIORITY_MAP = {
        "junior": "junior",
        "medior": "mid",
        "mid": "mid",
        "senior": "senior",
        "expert": "expert",
    }

    def __init__(
        self,
        supabase_url: str,
        supabase_key: str,
        *,
        csv_dir: Path | str | None = None,
    ) -> None:
        super().__init__(supabase_url, supabase_key)
        resolved = csv_dir or os.environ.get("BOOND_CSV_DIR") or (PROJECT_ROOT / "mockdata")
        self.csv_dir = Path(resolved)
        self._extractor: SkillExtractor | None = None
        self._skill_index: dict[str, str] | None = None

    def _source_name(self) -> str:
        return "boond_csv"

    # ---- Fetch ------------------------------------------------------------

    def fetch_raw(self) -> dict[str, list[dict]]:
        bench = self._read_csv(self.csv_dir / self.BENCH_FILE)
        projects = self._read_csv(self.csv_dir / self.PROJECT_FILE)
        log.info("boond_csv: %d bench rows, %d project rows", len(bench), len(projects))
        return {"bench": bench, "projects": projects}

    @staticmethod
    def _read_csv(path: Path) -> list[dict]:
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f, delimiter=";")
            return [dict(row) for row in reader]

    # ---- Transform --------------------------------------------------------

    def transform(self, raw_data: Any) -> dict[str, list[dict]]:
        bench_rows = raw_data.get("bench", [])
        project_rows = raw_data.get("projects", [])

        bench_consultants = [self._map_bench_consultant(r) for r in bench_rows]
        consultant_skills = self._bench_consultant_skills(bench_rows, bench_consultants)

        projects = [self._map_project(r) for r in project_rows]
        on_mission = self._on_mission_consultants(project_rows)
        project_skills = self._project_skills(project_rows, projects)

        return {
            "consultants": bench_consultants + on_mission,
            "consultant_skills": consultant_skills,
            "projects": projects,
            "project_skills": project_skills,
        }

    def _map_bench_consultant(self, row: dict) -> dict:
        status_raw = (row.get("Status") or "").strip().lower()
        status = self._STATUS_MAP.get(status_raw, "on_bench")
        first = (row.get("First Name") or "").strip()
        last = (row.get("Last Name") or "").strip()
        ref = (row.get("Internal reference") or "").strip()
        return {
            "external_id": f"{self.ID_PREFIX}:{ref}",
            "name": f"{first} {last}".strip() or f"Consultant {ref}",
            "current_status": status,
            "available_from": _parse_date(row.get("Available From")),
        }

    def _bench_consultant_skills(
        self, rows: list[dict], consultants: list[dict]
    ) -> list[dict]:
        index = self._build_skill_index()
        out: list[dict] = []
        misses: list[str] = []
        for row, mapped in zip(rows, consultants):
            seniority_raw = (row.get("Seniority") or "").strip().lower()
            proficiency = self._SENIORITY_MAP.get(seniority_raw, "mid")
            raw_skills = row.get("Primary Skills") or ""
            seen: set[str] = set()
            for token in (s.strip() for s in raw_skills.split(",")):
                if not token:
                    continue
                skill_id = index.get(token.lower())
                if not skill_id:
                    misses.append(token)
                    continue
                if skill_id in seen:
                    continue
                seen.add(skill_id)
                out.append({
                    "external_consultant_id": mapped["external_id"],
                    "skill_id": skill_id,
                    "proficiency": proficiency,
                })
        if misses:
            log.info(
                "boond_csv: %d Primary Skills tokens not in taxonomy (e.g. %s)",
                len(misses),
                ", ".join(sorted(set(misses))[:10]),
            )
        return out

    def _map_project(self, row: dict) -> dict:
        ref = (row.get("Internal reference") or "").strip()
        title = (row.get("Opportunity - Title") or "").strip() or f"Project {ref}"
        client = (row.get("Company - Name") or "").strip() or None
        sector = (row.get("Company - Sector activity") or "").strip() or None
        return {
            "external_id": f"{self.ID_PREFIX}:{ref}",
            "title": title,
            "client_name": client,
            "sector": sector,
            "started_at": _parse_date(row.get("Start")),
            "ended_at": _parse_date(row.get("End")),
        }

    def _on_mission_consultants(self, rows: list[dict]) -> list[dict]:
        # A person can appear on multiple projects — keep the latest end date
        # as their available_from so the bench page shows when they roll off.
        latest: dict[str, dict] = {}
        for row in rows:
            first = (row.get("Consultant - First Name") or "").strip()
            last = (row.get("Consultant - Last Name") or "").strip()
            if not first and not last:
                continue
            name = f"{first} {last}".strip()
            slug = _slugify(name)
            if not slug:
                continue
            external_id = f"{self.ID_PREFIX}:assignee:{slug}"
            end_iso = _parse_date(row.get("End"))
            existing = latest.get(external_id)
            if existing is None:
                latest[external_id] = {
                    "external_id": external_id,
                    "name": name,
                    "current_status": "on_mission",
                    "available_from": end_iso,
                }
                continue
            if end_iso and (not existing["available_from"] or end_iso > existing["available_from"]):
                existing["available_from"] = end_iso
        return list(latest.values())

    def _project_skills(self, rows: list[dict], projects: list[dict]) -> list[dict]:
        extractor = self._skill_extractor()
        out: list[dict] = []
        for row, mapped in zip(rows, projects):
            title = row.get("Opportunity - Title") or ""
            for match in extractor.extract(title):
                out.append({
                    "external_project_id": mapped["external_id"],
                    "skill_id": match["skill_id"],
                    "headcount": 1,
                })
        return out

    def _skill_extractor(self) -> SkillExtractor:
        if self._extractor is None:
            self._extractor = SkillExtractor(self.db)
        return self._extractor

    def _build_skill_index(self) -> dict[str, str]:
        if self._skill_index is None:
            rows = self.db.table("skills").select("id, name, aliases").execute().data or []
            idx: dict[str, str] = {}
            for row in rows:
                terms = [row["name"]] + (row.get("aliases") or [])
                for term in terms:
                    if term:
                        idx.setdefault(term.lower(), row["id"])
            self._skill_index = idx
        return self._skill_index

    # ---- Load -------------------------------------------------------------

    def load(self, data: Any) -> int:  # type: ignore[override]
        loaded = 0
        for c in data.get("consultants", []):
            self.db.table("consultants").upsert(c, on_conflict="external_id").execute()
            loaded += 1
        for p in data.get("projects", []):
            self.db.table("projects").upsert(p, on_conflict="external_id").execute()
            loaded += 1

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
                    {
                        "consultant_id": cid,
                        "skill_id": row["skill_id"],
                        "proficiency": row["proficiency"],
                    },
                    on_conflict="consultant_id,skill_id",
                ).execute()

        ps_rows = data.get("project_skills", [])
        if ps_rows:
            lookup = self._lookup_ids(
                "projects", sorted({r["external_project_id"] for r in ps_rows})
            )
            # project_skills has composite PK but no update-on-conflict semantic
            # we need; wipe and reinsert per project to stay idempotent (mirrors
            # BoondConnector.load's deal_profiles handling).
            for project_id in set(lookup.values()):
                self.db.table("project_skills").delete().eq("project_id", project_id).execute()
            for row in ps_rows:
                pid = lookup.get(row["external_project_id"])
                if not pid:
                    continue
                self.db.table("project_skills").insert({
                    "project_id": pid,
                    "skill_id": row["skill_id"],
                    "headcount": row["headcount"],
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


def _parse_date(raw: Any) -> str | None:
    if raw is None:
        return None
    value = str(raw).strip()
    if not value:
        return None
    try:
        return datetime.strptime(value, "%d/%m/%Y").date().isoformat()
    except ValueError:
        log.warning("boond_csv: unparseable date %r", value)
        return None


def _slugify(value: str) -> str:
    normalised = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalised.lower()).strip("-")
