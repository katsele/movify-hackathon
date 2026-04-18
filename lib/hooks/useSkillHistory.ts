"use client";

import { useQuery } from "@tanstack/react-query";

export interface MonthlyRange {
  min: number;
  max: number;
}

export interface SkillHistoryRow {
  seasonal_index_by_month: Record<number, number>;
  weighted_monthly: Record<number, number>;
  baseline_monthly: number;
  tightness: number;
  skill_median_duration: number | null;
  monthly_history_range: Record<number, MonthlyRange>;
}

export interface SkillHistoryPayload {
  global_median_duration: number | null;
  skills: Record<string, SkillHistoryRow>;
}

export function useSkillHistory() {
  return useQuery<SkillHistoryPayload>({
    queryKey: ["skill-history"],
    queryFn: async () => {
      const res = await fetch("/api/skills/history");
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error ?? "Failed to load skill history");
      }
      return res.json();
    },
  });
}
