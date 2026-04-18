import type { SignalWeightDatum } from "@/components/SignalWeightChart";
import { SOURCE_LABEL } from "@/lib/constants/signalIcons";
import type {
  ForecastFactorKey,
  SignalSource,
  SourceWeight,
  SourceWeightSettingsRow,
} from "@/lib/types";

export interface ForecastFactorMeta {
  key: ForecastFactorKey;
  label: string;
  description: string;
  color: string;
  signalSources: SignalSource[];
}

export const FORECAST_FACTOR_KEYS: ForecastFactorKey[] = [
  "crm_pipeline",
  "procurement_notice",
  "historical_pattern",
  "trend_spike",
  "job_posting",
  "news_event",
];

export const DEFAULT_FORECAST_FACTOR_WEIGHTS: Record<ForecastFactorKey, number> = {
  crm_pipeline: 0.35,
  procurement_notice: 0.25,
  historical_pattern: 0.15,
  trend_spike: 0.1,
  job_posting: 0.1,
  news_event: 0.05,
};

export const FORECAST_FACTOR_META: Record<ForecastFactorKey, ForecastFactorMeta> = {
  crm_pipeline: {
    key: "crm_pipeline",
    label: "Pipeline (CRM)",
    description: "Open Movify deals and requested profiles from Boond.",
    color: "#059669",
    signalSources: [],
  },
  procurement_notice: {
    key: "procurement_notice",
    label: "Procurement",
    description: "Belgian and EU procurement notices matched to relevant skills.",
    color: "#2563EB",
    signalSources: ["ted_procurement"],
  },
  historical_pattern: {
    key: "historical_pattern",
    label: "Historical",
    description: "Seasonality and repeat staffing patterns from completed projects.",
    color: "#78736A",
    signalSources: [],
  },
  trend_spike: {
    key: "trend_spike",
    label: "Trend",
    description: "Google Trends spikes that point to emerging demand shifts.",
    color: "#7C3AED",
    signalSources: ["google_trends"],
  },
  job_posting: {
    key: "job_posting",
    label: "Job postings",
    description: "Hiring demand from Greenhouse and Lever job feeds.",
    color: "#0891B2",
    signalSources: ["ats_greenhouse", "ats_lever"],
  },
  news_event: {
    key: "news_event",
    label: "News",
    description: "Belgian news coverage and client events that hint at future demand.",
    color: "#A8A39A",
    signalSources: ["news", "news_intelligence"],
  },
};

export const FORECAST_FACTORS: ForecastFactorMeta[] = FORECAST_FACTOR_KEYS.map(
  (key) => FORECAST_FACTOR_META[key],
);

export function buildDefaultSourceWeights(): SourceWeight[] {
  const now = new Date().toISOString();
  return FORECAST_FACTOR_KEYS.map((key) => ({
    source_key: key,
    weight: DEFAULT_FORECAST_FACTOR_WEIGHTS[key],
    updated_at: now,
  }));
}

export function buildSourceWeightSettingsRows(
  rows: SourceWeight[] | null | undefined,
  lastSeenAt: Partial<Record<ForecastFactorKey, string | null>> = {},
): SourceWeightSettingsRow[] {
  const byKey = new Map(
    (rows?.length ? rows : buildDefaultSourceWeights()).map((row) => [
      row.source_key,
      row,
    ]),
  );

  return FORECAST_FACTORS.map((factor) => {
    const row = byKey.get(factor.key) ?? {
      source_key: factor.key,
      weight: DEFAULT_FORECAST_FACTOR_WEIGHTS[factor.key],
      updated_at: new Date().toISOString(),
    };

    return {
      source_key: factor.key,
      weight: row.weight,
      updated_at: row.updated_at,
      label: factor.label,
      description: factor.description,
      color: factor.color,
      percentage: Math.round(row.weight * 100),
      source_labels: factor.signalSources.length
        ? factor.signalSources.map((source) => SOURCE_LABEL[source] ?? source)
        : [factor.label],
      last_data_seen_at: lastSeenAt[factor.key] ?? null,
    };
  });
}

export function sourceWeightSettingsToChartData(
  rows: Pick<SourceWeightSettingsRow, "label" | "weight" | "color">[],
): SignalWeightDatum[] {
  return rows.map((row) => ({
    source: row.label,
    weight: row.weight,
    color: row.color,
  }));
}

export function sourceWeightsRecordToDecimals(
  weights: Record<ForecastFactorKey, number>,
): Record<ForecastFactorKey, number> {
  return FORECAST_FACTOR_KEYS.reduce(
    (acc, key) => {
      acc[key] = weights[key] / 100;
      return acc;
    },
    {} as Record<ForecastFactorKey, number>,
  );
}
