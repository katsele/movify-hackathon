import {
  FileText,
  TrendingUp,
  Briefcase,
  GitBranch,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import type { SignalSource } from "@/lib/types";

/**
 * Locked signal-source icon + colour mapping (UX spec §9).
 * Do not diverge — this is the single source of truth consumed by SignalCard,
 * SignalWeightChart, and any signal-source chip across the product.
 */
export interface SignalIconMeta {
  icon: LucideIcon;
  label: string;
  /** Tailwind background + text tint for the icon chip. */
  tone: string;
  /** Solid colour token for chart marks / legend swatches. */
  solidBg: string;
  solidText: string;
}

export const SIGNAL_ICON: Record<SignalSource, SignalIconMeta> = {
  ted_procurement: {
    icon: FileText,
    label: "Procurement",
    tone: "bg-signal-procurement/10 text-signal-procurement",
    solidBg: "bg-signal-procurement",
    solidText: "text-signal-procurement",
  },
  google_trends: {
    icon: TrendingUp,
    label: "Trend",
    tone: "bg-signal-trend/10 text-signal-trend",
    solidBg: "bg-signal-trend",
    solidText: "text-signal-trend",
  },
  ats_greenhouse: {
    icon: Briefcase,
    label: "Posting",
    tone: "bg-signal-posting/10 text-signal-posting",
    solidBg: "bg-signal-posting",
    solidText: "text-signal-posting",
  },
  ats_lever: {
    icon: Briefcase,
    label: "Posting",
    tone: "bg-signal-posting/10 text-signal-posting",
    solidBg: "bg-signal-posting",
    solidText: "text-signal-posting",
  },
  boond_crm: {
    icon: GitBranch,
    label: "Pipeline",
    tone: "bg-signal-covered/10 text-signal-covered",
    solidBg: "bg-signal-covered",
    solidText: "text-signal-covered",
  },
  news: {
    icon: Newspaper,
    label: "News",
    tone: "bg-signal-trend/10 text-signal-trend",
    solidBg: "bg-signal-trend",
    solidText: "text-signal-trend",
  },
  news_intelligence: {
    icon: Newspaper,
    label: "News",
    tone: "bg-signal-trend/10 text-signal-trend",
    solidBg: "bg-signal-trend",
    solidText: "text-signal-trend",
  },
};

export const SOURCE_LABEL: Record<SignalSource, string> = Object.fromEntries(
  Object.entries(SIGNAL_ICON).map(([k, v]) => [k, v.label]),
) as Record<SignalSource, string>;
