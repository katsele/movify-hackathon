import type { SupabaseClient } from "@supabase/supabase-js";
import type { ForecastFactorKey, SignalSource } from "@/lib/types";

const FORECAST_WEEKS = 12;
const CONVERGENCE_WINDOW_DAYS = 28;
const SIGNAL_RECENCY_WINDOW_DAYS = 90;
const CONFIDENCE_DIVISOR = 4;
const UPSERT_BATCH_SIZE = 500;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
}

interface ProjectSkillRow {
  skill_id: string;
  headcount: number | null;
  projects: ProjectRelationship | ProjectRelationship[] | null;
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

function scoreHistoricalPattern(rows: ProjectSkillRow[], targetWeek: Date): number {
  if (!rows.length) return 0;

  const monthCounts = new Map<number, number>();
  for (const row of rows) {
    const project = asSingle(row.projects);
    const startedAt = parseDateValue(project?.started_at);
    if (!startedAt) continue;

    const month = startedAt.getUTCMonth();
    monthCounts.set(month, (monthCounts.get(month) ?? 0) + (row.headcount ?? 0));
  }

  const total = Array.from(monthCounts.values()).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  return (monthCounts.get(targetWeek.getUTCMonth()) ?? 0) / total;
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
    parts.push("Seasonality suggests demand typically rises this quarter");
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
  const [
    skillsResult,
    dealProfilesResult,
    signalSkillsResult,
    projectSkillsResult,
    consultantSkillsResult,
  ] = await Promise.all([
    supabase.from("skills").select("id, name").order("name", { ascending: true }),
    supabase
      .from("deal_profiles")
      .select("skill_id, quantity, deals(expected_start, probability, status)"),
    supabase
      .from("signal_skills")
      .select("skill_id, signal_id, confidence, signals(detected_at, source)"),
    supabase.from("project_skills").select("skill_id, headcount, projects(started_at)"),
    supabase
      .from("consultant_skills")
      .select("skill_id, consultants(current_status, available_from)"),
  ]);

  if (skillsResult.error) throw skillsResult.error;
  if (dealProfilesResult.error) throw dealProfilesResult.error;
  if (signalSkillsResult.error) throw signalSkillsResult.error;
  if (projectSkillsResult.error) throw projectSkillsResult.error;
  if (consultantSkillsResult.error) throw consultantSkillsResult.error;

  const skills = (skillsResult.data ?? []) as SkillRow[];
  const dealsBySkill = groupBySkill((dealProfilesResult.data ?? []) as DealProfileRow[]);
  const signalsBySkill = groupBySkill(
    (signalSkillsResult.data ?? []) as SignalSkillRow[],
  );
  const projectsBySkill = groupBySkill(
    (projectSkillsResult.data ?? []) as ProjectSkillRow[],
  );
  const consultantsBySkill = groupBySkill(
    (consultantSkillsResult.data ?? []) as ConsultantSkillRow[],
  );

  const today = startOfUtcDay(new Date());
  const generatedAt = new Date().toISOString();
  const forecastRows: ForecastInsertRow[] = [];

  for (const skill of skills) {
    const dealRows = dealsBySkill.get(skill.id) ?? [];
    const signalRows = signalsBySkill.get(skill.id) ?? [];
    const projectRows = projectsBySkill.get(skill.id) ?? [];
    const consultantRows = consultantsBySkill.get(skill.id) ?? [];

    for (let offset = 1; offset <= weeksAhead; offset += 1) {
      const targetWeek = addDays(today, offset * 7);

      const scores: Record<ForecastFactorKey, number> = {
        crm_pipeline: scoreCrmPipeline(dealRows, today, targetWeek),
        procurement_notice: scoreSignalSources(signalRows, targetWeek, [
          "ted_procurement",
        ]),
        historical_pattern: scoreHistoricalPattern(projectRows, targetWeek),
        news_event: scoreSignalSources(signalRows, targetWeek, [
          "news",
          "news_intelligence",
        ]),
        trend_spike: scoreSignalSources(signalRows, targetWeek, ["google_trends"]),
        job_posting: scoreSignalSources(signalRows, targetWeek, [
          "ats_greenhouse",
          "ats_lever",
        ]),
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
        notes: explainForecast(skill.name, scores, converging),
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
