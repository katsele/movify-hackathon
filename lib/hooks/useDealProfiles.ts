"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { Seniority } from "@/lib/types";

export interface DealProfileRow {
  name: string;
  discipline: string;
  quantity: number;
  seniority: Seniority;
}

export function useDealProfiles() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["deal_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deal_profiles")
        .select("deal_id, quantity, seniority, skills(name, discipline)");
      if (error) throw error;
      const grouped: Record<string, DealProfileRow[]> = {};
      for (const row of (data ?? []) as unknown as Array<{
        deal_id: string;
        quantity: number;
        seniority: Seniority;
        skills:
          | { name: string; discipline: string }
          | { name: string; discipline: string }[]
          | null;
      }>) {
        const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
        if (!skill) continue;
        (grouped[row.deal_id] ??= []).push({
          name: skill.name,
          discipline: skill.discipline,
          quantity: row.quantity,
          seniority: row.seniority,
        });
      }
      return grouped;
    },
  });
}
