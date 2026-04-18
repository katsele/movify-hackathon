"use client";

import { PageHeader } from "@/components/PageHeader";
import { KPICard } from "@/components/KPICard";
import { ForecastHeatmap } from "@/components/ForecastHeatmap";
import { GapAlert } from "@/components/GapAlert";
import { SignalCard } from "@/components/SignalCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForecast } from "@/lib/hooks/useForecast";
import { useConsultants } from "@/lib/hooks/useBench";
import { buildMockForecast, MOCK_SIGNALS } from "@/lib/mock-data";

export default function DashboardPage() {
  const cells = buildMockForecast();
  const topGaps = [...cells]
    .filter((c) => c.week <= 6 && c.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3);

  const consultants = useConsultants();
  const onBench =
    consultants.data?.filter((c) =>
      ["on_bench", "rolling_off"].includes(c.current_status),
    ).length ?? 0;
  const pipelineValue = 1.8;
  const topGapSkill = topGaps[0];

  const liveForecast = useForecast();

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
          value={MOCK_SIGNALS.length}
          unit="last 7 days"
          delta={-4}
          deltaLabel="vs last week"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live forecast (Supabase)</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {liveForecast.isLoading && (
            <p className="text-sm text-muted-foreground">Loading live data…</p>
          )}
          {liveForecast.error && (
            <p className="text-sm text-red-600">
              Failed to load forecast: {liveForecast.error.message}
            </p>
          )}
          {liveForecast.data && liveForecast.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No forecast rows yet. Apply migrations 001 + 002 to your Supabase
              project.
            </p>
          )}
          {liveForecast.data && liveForecast.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead className="text-right">Demand</TableHead>
                  <TableHead className="text-right">Supply</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {liveForecast.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.skills?.name ?? "—"}</TableCell>
                    <TableCell>{row.forecast_week}</TableCell>
                    <TableCell className="text-right">
                      {row.predicted_demand}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.current_supply}
                    </TableCell>
                    <TableCell className="text-right">{row.gap}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>12-week forecast</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ForecastHeatmap cells={cells} weeks={12} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Gap alerts — next 6 weeks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
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
            {MOCK_SIGNALS.slice(0, 4).map((s) => (
              <SignalCard key={s.title ?? ""} signal={s} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
