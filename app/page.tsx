"use client";

import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/KPICard";
import { ForecastHeatmap } from "@/components/ForecastHeatmap";
import { GapAlert } from "@/components/GapAlert";
import { SignalCard } from "@/components/SignalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForecast } from "@/lib/hooks/useForecast";
import { useConsultants } from "@/lib/hooks/useBench";
import { useSignals } from "@/lib/hooks/useSignals";
import { useSignalsByIds } from "@/lib/hooks/useSignalsByIds";
import { forecastToCells } from "@/lib/forecast-adapter";
import { buildMockForecast, MOCK_SIGNALS } from "@/lib/mock-data";
import type { RecentSignal } from "@/lib/types";

export default function DashboardPage() {
  const consultants = useConsultants();
  const liveForecast = useForecast();
  const liveSignals = useSignals();

  const liveCells = liveForecast.data
    ? forecastToCells(liveForecast.data)
    : [];
  const usingMock = !liveForecast.isLoading && liveCells.length === 0;
  const cells = usingMock ? buildMockForecast() : liveCells;

  const signalIds = cells.flatMap((c) => c.contributingSignalIds ?? []);
  const signalsLookup = useSignalsByIds(signalIds);

  const topGaps = [...cells]
    .filter((c) => c.week <= 6 && c.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  const onBench =
    consultants.data?.filter((c) =>
      ["on_bench", "rolling_off"].includes(c.current_status),
    ).length ?? 0;
  const pipelineValue = 1.8;
  const topGapSkill = topGaps[0];

  const recentSignals: RecentSignal[] = liveSignals.data?.length
    ? liveSignals.data
    : (MOCK_SIGNALS as RecentSignal[]);
  // Converging signals earn the top of the feed — they are the cross-source
  // triangulation that justifies the forecaster. Ties fall back to recency.
  const topSignals = [...recentSignals]
    .sort(
      (a, b) =>
        (b.converging_count ?? 0) - (a.converging_count ?? 0) ||
        new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime(),
    )
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Monday morning overview — the Sebastiaan sniff test."
        lastUpdated="2 hours ago"
        onRefresh={() => {}}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          label="On bench"
          value={onBench}
          unit="consultants"
          delta={12}
          deltaLabel="vs last week"
          accent="covered"
        />
        <KPICard
          label="Pipeline"
          value={`€${pipelineValue}M`}
          delta={8}
          deltaLabel="vs last week"
        />
        <KPICard
          label="Top gap"
          value={topGapSkill ? topGapSkill.skill : "—"}
          unit={topGapSkill ? `+${topGapSkill.gap} needed` : undefined}
          accent="critical"
        />
        <KPICard
          label="New signals"
          value={recentSignals.length}
          unit="last 30 days"
          delta={-4}
          deltaLabel="vs last week"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>12-week forecast</CardTitle>
          {usingMock && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
              Mock data — run connectors + forecast engine to populate live
            </span>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {liveForecast.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading forecast…</p>
          ) : liveForecast.error ? (
            <p className="text-sm text-red-600">
              Failed to load forecast: {liveForecast.error.message}
            </p>
          ) : (
            <ForecastHeatmap
              cells={cells}
              weeks={12}
              signalsById={signalsLookup.data}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Gap alerts — next 6 weeks</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 divide-y divide-border">
            {topGaps.map((g, i) => (
              <GapAlert
                key={`${g.skill}-${i}`}
                skill={g.skill}
                discipline={g.discipline}
                gap={g.gap}
                window={`Week ${g.week}`}
                confidence={g.confidence}
                rationale={`${g.demand} profiles needed vs ${g.supply} available. Driven by pipeline deals + converging external signals.`}
                href={`/forecast/${encodeURIComponent(g.skill)}`}
              />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topSignals.map((s, i) => (
              <SignalCard
                key={s.signal_id ?? `${s.title ?? "signal"}-${i}`}
                signal={s}
              />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
