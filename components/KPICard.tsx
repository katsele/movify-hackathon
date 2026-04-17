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
  critical: "border-l-4 border-l-gap-critical",
  warning: "border-l-4 border-l-gap-warning",
  covered: "border-l-4 border-l-gap-covered",
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
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[28px] font-bold leading-none tracking-tight">
            {value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {typeof delta === "number" && (
          <div
            className={cn(
              "mt-2 inline-flex items-center text-xs font-medium",
              isPositive ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-0.5" />
            )}
            {Math.abs(delta)}%{deltaLabel ? ` ${deltaLabel}` : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
