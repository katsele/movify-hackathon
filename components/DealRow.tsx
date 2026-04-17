import { SkillTag } from "@/components/SkillTag";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Deal } from "@/lib/types";

interface DealRowProps {
  deal: Deal;
  requestedSkills?: string[];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

const STATUS_STYLE: Record<Deal["status"], string> = {
  prospect: "text-slate-600 bg-slate-100",
  proposal: "text-blue-700 bg-blue-50",
  negotiation: "text-violet-700 bg-violet-50",
  won: "text-emerald-700 bg-emerald-50",
  lost: "text-slate-500 bg-slate-100 line-through",
};

export function DealRow({ deal, requestedSkills = [] }: DealRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{deal.title}</TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {deal.client_name ?? "—"}
        </span>
      </TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
            STATUS_STYLE[deal.status],
          )}
        >
          {deal.status}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs font-medium">
          {Math.round(deal.probability * 100)}%
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {formatDate(deal.expected_start)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {requestedSkills.slice(0, 3).map((s) => (
            <SkillTag key={s} name={s} />
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}
