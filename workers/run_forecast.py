"""CLI entry point: `python run_forecast.py`."""
from __future__ import annotations

import logging
import os
import sys

from dotenv import load_dotenv

from forecast_engine import ForecastEngine


def main() -> int:
    load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    supabase_url = os.environ["SUPABASE_URL"]
    supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    engine = ForecastEngine(supabase_url=supabase_url, supabase_key=supabase_key)
    written = engine.run(weeks_ahead=12)
    print(f"forecast engine wrote {written} forecast rows")
    return 0


if __name__ == "__main__":
    sys.exit(main())
