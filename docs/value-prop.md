# Value proposition — Skills Demand Forecaster

## 1. Who

**Managing partners and talent leads at Belgian digital consultancies (50–500 people)**

Firms like Movify, Projective Group, TriFinance, and the 100+ mid-size Belgian digital consultancies that sell product management, UX design, AI engineering, and development talent to enterprise clients in finance, telecom, and public sector. They operate across Flanders, Wallonia, and Brussels — navigating three regional labour markets, two languages, and a blended workforce of employees and freelancers. Their revenue is directly tied to having the right skills available when clients need them.

**Segment characteristics:**

- 50–500 consultants, €5M–50M revenue
- Tri-regional operations (Flanders / Wallonia / Brussels)
- Blended workforce (employees + freelancers)
- 12+ digital disciplines beyond pure IT (product, design, AI, strategy)

---

## 2. Why — the job to be done

**Predict what skills your clients will need in 3–6 months — before demand materialises and bench time eats your margin**

### The analogy

Hotels and airlines solved this decades ago. Yield management and demand forecasting are table stakes in hospitality and aviation — they don't just manage room inventory, they predict occupancy curves weeks out using booking signals, seasonality, and event calendars. No IT consultancy does this systematically. The output isn't "you have X consultants free" — it's "you will need X profiles in 6 weeks, here's why, here's what to do now."

### Functional job

Decide which profiles to recruit, upskill, or source as freelancers — based on converging signals about what Belgian enterprises will be buying in 3–6 months, not on gut feeling, stale annual reports, or last quarter's pipeline.

### Emotional job

Feel confident walking into a staffing meeting knowing you have data backing your hiring bets. Stop the anxiety of discovering a client needs "AI strategy" profiles and you have zero on the bench — because you saw it coming three months ago.

### Social job

Be seen by clients and candidates as the consultancy that's ahead of the curve — the one that proactively proposes the right skills before the RFP even lands, because they predicted the demand shift.

### Pain indicators

- **€22K/month** per idle consultant in lost revenue
- **72%** of Belgian employers report they can't fill positions (ManpowerGroup 2025)
- **3–6 month** hiring lag vs. market skill shifts — by the time you react, competitors have locked up the talent
- **21,000+** unfilled IT vacancies in Belgium alone
- **No equivalent of hotel yield management** exists for IT consultancy staffing

---

## 3. What before — current situation

**Gut feeling, annual PDFs, and reactive scrambling**

Today, talent decisions at Belgian consultancies rely on a patchwork of lagging, fragmented, backward-looking signals:

| Current method | Friction |
|---|---|
| **CRM pipeline + partner intuition** | You see your own pipeline, not the market. No triangulation against external signals. Useful, but flying blind on what's coming next quarter. |
| **LinkedIn scrolling by partners** | Anecdotal, biased toward who they follow, no historical trend, no systematic signal extraction |
| **Robert Half / Hays annual salary guides** | Published once/year, focus on IT/finance — no product, UX, or AI strategy roles |
| **Agoria "Be the Change" reports** | 5-year horizon, macro-level (541K unfilled by 2030) — too abstract for quarterly staffing decisions |
| **VDAB / Le Forem shortage lists** | Annual, occupation-level (not skill-level), single-region, and largely irrelevant for the digital consulting market — they capture under 20% of senior product/UX/AI-strategy and consulting roles |
| **Word-of-mouth and network chatter** | The primary way consultancies learn about upcoming framework contracts and client shifts — zero lead time, zero structure |
|  |  |

### The result

Staffing decisions are reactive. A consultancy discovers "everyone wants dbt engineers" or "AI strategy is suddenly hot" 2–3 months after the market shifted — by which time competitors have locked up the available talent, and bench consultants with yesterday's skills are burning €22K/month.

### Deeper friction points

- **Consulting demand is opaque.** When Belfius or SNCB is about to issue a framework contract for AI consultancy, firms learn about it through word-of-mouth or when the tender drops — with no leading indicator. This is where the biggest money sits, and it's invisible.
- **No one connects internal CRM data with external market signals.** Existing PSA tools (Kantata, Planview, Float, Scoro) offer resource scheduling — "do I have enough people for confirmed projects?" — but none combine pipeline data with forward-looking demand intelligence to predict *what types of talent* clients will come asking for.
- **Nobody reads the signals that already exist.** Client industry news (KBC pushing AI → anticipate AI engineer demand), EU regulation shifts (AI Act → compliance consultancy wave), geopolitical events, international market trends (US is 1–2 years ahead in AI adoption — use that as a leading indicator), CEO appointments, public procurement pipelines — these signals exist in the open but no one is wiring them together into a staffing forecast.
- **Extract information from direct client meetings.** When meeting a client, extracgting the data from the meeting into usable insights is almost impossible. 

---

## 4. How — the solution

**A demand forecasting engine that predicts which skills your clients will need in 3–6 months — by combining your CRM pipeline with broad market intelligence**

This is not another vacancy dashboard. The Skills Demand Forecaster combines three signal layers into a rolling prediction of skill demand, modelled after the yield management systems that transformed hotels and airlines. The output is not "here's what's being hired right now" (red ocean — every competitor can scrape vacancies). The output is: *"In Q3, based on your pipeline, client industry trends, and historical patterns, you will likely need 3 additional React developers and 2 AI engineers. Your current bench covers 1 of those. Start recruiting now."*

### Three signal layers

**Layer 1 — Internal signals (Boond/CRM)**
Pipeline deals in progress, expected project start dates, profile types requested per deal, historical project compositions (which skills were needed, when, for how long), contract end dates (when consultants roll off), and current bench availability. This is Movify's proprietary data advantage — the ingredient no competitor can replicate.

**Layer 2 — External market intelligence**
A broad set of forward-looking signals, far beyond vacancy scraping:

| Signal category | Sources | Why it matters |
|---|---|---|
| **Public procurement pipeline** | TED API v3 + BOSA e-Procurement, filtered by CPV codes for IT services, management consultancy, UX/design consultancy | 3–6 month leading indicator of public-sector consulting demand. Contract notices list specific technologies, certifications, FTE counts. The single highest-quality forward signal — and no competitor uses it. |
| **Client industry news & investment signals** | Belgian enterprise news, annual reports, M&A activity, CEO/CTO appointments, strategic announcements | KBC pushing AI → anticipate AI engineer demand. New CTO at Proximus → expect transformation projects. These are demand triggers hiding in plain sight. |
| **International market trends** | US/UK tech hiring patterns, Gartner/Forrester emerging tech cycles, global VC investment themes | The US market leads Belgium by 1–2 years in AI, platform engineering, and other adoption curves. Use it as a crystal ball for what Belgian enterprises will ask for next. |
| **EU regulatory shifts** | AI Act, NIS2, DORA, accessibility directives, sustainability reporting | Each regulation creates a compliance consultancy wave. AI Act alone will drive demand for AI governance, risk assessment, and audit profiles. |
| **Geopolitical & macro signals** | Trade policy shifts, energy market moves, EU funding programs (Digital Europe, RRF) | EU funding programs earmark billions for digital transformation — track where the money flows, predict where the staffing demand follows. |
| **Vacancy & hiring signals** | ATS endpoints (Greenhouse, Lever, Ashby) from 100+ Belgian scale-ups, ICTJob.be, VDAB/Le Forem APIs, ManpowerGroup MEOS | Current hiring pulse — not the core differentiator, but essential for calibrating forecasts against real market activity. |
| **Technology adoption signals** | Google Trends (geo=BE), GitHub archive, Stack Overflow tag velocity, Devoxx/FOSDEM session topics, Belgian Meetup activity | Emerging tech detection 3–9 months ahead: curiosity and learning searches precede hiring demand. |
| **Seasonal & cyclical patterns** | Historical project data, Q3 summer slump, Q1 budget kicks, year-end freeze | Consultancy demand has strong seasonal structure — the forecaster learns these rhythms from your own history. |

**Layer 3 — Forecasting engine**
Combines Layers 1 and 2 using GenAI-powered pattern extraction to produce:

- A rolling **12-month heatmap** of anticipated skill demand vs. current bench coverage
- **Gap alerts**: skills where demand is likely to outpace your supply
- **Confidence scores** per prediction based on signal strength and convergence
- **Actionable triggers**: recruit now / upskill now / activate freelancer network / flag for cross-firm sharing

### Disciplines covered

Product management, service design, UX research, UX/UI design, AI strategy, AI/ML engineering, data science, web development, mobile development, cloud/DevOps, accessibility, design systems — mapped to a unified taxonomy using ESCO + Lightcast Open Skills (33K+ skills) as backbone.

### Key capabilities

| Feature | What it does |
|---|---|
| **12-month demand forecast** | Rolling prediction of which skills clients will request, with confidence scores and bench gap indicators |
| **Consulting demand pulse** | Real-time feed from TED/e-Procurement filtered by relevant CPV codes — a 3–6 month leading indicator no competitor offers |
| **Market shift alerts** | Automated detection of demand inflections: "AI strategy demand up 34% QoQ in Brussels, driven by 4 new public-sector frameworks + KBC and BNP Paribas Fortis AI investment announcements" |
| **Skill-level granularity** | Not just "developer" but React vs. Angular, AWS vs. Azure, LangChain vs. dbt — via NLP on multilingual posting text and tender documents |
| **CRM fusion** | Your Boond pipeline data overlaid on market signals — see where your bets align with or diverge from predicted demand |
| **Weekly digest** | Automated briefing with forecast updates, new signals detected, and recommended actions |
| **Quarterly deep-dive** | Trend analysis with historical comparison, forecast accuracy review, and forward outlook |

### Why it's fundamentally different

- **Predictive, not descriptive.** Every existing tool tells you what's happening now or what happened last year. The forecaster tells you what's coming in 3–6 months and what to do about it.
- **CRM-fused.** Your proprietary pipeline data is the ingredient that turns generic market intelligence into specific, actionable staffing predictions. No external tool can replicate this.
- **Broad signal intelligence.** Goes far beyond vacancy data — news, regulation, geopolitics, international trends, procurement pipelines, technology adoption curves. This is how you get ahead of the curve instead of tracking it.
- **Belgian-native.** Built for Belgium's tri-regional, trilingual, multi-stakeholder complexity — not a global tool with Belgium as a rounding error.
- **Mid-market pricing.** Designed for €5M–50M consultancies, not €500M enterprises. Existing enterprise tools (Kantata, Lightcast) start at €30K–66K/year before you even get Belgium-specific value.

---

## 5. What after — the outcome

**Yield management for talent — proactive forecasting instead of reactive scrambling**

### Operational outcomes

- Predict demand 3–6 months ahead instead of discovering it 1–2 months late
- Reduce bench time by recruiting and upskilling against forecast demand, not last quarter's requests
- Spot emerging skill waves (AI agents, platform engineering, accessibility consulting) before competitors, by reading international and regulatory signals
- Win more tenders by pre-positioning the right profiles before the brief lands
- Direct upskilling investments toward skills with rising forecast demand, backed by converging evidence

### Economic case

If a 100-person consultancy reduces bench time by even 3.5 percentage points (from 20% idle to 16.5%), that's roughly **€300K–400K in recovered annual revenue**. The forecaster pays for itself if it prevents a single quarter of mis-hiring.

At a top-performing consultancy achieving 80% billable utilization, every additional percentage point of utilization at €1,100/day rates across 100 consultants generates approximately **€220K annually**. Predicting demand 6–8 weeks earlier doesn't just save money — it compounds into a structural advantage.

### Strategic case

Your firm becomes the one that walks into client meetings saying *"we see AI strategy demand accelerating in Belgian banking — driven by AI Act compliance timelines, KBC's published AI roadmap, and 3 new public-sector AI frameworks in the procurement pipeline — here's the team we've already assembled"* instead of scrambling to recruit after the brief lands.

### What becomes possible

- **Yield-managed staffing meetings** replace "what are you hearing?" anecdotes — with a 12-month forecast, confidence scores, and recommended actions on the table
- **Proactive client conversations** about upcoming skill needs, backed by procurement pipeline intelligence and industry signal analysis
- **Targeted freelancer sourcing** for skills the model predicts will trend up, activated before the demand wave hits
- **Evidence-based training budgets** directed at skills with demonstrable rising forecast demand — not gut feeling
- **Network effects over time**: the more history the system accumulates, the better the predictions. Your own project data becomes a competitive moat.

---

## 6. Alternatives

| Alternative | Why it falls short | Switching friction |
|---|---|---|
| **Kantata / Planview / Float** | PSA tools that do resource scheduling, not demand forecasting. Answer "do I have enough people for confirmed projects?" — not "what will clients need in Q3?" $35K–$66K/year, 50+ seat minimum, enterprise pricing. | High (price + integration) |
| **LinkedIn Talent Insights** | €6–20K/year. Strong current data but reactive — shows what's being hired now, not what's coming. Global focus, treats Belgium as one market, skews to IT/engineering, no consulting-demand layer. | High (price) |
| **Lightcast** | €30–100K+/year. Expanded to Belgium in 2025 but Belgian depth is thin — leans on public sources you could ingest yourself. Descriptive analytics, not predictive. No CRM fusion. | Very high (price) |
| **TechWolf (Ghent)** | Solves a different problem: infers *internal* workforce skills from enterprise tool signals (Jira, M365, SAP). Does not forecast external market demand. $42.75M Series B, clients include HSBC, KBC, Cegeka — complementary, not competitive. Potential partnership opportunity. | N/A (different use case) |
| **VDAB / Le Forem / Agoria reports** | Free but annual, occupation-level not skill-level, single-region, and capture under 20% of senior digital/consulting roles. Backward-looking by design. | None (free, but insufficient) |
| **Robert Half / Hays salary guides** | Annual PDFs. IT and finance focus. No real-time signal, no skill-level granularity, no consulting-demand view. | None (free) |
| **Gut feel + CRM pipeline** | What everyone does today. Biased, anecdotal, partner-dependent, no external triangulation. Works until it doesn't — and the cost of being wrong is €22K/month per mis-hire. | None (status quo) |

### Competitive wedge

No tool today combines:

1. **Demand forecasting** (3–6 month forward-looking predictions, not backward-looking analytics)
2. **CRM fusion** (proprietary pipeline + bench data as the prediction core)
3. **Broad signal intelligence** (procurement, news, regulation, geopolitics, international trends — not just vacancy scraping)
4. **A public-procurement consulting demand signal** (empty space — no competitor uses this)
5. **Mid-market pricing** accessible to 50–500 person consultancies

Every PSA tool stops at resource scheduling. Every market intelligence tool stops at descriptive analytics. Every enterprise tool costs €30K+ and treats Belgium as a rounding error. The forecaster sits in the white space between all of them.

---

## Value proposition statement

> For Belgian digital consultancies who need to staff the right skills before demand peaks, the **Skills Demand Forecaster** is a predictive intelligence engine that combines your CRM pipeline with broad market signals — procurement feeds, client industry news, international trends, regulatory shifts, and technology adoption curves — to forecast which skills your clients will need in 3–6 months and what to do about it now. Unlike LinkedIn Talent Insights, Lightcast, or PSA tools, it doesn't just show what's happening today — it predicts what's coming tomorrow, fused with your own proprietary data, at a fraction of the cost of enterprise tools.

---

## Positioning statement

> **For** managing partners and talent leads at Belgian digital consultancies **who** need to make proactive hiring and upskilling decisions months ahead of demand, **the Skills Demand Forecaster is** a predictive talent intelligence engine **that** combines CRM pipeline data with broad market signals to produce a rolling 12-month skill demand forecast with actionable staffing recommendations. **Unlike** Kantata, LinkedIn Talent Insights, Lightcast, or annual salary guides, **our product** is the first tool to bring yield management to IT consultancy staffing — fusing proprietary pipeline data with procurement intelligence, international market trends, and regulatory signals to predict demand rather than just describe it — at mid-market pricing, purpose-built for Belgium's fragmented labour market.

---

## Key risks to validate

1. **Forecast accuracy vs. expectations.** The core promise is prediction, not just observation. Early forecasts will be imperfect, and managing customer expectations around confidence levels is critical. Mitigation: start with high-confidence signals (procurement pipeline, seasonal patterns, confirmed CRM pipeline) and build toward broader predictions as the model accumulates history. Be transparent about confidence scores.

2. **CRM data quality.** The forecaster's proprietary edge depends on clean, structured CRM data from Boond. If pipeline data is inconsistent, incomplete, or poorly categorised, the internal signal layer breaks. Mitigation: audit Boond data quality as step one. Determine API vs. export availability. Even 12–18 months of clean historical data is enough to start.

3. **LinkedIn blind spot.** Senior and consulting roles that only appear on LinkedIn (estimated 50–60% of senior product/UX/strategy roles) cannot be accessed compliantly. Mitigation: the forecaster deliberately reduces reliance on vacancy data by using broader signals (procurement, news, international trends, technology adoption). The blind spot is real but less critical for a forecaster than for a vacancy radar.

4. **NLP on multilingual free-text.** Belgian job postings and tender documents (bestekken / cahiers des charges) mix NL, FR, and EN — often within a single document. Skill extraction quality is the core technical risk. Mitigation: VDAB's Competentiezoeker API and TechWolf's open-source JobBERT model provide starting points. This is an engineering investment, not a structural blocker.

5. **Willingness to pay for predictions.** Consultancies already have access to free (if fragmented) backward-looking data. The product's value is the predictive layer and the CRM fusion — but "we predict the future" is a harder sell than "we show you the present." Needs validation with 5–10 target customers before building. The yield management analogy (hotels, airlines) may be the most compelling framing.

6. **Signal noise in broad intelligence.** Ingesting news, geopolitical events, and international trends introduces noise alongside signal. The forecasting engine must distinguish meaningful demand drivers from background chatter. Mitigation: start with the highest-signal sources (procurement, CRM, seasonal patterns) and layer in broader intelligence progressively, measuring forecast accuracy improvement at each step.

---

*Based on the 6-part JTBD value proposition template by Paweł Huryn and Aatir Abdul Rauf. Informed by deep research into Belgian labour market data sources, competitive landscape, demand forecasting feasibility, and consultancy industry dynamics. Incorporates the Skills Demand Forecaster strategic layer and data feasibility analysis (April 2026).*
