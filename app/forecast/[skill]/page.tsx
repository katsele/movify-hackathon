"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DemandCurve } from "@/components/DemandCurve";
import { SignalCard } from "@/components/SignalCard";
import { ActionCard } from "@/components/ActionCard";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import {
  SignalWeightChart,
} from "@/components/SignalWeightChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildSourceWeightSettingsRows,
  sourceWeightSettingsToChartData,
} from "@/lib/constants/forecastFactors";
import { useForecast } from "@/lib/hooks/useForecast";
import { useSignals } from "@/lib/hooks/useSignals";
import { useSourceWeightsSettings } from "@/lib/hooks/useSourceWeightsSettings";
import { useSkillByName } from "@/lib/hooks/useSkillByName";
import { forecastToCells } from "@/lib/forecast-adapter";
import {
  formatSignedConsultantGap,
  roundConsultantCount,
} from "@/lib/consultant-counts";
import { buildMockForecast, MOCK_SIGNALS } from "@/lib/mock-data";
import type { RecentSignal } from "@/lib/types";

export default function SkillDrilldownPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill } = use(params);
  const skillName = decodeURIComponent(skill);

  const skillLookup = useSkillByName(skillName);
  const liveForecast = useForecast(skillLookup.data?.id);
  const liveSignals = useSignals({ skill: skillName });
  const sourceWeights = useSourceWeightsSettings();

  const liveCells = liveForecast.data
    ? forecastToCells(liveForecast.data)
    : [];
  const usingMock = !liveForecast.isLoading && liveCells.length === 0;
  const cells = usingMock
    ? buildMockForecast().filter((c) => c.skill === skillName)
    : liveCells;
  const displayCells = cells.map((cell) => ({
    ...cell,
    demand: roundConsultantCount(cell.demand),
    supply: roundConsultantCount(cell.supply),
    gap: roundConsultantCount(cell.gap),
  }));

  const relatedSignals: RecentSignal[] =
    liveSignals.data && liveSignals.data.length > 0
      ? liveSignals.data
      : (MOCK_SIGNALS.filter((s) => s.skill_name === skillName) as RecentSignal[]);

  const curveData = displayCells
    .sort((a, b) => a.week - b.week)
    .map((c) => ({
      week: `W${c.week}`,
      demand: c.demand,
      supply: c.supply,
      confidenceLow: Math.max(0, c.demand - 1),
      confidenceHigh: c.demand + 1,
    }));

  const avgConfidence =
    cells.reduce((s, c) => s + c.confidence, 0) / (cells.length || 1);
  const totalGap = displayCells.reduce((s, c) => s + Math.max(0, c.gap), 0);
  const weightRows =
    sourceWeights.data?.settings ?? buildSourceWeightSettingsRows(undefined);

  return (
    <div className="space-y-6">
      <Link
        href="/forecast"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to forecast
      </Link>

      <PageHeader
        title={skillName}
        subtitle={
          displayCells[0]?.discipline ??
          skillLookup.data?.discipline ??
          "Skill drill-down"
        }
        actions={
          <div className="flex items-center gap-3">
            {usingMock && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900">
                Mock data
              </span>
            )}
            <ConfidenceIndicator value={avgConfidence} />
            <span className="text-xs text-muted-foreground">
              Cumulative 12w gap:{" "}
              <span className="font-semibold text-foreground">
                {formatSignedConsultantGap(totalGap)}
              </span>
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Demand vs supply — next 12 weeks</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DemandCurve data={curveData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Signal contributions</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SignalWeightChart
              data={sourceWeightSettingsToChartData(weightRows)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contributing signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {relatedSignals.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No recent external signals matched this skill.
              </p>
            )}
            {relatedSignals.map((s, i) => (
              <SignalCard
                key={s.signal_id ?? `${s.title ?? "signal"}-${i}`}
                signal={s}
              />
            ))}
          </CardContent>
        </Card>
        <ActionCard
          title={`Start sourcing ${skillName} now`}
          explanation={`Gap accumulates to ${formatSignedConsultantGap(totalGap)} over 12 weeks. Convergence across pipeline, news and procurement signals points to sustained demand. Start referral outreach and earmark rolling-off profiles.`}
          primaryAction={{ label: "Open referral brief" }}
          secondaryAction={{ label: "Pin to weekly digest" }}
        />
      </div>
    </div>
  );
}
