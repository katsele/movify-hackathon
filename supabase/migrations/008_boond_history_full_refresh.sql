-- =============================================================================
-- Boond mockdata full-refresh: historical projects + full bench history
-- Pairs with workers/connectors/boond_csv.py's --replace-scope flag and the
-- four CSVs under mockdata/ (current + history for bench and projects).
-- =============================================================================

-- projects: distinguish current vs historical rows and preserve raw source metadata
alter table projects
  add column if not exists source_kind text not null default 'current'
    check (source_kind in ('current','history'));

alter table projects
  add column if not exists project_state text;

alter table projects
  add column if not exists project_type text;

alter table projects
  add column if not exists top_skill_tokens text[] not null default '{}';

create index if not exists idx_projects_source_kind on projects(source_kind);

-- consultant_bench_history: storage-only table for completed bench spells
create table if not exists consultant_bench_history (
  id                          uuid primary key default gen_random_uuid(),
  external_id                 text unique not null,
  consultant_name             text not null,
  consultant_slug             text not null,
  job_title                   text,
  seniority                   text,
  bench_started_at            date,
  bench_ended_at              date,
  duration_days               int,
  previous_client_name        text,
  previous_project_title      text,
  previous_project_ended_at   date,
  next_client_name            text,
  next_project_title          text,
  next_project_started_at     date,
  outcome                     text,
  primary_skill_tokens        text[] not null default '{}',
  agency                      text,
  country                     text,
  created_at                  timestamptz default now()
);

create index if not exists idx_bench_history_slug    on consultant_bench_history(consultant_slug);
create index if not exists idx_bench_history_started on consultant_bench_history(bench_started_at);

create table if not exists consultant_bench_history_skills (
  bench_history_id uuid references consultant_bench_history(id) on delete cascade,
  skill_id         uuid references skills(id) on delete restrict,
  proficiency      text default 'mid' check (proficiency in ('junior','mid','senior','expert')),
  primary key (bench_history_id, skill_id)
);
