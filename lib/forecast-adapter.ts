import type { ForecastWithSkill } from "@/lib/types";
import type { ForecastCell } from "@/lib/mock-data";

function startOfCurrentMonth(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function monthDiff(a: Date, b: Date): number {
  return (
    (a.getUTCFullYear() - b.getUTCFullYear()) * 12 +
    (a.getUTCMonth() - b.getUTCMonth())
  );
}

export function forecastToCells(rows: ForecastWithSkill[]): ForecastCell[] {
  const currentMonth = startOfCurrentMonth();
  const deduped = new Map<string, ForecastCell>();

  const sortedRows = [...rows].sort(
    (a, b) =>
      new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime() ||
      new Date(a.forecast_month).getTime() -
        new Date(b.forecast_month).getTime(),
  );

  for (const row of sortedRows) {
    const month = monthDiff(new Date(row.forecast_month), currentMonth);

    if (month < 1 || month > 12) continue;

    const key = `${row.skill_id}:${month}`;
    if (deduped.has(key)) continue;

    deduped.set(key, {
      skill: row.skills?.name ?? "Unknown skill",
      discipline: row.skills?.discipline ?? "—",
      month,
      demand: row.predicted_demand,
      supply: row.current_supply,
      gap: row.gap,
      confidence: row.confidence,
      contributingSignalIds: row.contributing_signals ?? [],
      notes: row.notes ?? undefined,
    });
  }

  return Array.from(deduped.values()).sort(
    (a, b) => a.skill.localeCompare(b.skill) || a.month - b.month,
  );
}
