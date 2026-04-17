import {
  Building2,
  LineChart,
  Newspaper,
  Radio,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SkillTag } from "@/components/SkillTag";
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
};

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
    extra_skills?: string[];
  };
}

export function SignalCard({ signal }: SignalCardProps) {
  const meta = SOURCE_META[signal.source];
  const Icon = meta.icon;
  const skills = [signal.skill_name, ...(signal.extra_skills ?? [])];

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
            {signal.title}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {skills.map((s) => (
              <SkillTag key={s} name={s} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
