import { cn } from "@/lib/utils";

interface ConfidenceIndicatorProps {
  value: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * Confidence is triple-coded per UX spec §6.6:
 *   (a) opacity on the bars (via tone),
 *   (b) a short pill label ("72% conf."),
 *   (c) border style — solid (high), dotted (medium), dashed (low).
 */
export function ConfidenceIndicator({
  value,
  showLabel = true,
  className,
}: ConfidenceIndicatorProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const filled = Math.round(clamped * 4);
  const high = clamped >= 0.75;
  const mid = !high && clamped >= 0.5;

  const barTone = high
    ? "bg-signal-covered"
    : mid
      ? "bg-neutral-500"
      : "bg-neutral-300";
  const emptyTone = "bg-neutral-200";
  const labelTone = high
    ? "text-signal-covered border-signal-covered/40"
    : mid
      ? "text-neutral-700 border-neutral-300"
      : "text-neutral-500 border-neutral-300";
  const labelBorderStyle = high
    ? "border-solid"
    : mid
      ? "border-dotted"
      : "border-dashed";

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex gap-0.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "block w-1 rounded-full",
              i < filled ? barTone : emptyTone,
              i === 0
                ? "h-2"
                : i === 1
                  ? "h-2.5"
                  : i === 2
                    ? "h-3"
                    : "h-3.5",
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span
          className={cn(
            "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium font-mono tabular leading-4",
            labelBorderStyle,
            labelTone,
          )}
        >
          {Math.round(clamped * 100)}% conf.
        </span>
      )}
    </div>
  );
}
