import type { ForecastWithSkill } from "@/lib/types";
import type { ForecastCell } from "@/lib/mock-data";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

function startOfCurrentWeek(): number {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function forecastToCells(rows: ForecastWithSkill[]): ForecastCell[] {
  const currentWeekStart = startOfCurrentWeek();
  return rows
    .map((row) => {
      const week = Math.floor(
        (new Date(row.forecast_week).getTime() - currentWeekStart) / MS_PER_WEEK,
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
        notes: row.notes ?? undefined,
      } satisfies ForecastCell;
    })
    .filter((cell) => cell.week >= 1 && cell.week <= 12);
}
