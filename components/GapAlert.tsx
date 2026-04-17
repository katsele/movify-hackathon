import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";
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
  rationale,
  href,
}: GapAlertProps) {
  const severity: "critical" | "warning" =
    gap >= 3 ? "critical" : "warning";
  const borderClass =
    severity === "critical"
      ? "border-l-gap-critical bg-rose-50/40"
      : "border-l-gap-warning bg-amber-50/40";

  const content = (
    <div
      className={cn(
        "p-3 rounded-md border border-l-4 hover:shadow-sm transition-shadow",
        borderClass,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle
            className={cn(
              "h-4 w-4 mt-0.5",
              severity === "critical"
                ? "text-gap-critical"
                : "text-gap-warning",
            )}
          />
          <div>
            <div className="text-sm font-semibold leading-tight">
              {skill}{" "}
              <span className="text-muted-foreground text-xs font-normal">
                · {discipline}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Gap {gap > 0 ? `+${gap}` : gap} · {window}
            </div>
          </div>
        </div>
        <ConfidenceIndicator value={confidence} showLabel={false} />
      </div>
      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
        {rationale}
      </p>
      {href && (
        <div className="flex items-center gap-1 text-xs font-medium mt-2 text-foreground">
          View detail
          <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
