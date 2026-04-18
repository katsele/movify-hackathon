-- =============================================================================
-- Story 4 — signal convergence detection
--
-- When a skill is hit by signals from two or more *different* sources within a
-- 4-week window, those signals converge. The forecast engine (Story 5) will
-- weight them up; the UI (SignalCard) surfaces a "Converging · N" marker so
-- Sebastiaan can see triangulation at a glance.
--
-- Convergence is computed in SQL (not the forecast engine, not the client)
-- because:
--   1. The UI must render the marker in Story 4, before the forecast engine
--      ships.
--   2. A single view keeps news + procurement + future sources consistent and
--      lets the forecast engine reuse the same definition.
-- =============================================================================

-- For each signal, list the distinct *other* sources it converges with, which
-- skills created the convergence, and how many other signals it overlaps with.
-- Self-joins `signal_skills` on `skill_id` and filters to different-source,
-- within-28-days pairs.
drop view if exists converging_signals;
create view converging_signals as
select
  ss_a.signal_id,
  array_agg(distinct sig_b.source)      as converges_with_sources,
  array_agg(distinct s.name)            as converging_skills,
  count(distinct ss_b.signal_id)::int   as converging_count
from signal_skills ss_a
join signals sig_a       on sig_a.id = ss_a.signal_id
join signal_skills ss_b  on ss_b.skill_id = ss_a.skill_id
                         and ss_b.signal_id <> ss_a.signal_id
join signals sig_b       on sig_b.id = ss_b.signal_id
                         and sig_b.source <> sig_a.source
                         and abs(extract(epoch from (sig_b.detected_at - sig_a.detected_at))) < 28 * 86400
join skills s            on s.id = ss_a.skill_id
group by ss_a.signal_id;

-- Rebuild recent_signals to expose the convergence columns alongside the
-- existing signal payload. Same shape as migration 004 + three new columns.
drop view if exists recent_signals;
create view recent_signals as
select
  sig.id            as signal_id,
  sig.source,
  sig.signal_type,
  sig.title,
  sig.url,
  sig.raw_data,
  sig.detected_at,
  sig.region,
  min(s.name)       as skill_name,
  min(s.discipline) as discipline,
  array_agg(s.name       order by s.name)  as skill_names,
  array_agg(s.discipline order by s.name)  as skill_disciplines,
  array_agg(ss.confidence order by s.name) as confidences,
  max(ss.confidence) as confidence,
  cs.converges_with_sources,
  cs.converging_skills,
  coalesce(cs.converging_count, 0) as converging_count
from signals sig
join signal_skills ss on sig.id = ss.signal_id
join skills s          on ss.skill_id = s.id
left join converging_signals cs on cs.signal_id = sig.id
where sig.detected_at > now() - interval '30 days'
group by sig.id, cs.converges_with_sources, cs.converging_skills, cs.converging_count
order by sig.detected_at desc;

-- Supporting index: the self-join above filters on skill_id first, then
-- excludes same signal_id. Hackathon-scale volumes don't need this, but it's
-- a one-liner and keeps V1 happy.
create index if not exists idx_signal_skills_skill on signal_skills(skill_id);
