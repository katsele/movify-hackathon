/**
 * Shared constants and helpers for the forecasting engine.
 *
 * The canonical spec lives in docs/forecast-formula.md. Both this module
 * and workers/forecast_constants.py must stay in lockstep — the parity
 * test asserts both engines produce identical numbers.
 */

export const FTE_PER_TENDER = 2.0;
export const FTE_PER_NEWS = 0.5;
export const FTE_PER_TREND = 0.3;
export const FTE_PER_POSTING = 1.0;

export const CONFIDENCE_DIVISOR = 4;
export const CONVERGENCE_BONUS = 0.2;
export const CONFIDENCE_MAX = 1.0;

export const CONVERGENCE_WINDOW_DAYS = 28;
export const SIGNAL_RECENCY_WINDOW_DAYS = 90;

/**
 * Weighted average over active sources. Every estimate must already be
 * in FTE units. Weights represent trust in each source's headcount
 * estimate. Sources with a zero estimate are excluded (no contribution,
 * no denominator share).
 */
export function predictDemand(
  estimates: Record<string, number>,
  weights: Record<string, number>,
): number {
  const activeEntries = Object.entries(estimates).filter(([, value]) => value > 0);
  if (activeEntries.length === 0) return 0;

  const totalWeight = activeEntries.reduce(
    (sum, [source]) => sum + (weights[source] ?? 0),
    0,
  );
  if (totalWeight <= 0) return 0;

  const weightedSum = activeEntries.reduce(
    (sum, [source, value]) => sum + value * (weights[source] ?? 0),
    0,
  );
  return weightedSum / totalWeight;
}

/**
 * Simple, legible confidence formula (see docs/forecast-formula.md §4).
 *
 * `activeSources` is the number of scorers that produced a non-zero estimate.
 * Callers derive this with `countActive(...)` — keeping the helper
 * parameter-small makes the parity test with Python trivial.
 */
export function computeConfidence(
  activeSources: number,
  converging: boolean,
): number {
  const base = Math.min(activeSources / CONFIDENCE_DIVISOR, CONFIDENCE_MAX);
  const bonus = converging ? CONVERGENCE_BONUS : 0;
  return Math.min(base + bonus, CONFIDENCE_MAX);
}

export function countActive(values: number[]): number {
  return values.reduce((total, value) => (value > 0 ? total + 1 : total), 0);
}
