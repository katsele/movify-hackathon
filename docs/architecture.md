# Skills Demand Forecaster — Architecture

*Movify — April 2026*
*Stack: Next.js + React · Supabase (cloud) · Python ingestion workers*

---

## 1. System Overview

The Skills Demand Forecaster is a three-layer system: **data ingestion** (collecting signals), **forecasting engine** (processing and predicting), and **presentation layer** (dashboard + digests). This is a greenfield project on Supabase (cloud-hosted), designed to stand on its own from day one.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│                     Next.js + React Dashboard                      │
│  ┌──────────┐  ┌──────────────┐  ┌─────────┐  ┌───────────────┐   │
│  │ Forecast  │  │ Bench vs.    │  │ Signal  │  │ Weekly Digest │   │
│  │ Heatmap   │  │ Demand View  │  │ Explorer│  │ (Email/UI)    │   │
│  └──────────┘  └──────────────┘  └─────────┘  └───────────────┘   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ Supabase Realtime + REST API
┌─────────────────────────┴───────────────────────────────────────────┐
│                       SUPABASE (Movify)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL   │  │  Edge        │  │  Supabase Auth           │  │
│  │  (all data)   │  │  Functions   │  │  (team access control)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────────┐
│                     DATA INGESTION + FORECASTING                    │
│                        Python Workers (cron)                        │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Boond     │  │  TED /    │  │  Google    │  │  Forecasting  │  │
│  │  Connector │  │  e-Proc   │  │  Trends +  │  │  Engine       │  │
│  │            │  │  Ingester │  │  ATS Feeds │  │  (scoring)    │  │
│  └───────────┘  └───────────┘  └────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Decisions

### ADR-1: Supabase as backend (not custom API server)

**Decision:** Use Supabase (cloud-hosted) PostgreSQL as the single source of truth, with Edge Functions for any server-side logic, and Supabase Realtime for live dashboard updates.

**Rationale:** Greenfield Supabase gives us a fully managed PostgreSQL database, built-in auth, realtime subscriptions, and Edge Functions — all without standing up infrastructure. Eliminates the need for a separate API server. Row Level Security (RLS) handles access control. For a hackathon, this means zero backend boilerplate — just schema + functions. Free tier is sufficient for MVP; Pro plan ($25/mo) if we need more.

**Trade-off:** Less flexibility than a custom Express/Fastify server, but the hackathon constraint and speed-to-value outweigh this. Cloud-hosted means no infra management.

### ADR-2: Python for data ingestion (not TypeScript)

**Decision:** Data ingestion workers and the forecasting engine are written in Python, running as scheduled jobs (GitHub Actions for hackathon, Railway/Fly.io for V1).

**Rationale:** Python has superior libraries for the ingestion and forecasting workload: `pytrends` for Google Trends, `requests`/`httpx` for API calls, `pandas` for data transformation, `spacy`/`transformers` for NLP skill extraction, and `supabase-py` for database writes. The ML/NLP ecosystem is Python-native. Workers can run as Supabase Edge Functions (Deno/TS) for simple tasks, or as a lightweight cron service on any hosting (Railway, Fly.io, a simple VPS, or even GitHub Actions on a schedule).

**Trade-off:** Two languages in the stack (TS frontend + Python backend workers). Acceptable because the boundary is clean: Python writes to Supabase, Next.js reads from Supabase. They never directly communicate.

### ADR-3: Next.js for the dashboard (not plain React)

**Decision:** Use Next.js with App Router for the dashboard, deployed on Vercel (free tier).

**Rationale:** SSR for initial load performance. API routes available if needed for any light server-side processing. Aligns with modern React patterns. Deploys trivially on Vercel (free tier) with zero config.

### ADR-4: Start with heuristic scoring, not ML

**Decision:** The V1 forecasting engine uses weighted signal aggregation and heuristic rules, not trained ML models.

**Rationale:** ML models need training data (6+ months of forecast-vs-actual). On day one, we have zero feedback loops. A heuristic approach — weighted scoring of converging signals with manual calibration — is more honest, more debuggable, and more trustworthy. ML can layer in later once we have retrospective accuracy data.

### ADR-5: CRM-agnostic data model from day one

**Decision:** The internal data model uses generic concepts (deals, profiles, consultants, skills) — not Boond-specific field names.

**Rationale:** The PRD specifies building for Movify first but designing for portability. The Boond connector is an adapter that maps Boond's data model to our generic schema. Future connectors (Bullhorn, Salesforce) plug in at the same adapter layer.

---

## 3. Data Model (PostgreSQL)

### Core tables

```sql
-- Skill taxonomy (the shared language across all data)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- e.g., "React", "AI Strategy"
  discipline TEXT NOT NULL,              -- e.g., "Web Development", "AI/ML Engineering"
  aliases TEXT[] DEFAULT '{}',           -- e.g., {"ReactJS", "React.js"}
  esco_uri TEXT,                         -- ESCO mapping (optional)
  lightcast_id TEXT,                     -- Lightcast Open Skills mapping (optional)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Consultants (from Boond)
CREATE TABLE consultants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,               -- Boond ID
  name TEXT NOT NULL,
  current_status TEXT NOT NULL,          -- 'on_mission', 'on_bench', 'rolling_off'
  available_from DATE,                   -- when they become available
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Consultant skills (many-to-many)
CREATE TABLE consultant_skills (
  consultant_id UUID REFERENCES consultants(id),
  skill_id UUID REFERENCES skills(id),
  proficiency TEXT DEFAULT 'mid',        -- 'junior', 'mid', 'senior', 'expert'
  PRIMARY KEY (consultant_id, skill_id)
);

-- Pipeline deals (from Boond)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,               -- Boond ID
  title TEXT NOT NULL,
  client_name TEXT,
  status TEXT NOT NULL,                  -- 'prospect', 'proposal', 'negotiation', 'won', 'lost'
  expected_start DATE,
  expected_duration_weeks INT,
  probability FLOAT DEFAULT 0.5,         -- deal close probability
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Profiles requested per deal (what skills the client wants)
CREATE TABLE deal_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id),
  skill_id UUID REFERENCES skills(id),
  quantity INT DEFAULT 1,
  seniority TEXT DEFAULT 'mid',          -- 'junior', 'mid', 'senior'
  notes TEXT
);

-- Historical projects (completed missions, for pattern learning)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT UNIQUE,               -- Boond ID
  title TEXT NOT NULL,
  client_name TEXT,
  sector TEXT,                           -- 'banking', 'telecom', 'public_sector', etc.
  started_at DATE,
  ended_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Skills used in historical projects
CREATE TABLE project_skills (
  project_id UUID REFERENCES projects(id),
  skill_id UUID REFERENCES skills(id),
  headcount INT DEFAULT 1,
  PRIMARY KEY (project_id, skill_id)
);

-- External signals (unified signal store)
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                  -- 'ted_procurement', 'google_trends', 'ats_greenhouse', 'news', etc.
  signal_type TEXT NOT NULL,             -- 'procurement_notice', 'trend_spike', 'job_posting', 'news_event'
  title TEXT,
  url TEXT,
  raw_data JSONB,                        -- full original payload
  detected_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,                -- when this signal becomes stale
  region TEXT,                           -- 'flanders', 'wallonia', 'brussels', 'belgium', 'eu'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Skills extracted from signals (many-to-many)
CREATE TABLE signal_skills (
  signal_id UUID REFERENCES signals(id),
  skill_id UUID REFERENCES skills(id),
  confidence FLOAT DEFAULT 0.5,          -- NLP extraction confidence
  PRIMARY KEY (signal_id, skill_id)
);

-- Forecasts (the output)
CREATE TABLE forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generated_at TIMESTAMPTZ DEFAULT now(),
  forecast_month DATE NOT NULL,          -- first day of the month being predicted
  skill_id UUID REFERENCES skills(id),
  predicted_demand FLOAT,                -- predicted # of profiles needed
  current_supply INT,                    -- bench + rolling-off in that period
  gap FLOAT,                             -- demand - supply
  confidence FLOAT,                      -- 0.0–1.0
  contributing_signals UUID[],           -- signal IDs that drove this prediction
  notes TEXT,                            -- human-readable explanation
  UNIQUE(generated_at, forecast_month, skill_id)
);

-- Forecast accuracy tracking (retrospective validation)
CREATE TABLE forecast_actuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_id UUID REFERENCES forecasts(id),
  actual_demand INT,                     -- what actually happened
  accuracy_score FLOAT,                  -- computed accuracy
  reviewed_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes

```sql
CREATE INDEX idx_signals_source ON signals(source);
CREATE INDEX idx_signals_detected_at ON signals(detected_at);
CREATE INDEX idx_signals_region ON signals(region);
CREATE INDEX idx_forecasts_month ON forecasts(forecast_month);
CREATE INDEX idx_forecasts_skill ON forecasts(skill_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_consultants_status ON consultants(current_status);
```

### Views (for dashboard queries)

```sql
-- Current bench summary by discipline
CREATE VIEW bench_summary AS
SELECT
  s.discipline,
  s.name AS skill_name,
  COUNT(cs.consultant_id) AS available_count,
  ARRAY_AGG(c.name) AS consultant_names
FROM consultants c
JOIN consultant_skills cs ON c.id = cs.consultant_id
JOIN skills s ON cs.skill_id = s.id
WHERE c.current_status IN ('on_bench', 'rolling_off')
GROUP BY s.discipline, s.name;

-- Pipeline demand summary
CREATE VIEW pipeline_demand AS
SELECT
  s.discipline,
  s.name AS skill_name,
  SUM(dp.quantity) AS total_requested,
  MIN(d.expected_start) AS earliest_need,
  AVG(d.probability) AS avg_probability
FROM deals d
JOIN deal_profiles dp ON d.id = dp.deal_id
JOIN skills s ON dp.skill_id = s.id
WHERE d.status IN ('prospect', 'proposal', 'negotiation')
GROUP BY s.discipline, s.name;

-- Recent signals by skill
CREATE VIEW recent_signals AS
SELECT
  s.name AS skill_name,
  s.discipline,
  sig.source,
  sig.signal_type,
  sig.title,
  sig.detected_at,
  ss.confidence
FROM signals sig
JOIN signal_skills ss ON sig.id = ss.signal_id
JOIN skills s ON ss.skill_id = s.id
WHERE sig.detected_at > now() - INTERVAL '30 days'
ORDER BY sig.detected_at DESC;
```

---

## 4. Data Ingestion Pipeline

### Connector architecture

Each data source has a dedicated Python connector that follows the same pattern:

```
connectors/
├── base.py              # Abstract base connector
├── boond.py             # Boond CRM connector
├── ted_procurement.py   # TED API v3 connector
├── google_trends.py     # Google Trends (pytrends)
├── ats_greenhouse.py    # Greenhouse boards API
├── ats_lever.py         # Lever public API
├── ictjob.py            # ICTJob.be (future partnership)
└── skill_extractor.py   # NLP skill extraction from free text
```

### Base connector pattern

```python
from abc import ABC, abstractmethod
from datetime import datetime
from supabase import create_client

class BaseConnector(ABC):
    """All connectors follow this contract."""

    def __init__(self, supabase_url: str, supabase_key: str):
        self.db = create_client(supabase_url, supabase_key)
        self.source_name = self._source_name()

    @abstractmethod
    def _source_name(self) -> str:
        """e.g., 'ted_procurement', 'google_trends'"""
        pass

    @abstractmethod
    def fetch_raw(self) -> list[dict]:
        """Fetch raw data from the external source."""
        pass

    @abstractmethod
    def transform(self, raw_data: list[dict]) -> list[dict]:
        """Transform raw data into signal records."""
        pass

    def load(self, signals: list[dict]):
        """Write signals to Supabase."""
        for signal in signals:
            # Upsert signal
            result = self.db.table("signals").upsert(signal).execute()
            signal_id = result.data[0]["id"]

            # Extract and link skills
            if "extracted_skills" in signal:
                for skill_match in signal["extracted_skills"]:
                    self.db.table("signal_skills").upsert({
                        "signal_id": signal_id,
                        "skill_id": skill_match["skill_id"],
                        "confidence": skill_match["confidence"]
                    }).execute()

    def run(self):
        """Full ETL cycle."""
        raw = self.fetch_raw()
        signals = self.transform(raw)
        self.load(signals)
        return len(signals)
```

### Boond connector (Layer 1)

```python
class BoondConnector(BaseConnector):
    """
    Ingests pipeline deals, consultant bench data, and historical projects
    from Boond CRM.

    Supports two modes:
    - API mode: live data via Boond REST API (if available)
    - Export mode: periodic CSV/JSON file imports
    """

    def _source_name(self):
        return "boond_crm"

    def fetch_raw(self):
        if self.api_available:
            # Fetch from Boond API
            deals = self._fetch_deals()
            consultants = self._fetch_consultants()
            projects = self._fetch_projects()
            return {"deals": deals, "consultants": consultants, "projects": projects}
        else:
            # Read from export files
            return self._read_exports()

    def transform(self, raw_data):
        # Map Boond fields → generic data model
        # This is the CRM-agnostic adapter layer
        transformed_deals = [self._map_deal(d) for d in raw_data["deals"]]
        transformed_consultants = [self._map_consultant(c) for c in raw_data["consultants"]]
        return {
            "deals": transformed_deals,
            "consultants": transformed_consultants
        }

    def load(self, data):
        # Write to deals, consultants, projects tables (not signals)
        for deal in data["deals"]:
            self.db.table("deals").upsert(deal).execute()
        for consultant in data["consultants"]:
            self.db.table("consultants").upsert(consultant).execute()
```

### TED procurement connector (Layer 2)

```python
class TEDProcurementConnector(BaseConnector):
    """
    Ingests Belgian IT/consulting procurement notices from TED API v3.
    Filters: country=BE, CPV codes 72xxx, 79411000, 72224000, 73220000.
    """

    TED_API_BASE = "https://api.ted.europa.eu/v3"

    # Belgian IT/consulting CPV codes
    CPV_FILTERS = [
        "72000000",   # IT services
        "79411000",   # Management consultancy
        "72224000",   # Project management consultancy
        "72221000",   # Business analysis
        "73220000",   # Development consultancy
    ]

    def _source_name(self):
        return "ted_procurement"

    def fetch_raw(self):
        notices = []
        for cpv in self.CPV_FILTERS:
            params = {
                "country": "BE",
                "cpv": cpv,
                "publishedAfter": self._last_fetch_date(),
                "sort": "publishedDate,desc"
            }
            response = httpx.get(f"{self.TED_API_BASE}/notices", params=params)
            notices.extend(response.json().get("notices", []))
        return notices

    def transform(self, raw_notices):
        signals = []
        for notice in raw_notices:
            signal = {
                "source": self._source_name(),
                "signal_type": "procurement_notice",
                "title": notice.get("title"),
                "url": f"https://ted.europa.eu/notice/{notice['id']}",
                "raw_data": notice,
                "region": self._extract_region(notice),
                "detected_at": notice.get("publishedDate"),
            }
            # Extract skills from notice text using NLP
            signal["extracted_skills"] = self.skill_extractor.extract(
                notice.get("description", "") + " " + notice.get("specifications", "")
            )
            signals.append(signal)
        return signals
```

### Google Trends connector (Layer 2)

```python
class GoogleTrendsConnector(BaseConnector):
    """
    Tracks interest trends for key skills in Belgium using pytrends.
    Detects rising interest as a 3–9 month leading indicator.
    """

    # Skills to track (mapped to skill taxonomy)
    TRACKED_TERMS = {
        "React developer": "react",
        "AI engineer": "ai_engineering",
        "dbt analytics": "dbt",
        "LangChain": "langchain",
        "platform engineering": "platform_engineering",
        "accessibility audit": "accessibility",
        "service design": "service_design",
        # ... extend based on taxonomy
    }

    GEO_REGIONS = {
        "BE": "belgium",
        "BE-VLG": "flanders",
        "BE-WAL": "wallonia",
        "BE-BRU": "brussels",
    }

    def _source_name(self):
        return "google_trends"

    def fetch_raw(self):
        from pytrends.request import TrendReq
        pytrends = TrendReq(hl='en-US', tz=60)
        results = []

        # Process in batches of 5 (pytrends limit)
        terms = list(self.TRACKED_TERMS.keys())
        for i in range(0, len(terms), 5):
            batch = terms[i:i+5]
            for geo_code, region_name in self.GEO_REGIONS.items():
                pytrends.build_payload(batch, timeframe='today 3-m', geo=geo_code)
                interest = pytrends.interest_over_time()
                results.append({
                    "terms": batch,
                    "geo": geo_code,
                    "region": region_name,
                    "data": interest.to_dict() if not interest.empty else {}
                })
        return results

    def transform(self, raw_results):
        signals = []
        for result in raw_results:
            for term in result["terms"]:
                # Detect trend spikes (>20% increase over 4 weeks)
                trend_data = result["data"].get(term, {})
                if self._is_spike(trend_data):
                    signals.append({
                        "source": self._source_name(),
                        "signal_type": "trend_spike",
                        "title": f"Rising interest: {term} in {result['region']}",
                        "raw_data": {"term": term, "trend": trend_data},
                        "region": result["region"],
                        "extracted_skills": [{
                            "skill_id": self._resolve_skill(term),
                            "confidence": 0.7
                        }]
                    })
        return signals
```

### Skill extraction (NLP layer)

```python
class SkillExtractor:
    """
    Extracts skill mentions from multilingual free text (NL/FR/EN).
    Uses a tiered approach:
    1. Exact match against skill aliases (fast, high precision)
    2. Regex patterns for common skill expressions
    3. (V2) spaCy/JobBERT for fuzzy extraction
    """

    def __init__(self, db):
        # Load skill taxonomy into memory
        skills = db.table("skills").select("id, name, aliases").execute()
        self.skill_index = {}
        for skill in skills.data:
            # Index by name and all aliases (lowercased)
            for term in [skill["name"]] + (skill["aliases"] or []):
                self.skill_index[term.lower()] = skill["id"]

    def extract(self, text: str) -> list[dict]:
        """Extract skills from text. Returns list of {skill_id, confidence}."""
        text_lower = text.lower()
        matches = []
        seen = set()

        # Tier 1: exact match
        for term, skill_id in self.skill_index.items():
            if term in text_lower and skill_id not in seen:
                matches.append({"skill_id": skill_id, "confidence": 0.9})
                seen.add(skill_id)

        # Tier 2: regex patterns for multilingual expressions
        # "ervaring met React" (NL), "expérience en React" (FR), "experience with React" (EN)
        # Patterns handled by skill alias matching above for most cases

        return matches
```

### Ingestion schedule

**Hackathon:** Run all connectors manually from local machine (`python run_connector.py <source>`).

**V1 (GitHub Actions or Railway cron):**

| Job | Schedule | Command |
|---|---|---|
| Boond sync | Every 4 hours | `python run_connector.py boond` |
| TED procurement | Daily 6:00 AM CET | `python run_connector.py ted_procurement` |
| Google Trends | Daily 7:00 AM CET | `python run_connector.py google_trends` |
| ATS feeds | Daily 7:30 AM CET | `python run_connector.py ats_all` |
| Forecast engine | Daily 8:00 AM CET (after ingestion) | `python run_forecast.py` |
| Weekly digest | Monday 8:30 AM CET | `python generate_digest.py` |

---

## 5. Forecasting Engine

### Approach: weighted signal aggregation (V1)

The V1 forecasting engine does **not** use ML. It uses a transparent, debuggable scoring system:

```python
class ForecastEngine:
    """
    Produces a 12-month rolling forecast per skill.
    Combines internal signals (CRM) with external signals using weighted scoring.
    """

    # Signal weights (tunable by user in V1, learned in V2)
    DEFAULT_WEIGHTS = {
        "crm_pipeline":       0.35,   # Highest weight — proprietary, specific
        "procurement_notice":  0.25,   # Strong leading indicator, 3-6 months
        "historical_pattern":  0.15,   # Seasonal and cyclical patterns
        "trend_spike":         0.10,   # Google Trends, tech adoption
        "job_posting":         0.10,   # Current market pulse
        "news_event":          0.05,   # Qualitative signal
    }

    def generate_forecast(self, skill_id: str, months_ahead: int = 12):
        """Generate demand forecast for a specific skill."""

        monthly_scores = []
        for month_offset in range(1, months_ahead + 1):
            target_month = self._month_from_now(month_offset)

            # Score each signal type
            crm_score = self._score_crm_pipeline(skill_id, target_month)
            procurement_score = self._score_procurement(skill_id, target_month)
            historical_score = self._score_historical_pattern(skill_id, target_month)
            trend_score = self._score_trends(skill_id)
            posting_score = self._score_job_postings(skill_id)

            # Weighted aggregation
            raw_demand = (
                crm_score       * self.weights["crm_pipeline"] +
                procurement_score * self.weights["procurement_notice"] +
                historical_score * self.weights["historical_pattern"] +
                trend_score      * self.weights["trend_spike"] +
                posting_score    * self.weights["job_posting"]
            )

            # Confidence = how many signal types contribute (convergence)
            active_signals = sum(1 for s in [
                crm_score, procurement_score, historical_score,
                trend_score, posting_score
            ] if s > 0)
            confidence = min(active_signals / 4.0, 1.0)

            # Current supply
            supply = self._get_supply(skill_id, target_month)

            monthly_scores.append({
                "forecast_month": target_month,
                "skill_id": skill_id,
                "predicted_demand": raw_demand,
                "current_supply": supply,
                "gap": raw_demand - supply,
                "confidence": confidence,
                "contributing_signals": self._get_contributing_signal_ids(
                    skill_id, target_month
                ),
                "notes": self._generate_explanation(
                    skill_id, target_month,
                    crm_score, procurement_score, historical_score,
                    trend_score, posting_score
                )
            })

        return monthly_scores

    def _score_crm_pipeline(self, skill_id, target_month):
        """
        Score based on pipeline deals requesting this skill,
        weighted by deal probability and proximity to target month.
        """
        deals = self.db.table("deal_profiles") \
            .select("deals(expected_start, probability), quantity") \
            .eq("skill_id", skill_id) \
            .execute()

        score = 0
        for deal in deals.data:
            months_until_start = self._months_between(
                datetime.now(), deal["deals"]["expected_start"]
            )
            # Higher score if deal starts near target month
            proximity = max(0, 1 - abs(months_until_start - target_month) / 12)
            score += deal["quantity"] * deal["deals"]["probability"] * proximity

        return score

    def _score_procurement(self, skill_id, target_month):
        """
        Score based on recent procurement notices mentioning this skill.
        Procurement notices are leading indicators (3-6 months ahead).
        """
        recent_signals = self.db.table("signal_skills") \
            .select("signals(detected_at, raw_data), confidence") \
            .eq("skill_id", skill_id) \
            .eq("signals.source", "ted_procurement") \
            .gte("signals.detected_at", self._months_ago(6)) \
            .execute()

        # More recent notices score higher
        score = sum(
            s["confidence"] * self._recency_weight(s["signals"]["detected_at"])
            for s in recent_signals.data
        )
        return score

    def _score_historical_pattern(self, skill_id, target_month):
        """
        Score based on historical seasonality.
        E.g., if Q1 historically has high demand for this skill.
        """
        month_of_year = target_month.month
        historical = self.db.table("project_skills") \
            .select("projects(started_at)") \
            .eq("skill_id", skill_id) \
            .execute()

        # Count projects by month to find seasonal patterns
        month_counts = {}
        for p in historical.data:
            month = p["projects"]["started_at"].month
            month_counts[month] = month_counts.get(month, 0) + 1

        total = sum(month_counts.values()) or 1
        return month_counts.get(month_of_year, 0) / total

    def _generate_explanation(self, skill_id, target_month, *scores):
        """Generate human-readable explanation for the forecast."""
        skill = self.db.table("skills").select("name").eq("id", skill_id).single().execute()
        parts = []
        if scores[0] > 0:
            parts.append(f"Pipeline deals requesting {skill.data['name']}")
        if scores[1] > 0:
            parts.append(f"Recent procurement notices mention {skill.data['name']}")
        if scores[2] > 0:
            parts.append(f"Historical pattern: demand typically rises in this period")
        if scores[3] > 0:
            parts.append(f"Google Trends shows rising interest in Belgium")
        if scores[4] > 0:
            parts.append(f"Active job postings from Belgian employers")
        return ". ".join(parts) + "." if parts else "No strong signals detected."
```

---

## 6. Frontend Architecture (Next.js)

### Project structure

```
forecaster-app/
├── app/
│   ├── layout.tsx                # Root layout with sidebar nav
│   ├── page.tsx                  # Dashboard home (forecast overview)
│   ├── forecast/
│   │   ├── page.tsx              # 12-month heatmap view
│   │   └── [skillId]/page.tsx    # Skill drill-down
│   ├── bench/
│   │   └── page.tsx              # Current bench + pipeline view
│   ├── signals/
│   │   └── page.tsx              # Signal explorer (procurement, trends, etc.)
│   └── settings/
│       └── page.tsx              # Signal weights, data source config
├── components/
│   ├── ForecastHeatmap.tsx       # Main heatmap visualization
│   ├── BenchGapChart.tsx         # Supply vs. demand bar chart
│   ├── SignalFeed.tsx            # Live signal stream
│   ├── SkillDrilldown.tsx        # Detailed skill forecast with signal breakdown
│   ├── WeeklyDigest.tsx          # Digest preview/renderer
│   └── ui/                       # Shared UI components (shadcn/ui)
├── lib/
│   ├── supabase.ts               # Supabase client (browser + server)
│   ├── types.ts                  # TypeScript types matching DB schema
│   └── hooks/
│       ├── useForecast.ts        # React Query hook for forecast data
│       ├── useBench.ts           # Hook for bench data
│       └── useSignals.ts         # Hook for signal feed
├── public/
└── package.json
```

### Key pages

**Dashboard home (`/`)** — The Monday morning view:
- 12-month forecast heatmap (top, full width)
- Top 3 gap alerts (skills with largest predicted shortfall)
- Recent high-confidence signals
- Quick stats: bench size, pipeline value, forecast accuracy trend

**Forecast heatmap (`/forecast`)** — The core visualization:
- X-axis: months 1–12
- Y-axis: skills grouped by discipline
- Cell color: demand intensity (green → yellow → red)
- Cell overlay: bench coverage (hatched = covered, solid = gap)
- Click cell → drill down to `/forecast/[skillId]`

**Skill drill-down (`/forecast/[skillId]`)** — Signal explainability:
- Demand curve (12 months) with confidence band
- Current supply overlay
- Contributing signals list (each clickable to source)
- Historical pattern chart (same skill, past 12 months)
- Recommended action

**Bench view (`/bench`)** — Story H1 from the PRD:
- Consultants by status (on_mission, on_bench, rolling_off)
- Grouped by discipline/skill
- Pipeline deals with expected start dates and requested profiles
- Contract end dates timeline

**Signal explorer (`/signals`)** — Raw signal browser:
- Filterable by source, skill, region, date
- Procurement notices with extracted skills highlighted
- Trend charts from Google Trends
- Job posting counts from ATS feeds

### Tech choices

| Concern | Choice | Rationale |
|---|---|---|
| **Data fetching** | `@tanstack/react-query` + Supabase JS client | Caching, refetch, optimistic updates. Supabase Realtime for live signal feed. |
| **Charts** | `recharts` | Lightweight, React-native, good enough for heatmaps and line charts. Swap to D3 if needed later. |
| **UI components** | `shadcn/ui` + Tailwind | Clean defaults, themeable, fast to build with. Consistent with modern dashboards. |
| **State management** | React Query cache + React context | No Redux needed. React Query handles server state; context for UI-only state (filters, settings). |
| **Auth** | Supabase Auth | Simple, team-level access. Email invite for Movify team members. |

---

## 7. Deployment Architecture

Fully cloud-hosted, zero infrastructure to manage:

```
┌──────────────────────────────────────────────────────────────┐
│                      CLOUD SERVICES                          │
│                                                              │
│  ┌────────────────────┐        ┌─────────────────────────┐  │
│  │   Vercel            │        │   Supabase (cloud)      │  │
│  │                     │        │                         │  │
│  │   Next.js app       │◄──────►│   PostgreSQL            │  │
│  │   (auto-deploy      │  REST  │   Auth                  │  │
│  │    from GitHub)     │  +RT   │   Realtime              │  │
│  │                     │        │   Edge Functions         │  │
│  └────────────────────┘        └─────────────────────────┘  │
│                                          ▲                   │
│                                          │ supabase-py       │
│  ┌───────────────────────────────────────┴───────────────┐  │
│  │   Python Workers                                       │  │
│  │   (GitHub Actions scheduled / Railway / Fly.io)        │  │
│  │                                                        │  │
│  │   - Boond connector        (schedule: 4h)              │  │
│  │   - TED connector          (schedule: daily)           │  │
│  │   - Google Trends conn.    (schedule: daily)           │  │
│  │   - ATS connectors         (schedule: daily)           │  │
│  │   - Forecast engine        (schedule: daily)           │  │
│  │   - Digest generator       (schedule: weekly)          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Hosting choices

| Component | Service | Cost | Rationale |
|---|---|---|---|
| **Frontend** | Vercel (free tier) | $0 | Auto-deploys from GitHub. Perfect for Next.js. Free tier covers hackathon + early V1. |
| **Database + Auth** | Supabase Cloud (free tier → Pro) | $0–$25/mo | Managed PostgreSQL, Auth, Realtime, Edge Functions. Free tier: 500MB DB, 50K auth users. Pro at $25/mo when needed. |
| **Python workers** | GitHub Actions (hackathon) → Railway/Fly.io (V1) | $0–$5/mo | Hackathon: run workers manually or via GitHub Actions cron. V1: deploy to Railway ($5/mo) or Fly.io for scheduled jobs. |

### Hackathon shortcut

For the hackathon, skip scheduled workers entirely. Run Python connectors **manually from local machine** → write to Supabase cloud → Next.js on Vercel reads from Supabase. Automation comes in V1.

```bash
# Hackathon: run connectors locally, targeting cloud Supabase
export SUPABASE_URL=https://xxxxx.supabase.co
export SUPABASE_SERVICE_KEY=eyJ...

python run_connector.py boond
python run_connector.py ted_procurement
python run_connector.py google_trends
python run_forecast.py
```

---

## 8. Hackathon Build Sequence

What to build in what order, optimised for a 1-day sprint:

### Block 1: Foundation (1.5h)

1. **Create Supabase project** — New project on supabase.com, run the SQL schema from Section 3
2. **Seed the skill taxonomy** — Insert Movify's 12 disciplines + top 50 skills with aliases
3. **Resolve Boond data access** — API test or load an export file
4. **Write the Boond connector** — Map Boond data → generic schema, load into Supabase

**Exit criteria:** `consultants`, `deals`, and `deal_profiles` tables populated with real Movify data.

### Block 2: External signals (1.5h)

4. **Wire up TED API v3** — Fetch Belgian procurement notices, extract skills, load into `signals` table
5. **Wire up Google Trends** — Track top 10–15 skills in Belgium, detect spikes, load into `signals` table
6. **Verify signal_skills mapping** — Confirm skills from external sources map to the same taxonomy as Boond

**Exit criteria:** `signals` and `signal_skills` tables populated with real procurement and trend data.

### Block 3: Forecast + Dashboard (1.5h)

7. **Run the forecast engine** — Generate 12-month forecasts, write to `forecasts` table
8. **Scaffold Next.js app** — Create the basic layout with sidebar navigation
9. **Build the forecast heatmap** — Recharts heatmap reading from `forecasts` table via Supabase
10. **Build the bench overlay** — Show current supply vs. predicted demand per skill

**Exit criteria:** A visible dashboard showing a 12-month forecast with bench gaps.

### Block 4: Polish + demo (1.5h)

11. **Add the signal explorer** — Show recent procurement notices and trend spikes
12. **Add gap alerts** — Highlight top 3 skills where demand > supply
13. **Polish the UI** — Ensure the demo flow is clean for the Sebastiaan sniff test
14. **Prepare demo script** — Walk through: bench view → forecast → drill into a skill → show contributing signals

**Exit criteria:** Demo-ready prototype. Sebastiaan can see real data, understand the forecast, and say "I can see how this becomes useful."

---

## 9. V1 Evolution Path (post-hackathon)

| Area | Hackathon | V1 (month 1–2) | V2 (month 3–6) |
|---|---|---|---|
| **Boond integration** | Export or basic API | Full API sync, 4h cadence | Real-time webhooks |
| **Procurement signals** | TED API, keyword extraction | + BOSA e-Procurement scraping, NLP on bestek docs | Full tender document parsing with LLM |
| **Market signals** | Google Trends | + ATS endpoints (100+ companies), VDAB/Le Forem APIs | + News/RSS ingestion, regulatory tracker |
| **Forecasting** | Weighted heuristics | + Seasonal patterns from historical data | + ML model trained on 6+ months of actuals |
| **Dashboard** | Heatmap + bench view | + Signal explorer, skill drill-down, weekly digest | + Configurable weights, "what-if" scenarios |
| **Auth & access** | Single user (Sebastiaan) | Supabase Auth, team invites | Multi-tenancy for other consultancies |
| **Hosting** | Vercel free + Supabase free + local workers | Vercel Pro + Supabase Pro + Railway cron | Dedicated infra if multi-tenant |
| **Data quality** | Manual skill taxonomy | + Lightcast Open Skills API integration | + JobBERT/spaCy NLP extraction pipeline |

---

## 10. Security & Data Considerations

- **Boond data is confidential** — pipeline deals, client names, consultant names. Supabase RLS ensures only authenticated team members can access. Supabase Cloud is SOC 2 Type II compliant and data resides in EU regions.
- **Procurement data is public** — TED and e-Procurement notices are explicitly open for commercial reuse.
- **Google Trends data is aggregated** — no PII involved.
- **No LinkedIn scraping** — by design. The architecture avoids any ToS-violating data access.
- **API keys** stored in environment variables (Vercel env vars for frontend, GitHub Secrets or Railway env vars for workers), never committed to git. Supabase service key used only by workers, anon key used by frontend.
- **GDPR note:** Consultant names stored in Supabase are covered under Movify's existing employment data processing. No external personal data is ingested.

---

*Architecture designed for a 1-day hackathon build with a clear evolution path to production V1. Greenfield Supabase Cloud + Vercel — zero infrastructure to manage, fully cloud-hosted.*
