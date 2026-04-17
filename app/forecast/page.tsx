"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { ForecastHeatmap } from "@/components/ForecastHeatmap";
import { FilterBar, type FilterDefinition } from "@/components/FilterBar";
import { Card, CardContent } from "@/components/ui/card";
import { buildMockForecast, MOCK_SKILLS } from "@/lib/mock-data";

const DISCIPLINES = Array.from(
  new Set(MOCK_SKILLS.map((s) => s.discipline)),
);

const FILTERS: FilterDefinition[] = [
  {
    id: "discipline",
    label: "Discipline",
    options: DISCIPLINES.map((d) => ({ value: d, label: d })),
  },
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
  const cells = buildMockForecast();

  const filtered = active.discipline
    ? cells.filter((c) => c.discipline === active.discipline)
    : cells;
  const weeks = active.timeframe ? Number(active.timeframe) : 12;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forecast"
        subtitle="Rolling 12-week demand heatmap. Click a cell to drill down."
        lastUpdated="2 hours ago"
      />
      <FilterBar
        filters={FILTERS}
        active={active}
        onChange={(id, value) => setActive((p) => ({ ...p, [id]: value }))}
      />
      <Card>
        <CardContent className="pt-4">
          <ForecastHeatmap cells={filtered} weeks={weeks} />
        </CardContent>
      </Card>
    </div>
  );
}
