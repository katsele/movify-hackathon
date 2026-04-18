# Forecast formula — canonical spec

This doc is the single source of truth for how `predicted_demand` and
`confidence` are computed. Both the Python cron engine
(`workers/forecast_engine.py`) and the TypeScript settings-recalc engine
(`lib/server/forecast-engine.ts`) implement this spec and are asserted
equal by a parity test.

---

## 1. Units

`predicted_demand` is expressed in **consultants (FTE-equivalent)**. Every
per-source scorer must return a headcount-equivalent number, never a raw
confidence score. `current_supply` is a head count of available
consultants. `gap = predicted_demand − current_supply` is therefore a
real consultants delta that the UI can label as such.

---

## 2. Per-source scorers (FTE units)

| Source | Formula | Constant | Rationale |
|---|---|---|---|
| `crm_pipeline` | `Σ quantity × probability × proximity` | — | Already in FTE; a deal row literally says "we want N consultants". |
| `procurement_notice` | `Σ confidence × decay × FTE_PER_TENDER` | `FTE_PER_TENDER = 2.0` | Federal/Belgian tenders explicitly ask for ~2 ETP on average (`docs/research/per-source-heuristics.md`). |
| `news_event` | `Σ confidence × decay × FTE_PER_NEWS` | `FTE_PER_NEWS = 0.5` | Qualitative — one news item implies "some" uplift, conservative. |
| `trend_spike` | `Σ confidence × decay × FTE_PER_TREND` | `FTE_PER_TREND = 0.3` | Lagging market-interest signal, weakest FTE predictor. |
| `job_posting` | `Σ confidence × decay × FTE_PER_POSTING` | `FTE_PER_POSTING = 1.0` | Each public posting ≈ one role at one client. |
| `historical_pattern` | `baseline_monthly × seasonal_index × (1 + BENCH_PRESSURE_GAIN × max(0, tightness))` | inherited from PR #22 | Weighted project starts / month, already FTE-equivalent. |

`proximity` and `decay` are in [0, 1] and act as time-based dampeners.
Multiplying by the FTE constant converts the signal-count/confidence
into expected headcount at the target month.

---

## 3. Aggregation — weighted average over active sources

Once each scorer emits FTE units, the demand is a **trust-weighted
average over sources that contributed**, not a partition-weighted sum:

```
active = { source: estimate for source, estimate in estimates.items() if estimate > 0 }
if not active:
    predicted_demand = 0
else:
    total_weight     = Σ weights[source] for source in active
    predicted_demand = Σ estimates[source] × weights[source] for source in active
                     ────────────────────────────────────────
                                      total_weight
```

Properties:

- **One source active** → `demand = that_source_estimate × 1.0`. No
  artificial shrinkage when only CRM has fired.
- **Multiple active** → trust-weighted blend; high-trust sources
  dominate without drowning out others.
- **Result is in FTE units** (dimensionally consistent with inputs).

The historical dampening `HISTORY_DAMPEN_WITHOUT_CURRENT_SIGNAL = 0.5`
(from PR #22) still applies: if no current signal fired, the historical
estimate passed into the average is halved before the aggregation.

---

## 4. Confidence

```
active_sources = count of scorers that produced a non-zero estimate
base           = min(active_sources / 4, 1.0)
converging     = at least 2 *different* signal sources detected within
                 CONVERGENCE_WINDOW_DAYS of target month
confidence     = min(base + (0.2 if converging else 0), 1.0)
```

This is the simple, legible formula Sebastiaan can reason about. Both
engines must implement this exact formula — no source-confidence caps,
no exponential squashing, no product combination.

---

## 5. Shared constants (import from the constants modules)

| Constant | Value | Used by |
|---|---|---|
| `FTE_PER_TENDER` | 2.0 | procurement scorer |
| `FTE_PER_NEWS` | 0.5 | news scorer |
| `FTE_PER_TREND` | 0.3 | trend scorer |
| `FTE_PER_POSTING` | 1.0 | job-posting scorer |
| `CONFIDENCE_DIVISOR` | 4 | confidence base |
| `CONVERGENCE_BONUS` | 0.2 | confidence uplift |
| `CONFIDENCE_MAX` | 1.0 | confidence cap |
| `CONVERGENCE_WINDOW_DAYS` | 28 | convergence detection |
| `SIGNAL_RECENCY_WINDOW_DAYS` | 90 | signal decay horizon |

Historical-pattern constants (`HALF_LIFE_YEARS`, `BASELINE_WINDOW_MONTHS`,
`BENCH_PRESSURE_GAIN`, `MIN_HISTORY_WEIGHTED_STARTS`,
`BENCH_DURATION_WINDOW_MONTHS`, `HISTORY_DAMPEN_WITHOUT_CURRENT_SIGNAL`)
are inherited unchanged from PR #22.

---

## 6. Parity test

Both engines are exercised against an identical in-memory fixture
(3 skills, 1 CRM deal, 1 TED signal, 1 news item, 1 historical project)
and their `predicted_demand`, `confidence`, and `gap` outputs must match
within a `1e-6` float tolerance. If this test fails, one engine drifted
from the spec — fix the engine, not the test.
