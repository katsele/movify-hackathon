-- =============================================================================
-- Story 3 — news-intelligence support
-- 1. Partial unique index on signals(url) so the news connector can upsert
--    idempotently on rerun (other sources sometimes omit url, hence partial).
-- 2. Redefine recent_signals to expose url + raw_data and aggregate skills
--    per-signal so the UI can render one card per news item (instead of one
--    row per (signal, skill) pair).
-- =============================================================================

-- Non-partial so PostgREST's on_conflict=url can infer it.
-- Postgres treats NULLs in unique indexes as distinct, so signals without a
-- URL (Google Trends, some Boond-derived pipeline signals) are still allowed.
-- Drop constraint first (it owns the backing index); a bare drop-index fails
-- once the constraint exists, because the index can't be removed independently.
alter table signals drop constraint if exists signals_url_unique;
drop index if exists signals_url_unique;
alter table signals add constraint signals_url_unique unique (url);

-- Drop-and-recreate because the column order changes (Postgres refuses to
-- rename/reorder columns via CREATE OR REPLACE VIEW).
drop view if exists recent_signals;

create view recent_signals as
select
  sig.id           as signal_id,
  sig.source,
  sig.signal_type,
  sig.title,
  sig.url,
  sig.raw_data,
  sig.detected_at,
  sig.region,
  -- Primary skill (alphabetically first, stable) kept for backwards-compat.
  min(s.name)      as skill_name,
  min(s.discipline) as discipline,
  -- Full skill list for cards that render multiple tags.
  -- skill_names[i] ↔ skill_disciplines[i] ↔ confidences[i] share ordering.
  array_agg(s.name       order by s.name) as skill_names,
  array_agg(s.discipline order by s.name) as skill_disciplines,
  array_agg(ss.confidence order by s.name) as confidences,
  max(ss.confidence)                      as confidence
from signals sig
join signal_skills ss on sig.id = ss.signal_id
join skills s          on ss.skill_id = s.id
where sig.detected_at > now() - interval '30 days'
group by sig.id
order by sig.detected_at desc;
