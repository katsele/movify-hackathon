"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { RecentSignal, SignalSource } from "@/lib/types";

export interface SignalFilters {
  source?: SignalSource;
  skill?: string;
  region?: string;
}

export function useSignals(filters: SignalFilters = {}) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["recent_signals", filters],
    queryFn: async () => {
      let query = supabase
        .from("recent_signals")
        .select("*")
        .order("detected_at", { ascending: false })
        .limit(100);

      if (filters.source) query = query.eq("source", filters.source);
      if (filters.skill) query = query.contains("skill_names", [filters.skill]);
      if (filters.region) query = query.eq("region", filters.region);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as RecentSignal[];
    },
  });
}
