import { NextResponse } from "next/server";
import {
  buildSourceWeightSettingsRows,
  FORECAST_FACTORS,
  FORECAST_FACTOR_KEYS,
  sourceWeightsRecordToDecimals,
} from "@/lib/constants/forecastFactors";
import { createAdminClient } from "@/lib/supabase-admin";
import { generateAndPersistForecasts } from "@/lib/server/forecast-engine";
import type {
  ForecastFactorKey,
  SourceWeight,
  UpdateSourceWeightsPayload,
} from "@/lib/types";

export const runtime = "nodejs";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function latestIso(values: Array<string | null | undefined>): string | null {
  let latest: string | null = null;

  for (const value of values) {
    if (!value) continue;
    if (!latest || new Date(value).getTime() > new Date(latest).getTime()) {
      latest = value;
    }
  }

  return latest;
}

async function getLastDataSeenAt(supabase = createAdminClient()) {
  const signalSources = Array.from(
    new Set(FORECAST_FACTORS.flatMap((factor) => factor.signalSources)),
  );

  const [dealsResult, projectsResult, signalsResult] = await Promise.all([
    supabase
      .from("deals")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("projects")
      .select("created_at, started_at, ended_at")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("signals")
      .select("source, detected_at")
      .in("source", signalSources)
      .order("detected_at", { ascending: false }),
  ]);

  if (dealsResult.error) throw dealsResult.error;
  if (projectsResult.error) throw projectsResult.error;
  if (signalsResult.error) throw signalsResult.error;

  const signalLatest: Partial<Record<string, string>> = {};
  for (const row of (signalsResult.data ?? []) as Array<{
    source: string | null;
    detected_at: string | null;
  }>) {
    if (!row.source || !row.detected_at) continue;
    if (!signalLatest[row.source]) {
      signalLatest[row.source] = row.detected_at;
    }
  }

  const projectRow = (projectsResult.data?.[0] ?? null) as
    | { created_at: string | null; started_at: string | null; ended_at: string | null }
    | null;

  const crmLatest = (dealsResult.data?.[0]?.updated_at ?? null) as string | null;
  const historicalLatest = latestIso([
    projectRow?.ended_at,
    projectRow?.started_at,
    projectRow?.created_at,
  ]);

  return {
    crm_pipeline: crmLatest,
    procurement_notice: signalLatest.ted_procurement ?? null,
    historical_pattern: historicalLatest,
    trend_spike: signalLatest.google_trends ?? null,
    job_posting: latestIso([
      signalLatest.ats_greenhouse,
      signalLatest.ats_lever,
    ]),
    news_event: latestIso([
      signalLatest.news,
      signalLatest.news_intelligence,
    ]),
  } satisfies Record<ForecastFactorKey, string | null>;
}

async function loadSourceWeights(supabase = createAdminClient()) {
  const { data, error } = await supabase
    .from("source_weights")
    .select("source_key, weight, updated_at");

  if (error) throw error;

  return (data ?? []) as SourceWeight[];
}

function validatePayload(
  body: unknown,
): { ok: true; payload: UpdateSourceWeightsPayload } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Request body must be a JSON object." };
  }

  const payload = body as Partial<UpdateSourceWeightsPayload>;
  if (!payload.weights || typeof payload.weights !== "object") {
    return { ok: false, message: "Missing `weights` payload." };
  }

  const entries = Object.entries(payload.weights as Record<string, unknown>);
  const keys = entries.map(([key]) => key);

  const missing = FORECAST_FACTOR_KEYS.filter((key) => !keys.includes(key));
  if (missing.length) {
    return {
      ok: false,
      message: `Missing weight keys: ${missing.join(", ")}.`,
    };
  }

  const unknown = keys.filter(
    (key) => !FORECAST_FACTOR_KEYS.includes(key as ForecastFactorKey),
  );
  if (unknown.length) {
    return {
      ok: false,
      message: `Unknown weight keys: ${unknown.join(", ")}.`,
    };
  }

  const parsed = {} as Record<ForecastFactorKey, number>;
  for (const key of FORECAST_FACTOR_KEYS) {
    const value = (payload.weights as Record<string, unknown>)[key];
    if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 100) {
      return {
        ok: false,
        message: `Weight for ${key} must be an integer between 0 and 100.`,
      };
    }
    parsed[key] = Number(value);
  }

  const total = Object.values(parsed).reduce((sum, value) => sum + value, 0);
  if (total !== 100) {
    return {
      ok: false,
      message: `Weights must total exactly 100. Received ${total}.`,
    };
  }

  return { ok: true, payload: { weights: parsed } };
}

export async function GET() {
  const supabase = createAdminClient();

  try {
    const [weights, lastSeenAt] = await Promise.all([
      loadSourceWeights(supabase),
      getLastDataSeenAt(supabase),
    ]);

    return NextResponse.json({
      settings: buildSourceWeightSettingsRows(weights, lastSeenAt),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load source weights.";
    return errorResponse(message, 500);
  }
}

export async function PUT(request: Request) {
  let previousWeights: SourceWeight[] = [];
  const supabase = createAdminClient();

  try {
    const body = await request.json().catch(() => null);
    const validation = validatePayload(body);
    if (!validation.ok) {
      return errorResponse(validation.message, 400);
    }

    previousWeights = await loadSourceWeights(supabase);

    const timestamp = new Date().toISOString();
    const nextWeights = FORECAST_FACTOR_KEYS.map((key) => ({
      source_key: key,
      weight: validation.payload.weights[key] / 100,
      updated_at: timestamp,
    }));

    const { error: upsertError } = await supabase
      .from("source_weights")
      .upsert(nextWeights);
    if (upsertError) throw upsertError;

    const recalculation = await generateAndPersistForecasts(
      supabase,
      sourceWeightsRecordToDecimals(validation.payload.weights),
    );

    const [weights, lastSeenAt] = await Promise.all([
      loadSourceWeights(supabase),
      getLastDataSeenAt(supabase),
    ]);

    return NextResponse.json({
      settings: buildSourceWeightSettingsRows(weights, lastSeenAt),
      recalculation,
    });
  } catch (error) {
    if (previousWeights.length) {
      await supabase.from("source_weights").upsert(
        previousWeights.map((row) => ({
          ...row,
          updated_at: new Date().toISOString(),
        })),
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to update source weights.";
    return errorResponse(message, 500);
  }
}
