"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar, type FilterDefinition } from "@/components/FilterBar";
import { SignalCard } from "@/components/SignalCard";
import { SignalDetailPanel } from "@/components/SignalDetailPanel";
import { SignalEvaluationPanel } from "@/components/SignalEvaluationPanel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

function getSignalKey(signal: RecentSignal): string {
  return (
    signal.signal_id ??
    `${signal.source}|${signal.detected_at}|${signal.title ?? "untitled"}`
  );
}

function filterSignals(
  signals: RecentSignal[],
  active: Record<string, string | undefined>,
) {
  return signals.filter((signal) => {
    if (active.source && signal.source !== active.source) return false;
    if (active.discipline && signal.discipline !== active.discipline) {
      return false;
    }
    return true;
  });
}

export default function SignalsPage() {
  const searchParams = useSearchParams();
  const detailRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<Record<string, string | undefined>>({});
  const [selectedSignalKey, setSelectedSignalKey] = useState<string | null>(
    null,
  );
  const debugMode = searchParams.get("debug") === "1";

  const live = useSignals({
    source: active.source as SignalSource | undefined,
  });

  // Fall back to mocks when live data is empty (e.g. migration not applied).
  const liveData = live.data ?? [];
  const combined: RecentSignal[] = liveData.length
    ? liveData
    : (MOCK_SIGNALS as RecentSignal[]);
  const filtered = filterSignals(combined, active);

  const selectedSignal =
    filtered.find((signal) => getSignalKey(signal) === selectedSignalKey) ??
    filtered[0];
  const effectiveSelectedKey = selectedSignal
    ? getSignalKey(selectedSignal)
    : null;
  const hasActiveFilters = Object.values(active).some(Boolean);

  const updateFilters = (nextActive: Record<string, string | undefined>) => {
    const nextFiltered = filterSignals(combined, nextActive);
    const nextSelectedSignal = nextFiltered.find(
      (signal) => getSignalKey(signal) === effectiveSelectedKey,
    );

    setActive(nextActive);
    setSelectedSignalKey(
      nextSelectedSignal
        ? getSignalKey(nextSelectedSignal)
        : nextFiltered[0]
          ? getSignalKey(nextFiltered[0])
          : null,
    );
  };

  const handleSelect = (signalKey: string) => {
    setSelectedSignalKey(signalKey);

    if (!window.matchMedia("(max-width: 1023px)").matches) return;

    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signals"
        subtitle="Browse the explorer on one side and inspect the selected signal in detail on the other."
        lastUpdated={liveData.length ? "live" : "mock data"}
      />
      <FilterBar
        filters={FILTERS}
        active={active}
        onChange={(id, value) =>
          updateFilters({ ...active, [id]: value })
        }
        onClearAll={() => updateFilters({})}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div ref={detailRef} className="order-1 lg:order-2">
          <SignalDetailPanel signal={selectedSignal} debug={debugMode} />
        </div>

        <Card className="order-2 lg:order-1">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <CardTitle>Signal explorer</CardTitle>
              <CardDescription>
                {filtered.length} result{filtered.length === 1 ? "" : "s"}
                {hasActiveFilters ? " after filters" : ""}
              </CardDescription>
            </div>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700">
              {liveData.length ? "Live data" : "Mock data"}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
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
            {filtered.map((signal) => {
              const signalKey = getSignalKey(signal);

              return (
                <SignalCard
                  key={signalKey}
                  signal={signal}
                  selected={signalKey === effectiveSelectedKey}
                  onSelect={() => handleSelect(signalKey)}
                />
              );
            })}
          </CardContent>
        </Card>
      </div>

      {debugMode && (
        <Card>
          <CardContent className="pt-4">
            <details>
              <summary className="cursor-pointer text-sm font-medium text-neutral-800">
                Connector diagnostics
              </summary>
              <div className="mt-4">
                {liveData.length > 0 ? (
                  <SignalEvaluationPanel signals={liveData} />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Connector diagnostics require live connector payloads. Run a
                    connector and reload this page to inspect raw source data.
                  </p>
                )}
              </div>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
