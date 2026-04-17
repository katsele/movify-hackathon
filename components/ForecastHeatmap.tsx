"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MockForecastCell } from "@/lib/mock-data";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ForecastHeatmapProps {
  cells: MockForecastCell[];
  weeks?: number;
  interactive?: boolean;
}

function gapColor(gap: number) {
  if (gap >= 3) return "bg-gap-critical text-white";
  if (gap >= 1) return "bg-gap-warning text-white";
  return "bg-gap-covered text-white";
}

function confidenceOpacity(confidence: number) {
  if (confidence >= 0.75) return "opacity-100";
  if (confidence >= 0.5) return "opacity-85";
  return "opacity-60";
}

export function ForecastHeatmap({
  cells,
  weeks = 12,
  interactive = true,
}: ForecastHeatmapProps) {
  const skillsOrdered: { name: string; discipline: string }[] = [];
  const seen = new Set<string>();
  for (const cell of cells) {
    if (!seen.has(cell.skill)) {
      seen.add(cell.skill);
      skillsOrdered.push({ name: cell.skill, discipline: cell.discipline });
    }
  }

  const weekLabels = Array.from({ length: weeks }, (_, i) => `W${i + 1}`);

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-transparent text-left font-medium text-muted-foreground pr-3 min-w-[180px]">
              Skill
            </th>
            {weekLabels.map((label) => (
              <th
                key={label}
                className="text-center font-medium text-muted-foreground w-10"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skillsOrdered.map((skill) => {
            const row = cells.filter((c) => c.skill === skill.name);
            return (
              <tr key={skill.name}>
                <td className="sticky left-0 bg-[#F9FAFB] pr-3 py-1 text-left align-middle">
                  <div className="font-medium text-foreground leading-tight">
                    {skill.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    {skill.discipline}
                  </div>
                </td>
                {row.slice(0, weeks).map((cell) => {
                  const cellNode = (
                    <div
                      className={cn(
                        "h-8 w-10 rounded flex items-center justify-center font-semibold",
                        gapColor(cell.gap),
                        confidenceOpacity(cell.confidence),
                        cell.confidence < 0.5 && "hatched",
                        interactive &&
                          "cursor-pointer hover:ring-2 hover:ring-foreground/40",
                      )}
                    >
                      {cell.gap > 0 ? `+${cell.gap}` : cell.gap}
                    </div>
                  );
                  return (
                    <td key={cell.week} className="p-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {interactive ? (
                            <Link
                              href={`/forecast/${encodeURIComponent(skill.name)}`}
                              aria-label={`${skill.name} week ${cell.week}`}
                            >
                              {cellNode}
                            </Link>
                          ) : (
                            cellNode
                          )}
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <div className="space-y-0.5">
                            <div className="font-semibold">
                              {skill.name} · W{cell.week}
                            </div>
                            <div>Demand: {cell.demand}</div>
                            <div>Supply: {cell.supply}</div>
                            <div>
                              Gap:{" "}
                              <span className="font-semibold">
                                {cell.gap > 0 ? `+${cell.gap}` : cell.gap}
                              </span>
                            </div>
                            <div>
                              Confidence:{" "}
                              {Math.round(cell.confidence * 100)}%
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      <Legend />
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-gap-critical" />
        Gap ≥ 3 — act now
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-gap-warning" />
        Gap 1–2 — watch
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-gap-covered" />
        Covered
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-gap-critical hatched" />
        Low confidence
      </div>
    </div>
  );
}
