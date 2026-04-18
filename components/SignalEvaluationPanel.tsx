// Temporary raw-signal inspection panel. Remove when Story 5 forecast
// drill-down ships ("which signals contributed to this forecast cell").
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkillTag } from "@/components/SkillTag";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import type { RecentSignal, SignalSource } from "@/lib/types";

const TAB_ORDER: { source: SignalSource; label: string }[] = [
  { source: "news_intelligence", label: "News" },
  { source: "news", label: "News (legacy)" },
  { source: "ted_procurement", label: "Procurement" },
  { source: "google_trends", label: "Trends" },
  { source: "ats_greenhouse", label: "Postings (Greenhouse)" },
  { source: "ats_lever", label: "Postings (Lever)" },
  { source: "boond_crm", label: "Pipeline" },
];

export function SignalEvaluationPanel({ signals }: { signals: RecentSignal[] }) {
  const bySource = groupBySource(signals);
  // Rank each tab's signals by triage score (desc) so the strongest show first.
  for (const key of Object.keys(bySource) as SignalSource[]) {
    bySource[key].sort(
      (a, b) => (b.raw_data?.score ?? 0) - (a.raw_data?.score ?? 0),
    );
  }
  const visibleTabs = TAB_ORDER.filter((t) => (bySource[t.source]?.length ?? 0) > 0);

  if (visibleTabs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No signals loaded yet. Run a connector to populate the evaluation view.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Evaluation (temporary) — raw signal inspection. Browse everything the
        connectors loaded, grouped by source. Removed once the forecast
        drill-down ships.
      </p>
      <Tabs defaultValue={visibleTabs[0].source}>
        <TabsList>
          {visibleTabs.map((t) => (
            <TabsTrigger key={t.source} value={t.source}>
              {t.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                {bySource[t.source].length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        {visibleTabs.map((t) => (
          <TabsContent key={t.source} value={t.source} className="space-y-3">
            {bySource[t.source].map((signal, i) => (
              <SignalDetail
                key={signal.signal_id ?? `${t.source}-${i}`}
                signal={signal}
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function groupBySource(signals: RecentSignal[]): Record<SignalSource, RecentSignal[]> {
  const out = {} as Record<SignalSource, RecentSignal[]>;
  for (const s of signals) {
    (out[s.source] ??= []).push(s);
  }
  return out;
}

function scoreTone(score: number): string {
  if (score >= 0.75) return "bg-signal-covered/10 text-signal-covered";
  if (score >= 0.5) return "bg-signal-watch/10 text-signal-watch";
  return "bg-neutral-200 text-neutral-700";
}

function SignalDetail({ signal }: { signal: RecentSignal }) {
  const outlet = signal.raw_data?.outlet;
  const client = signal.raw_data?.client;
  const events = signal.raw_data?.matched_events ?? [];
  const summary = signal.raw_data?.summary;
  const score = signal.raw_data?.score;
  const tier = signal.raw_data?.priors_tier;
  const skillPairs = (signal.skill_names ?? [signal.skill_name]).map((name, i) => ({
    name,
    confidence: signal.confidences?.[i] ?? signal.confidence,
  }));

  return (
    <div className="rounded-md border bg-white p-3 space-y-2">
      <div className="flex items-center gap-2 text-[11px] uppercase font-medium text-muted-foreground tracking-wide">
        {typeof score === "number" && (
          <span
            className={`normal-case tracking-normal rounded-md px-1.5 py-0.5 font-semibold ${scoreTone(score)}`}
            title={tier ? `priors tier: ${tier}` : undefined}
          >
            score {score.toFixed(2)}
          </span>
        )}
        {outlet && <span className="normal-case tracking-normal">{outlet}</span>}
        {outlet && signal.region && <span>·</span>}
        {signal.region && <span className="capitalize">{signal.region}</span>}
        <span>·</span>
        <span className="normal-case tracking-normal">
          {new Date(signal.detected_at).toLocaleString()}
        </span>
      </div>
      <div className="text-sm font-medium leading-tight">
        {signal.url ? (
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline underline-offset-2"
          >
            {signal.title}
          </a>
        ) : (
          signal.title
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {client && (
          <span className="inline-flex items-center rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700">
            {client}
          </span>
        )}
        {events.map((e) => (
          <span
            key={e}
            className="inline-flex items-center rounded-md border border-signal-watch/30 bg-signal-watch/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal-watch"
          >
            {e}
          </span>
        ))}
      </div>
      {summary && (
        <p className="text-xs text-muted-foreground leading-snug">{summary}</p>
      )}
      {skillPairs.length > 0 && (
        <div className="space-y-1">
          {skillPairs.map((p) => (
            <div key={p.name} className="flex items-center justify-between gap-3">
              <SkillTag name={p.name} />
              <ConfidenceIndicator value={p.confidence} />
            </div>
          ))}
        </div>
      )}
      {signal.raw_data && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            raw_data
          </summary>
          <pre className="mt-1 max-h-64 overflow-auto rounded bg-neutral-100 p-2 text-[11px] leading-tight text-neutral-800 font-mono">
            {JSON.stringify(signal.raw_data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
