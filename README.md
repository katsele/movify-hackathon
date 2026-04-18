# Skills Demand Forecaster

A demand forecasting engine for IT consultancy staffing, built for Movify. It predicts which skills clients will need in the next 12 weeks by combining Boond CRM pipeline data with external market signals (TED procurement notices, Google Trends, news feeds). Think hotel yield management, but for consultant staffing.

This is a hackathon build, desktop-first, single-user (Sebastiaan, talent lead at Movify). For product context see [`docs/value-prop.md`](docs/value-prop.md) and [`docs/prd.md`](docs/prd.md).

## Architecture at a glance

```
Python workers ──►  Supabase (Postgres)  ◄── Next.js app (Vercel)
   ingestion &        shared data store        reads & renders
   forecasting                                 the dashboard
```

- **Python workers** (`workers/`) pull data from external sources, extract skills, and write normalised records to Supabase tables.
- **Supabase** hosts the Postgres database, schema migrations, and auth. No separate API server.
- **Next.js app** (`app/`) reads directly from Supabase via `@supabase/supabase-js` and renders the dashboard.

For the full data model and ADRs, see [`docs/architecture.md`](docs/architecture.md).

## Prerequisites

- Node.js 20+
- Python 3.11+
- A Supabase project (the cloud free tier is fine)
- Boond API credentials (optional — without them the Boond connector is skipped, and mock data covers the frontend)

## First-time setup

1. **Install Node dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and fill in Supabase URL, anon key, and service-role key. Boond credentials are optional — see the [environment variables](#environment-variables) section below.

3. **Apply database migrations**

   Open the Supabase SQL editor for your project and run the four migration files in `supabase/migrations/` in order:

   1. `001_initial_schema.sql` — core tables (consultants, deals, skills, signals, forecasts, …)
   2. `002_story1_seed.sql` — demo seed data so the app is usable immediately
   3. `003_skill_taxonomy.sql` — skill discipline / alias taxonomy
   4. `004_news_intelligence.sql` — news signal tables and materialised views

4. **Install Python dependencies**

   ```bash
   cd workers
   pip install -r requirements.txt
   ```

## Run the frontend

```bash
npm run dev
```

Open http://localhost:3000.

Other scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | ESLint (flat config in `eslint.config.mjs`) |
| `npm run typecheck` | `tsc --noEmit` |

### Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard — KPI cards, compact heatmap, gap alerts, signal feed |
| `/forecast` | Full 12-week heatmap, filterable by discipline / region |
| `/forecast/[skill]` | Skill drill-down: demand curve, contributing signals, recommended action |
| `/bench` | Consultants by discipline + pipeline deals with timeline |
| `/signals` | Filterable explorer of raw ingested signals |
| `/settings` | Forecast factor weights and immediate recalculation |

## Run the Python worker suite

All workers share one CLI entry point:

```bash
cd workers
python run_connector.py <source>
```

Env vars are auto-loaded from `.env.local` via `python-dotenv`. Every worker needs:

- `SUPABASE_URL` (or falls back to `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY`

### Connectors

| Command | Source | Writes to | Extra env needed |
|---|---|---|---|
| `python run_connector.py boond` | Boondmanager CRM | `consultants`, `deals`, `deal_profiles`, `projects` | Boond JWT triple (`BOOND_USER_TOKEN`, `BOOND_CLIENT_TOKEN`, `BOOND_CLIENT_KEY`) **or** Basic auth (`BOOND_USERNAME`, `BOOND_PASSWORD`) |
| `python run_connector.py boond_csv` | Boond CSV exports in `mockdata/` (fallback when the live API is unavailable) | `consultants`, `consultant_skills`, `projects`, `project_skills` | Optional `BOOND_CSV_DIR` to override the default `mockdata/` path |
| `python run_connector.py ted_procurement` | TED EU procurement notices | `signals`, `signal_skills` | — |
| `python run_connector.py google_trends` | Google Trends, geo=BE | `signals`, `signal_skills` | — |
| `python run_connector.py news_intelligence` | News RSS / Atom feeds | `signals`, `signal_skills`, news event tables | — |

### Forecast aggregator

```bash
python run_forecast.py
```

`run_forecast.py` reads the tables populated by the connectors and writes the `forecasts` table. It uses heuristic weighted aggregation (no ML):

| Signal | Weight |
|---|---|
| CRM pipeline (Boond) | 0.35 |
| Procurement notices (TED) | 0.25 |
| Historical patterns | 0.15 |
| Trend signals (Google Trends) | 0.10 |
| Job postings | 0.10 |

Confidence = number of converging signal sources / 4, capped at 1.0.

### Recommended cold-start order

```bash
python run_connector.py boond
python run_connector.py ted_procurement
python run_connector.py google_trends
python run_connector.py news_intelligence
python run_forecast.py
```

Running the forecast before the connectors produces empty or low-confidence output — seed signals first.

## Project layout

```
budapest-v1/
├── app/                          Next.js App Router pages
│   ├── page.tsx                  Dashboard (/)
│   ├── forecast/                 /forecast and /forecast/[skill]
│   ├── bench/                    /bench
│   └── signals/                  /signals
├── components/                   React components (ForecastHeatmap, KPICard, SignalCard, shadcn/ui, …)
├── lib/                          Supabase client, TypeScript types, React Query hooks, mock data
├── workers/                      Python data ingestion and forecasting
│   ├── run_connector.py          CLI: run a single connector
│   ├── run_forecast.py           CLI: regenerate the forecasts table
│   ├── forecast_engine.py        Weighted signal aggregation logic
│   ├── requirements.txt          Python dependencies
│   └── connectors/
│       ├── base.py               Abstract BaseConnector
│       ├── boond.py              Boondmanager CRM connector
│       ├── ted_procurement.py    TED EU procurement connector
│       ├── google_trends.py      Google Trends (pytrends, geo=BE)
│       ├── news_intelligence.py  News feed connector (composes the modules below)
│       ├── news_feeds.py         Feed discovery and parsing
│       ├── news_clients.py       HTTP client helpers for news
│       ├── news_events.py        Event extraction and deduplication
│       ├── news_priors.py        Source reliability priors
│       └── skill_extractor.py    Shared keyword/NLP skill extraction
├── supabase/migrations/          Versioned SQL migrations (run in order, see setup)
├── docs/                         Product, architecture, UX, and research documentation
├── CLAUDE.md                     Coding conventions and architectural decisions (read this second)
└── .env.local.example            Template for required environment variables
```

## Environment variables

All variables live in `.env.local` (never commit this file). Template is `.env.local.example`.

| Variable | Consumer | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend | Yes | Supabase project URL (shipped to the browser) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend | Yes | Supabase anon key (shipped to the browser) |
| `SUPABASE_URL` | Workers | Yes (falls back to `NEXT_PUBLIC_SUPABASE_URL`) | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Workers + Next.js server routes | Yes | Service-role key for writes and on-demand forecast recalculation. Never expose to the browser. |
| `BOOND_API_BASE` | Workers (Boond) | No | Defaults to `https://ui.boondmanager.com/api` |
| `BOOND_USER_TOKEN` | Workers (Boond) | JWT scheme | JWT payload user token |
| `BOOND_CLIENT_TOKEN` | Workers (Boond) | JWT scheme | JWT payload client token |
| `BOOND_CLIENT_KEY` | Workers (Boond) | JWT scheme | HS256 signing secret |
| `BOOND_USERNAME` | Workers (Boond) | Basic scheme | Boond account email |
| `BOOND_PASSWORD` | Workers (Boond) | Basic scheme | Boond account password |

The Boond connector tries the JWT scheme first, then falls back to Basic auth. Supply one or the other, not both.

## Where to go next

- [`CLAUDE.md`](CLAUDE.md) — coding conventions, architectural decisions, what NOT to build
- [`docs/prd.md`](docs/prd.md) — product requirements, user stories, success metrics
- [`docs/value-prop.md`](docs/value-prop.md) — value proposition and competitive landscape
- [`docs/architecture.md`](docs/architecture.md) — system design, data model, full schema
- [`docs/epic-breakdown.md`](docs/epic-breakdown.md) — hackathon build sequence and dependencies
- [`docs/ux-spec.md`](docs/ux-spec.md) — page layouts, components, colour system
- [`docs/research/`](docs/research/) — market research and data-source feasibility

## Troubleshooting

**`missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in environment`**
The worker couldn't find Supabase credentials. Make sure `.env.local` exists at the repo root (not inside `workers/`) and contains both `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`. `python-dotenv` looks for `.env.local` one level above `workers/`.

**Boond connector returns 401**
You're probably mixing auth schemes. Use the JWT triple (`BOOND_USER_TOKEN` + `BOOND_CLIENT_TOKEN` + `BOOND_CLIENT_KEY`) **or** Basic auth (`BOOND_USERNAME` + `BOOND_PASSWORD`), not both. The JWT values come from Boond admin under Dashboard → API Keys.

**Forecast heatmap is empty or all grey**
The `forecasts` table is empty. Run the connectors to populate `signals` / `deals`, then run `python run_forecast.py`. If the heatmap shows cells with hatched / low-opacity patterns, that's expected — it means low confidence, not missing data.

**pytrends fails with `TooManyRequestsError`**
Google Trends rate-limits aggressively. Wait a few minutes and re-run `python run_connector.py google_trends`. If it fails repeatedly, the connector batches requests — reduce the batch size in `workers/connectors/google_trends.py`.
