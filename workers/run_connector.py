"""CLI entry point: `python run_connector.py <source>`."""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from connectors.boond import BoondConnector
from connectors.google_trends import GoogleTrendsConnector
from connectors.ted_procurement import TEDProcurementConnector

CONNECTORS = {
    "boond": BoondConnector,
    "ted_procurement": TEDProcurementConnector,
    "google_trends": GoogleTrendsConnector,
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _load_env() -> None:
    for filename in (".env.local", ".env"):
        path = PROJECT_ROOT / filename
        if path.exists():
            load_dotenv(path, override=False)
    load_dotenv(override=False)


def main() -> int:
    _load_env()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    if len(sys.argv) < 2:
        print("usage: python run_connector.py <source>")
        print(f"sources: {', '.join(CONNECTORS)}")
        return 1

    source = sys.argv[1]
    if source not in CONNECTORS:
        print(f"unknown source: {source}")
        return 1

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in environment")
        return 1

    connector = CONNECTORS[source](supabase_url=supabase_url, supabase_key=supabase_key)
    count = connector.run()
    print(f"loaded {count} records from {source}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
