"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { SignalWeightChart } from "@/components/SignalWeightChart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_FORECAST_FACTOR_WEIGHTS,
  FORECAST_FACTOR_KEYS,
  buildSourceWeightSettingsRows,
  sourceWeightSettingsToChartData,
} from "@/lib/constants/forecastFactors";
import {
  useSourceWeightsSettings,
  useUpdateSourceWeights,
} from "@/lib/hooks/useSourceWeightsSettings";
import type { ForecastFactorKey, SourceWeightSettingsRow } from "@/lib/types";

type DraftWeights = Record<ForecastFactorKey, number>;
type DraftOverrides = Partial<Record<ForecastFactorKey, number>>;

function toDraftWeights(rows: SourceWeightSettingsRow[]): DraftWeights {
  return FORECAST_FACTOR_KEYS.reduce(
    (acc, key) => {
      const row = rows.find((item) => item.source_key === key);
      acc[key] = row?.percentage ?? Math.round(DEFAULT_FORECAST_FACTOR_WEIGHTS[key] * 100);
      return acc;
    },
    {} as DraftWeights,
  );
}

function buildDefaultDraftWeights(): DraftWeights {
  return FORECAST_FACTOR_KEYS.reduce(
    (acc, key) => {
      acc[key] = Math.round(DEFAULT_FORECAST_FACTOR_WEIGHTS[key] * 100);
      return acc;
    },
    {} as DraftWeights,
  );
}

function buildOverrides(
  next: DraftWeights,
  saved: DraftWeights,
): DraftOverrides {
  return FORECAST_FACTOR_KEYS.reduce((acc, key) => {
    if (next[key] !== saved[key]) {
      acc[key] = next[key];
    }
    return acc;
  }, {} as DraftOverrides);
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatLastSeen(value: string | null): string {
  if (!value) return "No recent data loaded";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "No recent data loaded";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function maxUpdatedAt(rows: SourceWeightSettingsRow[]): string | undefined {
  const latest = rows.reduce<string | null>((current, row) => {
    if (!row.updated_at) return current;
    if (!current) return row.updated_at;
    return new Date(row.updated_at).getTime() > new Date(current).getTime()
      ? row.updated_at
      : current;
  }, null);

  if (!latest) return undefined;
  return formatLastSeen(latest);
}

export default function SettingsPage() {
  const weightsQuery = useSourceWeightsSettings();
  const updateWeights = useUpdateSourceWeights();
  const [draftOverrides, setDraftOverrides] = useState<DraftOverrides>({});
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

  const savedRows =
    weightsQuery.data?.settings ?? buildSourceWeightSettingsRows(undefined);
  const savedDraft = useMemo(() => toDraftWeights(savedRows), [savedRows]);
  const draft = useMemo(
    () =>
      FORECAST_FACTOR_KEYS.reduce(
        (acc, key) => {
          acc[key] = draftOverrides[key] ?? savedDraft[key];
          return acc;
        },
        {} as DraftWeights,
      ),
    [draftOverrides, savedDraft],
  );

  const rows = useMemo(
    () =>
      savedRows.map((row) => ({
        ...row,
        percentage: draft[row.source_key],
        weight: draft[row.source_key] / 100,
      })),
    [draft, savedRows],
  );

  const total = rows.reduce((sum, row) => sum + row.percentage, 0);
  const delta = 100 - total;
  const hasChanges = FORECAST_FACTOR_KEYS.some(
    (key) => draft[key] !== savedDraft[key],
  );
  const canSave =
    total === 100 && hasChanges && !updateWeights.isPending;

  const helperText =
    delta === 0
      ? "Allocation is balanced. Saving will persist the weights and regenerate the 12-month forecast."
      : delta > 0
        ? `${delta}% still unallocated. Add weight before saving.`
        : `${Math.abs(delta)}% over budget. Reduce one or more factors before saving.`;

  const chartData = sourceWeightSettingsToChartData(rows);

  function updateDraftValue(key: ForecastFactorKey, value: number) {
    setMessage(null);
    const next = {
      ...draft,
      [key]: clampPercentage(value),
    };
    setDraftOverrides(buildOverrides(next, savedDraft));
  }

  async function handleSave() {
    if (!canSave) return;

    setMessage(null);
    try {
      const result = await updateWeights.mutateAsync({ weights: draft });
      setDraftOverrides({});
      setMessage({
        tone: "success",
        text: `Saved. Recalculated ${result.recalculation.forecasts_written} forecast rows across ${result.recalculation.skills_processed} skills.`,
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "Failed to save settings.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Tune how much each forecast driver should influence the next 12 months."
        lastUpdated={weightsQuery.data ? maxUpdatedAt(savedRows) : undefined}
      />

      {weightsQuery.error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">
            Failed to load settings: {weightsQuery.error.message}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Forecast factor weights</CardTitle>
            <CardDescription>
              Each factor is edited as a whole-number percentage. The total must
              equal 100% before the new mix can be saved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {weightsQuery.isLoading && !weightsQuery.data && (
              <p className="text-sm text-muted-foreground">
                Loading saved weights…
              </p>
            )}

            {rows.map((row) => (
              <div
                key={row.source_key}
                className="rounded-md border border-neutral-200 bg-neutral-50/60 p-4"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      <h3 className="text-sm font-semibold text-neutral-800">
                        {row.label}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500">{row.description}</p>
                    <p className="text-[11px] text-neutral-500">
                      Last data seen:{" "}
                      <span className="font-mono tabular">
                        {formatLastSeen(row.last_data_seen_at)}
                      </span>
                    </p>
                  </div>
                  <div className="w-full sm:max-w-[88px]">
                    <label className="sr-only" htmlFor={`${row.source_key}-number`}>
                      {row.label} percentage
                    </label>
                    <div className="relative">
                      <input
                        id={`${row.source_key}-number`}
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={row.percentage}
                        onChange={(event) =>
                          updateDraftValue(
                            row.source_key,
                            Number(event.target.value),
                          )
                        }
                        disabled={updateWeights.isPending}
                        className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 pr-8 text-sm font-medium text-neutral-800 outline-none transition focus:border-neutral-400 focus:ring-1 focus:ring-neutral-300 disabled:cursor-not-allowed disabled:bg-neutral-100"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500">
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="sr-only" htmlFor={`${row.source_key}-slider`}>
                    {row.label} slider
                  </label>
                  <input
                    id={`${row.source_key}-slider`}
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={row.percentage}
                    onChange={(event) =>
                      updateDraftValue(
                        row.source_key,
                        Number(event.target.value),
                      )
                    }
                    disabled={updateWeights.isPending}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 disabled:cursor-not-allowed"
                    style={{ accentColor: row.color }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Allocation preview</CardTitle>
              <CardDescription>
                The chart updates with your draft instantly. Saving makes the
                forecast pages use this mix.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignalWeightChart data={chartData} height={220} />

              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Total allocation
                </p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <span className="text-3xl font-semibold tracking-[-0.02em] text-neutral-800">
                    {total}%
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      delta === 0
                        ? "text-signal-covered"
                        : "text-signal-gap"
                    }`}
                  >
                    {delta === 0
                      ? "Ready to save"
                      : delta > 0
                        ? `${delta}% remaining`
                        : `${Math.abs(delta)}% over`}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">{helperText}</p>
              </div>

              {message && (
                <div
                  className={`rounded-md border px-4 py-3 text-sm ${
                    message.tone === "success"
                      ? "border-signal-covered/30 bg-signal-covered/10 text-signal-covered"
                      : "border-signal-gap/30 bg-signal-gap/10 text-signal-gap"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMessage(null);
                    setDraftOverrides(
                      buildOverrides(buildDefaultDraftWeights(), savedDraft),
                    );
                  }}
                  disabled={updateWeights.isPending}
                >
                  Reset to defaults
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!canSave}
                >
                  {updateWeights.isPending
                    ? "Recalculating forecast…"
                    : "Save and recalculate"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
