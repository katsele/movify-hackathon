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
  type SignalWeightDatum,
} from "@/components/SignalWeightChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildMockForecast, MOCK_SIGNALS } from "@/lib/mock-data";

const WEIGHTS: SignalWeightDatum[] = [
  { source: "Pipeline (CRM)", weight: 0.35, color: "#059669" },
  { source: "Procurement", weight: 0.25, color: "#2563EB" },
  { source: "Historical", weight: 0.15, color: "#64748B" },
  { source: "Trend", weight: 0.1, color: "#7C3AED" },
  { source: "Job postings", weight: 0.1, color: "#0891B2" },
  { source: "News", weight: 0.05, color: "#6B7280" },
];

export default function SkillDrilldownPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill } = use(params);
  const skillName = decodeURIComponent(skill);
  const cells = buildMockForecast().filter((c) => c.skill === skillName);

  const curveData = cells.map((c) => ({
    week: `W${c.week}`,
    demand: c.demand,
    supply: c.supply,
    confidenceLow: Math.max(0, c.demand - 1),
    confidenceHigh: c.demand + 1,
  }));

  const relatedSignals = MOCK_SIGNALS.filter(
    (s) => s.skill_name === skillName,
  );
  const avgConfidence =
    cells.reduce((s, c) => s + c.confidence, 0) / (cells.length || 1);
  const totalGap = cells.reduce((s, c) => s + Math.max(0, c.gap), 0);

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
        subtitle={cells[0]?.discipline ?? "Skill drill-down"}
        actions={
          <div className="flex items-center gap-3">
            <ConfidenceIndicator value={avgConfidence} />
            <span className="text-xs text-muted-foreground">
              Cumulative 12w gap:{" "}
              <span className="font-semibold text-foreground">
                +{totalGap}
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
            <SignalWeightChart data={WEIGHTS} />
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
            {relatedSignals.map((s) => (
              <SignalCard key={s.title ?? ""} signal={s} />
            ))}
          </CardContent>
        </Card>
        <ActionCard
          title={`Start sourcing ${skillName} now`}
          explanation={`Gap opens around week 3 and peaks around week 7. Two procurement notices and a pipeline deal converge on this skill. Start referral outreach + earmark rolling-off profiles.`}
          primaryAction={{ label: "Open referral brief" }}
          secondaryAction={{ label: "Pin to weekly digest" }}
        />
      </div>
    </div>
  );
}
