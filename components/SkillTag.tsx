import { cn } from "@/lib/utils";

interface SkillTagProps {
  name: string;
  variant?: "default" | "muted";
  className?: string;
}

export function SkillTag({
  name,
  variant = "default",
  className,
}: SkillTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[12px] font-medium tracking-[0.01em]",
        variant === "default"
          ? "border-neutral-200 bg-neutral-100 text-neutral-700"
          : "border-neutral-200 bg-neutral-50 text-neutral-500",
        className,
      )}
    >
      {name}
    </span>
  );
}
