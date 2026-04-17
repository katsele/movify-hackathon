"""Abstract base connector — every source writes through this contract."""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any

from supabase import Client, create_client

log = logging.getLogger(__name__)


class BaseConnector(ABC):
    """All connectors follow this contract.

    fetch_raw  -> raw payload from the external source
    transform  -> list of signal/entity dicts matching our schema
    load       -> write to Supabase (default: upsert into `signals` + `signal_skills`)
    run        -> the full ETL cycle; returns the number of records loaded
    """

    def __init__(self, supabase_url: str, supabase_key: str) -> None:
        self.db: Client = create_client(supabase_url, supabase_key)
        self.source_name = self._source_name()

    @abstractmethod
    def _source_name(self) -> str:
        """Short source identifier, e.g. 'ted_procurement'."""

    @abstractmethod
    def fetch_raw(self) -> Any:
        """Fetch raw data from the external source."""

    @abstractmethod
    def transform(self, raw_data: Any) -> list[dict]:
        """Transform raw data into signal records ready to load."""

    def load(self, signals: list[dict]) -> int:
        """Write signals to Supabase. Override for non-signal connectors."""
        loaded = 0
        for signal in signals:
            extracted = signal.pop("extracted_skills", [])
            result = self.db.table("signals").upsert(signal).execute()
            if not result.data:
                continue
            signal_id = result.data[0]["id"]
            for match in extracted:
                self.db.table("signal_skills").upsert(
                    {
                        "signal_id": signal_id,
                        "skill_id": match["skill_id"],
                        "confidence": match.get("confidence", 0.5),
                    }
                ).execute()
            loaded += 1
        return loaded

    def run(self) -> int:
        log.info("running %s", self.source_name)
        raw = self.fetch_raw()
        signals = self.transform(raw)
        count = self.load(signals)
        log.info("%s: loaded %d records", self.source_name, count)
        return count
