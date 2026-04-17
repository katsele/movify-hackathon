import { StatusBadge } from "@/components/StatusBadge";
import { SkillTag } from "@/components/SkillTag";
import { TableCell, TableRow } from "@/components/ui/table";
import type { Consultant } from "@/lib/types";

interface ConsultantRowProps {
  consultant: Consultant;
  skills?: string[];
  seniority?: string;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ConsultantRow({
  consultant,
  skills = [],
  seniority,
}: ConsultantRowProps) {
  return (
    <TableRow>
      <TableCell className="font-medium">{consultant.name}</TableCell>
      <TableCell>
        {seniority && (
          <span className="text-xs text-muted-foreground capitalize">
            {seniority}
          </span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={consultant.current_status} />
      </TableCell>
      <TableCell>
        <span className="text-xs text-muted-foreground">
          {formatDate(consultant.available_from)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {skills.slice(0, 3).map((s) => (
            <SkillTag key={s} name={s} />
          ))}
          {skills.length > 3 && (
            <SkillTag name={`+${skills.length - 3}`} variant="muted" />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
