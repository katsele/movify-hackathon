"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar, type FilterDefinition } from "@/components/FilterBar";
import { SignalCard } from "@/components/SignalCard";
import { SignalEvaluationPanel } from "@/components/SignalEvaluationPanel";
import { Card, CardContent } from "@/components/ui/card";
import { useSignals } from "@/lib/hooks/useSignals";
import { MOCK_SIGNALS } from "@/lib/mock-data";
import type { RecentSignal, SignalSource } from "@/lib/types";

const FILTERS: FilterDefinition[] = [
  {
    id: "source",
    label: "Source",
    options: [
      { value: "news_intelligence", label: "News" },
      { value: "ted_procurement", label: "Procurement" },
      { value: "google_trends", label: "Google Trends" },
      { value: "ats_greenhouse", label: "Job postings" },
    ],
  },
  {
    id: "discipline",
    label: "Discipline",
    options: [
      { value: "Web Development", label: "Web Development" },
      { value: "AI/ML", label: "AI/ML" },
      { value: "Data", label: "Data" },
      { value: "Design", label: "Design" },
    ],
  },
];

export default function SignalsPage() {
  const [active, setActive] = useState<Record<string, string | undefined>>({});

  const live = useSignals({
    source: active.source as SignalSource | undefined,
  });

  // Fall back to mocks when live data is empty (e.g. migration not applied).
  const liveData = live.data ?? [];
  const combined: RecentSignal[] = liveData.length
    ? liveData
    : (MOCK_SIGNALS as RecentSignal[]);

  const filtered = combined.filter((s) => {
    if (active.source && s.source !== active.source) return false;
    if (active.discipline && s.discipline !== active.discipline) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signals"
        subtitle="Every ingested market intelligence signal, filterable."
        lastUpdated={liveData.length ? "live" : "mock data"}
      />
      <FilterBar
        filters={FILTERS}
        active={active}
        onChange={(id, value) => setActive((p) => ({ ...p, [id]: value }))}
      />
      <Card>
        <CardContent className="space-y-2 pt-4">
          {live.isLoading && (
            <p className="text-xs text-muted-foreground">Loading signals…</p>
          )}
          {live.error && (
            <p className="text-xs text-red-600">
              Failed to load live signals: {live.error.message}
            </p>
          )}
          {!live.isLoading && filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No signals match the current filters.
            </p>
          )}
          {filtered.map((s, i) => (
            <SignalCard
              key={s.signal_id ?? `${s.title ?? "signal"}-${i}`}
              signal={s}
            />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <SignalEvaluationPanel signals={liveData} />
        </CardContent>
      </Card>
    </div>
  );
}
