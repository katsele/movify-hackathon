export type ConsultantStatus = "on_mission" | "on_bench" | "rolling_off";
export type DealStatus =
  | "prospect"
  | "proposal"
  | "negotiation"
  | "won"
  | "lost";
export type Seniority = "junior" | "mid" | "senior" | "expert";
export type Region =
  | "flanders"
  | "wallonia"
  | "brussels"
  | "belgium"
  | "eu";
export type SignalSource =
  | "boond_crm"
  | "ted_procurement"
  | "google_trends"
  | "ats_greenhouse"
  | "ats_lever"
  | "news"
  | "news_intelligence";
export type SignalType =
  | "procurement_notice"
  | "trend_spike"
  | "job_posting"
  | "news_event"
  | "pipeline_deal";
export type ForecastFactorKey =
  | "crm_pipeline"
  | "procurement_notice"
  | "historical_pattern"
  | "news_event"
  | "trend_spike"
  | "job_posting";

export interface Skill {
  id: string;
  name: string;
  discipline: string;
  aliases: string[];
  esco_uri: string | null;
  lightcast_id: string | null;
  created_at: string;
}

export interface Consultant {
  id: string;
  external_id: string | null;
  name: string;
  current_status: ConsultantStatus;
  available_from: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultantSkill {
  consultant_id: string;
  skill_id: string;
  proficiency: Seniority;
}

export interface Deal {
  id: string;
  external_id: string | null;
  title: string;
  client_name: string | null;
  status: DealStatus;
  expected_start: string | null;
  expected_duration_weeks: number | null;
  probability: number;
  created_at: string;
  updated_at: string;
}

export interface DealProfile {
  id: string;
  deal_id: string;
  skill_id: string;
  quantity: number;
  seniority: Seniority;
  notes: string | null;
}

export interface Project {
  id: string;
  external_id: string | null;
  title: string;
  client_name: string | null;
  sector: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ProjectSkill {
  project_id: string;
  skill_id: string;
  headcount: number;
}

export interface Signal {
  id: string;
  source: SignalSource;
  signal_type: SignalType;
  title: string | null;
  url: string | null;
  raw_data: Record<string, unknown> | null;
  detected_at: string;
  expires_at: string | null;
  region: Region | null;
  created_at: string;
}

export interface SignalSkill {
  signal_id: string;
  skill_id: string;
  confidence: number;
}

export interface Forecast {
  id: string;
  generated_at: string;
  forecast_month: string;
  skill_id: string;
  predicted_demand: number;
  current_supply: number;
  gap: number;
  confidence: number;
  contributing_signals: string[];
  notes: string | null;
}

export interface ForecastActual {
  id: string;
  forecast_id: string;
  actual_demand: number | null;
  accuracy_score: number | null;
  reviewed_at: string;
}

export interface BenchSummary {
  discipline: string;
  skill_name: string;
  available_count: number;
  consultant_names: string[];
}

export interface PipelineDemand {
  discipline: string;
  skill_name: string;
  total_requested: number;
  earliest_need: string | null;
  avg_probability: number;
}

export interface RecentSignal {
  signal_id?: string;
  skill_name: string;
  discipline: string;
  skill_names?: string[];
  skill_disciplines?: string[];
  confidences?: number[];
  source: SignalSource;
  signal_type: SignalType;
  title: string | null;
  url?: string | null;
  raw_data?: SignalRawData | null;
  region?: Region | null;
  detected_at: string;
  confidence: number;
  converges_with_sources?: SignalSource[] | null;
  converging_skills?: string[] | null;
  converging_count?: number | null;
}

export interface SignalRawData {
  client?: string;
  client_key?: string;
  industry?: string;
  event_type?: string;
  matched_events?: string[];
  outlet?: string;
  summary?: string;
  score?: number;
  priors_tier?: "exact" | "industry" | "wildcard" | "client_default" | "none";
  contracting_authority?: string;
  cpv_code?: string;
  cpv_label?: string;
  cpv_codes?: string[];
  value_estimate_eur?: number;
  deadline?: string;
  notice_type?: string;
  publication_number?: string;
  lang?: string;
  title_multilingual?: Record<string, string | string[]>;
  seed?: boolean;
  [key: string]: unknown;
}

export interface ForecastWithSkill extends Forecast {
  skills: Pick<Skill, "name" | "discipline"> | null;
}

export interface SourceWeight {
  source_key: ForecastFactorKey;
  weight: number;
  updated_at: string;
}

export interface SourceWeightSettingsRow extends SourceWeight {
  label: string;
  description: string;
  color: string;
  percentage: number;
  source_labels: string[];
  last_data_seen_at: string | null;
}

export interface UpdateSourceWeightsPayload {
  weights: Record<ForecastFactorKey, number>;
}
