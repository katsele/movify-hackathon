"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { ForecastWithSkill } from "@/lib/types";

export function useForecast(skillId?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["forecasts", skillId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("forecasts")
        .select("*, skills(name, discipline)")
        .order("forecast_week", { ascending: true });

      if (skillId) query = query.eq("skill_id", skillId);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ForecastWithSkill[];
    },
  });
}
