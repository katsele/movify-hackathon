import { cn } from "@/lib/utils";
import type { ConsultantStatus } from "@/lib/types";

const STATUS_META: Record<
  ConsultantStatus,
  { label: string; dot: string; text: string }
> = {
  on_mission: {
    label: "On mission",
    dot: "bg-signal-procurement",
    text: "text-signal-procurement",
  },
  on_bench: {
    label: "On bench",
    dot: "bg-signal-covered",
    text: "text-signal-covered",
  },
  rolling_off: {
    label: "Rolling off",
    dot: "bg-signal-watch",
    text: "text-signal-watch",
  },
};

interface StatusBadgeProps {
  status: ConsultantStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        meta.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </span>
  );
}
