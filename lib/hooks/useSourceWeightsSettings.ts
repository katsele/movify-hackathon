"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  SourceWeightSettingsRow,
  UpdateSourceWeightsPayload,
} from "@/lib/types";

export interface SourceWeightsSettingsResponse {
  settings: SourceWeightSettingsRow[];
}

export interface UpdateSourceWeightsResponse
  extends SourceWeightsSettingsResponse {
  recalculation: {
    generated_at: string;
    skills_processed: number;
    forecasts_written: number;
  };
}

export const SOURCE_WEIGHT_SETTINGS_QUERY_KEY = [
  "source_weight_settings",
] as const;

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : "Failed to load source weight settings.";
    throw new Error(message);
  }

  return payload as T;
}

export function useSourceWeightsSettings() {
  return useQuery({
    queryKey: SOURCE_WEIGHT_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await fetch("/api/settings/source-weights", {
        cache: "no-store",
      });
      return readJson<SourceWeightsSettingsResponse>(response);
    },
  });
}

export function useUpdateSourceWeights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateSourceWeightsPayload) => {
      const response = await fetch("/api/settings/source-weights", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return readJson<UpdateSourceWeightsResponse>(response);
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(SOURCE_WEIGHT_SETTINGS_QUERY_KEY, {
        settings: data.settings,
      } satisfies SourceWeightsSettingsResponse);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: SOURCE_WEIGHT_SETTINGS_QUERY_KEY,
        }),
        queryClient.invalidateQueries({ queryKey: ["forecasts"] }),
      ]);
    },
  });
}
