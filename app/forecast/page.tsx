"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ForecastHeatmap } from "@/components/ForecastHeatmap";
import { FilterBar, type FilterDefinition } from "@/components/FilterBar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useForecast } from "@/lib/hooks/useForecast";
import { useSignalsByIds } from "@/lib/hooks/useSignalsByIds";
import { forecastToCells } from "@/lib/forecast-adapter";
import { buildMockForecast, MOCK_SKILLS } from "@/lib/mock-data";

const FALLBACK_DISCIPLINES = Array.from(
  new Set(MOCK_SKILLS.map((s) => s.discipline)),
);

const STATIC_FILTERS: FilterDefinition[] = [
  {
    id: "region",
    label: "Region",
    options: [
      { value: "belgium", label: "Belgium" },
      { value: "flanders", label: "Flanders" },
      { value: "wallonia", label: "Wallonia" },
      { value: "brussels", label: "Brussels" },
    ],
  },
  {
    id: "timeframe",
    label: "Timeframe",
    options: [
      { value: "4", label: "4 weeks" },
      { value: "8", label: "8 weeks" },
      { value: "12", label: "12 weeks" },
    ],
  },
];

export default function ForecastPage() {
  const [active, setActive] = useState<Record<string, string | undefined>>({});
  const liveForecast = useForecast();

  const liveCells = liveForecast.data
    ? forecastToCells(liveForecast.data)
    : [];
  const usingMock = !liveForecast.isLoading && liveCells.length === 0;
  const cells = usingMock ? buildMockForecast() : liveCells;

  const disciplines = useMemo(() => {
    const set = new Set(cells.map((c) => c.discipline));
    return set.size ? Array.from(set) : FALLBACK_DISCIPLINES;
  }, [cells]);

  const filters: FilterDefinition[] = useMemo(
    () => [
      {
        id: "discipline",
        label: "Discipline",
        options: disciplines.map((d) => ({ value: d, label: d })),
      },
      ...STATIC_FILTERS,
    ],
    [disciplines],
  );

  const filtered = active.discipline
    ? cells.filter((c) => c.discipline === active.discipline)
    : cells;
  const weeks = active.timeframe ? Number(active.timeframe) : 12;

  const signalIds = filtered.flatMap((c) => c.contributingSignalIds ?? []);
  const signalsLookup = useSignalsByIds(signalIds);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecast"
        subtitle="Rolling 12-week demand heatmap. Click a cell to drill down."
        lastUpdated="2 hours ago"
      />
      <FilterBar
        filters={filters}
        active={active}
        onChange={(id, value) => setActive((p) => ({ ...p, [id]: value }))}
      />
      <Card>
        {usingMock && (
          <CardHeader className="pb-0">
            <span className="self-start rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
              Mock data — run connectors + forecast engine to populate live
            </span>
          </CardHeader>
        )}
        <CardContent className="pt-4">
          {liveForecast.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading forecast…</p>
          ) : liveForecast.error ? (
            <p className="text-sm text-red-600">
              Failed to load forecast: {liveForecast.error.message}
            </p>
          ) : (
            <ForecastHeatmap
              cells={filtered}
              weeks={weeks}
              signalsById={signalsLookup.data}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
