"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterDefinition {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterDefinition[];
  active: Record<string, string | undefined>;
  onChange: (id: string, value: string | undefined) => void;
}

export function FilterBar({ filters, active, onChange }: FilterBarProps) {
  const activeEntries = Object.entries(active).filter(([, v]) => !!v);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {filters.map((f) => (
        <DropdownMenu key={f.id}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-xs">
              {f.label}
              {active[f.id] && (
                <span className="ml-1.5 text-foreground font-semibold">
                  : {f.options.find((o) => o.value === active[f.id])?.label}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => onChange(f.id, undefined)}>
              All
            </DropdownMenuItem>
            {f.options.map((o) => (
              <DropdownMenuItem
                key={o.value}
                onSelect={() => onChange(f.id, o.value)}
              >
                {o.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
      {activeEntries.length > 0 && (
        <div className="flex items-center gap-1.5 ml-1">
          {activeEntries.map(([id, v]) => {
            const def = filters.find((f) => f.id === id);
            const label = def?.options.find((o) => o.value === v)?.label ?? v;
            return (
              <Badge
                key={id}
                variant="secondary"
                className="text-[11px] font-medium"
              >
                {def?.label}: {label}
                <button
                  className="ml-1 inline-flex"
                  onClick={() => onChange(id, undefined)}
                  aria-label={`Clear ${def?.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
