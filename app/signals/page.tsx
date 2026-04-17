"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar, type FilterDefinition } from "@/components/FilterBar";
import { SignalCard } from "@/components/SignalCard";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_SIGNALS } from "@/lib/mock-data";

const FILTERS: FilterDefinition[] = [
  {
    id: "source",
    label: "Source",
    options: [
      { value: "ted_procurement", label: "Procurement" },
      { value: "google_trends", label: "Google Trends" },
      { value: "ats_greenhouse", label: "Job postings" },
    ],
  },
  {
    id: "discipline",
    label: "Discipline",
    options: [
      { value: "Web Development", label: "Web Development" },
      { value: "AI/ML", label: "AI/ML" },
      { value: "Data", label: "Data" },
      { value: "Design", label: "Design" },
    ],
  },
];

export default function SignalsPage() {
  const [active, setActive] = useState<Record<string, string | undefined>>({});

  const filtered = MOCK_SIGNALS.filter((s) => {
    if (active.source && s.source !== active.source) return false;
    if (active.discipline && s.discipline !== active.discipline) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Signals"
        subtitle="Every ingested market intelligence signal, filterable."
        lastUpdated="2 hours ago"
      />
      <FilterBar
        filters={FILTERS}
        active={active}
        onChange={(id, value) => setActive((p) => ({ ...p, [id]: value }))}
      />
      <Card>
        <CardContent className="space-y-2 pt-4">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No signals match the current filters.
            </p>
          )}
          {filtered.map((s) => (
            <SignalCard key={s.title ?? ""} signal={s} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
