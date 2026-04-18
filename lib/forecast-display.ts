import type { ForecastCell } from "@/lib/mock-data";

export interface ForecastSkillSummary {
  skill: string;
  discipline: string;
  cells: ForecastCell[];
  maxGap: number;
  totalPositiveGap: number;
  maxConfidence: number;
  maxDemand: number;
}

export function summarizeForecastCells(
  cells: ForecastCell[],
  months = 12,
): ForecastSkillSummary[] {
  const grouped = new Map<string, ForecastSkillSummary>();

  for (const cell of cells) {
    if (cell.month < 1 || cell.month > months) continue;

    const existing = grouped.get(cell.skill);
    if (existing) {
      existing.cells.push(cell);
      existing.maxGap = Math.max(existing.maxGap, cell.gap);
      existing.totalPositiveGap += Math.max(0, cell.gap);
      existing.maxConfidence = Math.max(existing.maxConfidence, cell.confidence);
      existing.maxDemand = Math.max(existing.maxDemand, cell.demand);
      continue;
    }

    grouped.set(cell.skill, {
      skill: cell.skill,
      discipline: cell.discipline,
      cells: [cell],
      maxGap: cell.gap,
      totalPositiveGap: Math.max(0, cell.gap),
      maxConfidence: cell.confidence,
      maxDemand: cell.demand,
    });
  }

  return Array.from(grouped.values())
    .filter((summary) => summary.maxDemand > 0)
    .map((summary) => ({
      ...summary,
      cells: [...summary.cells].sort((a, b) => a.month - b.month),
    }))
    .sort(
      (a, b) =>
        b.maxGap - a.maxGap ||
        b.totalPositiveGap - a.totalPositiveGap ||
        b.maxConfidence - a.maxConfidence ||
        b.maxDemand - a.maxDemand ||
        a.skill.localeCompare(b.skill),
    );
}

const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

export function monthLabel(offset: number, anchor: Date = new Date()): string {
  const target = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + offset, 1),
  );
  return MONTH_LABEL_FORMATTER.format(target);
}
