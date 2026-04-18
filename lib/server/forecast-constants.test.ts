import { describe, expect, it } from "vitest";
import type { ForecastFactorKey } from "@/lib/types";
import {
  computeConfidence,
  CONFIDENCE_DIVISOR,
  CONVERGENCE_BONUS,
  FTE_PER_NEWS,
  FTE_PER_POSTING,
  FTE_PER_TENDER,
  FTE_PER_TREND,
  predictDemand,
} from "@/lib/server/forecast-constants";

const DEFAULT_WEIGHTS: Record<ForecastFactorKey, number> = {
  crm_pipeline: 0.35,
  procurement_notice: 0.25,
  historical_pattern: 0.15,
  news_event: 0.05,
  trend_spike: 0.1,
  job_posting: 0.1,
};

describe("forecast-constants parity with workers/connectors/forecast_constants.py", () => {
  it("FTE multipliers match Python", () => {
    expect(FTE_PER_TENDER).toBe(2.0);
    expect(FTE_PER_NEWS).toBe(0.5);
    expect(FTE_PER_TREND).toBe(0.3);
    expect(FTE_PER_POSTING).toBe(1.0);
  });

  it("predictDemand: single CRM factor returns full estimate", () => {
    const est: Record<ForecastFactorKey, number> = {
      crm_pipeline: 1.5,
      procurement_notice: 0,
      historical_pattern: 0,
      news_event: 0,
      trend_spike: 0,
      job_posting: 0,
    };
    expect(predictDemand(est, DEFAULT_WEIGHTS)).toBeCloseTo(1.5, 6);
  });

  it("predictDemand: CRM + procurement weighted average", () => {
    const crm = 1.5;
    const proc = 0.85 * FTE_PER_TENDER;
    const est: Record<ForecastFactorKey, number> = {
      crm_pipeline: crm,
      procurement_notice: proc,
      historical_pattern: 0,
      news_event: 0,
      trend_spike: 0,
      job_posting: 0,
    };
    const wCrm = DEFAULT_WEIGHTS.crm_pipeline;
    const wP = DEFAULT_WEIGHTS.procurement_notice;
    const expected = (crm * wCrm + proc * wP) / (wCrm + wP);
    expect(predictDemand(est, DEFAULT_WEIGHTS)).toBeCloseTo(expected, 6);
  });

  it("computeConfidence matches Python compute_confidence", () => {
    expect(computeConfidence(2, false)).toBeCloseTo(
      Math.min(2 / CONFIDENCE_DIVISOR, 1),
    );
    expect(computeConfidence(4, false)).toBe(1);
    expect(computeConfidence(2, true)).toBeCloseTo(
      Math.min(2 / CONFIDENCE_DIVISOR + CONVERGENCE_BONUS, 1),
    );
  });
});
