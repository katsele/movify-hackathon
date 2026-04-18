"""Shared forecast calibration — keep in sync with lib/server/forecast-constants.ts."""

from __future__ import annotations

from typing import Mapping

# External signals: raw score is Σ(confidence × decay); scale to headcount-equivalent FTE.
FTE_PER_TENDER = 2.0
FTE_PER_NEWS = 0.5
FTE_PER_TREND = 0.3
FTE_PER_POSTING = 1.0

CONFIDENCE_DIVISOR = 4
CONVERGENCE_BONUS = 0.2


def predict_demand(
    estimates: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    """Trust-weighted average over factors with a positive estimate."""
    active = {k: float(v) for k, v in estimates.items() if float(v) > 0}
    if not active:
        return 0.0
    total_weight = sum(weights[k] for k in active)
    if total_weight <= 0:
        return 0.0
    return sum(active[k] * weights[k] for k in active) / total_weight


def compute_confidence(active_factor_count: int, converging: bool) -> float:
    """Match lib/server/forecast-engine.ts generateAndPersistForecasts."""
    base = min(active_factor_count / CONFIDENCE_DIVISOR, 1.0)
    return min(base + (CONVERGENCE_BONUS if converging else 0.0), 1.0)
