import { cn } from "@/lib/utils";

interface SkillTagProps {
  name: string;
  variant?: "default" | "muted";
  className?: string;
}

export function SkillTag({ name, variant = "default", className }: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variant === "default"
          ? "bg-slate-100 text-slate-700"
          : "bg-slate-50 text-slate-500",
        className,
      )}
    >
      {name}
    </span>
  );
}
