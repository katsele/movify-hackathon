import { ExternalLink } from "lucide-react";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { SkillTag } from "@/components/SkillTag";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SIGNAL_ICON, SOURCE_LABEL } from "@/lib/constants/signalIcons";
import type { RecentSignal } from "@/lib/types";

const EUR_FULL = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatDateTime(iso: string): string | null {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function formatDeadline(iso: string): string | null {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function MetaItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="space-y-1 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
      <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </div>
      <div className="text-sm text-neutral-800">{value}</div>
    </div>
  );
}

export function SignalDetailPanel({
  signal,
  debug = false,
}: {
  signal?: RecentSignal;
  debug?: boolean;
}) {
  if (!signal) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Signal detail</CardTitle>
          <CardDescription>
            Inspect one signal here after selecting it from the explorer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-[320px] items-center justify-center">
          <div className="max-w-sm text-center">
            <p className="text-sm font-medium text-neutral-800">
              No signal selected
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Choose a signal from the list, or adjust the filters to bring one
              back into view.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const meta = SIGNAL_ICON[signal.source];
  const Icon = meta.icon;
  const detectedAt = formatDateTime(signal.detected_at);
  const outlet = signal.raw_data?.outlet ?? safeHost(signal.url ?? "");
  const client = signal.raw_data?.client;
  const region = signal.region
    ? signal.region.charAt(0).toUpperCase() + signal.region.slice(1)
    : null;
  const summary = signal.raw_data?.summary;
  const valueEur = signal.raw_data?.value_estimate_eur;
  const formattedValue =
    typeof valueEur === "number" ? EUR_FULL.format(valueEur) : null;
  const deadline = signal.raw_data?.deadline
    ? formatDeadline(signal.raw_data.deadline)
    : null;
  const skills = (signal.skill_names?.length
    ? signal.skill_names
    : [signal.skill_name]
  ).filter(Boolean);
  const skillPairs = skills.map((name, index) => ({
    name,
    confidence: signal.confidences?.[index] ?? signal.confidence,
  }));
  const convergesWith =
    signal.converges_with_sources?.map((source) => SOURCE_LABEL[source]) ?? [];
  const hasProcurementMeta = Boolean(
    signal.raw_data?.cpv_code ||
      signal.raw_data?.cpv_label ||
      formattedValue ||
      deadline ||
      signal.raw_data?.contracting_authority ||
      signal.raw_data?.publication_number,
  );

  return (
    <Card className="h-full">
      <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${meta.tone}`}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <CardTitle className="leading-tight">
                {signal.title ?? "Untitled signal"}
              </CardTitle>
              <CardDescription className="mt-1">
                {SOURCE_LABEL[signal.source]} signal
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SkillTag name={signal.discipline} variant="muted" />
            <ConfidenceIndicator value={signal.confidence} />
          </div>
        </div>
        {signal.url && (
          <Button asChild variant="outline" size="sm">
            <a href={signal.url} target="_blank" rel="noopener noreferrer">
              View source
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetaItem label="Detected" value={detectedAt} />
          <MetaItem label="Source" value={SOURCE_LABEL[signal.source]} />
          <MetaItem label="Outlet" value={outlet} />
          <MetaItem label="Client" value={client} />
          <MetaItem label="Region" value={region} />
        </div>

        {summary && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-800">Summary</h3>
            <p className="text-sm leading-6 text-neutral-600">{summary}</p>
          </section>
        )}

        {skillPairs.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-800">
              Detected skills
            </h3>
            <div className="space-y-2">
              {skillPairs.map((pair) => (
                <div
                  key={pair.name}
                  className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2"
                >
                  <SkillTag name={pair.name} />
                  <ConfidenceIndicator value={pair.confidence} />
                </div>
              ))}
            </div>
          </section>
        )}

        {(signal.converging_count || convergesWith.length > 0) && (
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-neutral-800">
              Convergence
            </h3>
            <div className="rounded-md border border-signal-watch/30 bg-signal-watch/10 px-3 py-2 text-sm text-neutral-700">
              <p>
                {signal.converging_count
                  ? `${signal.converging_count} supporting signal${signal.converging_count === 1 ? "" : "s"} matched this theme.`
                  : "Supporting signals matched this theme."}
              </p>
              {convergesWith.length > 0 && (
                <p className="mt-1 text-neutral-600">
                  Cross-source support from {convergesWith.join(", ")}.
                </p>
              )}
            </div>
          </section>
        )}

        {hasProcurementMeta && (
          <section className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-800">
              Procurement metadata
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <MetaItem label="CPV code" value={signal.raw_data?.cpv_code} />
              <MetaItem label="CPV label" value={signal.raw_data?.cpv_label} />
              <MetaItem label="Estimated value" value={formattedValue} />
              <MetaItem label="Deadline" value={deadline} />
              <MetaItem
                label="Contracting authority"
                value={signal.raw_data?.contracting_authority}
              />
              <MetaItem
                label="Publication number"
                value={signal.raw_data?.publication_number}
              />
            </div>
          </section>
        )}

        {debug && signal.raw_data && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              raw_data
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto rounded bg-neutral-100 p-3 text-[11px] leading-tight text-neutral-800">
              {JSON.stringify(signal.raw_data, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
