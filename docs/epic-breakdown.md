# Epic Breakdown — Skills Demand Forecaster (Hackathon)

*Movify — April 2026*
*Constraint: 1-day hackathon (~6 hours of building time)*

---

## Epic

**Build a working Skills Demand Forecaster prototype** that ingests real Boond CRM data and at least two external signal sources, produces a visible 12-week skill demand forecast with bench gap indicators, and passes the "Sebastiaan sniff test."

### Epic hypothesis

We believe that combining Boond CRM pipeline data with external market signals (procurement feeds, technology trends) in a single forecast view will enable Movify to predict skill demand 3–6 months ahead, because staffing decisions today rely on lagging indicators and gut feeling while predictive signals exist in the open but aren't wired together. We'll validate this if Sebastiaan says "I can see how this becomes useful" after the demo.

---

## Pre-Split Validation (INVEST)

| Criterion | Pass? | Notes |
|---|---|---|
| **Independent** | ✅ | Standalone project, no external blockers beyond Boond data access |
| **Negotiable** | ✅ | Hackathon = high flexibility on implementation details |
| **Valuable** | ✅ | Directly addresses €22K/month bench cost problem |
| **Estimable** | ✅ | Architecture doc provides clear scope; team can estimate |
| **Testable** | ✅ | Clear success criteria: real data visible, forecast generated, demo-ready |

→ Passes all checks. Proceed to splitting.

---

## Splitting Strategy

**Primary pattern applied: Pattern 7 (Simple/Complex)** — Start with the simplest end-to-end slice that proves the concept, then layer in complexity.

**Secondary pattern: Pattern 1 (Workflow Steps)** — Each story is a thin end-to-end slice through the full stack (data → Supabase → dashboard), not a horizontal layer.

**Why not step-by-step?** "Set up database" → "Write connectors" → "Build frontend" would produce stories that don't deliver value individually. Instead, each story delivers a visible, demo-able increment.

---

## Story Breakdown

### Story 1: Skeleton — One skill, one consultant, one forecast visible (1h)

**The thinnest possible end-to-end slice through the entire stack.**

**As a** talent lead,
**I want to** see a single skill's forecasted demand alongside my bench availability in a web dashboard,
**so that** I can verify the full data pipeline works end-to-end.

**Acceptance criteria:**

- [ ] Supabase project created with core schema tables: `skills`, `consultants`, `consultant_skills`, `forecasts`
- [ ] One skill manually seeded (e.g., "AI Engineering")
- [ ] One consultant manually seeded with that skill, status "on_bench"
- [ ] One forecast row manually inserted (week +4, predicted_demand=3, current_supply=1, gap=2)
- [ ] Next.js app deployed on Vercel, connected to Supabase
- [ ] Dashboard page shows: skill name, forecast demand, current supply, gap — even if it's just a table or card
- [ ] Live: data changes in Supabase → visible in dashboard

**Why first:** Proves the full stack works. Every subsequent story adds real data and better UI on top of this skeleton. If this doesn't work, nothing else matters.

**Estimated effort:** 1 hour

---

### Story 2: Real bench — Boond data populates the dashboard (1.5h)

**Replace manual seed data with real Movify data from Boond.**

**As a** talent lead,
**I want to** see my real consultants, their skills, and their availability status pulled from Boond,
**so that** I know the bench view reflects reality, not test data.

**Acceptance criteria:**

- [ ] Boond data access resolved (API call or CSV/JSON export loaded)
- [ ] Python Boond connector written: maps Boond fields → generic schema (`consultants`, `consultant_skills`, `deals`, `deal_profiles`)
- [ ] Full skill taxonomy seeded: Movify's 12 disciplines + top skills with aliases
- [ ] Connector run once → Supabase populated with real consultant and pipeline data
- [ ] Dashboard updated: bench view shows real consultants grouped by skill/discipline
- [ ] Pipeline view shows real deals with expected start dates and requested profiles

**Why second:** The internal signal layer (Layer 1) is the proprietary moat. Getting real data in early means every subsequent feature works with real numbers, making the demo compelling.

**Estimated effort:** 1.5 hours

---

### Story 3: Procurement signals — TED notices visible alongside bench data (1h)

**First external signal source. Proves the multi-source architecture.**

**As a** talent lead,
**I want to** see recent Belgian IT/consulting procurement notices with extracted skill tags,
**so that** I have a 3–6 month leading indicator of public-sector consulting demand.

**Acceptance criteria:**

- [ ] TED API v3 connector written: queries Belgian notices with CPV codes (72xxx, 79411000, 72224000, 73220000)
- [ ] Results stored in `signals` table with source="ted_procurement"
- [ ] Basic skill extraction: keyword matching against skill taxonomy aliases on notice text
- [ ] Extracted skills linked in `signal_skills` table with confidence scores
- [ ] Dashboard: new "Signals" section showing recent procurement notices with title, contracting authority, detected skills, and link to TED
- [ ] At least 5+ real procurement notices visible

**Why third:** Procurement is the highest-value external signal (unique differentiator, no competitor uses it). Seeing real Belgian procurement notices alongside real bench data is the "aha moment" for the demo.

**Estimated effort:** 1 hour

---

### Story 4: Trend signals — Google Trends adds a second external source (45min)

**Second external signal. Triangulates the forecast beyond procurement alone.**

**As a** talent lead,
**I want to** see Belgian Google Trends data for key skills showing rising or falling interest,
**so that** I have an early indicator of which technologies are gaining traction before hiring demand follows.

**Acceptance criteria:**

- [ ] Google Trends connector written using `pytrends` with `geo='BE'`
- [ ] Tracks at least 10 skills from the taxonomy (e.g., React, AI engineering, dbt, LangChain, platform engineering, accessibility, service design)
- [ ] Trend spikes detected (>20% increase over 4 weeks) stored as signals
- [ ] Dashboard: trend indicators visible per skill (↑ rising, → stable, ↓ declining)
- [ ] Signal feed shows trend spike alerts alongside procurement notices

**Why fourth:** Adds the technology adoption signal layer. Quick to implement with pytrends. Combined with procurement data, gives two independent external signals for the forecast.

**Estimated effort:** 45 minutes

---

### Story 5: The forecast — 12-week heatmap with bench gap overlay (1.5h)

**The core deliverable. Turns raw data into a prediction.**

**As a** talent lead,
**I want to** see a 12-week rolling forecast heatmap showing predicted skill demand vs. my current bench coverage,
**so that** I can spot staffing gaps 6–8 weeks before they become urgent.

**Acceptance criteria:**

- [ ] Forecast engine written: weighted aggregation of CRM pipeline (0.35), procurement signals (0.25), seasonal heuristic (0.15), trend signals (0.10), posting signals (0.10)
- [ ] Engine run once → `forecasts` table populated for all skills with data
- [ ] Confidence scores calculated based on number of converging signal sources
- [ ] Dashboard: heatmap visualization (recharts) — X-axis = weeks 1–12, Y-axis = skills by discipline
- [ ] Cell color = demand intensity (green → yellow → red)
- [ ] Bench overlay: shows current supply vs. predicted demand per skill
- [ ] Gap alerts: top 3 skills where predicted demand > available supply, highlighted prominently
- [ ] Each forecast cell shows a tooltip with: predicted demand, current supply, gap, confidence, contributing signal summary

**Why fifth:** This is the money shot. Everything before it was building the foundation; this is where the forecaster actually forecasts. The heatmap with real data and real gaps is what makes Sebastiaan say "I can see how this becomes useful."

**Estimated effort:** 1.5 hours

---

### Story 6: Polish and demo prep (30min)

**Make it demo-ready. Not a feature story — a quality story.**

**As a** hackathon presenter,
**I want to** walk through a clean demo flow that tells the forecaster story,
**so that** the Sebastiaan sniff test is compelling and the concept lands.

**Acceptance criteria:**

- [ ] Dashboard has a clean layout with sidebar navigation: Forecast / Bench / Signals
- [ ] Landing page shows the forecast heatmap + top 3 gap alerts
- [ ] Demo script prepared: bench view → "here's what we have" → forecast view → "here's what we'll need" → signal explorer → "here's why" → drill into a gap → "here's what to do"
- [ ] Any broken UI elements or empty states handled gracefully
- [ ] README in repo explaining what the prototype does and how to run it

**Why last:** Polish after function. The demo narrative is what makes the prototype land, but only if the underlying data and forecast are real and working.

**Estimated effort:** 30 minutes

---

## Hackathon Timeline

| Time | Story | Deliverable |
|---|---|---|
| **0:00–1:00** | Story 1: Skeleton | Full stack working: Supabase → Next.js → one data point visible |
| **1:00–2:30** | Story 2: Real bench | Real Movify data from Boond in the dashboard |
| **2:30–3:30** | Story 3: Procurement | TED procurement notices with skill extraction visible |
| **3:30–4:15** | Story 4: Trends | Google Trends signals for Belgian skills |
| **4:15–5:45** | Story 5: Forecast | 12-week heatmap with bench gaps — the core deliverable |
| **5:45–6:15** | Story 6: Polish | Demo-ready, clean flow, narrative prepared |

**Buffer:** Stories 4 and 6 are the most cuttable if time runs short. The minimum viable demo is Stories 1–3 + 5 (skeleton + real data + procurement + forecast).

---

## Split Evaluation

### Does this split reveal low-value work we can deprioritize?

Yes. The split makes clear that:

- **Story 4 (Google Trends) is nice-to-have, not essential.** The forecast works with CRM + procurement alone. If time is tight, cut it.
- **Story 6 (Polish) can be minimal.** A rough UI with real data is more compelling than a polished UI with fake data.
- **Fancy NLP is not needed for the hackathon.** Simple keyword matching against skill aliases is sufficient to prove the concept. JobBERT/spaCy extraction is a V1 investment.

### Does this split produce roughly equal-sized stories?

Roughly yes. Four stories at 1–1.5h, one at 45min, one at 30min. The heaviest stories (2 and 5) carry the most value — that's appropriate.

---

## INVEST Validation (Per Story)

| Story | I | N | V | E | S | T |
|---|---|---|---|---|---|---|
| 1. Skeleton | ✅ | ✅ | ✅ (proves full stack) | ✅ | ✅ (1h) | ✅ |
| 2. Real bench | ✅ | ✅ | ✅ (real data visible) | ✅ | ✅ (1.5h) | ✅ |
| 3. Procurement | ✅ | ✅ | ✅ (unique signal) | ✅ | ✅ (1h) | ✅ |
| 4. Trends | ✅ | ✅ | ✅ (second signal) | ✅ | ✅ (45min) | ✅ |
| 5. Forecast | ⚠️ Depends on 1–3 | ✅ | ✅ (core deliverable) | ✅ | ✅ (1.5h) | ✅ |
| 6. Polish | ⚠️ Depends on 1–5 | ✅ | ✅ (demo-ready) | ✅ | ✅ (30min) | ✅ |

Stories 5 and 6 have natural dependencies (they need data to exist), but that's inherent to the hackathon sequence — not a design flaw.

---

## Dependencies & Blockers

| Blocker | Impact | Mitigation |
|---|---|---|
| **Boond data access** | Blocks Story 2 | Resolve before hackathon day. If no API: prepare a CSV/JSON export in advance. |
| **TED API availability** | Blocks Story 3 | TED API v3 is free and anonymous. Test the query before hackathon day. |
| **Supabase project setup** | Blocks everything | Create the Supabase project and run schema migration the night before. |
| **Vercel deployment** | Blocks visible demo | Deploy the Next.js skeleton to Vercel early in Story 1. Auto-deploys from git after that. |

### Pre-hackathon checklist

- [ ] Supabase project created, schema SQL ready to run
- [ ] Boond data access confirmed (API key or export file prepared)
- [ ] TED API v3 tested with a sample Belgian query
- [ ] `pytrends` installed and tested with `geo='BE'`
- [ ] Next.js project scaffolded with Supabase client configured
- [ ] Vercel project linked to GitHub repo
- [ ] Skill taxonomy CSV prepared (12 disciplines, top 50 skills, aliases)

---

## What comes after the hackathon

If the prototype passes the sniff test, the V1 roadmap picks up where the hackathon left off:

| V1 story | Pattern | Builds on |
|---|---|---|
| Add ATS job posting signals (Greenhouse, Lever) | Data variations (Pattern 4) | Story 3 pattern |
| Add weekly digest email | Workflow steps (Pattern 1) | Story 5 |
| Add skill drill-down with signal explainability | Simple/Complex (Pattern 7) | Story 5 |
| Add historical pattern detection from Boond projects | Major effort (Pattern 6) | Story 2 |
| Add configurable signal weights | Data entry methods (Pattern 5) | Story 5 |
| Add BOSA e-Procurement (below-threshold tenders) | Data variations (Pattern 4) | Story 3 |
| Add forecast accuracy tracking (retrospective) | Defer performance (Pattern 8) | Story 5 |
| Add Supabase Auth for team access | Simple/Complex (Pattern 7) | Story 1 |

Each V1 story follows the same principle: thin vertical slice, end-to-end value, demo-able increment.

---

*Breakdown uses Richard Lawrence's Humanizing Work splitting methodology. Primary patterns: Simple/Complex (Pattern 7) for the overall split, Workflow Steps (Pattern 1) for the hackathon sequence. Each story is a vertical slice delivering observable value.*
