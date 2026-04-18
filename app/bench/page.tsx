"use client";

import { PageHeader } from "@/components/PageHeader";
import { ConsultantRow } from "@/components/ConsultantRow";
import { DealRow } from "@/components/DealRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useConsultants, useDeals } from "@/lib/hooks/useBench";
import { useConsultantSkills } from "@/lib/hooks/useConsultantSkills";
import { useDealProfiles } from "@/lib/hooks/useDealProfiles";
import type { Seniority } from "@/lib/types";

const SENIORITY_RANK: Record<Seniority, number> = {
  junior: 0,
  mid: 1,
  senior: 2,
  expert: 3,
};

function topSeniority(profs: Seniority[] | undefined): Seniority | undefined {
  if (!profs?.length) return undefined;
  return profs.reduce((top, next) =>
    SENIORITY_RANK[next] > SENIORITY_RANK[top] ? next : top,
  );
}

export default function BenchPage() {
  const consultants = useConsultants();
  const deals = useDeals();
  const consultantSkills = useConsultantSkills();
  const dealProfiles = useDealProfiles();

  const loading =
    consultants.isLoading ||
    deals.isLoading ||
    consultantSkills.isLoading ||
    dealProfiles.isLoading;
  const errored =
    consultants.error ??
    deals.error ??
    consultantSkills.error ??
    dealProfiles.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bench"
        subtitle="Current consultant status + active pipeline deals."
      />

      {errored && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600">
            Failed to load: {errored.message}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Consultants</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading && !consultants.data && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {consultants.data && consultants.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No consultants yet. Run{" "}
              <code>python workers/run_connector.py boond</code> to pull live
              data.
            </p>
          )}
          {consultants.data && consultants.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Seniority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Available from</TableHead>
                  <TableHead>Top skills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultants.data.map((c) => {
                  const rows = consultantSkills.data?.[c.id] ?? [];
                  return (
                    <ConsultantRow
                      key={c.id}
                      consultant={c}
                      skills={rows.map((r) => r.name)}
                      seniority={topSeniority(rows.map((r) => r.proficiency))}
                    />
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline deals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {loading && !deals.data && (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
          {deals.data && deals.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No open deals in the pipeline.
            </p>
          )}
          {deals.data && deals.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Expected start</TableHead>
                  <TableHead>Profiles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deals.data.map((d) => (
                  <DealRow
                    key={d.id}
                    deal={d}
                    requestedSkills={(dealProfiles.data?.[d.id] ?? []).map(
                      (p) => p.name,
                    )}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
