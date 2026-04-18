import Link from "next/link";
import { AlertTriangle, CircleDot, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";

interface GapAlertProps {
  skill: string;
  discipline: string;
  gap: number;
  window: string;
  confidence: number;
  rationale: string;
  href?: string;
}

export function GapAlert({
  skill,
  discipline,
  gap,
  window,
  confidence,
  href,
}: GapAlertProps) {
  const severity: "critical" | "warning" = gap >= 3 ? "critical" : "warning";

  const icon =
    severity === "critical" ? (
      <AlertTriangle
        className="h-3.5 w-3.5 shrink-0 text-signal-gap"
        strokeWidth={1.75}
      />
    ) : (
      <CircleDot
        className="h-3.5 w-3.5 shrink-0 text-signal-watch"
        strokeWidth={1.75}
      />
    );

  const gapBadge = (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold font-mono tabular",
        severity === "critical"
          ? "bg-signal-gap/10 text-signal-gap"
          : "bg-signal-watch/10 text-signal-watch",
      )}
    >
      +{gap}
    </span>
  );

  const row = (
    <div className="flex items-center gap-2 py-2 px-1 rounded hover:bg-neutral-100/60 transition-colors group">
      {icon}
      <span className="text-sm font-medium leading-none text-neutral-800">
        {skill}
      </span>
      <span className="text-xs text-neutral-500 leading-none">
        {discipline}
      </span>
      <span className="text-xs text-neutral-400 leading-none">·</span>
      <span className="text-xs text-neutral-500 leading-none font-mono tabular">
        {window}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {gapBadge}
        <ConfidenceIndicator value={confidence} showLabel={false} />
        {href && (
          <ArrowRight
            className="h-3 w-3 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity"
            strokeWidth={1.75}
          />
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{row}</Link> : row;
}
