"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase";
import type { BenchSummary, Consultant, Deal } from "@/lib/types";

export function useBench() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["bench_summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bench_summary")
        .select("*")
        .order("discipline", { ascending: true });
      if (error) throw error;
      return (data ?? []) as BenchSummary[];
    },
  });
}

export function useConsultants() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["consultants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consultants")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Consultant[];
    },
  });
}

export function useDeals() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["deals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .in("status", ["prospect", "proposal", "negotiation"])
        .order("expected_start", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Deal[];
    },
  });
}
