import { cn } from "@/lib/utils";
import type { ConsultantStatus } from "@/lib/types";

const STATUS_META: Record<
  ConsultantStatus,
  { label: string; dot: string; text: string }
> = {
  on_mission: {
    label: "On mission",
    dot: "bg-blue-500",
    text: "text-blue-700",
  },
  on_bench: {
    label: "On bench",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
  },
  rolling_off: {
    label: "Rolling off",
    dot: "bg-amber-500",
    text: "text-amber-700",
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
