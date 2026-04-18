import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  accent?: "default" | "critical" | "warning" | "covered";
}

const ACCENT_CLASS: Record<NonNullable<KPICardProps["accent"]>, string> = {
  default: "",
  critical: "border-l-4 border-l-signal-gap",
  warning: "border-l-4 border-l-signal-watch",
  covered: "border-l-4 border-l-signal-covered",
};

export function KPICard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  accent = "default",
}: KPICardProps) {
  const isPositive = typeof delta === "number" && delta >= 0;
  return (
    <Card className={cn(ACCENT_CLASS[accent])}>
      <CardContent className="p-4">
        <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.05em]">
          {label}
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="kpi-number font-mono text-[28px] font-medium leading-none tracking-tight text-neutral-800">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-neutral-500">{unit}</span>
          )}
        </div>
        {typeof delta === "number" && (
          <div
            className={cn(
              "mt-2 inline-flex items-center text-xs font-medium tabular",
              isPositive ? "text-signal-covered" : "text-signal-gap",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" strokeWidth={1.75} />
            ) : (
              <ArrowDownRight
                className="h-3.5 w-3.5 mr-0.5"
                strokeWidth={1.75}
              />
            )}
            <span className="font-mono">
              {Math.abs(delta)}%{deltaLabel ? ` ${deltaLabel}` : ""}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
