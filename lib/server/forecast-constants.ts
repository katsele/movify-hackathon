/**
 * Shared forecast calibration — keep in sync with workers/connectors/forecast_constants.py
 */

import type { ForecastFactorKey } from "@/lib/types";

/** Raw Σ(confidence × decay) scaled to headcount-equivalent FTE. */
export const FTE_PER_TENDER = 2.0;
export const FTE_PER_NEWS = 0.5;
export const FTE_PER_TREND = 0.3;
export const FTE_PER_POSTING = 1.0;

export const CONFIDENCE_DIVISOR = 4;
export const CONVERGENCE_BONUS = 0.2;

export function predictDemand(
  estimates: Record<ForecastFactorKey, number>,
  weights: Record<ForecastFactorKey, number>,
): number {
  const active = Object.entries(estimates).filter(([, v]) => v > 0) as Array<
    [ForecastFactorKey, number]
  >;
  if (!active.length) return 0;
  const totalWeight = active.reduce((sum, [k]) => sum + weights[k], 0);
  if (totalWeight <= 0) return 0;
  return (
    active.reduce((sum, [k, v]) => sum + v * weights[k], 0) / totalWeight
  );
}

export function computeConfidence(
  activeFactorCount: number,
  converging: boolean,
): number {
  const base = Math.min(activeFactorCount / CONFIDENCE_DIVISOR, 1);
  return Math.min(base + (converging ? CONVERGENCE_BONUS : 0), 1);
}
