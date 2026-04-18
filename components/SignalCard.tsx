import { ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillTag } from "@/components/SkillTag";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { SIGNAL_ICON, SOURCE_LABEL } from "@/lib/constants/signalIcons";
import type { RecentSignal } from "@/lib/types";

const EUR_COMPACT = new Intl.NumberFormat("en", {
  notation: "compact",
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 1,
});

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

const EVENT_LABEL: Record<string, string> = {
  investment: "Investment",
  hire: "Hire",
  launch: "Launch",
  m_and_a: "M&A",
  layoff: "Layoff",
  partnership: "Partnership",
  restructuring: "Restructuring",
  regulatory: "Regulatory",
};

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

interface SignalCardProps {
  signal: Pick<
    RecentSignal,
    "source" | "title" | "skill_name" | "detected_at" | "confidence"
  > & {
    region?: string | null;
    url?: string | null;
    extra_skills?: string[];
    skill_names?: string[];
    raw_data?: RecentSignal["raw_data"];
    converges_with_sources?: RecentSignal["converges_with_sources"];
    converging_count?: RecentSignal["converging_count"];
  };
}

export function SignalCard({ signal }: SignalCardProps) {
  const meta = SIGNAL_ICON[signal.source];
  const Icon = meta.icon;
  const skills = signal.skill_names?.length
    ? signal.skill_names
    : [signal.skill_name, ...(signal.extra_skills ?? [])].filter(Boolean);
  const client = signal.raw_data?.client;
  const eventType = signal.raw_data?.event_type;
  const outlet = signal.raw_data?.outlet;
  const cpvCode = signal.raw_data?.cpv_code;
  const cpvLabel = signal.raw_data?.cpv_label;
  const valueEur = signal.raw_data?.value_estimate_eur;
  const deadline = signal.raw_data?.deadline;
  const convergingCount = signal.converging_count ?? 0;
  const convergesWith =
    signal.converges_with_sources?.map(
      (s) => SOURCE_LABEL[s] ?? s,
    ) ?? [];
  const showEventChip = Boolean(eventType) && eventType !== "procurement";
  const sourceHost = signal.url ? safeHost(signal.url) : null;
  const sourceLabel = outlet ?? sourceHost;

  const title = signal.url ? (
    <a
      href={signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-start gap-1 hover:underline underline-offset-2"
    >
      <span>{signal.title}</span>
      <ExternalLink
        className="h-3 w-3 mt-1 shrink-0 text-neutral-500"
        strokeWidth={1.75}
      />
    </a>
  ) : (
    signal.title
  );

  const hasChipRow =
    client || showEventChip || convergingCount > 0 || cpvCode || valueEur;
  const formattedValue =
    typeof valueEur === "number" ? EUR_COMPACT.format(valueEur) : null;
  const formattedDeadline = deadline ? formatDeadline(deadline) : null;

  return (
    <div
      className={cn(
        "p-3 rounded-md border border-neutral-200 bg-white hover:shadow-sm transition-shadow",
        convergingCount > 0 &&
          "ring-1 ring-signal-watch/40 border-signal-watch/30",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md shrink-0",
            meta.tone,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase font-medium text-neutral-500 tracking-wide">
            <span>{meta.label}</span>
            {sourceLabel && (
              <>
                <span>·</span>
                {signal.url ? (
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="normal-case tracking-normal hover:underline underline-offset-2 text-neutral-700"
                  >
                    {sourceLabel}
                  </a>
                ) : (
                  <span className="normal-case tracking-normal">
                    {sourceLabel}
                  </span>
                )}
              </>
            )}
            {signal.region && (
              <>
                <span>·</span>
                <span className="capitalize">{signal.region}</span>
              </>
            )}
            <span>·</span>
            <span className="font-mono tabular normal-case tracking-normal">
              {timeAgo(signal.detected_at)}
            </span>
            {formattedDeadline && (
              <>
                <span>·</span>
                <span className="normal-case tracking-normal">
                  Deadline{" "}
                  <span className="font-mono tabular">
                    {formattedDeadline}
                  </span>
                </span>
              </>
            )}
          </div>
          <div className="text-sm font-medium mt-0.5 leading-tight text-neutral-800">
            {title}
          </div>
          {hasChipRow && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {convergingCount > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-md border border-signal-watch/30 bg-signal-watch/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal-watch"
                  title={
                    convergesWith.length > 0
                      ? `Converges with ${convergesWith.join(" + ")}`
                      : "Converges with other signals"
                  }
                >
                  <Zap className="h-3 w-3" strokeWidth={1.75} />
                  <span>
                    Converging ·{" "}
                    <span className="font-mono tabular">{convergingCount}</span>
                  </span>
                </span>
              )}
              {client && (
                <span className="inline-flex items-center rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-700">
                  {client}
                </span>
              )}
              {showEventChip && eventType && (
                <span className="inline-flex items-center rounded-md border border-signal-watch/30 bg-signal-watch/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-signal-watch">
                  {EVENT_LABEL[eventType] ?? eventType}
                </span>
              )}
              {cpvCode && (
                <span
                  className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-neutral-600 font-mono tabular"
                  title={cpvLabel ?? undefined}
                >
                  CPV {cpvCode}
                </span>
              )}
              {formattedValue && (
                <span className="ml-auto text-[11px] font-medium text-neutral-500 font-mono tabular">
                  {formattedValue}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {skills.map((s) => (
              <SkillTag key={s} name={s} />
            ))}
          </div>
          <div className="mt-2">
            <ConfidenceIndicator value={signal.confidence} />
          </div>
        </div>
      </div>
    </div>
  );
}
