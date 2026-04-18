import type { ForecastWithSkill } from "@/lib/types";
import type { ForecastCell } from "@/lib/mock-data";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function forecastToCells(rows: ForecastWithSkill[]): ForecastCell[] {
  const today = startOfToday();
  return rows
    .map((row) => {
      const week = Math.round(
        (new Date(row.forecast_week).getTime() - today) / MS_PER_WEEK,
      );
      return {
        skill: row.skills?.name ?? "Unknown skill",
        discipline: row.skills?.discipline ?? "—",
        week,
        demand: row.predicted_demand,
        supply: row.current_supply,
        gap: row.gap,
        confidence: row.confidence,
        contributingSignalIds: row.contributing_signals ?? [],
      } satisfies ForecastCell;
    })
    .filter((cell) => cell.week >= 1 && cell.week <= 12);
}
