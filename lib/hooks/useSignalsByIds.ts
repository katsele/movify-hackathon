"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { SignalSource } from "@/lib/types";

export interface SignalLookup {
  id: string;
  source: SignalSource;
  title: string | null;
  url: string | null;
}

export function useSignalsByIds(ids: string[]) {
  const supabase = createClient();
  const unique = Array.from(new Set(ids)).filter(Boolean).sort();
  const key = unique.join(",");
  return useQuery({
    queryKey: ["signals_by_ids", key],
    enabled: unique.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("signals")
        .select("id, source, title, url")
        .in("id", unique);
      if (error) throw error;
      const map: Record<string, SignalLookup> = {};
      for (const row of (data ?? []) as SignalLookup[]) {
        map[row.id] = row;
      }
      return map;
    },
  });
}
