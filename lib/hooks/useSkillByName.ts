"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";

export function useSkillByName(name: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["skill_by_name", name],
    enabled: Boolean(name),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("id, name, discipline")
        .eq("name", name)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; name: string; discipline: string } | null;
    },
  });
}
