-- =============================================================================
-- Skills Demand Forecaster — initial schema
-- Source of truth: docs/architecture.md §3
-- =============================================================================

-- Extensions ------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- Core tables -----------------------------------------------------------------

-- Skill taxonomy (the shared language across all data)
create table if not exists skills (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  discipline    text not null,
  aliases       text[] default '{}',
  esco_uri      text,
  lightcast_id  text,
  created_at    timestamptz default now()
);

-- Consultants (from Boond)
create table if not exists consultants (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique,
  name            text not null,
  current_status  text not null check (current_status in ('on_mission','on_bench','rolling_off')),
  available_from  date,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Consultant skills (many-to-many)
create table if not exists consultant_skills (
  consultant_id uuid references consultants(id) on delete cascade,
  skill_id      uuid references skills(id) on delete cascade,
  proficiency   text default 'mid' check (proficiency in ('junior','mid','senior','expert')),
  primary key (consultant_id, skill_id)
);

-- Pipeline deals (from Boond)
create table if not exists deals (
  id                       uuid primary key default gen_random_uuid(),
  external_id              text unique,
  title                    text not null,
  client_name              text,
  status                   text not null check (status in ('prospect','proposal','negotiation','won','lost')),
  expected_start           date,
  expected_duration_weeks  int,
  probability              float default 0.5,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- Profiles requested per deal (what skills the client wants)
create table if not exists deal_profiles (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid references deals(id) on delete cascade,
  skill_id   uuid references skills(id) on delete restrict,
  quantity   int default 1,
  seniority  text default 'mid' check (seniority in ('junior','mid','senior','expert')),
  notes      text
);

-- Historical projects (completed missions, for pattern learning)
create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  external_id  text unique,
  title        text not null,
  client_name  text,
  sector       text,
  started_at   date,
  ended_at     date,
  created_at   timestamptz default now()
);

-- Skills used in historical projects
create table if not exists project_skills (
  project_id  uuid references projects(id) on delete cascade,
  skill_id    uuid references skills(id) on delete restrict,
  headcount   int default 1,
  primary key (project_id, skill_id)
);

-- External signals (unified signal store)
create table if not exists signals (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,
  signal_type  text not null,
  title        text,
  url          text,
  raw_data     jsonb,
  detected_at  timestamptz default now(),
  expires_at   timestamptz,
  region       text,
  created_at   timestamptz default now()
);

-- Skills extracted from signals (many-to-many)
create table if not exists signal_skills (
  signal_id   uuid references signals(id) on delete cascade,
  skill_id    uuid references skills(id) on delete restrict,
  confidence  float default 0.5,
  primary key (signal_id, skill_id)
);

-- Forecasts (the output)
create table if not exists forecasts (
  id                    uuid primary key default gen_random_uuid(),
  generated_at          timestamptz default now(),
  forecast_week         date not null,
  skill_id              uuid references skills(id) on delete cascade,
  predicted_demand      float,
  current_supply        int,
  gap                   float,
  confidence            float,
  contributing_signals  uuid[],
  notes                 text,
  unique (generated_at, forecast_week, skill_id)
);

-- Forecast accuracy tracking (retrospective validation)
create table if not exists forecast_actuals (
  id              uuid primary key default gen_random_uuid(),
  forecast_id     uuid references forecasts(id) on delete cascade,
  actual_demand   int,
  accuracy_score  float,
  reviewed_at     timestamptz default now()
);

-- Indexes ---------------------------------------------------------------------
create index if not exists idx_signals_source       on signals(source);
create index if not exists idx_signals_detected_at  on signals(detected_at);
create index if not exists idx_signals_region       on signals(region);
create index if not exists idx_forecasts_week       on forecasts(forecast_week);
create index if not exists idx_forecasts_skill      on forecasts(skill_id);
create index if not exists idx_deals_status         on deals(status);
create index if not exists idx_consultants_status   on consultants(current_status);
create index if not exists idx_deal_profiles_skill  on deal_profiles(skill_id);

-- Views (dashboard queries) ---------------------------------------------------

create or replace view bench_summary as
select
  s.discipline,
  s.name as skill_name,
  count(cs.consultant_id)::int as available_count,
  array_agg(c.name) as consultant_names
from consultants c
join consultant_skills cs on c.id = cs.consultant_id
join skills s              on cs.skill_id = s.id
where c.current_status in ('on_bench','rolling_off')
group by s.discipline, s.name;

create or replace view pipeline_demand as
select
  s.discipline,
  s.name as skill_name,
  sum(dp.quantity)::int as total_requested,
  min(d.expected_start) as earliest_need,
  avg(d.probability) as avg_probability
from deals d
join deal_profiles dp on d.id = dp.deal_id
join skills s          on dp.skill_id = s.id
where d.status in ('prospect','proposal','negotiation')
group by s.discipline, s.name;

create or replace view recent_signals as
select
  s.name       as skill_name,
  s.discipline as discipline,
  sig.source,
  sig.signal_type,
  sig.title,
  sig.detected_at,
  sig.region,
  ss.confidence
from signals sig
join signal_skills ss on sig.id = ss.signal_id
join skills s          on ss.skill_id = s.id
where sig.detected_at > now() - interval '30 days'
order by sig.detected_at desc;

-- =============================================================================
-- Seed data — Movify disciplines + top skills
-- =============================================================================

insert into skills (name, discipline, aliases) values
  ('React',            'Web Development',       '{"ReactJS","React.js"}'),
  ('Next.js',          'Web Development',       '{"NextJS","Next"}'),
  ('Node.js',          'Web Development',       '{"NodeJS","Node"}'),
  ('TypeScript',       'Web Development',       '{"TS"}'),
  ('Python',           'Platform Engineering',  '{}'),
  ('Go',               'Platform Engineering',  '{"Golang"}'),
  ('Kubernetes',       'Platform Engineering',  '{"K8s"}'),
  ('AI Engineering',   'AI/ML',                 '{"AI engineer","ML engineer"}'),
  ('LangChain',        'AI/ML',                 '{"LangChain framework"}'),
  ('Data Engineering', 'Data',                  '{"data eng"}'),
  ('dbt',              'Data',                  '{"dbt analytics","data build tool"}'),
  ('Snowflake',        'Data',                  '{}'),
  ('Product Design',   'Design',                '{"UX design","product designer"}'),
  ('Service Design',   'Design',                '{"service designer"}')
on conflict do nothing;
