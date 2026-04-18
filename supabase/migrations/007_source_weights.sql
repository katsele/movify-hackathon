-- =============================================================================
-- Story V4 — configurable forecast source weights
--
-- Persist the factor-level weights that drive the forecast engine so the
-- settings page and both forecast runtimes (Next.js + Python) read the same
-- source of truth.
-- =============================================================================

create table if not exists source_weights (
  source_key  text primary key,
  weight      double precision not null check (weight >= 0 and weight <= 1),
  updated_at  timestamptz not null default now()
);

insert into source_weights (source_key, weight)
values
  ('crm_pipeline', 0.35),
  ('procurement_notice', 0.25),
  ('historical_pattern', 0.15),
  ('trend_spike', 0.10),
  ('job_posting', 0.10),
  ('news_event', 0.05)
on conflict (source_key) do nothing;
