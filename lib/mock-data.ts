import type {
  BenchSummary,
  Consultant,
  Deal,
  RecentSignal,
} from "@/lib/types";

export interface ForecastCell {
  skill: string;
  discipline: string;
  week: number;
  demand: number;
  supply: number;
  gap: number;
  confidence: number;
  contributingSignalIds?: string[];
}

// Back-compat alias — existing imports keep working while the rename lands.
export type MockForecastCell = ForecastCell;

export const MOCK_SKILLS = [
  { name: "React", discipline: "Web Development" },
  { name: "Next.js", discipline: "Web Development" },
  { name: "Node.js", discipline: "Web Development" },
  { name: "TypeScript", discipline: "Web Development" },
  { name: "AI Engineering", discipline: "AI/ML" },
  { name: "LangChain", discipline: "AI/ML" },
  { name: "Data Engineering", discipline: "Data" },
  { name: "dbt", discipline: "Data" },
  { name: "Product Design", discipline: "Design" },
  { name: "Service Design", discipline: "Design" },
];

const seedRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export function buildMockForecast(): ForecastCell[] {
  const rand = seedRandom(42);
  const cells: ForecastCell[] = [];

  MOCK_SKILLS.forEach((skill, i) => {
    const baseDemand = 2 + Math.floor(rand() * 5);
    const baseSupply = 1 + Math.floor(rand() * 4);
    for (let week = 1; week <= 12; week++) {
      const drift = Math.sin((week + i) / 3) * 2;
      const demand = Math.max(0, Math.round(baseDemand + drift + rand() * 2));
      const supply = Math.max(0, baseSupply + Math.floor(rand() * 2));
      cells.push({
        skill: skill.name,
        discipline: skill.discipline,
        week,
        demand,
        supply,
        gap: demand - supply,
        confidence: 0.4 + rand() * 0.55,
      });
    }
  });
  return cells;
}

export const MOCK_CONSULTANTS: Consultant[] = [
  {
    id: "c1",
    external_id: "boond-1",
    name: "Amélie Dubois",
    current_status: "on_bench",
    available_from: "2026-04-17",
    created_at: "2026-01-01",
    updated_at: "2026-04-10",
  },
  {
    id: "c2",
    external_id: "boond-2",
    name: "Jeroen Van Damme",
    current_status: "rolling_off",
    available_from: "2026-05-15",
    created_at: "2026-01-01",
    updated_at: "2026-04-10",
  },
  {
    id: "c3",
    external_id: "boond-3",
    name: "Farid El Amrani",
    current_status: "on_mission",
    available_from: "2026-09-01",
    created_at: "2026-01-01",
    updated_at: "2026-04-10",
  },
  {
    id: "c4",
    external_id: "boond-4",
    name: "Sophie Peeters",
    current_status: "on_bench",
    available_from: "2026-04-17",
    created_at: "2026-01-01",
    updated_at: "2026-04-10",
  },
  {
    id: "c5",
    external_id: "boond-5",
    name: "Thomas Laurent",
    current_status: "rolling_off",
    available_from: "2026-06-01",
    created_at: "2026-01-01",
    updated_at: "2026-04-10",
  },
];

export const MOCK_DEALS: Deal[] = [
  {
    id: "d1",
    external_id: "boond-deal-1",
    title: "Platform modernisation",
    client_name: "BNP Paribas Fortis",
    status: "proposal",
    expected_start: "2026-06-01",
    expected_duration_weeks: 26,
    probability: 0.7,
    created_at: "2026-03-01",
    updated_at: "2026-04-10",
  },
  {
    id: "d2",
    external_id: "boond-deal-2",
    title: "AI copilot for support",
    client_name: "Proximus",
    status: "negotiation",
    expected_start: "2026-05-15",
    expected_duration_weeks: 16,
    probability: 0.85,
    created_at: "2026-02-15",
    updated_at: "2026-04-12",
  },
  {
    id: "d3",
    external_id: "boond-deal-3",
    title: "Data platform overhaul",
    client_name: "Colruyt",
    status: "prospect",
    expected_start: "2026-07-01",
    expected_duration_weeks: 40,
    probability: 0.4,
    created_at: "2026-03-20",
    updated_at: "2026-04-05",
  },
];

export const MOCK_BENCH: BenchSummary[] = [
  {
    discipline: "Web Development",
    skill_name: "React",
    available_count: 3,
    consultant_names: ["Amélie Dubois", "Sophie Peeters", "Lucas Martin"],
  },
  {
    discipline: "Web Development",
    skill_name: "Node.js",
    available_count: 2,
    consultant_names: ["Sophie Peeters", "Jeroen Van Damme"],
  },
  {
    discipline: "AI/ML",
    skill_name: "AI Engineering",
    available_count: 1,
    consultant_names: ["Thomas Laurent"],
  },
  {
    discipline: "Data",
    skill_name: "dbt",
    available_count: 0,
    consultant_names: [],
  },
];

export const MOCK_SIGNALS: RecentSignal[] = [
  {
    skill_name: "AI Engineering",
    discipline: "AI/ML",
    source: "ted_procurement",
    signal_type: "procurement_notice",
    title: "Federal government AI pilot programme — €2.4M",
    detected_at: "2026-04-16T08:00:00Z",
    confidence: 0.85,
  },
  {
    skill_name: "React",
    discipline: "Web Development",
    source: "google_trends",
    signal_type: "trend_spike",
    title: "Rising interest: React developer in Flanders (+32%)",
    detected_at: "2026-04-15T06:00:00Z",
    confidence: 0.7,
  },
  {
    skill_name: "dbt",
    discipline: "Data",
    source: "ats_greenhouse",
    signal_type: "job_posting",
    title: "8 new Belgian job postings for dbt analytics in last 14 days",
    detected_at: "2026-04-14T12:00:00Z",
    confidence: 0.6,
  },
  {
    skill_name: "LangChain",
    discipline: "AI/ML",
    source: "ted_procurement",
    signal_type: "procurement_notice",
    title: "Brussels Region RAG consulting tender — €450K",
    detected_at: "2026-04-13T10:00:00Z",
    confidence: 0.8,
  },
  {
    skill_name: "Service Design",
    discipline: "Design",
    source: "google_trends",
    signal_type: "trend_spike",
    title: "Sustained rise: service design in Wallonia (+18% 8w)",
    detected_at: "2026-04-12T07:00:00Z",
    confidence: 0.55,
  },
];
