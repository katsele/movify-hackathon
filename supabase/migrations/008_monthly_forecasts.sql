-- =============================================================================
-- Switch forecast horizon from weekly to monthly buckets.
-- Renames the column, unique constraint, and index on `forecasts` so the
-- existing 12-period grid now stores one row per skill per month. Any legacy
-- weekly rows are cleared because they'd map to arbitrary month-starts.
-- Idempotent: safe to re-run.
-- =============================================================================

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'forecasts' and column_name = 'forecast_week'
  ) then
    delete from forecasts;
    alter table forecasts rename column forecast_week to forecast_month;
  end if;
end$$;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conrelid = 'forecasts'::regclass
      and conname = 'forecasts_forecast_week_skill_id_key'
  ) then
    alter table forecasts
      rename constraint forecasts_forecast_week_skill_id_key
      to forecasts_forecast_month_skill_id_key;
  end if;
end$$;

drop index if exists idx_forecasts_week;
create index if not exists idx_forecasts_month on forecasts(forecast_month);
