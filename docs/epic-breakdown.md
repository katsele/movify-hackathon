# Epic Breakdown — Skills Demand Forecaster (Hackathon)

*Movify — April 2026*
*Constraint: 1-day hackathon (~6 hours of building time)*

---

## Epic

**Build a working Skills Demand Forecaster prototype** that ingests real Boond CRM data, listens to Belgian news and corporate announcements, and cross-references public procurement signals to produce a visible 12-week skill demand forecast with bench gap indicators, passing the "Sebastiaan sniff test."

### Epic hypothesis

We believe that combining Boond CRM pipeline data with **news and corporate announcement intelligence** (press releases, CTO hires, AI investment announcements, M&A, strategic shifts) and public procurement feeds will enable Movify to predict skill demand 3–6 months ahead, because staffing decisions today rely on lagging indicators and gut feeling while predictive signals already exist in the open but aren't wired together. We'll validate this if Sebastiaan says "I can see how this becomes useful" after the demo — particularly when a corporate announcement like "KBC pushes AI strategy" surfaces as an AI-engineer demand prediction on the heatmap six weeks out.

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

**Tertiary pattern: Pattern 4 (Data Variations)** — Each external signal source (news, procurement, trends, postings) is a distinct data variation. We sequence the variations by *narrative + convergence value*, not by extraction ease: news signals go first because they anchor the "intelligence forecaster" framing, and procurement triangulates them rather than carrying the story alone.

**Why not step-by-step?** "Set up database" → "Write connectors" → "Build frontend" would produce stories that don't deliver value individually. Instead, each story delivers a visible, demo-able increment.

**Why news before procurement?** Procurement is a higher-confidence signal; news is a higher-drama signal. A news-led demo ("KBC announces €200M AI investment → here's the AI engineer gap opening in week 6") lands faster than procurement alone. Procurement then corroborates the news hit — convergence across two independent sources is what the forecast engine is designed to weight heavily (per `docs/research/per-source-heuristics.md §8`).

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
- [ ] Full skill taxonomy seeded: Movify's 12 disciplines + top skills with aliases (per `docs/research/taxonomy-reconciliation.md`)
- [ ] Connector run once → Supabase populated with real consultant and pipeline data
- [ ] Dashboard updated: bench view shows real consultants grouped by skill/discipline
- [ ] Pipeline view shows real deals with expected start dates and requested profiles

**Why second:** The internal signal layer (Layer 1) is the proprietary moat. Getting real data in early means every subsequent feature works with real numbers, making the demo compelling.

**Estimated effort:** 1.5 hours

---

### Story 3: News intelligence — corporate announcements into the forecaster (1h)

**The intelligence signal layer. Establishes the "intelligence forecaster" framing and lays the foundation for cross-source convergence.**

**As a** talent lead,
**I want to** see recent Belgian corporate news and announcements about my target clients, with inferred skill-demand tags,
**so that** I know which enterprises are signalling new investments, hires, or strategic shifts that will drive consulting demand in the next 3–6 months — before a procurement notice is ever filed.

**Acceptance criteria:**

- [ ] RSS connector written (`workers/connectors/news_intelligence.py`): pulls titles + abstracts from at least 2 Belgian business news feeds (De Tijd, Data News; L'Echo stretch)
- [ ] Target client seed list authored: 15–25 enterprise Belgian clients (KBC, Proximus, UCB, Solvay, bpost, AG Insurance, Belfius, Delhaize, Colruyt, ING Belgium, Argenta, Elia, Engie Electrabel, …), each with a legal name + common short-form aliases
- [ ] Entries stored in `signals` table with `source="news_intelligence"` and `raw_data` JSONB containing headline, outlet, publication date, URL, and matched client
- [ ] **Pass 1 — entity + event extraction:** for each signal, identify (a) client entity, (b) event type from a fixed vocabulary (`investment`, `hire`, `launch`, `m_and_a`, `layoff`, `partnership`, `restructuring`, `regulatory`), (c) any explicit technology mentions. Hackathon version: regex + keyword match against the client alias list and a small event-type lexicon (Tier D per `per-source-heuristics.md`, confidence 0.5–0.65)
- [ ] **Pass 2 — inference via `client_industry_priors`:** lookup table seeded with (client or industry, event_type) → likely-skill-demand mappings. Covers the canonical `(KBC, investment, "AI")` → `{AI Engineering, MLOps, Data Platform, Security}` case and 4–5 other realistic examples (e.g., `(Proximus, partnership, "cloud")`, `(bpost, launch, "logistics platform")`)
- [ ] Skills inferred via priors written to `signal_skills` with confidence reflecting the long inference chain (0.5–0.65). Low confidence is surfaced visually in the UI, never hidden.
- [ ] Dashboard: "Signals" section shows news items with headline, client chip, event-type badge, inferred skill tags, source link, and confidence indicator
- [ ] At least 8 real news signals visible at demo time, with at least 2 strong positive hits from the target client list

**Simple / complex split inside this story.** Per `per-source-heuristics.md §8`, the robust version requires LLM-based entity extraction plus a curated `client_industry_priors` table with an explicit review cadence. For the hackathon we ship the **simple version**: RSS + regex client matching + hand-authored priors for the demo set. The **complex version** (LLM two-pass entity+event extraction, priors editor UI, scheduled review cadence) is a V1 follow-up. If the 1h box overflows, ship the simple version and stop — the narrative still lands with 8 tagged news items.

**Why third:** News is the most narratively compelling external layer and the demo-defining one. The "KBC announces AI push → AI engineer gap opens in week 6 on the heatmap" story is how the intelligence forecaster earns its name in front of Sebastiaan. It also anchors the **convergence pattern** that the forecast engine depends on: single news hits are low-confidence, but when a news hit, a procurement notice, and a pipeline deal all point at the same skill + client within a few weeks, that triangulation is what the forecast weights heavily.

**Estimated effort:** 1 hour

---

### Story 4: Procurement signals — TED notices triangulate the news layer (1h)

**Second external signal source. Proves the multi-source convergence pattern by corroborating news hits.**

**As a** talent lead,
**I want to** see recent Belgian IT/consulting procurement notices with extracted skill tags, and see where they agree or disagree with the news signals from Story 3,
**so that** I have a higher-confidence leading indicator of public-sector and enterprise consulting demand — and a cross-check against the lower-confidence news inferences.

**Acceptance criteria:**

- [ ] TED API v3 connector written: queries Belgian notices with CPV codes (72xxx, 79411000, 72224000, 73220000)
- [ ] Results stored in `signals` table with `source="ted_procurement"`
- [ ] Skill extraction: keyword matching against skill taxonomy aliases on notice text (Tier C per `per-source-heuristics.md`, confidence 0.75–0.85)
- [ ] Extracted skills linked in `signal_skills` table
- [ ] Dashboard: procurement notices appear in the same "Signals" feed as news, distinguishable by source badge, with title, contracting authority, detected skills, and link to TED
- [ ] At least 5+ real procurement notices visible
- [ ] **Convergence indicator:** where a skill appears in both a news signal and a procurement signal within a 4-week window, both signals render with a "converging" marker and are flagged for the forecast engine to weight up

**Why fourth:** Procurement alone was the unique differentiator in the original plan; procurement *after news* is more valuable because it gives the forecaster a second independent source to cross-reference. The demo moment becomes "News said KBC is investing in AI. Procurement shows Smals just floated a federal AI framework contract. Forecast says: here's the aggregate AI-engineer gap in week 6." Convergence is the product, not any one source.

**Estimated effort:** 1 hour

---

### Story 5: The forecast — 12-week heatmap with bench gap overlay (1.5h)

**The core deliverable. Turns CRM + news + procurement into a prediction.**

**As a** talent lead,
**I want to** see a 12-week rolling forecast heatmap showing predicted skill demand vs. my current bench coverage, with explicit signal-source contributions per cell,
**so that** I can spot staffing gaps 6–8 weeks before they become urgent and understand *why* each prediction exists — which news hit, which procurement notice, which deal.

**Acceptance criteria:**

- [ ] Forecast engine written (`workers/forecast_engine.py`): weighted aggregation of CRM pipeline, news intelligence signals, procurement signals, and a seasonal heuristic. Weights come from `docs/architecture.md` Section 5. Trend and ATS-posting weights are set to zero for the hackathon (activated in V1 when those connectors ship).
- [ ] Confidence boost for convergence: when a skill is supported by signals from ≥2 independent sources within a 4-week window, its confidence score is raised (capped at 1.0). A cell backed only by CRM pipeline is clearly marked as lower-confidence.
- [ ] Engine run once → `forecasts` table populated for all skills with signal coverage, including the `contributing_signals` JSONB with explicit signal IDs per week
- [ ] Dashboard: heatmap visualization (recharts) — X-axis = weeks 1–12, Y-axis = skills by discipline
- [ ] Cell colour = demand intensity (green → yellow → red). Low-confidence cells use reduced opacity + hatched pattern — never hide uncertainty.
- [ ] Bench overlay: shows current supply vs. predicted demand per skill
- [ ] Gap alerts: top 3 skills where predicted demand > available supply, highlighted prominently
- [ ] Each forecast cell shows a tooltip with: predicted demand, current supply, gap, confidence, and the contributing signals — including which news items and procurement notices fed into the prediction, with links back to the source

**Why fifth:** This is the money shot. Everything before it was building the foundation; this is where the intelligence forecaster actually forecasts. The heatmap with real bench data, real news signals, real procurement corroboration, and honest confidence scoring is what makes Sebastiaan say "I can see how this becomes useful."

**Estimated effort:** 1.5 hours

---

### Story 6: Polish and demo prep (30min)

**Make it demo-ready. Not a feature story — a quality story.**

**As a** hackathon presenter,
**I want to** walk through a clean demo flow that tells the intelligence forecaster story end-to-end,
**so that** the Sebastiaan sniff test is compelling and the concept lands.

**Acceptance criteria:**

- [ ] Dashboard has a clean layout with sidebar navigation: Forecast / Bench / Signals
- [ ] Landing page shows the forecast heatmap + top 3 gap alerts + the most recent high-impact news signal
- [ ] Demo script prepared:
  - bench view → "here's the capacity we have today"
  - signals view → "KBC just announced an AI push — here's the news hit, and here's the TED notice from Smals that corroborates it"
  - forecast view → "here's the AI-engineer gap opening in week 6, with high confidence because two independent sources agree"
  - drill into a gap → "here's what to do: hire, train, or subcontract"
- [ ] Any broken UI elements or empty states handled gracefully
- [ ] README in repo explaining what the prototype does and how to run it

**Why last:** Polish after function. The demo narrative is what makes the prototype land, but only if the news signals, procurement corroboration, and forecast underneath are real and working.

**Estimated effort:** 30 minutes

---

## Hackathon Timeline

| Time | Story | Deliverable |
|---|---|---|
| **0:00–1:00** | Story 1: Skeleton | Full stack working: Supabase → Next.js → one data point visible |
| **1:00–2:30** | Story 2: Real bench | Real Movify data from Boond in the dashboard |
| **2:30–3:30** | Story 3: News intelligence | Belgian news RSS + client priors → news signals with inferred skills |
| **3:30–4:30** | Story 4: Procurement | TED procurement notices with skill extraction and convergence markers |
| **4:30–6:00** | Story 5: Forecast | 12-week heatmap with bench gaps and convergence-boosted confidence |
| **6:00–6:30** | Story 6: Polish | Demo-ready, clean flow, narrative prepared |

**Buffer:** Story 6 is the most cuttable if time runs short. Story 3 has an internal simple/complex split — if news extraction overflows the 1h box, ship the RSS + regex version immediately and defer the LLM entity pass to V1. The **minimum viable demo** is Stories 1–5 (skeleton + real bench + news + procurement + forecast). Trying to fit Story 6 at the expense of Story 4 or 5 would hollow out the narrative.

---

## Split Evaluation

### Does this split reveal low-value work we can deprioritize?

Yes. The refactored split makes clear that:

- **Google Trends is a V1 investment, not a hackathon story.** The original plan had it as Story 4; moving news-intelligence into Phase 3 pushes trends out of the hackathon budget entirely. Two external sources — one narratively dramatic (news), one authoritatively high-confidence (procurement) — beat three diluted ones when the demo has to land in 6 hours.
- **LLM entity extraction on news can be deferred.** The hackathon version uses regex + hand-authored client priors. The full two-pass LLM extraction + priors review cadence from `per-source-heuristics.md §8` is a V1 investment, not a hackathon-day task.
- **Fancy multilingual NLP is still not needed.** Simple keyword matching against skill aliases, combined with a curated client alias list, is sufficient to prove the concept on both procurement notices and news headlines.
- **Story 6 (Polish) can be minimal.** A rough UI with real news signals, real procurement corroboration, and a working forecast is more compelling than a polished UI with thin data.

### Does this split produce roughly equal-sized stories?

Roughly yes. Four stories at 1–1.5h and one at 30min. The heaviest stories (2 and 5) still carry the most value — that's appropriate. Story 3 is deliberately time-boxed at 1h with an internal simple/complex escape hatch so it doesn't eat into the forecast story.

---

## INVEST Validation (Per Story)

| Story | I | N | V | E | S | T |
|---|---|---|---|---|---|---|
| 1. Skeleton | ✅ | ✅ | ✅ (proves full stack) | ✅ | ✅ (1h) | ✅ |
| 2. Real bench | ✅ | ✅ | ✅ (real data visible) | ✅ | ✅ (1.5h) | ✅ |
| 3. News intelligence | ✅ | ✅ | ✅ (intelligence layer, demo-defining) | ✅ | ✅ (1h) | ✅ |
| 4. Procurement | ✅ | ✅ | ✅ (corroborating signal, convergence) | ✅ | ✅ (1h) | ✅ |
| 5. Forecast | ⚠️ Depends on 1–4 | ✅ | ✅ (core deliverable) | ✅ | ✅ (1.5h) | ✅ |
| 6. Polish | ⚠️ Depends on 1–5 | ✅ | ✅ (demo-ready) | ✅ | ✅ (30min) | ✅ |

Stories 5 and 6 have natural dependencies (they need data to exist), but that's inherent to the hackathon sequence — not a design flaw.

---

## Dependencies & Blockers

| Blocker | Impact | Mitigation |
|---|---|---|
| **Boond data access** | Blocks Story 2 | Resolve before hackathon day. If no API: prepare a CSV/JSON export in advance. |
| **News RSS feeds** | Blocks Story 3 | De Tijd, Data News, L'Echo publish public RSS. Verify feed URLs and that title + abstract come through unauthenticated the night before. |
| **Client priors seed** | Blocks Story 3 inference | Author the `client_industry_priors` seed with Sebastiaan before hackathon day. 15–25 entries is enough; include the canonical KBC-pushes-AI case. |
| **Target client alias list** | Blocks Story 3 entity matching | Prepare legal name + common short forms per target client (e.g., "KBC" / "KBC Group" / "KBC Bank"). Tier D regex matching needs these to hit. |
| **TED API availability** | Blocks Story 4 | TED API v3 is free and anonymous. Test the query before hackathon day. |
| **Supabase project setup** | Blocks everything | Create the Supabase project and run schema migration the night before. |
| **Vercel deployment** | Blocks visible demo | Deploy the Next.js skeleton to Vercel early in Story 1. Auto-deploys from git after that. |

### Pre-hackathon checklist

- [ ] Supabase project created, schema SQL ready to run
- [ ] Boond data access confirmed (API key or export file prepared)
- [ ] RSS feed URLs for De Tijd + Data News confirmed, hit once from the connector, unauthenticated access verified
- [ ] Target client alias list authored (15–25 enterprises, multiple aliases per entry)
- [ ] `client_industry_priors` seed authored with Sebastiaan (at least 5 realistic `(client_or_industry, event_type) → skills` mappings, canonical KBC-pushes-AI case included)
- [ ] TED API v3 tested with a sample Belgian query (CPV codes 72xxx, 79411000, 72224000, 73220000)
- [ ] Next.js project scaffolded with Supabase client configured
- [ ] Vercel project linked to GitHub repo
- [ ] Skill taxonomy CSV prepared (12 disciplines, top 50 skills, aliases) per `docs/research/taxonomy-reconciliation.md`

---

## What comes after the hackathon

If the prototype passes the sniff test, the V1 roadmap picks up where the hackathon left off:

| V1 story | Pattern | Builds on |
|---|---|---|
| Upgrade news extraction to LLM two-pass (entity + inference) per `per-source-heuristics.md §8` | Simple/Complex (Pattern 7) | Story 3 |
| Add company press-room scraping for the target-client seed list | Data variations (Pattern 4) | Story 3 |
| Add Belga Press + Moniteur Belge / Belgisch Staatsblad regulatory feeds | Data variations (Pattern 4) | Story 3 |
| Author `client_industry_priors` review cadence + lightweight editor UI | Data entry methods (Pattern 5) | Story 3 |
| Add Google Trends signals (geo=BE) — technology adoption layer | Data variations (Pattern 4) | Story 4 pattern |
| Add ATS job posting signals (Greenhouse, Lever, Ashby, Workable) | Data variations (Pattern 4) | Story 4 pattern |
| Add BOSA e-Procurement (below-threshold tenders, €30k–€215k range) | Data variations (Pattern 4) | Story 4 |
| Add weekly digest email | Workflow steps (Pattern 1) | Story 5 |
| Add skill drill-down with full signal explainability | Simple/Complex (Pattern 7) | Story 5 |
| Add historical pattern detection from Boond projects | Major effort (Pattern 6) | Story 2 |
| Add configurable signal weights UI | Data entry methods (Pattern 5) | Story 5 |
| Add forecast accuracy tracking (retrospective, `forecast_actuals`) | Defer performance (Pattern 8) | Story 5 |
| Add Supabase Auth for team access | Simple/Complex (Pattern 7) | Story 1 |

Each V1 story follows the same principle: thin vertical slice, end-to-end value, demo-able increment.

---

*Breakdown uses Richard Lawrence's Humanizing Work splitting methodology. Primary patterns: Simple/Complex (Pattern 7) for the overall split, Workflow Steps (Pattern 1) for the hackathon sequence, Data Variations (Pattern 4) for signal-source ordering. Each story is a vertical slice delivering observable value. Per-source extraction heuristics, confidence tiers, and the `client_industry_priors` concept come from `docs/research/per-source-heuristics.md §8` (industry news). Two-layer occupation/skill extraction comes from `docs/research/signal-to-skill-mapping.md`. The 12-discipline taxonomy and ESCO/Lightcast reconciliation come from `docs/research/taxonomy-reconciliation.md`.*
