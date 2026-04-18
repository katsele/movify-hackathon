"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { Seniority } from "@/lib/types";

export interface ConsultantSkillRow {
  name: string;
  discipline: string;
  proficiency: Seniority;
}

export function useConsultantSkills() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["consultant_skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultant_skills")
        .select("consultant_id, proficiency, skills(name, discipline)");
      if (error) throw error;
      const grouped: Record<string, ConsultantSkillRow[]> = {};
      for (const row of (data ?? []) as unknown as Array<{
        consultant_id: string;
        proficiency: Seniority;
        skills:
          | { name: string; discipline: string }
          | { name: string; discipline: string }[]
          | null;
      }>) {
        const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
        if (!skill) continue;
        (grouped[row.consultant_id] ??= []).push({
          name: skill.name,
          discipline: skill.discipline,
          proficiency: row.proficiency,
        });
      }
      return grouped;
    },
  });
}
