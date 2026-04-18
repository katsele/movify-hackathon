"""Boond CSV connector — loads from mockdata/ when the live API is sandboxed.

Reads four CSVs:

- mock-boond-bench-data.csv     current consultants on/near the bench
- mock-boond-project-data.csv   current active projects (and their assignees)
- mock-boond-bench-history.csv  historical bench spells (storage-only)
- mock-boond-project-history.csv historical completed projects

Writes to consultants, consultant_skills, projects, project_skills and the
consultant_bench_history / consultant_bench_history_skills tables (added in
migration 008). Deal/pipeline data is not present in the CSVs.
"""
from __future__ import annotations

import csv
import logging
import os
import re
import unicodedata
from collections import Counter
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
    BENCH_HISTORY_FILE = "mock-boond-bench-history.csv"
    PROJECT_HISTORY_FILE = "mock-boond-project-history.csv"
    ID_PREFIX = "boond_csv"

    REPLACE_SCOPES = ("none", "source", "all_boond")

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
        replace_scope: str = "none",
    ) -> None:
        super().__init__(supabase_url, supabase_key)
        resolved = csv_dir or os.environ.get("BOOND_CSV_DIR") or (PROJECT_ROOT / "mockdata")
        self.csv_dir = Path(resolved)
        if replace_scope not in self.REPLACE_SCOPES:
            raise ValueError(
                f"replace_scope must be one of {self.REPLACE_SCOPES}, got {replace_scope!r}"
            )
        self.replace_scope = replace_scope
        self._extractor: SkillExtractor | None = None
        self._skill_index: dict[str, str] | None = None
        self._unmatched_tokens: Counter[str] = Counter()

    def _source_name(self) -> str:
        return "boond_csv"

    # ---- Fetch ------------------------------------------------------------

    def fetch_raw(self) -> dict[str, list[dict]]:
        bench = self._read_csv(self.csv_dir / self.BENCH_FILE)
        projects = self._read_csv(self.csv_dir / self.PROJECT_FILE)
        project_history = self._read_csv(self.csv_dir / self.PROJECT_HISTORY_FILE)
        bench_history = self._read_csv(self.csv_dir / self.BENCH_HISTORY_FILE)
        log.info(
            "boond_csv: %d bench rows, %d project rows, %d project-history rows, %d bench-history rows",
            len(bench),
            len(projects),
            len(project_history),
            len(bench_history),
        )
        return {
            "bench": bench,
            "projects": projects,
            "project_history": project_history,
            "bench_history": bench_history,
        }

    @staticmethod
    def _read_csv(path: Path) -> list[dict]:
        if not path.exists():
            log.warning("boond_csv: %s not found, skipping", path)
            return []
        with path.open("r", encoding="utf-8-sig", newline="") as f:
            reader = csv.DictReader(f, delimiter=";")
            return [dict(row) for row in reader]

    # ---- Transform --------------------------------------------------------

    def transform(self, raw_data: Any) -> dict[str, list[dict]]:
        bench_rows = raw_data.get("bench", [])
        project_rows = raw_data.get("projects", [])
        project_history_rows = raw_data.get("project_history", [])
        bench_history_rows = raw_data.get("bench_history", [])

        bench_consultants = [self._map_bench_consultant(r) for r in bench_rows]
        consultant_skills = self._bench_consultant_skills(bench_rows, bench_consultants)

        current_projects = [self._map_project(r, source_kind="current") for r in project_rows]
        historical_projects = [
            self._map_project(r, source_kind="history") for r in project_history_rows
        ]
        projects = current_projects + historical_projects
        on_mission = self._on_mission_consultants(project_rows)

        project_skills = self._project_skills(project_rows, current_projects)
        project_skills += self._project_skills(project_history_rows, historical_projects)

        bench_history = [self._map_bench_history(r) for r in bench_history_rows]
        bench_history_skills = self._bench_history_skills(bench_history_rows, bench_history)

        if self._unmatched_tokens:
            top = ", ".join(f"{tok} ({n})" for tok, n in self._unmatched_tokens.most_common(10))
            log.info(
                "boond_csv: %d skill tokens not in taxonomy (top: %s)",
                sum(self._unmatched_tokens.values()),
                top,
            )

        return {
            "consultants": bench_consultants + on_mission,
            "consultant_skills": consultant_skills,
            "projects": projects,
            "project_skills": project_skills,
            "bench_history": bench_history,
            "bench_history_skills": bench_history_skills,
        }

    # ---- Mappers ----------------------------------------------------------

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
        out: list[dict] = []
        for row, mapped in zip(rows, consultants):
            seniority_raw = (row.get("Seniority") or "").strip().lower()
            proficiency = self._SENIORITY_MAP.get(seniority_raw, "mid")
            tokens = _parse_token_list(row.get("Primary Skills"))
            for skill_id in self._match_skill_ids(tokens):
                out.append({
                    "external_consultant_id": mapped["external_id"],
                    "skill_id": skill_id,
                    "proficiency": proficiency,
                })
        return out

    def _map_project(self, row: dict, *, source_kind: str) -> dict:
        ref = (row.get("Internal reference") or "").strip()
        title = (row.get("Opportunity - Title") or "").strip() or f"Project {ref}"
        client = (row.get("Company - Name") or "").strip() or None
        sector = (row.get("Company - Sector activity") or "").strip() or None
        state = (row.get("State") or "").strip() or None
        project_type = (row.get("Type") or "").strip() or None
        top_tokens = _parse_token_list(row.get("Top Skills"))
        return {
            "external_id": f"{self.ID_PREFIX}:{ref}",
            "title": title,
            "client_name": client,
            "sector": sector,
            "started_at": _parse_date(row.get("Start")),
            "ended_at": _parse_date(row.get("End")),
            "source_kind": source_kind,
            "project_state": state,
            "project_type": project_type,
            "top_skill_tokens": top_tokens,
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
            tokens = _parse_token_list(row.get("Top Skills"))
            skill_ids = self._match_skill_ids(tokens)
            if not skill_ids:
                # Fall back to title-based extraction when Top Skills is empty
                # or entirely untaxonomised.
                title = row.get("Opportunity - Title") or ""
                skill_ids = [m["skill_id"] for m in extractor.extract(title)]
            seen: set[str] = set()
            for skill_id in skill_ids:
                if skill_id in seen:
                    continue
                seen.add(skill_id)
                out.append({
                    "external_project_id": mapped["external_id"],
                    "skill_id": skill_id,
                    "headcount": 1,
                })
        return out

    def _map_bench_history(self, row: dict) -> dict:
        ref = (row.get("Internal reference") or "").strip()
        first = (row.get("First Name") or "").strip()
        last = (row.get("Last Name") or "").strip()
        name = f"{first} {last}".strip() or f"Consultant {ref}"
        duration_raw = (row.get("Duration (days)") or "").strip()
        try:
            duration = int(duration_raw) if duration_raw else None
        except ValueError:
            duration = None
        return {
            "external_id": f"{self.ID_PREFIX}:history:{ref}",
            "consultant_name": name,
            "consultant_slug": _slugify(name),
            "job_title": (row.get("Job Title") or "").strip() or None,
            "seniority": (row.get("Seniority") or "").strip() or None,
            "bench_started_at": _parse_date(row.get("Bench Start")),
            "bench_ended_at": _parse_date(row.get("Bench End")),
            "duration_days": duration,
            "previous_client_name": (row.get("Previous Client") or "").strip() or None,
            "previous_project_title": (row.get("Previous Project") or "").strip() or None,
            "previous_project_ended_at": _parse_date(row.get("Previous Project End")),
            "next_client_name": (row.get("Next Client") or "").strip() or None,
            "next_project_title": (row.get("Next Project") or "").strip() or None,
            "next_project_started_at": _parse_date(row.get("Next Project Start")),
            "outcome": (row.get("Outcome") or "").strip() or None,
            "primary_skill_tokens": _parse_token_list(row.get("Primary Skills")),
            "agency": (row.get("Agency") or "").strip() or None,
            "country": (row.get("Country") or "").strip() or None,
        }

    def _bench_history_skills(
        self, rows: list[dict], history: list[dict]
    ) -> list[dict]:
        out: list[dict] = []
        for row, mapped in zip(rows, history):
            seniority_raw = (row.get("Seniority") or "").strip().lower()
            proficiency = self._SENIORITY_MAP.get(seniority_raw, "mid")
            tokens = _parse_token_list(row.get("Primary Skills"))
            for skill_id in self._match_skill_ids(tokens):
                out.append({
                    "external_history_id": mapped["external_id"],
                    "skill_id": skill_id,
                    "proficiency": proficiency,
                })
        return out

    # ---- Taxonomy helpers -------------------------------------------------

    def _match_skill_ids(self, tokens: list[str]) -> list[str]:
        index = self._build_skill_index()
        seen: set[str] = set()
        ids: list[str] = []
        for token in tokens:
            skill_id = index.get(token.lower())
            if not skill_id:
                self._unmatched_tokens[token] += 1
                continue
            if skill_id in seen:
                continue
            seen.add(skill_id)
            ids.append(skill_id)
        return ids

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

    # ---- Purge ------------------------------------------------------------

    def purge(self) -> None:
        """Delete existing Boond-derived rows according to replace_scope.

        - 'none':        no deletes (default — preserves prior behaviour)
        - 'source':      only rows written by this connector (boond_csv:%)
        - 'all_boond':   both boond:% and boond_csv:% rows, plus the Story 1
                         seed consultant, plus a wipe of consultant_bench_history
        """
        if self.replace_scope == "none":
            return

        scopes: list[str]
        if self.replace_scope == "source":
            scopes = [f"{self.ID_PREFIX}:%"]
        else:  # all_boond
            scopes = [f"{self.ID_PREFIX}:%", "boond:%"]

        log.info("boond_csv: purging scopes %s", scopes)

        for pattern in scopes:
            # Clear deal_profiles before deals (FK).
            deal_ids = [
                row["id"]
                for row in (
                    self.db.table("deals")
                    .select("id")
                    .like("external_id", pattern)
                    .execute()
                    .data
                    or []
                )
            ]
            if deal_ids:
                self.db.table("deal_profiles").delete().in_("deal_id", deal_ids).execute()
                self.db.table("deals").delete().in_("id", deal_ids).execute()

            # consultant_skills and project_skills cascade on delete.
            self.db.table("consultants").delete().like("external_id", pattern).execute()
            self.db.table("projects").delete().like("external_id", pattern).execute()

        if self.replace_scope == "all_boond":
            # Full history wipe; bench_history_skills cascades.
            self.db.table("consultant_bench_history").delete().neq(
                "id", "00000000-0000-0000-0000-000000000000"
            ).execute()
            # Drop the Story 1 seed consultant so the bench reflects only
            # real/mock Boond data after the refresh.
            self.db.table("consultants").delete().eq(
                "external_id", "seed-story1-c1"
            ).execute()

    # ---- Load -------------------------------------------------------------

    def load(self, data: Any) -> int:  # type: ignore[override]
        self.purge()

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

        bh_rows = data.get("bench_history", [])
        for row in bh_rows:
            self.db.table("consultant_bench_history").upsert(
                row, on_conflict="external_id"
            ).execute()
            loaded += 1

        bhs_rows = data.get("bench_history_skills", [])
        if bhs_rows:
            lookup = self._lookup_ids(
                "consultant_bench_history",
                sorted({r["external_history_id"] for r in bhs_rows}),
            )
            for history_id in set(lookup.values()):
                self.db.table("consultant_bench_history_skills").delete().eq(
                    "bench_history_id", history_id
                ).execute()
            for row in bhs_rows:
                hid = lookup.get(row["external_history_id"])
                if not hid:
                    continue
                self.db.table("consultant_bench_history_skills").insert({
                    "bench_history_id": hid,
                    "skill_id": row["skill_id"],
                    "proficiency": row["proficiency"],
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


def _parse_token_list(raw: Any) -> list[str]:
    if not raw:
        return []
    tokens: list[str] = []
    seen: set[str] = set()
    for token in str(raw).split(","):
        cleaned = token.strip()
        if not cleaned:
            continue
        key = cleaned.lower()
        if key in seen:
            continue
        seen.add(key)
        tokens.append(cleaned)
    return tokens


def _slugify(value: str) -> str:
    normalised = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", normalised.lower()).strip("-")
