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
import { MOCK_CONSULTANTS, MOCK_DEALS } from "@/lib/mock-data";

const CONSULTANT_SKILLS: Record<string, string[]> = {
  c1: ["React", "Next.js", "TypeScript"],
  c2: ["Node.js", "GraphQL", "AWS"],
  c3: ["AI Engineering", "LangChain", "Python"],
  c4: ["Service Design", "Figma", "Workshop facilitation"],
  c5: ["dbt", "Snowflake", "Python"],
};

const CONSULTANT_SENIORITY: Record<string, string> = {
  c1: "senior",
  c2: "expert",
  c3: "mid",
  c4: "senior",
  c5: "mid",
};

const DEAL_SKILLS: Record<string, string[]> = {
  d1: ["React", "Node.js", "TypeScript"],
  d2: ["AI Engineering", "LangChain"],
  d3: ["dbt", "Snowflake", "Python"],
};

export default function BenchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bench"
        subtitle="Current consultant status + active pipeline deals."
        lastUpdated="4 hours ago"
      />

      <Card>
        <CardHeader>
          <CardTitle>Consultants</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
              {MOCK_CONSULTANTS.map((c) => (
                <ConsultantRow
                  key={c.id}
                  consultant={c}
                  skills={CONSULTANT_SKILLS[c.id]}
                  seniority={CONSULTANT_SENIORITY[c.id]}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline deals</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
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
              {MOCK_DEALS.map((d) => (
                <DealRow
                  key={d.id}
                  deal={d}
                  requestedSkills={DEAL_SKILLS[d.id] ?? []}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
