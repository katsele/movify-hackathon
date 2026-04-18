-- =============================================================================
-- Story 4 — drop TED seed + broaden recent_signals to include skill-less notices
--
-- 1. Delete demo-safety TED seeds (raw_data.seed = true). All real notices now
--    come from the live TED connector.
-- 2. Switch recent_signals' signal_skills join from INNER to LEFT so procurement
--    notices that didn't match any taxonomy skill still appear in the feed —
--    Sebastiaan wants to eyeball those to extend the taxonomy.
--
-- The convergence and skill-aggregate columns fall back sensibly: skill_name
-- is NULL, skill_names becomes a single-element NULL array (filtered client-
-- side), and converging_count coalesces to 0.
-- =============================================================================
delete from signals
where source = 'ted_procurement'
  and raw_data->>'seed' = 'true';

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
  -- `filter` drops the NULL rows produced by the LEFT JOIN so skill-less
  -- notices yield empty arrays (via coalesce) instead of `{NULL}`.
  coalesce(array_agg(s.name order by s.name) filter (where s.name is not null), '{}') as skill_names,
  coalesce(array_agg(s.discipline order by s.name) filter (where s.discipline is not null), '{}') as skill_disciplines,
  coalesce(array_agg(ss.confidence order by s.name) filter (where ss.confidence is not null), '{}') as confidences,
  coalesce(max(ss.confidence), 0) as confidence,
  cs.converges_with_sources,
  cs.converging_skills,
  coalesce(cs.converging_count, 0) as converging_count
from signals sig
left join signal_skills ss on sig.id = ss.signal_id
left join skills s          on ss.skill_id = s.id
left join converging_signals cs on cs.signal_id = sig.id
where sig.detected_at > now() - interval '30 days'
group by sig.id, cs.converges_with_sources, cs.converging_skills, cs.converging_count
order by sig.detected_at desc;
