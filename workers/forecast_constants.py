"""Shared constants and helpers for the forecasting engine.

The canonical spec lives in `docs/forecast-formula.md`. Both this module
and `lib/server/forecast-constants.ts` must stay in lockstep — the
parity test asserts both engines produce identical numbers.
"""
from __future__ import annotations

from typing import Iterable, Mapping

# FTE multipliers ------------------------------------------------------------
# Convert per-source signal scores (confidence × decay) into headcount-
# equivalent estimates. Calibrated against docs/research/per-source-heuristics.md
FTE_PER_TENDER = 2.0
FTE_PER_NEWS = 0.5
FTE_PER_TREND = 0.3
FTE_PER_POSTING = 1.0

# Confidence math ------------------------------------------------------------
CONFIDENCE_DIVISOR = 4
CONVERGENCE_BONUS = 0.2
CONFIDENCE_MAX = 1.0

# Windows --------------------------------------------------------------------
CONVERGENCE_WINDOW_DAYS = 28
SIGNAL_RECENCY_WINDOW_DAYS = 90


def predict_demand(
    estimates: Mapping[str, float],
    weights: Mapping[str, float],
) -> float:
    """Weighted average over active sources.

    Every estimate must already be in FTE units. Weights represent trust
    in each source's headcount estimate. Sources with a zero estimate
    are excluded (no contribution, no denominator share).
    """
    active = {
        source: value for source, value in estimates.items() if value > 0
    }
    if not active:
        return 0.0

    total_weight = sum(weights.get(source, 0.0) for source in active)
    if total_weight <= 0:
        return 0.0

    weighted_sum = sum(active[source] * weights.get(source, 0.0) for source in active)
    return weighted_sum / total_weight


def compute_confidence(active_sources: int, converging: bool) -> float:
    """Simple, legible confidence formula (see docs/forecast-formula.md §4).

    ``active_sources`` is the number of scorers that produced a non-zero
    estimate. The caller derives this with :func:`count_active` (or a local
    equivalent) — keeping the helper parameter-small mirrors the TS signature
    and makes the parity test trivial.
    """
    base = min(active_sources / CONFIDENCE_DIVISOR, CONFIDENCE_MAX)
    bonus = CONVERGENCE_BONUS if converging else 0.0
    return min(base + bonus, CONFIDENCE_MAX)


def count_active(values: Iterable[float]) -> int:
    return sum(1 for value in values if value > 0)
