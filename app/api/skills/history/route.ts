import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { loadHistoricalDataset } from "@/lib/server/forecast-engine";

export const runtime = "nodejs";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const HISTORY_YEARS_FOR_ENVELOPE = 3;

interface MonthlyRange {
  min: number;
  max: number;
}

function buildMonthlyHistoryRange(
  starts: Date[],
  today: Date,
): Record<number, MonthlyRange> {
  const currentYear = today.getUTCFullYear();
  const yearMonthCounts = new Map<string, number>();

  for (const start of starts) {
    const yearsAgo = (today.getTime() - start.getTime()) / MS_PER_YEAR;
    if (yearsAgo < 0 || yearsAgo > HISTORY_YEARS_FOR_ENVELOPE) continue;
    const key = `${start.getUTCFullYear()}-${start.getUTCMonth() + 1}`;
    yearMonthCounts.set(key, (yearMonthCounts.get(key) ?? 0) + 1);
  }

  const range: Record<number, MonthlyRange> = {};
  for (let month = 1; month <= 12; month += 1) {
    const samples: number[] = [];
    for (let yearsBack = 1; yearsBack <= HISTORY_YEARS_FOR_ENVELOPE; yearsBack += 1) {
      const year = currentYear - yearsBack;
      samples.push(yearMonthCounts.get(`${year}-${month}`) ?? 0);
    }
    range[month] = {
      min: Math.min(...samples),
      max: Math.max(...samples),
    };
  }
  return range;
}

export async function GET() {
  const supabase = createAdminClient();
  const today = new Date(
    Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate(),
    ),
  );

  try {
    const dataset = await loadHistoricalDataset(supabase, today);

    const skills: Record<
      string,
      {
        seasonal_index_by_month: Record<number, number>;
        weighted_monthly: Record<number, number>;
        baseline_monthly: number;
        tightness: number;
        skill_median_duration: number | null;
        monthly_history_range: Record<number, MonthlyRange>;
      }
    > = {};

    for (const [skillId, aggregate] of dataset.aggregates.entries()) {
      const starts = dataset.startsBySkill.get(skillId) ?? [];
      skills[skillId] = {
        seasonal_index_by_month: aggregate.seasonalIndex,
        weighted_monthly: aggregate.weightedMonthly,
        baseline_monthly: aggregate.baselineMonthly,
        tightness: aggregate.tightness,
        skill_median_duration: aggregate.skillMedianDuration,
        monthly_history_range: buildMonthlyHistoryRange(starts, today),
      };
    }

    return NextResponse.json({
      global_median_duration: dataset.globalMedianDuration,
      skills,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load skill history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
