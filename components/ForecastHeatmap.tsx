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
  if (gap >= 3) return "bg-signal-gap text-white";
  if (gap >= 1) return "bg-signal-watch text-white";
  return "bg-signal-covered text-white";
}

function confidenceOpacity(confidence: number) {
  if (confidence >= 0.75) return "opacity-100";
  if (confidence >= 0.5) return "opacity-70";
  return "opacity-40";
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
            <th className="sticky left-0 bg-transparent text-left font-medium text-neutral-500 pr-3 min-w-[180px]">
              Skill
            </th>
            {weekLabels.map((label) => (
              <th
                key={label}
                className="text-center font-mono text-[11px] font-normal text-neutral-500 w-10 tabular"
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
                <td className="sticky left-0 bg-neutral-50 pr-3 py-1 text-left align-middle">
                  <div className="font-medium text-neutral-800 leading-tight">
                    {skill.name}
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-tight">
                    {skill.discipline}
                  </div>
                </td>
                {row.slice(0, weeks).map((cell) => {
                  const cellNode = (
                    <div
                      className={cn(
                        "h-8 w-10 rounded flex items-center justify-center font-mono text-[12px] font-medium tabular",
                        gapColor(cell.gap),
                        confidenceOpacity(cell.confidence),
                        cell.confidence < 0.5 && "hatched",
                        interactive &&
                          "cursor-pointer transition-colors hover:ring-2 hover:ring-brand-700/40",
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
                            <div className="tabular">
                              Demand: <span className="font-mono">{cell.demand}</span>
                            </div>
                            <div className="tabular">
                              Supply: <span className="font-mono">{cell.supply}</span>
                            </div>
                            <div className="tabular">
                              Gap:{" "}
                              <span className="font-mono font-semibold">
                                {cell.gap > 0 ? `+${cell.gap}` : cell.gap}
                              </span>
                            </div>
                            <div className="tabular">
                              Confidence:{" "}
                              <span className="font-mono">
                                {Math.round(cell.confidence * 100)}%
                              </span>
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
    <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-gap" />
        Gap ≥ 3 — act now
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-watch" />
        Gap 1–2 — watch
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-covered" />
        Covered
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-gap hatched" />
        Low confidence
      </div>
    </div>
  );
}
