"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatSignedConsultantGap,
  roundConsultantCount,
} from "@/lib/consultant-counts";
import { monthLabel, summarizeForecastCells } from "@/lib/forecast-display";
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
  months?: number;
  interactive?: boolean;
  signalsById?: Record<string, SignalLookup>;
  limitSkills?: number;
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
  months = 12,
  interactive = true,
  signalsById,
  limitSkills,
}: ForecastHeatmapProps) {
  const displayCells = cells.map((cell) => ({
    ...cell,
    demand: roundConsultantCount(cell.demand),
    supply: roundConsultantCount(cell.supply),
    gap: roundConsultantCount(cell.gap),
  }));
  const visibleRows = summarizeForecastCells(displayCells, months);
  const rows =
    typeof limitSkills === "number"
      ? visibleRows.slice(0, limitSkills)
      : visibleRows;

  const monthHeaders = Array.from({ length: months }, (_, i) => ({
    offset: i + 1,
    label: monthLabel(i + 1),
  }));

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
        No forecastable skills matched this filter window yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-transparent text-left font-medium text-neutral-500 pr-3 min-w-[180px]">
              Skill
            </th>
            {monthHeaders.map(({ offset, label }) => (
              <th
                key={offset}
                className="text-center font-mono text-[11px] font-normal text-neutral-500 w-10 tabular"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((skill) => {
            return (
              <tr key={skill.skill}>
                <td className="sticky left-0 bg-neutral-50 pr-3 py-1 text-left align-middle">
                  <div className="font-medium text-neutral-800 leading-tight">
                    {skill.skill}
                  </div>
                  <div className="text-[10px] text-neutral-500 leading-tight">
                    {skill.discipline}
                  </div>
                </td>
                {skill.cells.map((cell) => {
                  const cellMonth = monthLabel(cell.month);
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
                      {formatSignedConsultantGap(cell.gap)}
                    </div>
                  );
                  return (
                    <td key={cell.month} className="p-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {interactive ? (
                            <Link
                              href={`/forecast/${encodeURIComponent(skill.skill)}`}
                              aria-label={`${skill.skill} ${cellMonth}`}
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
                              {skill.skill} · {cellMonth}
                            </div>
                            <div className="tabular">
                              Predicted consultants:{" "}
                              <span className="font-mono">{cell.demand}</span>
                            </div>
                            <div className="tabular">
                              Available consultants:{" "}
                              <span className="font-mono">{cell.supply}</span>
                            </div>
                            <div className="tabular">
                              Gap:{" "}
                              <span className="font-mono font-semibold">
                                {formatSignedConsultantGap(cell.gap)}
                              </span>
                            </div>
                            <div className="tabular">
                              Confidence:{" "}
                              <span className="font-mono">
                                {Math.round(cell.confidence * 100)}%
                              </span>
                            </div>
                            <ContributingSignalList
                              ids={cell.contributingSignalIds}
                              signalsById={signalsById}
                            />
                            {cell.notes && (
                              <div className="mt-1 border-t border-border/60 pt-1 text-[11px] text-muted-foreground">
                                {cell.notes}
                              </div>
                            )}
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
    <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-neutral-500">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-gap" />
        Consultant gap ≥ 3 — act now
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-watch" />
        Gap 1–3 — watch
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-covered" />
        Covered or surplus
      </div>
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-signal-gap hatched" />
        Low confidence
      </div>
    </div>
  );
}
