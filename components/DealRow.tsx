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
  prospect: "text-neutral-600 bg-neutral-100",
  proposal: "text-signal-procurement bg-signal-procurement/10",
  negotiation: "text-signal-trend bg-signal-trend/10",
  won: "text-signal-covered bg-signal-covered/10",
  lost: "text-neutral-500 bg-neutral-100 line-through",
};

export function DealRow({ deal, requestedSkills = [] }: DealRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium text-neutral-800">
        {deal.title}
      </TableCell>
      <TableCell>
        <span className="text-xs text-neutral-500">
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
        <span className="text-xs font-medium font-mono tabular text-neutral-700">
          {Math.round(deal.probability * 100)}%
        </span>
      </TableCell>
      <TableCell>
        <span className="text-xs text-neutral-500 font-mono tabular">
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
