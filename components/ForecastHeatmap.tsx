"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ForecastCell } from "@/lib/mock-data";
import type { SignalLookup } from "@/lib/hooks/useSignalsByIds";
import type { SignalSource } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ForecastHeatmapProps {
  cells: ForecastCell[];
  weeks?: number;
  interactive?: boolean;
  signalsById?: Record<string, SignalLookup>;
}

const SOURCE_LABEL: Record<SignalSource, string> = {
  boond_crm: "Pipeline",
  ted_procurement: "TED",
  news_intelligence: "News",
  news: "News",
  google_trends: "Trend",
  ats_greenhouse: "Greenhouse",
  ats_lever: "Lever",
};

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
  signalsById,
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
                        <TooltipContent side="top" className="max-w-xs">
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
                            <ContributingSignalList
                              ids={cell.contributingSignalIds}
                              signalsById={signalsById}
                            />
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

function ContributingSignalList({
  ids,
  signalsById,
}: {
  ids?: string[];
  signalsById?: Record<string, SignalLookup>;
}) {
  if (!ids?.length || !signalsById) return null;
  const resolved = ids
    .map((id) => signalsById[id])
    .filter((s): s is SignalLookup => Boolean(s));
  if (!resolved.length) return null;
  const visible = resolved.slice(0, 3);
  const extra = resolved.length - visible.length;
  return (
    <div className="mt-1 pt-1 border-t border-border/60 text-[11px] space-y-0.5">
      <div className="text-muted-foreground">
        Driven by {resolved.length} signal{resolved.length === 1 ? "" : "s"}:
      </div>
      {visible.map((s) => (
        <div key={s.id} className="flex items-start gap-1.5">
          <span className="inline-block rounded bg-muted px-1 py-px text-[10px] font-medium text-muted-foreground shrink-0">
            {SOURCE_LABEL[s.source] ?? s.source}
          </span>
          <span className="flex-1 truncate">{s.title ?? "—"}</span>
          {s.url ? (
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      ))}
      {extra > 0 && (
        <div className="text-muted-foreground">+{extra} more</div>
      )}
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
