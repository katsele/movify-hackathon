import {
  Building2,
  ExternalLink,
  LineChart,
  Newspaper,
  Radio,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillTag } from "@/components/SkillTag";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import type { RecentSignal, SignalSource } from "@/lib/types";

const SOURCE_META: Record<
  SignalSource,
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  ted_procurement: {
    label: "Procurement",
    icon: Building2,
    tone: "text-signal-procurement bg-blue-50",
  },
  google_trends: {
    label: "Trend",
    icon: TrendingUp,
    tone: "text-signal-trend bg-violet-50",
  },
  ats_greenhouse: {
    label: "Posting",
    icon: LineChart,
    tone: "text-signal-posting bg-cyan-50",
  },
  ats_lever: {
    label: "Posting",
    icon: LineChart,
    tone: "text-signal-posting bg-cyan-50",
  },
  boond_crm: {
    label: "Pipeline",
    icon: Radio,
    tone: "text-signal-pipeline bg-emerald-50",
  },
  news: {
    label: "News",
    icon: Newspaper,
    tone: "text-signal-news bg-slate-100",
  },
  news_intelligence: {
    label: "News",
    icon: Newspaper,
    tone: "text-amber-700 bg-amber-50",
  },
};

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
  };
}

export function SignalCard({ signal }: SignalCardProps) {
  const meta = SOURCE_META[signal.source];
  const Icon = meta.icon;
  const skills = signal.skill_names?.length
    ? signal.skill_names
    : [signal.skill_name, ...(signal.extra_skills ?? [])].filter(Boolean);
  const client = signal.raw_data?.client;
  const eventType = signal.raw_data?.event_type;
  const outlet = signal.raw_data?.outlet;
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
      <ExternalLink className="h-3 w-3 mt-1 shrink-0 text-muted-foreground" />
    </a>
  ) : (
    signal.title
  );

  return (
    <div className="p-3 rounded-md border bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md shrink-0",
            meta.tone,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase font-medium text-muted-foreground tracking-wide">
            <span>{meta.label}</span>
            {sourceLabel && (
              <>
                <span>·</span>
                {signal.url ? (
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="normal-case tracking-normal hover:underline underline-offset-2 text-slate-700"
                  >
                    {sourceLabel}
                  </a>
                ) : (
                  <span className="normal-case tracking-normal">{sourceLabel}</span>
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
            <span>{timeAgo(signal.detected_at)}</span>
          </div>
          <div className="text-sm font-medium mt-0.5 leading-tight">
            {title}
          </div>
          {(client || eventType) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {client && (
                <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                  {client}
                </span>
              )}
              {eventType && (
                <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                  {EVENT_LABEL[eventType] ?? eventType}
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
