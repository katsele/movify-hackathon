# Skills Demand Forecaster — PRD

*Movify / TheForge — April 2026*
*Audience: Sebastiaan + dev team (internal)*

---

## 1. Executive Summary

We're building a **Skills Demand Forecaster** for Movify's talent leads to solve the problem of reactive staffing decisions — where consultancies discover skill demand shifts 2–3 months late, burning €22K/month per idle consultant — by combining Boond CRM pipeline data with external market signals (procurement feeds, industry news, international trends, technology adoption curves) into a rolling 12-week skill demand forecast. The hackathon deliverable is a working prototype that ingests real Boond data and at least two external signal sources to produce a visible demand forecast with bench gap indicators. The full V1 extends this to all three signal layers and a weekly digest, targeting Movify as first customer with the architecture designed to be CRM-agnostic from day one.

---

## 2. Problem Statement

### Who has this problem?

Sebastiaan and the talent/staffing leads at Movify — a 100+ person Belgian digital consultancy selling product management, UX design, AI engineering, and development talent to enterprise clients across Flanders, Wallonia, and Brussels.

### What is the problem?

Staffing decisions are reactive. Movify discovers what skills clients need *after* demand has already shifted — too late to recruit, upskill, or source freelancers proactively. The result: bench time on the wrong profiles while scrambling to fill the right ones. No tool exists that combines Movify's own CRM pipeline data with external market signals to predict which specific skills clients will request in 3–6 months.

### Why is it painful?

- **€22K/month** lost revenue per idle consultant on the wrong profile
- **3–6 month hiring lag** vs. market skill shifts — by the time you react, competitors have locked up available talent
- **No forward visibility** beyond the current pipeline and partner intuition
- Existing PSA tools (Kantata, Planview, Float) answer "do I have enough people for confirmed projects?" — not "what types of talent will clients come asking for?"

### Evidence

- **72%** of Belgian employers report they can't fill positions (ManpowerGroup 2025)
- **21,000+** unfilled IT vacancies in Belgium
- **Q1 2024 MEOS**: Net Employment Outlook for Belgian IT was +49% — demand is structurally high and volatile
- **No Belgian-specific tactical demand forecaster** exists today (validated across TechWolf, Lightcast, Agoria, VDAB, all staffing agencies — see research docs)
- The hotel/airline industry solved this decades ago with yield management — no IT consultancy does it systematically

---

## 3. Target Users & Personas

### Primary persona: Sebastiaan (Talent Lead)

- **Role:** Managing partner / talent lead at Movify
- **Responsibilities:** Staffing decisions, hiring pipeline, bench management, client relationship management
- **Current tools:** Boond (CRM/PSA), LinkedIn, Excel, partner network, gut feeling
- **Goals:** Staff the right profiles before clients ask. Minimise bench time. Win tenders by pre-positioning talent.
- **Pain points:** No forward-looking demand signals. Discovers skill shifts 2–3 months late. CRM data exists but isn't triangulated against market signals. Spends time in LinkedIn scrolling instead of data-backed forecasting.
- **Tech savviness:** High — comfortable with dashboards, data, and technical tools. Will use raw data if it's actionable.

### Secondary persona: Consultant managers / practice leads

- **Role:** Manage consultants within a discipline (e.g., "AI & Data" practice lead)
- **Needs:** See which skills in their practice are trending up/down. Know when to upskill team members. Anticipate which consultants will roll off and what to prepare next.
- **Differs from primary:** More focused on their specific discipline; less concerned with cross-practice view.

### Jobs-to-be-done

**Primary:** "Help me predict what skills my clients will need in 3–6 months so I can recruit and upskill before demand materialises — not after."

**Secondary:** "Show me where my current bench coverage diverges from predicted demand so I know exactly where the gaps are."

---

## 4. Strategic Context

### Business goals

- **Reduce bench time** by matching consultant supply to predicted (not historical) demand
- **Win more tenders** by pre-positioning the right profiles before briefs land
- **Build a proprietary data asset** — Movify's project history + CRM data becomes a competitive moat over time
- **Potential product play** — if it works for Movify, it can be offered to other Belgian consultancies (TheForge suite expansion)

### Market opportunity

- **TAM:** 100+ mid-size Belgian digital consultancies (50–500 people, €5M–50M revenue) + the broader EU IT consultancy market
- **SAM:** Belgian digital consultancies actively managing bench time and staffing decisions — estimated 30–50 firms large enough to benefit
- **SOM:** Start with Movify (internal), expand to 5–10 peer consultancies within 12 months

### Competitive landscape

| Player | What they do | Why they're not this |
|---|---|---|
| **Kantata / Planview / Float** | Resource scheduling for confirmed projects | Reactive. No demand forecasting. Enterprise pricing ($35K–$66K/yr). |
| **LinkedIn Talent Insights** | Current hiring analytics | Descriptive, not predictive. No CRM fusion. €6–20K/yr. Belgium = rounding error. |
| **Lightcast** | Global labour market analytics | Belgian depth is thin. €30–100K+/yr. No CRM integration. Descriptive. |
| **TechWolf (Ghent)** | Internal workforce skill inference | Different problem — maps *current* skills of employees, not *future* market demand. Complementary. |
| **VDAB / Agoria / salary guides** | Annual reports | Backward-looking. Occupation-level. Single-region. Miss 60–80% of digital roles. |

### Why now?

- **Hackathon timing** — concentrated effort to prove the concept end-to-end in one day
- **Boond data exists** and is accessible — the internal signal layer is ready to wire up
- **GenAI** makes pattern extraction from unstructured project data and tender documents tractable
- **Belgian IT talent shortfall** projected at 21,000+ workers — firms that forecast proactively will structurally outperform
- **No competitor is doing this** — the niche is open and validated through research

---

## 5. Solution Overview

### The concept

A demand forecasting engine modelled on hotel/airline yield management. Instead of "you have X rooms free," it says "you will need X profiles in 6 weeks, here's why, here's what to do now." Three signal layers feed a forecasting engine that produces a rolling 12-week skill demand prediction.

### Architecture: three signal layers

**Layer 1 — Internal signals (Boond/CRM)**
- Pipeline deals in progress + expected start dates
- Profile types requested per deal
- Historical project compositions (which skills, when, how long)
- Contract end dates (consultant roll-off schedule)
- Current bench (who is available, at what skill level)

**Layer 2 — External market intelligence**
- **Public procurement pipeline** — TED API v3 + BOSA e-Procurement, filtered by CPV codes (IT services 72xxx, management consultancy 79411000, UX/design 72224000). 3–6 month leading indicator.
- **Client industry news** — enterprise announcements, M&A, CTO appointments, AI investment signals
- **International market trends** — US/UK hiring patterns as 1–2 year leading indicators for Belgium
- **EU regulatory shifts** — AI Act, NIS2, DORA → compliance consultancy demand waves
- **Vacancy signals** — ATS endpoints from 100+ Belgian scale-ups, ICTJob.be, VDAB/Le Forem APIs
- **Technology adoption curves** — Google Trends (geo=BE), GitHub archive, Devoxx/FOSDEM topics, Meetup activity

**Layer 3 — Forecasting engine**
- Combines Layers 1 + 2 using GenAI-powered pattern extraction
- Produces: 12-week skill demand heatmap, bench gap alerts, confidence scores, actionable triggers

### Hackathon deliverable (1 day)

The hackathon prototype must demonstrate the core loop end-to-end, even if data coverage is limited:

**Must have (hackathon day):**
1. **Boond data ingestion** — pull real pipeline and bench data (via API or export)
2. **At least 2 external signal sources wired up** — procurement feed (TED API) + one other (e.g., Google Trends geo=BE, or ATS endpoints)
3. **A visible 12-week forecast** — dashboard or simple UI showing predicted skill demand vs. current bench, with at least basic gap indicators
4. **Skill taxonomy mapping** — even if simple, map incoming data to Movify's discipline taxonomy

**Nice to have (hackathon day):**
- Confidence scores on predictions
- Historical pattern detection from Boond project data
- A weekly digest draft (even if manually triggered)
- Procurement tender NLP extraction (skill tags from bestek documents)

### Full V1 (post-hackathon)

- All Layer 2 signal sources integrated
- Automated weekly digest with forecast updates and recommended actions
- CRM data quality pipeline (cleaning, structuring historical projects)
- Confidence scoring based on signal convergence
- Quarterly deep-dive report generation

### Key user flows

**Flow 1: Weekly forecast check**
1. Sebastiaan opens the dashboard on Monday morning
2. Sees 12-week skill demand heatmap with bench overlay
3. Spots: "AI engineering demand forecast +40% in weeks 6–10, driven by 3 new procurement notices + KBC AI investment signal. Current bench: 1 AI engineer available. Gap: 2–3 profiles."
4. Action: triggers recruitment pipeline for AI engineers now, 6 weeks ahead of demand

**Flow 2: Signal alert**
1. System detects a new cluster of procurement notices for "cloud migration consulting" in Brussels
2. Alert sent: "Cloud/DevOps demand spike predicted for Q3. 4 new federal procurement notices + Proximus infrastructure announcement. You have 2 cloud engineers on bench, 1 rolling off in week 4."
3. Sebastiaan decides: extend contract for rolling-off consultant, start sourcing 1 additional freelancer

**Flow 3: Staffing meeting prep**
1. Before weekly staffing meeting, Sebastiaan pulls up the forecast view
2. Shows the team: "here's what the data says we'll need in 8–12 weeks vs. what we have"
3. Discussion shifts from "what are you hearing?" anecdotes to data-backed decisions

---

## 6. Success Metrics

### Primary metric

**Forecast accuracy** — does the model correctly predict skill demand 6–8 weeks ahead?
- **Hackathon target:** Produce a forecast that passes the "Sebastiaan sniff test" — does the prediction align with what he knows from pipeline and experience?
- **V1 target:** ≥60% accuracy on skill-category predictions (right discipline, right direction) at 6-week horizon, measured retrospectively after 3 months of operation
- **V2 target:** ≥75% accuracy, with confidence scoring that correctly ranks high vs. low certainty predictions

### Secondary metrics

- **Bench time reduction** — % idle time reduction attributable to proactive staffing decisions. Target: -3.5 percentage points (20% → 16.5%) within 6 months of V1 adoption.
- **Time-to-fill improvement** — days to fill a client request, comparing pre-forecaster vs. post-forecaster periods. Target: -2 weeks.
- **Signal-to-action rate** — % of forecast alerts that lead to a concrete staffing action (recruit, upskill, source freelancer). Target: ≥40%.
- **Weekly digest engagement** — does Sebastiaan actually read and act on it? Binary: yes/no for first 8 weeks.

### Guardrail metrics

- **False alarm rate** — forecasts that predict demand spikes that don't materialise. Must stay below 30% to maintain trust.
- **Data freshness** — no signal source more than 7 days stale in the live system.

### Hackathon-specific success criteria

The hackathon prototype is successful if:
1. Real Boond data is visible in the system (not mocked)
2. At least 2 external signals are ingested and displayed
3. A 12-week forecast view exists (even if naive)
4. Sebastiaan says: "I can see how this becomes useful" — the core concept is proven

---

## 7. User Stories & Requirements

### Epic hypothesis

We believe that building a demand forecasting engine that combines Boond CRM data with external market signals will enable Movify to predict skill demand 3–6 months ahead, because staffing decisions today are based on lagging indicators and gut feeling while predictive signals exist in the open but aren't being wired together. We'll validate this by measuring forecast accuracy retrospectively after 3 months and tracking bench time reduction.

### Hackathon user stories

**Story H1: View current bench and pipeline**
As a talent lead, I want to see my current bench (available consultants by skill) and pipeline (upcoming deals by profile type) in a single view, so I have a baseline for forecasting.

Acceptance criteria:
- [ ] Boond data is ingested (API or export)
- [ ] Dashboard shows: consultants on bench, grouped by skill/discipline
- [ ] Dashboard shows: pipeline deals with expected start dates and requested profile types
- [ ] Contract end dates visible (who rolls off when)

**Story H2: Ingest procurement signals**
As a talent lead, I want to see relevant Belgian procurement notices (IT services, management consultancy, UX/design), so I have a 3–6 month leading indicator of public-sector consulting demand.

Acceptance criteria:
- [ ] TED API v3 queried with Belgian filters + relevant CPV codes
- [ ] Results displayed with: title, contracting authority, CPV codes, estimated value, deadline
- [ ] Basic keyword extraction from notice text (technologies, profile types mentioned)

**Story H3: Ingest at least one additional external signal**
As a talent lead, I want to see at least one additional market signal (e.g., Google Trends for key skills in Belgium, or ATS job postings from Belgian scale-ups), so the forecast is triangulated beyond procurement alone.

Acceptance criteria:
- [ ] At least one additional source is wired up and displaying data
- [ ] Data is mapped to the same skill taxonomy as Boond and procurement data

**Story H4: View a 12-week demand forecast**
As a talent lead, I want to see a rolling 12-week prediction of which skills will be in demand, overlaid against my current bench, so I can see gaps before they become urgent.

Acceptance criteria:
- [ ] Heatmap or timeline view showing predicted demand by skill for next 12 weeks
- [ ] Current bench overlay showing coverage vs. predicted demand
- [ ] Gap indicators: skills where predicted demand > available supply
- [ ] Even a simple/naive prediction model is acceptable for hackathon — the UI and data flow matter more than model sophistication

### V1 user stories (post-hackathon)

**Story V1: Receive weekly forecast digest**
As a talent lead, I want to receive a weekly automated briefing summarising forecast changes, new signals detected, and recommended actions.

Acceptance criteria:
- [ ] Automated weekly email/notification with: top 3 forecast changes, new procurement notices, signal highlights
- [ ] Each item includes a recommended action (recruit / upskill / source freelancer / monitor)
- [ ] Confidence level indicated per prediction

**Story V2: Explore historical patterns**
As a talent lead, I want to see how past project staffing patterns correlate with demand signals, so I can calibrate my trust in the forecaster.

Acceptance criteria:
- [ ] Historical Boond project data analysed for patterns (seasonality, skill clustering, project duration by type)
- [ ] Patterns visualised and used as inputs to the forecasting engine
- [ ] Retrospective view: "6 months ago, these signals were present → this demand materialised"

**Story V3: Drill into a specific skill forecast**
As a talent lead, I want to drill into a specific skill (e.g., "AI engineering") and see all the signals contributing to its demand prediction, so I understand *why* the forecast says what it says.

Acceptance criteria:
- [ ] Clicking a skill in the heatmap opens a detail view
- [ ] Shows: contributing signals (procurement notices, trend data, pipeline deals), confidence breakdown, historical pattern match
- [ ] Explainable: the user can understand and challenge the prediction

**Story V4: Configure signal weights**
As a talent lead, I want to adjust how much weight different signal sources carry in the forecast, so I can tune the model based on my experience.

Acceptance criteria:
- [ ] Admin UI with sliders or settings for signal source weights
- [ ] Changes reflected immediately in forecast recalculation
- [ ] Default weights provided based on signal reliability research

### Edge cases & constraints

- **Boond API availability:** If no API exists, the system must work with periodic CSV/JSON exports. This shapes whether the forecaster runs on live data or periodic snapshots.
- **Multilingual NLP:** Belgian tender documents and job postings mix NL, FR, and EN — often within a single document. Skill extraction must handle this.
- **Sparse data early on:** The forecasting engine will have limited history at launch. Initial predictions should lean heavily on external signals and simple heuristics rather than ML models that need large training sets.
- **Confidence communication:** Users must understand that early forecasts are directional, not precise. Overconfident predictions will destroy trust faster than acknowledging uncertainty.

---

## 8. Out of Scope

**Not included in hackathon:**
- LinkedIn data integration (inaccessible without enterprise subscription, and not needed to prove the concept)
- Mobile interface (desktop-first)
- Multi-tenancy / other consultancy support (Movify-only for now)
- Automated recruitment triggers (forecast → action is human-driven)
- Advanced ML models (simple heuristics and signal aggregation first)

**Not included in V1:**
- Cross-firm demand aggregation (network effects require multiple customers)
- Real-time Slack/Teams notifications (weekly digest is sufficient)
- Freelancer marketplace integration
- Client-facing portal (internal tool only)

**Future consideration (V2+):**
- Multi-consultancy platform with anonymised demand aggregation
- CRM-agnostic connectors (beyond Boond — Bullhorn, Salesforce, etc.)
- AI-powered "what if" scenario planning ("what if we upskill 3 Java devs to React?")
- Client-facing talent availability signals

---

## 9. Dependencies & Risks

### Technical dependencies

| Dependency | Status | Impact |
|---|---|---|
| **Boond API access** | To be confirmed | Critical — determines live data vs. export approach. Resolve first. |
| **Boond historical data quality** | Needs audit | High — messy data weakens the internal signal layer. Even 12–18 months of clean data is enough to start. |
| **TED API v3 access** | Available (free, anonymous read) | Low risk — well-documented, free API. |
| **BOSA e-Procurement** | No API, scraping required | Medium — below-threshold contracts are high-signal but need scraping pipeline. |
| **TheForge infrastructure** | Available (self-hosted Supabase on OVH VPS) | Low risk — existing infrastructure, sits alongside CVForge. |

### External dependencies

- **ICTJob.be partnership** (V1) — single highest-leverage data partnership. €10–30K/yr estimated. Not needed for hackathon.
- **VDAB Vacature API partnership approval** (V1) — free but requires approval process. Le Forem is open without approval.

### Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Boond has no API** | Medium | High | Fall back to scheduled CSV exports. Design the data layer to accept both live and batch inputs. |
| **Forecast accuracy too low to be useful** | Medium | High | Start with high-confidence signals (procurement, CRM pipeline, seasonal patterns). Be transparent about confidence levels. The "Sebastiaan sniff test" is the first validation gate. |
| **NLP quality on multilingual tender docs** | High | Medium | Start with keyword matching + regex. Layer in VDAB Competentiezoeker API and TechWolf's JobBERT as quality improves. This is an iterative investment, not a launch blocker. |
| **Signal noise overwhelms signal** | Medium | Medium | Start with fewer, higher-quality sources. Add broader intelligence (news, geopolitical) progressively, measuring forecast accuracy delta at each step. |
| **No willingness to pay from other consultancies** | Medium | Low (for V1) | V1 is internal to Movify — WTP risk is deferred. The yield management analogy is the most compelling pitch frame. Validate with 5–10 peers after internal proof. |
| **LinkedIn blind spot** | Certain | Medium | By design, the forecaster reduces reliance on vacancy data. Broader signals (procurement, news, international trends) partially compensate. Be transparent about the gap. |

---

## 10. Open Questions

1. **Does Boond have an API?** — This is the single most important question to resolve before the hackathon. Live data vs. export shapes the entire technical approach.
2. **What does clean Boond data look like?** — Need to audit: are pipeline deals consistently tagged with skill/profile types? Are historical projects structured enough to extract skill compositions?
3. **What skill taxonomy do we use?** — Proposal: start with Movify's 12 discipline taxonomy, map to ESCO + Lightcast Open Skills for granularity. But the taxonomy must match how Sebastiaan actually thinks about staffing.
4. **How do we handle the cold start?** — The forecasting engine has no history on day one. Initial approach: weighted aggregation of external signals + CRM pipeline extrapolation + seasonal heuristics. No ML until we have 6+ months of forecast-vs-actual data.
5. **What's the procurement signal lag?** — TED notices have 1–3 day publication lag, but the real question is: how far ahead of actual project staffing do Contract Notices sit? Research says 3–6 months — validate with Sebastiaan's experience.
6. **Should the hackathon prototype be throwaway or foundation?** — Recommendation: build on TheForge (Supabase) from day one. Even if rough, the data model and ingestion pipelines are worth preserving.
7. **What format for the weekly digest?** — Email? Dashboard notification? Slack message? Start with whatever Sebastiaan will actually read.

---

## Appendix: Hackathon Day Plan

A suggested sequence for the 1-day hackathon:

| Block | Duration | Activity |
|---|---|---|
| **Morning 1** | 1.5h | Resolve Boond data access (API or export). Pull real data. Design skill taxonomy mapping. |
| **Morning 2** | 1.5h | Wire up TED API v3 procurement feed with Belgian + CPV filters. Basic keyword extraction. |
| **Afternoon 1** | 1.5h | Wire up second signal source (Google Trends or ATS endpoints). Build the 12-week forecast view (even naive). |
| **Afternoon 2** | 1.5h | Overlay bench data on forecast. Add gap indicators. Polish the dashboard. |
| **End of day** | 30min | Demo to Sebastiaan. "Sniff test" validation. Capture feedback and next steps. |

---

*This PRD is a living document. It captures the current understanding of the problem, solution, and scope — and will evolve as we learn through building. Based on the value proposition and data feasibility research conducted April 2026.*
