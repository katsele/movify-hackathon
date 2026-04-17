import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  value: number;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceIndicator({
  value,
  showLabel = true,
  className,
}: ConfidenceIndicatorProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * 4);
  const level =
    clamped >= 0.75 ? "High" : clamped >= 0.5 ? "Medium" : "Low";
  const tone =
    clamped >= 0.75
      ? "text-emerald-700"
      : clamped >= 0.5
        ? "text-slate-600"
        : "text-slate-400";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "block w-1 rounded-full",
              i < filled
                ? clamped >= 0.75
                  ? "bg-emerald-500"
                  : clamped >= 0.5
                    ? "bg-slate-500"
                    : "bg-slate-300"
                : "bg-slate-200",
              i === 0 ? "h-2" : i === 1 ? "h-2.5" : i === 2 ? "h-3" : "h-3.5",
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", tone)}>{level}</span>
      )}
    </div>
  );
}
