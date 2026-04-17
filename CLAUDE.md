# CLAUDE.md — Skills Demand Forecaster

## What is this project?

A **demand forecasting engine for IT consultancy staffing**, built for Movify — a 100+ person Belgian digital consultancy. It predicts which skills clients will need in 3–6 months by combining CRM pipeline data (Boond) with external market signals (procurement feeds, Google Trends, ATS job postings). Think hotel/airline yield management, but for consultant staffing.

The product does NOT just track current vacancies (red ocean). It **predicts future demand** by wiring together signals that already exist in the open but nobody is combining: public procurement pipelines, technology adoption curves, CRM deal flow, and seasonal patterns.

**Primary user:** Sebastiaan (talent lead at Movify). One power user, desktop-first, data-dense dashboard.

## Documentation

All design decisions are documented. Read these before making architectural choices:

- `docs/value-prop.md` — Why this product exists, who it's for, competitive landscape
- `docs/prd.md` — Product requirements, user stories, success metrics, scope
- `docs/architecture.md` — System design, data model, API patterns, ADRs
- `docs/epic-breakdown.md` — Hackathon stories, build sequence, dependencies
- `docs/ux-spec.md` — Page layouts, component inventory, interaction patterns, colour system
- `docs/research/` — Market research, data source feasibility, competitive analysis

## Tech stack

### Frontend
- **Next.js** (App Router) deployed on **Vercel**
- **React** with TypeScript
- **Tailwind CSS** + **shadcn/ui** for components
- **recharts** for data visualisation (heatmap, line charts, bar charts)
- **@tanstack/react-query** + **supabase-js** for data fetching
- No Redux — React Query handles server state, React context for UI state only

### Backend
- **Supabase** (cloud-hosted, greenfield project) — PostgreSQL, Auth, Realtime, Edge Functions
- No separate API server. Next.js reads from Supabase directly. Python workers write to Supabase.

### Data ingestion & forecasting
- **Python** workers for connectors and forecasting engine
- Libraries: `supabase-py`, `httpx`, `pandas`, `pytrends`
- Run manually during hackathon, scheduled via GitHub Actions or Railway for V1

### Infrastructure
- Supabase Cloud (free tier → Pro at $25/mo)
- Vercel (free tier for Next.js)
- GitHub Actions or Railway for Python worker scheduling (V1)
- No self-hosted infrastructure. No Docker needed for hackathon.

## Project structure

```
movify-hackaton/
├── CLAUDE.md                  # This file
├── docs/                      # All design documentation
│   ├── value-prop.md
│   ├── prd.md
│   ├── architecture.md
│   ├── epic-breakdown.md
│   ├── ux-spec.md
│   └── research/              # Market research artifacts
│
├── app/                       # Next.js App Router
│   ├── layout.tsx             # Root layout with SidebarNav
│   ├── page.tsx               # Dashboard (home)
│   ├── forecast/
│   │   ├── page.tsx           # Full 12-week heatmap
│   │   └── [skill]/page.tsx   # Skill drill-down
│   ├── bench/
│   │   └── page.tsx           # Consultants + pipeline
│   └── signals/
│       └── page.tsx           # Signal explorer
│
├── components/
│   ├── ForecastHeatmap.tsx    # Grid: skills × weeks, colour-coded
│   ├── DemandCurve.tsx        # Line chart: demand vs supply
│   ├── KPICard.tsx            # Big number + trend + sparkline
│   ├── GapAlert.tsx           # Coloured alert card
│   ├── SignalCard.tsx         # Signal with icon, metadata, skill tags
│   ├── SignalWeightChart.tsx  # Horizontal bars for signal contributions
│   ├── ActionCard.tsx         # Recommended action with explanation
│   ├── ConsultantRow.tsx      # Name + seniority + status + availability
│   ├── DealRow.tsx            # Deal + client + profiles + probability
│   ├── SidebarNav.tsx         # Left sidebar navigation
│   ├── PageHeader.tsx         # Title + last updated + refresh
│   ├── FilterBar.tsx          # Dropdown filters + active chips
│   ├── SkillTag.tsx           # Pill badge with skill name
│   ├── StatusBadge.tsx        # Coloured dot + status label
│   ├── ConfidenceIndicator.tsx
│   └── ui/                    # shadcn/ui components
│
├── lib/
│   ├── supabase.ts            # Supabase client (browser + server)
│   ├── types.ts               # TypeScript types matching DB schema
│   └── hooks/
│       ├── useForecast.ts     # React Query hook for forecast data
│       ├── useBench.ts
│       └── useSignals.ts
│
├── workers/                   # Python data ingestion
│   ├── connectors/
│   │   ├── base.py            # Abstract base connector
│   │   ├── boond.py           # Boond CRM connector
│   │   ├── ted_procurement.py # TED API v3
│   │   ├── google_trends.py   # pytrends geo=BE
│   │   └── skill_extractor.py # NLP skill extraction
│   ├── forecast_engine.py     # Weighted signal aggregation
│   ├── run_connector.py       # CLI entry point
│   ├── run_forecast.py        # CLI entry point
│   └── requirements.txt
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Full schema from architecture doc
│
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local                 # NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Architecture decisions (ADRs)

These decisions are final. Do not deviate without explicit discussion.

1. **Supabase as backend, not a custom API server.** Next.js reads from Supabase via supabase-js. Python workers write to Supabase via supabase-py. No Express, no Fastify, no tRPC.

2. **Python for ingestion and forecasting, TypeScript for frontend.** The boundary is clean: Python writes to Supabase tables, Next.js reads from them. They never communicate directly.

3. **Heuristic scoring, not ML.** The V1 forecasting engine uses weighted signal aggregation with manual calibration. No trained models — we have zero feedback data. ML is a V2 investment after 6+ months of forecast-vs-actual data.

4. **CRM-agnostic data model.** Internal tables use generic names (deals, consultants, skills) not Boond field names. The Boond connector is an adapter. Future CRM connectors plug in at the same layer.

5. **Confidence is explicit everywhere.** Every forecast shows its confidence score. Low confidence uses reduced opacity + hatched pattern in the UI. Never hide uncertainty.

## Database schema

The full schema is in `docs/architecture.md` Section 3. Key tables:

- `skills` — Taxonomy: name, discipline, aliases, ESCO/Lightcast mappings
- `consultants` — From Boond: name, status, available_from
- `consultant_skills` — Many-to-many with proficiency
- `deals` — Pipeline: title, client, status, expected_start, probability
- `deal_profiles` — Requested profiles per deal: skill, quantity, seniority
- `projects` / `project_skills` — Historical missions (for pattern learning)
- `signals` — Unified signal store: source, type, title, raw_data JSONB, region
- `signal_skills` — Skills extracted from signals with confidence
- `forecasts` — Output: skill, week, predicted_demand, current_supply, gap, confidence, contributing_signals
- `forecast_actuals` — Retrospective accuracy tracking (V1)

Key views: `bench_summary`, `pipeline_demand`, `recent_signals`.

## Forecasting engine

The forecast engine combines five signal types with configurable weights:

| Signal | Weight | Source |
|---|---|---|
| CRM pipeline | 0.35 | Boond deals with probability and timing |
| Procurement notices | 0.25 | TED API + BOSA e-Procurement |
| Historical patterns | 0.15 | Seasonality from past projects |
| Trend signals | 0.10 | Google Trends geo=BE |
| Job postings | 0.10 | ATS endpoints (Greenhouse, Lever) |

**Confidence** = number of converging signal sources / 4 (capped at 1.0). A prediction backed by 3+ sources is high confidence; a prediction from pipeline alone is low confidence.

**Output:** A rolling 12-week forecast per skill, with predicted demand, current supply, gap, confidence, contributing signal IDs, and a human-readable explanation.

## Connector pattern

All Python connectors follow the same interface (see `docs/architecture.md` Section 4):

```python
class BaseConnector(ABC):
    def fetch_raw(self) -> list[dict]       # Get data from external source
    def transform(self, raw) -> list[dict]  # Map to internal schema
    def load(self, signals)                 # Write to Supabase
    def run(self)                           # Full ETL cycle
```

Boond connector writes to `consultants`, `deals`, `deal_profiles`, `projects` tables.
All other connectors write to the `signals` + `signal_skills` tables.

## UX patterns

The dashboard follows **Shneiderman's mantra: overview first, zoom and filter, details on demand.**

### Page hierarchy
1. **Dashboard** (`/`) — KPI cards + compact heatmap + gap alerts + signal feed. The Monday morning glance.
2. **Forecast** (`/forecast`) — Full interactive heatmap. Filter by discipline, region, timeframe.
3. **Skill drill-down** (`/forecast/[skill]`) — Demand curve, contributing signals, bench detail, recommended action.
4. **Bench** (`/bench`) — Consultants by discipline + pipeline deals with timeline.
5. **Signals** (`/signals`) — Filterable signal explorer.

### Navigation
Left sidebar, 4 items: Dashboard, Forecast, Bench, Signals. Always visible, collapsible.

### Colour semantics
- Red (`#DC2626`) = gap ≥ 3 (action needed)
- Amber (`#D97706`) = gap 1–2 (watch)
- Green (`#059669`) = covered (supply ≥ demand)
- Reduced opacity + hatched pattern = low confidence
- Never use colour as the sole encoding — always pair with text/numbers

### Component library
Use **shadcn/ui** (Card, Table, Badge, Button, DropdownMenu, Tooltip) with Tailwind. Custom components only for: ForecastHeatmap, DemandCurve, SignalWeightChart. Everything else composes from shadcn primitives.

## Coding conventions

### TypeScript (frontend)
- Strict mode enabled
- Prefer `interface` over `type` for object shapes
- Use React Server Components where possible (data fetching in server components, interactivity in client components)
- Named exports for components, default export for pages
- Hooks in `lib/hooks/`, utilities in `lib/`
- All Supabase queries go through custom hooks (e.g., `useForecast`, `useBench`) — never raw `supabase.from()` in components

### Python (workers)
- Python 3.11+
- Type hints on all function signatures
- `httpx` for HTTP requests (async-capable, modern)
- `supabase-py` for database writes
- `pandas` only where DataFrame operations are genuinely useful (not for simple transforms)
- Each connector in its own file under `workers/connectors/`
- CLI entry points: `run_connector.py <source_name>` and `run_forecast.py`

### General
- No console.log in committed code (use proper logging)
- Environment variables for all secrets and config. Never hardcode Supabase URLs or keys.
- `.env.local` for local development (gitignored). Vercel env vars for production.

## Key constraints

1. **This is a hackathon build.** Speed > perfection. Working > polished. Real data > mocked data.
2. **Single user (Sebastiaan).** No multi-tenancy, no role-based access, no team features for now.
3. **Desktop-first.** Mobile is not a target. Don't spend time on responsive layouts beyond basic graceful degradation.
4. **Boond data access is the first thing to resolve.** API or export — this determines whether connectors run live or on snapshots.
5. **No LinkedIn scraping.** By design. The architecture deliberately reduces reliance on vacancy data by using broader signals.
6. **Multilingual NLP is hard.** Belgian data mixes NL, FR, EN — often in one document. Start with simple keyword matching against skill aliases. Don't over-engineer the NLP for the hackathon.
7. **Forecast accuracy will be low at first.** That's expected. Confidence scores exist to communicate this honestly. Never hide uncertainty.

## Hackathon build sequence

See `docs/epic-breakdown.md` for full details. Summary:

1. **Skeleton** (1h) — Supabase schema + seed data + Next.js on Vercel + one data point visible
2. **Real bench** (1.5h) — Boond connector + real consultant/pipeline data in dashboard
3. **Procurement signals** (1h) — TED API connector + skill extraction + signal feed
4. **Trend signals** (45min) — Google Trends connector + trend indicators
5. **Forecast** (1.5h) — Forecast engine + heatmap + gap alerts
6. **Polish** (30min) — Demo flow, clean UI, narrative prep

Minimum viable demo = stories 1–3 + 5. Stories 4 and 6 are cuttable.

## What NOT to build

- No authentication (single user, hackathon)
- No mobile layouts
- No dark mode
- No onboarding/tutorials
- No custom design system (use shadcn/ui)
- No ML models (heuristics only)
- No real-time websocket updates (polling or manual refresh is fine)
- No email digest (V1)
- No multi-language UI (English only)
