-- =============================================================================
-- Story 1 seed — one consultant on bench + one forecast row for AI Engineering
-- Source: docs/epic-breakdown.md §Story 1 acceptance criteria
-- Idempotent: safe to re-run.
-- =============================================================================

-- Consultant -----------------------------------------------------------------
insert into consultants (external_id, name, current_status, available_from)
values ('seed-story1-c1', 'Story 1 Seed Consultant', 'on_bench', current_date)
on conflict (external_id) do nothing;

-- Consultant ↔ skill link ----------------------------------------------------
insert into consultant_skills (consultant_id, skill_id, proficiency)
select
  (select id from consultants where external_id = 'seed-story1-c1'),
  (select id from skills where name = 'AI Engineering'),
  'mid'
on conflict (consultant_id, skill_id) do nothing;

-- Forecast row ---------------------------------------------------------------
-- week +4, predicted_demand=3, current_supply=1, gap=2
insert into forecasts (
  forecast_week,
  skill_id,
  predicted_demand,
  current_supply,
  gap,
  confidence,
  notes
)
select
  (date_trunc('week', current_date) + interval '4 weeks')::date,
  (select id from skills where name = 'AI Engineering'),
  3,
  1,
  2,
  0.5,
  'Story 1 seed'
on conflict (forecast_week, skill_id) do nothing;
