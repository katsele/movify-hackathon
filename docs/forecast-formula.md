# Forecast formula (V1)

This document is the canonical spec for how `predicted_demand`, `confidence`, and `gap` are computed. Both runtimes must match:

- **Python:** `workers/forecast_engine.py` (cron / `python -m workers.run_forecast`)
- **TypeScript:** `lib/server/forecast-engine.ts` (settings recalc via `PUT /api/settings/source-weights`)

## Semantics

| Column | Meaning |
|--------|---------|
| `predicted_demand` | Expected **consultant headcount** (FTE-equivalent) needed for that skill in that forecast month. |
| `current_supply` | Count of consultants with that skill who are available (not on mission) by that month. |
| `gap` | `predicted_demand - current_supply` (same units). |

External signal rows store `confidence ∈ [0, 1]` and recency decay. Raw scores `Σ confidence × decay` are **not** headcount; we multiply by source-specific **FTE calibration constants** so procurement/news/trends/postings contribute plausible consultant-scale numbers before aggregation.

`historical_pattern` is already in headcount units (weighted project starts per month × seasonality × bench pressure) — see PR #22.

## FTE calibration (external signals)

After summing `confidence × decay` for each source family, multiply:

| Factor key | Multiplier | Rationale |
|------------|------------|-----------|
| `procurement_notice` | `FTE_PER_TENDER = 2.0` | Public tenders often request ~2 ETP; see `docs/research/per-source-heuristics.md`. |
| `news_event` | `FTE_PER_NEWS = 0.5` | Qualitative press — weak implied headcount. |
| `trend_spike` | `FTE_PER_TREND = 0.3` | Search interest lags and does not map 1:1 to roles. |
| `job_posting` | `FTE_PER_POSTING = 1.0` | One live posting ≈ one role at one employer. |

`crm_pipeline` is already in headcount units: `Σ quantity × probability × proximity(month)`.

## Source weights

Weights are stored in `source_weights` (and defaults in code). They sum to **1.0** and represent **trust** in each factor’s headcount estimate, not a partition of a fixed budget.

## Aggregation: weighted average over active sources

Let `estimates[k]` be the headcount estimate for factor `k` (0 if inactive). Let `w[k]` be the configured weight.

```
active = { k | estimates[k] > 0 }
if active is empty → predicted_demand = 0
else
  predicted_demand = Σ (estimates[k] × w[k]) / Σ w[k]  for k in active
```

So a single active source contributes its full estimate (no shrinkage from unused weights). Multiple sources contribute a trust-weighted average.

When there is no “current” external/CRM signal, `historical_pattern` is still computed but multiplied by `HISTORY_DAMPEN_WITHOUT_CURRENT_SIGNAL` (0.5) before entering `estimates`.

## Confidence

Aligned across engines:

```
activeFactors = count of factors with estimate > 0
baseConfidence = min(activeFactors / 4, 1)
converging = at least two distinct signal sources have detected_at within 28 days of the target month
confidence = min(baseConfidence + (converging ? 0.2 : 0), 1)
```

Signal **sources** use `signals.source` (e.g. `ted_procurement`, `news`). `historical_pattern` and `crm_pipeline` are not signal rows; convergence is based on external signal diversity only (same as TS `convergentSources`).

## Rounding

Persisted `predicted_demand`, `gap`, and `confidence` are rounded to 2 decimal places in storage. UI may show one decimal for values with `|x| < 1` to avoid rounding noise to 0 or 1.

## Regenerating forecasts (backfill)

After changing formula constants or weights, regenerate rows so both runtimes stay aligned:

1. **TypeScript (settings path):** `PUT /api/settings/source-weights` with a valid body (weights summing to 100). This runs `generateAndPersistForecasts` in `lib/server/forecast-engine.ts`.

2. **Python (worker path):** from `workers/`, with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set and dependencies installed (`pip install -r requirements.txt`), run `python run_forecast.py`.

Both upsert `forecasts` on `(forecast_month, skill_id)`; the latest run wins.
