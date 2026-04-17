# Skills Demand Forecaster — Strategic Layer
*Movify / TheForge — April 2026*

---

## The Opportunity

The consultancy industry is running on spreadsheets and gut instinct for one of its most critical decisions: **what talent will clients need, and when?**

Hotels and airlines have solved this for decades. Yield management and demand forecasting are table stakes in hospitality and aviation — they don't just manage inventory, they predict demand curves and staff/price accordingly. No IT consultancy does this systematically.

The **Skills Demand Forecaster** combines CRM pipeline signals, external job market data, and historical project patterns to predict which specific skills clients will request in 3–6 months — before they ask. This is one layer upstream from what existing PSA tools do.

---

## Market Landscape

### What exists today

The main PSA players — **Kantata, Planview, Float, Scoro** — offer resource forecasting: *"do I have enough people for confirmed projects?"* They are not doing demand signal intelligence.

**Critical limitations of existing tools:**
- Kantata (the closest match) requires ~50 seat minimum, costing $35K–$66K/year before implementation — enterprise pricing for enterprise scale
- All existing tools are **reactive**: they analyse past data or confirmed pipeline, not forward-looking market signals
- None combine internal CRM data with external job market signals to predict *what types of talent* clients will come asking for

### The white space

What Movify needs — and what doesn't exist for mid-market consultancies — is:

> *"In Q3, based on your pipeline, client industry trends, and historical patterns, you will likely need 3 additional React developers and 2 AI engineers. Your current bench covers 1 of those. Start recruiting now."*

This is **demand signal intelligence**, not resource scheduling. The gap is real and unserved.

---

## The Core Concept

### Analogy
The hotel/airline parallel is exact. A hotel doesn't just manage room inventory — it predicts occupancy curves weeks out using booking signals, seasonality, and event calendars. The output isn't "you have X rooms free" — it's "you will need X rooms in 6 weeks, here's why, here's what to do now."

For Movify, the equivalent is predicting **skill inventory needs** before demand materialises.

### What makes this feasible now
- **The data already exists** inside Boond (CRM), LinkedIn job trends, and historical mission records — it just hasn't been wired together
- **GenAI** makes pattern extraction from unstructured project data tractable
- **The output is immediately actionable**: start recruiting or upskilling now vs. in a panic in 6 weeks

---

## Architecture: Three Signal Layers

### Layer 1 — Internal Signals (Boond/CRM)
- Pipeline deals in progress
- Expected project start dates
- Profile types requested per deal (UX, developer, PM, AI engineer, etc.)
- Historical project compositions: which skills were needed, when, for how long
- Contract end dates: when consultants roll off current missions
- Current bench: who is available when, and at what skill level

### Layer 2 — External Market Signals
- Belgian LinkedIn job postings by skill and sector (leading indicator of client intent)
- Client industry news and investment signals (e.g. KBC pushing AI → anticipate AI engineer demand)
- Seasonal patterns (Q3 summer slump, Q1 budget kicks, year-end freeze)
- Belgian tech talent market conditions (supply constraints by profile)

### Layer 3 — Forecasting Engine
Combines Layers 1 and 2 to produce:
- A rolling **12-week heatmap** of anticipated skill demand vs. current bench coverage
- **Gap alerts**: skills where demand is likely to outpace supply
- **Confidence scores** per prediction based on signal strength
- Actionable triggers: recruit now / upskill now / flag for cross-firm sharing

---

## Data Requirements & Constraints

### Boond (CRM) — Primary Data Source
- **Status:** Data exists, needs cleaning before modelling
- **Key question to resolve:** Does Boond have an API, or will data be exported manually?
- This determines whether the forecaster runs on live data or periodic snapshots

### Historical Project Data
- Needs structured cleanup: project X required skills Y and Z from month A to B
- This becomes the training signal for the forecasting engine
- Richer history = better predictions; even 12–18 months of clean data is a solid start

### External Signals
- LinkedIn job posting trends: scrapeable or via API
- No Belgian-specific IT demand forecasting tool exists today — this is part of the gap

---

## Build Philosophy

### Internal first, exportable by design
- **Phase 1:** Build for Movify internal use — Sebastiaan has direct data access and can validate signal quality in real conditions
- **Phase 2:** Abstract the data layer so other consultancies can plug in their own CRM exports
- **Architecture principle:** Keep the forecasting logic CRM-agnostic from day one; Boond is the first connector, not the only one

### Infrastructure
- Lives on TheForge (self-hosted Supabase on OVH VPS)
- Sits alongside CVForge and the intake preparation tool as part of the broader TheForge suite
- Long-term: potential to offer as a client-facing toolkit for other Belgian consultancies

---

## Why This Could Be a Gamechanger

1. **No equivalent exists** for mid-market IT consultancies in Belgium or continental Europe
2. **The ROI argument is immediate**: €22,000/month lost per idle consultant — predicting demand 6–8 weeks earlier pays for the tool in a single avoided bench day
3. **Network effects**: the more consultancies use it, the richer the market signal layer becomes (cross-firm demand aggregation without exposing individual data)
4. **Timing**: Belgian tech talent shortfall projected at 21,000 workers by 2026 — firms that forecast and recruit proactively will systematically outperform those that react

---

## Immediate Next Steps

1. **Resolve the Boond API question** — live data vs. manual export shapes the entire technical approach
2. **Audit historical project data** — assess what's clean enough to use as training signal today
3. **Define the MVP output** — likely a simple dashboard showing a 12-week skill demand forecast with bench gap indicators
4. **Map the data model** — skills taxonomy, profile types, demand signals, confidence scoring

---

*Built in collaboration between Sebastiaan (Movify) and Claude — April 2026*
