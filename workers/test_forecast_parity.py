"""
Parity checks for forecast math shared between Python and TypeScript.
Run from repo root: python workers/test_forecast_parity.py
Or from workers/: python test_forecast_parity.py
"""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

# Ensure `workers/` is on path when run from repo root
_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from forecast_constants import (  # noqa: E402
    CONFIDENCE_DIVISOR,
    CONVERGENCE_BONUS,
    FTE_PER_NEWS,
    FTE_PER_POSTING,
    FTE_PER_TENDER,
    FTE_PER_TREND,
    compute_confidence,
    predict_demand,
)


DEFAULT_WEIGHTS = {
    "crm_pipeline": 0.35,
    "procurement_notice": 0.25,
    "historical_pattern": 0.15,
    "news_event": 0.05,
    "trend_spike": 0.10,
    "job_posting": 0.10,
}


class TestForecastParity(unittest.TestCase):
    def test_predict_demand_single_crm(self) -> None:
        """One active factor → full estimate (no partition shrinkage)."""
        est = {
            "crm_pipeline": 1.5,
            "procurement_notice": 0.0,
            "historical_pattern": 0.0,
            "news_event": 0.0,
            "trend_spike": 0.0,
            "job_posting": 0.0,
        }
        d = predict_demand(est, DEFAULT_WEIGHTS)
        self.assertAlmostEqual(d, 1.5, places=6)

    def test_predict_demand_procurement_only(self) -> None:
        raw_sig = 0.85  # confidence × decay
        proc = raw_sig * FTE_PER_TENDER
        est = {
            "crm_pipeline": 0.0,
            "procurement_notice": proc,
            "historical_pattern": 0.0,
            "news_event": 0.0,
            "trend_spike": 0.0,
            "job_posting": 0.0,
        }
        d = predict_demand(est, DEFAULT_WEIGHTS)
        self.assertAlmostEqual(d, proc, places=6)

    def test_predict_demand_crm_plus_procurement(self) -> None:
        """Weighted average over two active sources."""
        crm = 1.5
        proc = 0.85 * FTE_PER_TENDER
        est = {
            "crm_pipeline": crm,
            "procurement_notice": proc,
            "historical_pattern": 0.0,
            "news_event": 0.0,
            "trend_spike": 0.0,
            "job_posting": 0.0,
        }
        d = predict_demand(est, DEFAULT_WEIGHTS)
        w_crm = DEFAULT_WEIGHTS["crm_pipeline"]
        w_p = DEFAULT_WEIGHTS["procurement_notice"]
        expected = (crm * w_crm + proc * w_p) / (w_crm + w_p)
        self.assertAlmostEqual(d, expected, places=6)

    def test_fte_multipliers_match_ts(self) -> None:
        self.assertEqual(FTE_PER_TENDER, 2.0)
        self.assertEqual(FTE_PER_NEWS, 0.5)
        self.assertEqual(FTE_PER_TREND, 0.3)
        self.assertEqual(FTE_PER_POSTING, 1.0)

    def test_compute_confidence_matches_ts(self) -> None:
        """Same formula as lib/server/forecast-engine.ts + computeConfidence."""
        self.assertAlmostEqual(
            compute_confidence(2, False),
            min(2 / CONFIDENCE_DIVISOR, 1.0),
        )
        self.assertAlmostEqual(
            compute_confidence(4, False),
            1.0,
        )
        self.assertAlmostEqual(
            compute_confidence(2, True),
            min(2 / CONFIDENCE_DIVISOR + CONVERGENCE_BONUS, 1.0),
        )


if __name__ == "__main__":
    unittest.main()
