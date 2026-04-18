"""CLI entry point: `python run_connector.py <source> [options]`."""
from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from connectors.ats_sources_sync import AtsSourcesSyncConnector
from connectors.boond import BoondConnector
from connectors.boond_csv import BoondCsvConnector
from connectors.google_trends import GoogleTrendsConnector
from connectors.news_intelligence import NewsIntelligenceConnector
from connectors.ted_procurement import TEDProcurementConnector

CONNECTORS = {
    "boond": BoondConnector,
    "boond_csv": BoondCsvConnector,
    "ted_procurement": TEDProcurementConnector,
    "google_trends": GoogleTrendsConnector,
    "news_intelligence": NewsIntelligenceConnector,
    "ats_sources": AtsSourcesSyncConnector,
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _load_env() -> None:
    for filename in (".env.local", ".env"):
        path = PROJECT_ROOT / filename
        if path.exists():
            load_dotenv(path, override=False)
    load_dotenv(override=False)


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="run_connector.py",
        description="Run a single data connector.",
    )
    parser.add_argument("source", choices=sorted(CONNECTORS.keys()))
    parser.add_argument(
        "--replace-scope",
        choices=BoondCsvConnector.REPLACE_SCOPES,
        default="none",
        help=(
            "Only supported by boond_csv. "
            "'none' upserts only (default); "
            "'source' purges prior boond_csv:%% rows before load; "
            "'all_boond' also purges boond:%% rows, wipes consultant_bench_history, "
            "and removes the Story 1 seed consultant so Supabase reflects only "
            "the checked-in mockdata."
        ),
    )
    return parser.parse_args(argv)


def main() -> int:
    _load_env()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    args = _parse_args(sys.argv[1:])
    source = args.source

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in environment")
        return 1

    connector_cls = CONNECTORS[source]
    kwargs: dict = {}
    if source == "boond_csv":
        kwargs["replace_scope"] = args.replace_scope
    elif args.replace_scope != "none":
        print(f"--replace-scope is only supported for boond_csv, not {source}")
        return 1

    connector = connector_cls(supabase_url=supabase_url, supabase_key=supabase_key, **kwargs)
    count = connector.run()
    print(f"loaded {count} records from {source}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
