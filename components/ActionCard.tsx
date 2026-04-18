import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionCardProps {
  title: string;
  explanation: string;
  primaryAction?: { label: string; onClick?: () => void };
  secondaryAction?: { label: string; onClick?: () => void };
}

export function ActionCard({
  title,
  explanation,
  primaryAction,
  secondaryAction,
}: ActionCardProps) {
  return (
    <div className="p-4 rounded-md border border-signal-watch/30 bg-signal-watch/5">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-signal-watch/10 text-signal-watch shrink-0">
          <Lightbulb className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-neutral-800">{title}</div>
          <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
            {explanation}
          </p>
          {(primaryAction || secondaryAction) && (
            <div className="flex gap-2 mt-3">
              {primaryAction && (
                <Button size="sm" onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </Button>
              )}
              {secondaryAction && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={secondaryAction.onClick}
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
