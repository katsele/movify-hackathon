"""Sync connector — upserts ATS_SOURCES (code-as-config) into Supabase.

Unlike the signal connectors, this does no external fetch: it mirrors the
Python list defined in `ats_sources.py` into the `ats_sources` table so the
frontend can query the roster. Idempotent: safe to rerun any time the
Python list changes.
"""
from __future__ import annotations

import logging
from dataclasses import asdict
from typing import Any

from .ats_sources import ATS_SOURCES
from .base import BaseConnector

log = logging.getLogger(__name__)


class AtsSourcesSyncConnector(BaseConnector):
    def _source_name(self) -> str:
        return "ats_sources"

    def fetch_raw(self) -> Any:
        return list(ATS_SOURCES)

    def transform(self, raw_data: Any) -> list[dict]:
        return [asdict(src) for src in raw_data]

    def load(self, rows: list[dict]) -> int:
        loaded = 0
        for row in rows:
            result = self.db.table("ats_sources").upsert(row, on_conflict="client_key").execute()
            if result.data:
                loaded += 1
        return loaded
