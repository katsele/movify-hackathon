"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { ForecastWithSkill } from "@/lib/types";

export function useForecast(skillId?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["forecasts", skillId ?? "all"],
    queryFn: async () => {
      const latestSnapshotQuery = supabase
        .from("forecasts")
        .select("generated_at")
        .order("generated_at", { ascending: false })
        .limit(1);

      const { data: snapshots, error: snapshotError } = await latestSnapshotQuery;
      if (snapshotError) throw snapshotError;

      const latestGeneratedAt = snapshots?.[0]?.generated_at;
      if (!latestGeneratedAt) return [] as ForecastWithSkill[];

      let query = supabase
        .from("forecasts")
        .select("*, skills(name, discipline)")
        .eq("generated_at", latestGeneratedAt)
        .order("forecast_week", { ascending: true });

      if (skillId) query = query.eq("skill_id", skillId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ForecastWithSkill[];
    },
  });
}
