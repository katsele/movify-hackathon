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
  const deduped = new Map<string, ForecastCell>();

  const sortedRows = [...rows].sort(
    (a, b) =>
      new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime() ||
      new Date(a.forecast_week).getTime() - new Date(b.forecast_week).getTime(),
  );

  for (const row of sortedRows) {
    const week = Math.floor(
      (new Date(row.forecast_week).getTime() - currentWeekStart) / MS_PER_WEEK,
    );

    if (week < 1 || week > 12) continue;

    const key = `${row.skill_id}:${week}`;
    if (deduped.has(key)) continue;

    deduped.set(key, {
      skill: row.skills?.name ?? "Unknown skill",
      discipline: row.skills?.discipline ?? "—",
      week,
      demand: row.predicted_demand,
      supply: row.current_supply,
      gap: row.gap,
      confidence: row.confidence,
      contributingSignalIds: row.contributing_signals ?? [],
      notes: row.notes ?? undefined,
    });
  }

  return Array.from(deduped.values()).sort(
    (a, b) => a.skill.localeCompare(b.skill) || a.week - b.week,
  );
}
