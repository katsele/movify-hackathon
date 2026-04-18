import type { SupabaseClient } from "@supabase/supabase-js";
import type { ForecastFactorKey, SignalSource } from "@/lib/types";

const FORECAST_WEEKS = 12;
const CONVERGENCE_WINDOW_DAYS = 28;
const SIGNAL_RECENCY_WINDOW_DAYS = 90;
const CONFIDENCE_DIVISOR = 4;
const UPSERT_BATCH_SIZE = 500;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

export const HALF_LIFE_YEARS = 2;
export const BENCH_PRESSURE_GAIN = 0.5;
export const MIN_HISTORY_WEIGHTED_STARTS = 6;
export const BASELINE_WINDOW_MONTHS = 24;
export const BENCH_DURATION_WINDOW_MONTHS = 18;
export const HISTORY_DAMPEN_WITHOUT_CURRENT_SIGNAL = 0.5;

export interface HistoricalAggregate {
  seasonalIndex: Record<number, number>;
  weightedMonthly: Record<number, number>;
  baselineWeekly: number;
  tightness: number;
  skillMedianDuration: number | null;
}

export interface HistoricalDataset {
  aggregates: Map<string, HistoricalAggregate>;
  globalMedianDuration: number | null;
  startsBySkill: Map<string, Date[]>;
}

interface SkillRow {
  id: string;
  name: string;
}

interface DealRelationship {
  expected_start: string | null;
  probability: number | null;
  status: string | null;
}

interface DealProfileRow {
  skill_id: string;
  quantity: number | null;
  deals: DealRelationship | DealRelationship[] | null;
}

interface SignalRelationship {
  detected_at: string | null;
  source: SignalSource | null;
}

interface SignalSkillRow {
  skill_id: string;
  signal_id: string;
  confidence: number | null;
  signals: SignalRelationship | SignalRelationship[] | null;
}

interface ProjectRelationship {
  started_at: string | null;
  source_kind: string | null;
}

interface ProjectSkillRow {
  skill_id: string;
  projects: ProjectRelationship | ProjectRelationship[] | null;
}

interface BenchHistoryRelationship {
  duration_days: number | null;
  bench_ended_at: string | null;
}

interface BenchHistorySkillRow {
  skill_id: string;
  consultant_bench_history:
    | BenchHistoryRelationship
    | BenchHistoryRelationship[]
    | null;
}

interface ConsultantRelationship {
  current_status: string | null;
  available_from: string | null;
}

interface ConsultantSkillRow {
  skill_id: string;
  consultants: ConsultantRelationship | ConsultantRelationship[] | null;
}

interface ForecastInsertRow {
  generated_at: string;
  forecast_week: string;
  skill_id: string;
  predicted_demand: number;
  current_supply: number;
  gap: number;
  confidence: number;
  contributing_signals: string[];
  notes: string;
}

export interface ForecastRecalculationResult {
  generated_at: string;
  skills_processed: number;
  forecasts_written: number;
}

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function parseDateValue(value: string | null | undefined): Date | null {
  if (!value) return null;

  const text = value.trim();
  if (!text) return null;

  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? new Date(`${text}T00:00:00.000Z`)
    : new Date(text);

  if (Number.isNaN(parsed.getTime())) return null;
  return startOfUtcDay(parsed);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

function roundTo(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function groupBySkill<T extends { skill_id: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.skill_id) ?? [];
    bucket.push(row);
    grouped.set(row.skill_id, bucket);
  }
  return grouped;
}

function scoreSignalSources(
  rows: SignalSkillRow[],
  targetWeek: Date,
  sources: SignalSource[],
): number {
  let score = 0;
  const allowed = new Set(sources);

  for (const row of rows) {
    const signal = asSingle(row.signals);
    if (!signal?.source || !allowed.has(signal.source)) continue;

    const detectedAt = parseDateValue(signal.detected_at);
    if (!detectedAt) continue;

    const daysAge = Math.abs(daysBetween(targetWeek, detectedAt));
    if (daysAge > SIGNAL_RECENCY_WINDOW_DAYS) continue;

    const decay = Math.max(0, 1 - daysAge / SIGNAL_RECENCY_WINDOW_DAYS);
    score += (row.confidence ?? 0) * decay;
  }

  return score;
}

function scoreCrmPipeline(rows: DealProfileRow[], today: Date, targetWeek: Date): number {
  let score = 0;
  const targetWeeksFromNow = daysBetween(targetWeek, today) / 7;

  for (const row of rows) {
    const deal = asSingle(row.deals);
    if (!deal?.expected_start) continue;
    if (deal.status && ["won", "lost"].includes(deal.status)) continue;

    const startDate = parseDateValue(deal.expected_start);
    if (!startDate) continue;

    const weeksFromNow = daysBetween(startDate, today) / 7;
    const proximity = Math.max(
      0,
      1 - Math.abs(weeksFromNow - targetWeeksFromNow) / 12,
    );

    score += (row.quantity ?? 0) * (deal.probability ?? 0.5) * proximity;
  }

  return score;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function emptyMonthlyMap(): Record<number, number> {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, 0]),
  ) as Record<number, number>;
}

function flatSeasonalIndex(): Record<number, number> {
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => [i + 1, 1]),
  ) as Record<number, number>;
}

function buildHistoricalAggregate(
  starts: Date[],
  durations: number[],
  today: Date,
  globalMedianDuration: number | null,
): HistoricalAggregate {
  const aggregate: HistoricalAggregate = {
    seasonalIndex: flatSeasonalIndex(),
    weightedMonthly: emptyMonthlyMap(),
    baselineWeekly: 0,
    tightness: 0,
    skillMedianDuration: null,
  };

  if (!starts.length && !durations.length) return aggregate;

  const baselineCutoff = addDays(today, -BASELINE_WINDOW_MONTHS * 30);
  let totalWeighted = 0;
  let baselineWeighted = 0;

  for (const start of starts) {
    const yearsAgo = (today.getTime() - start.getTime()) / MS_PER_YEAR;
    if (yearsAgo < 0) continue;
    const weight = Math.exp(-yearsAgo / HALF_LIFE_YEARS);
    const month = start.getUTCMonth() + 1;
    aggregate.weightedMonthly[month] += weight;
    totalWeighted += weight;
    if (start.getTime() >= baselineCutoff.getTime()) {
      baselineWeighted += weight;
    }
  }

  if (totalWeighted >= MIN_HISTORY_WEIGHTED_STARTS) {
    const avg = totalWeighted / 12;
    if (avg > 0) {
      aggregate.seasonalIndex = Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [
          i + 1,
          aggregate.weightedMonthly[i + 1] / avg,
        ]),
      ) as Record<number, number>;
    }
  }

  aggregate.baselineWeekly = baselineWeighted / 52;

  if (durations.length) {
    const skillMedian = median(durations);
    aggregate.skillMedianDuration = skillMedian;
    if (globalMedianDuration !== null && globalMedianDuration > 0) {
      const tightness = (globalMedianDuration - skillMedian) / globalMedianDuration;
      aggregate.tightness = Math.max(-1, Math.min(1, tightness));
    }
  }

  return aggregate;
}

export async function loadHistoricalDataset(
  supabase: SupabaseClient,
  referenceDate: Date = startOfUtcDay(new Date()),
): Promise<HistoricalDataset> {
  const [projectSkillsResult, benchSkillsResult] = await Promise.all([
    supabase
      .from("project_skills")
      .select("skill_id, projects(started_at, source_kind)"),
    supabase
      .from("consultant_bench_history_skills")
      .select(
        "skill_id, consultant_bench_history(duration_days, bench_ended_at)",
      ),
  ]);

  if (projectSkillsResult.error) throw projectSkillsResult.error;
  if (benchSkillsResult.error) throw benchSkillsResult.error;

  const startsBySkill = new Map<string, Date[]>();
  for (const row of (projectSkillsResult.data ?? []) as ProjectSkillRow[]) {
    const project = asSingle(row.projects);
    if (project?.source_kind !== "history") continue;
    const started = parseDateValue(project.started_at);
    if (!started) continue;
    const bucket = startsBySkill.get(row.skill_id) ?? [];
    bucket.push(started);
    startsBySkill.set(row.skill_id, bucket);
  }

  const benchCutoff = addDays(referenceDate, -BENCH_DURATION_WINDOW_MONTHS * 30);
  const durationsBySkill = new Map<string, number[]>();
  const allDurations: number[] = [];
  for (const row of (benchSkillsResult.data ?? []) as BenchHistorySkillRow[]) {
    const spell = asSingle(row.consultant_bench_history);
    if (!spell) continue;
    const duration = spell.duration_days;
    const ended = parseDateValue(spell.bench_ended_at);
    if (duration === null || duration === undefined || !ended) continue;
    if (ended.getTime() < benchCutoff.getTime()) continue;
    const bucket = durationsBySkill.get(row.skill_id) ?? [];
    bucket.push(duration);
    durationsBySkill.set(row.skill_id, bucket);
    allDurations.push(duration);
  }

  const globalMedianDuration = allDurations.length ? median(allDurations) : null;

  const aggregates = new Map<string, HistoricalAggregate>();
  const skillIds = new Set<string>([
    ...startsBySkill.keys(),
    ...durationsBySkill.keys(),
  ]);
  for (const skillId of skillIds) {
    aggregates.set(
      skillId,
      buildHistoricalAggregate(
        startsBySkill.get(skillId) ?? [],
        durationsBySkill.get(skillId) ?? [],
        referenceDate,
        globalMedianDuration,
      ),
    );
  }

  return { aggregates, globalMedianDuration, startsBySkill };
}

function scoreHistoricalPattern(
  aggregate: HistoricalAggregate | undefined,
  targetWeek: Date,
): number {
  if (!aggregate || aggregate.baselineWeekly <= 0) return 0;
  const month = targetWeek.getUTCMonth() + 1;
  const pressureMult = 1 + BENCH_PRESSURE_GAIN * Math.max(0, aggregate.tightness);
  return aggregate.baselineWeekly * (aggregate.seasonalIndex[month] ?? 1) * pressureMult;
}

function getSupply(rows: ConsultantSkillRow[], targetWeek: Date): number {
  let available = 0;

  for (const row of rows) {
    const consultant = asSingle(row.consultants);
    if (!consultant) continue;
    if (consultant.current_status === "on_mission") continue;

    const availableFrom = parseDateValue(consultant.available_from);
    if (availableFrom && availableFrom.getTime() > targetWeek.getTime()) continue;

    available += 1;
  }

  return available;
}

function contributingSignalIds(rows: SignalSkillRow[], targetWeek: Date): string[] {
  const ids = new Set<string>();

  for (const row of rows) {
    const signal = asSingle(row.signals);
    const detectedAt = parseDateValue(signal?.detected_at);
    if (!detectedAt) continue;

    if (Math.abs(daysBetween(targetWeek, detectedAt)) <= CONVERGENCE_WINDOW_DAYS) {
      ids.add(row.signal_id);
    }
  }

  return Array.from(ids);
}

function convergentSources(rows: SignalSkillRow[], targetWeek: Date): Set<string> {
  const sources = new Set<string>();

  for (const row of rows) {
    const signal = asSingle(row.signals);
    if (!signal?.source) continue;

    const detectedAt = parseDateValue(signal.detected_at);
    if (!detectedAt) continue;

    if (Math.abs(daysBetween(targetWeek, detectedAt)) <= CONVERGENCE_WINDOW_DAYS) {
      sources.add(signal.source);
    }
  }

  return sources;
}

function explainForecast(
  skillName: string,
  scores: Record<ForecastFactorKey, number>,
  converging: boolean,
  aggregate: HistoricalAggregate | undefined,
  targetWeek: Date,
): string {
  const parts: string[] = [];

  if (scores.crm_pipeline > 0) {
    parts.push(`Pipeline deals request ${skillName}`);
  }
  if (scores.procurement_notice > 0) {
    parts.push(`Recent procurement notices mention ${skillName}`);
  }
  if (scores.news_event > 0) {
    parts.push(`Belgian news coverage signals demand for ${skillName}`);
  }
  if (scores.historical_pattern > 0) {
    if (aggregate) {
      const month = targetWeek.getUTCMonth() + 1;
      const index = aggregate.seasonalIndex[month] ?? 1;
      if (index > 1.2) {
        parts.push(`Historically busier than average this month for ${skillName}`);
      } else if (index < 0.8) {
        parts.push(`Historically quieter than average this month for ${skillName}`);
      } else {
        parts.push(`Baseline historical demand for ${skillName}`);
      }
      if (aggregate.tightness > 0.4) {
        parts.push(`Bench clears fast for ${skillName} — market is tight`);
      }
    } else {
      parts.push(`Historical baseline for ${skillName}`);
    }
  }
  if (scores.trend_spike > 0) {
    parts.push(`Trend signals show growing attention around ${skillName}`);
  }
  if (scores.job_posting > 0) {
    parts.push(`Live job postings point to hiring pressure for ${skillName}`);
  }
  if (converging) {
    parts.push("Multiple independent sources agree — confidence boosted");
  }

  return parts.length ? `${parts.join(". ")}.` : "No strong signals detected.";
}

export async function generateAndPersistForecasts(
  supabase: SupabaseClient,
  weights: Record<ForecastFactorKey, number>,
  weeksAhead = FORECAST_WEEKS,
): Promise<ForecastRecalculationResult> {
  const today = startOfUtcDay(new Date());

  const [
    skillsResult,
    dealProfilesResult,
    signalSkillsResult,
    consultantSkillsResult,
    historicalDataset,
  ] = await Promise.all([
    supabase.from("skills").select("id, name").order("name", { ascending: true }),
    supabase
      .from("deal_profiles")
      .select("skill_id, quantity, deals(expected_start, probability, status)"),
    supabase
      .from("signal_skills")
      .select("skill_id, signal_id, confidence, signals(detected_at, source)"),
    supabase
      .from("consultant_skills")
      .select("skill_id, consultants(current_status, available_from)"),
    loadHistoricalDataset(supabase, today),
  ]);

  if (skillsResult.error) throw skillsResult.error;
  if (dealProfilesResult.error) throw dealProfilesResult.error;
  if (signalSkillsResult.error) throw signalSkillsResult.error;
  if (consultantSkillsResult.error) throw consultantSkillsResult.error;

  const skills = (skillsResult.data ?? []) as SkillRow[];
  const dealsBySkill = groupBySkill((dealProfilesResult.data ?? []) as DealProfileRow[]);
  const signalsBySkill = groupBySkill(
    (signalSkillsResult.data ?? []) as SignalSkillRow[],
  );
  const consultantsBySkill = groupBySkill(
    (consultantSkillsResult.data ?? []) as ConsultantSkillRow[],
  );

  const generatedAt = new Date().toISOString();
  const forecastRows: ForecastInsertRow[] = [];

  for (const skill of skills) {
    const dealRows = dealsBySkill.get(skill.id) ?? [];
    const signalRows = signalsBySkill.get(skill.id) ?? [];
    const consultantRows = consultantsBySkill.get(skill.id) ?? [];
    const aggregate = historicalDataset.aggregates.get(skill.id);

    for (let offset = 1; offset <= weeksAhead; offset += 1) {
      const targetWeek = addDays(today, offset * 7);

      const crm = scoreCrmPipeline(dealRows, today, targetWeek);
      const procurement = scoreSignalSources(signalRows, targetWeek, [
        "ted_procurement",
      ]);
      const news = scoreSignalSources(signalRows, targetWeek, [
        "news",
        "news_intelligence",
      ]);
      const trend = scoreSignalSources(signalRows, targetWeek, ["google_trends"]);
      const postings = scoreSignalSources(signalRows, targetWeek, [
        "ats_greenhouse",
        "ats_lever",
      ]);
      const hasCurrentSignal =
        crm > 0 || procurement > 0 || news > 0 || trend > 0 || postings > 0;
      let historical = scoreHistoricalPattern(aggregate, targetWeek);
      if (!hasCurrentSignal) {
        historical *= HISTORY_DAMPEN_WITHOUT_CURRENT_SIGNAL;
      }

      const scores: Record<ForecastFactorKey, number> = {
        crm_pipeline: crm,
        procurement_notice: procurement,
        historical_pattern: historical,
        news_event: news,
        trend_spike: trend,
        job_posting: postings,
      };

      const rawDemand =
        scores.crm_pipeline * weights.crm_pipeline +
        scores.procurement_notice * weights.procurement_notice +
        scores.historical_pattern * weights.historical_pattern +
        scores.news_event * weights.news_event +
        scores.trend_spike * weights.trend_spike +
        scores.job_posting * weights.job_posting;

      const activeSignals = Object.values(scores).filter((score) => score > 0).length;
      const baseConfidence = Math.min(activeSignals / CONFIDENCE_DIVISOR, 1);
      const converging = convergentSources(signalRows, targetWeek).size >= 2;
      const confidence = Math.min(
        baseConfidence + (converging ? 0.2 : 0),
        1,
      );

      const supply = getSupply(consultantRows, targetWeek);

      forecastRows.push({
        generated_at: generatedAt,
        forecast_week: isoDate(targetWeek),
        skill_id: skill.id,
        predicted_demand: roundTo(rawDemand),
        current_supply: supply,
        gap: roundTo(rawDemand - supply),
        confidence: roundTo(confidence),
        contributing_signals: contributingSignalIds(signalRows, targetWeek),
        notes: explainForecast(skill.name, scores, converging, aggregate, targetWeek),
      });
    }
  }

  for (let index = 0; index < forecastRows.length; index += UPSERT_BATCH_SIZE) {
    const batch = forecastRows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase
      .from("forecasts")
      .upsert(batch, { onConflict: "forecast_week,skill_id" });

    if (error) throw error;
  }

  return {
    generated_at: generatedAt,
    skills_processed: skills.length,
    forecasts_written: forecastRows.length,
  };
}
