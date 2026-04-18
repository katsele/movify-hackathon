# UX Specification — Azimuth

*Skills demand forecasting for Movify — April 2026*
*Design principles: Overview first → zoom and filter → details on demand (Shneiderman's mantra)*

---

## 0. Brand Identity

**Product name:** *Azimuth* — the celestial/navigational term for the bearing angle from north. The name signals precision, foresight, and analyst credibility without chasing the SaaS-blue-plus-illustration tropes of the talent-intelligence category.

**Tagline (working):** *See what your clients will need — before they do.*

**Positioning one-liner:** *Skills demand forecasting for Belgian digital consultancies — predict the skill-mix your clients will buy in the next 3–6 months by fusing your CRM pipeline with external market signals.*

**Brand tone on screen:**
- **Confident but not cold.** Write like a senior analyst briefing a managing partner.
- **Specific over general.** "Java architects in Flanders up 23% in 30 days" beats "trending skills nearby."
- **Cite the signal.** Every prediction shows its sources — the brand voice matches the product value.
- **No breathless AI.** Avoid "revolutionary," "AI-powered," "unlock," "supercharge." Use "predicted," "forecast," "signal," "source."

**Core product vocabulary:** *forecast* (verb of choice over "predict"), *signal, gap, coverage, pipeline, skill-mix, demand, supply, bench, utilization, yield, watchlist, portfolio.*

**Visual positioning:** *"Bloomberg-serious, Linear-polished, editorially warm."* The brand recedes chromatically so the data carries the hue — chrome in graphite + cocoa, data in the six semantic colors. See §6 (colour) and §7 (typography) for the operational details.

---

## 1. Design Philosophy

### The Monday Morning Test

Sebastiaan opens the forecaster at 8:30 AM on Monday. Within 10 seconds, he should be able to answer three questions without clicking anything:

1. **"Where are my biggest gaps?"** — Which skills have the largest predicted shortfall vs. bench?
2. **"What changed since last week?"** — Any new signals or forecast shifts I should know about?
3. **"How confident should I be in this?"** — Is the data fresh and the forecast trustworthy?

Only after scanning this overview does he drill into a specific skill, signal, or time period. The UI is built around this workflow: **glance → scan → drill**.

### Core UX Principles for This Product

1. **Data density over whitespace.** This is an analyst tool, not a marketing site. Sebastiaan wants to see more, not less. Favour compact, information-rich layouts.
2. **Explain the forecast.** Every prediction must be traceable to contributing signals. "AI engineering demand is up" is useless without "because: 3 new procurement notices + KBC AI announcement + Google Trends spike."
3. **Confidence is visible everywhere.** Every forecast number shows its confidence level. Low confidence is not a bug — it's honest. Hiding uncertainty destroys trust faster than showing it.
4. **Colour encodes severity, not decoration.** Red = gap/action needed. Amber = watch. Green = covered. Grey = low confidence/insufficient data. No decorative colour.
5. **Zero onboarding.** One-user hackathon tool. No tutorials, no tooltips, no guided tours. Labels should be self-explanatory.

---

## 2. Information Architecture

### Site map

```
Azimuth
│
├── / Dashboard (home)
│   Overview: KPI cards + forecast heatmap + gap alerts + signal highlights
│   Entry point for all workflows
│
├── /forecast
│   Full 12-week forecast heatmap (larger, interactive)
│   ├── /forecast/[skill] — Skill drill-down
│   │   Demand curve, contributing signals, bench detail, recommended action
│
├── /bench
│   Current bench + pipeline view
│   Consultants by status, grouped by discipline
│   Pipeline deals with timeline
│
├── /signals
│   Signal explorer — all ingested signals
│   Filterable by source, skill, region, date
│   ├── /signals/[id] — Signal detail (procurement notice, trend data)
│
└── /settings (V1)
    Signal weights configuration
    Data source status & freshness
```

### Navigation pattern

**Left sidebar** (persistent, collapsible). Four items:

```
┌──────────────┐
│ ◉ Dashboard  │  ← Overview (home)
│ ◎ Forecast   │  ← Full heatmap + drill-down
│ ◎ Bench      │  ← Consultants + pipeline
│ ◎ Signals    │  ← Signal explorer
└──────────────┘
```

**Why sidebar, not top nav:**
- Only 4 pages — sidebar keeps them always visible without taking horizontal space from the data-dense content area.
- Sidebar can collapse to icons on smaller screens, preserving content width.
- Dashboard tools (Grafana, Metabase, Mixpanel) all use sidebar navigation — Sebastiaan expects it.

**Why not bottom nav:**
- Desktop-first tool. Bottom nav is a mobile pattern.

---

## 3. Page Layouts

### 3.1 Dashboard (Home) — `/`

The Monday morning view. Everything on one screen, no scrolling required for the critical information.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☰  Azimuth                               Last updated: 5 min ago 🔄│
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  NAV   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│        │  │ On Bench  │ │ Pipeline │ │ Top Gap  │ │ Signals  │     │
│ ◉ Dash │  │    12     │ │  €1.2M   │ │AI Eng +3 │ │  7 new   │     │
│ ◎ Fore │  │ ↓2 vs lw │ │  8 deals │ │ wk 6-10  │ │ this wk  │     │
│ ◎ Bench│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│ ◎ Sig  │                                                            │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │  12-WEEK FORECAST HEATMAP (compact)                │    │
│        │  │                                                    │    │
│        │  │  Skill        W1  W2  W3  W4  W5  W6  W7  W8 ...  │    │
│        │  │  AI Eng.      ██  ██  ██  ██  ██  ██  ██  ██      │    │
│        │  │  React        ▓▓  ▓▓  ██  ██  ██  ▓▓  ▓▓  ▓▓      │    │
│        │  │  Cloud/DevOps ░░  ░░  ▓▓  ▓▓  ██  ██  ██  ██      │    │
│        │  │  Product Mgmt ░░  ░░  ░░  ░░  ░░  ▓▓  ▓▓  ▓▓      │    │
│        │  │  UX Design    ░░  ░░  ░░  ░░  ░░  ░░  ░░  ░░      │    │
│        │  │  ...                                               │    │
│        │  │  ░ covered  ▓ watch  █ gap  ▒ low confidence       │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
│        │  ┌─────────────────────────┐ ┌────────────────────────┐   │
│        │  │  GAP ALERTS             │ │ RECENT SIGNALS          │   │
│        │  │                         │ │                         │   │
│        │  │ 🔴 AI Eng: +3 gap wk6  │ │ 📋 SNCB AI framework   │   │
│        │  │    3 procurement + KBC  │ │    CPV 72xxx · Brussels │   │
│        │  │    [View →]             │ │    2 days ago           │   │
│        │  │                         │ │                         │   │
│        │  │ 🟡 Cloud: +2 gap wk8   │ │ 📈 "dbt" trending ↑32% │   │
│        │  │    Proximus infra       │ │    Google Trends · BE   │   │
│        │  │    [View →]             │ │    3 days ago           │   │
│        │  │                         │ │                         │   │
│        │  │ 🟡 Data Eng: +1 gap w10│ │ 📋 KBC digital transf. │   │
│        │  │    Pipeline deal        │ │    CPV 79411 · Flanders │   │
│        │  │    [View →]             │ │    5 days ago           │   │
│        │  └─────────────────────────┘ └────────────────────────┘   │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

**Layout structure (12-column grid):**

| Row | Content | Columns | Height |
|---|---|---|---|
| 1 | KPI cards (4 cards) | 3 cols each | Fixed, ~80px |
| 2 | Compact forecast heatmap | Full 12 cols | ~280px |
| 3 | Gap alerts (left) + Recent signals (right) | 6 + 6 cols | ~250px |

**KPI cards (4):**

| Card | Primary value | Trend | Colour logic |
|---|---|---|---|
| **On Bench** | Count of available consultants | ↑↓ vs. last week | Neutral (grey) — context-dependent |
| **Pipeline** | Total pipeline value or deal count | Count of active deals | Neutral |
| **Top Gap** | Skill with largest predicted shortfall | Gap size + time range | Red if gap > 2, amber if 1-2 |
| **New Signals** | Count of signals ingested this week | — | Blue (informational) |

**Compact heatmap:**
- Abbreviated version of the full forecast heatmap (top 8–10 skills by gap severity)
- Click anywhere → navigates to `/forecast` with that skill highlighted
- Colour scale: green (covered) → amber (watch) → red (gap). Hatched pattern for low confidence.

**Gap alerts:**
- Top 3 skills with largest predicted demand-supply gap
- Each alert shows: skill name, gap size, time range, primary contributing signals (1-line summary)
- Click → navigates to `/forecast/[skill]`

**Recent signals:**
- Last 5 signals ingested, sorted by recency
- Each shows: icon (📋 procurement, 📈 trend, 💼 job posting), title, source + region, time ago
- Click → navigates to `/signals/[id]`

---

### 3.2 Forecast — `/forecast`

Full interactive forecast heatmap. The analytical view for deep exploration.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☰  Forecast                              Last updated: 5 min ago 🔄│
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  NAV   │  Filters: [All disciplines ▾] [All regions ▾] [12 weeks ▾]│
│        │                                                            │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │                                                    │    │
│        │  │  12-WEEK FORECAST HEATMAP (full)                   │    │
│        │  │                                                    │    │
│        │  │  Discipline / Skill  W1  W2  W3  W4  ... W12  Gap │    │
│        │  │  ─────────────────────────────────────────────────  │    │
│        │  │  AI / ML ENGINEERING                               │    │
│        │  │    AI Strategy       ░░  ░░  ▓▓  ▓▓  ... ██   +3  │    │
│        │  │    ML Engineering    ░░  ░░  ░░  ▓▓  ... ▓▓   +1  │    │
│        │  │    LangChain         ░░  ░░  ░░  ░░  ... ░░    0  │    │
│        │  │  WEB DEVELOPMENT                                   │    │
│        │  │    React             ░░  ▓▓  ▓▓  ██  ... ▓▓   +2  │    │
│        │  │    Next.js           ░░  ░░  ░░  ░░  ... ░░    0  │    │
│        │  │    Angular           ░░  ░░  ░░  ░░  ... ░░    0  │    │
│        │  │  CLOUD / DEVOPS                                    │    │
│        │  │    AWS               ░░  ░░  ▓▓  ▓▓  ... ██   +2  │    │
│        │  │    Kubernetes        ░░  ░░  ░░  ░░  ... ▓▓   +1  │    │
│        │  │  PRODUCT MANAGEMENT                                │    │
│        │  │    Product Strategy  ░░  ░░  ░░  ░░  ... ▓▓   +1  │    │
│        │  │  ...                                               │    │
│        │  │                                                    │    │
│        │  │  Legend:                                            │    │
│        │  │  ░ covered (supply ≥ demand)                       │    │
│        │  │  ▓ watch (demand approaching supply)               │    │
│        │  │  █ gap (demand > supply)                           │    │
│        │  │  ▒ low confidence (<0.4)                           │    │
│        │  │  Opacity = confidence level                        │    │
│        │  │                                                    │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
│        │  Click any skill row to drill down →                       │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

**Heatmap interaction:**

| Interaction | Behaviour |
|---|---|
| **Hover cell** | Tooltip: "AI Strategy · Week 6 — Predicted demand: 4, Current supply: 1, Gap: +3, Confidence: 0.72. Driven by: 2 procurement notices, 1 pipeline deal." |
| **Click row** | Navigate to `/forecast/[skill]` drill-down |
| **Sort** | Default: sorted by max gap (descending). Toggle: alphabetical, by discipline, by confidence |
| **Filter (discipline)** | Dropdown: All, AI/ML, Web Dev, Cloud/DevOps, Product, UX, Data, etc. |
| **Filter (region)** | Dropdown: All Belgium, Flanders, Wallonia, Brussels |
| **Filter (timeframe)** | 4 weeks / 8 weeks / 12 weeks |

**Colour encoding:**

| Colour | Meaning | Threshold |
|---|---|---|
| Green (muted) | Covered — supply ≥ predicted demand | gap ≤ 0 |
| Amber | Watch — demand approaching or matching supply | gap = 1 |
| Red | Gap — demand exceeds supply | gap ≥ 2 |
| Reduced opacity | Low confidence | confidence < 0.4 |
| Hatched overlay | Insufficient data (fewer than 2 signal sources) | active_signals < 2 |

**Accessibility notes:**
- Colour is never the sole encoding: each cell also shows a textual gap indicator in the rightmost column (+3, +1, 0).
- Hatched pattern (not just transparency) distinguishes low confidence from low demand.
- Tooltips are keyboard-accessible (Tab to cell, Enter to show tooltip).
- Full data table alternative available via "View as table" toggle.

---

### 3.3 Skill Drill-Down — `/forecast/[skill]`

Deep dive into a single skill's forecast. Answers: "Why does the forecaster predict this, and what should I do about it?"

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☰  Forecast > AI Engineering              Last updated: 5 min ago  │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  NAV   │  ┌────────────────────────────────────────────────────┐    │
│        │  │  DEMAND FORECAST (12 weeks)                        │    │
│        │  │                                                    │    │
│        │  │  5 ┤                          ╭──────╮             │    │
│        │  │  4 ┤                    ╭─────╯      ╰───╮         │    │
│        │  │  3 ┤              ╭─────╯                 ╰──      │    │
│        │  │  2 ┤        ╭─────╯                               │    │
│        │  │  1 ┤────────╯  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │    │
│        │  │  0 ┤                                               │    │
│        │  │    └──W1──W2──W3──W4──W5──W6──W7──W8──W9──W10──   │    │
│        │  │                                                    │    │
│        │  │  ── Predicted demand    ─ ─ Current supply (1)     │    │
│        │  │  ░░ Confidence band                                │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
│        │  ┌─────────────────────────┐ ┌────────────────────────┐   │
│        │  │  CONTRIBUTING SIGNALS    │ │ BENCH DETAIL           │   │
│        │  │                         │ │                         │   │
│        │  │  Weight  Source     Sig  │ │ Available now:          │   │
│        │  │  ━━━━━━  Pipeline  0.35 │ │  • Sarah M. (senior)   │   │
│        │  │  ━━━━    Procure.  0.25 │ │    Available from May 1 │   │
│        │  │  ━━━     History   0.15 │ │                         │   │
│        │  │  ━━      Trends    0.10 │ │ Rolling off:            │   │
│        │  │  ━       Postings  0.10 │ │  • Tom D. (mid) - wk 8 │   │
│        │  │                         │ │                         │   │
│        │  │  Confidence: 0.72       │ │ Supply forecast:        │   │
│        │  │  (3 of 5 sources active)│ │  Wk1-7: 1  Wk8+: 0    │   │
│        │  └─────────────────────────┘ └────────────────────────┘   │
│        │                                                            │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │  SIGNAL EVIDENCE                                   │    │
│        │  │                                                    │    │
│        │  │  📋 SNCB AI transformation framework               │    │
│        │  │     CPV 72xxx · Brussels · €2.4M · Deadline Jun 15 │    │
│        │  │     Extracted skills: AI strategy, ML engineering   │    │
│        │  │     [View on TED →]                                │    │
│        │  │                                                    │    │
│        │  │  📋 FOD Financiën AI advisory services             │    │
│        │  │     CPV 79411000 · Federal · €800K · Deadline Jul 1│    │
│        │  │     Extracted skills: AI strategy, data governance  │    │
│        │  │     [View on TED →]                                │    │
│        │  │                                                    │    │
│        │  │  💼 Pipeline: BNP Paribas Fortis AI integration    │    │
│        │  │     Status: Proposal · Expected start: Week 6      │    │
│        │  │     Requested: 2× AI engineer (senior)             │    │
│        │  │                                                    │    │
│        │  │  📈 Google Trends: "AI engineer Belgium" ↑ 28%     │    │
│        │  │     4-week trend · Confidence: 0.7                 │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │  💡 RECOMMENDED ACTION                             │    │
│        │  │                                                    │    │
│        │  │  Gap of +3 AI engineers predicted in weeks 6–10.   │    │
│        │  │  Current supply: 1 (Sarah M.), dropping to 0 in    │    │
│        │  │  week 8 (Tom D. rolls off).                        │    │
│        │  │                                                    │    │
│        │  │  Suggested actions:                                │    │
│        │  │  • Start recruiting 2 AI engineers now (6-wk lead) │    │
│        │  │  • Extend Tom D.'s availability if possible        │    │
│        │  │  • Activate freelancer network for AI profiles     │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

**Layout structure:**

| Row | Content | Purpose |
|---|---|---|
| 1 | Demand curve (line chart) | Visual forecast — demand vs. supply over 12 weeks, with confidence band |
| 2 | Contributing signals (left) + Bench detail (right) | Why the forecast says what it says + who is available |
| 3 | Signal evidence list | Every contributing signal, with source links |
| 4 | Recommended action card | Plain-language summary + suggested next steps |

**Demand curve details:**
- Solid line: predicted demand (# of profiles)
- Dashed line: current supply (bench + rolling off schedule)
- Shaded area between lines when demand > supply: the gap, coloured red with opacity = confidence
- Light grey confidence band around predicted demand line (±1 standard deviation equivalent)
- X-axis: weeks 1–12. Y-axis: headcount (0–6 typical range)

**Contributing signals breakdown:**
- Horizontal bar chart showing each signal source's weight contribution
- Bar length = weight × score (how much this source contributed to the prediction)
- Shows confidence score and count of active sources (e.g., "3 of 5 sources active")

**Signal evidence list:**
- Every signal that contributed to this skill's forecast
- Sorted by contribution weight (highest first)
- Each signal: icon (by type), title, metadata (CPV code, region, value, deadline), extracted skills, link to source
- This is the explainability layer — Sebastiaan can challenge or validate every prediction by checking its evidence

**Recommended action card:**
- Generated by the forecasting engine
- Plain language: gap size, timing, supply trajectory, concrete actions
- Actions are specific: "recruit 2 AI engineers" not "consider adjusting staffing"

---

### 3.4 Bench — `/bench`

Current state of Movify's talent. Two views: consultants and pipeline.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☰  Bench                                                           │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  NAV   │  [Consultants]  [Pipeline]           Search: [________]   │
│        │                                                            │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │  AI / ML ENGINEERING                          3 ↓  │    │
│        │  │  ┌──────────────────────────────────────────────┐  │    │
│        │  │  │ Sarah M.   Senior  On bench   Available now  │  │    │
│        │  │  │ Tom D.     Mid     On mission  Rolls off wk8 │  │    │
│        │  │  │ Lien V.    Senior  On mission  Rolls off wk14│  │    │
│        │  │  └──────────────────────────────────────────────┘  │    │
│        │  │                                                    │    │
│        │  │  WEB DEVELOPMENT                              5 ↓  │    │
│        │  │  ┌──────────────────────────────────────────────┐  │    │
│        │  │  │ Pieter K.  Senior  On bench   Available now  │  │    │
│        │  │  │ Anna B.    Mid     On bench   Available now  │  │    │
│        │  │  │ ...                                          │  │    │
│        │  │  └──────────────────────────────────────────────┘  │    │
│        │  │                                                    │    │
│        │  │  CLOUD / DEVOPS                               2 ↓  │    │
│        │  │  ...                                               │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

**Consultants tab:**
- Grouped by discipline (collapsible sections)
- Each group header shows: discipline name + count of consultants in that discipline
- Each consultant row: name, seniority, status badge, availability date
- Status badges: 🟢 On bench, 🔵 On mission, 🟡 Rolling off (within 4 weeks)
- Search filters across name, skill, status

**Pipeline tab:**

```
┌────────────────────────────────────────────────────────────────┐
│  PIPELINE DEALS                              8 active deals    │
│                                                                │
│  Deal              Client        Start   Profiles   Prob.  €   │
│  ─────────────────────────────────────────────────────────────  │
│  AI integration    BNP Paribas   Wk 6   2× AI eng   70%  180K │
│  Cloud migration   Proximus      Wk 8   3× Cloud    50%  240K │
│  UX redesign       Belfius       Wk 4   1× UX, 1PM  80%   90K │
│  Data platform     KBC           Wk 10  2× Data eng  40%  150K │
│  ...                                                           │
│                                                                │
│  Timeline view:                                                │
│  W1  W2  W3  W4  W5  W6  W7  W8  W9  W10  W11  W12           │
│  ─────────────[UX Belfius]                                     │
│  ────────────────────[AI BNP]                                  │
│  ──────────────────────────────[Cloud Prox]                    │
│  ──────────────────────────────────────────[Data KBC]          │
└────────────────────────────────────────────────────────────────┘
```

- Table view (default): sortable by deal, client, start date, probability, value
- Timeline view (toggle): Gantt-like horizontal bars showing when deals are expected to start
- Deal probability shown as percentage — affects forecast weighting
- Click deal → expands to show requested profiles and skills in detail

---

### 3.5 Signals — `/signals`

Browse and search all ingested signals. The raw intelligence layer.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ☰  Signals                                                         │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  NAV   │  Source: [All ▾]  Skill: [All ▾]  Region: [All ▾]        │
│        │  Since:  [Last 30 days ▾]                                  │
│        │                                                            │
│        │  ┌────────────────────────────────────────────────────┐    │
│        │  │  📋  SNCB AI transformation framework              │    │
│        │  │      Source: TED Procurement · Brussels             │    │
│        │  │      CPV: 72xxx · Value: €2.4M · Deadline: Jun 15  │    │
│        │  │      Skills: AI strategy, ML engineering            │    │
│        │  │      Detected: 2 days ago                           │    │
│        │  │      [View on TED →]                                │    │
│        │  ├────────────────────────────────────────────────────┤    │
│        │  │  📈  "dbt" trending ↑32% in Belgium                │    │
│        │  │      Source: Google Trends · Belgium                │    │
│        │  │      Skills: dbt, data engineering                  │    │
│        │  │      Detected: 3 days ago                           │    │
│        │  ├────────────────────────────────────────────────────┤    │
│        │  │  📋  KBC digital transformation advisory           │    │
│        │  │      Source: TED Procurement · Flanders             │    │
│        │  │      CPV: 79411000 · Value: €1.8M · Deadline: Jul 1│    │
│        │  │      Skills: AI strategy, cloud, data governance    │    │
│        │  │      Detected: 5 days ago                           │    │
│        │  ├────────────────────────────────────────────────────┤    │
│        │  │  💼  3 new AI Engineer postings on Greenhouse      │    │
│        │  │      Source: ATS · Companies: Collibra, Showpad     │    │
│        │  │      Skills: AI/ML engineering, Python, LangChain   │    │
│        │  │      Detected: 1 week ago                           │    │
│        │  └────────────────────────────────────────────────────┘    │
│        │                                                            │
│        │  Showing 1–25 of 47 signals  [Load more]                   │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

**Signal card layout:**
- Icon by type: 📋 Procurement, 📈 Trend, 💼 Job posting, 📰 News (V2)
- Title (bold), source + region, metadata (CPV, value, deadline), extracted skills as tags, time ago
- External link to source when available
- Filterable by: source type, skill, region, date range
- Sorted by detection date (most recent first)

**Filter chips:**
- Active filters shown as removable chips below the filter bar
- "Clear all" to reset

---

## 4. Component Inventory

### Shared components (used across pages)

| Component | Description | Used on |
|---|---|---|
| **SidebarNav** | Persistent left sidebar with 4 nav items + collapse toggle | All pages |
| **PageHeader** | Page title + "Last updated" timestamp + refresh button | All pages |
| **KPICard** | Big number + label + trend indicator + optional sparkline | Dashboard |
| **ForecastHeatmap** | Grid: skills × weeks, colour-coded cells with gap column | Dashboard, Forecast |
| **GapAlert** | Coloured card: skill, gap size, timeframe, contributing signal summary, link | Dashboard |
| **SignalCard** | Icon + title + source + metadata + skill tags + time ago | Dashboard, Signals, Drill-down |
| **SkillTag** | Small pill/badge with skill name, used in signal cards and bench rows | Signals, Bench, Drill-down |
| **StatusBadge** | Coloured dot + label for consultant status (on bench, on mission, rolling off) | Bench |
| **ConfidenceIndicator** | Visual indicator: filled dots or bar showing confidence 0–1 | Heatmap tooltips, Drill-down |
| **FilterBar** | Horizontal bar with dropdown filters + active filter chips | Forecast, Signals |
| **DemandCurve** | Line chart: demand vs. supply over 12 weeks with confidence band | Drill-down |
| **SignalWeightChart** | Horizontal bars showing signal source contributions | Drill-down |
| **ActionCard** | Highlighted card with recommended action text | Drill-down |
| **ConsultantRow** | Name + seniority + status badge + availability | Bench |
| **DealRow** | Deal name + client + start + profiles + probability + value | Bench (Pipeline) |
| **DealTimeline** | Gantt-like horizontal bars for deal start dates | Bench (Pipeline) |
| **EmptyState** | Illustration + message + action for no-data states | All pages |

### Data states per component

Every data-fetching component handles four states:

| State | Visual treatment |
|---|---|
| **Loading** | Skeleton placeholder matching component shape (no spinners) |
| **Loaded** | Normal rendering with data |
| **Empty** | Friendly empty state: "No signals match your filters. Try adjusting your date range." + [Reset filters] |
| **Error** | Error message + [Retry] button. Never a blank screen. |

Additionally for the forecast:

| State | Visual treatment |
|---|---|
| **Stale data** | Yellow banner: "Data last updated 2 hours ago. Some signals may be outdated." + [Refresh] |
| **Low confidence** | Hatched/reduced opacity cells + "Low confidence — fewer than 2 signal sources contributing" note |
| **No forecast** | "Not enough data to forecast this skill yet. Contributing signals needed." |

---

## 5. Interaction Patterns

### Navigation flow

```
Dashboard (overview)
    │
    ├── Click heatmap cell or gap alert
    │   └── /forecast/[skill] (drill-down)
    │       └── Click signal evidence
    │           └── /signals/[id] or external link
    │
    ├── Click "View all" on signal feed
    │   └── /signals (explorer)
    │
    └── Click bench KPI card
        └── /bench (consultants + pipeline)
```

Every drill-down has a clear "back" path via the sidebar nav or breadcrumb. No dead ends.

### Heatmap cell interaction

```
                  Hover (desktop)
                       │
              ┌────────┴────────┐
              │   Tooltip        │
              │   AI Strategy    │
              │   Week 6         │
              │   Demand: 4      │
              │   Supply: 1      │
              │   Gap: +3        │
              │   Conf: 72%      │
              │   ──────────     │
              │   Click to       │
              │   drill down →   │
              └─────────────────┘
                       │
                  Click
                       │
              /forecast/ai-strategy
```

- Hover: rich tooltip with all key metrics
- Click: navigate to skill drill-down
- Keyboard: Tab between cells, Enter to show tooltip, Enter again to drill down

### Filter persistence

- Filters on `/forecast` page persist in URL query params (`/forecast?discipline=ai&region=brussels&weeks=8`)
- Shareable URLs: copy URL → send to colleague → they see the same filtered view
- Filters do NOT persist across pages (each page has its own filter context)

---

## 6. Colour System

Azimuth operates three colour families with three separate rulebooks. **Never mix them.**

- **Brand family (graphite + cocoa):** chrome only — logo, primary nav, primary button, focus rings, link hover. Never inside a data cell or chart mark.
- **Semantic family (red/amber/emerald + blue/violet/cyan/emerald):** data only — cells, legends, heatmaps, chart marks, status pills. Never as chrome. Never as body text.
- **Neutrals (warm stone 50–950):** everything else — surfaces, borders, body text, dividers, disabled states, low-emphasis UI.

The single ergonomic principle behind this split: over an 8-hour analyst session, chrome competes with chart marks for attention. Azimuth's brand recedes chromatically so the six signal colors stay visually supreme inside dense tables and heatmaps.

### 6.1 Brand palette (graphite + cocoa)

| Role | Token | Hex | Contrast on white | Usage |
|---|---|---|---|---|
| Primary | `--brand-700` | `#1A1D24` | 17.6:1 AAA | Logo, primary button fill, active nav item, focus ring |
| Accent | `--accent` | `#6B4E3D` | 7.2:1 AA body | Sparingly: link hover, accent underline, brand moments |
| Accent dark | `--accent-dark` | `#4D3829` | 9.8:1 AAA | Hovered accent on light surfaces |
| Accent light | `--accent-light` | `#C9A88F` | — | Illustrative details, decorative dividers only |

**Full brand scale (graphite):** 50 `#F4F3F1`, 100 `#E7E5E1`, 200 `#D1CEC8`, 300 `#A8A39A`, 400 `#78736A`, 500 `#3D3A33`, 600 `#27251F`, **700 `#1A1D24`** (primary), 800 `#14161C`, 900 `#0E0F14`, 950 `#08090D`.

### 6.2 Neutral scale (warm stone)

Warm-tinted rather than cool slate — signals European-editorial, not American-clinical.

| Token | Hex | Usage |
|---|---|---|
| `--neutral-50` | `#FAFAF9` | Page background (light theme) |
| `--neutral-100` | `#F4F3F1` | Subtle surface, hover background |
| `--neutral-200` | `#E7E5E1` | Borders, dividers, grid lines |
| `--neutral-300` | `#D1CEC8` | Disabled backgrounds |
| `--neutral-400` | `#A8A39A` | Disabled text, placeholder |
| `--neutral-500` | `#78736A` | Secondary / meta text (11–12px labels) |
| `--neutral-600` | `#575349` | Tertiary text |
| `--neutral-700` | `#3D3A33` | Body text primary |
| `--neutral-800` | `#27251F` | Strong body on light |
| `--neutral-900` | `#1A1814` | Card surface (dark theme) |
| `--neutral-950` | `#0E0D0A` | Canvas (dark theme) |

### 6.3 Semantic palette (LOCKED — do not modify)

These six colors do all the signaling work in charts, tables, heatmaps, and status pills.

| Token | Hex | Usage |
|---|---|---|
| `--signal-gap` | `#DC2626` (red-600) | Gap ≥ 3 — immediate action needed |
| `--signal-watch` | `#D97706` (amber-600) | Gap 1–2 — watch closely |
| `--signal-covered` | `#059669` (emerald-600) | Gap ≤ 0 — supply meets demand (also CRM pipeline source) |
| `--signal-procurement` | `#2563EB` (blue-600) | Procurement source |
| `--signal-trend` | `#7C3AED` (violet-600) | Trend source |
| `--signal-posting` | `#0891B2` (cyan-600) | Job posting source |

**Clash check:** the brand accent is a warm brown (hue ~25°, L\*≈38) — sufficiently different from amber-watch (hue ~35°, L\*≈55) to never collide on a dense grid. Graphite is achromatic, so it has zero hue collision with any signal color.

### 6.4 Surface & text tokens

| Token | Light theme | Dark theme |
|---|---|---|
| `--surface` | `#FFFFFF` | `#1A1814` (neutral-900) |
| `--surface-secondary` | `#FAFAF9` (neutral-50) | `#0E0D0A` (neutral-950) |
| `--text-primary` | `#3D3A33` (neutral-700) | `#E7E5E1` (neutral-200) |
| `--text-secondary` | `#78736A` (neutral-500) | `#A8A39A` (neutral-400) |
| `--border` | `#E7E5E1` (neutral-200) | `#27251F` (neutral-800) |
| `--focus-ring` | `#1A1D24` (brand-700) | `#FAFAF9` (neutral-50) |

**Dark mode:** canvas `#0E0D0A`, card `#1A1814`, body text neutral-200, subtle text neutral-400. Primary button stays `--brand-700` with white text in light theme; in dark theme, use `--neutral-100` ghost with `--brand-700` hover fill.

### 6.5 Tailwind config (ship-ready)

```ts
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#F4F3F1',100:'#E7E5E1',200:'#D1CEC8',300:'#A8A39A',
          400:'#78736A',500:'#3D3A33',600:'#27251F',
          700:'#1A1D24', // primary
          800:'#14161C',900:'#0E0F14',950:'#08090D',
        },
        accent: { DEFAULT:'#6B4E3D', dark:'#4D3829', light:'#C9A88F' },
        neutral: {
          50:'#FAFAF9',100:'#F4F3F1',200:'#E7E5E1',300:'#D1CEC8',
          400:'#A8A39A',500:'#78736A',600:'#575349',700:'#3D3A33',
          800:'#27251F',900:'#1A1814',950:'#0E0D0A',
        },
        signal: { // LOCKED — do not modify
          gap:'#DC2626', watch:'#D97706', covered:'#059669',
          procurement:'#2563EB', trend:'#7C3AED', posting:'#0891B2',
        },
      },
    },
  },
};
```

### 6.6 Accessibility notes

- All text colours meet WCAG AA (4.5:1) against their backgrounds; brand-700 on white is 17.6:1 AAA, neutral-700 on white is 11.8:1 AAA.
- Gap colours are always paired with a textual indicator (+3, +1, 0) — never colour-alone.
- Colourblind-safe: the six semantic colors are distinguished by hue, saturation, and brightness together, plus text labels. Verified in deuteranopia simulation.
- **Confidence is triple-coded** (ADA-critical): (a) opacity 40%/70%/100% for low/medium/high, (b) a small pill badge reading e.g. "62% conf.", (c) border style dashed/dotted/solid. Never encode confidence in colour alone.
- Heatmap cells use both colour fill and a hatched pattern overlay for low confidence — two independent visual channels.
- Focus rings are always visible — 2px `--focus-ring` with 2px offset.

---

## 7. Typography

Azimuth ships with **Geist Sans + Geist Mono**, self-hosted. Both fonts are free (SIL OFL), cover NL/FR/EN diacritics, and give the product its Vercel-adjacent analyst-precision feel. No system fonts — consistent screenshots across Mac and Windows matter when Sebastiaan shares deliverables with clients.

### 7.1 Font stack

```css
:root {
  --font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
}
html { font-family: var(--font-sans); }
table, .tabular, .kpi-number, .axis-label { font-variant-numeric: tabular-nums slashed-zero; }
code, pre, .mono, .kpi-number, .cell-number { font-family: var(--font-mono); }
```

Load via `next/font/local` or `next/font/google` (Geist is in the Google Fonts API). Subset to Latin-Extended; total weight target ≤ 220KB woff2, cached.

### 7.2 Type ladder

| Role | Family | Size | Weight | Tracking | Line height | Usage |
|---|---|---|---|---|---|---|
| Display | Geist Sans | 32px | 600 | -0.015em | 1.15 | Hero KPI headers (rare) |
| H1 / Page title | Geist Sans | 24px | 600 | -0.01em | 1.2 | Page headers |
| H2 / Section | Geist Sans | 18px | 600 | -0.005em | 1.3 | Card titles, section headers |
| Body | Geist Sans | 14px | 400 | 0 | 1.5 | All standard text, table cells |
| Body strong | Geist Sans | 14px | 500 | 0 | 1.5 | Emphasised body, row labels |
| Metadata | Geist Sans | 12px | 500 | +0.005em | 1.4 | Timestamps, labels, captions |
| Skill tag | Geist Sans | 12px | 500 | +0.01em | 1 | Pill-shaped skill labels |
| KPI number | **Geist Mono** | 32px | 500 | 0 | 1.1 | Big numbers on KPI cards |
| Cell number | **Geist Mono** | 13px | 400 | 0 | 1.3 | Table numerics, heatmap values |
| Axis label | **Geist Mono** | 11px | 400 | +0.01em | 1.3 | Chart axes, legend ticks |
| Code / ID | **Geist Mono** | 12px | 400 | 0 | 1.4 | CPV codes, deal IDs, tokens |

### 7.3 Mono usage rules

Geist Mono is the product's analyst-tone signal. Use it on:

- **All numerics in a grid or KPI context** — table cells with counts, KPI big-numbers, axis ticks, percentages in chart legends.
- **Identifiers** — CPV codes (`CPV 79411000`), deal IDs, signal IDs, dates in `YYYY-MM-DD` form.
- **Inline code / source snippets** — rare in this product, but use Mono when they appear.

Never use Mono for body prose, section headers, or button labels.

Apply `font-variant-numeric: tabular-nums slashed-zero` on any element containing numbers in an aligned column. This keeps digits vertically aligned in tables and heatmap rows — the #1 analyst-tool polish detail.

### 7.4 Licensing

Geist and Geist Mono are released by Vercel under the SIL Open Font License — free for commercial use, no procurement overhead. Self-host the woff2 files in `/public/fonts/` or load via `next/font` to preempt layout shift.

---

## 8. Logo & Wordmark Principles

Azimuth's logo expresses **navigation, foresight, and precision** — in that order. Briefing only (design lives in a separate file):

- **Wordmark-led** in Geist Sans 600, optionally paired with a geometric monogram mark. No mascots, no illustrative metaphors, no gradients.
- **Monogram direction:** an abstract bearing point or compass rose stroke, rendered in `--brand-700` graphite (not indigo or blue — that would collide with the procurement signal colour). Must read at 16×16 favicon and on a 400×400 avatar.
- **Lock-up:** wordmark + monogram left-aligned, 8px gap, baseline aligned to the x-height of the lowercase letters.
- **Contrast:** the monogram must read on both `#FFFFFF` and `#0E0D0A`.
- **Avoid:** ship wheels, crystal balls, eye-in-triangle, upward "growth" arrows, 3D bevels, anything that resembles a compass clip-art.

---

## 9. Iconography

Azimuth uses **lucide-react** exclusively. No custom icon sets.

- **Sizes:** 16px in dense rows and table cells, 20px in sidebar nav, 24px in empty states and hero moments. No other sizes.
- **Stroke:** 1.5px default, **1.75px at 16px** to compensate for small-size rendering. Never use lucide's "fill" variants — they break the product's visual rhythm.
- **Colour:** `--neutral-500` for passive states, `--neutral-700` on hover. Signal colours appear on icons only when the icon itself carries semantic state (e.g., `AlertTriangle` in `--signal-gap` on a critical row).
- **Locked signal-source mapping** — store in `lib/constants/signalIcons.ts` and never diverge:

| Signal source | Icon | Colour token |
|---|---|---|
| Procurement | `FileText` | `--signal-procurement` |
| Trend | `TrendingUp` | `--signal-trend` |
| Job posting | `Briefcase` | `--signal-posting` |
| CRM pipeline | `GitBranch` | `--signal-covered` (emerald) |

(Note: the emoji icons used in §3 mockups — 📋 📈 💼 — are placeholders. In production use the lucide mapping above.)

---

## 10. Data Visualization

The heart of the product. **Rule 0:** the six semantic colors are the data palette. Do not introduce chart palettes from recharts defaults, Tableau-10, or Observable-10. Every chart colour must carry the same meaning across every chart in Azimuth.

### 10.1 Colour assignment

| Encoding | Colours | Where it appears |
|---|---|---|
| Categorical by status | gap · watch · covered | Coverage bars, supply-vs-demand deltas, risk indicators, heatmap cells |
| Categorical by signal source | procurement · trend · posting · covered (pipeline) | Stacked bars in signal contribution breakdowns, signal-source filters |
| Sequential (demand intensity heatmap) | 9-step ramp: `neutral-100` → `amber-300` → `amber-600` → `red-700` | Forecast heatmap fill |
| Confidence | opacity 40% / 70% / 100% + dashed/dotted/solid border + pill badge | Every forecast output |

Generate sequential ramps with a deterministic function — not hand-picked intermediate values.

### 10.2 Chart hygiene

- **Grid lines:** `--neutral-200` at 1px. Never darker.
- **Axis labels:** `--neutral-500`, 11px, Geist Mono with tabular nums.
- **Axis ticks:** match the axis label colour at 50% length of the gridline.
- **Data labels on marks:** Geist Mono, 12px, `--neutral-700`, only when the value can't be read from the axis.
- **Legend:** always above the chart (not inside), Geist Sans 12px, with a 10×10 coloured square.
- **Tooltip:** dark (`--neutral-900` background, `--neutral-100` text), 12px, Mono for numerics, 180ms fade-in.
- **Empty state in chart:** the string *"Not enough signal yet"* in `--neutral-500`. Never a fabricated placeholder curve.
- **Sparklines on KPI cards:** 1.5px stroke, no fill, no axes, `--brand-500` colour.

---

## 11. Motion & Micro-Interactions

Analyst-respecting means **fast, subtle, and never decorative.**

| Interaction | Duration | Easing | Properties |
|---|---|---|---|
| Hover | 100ms | ease-out | Colour shift only — no scale, no shadow pop |
| Button press | 80ms | ease-out | Opacity 100 → 90 → 100 |
| Panel / modal enter | 180ms | ease-out | 4px Y-translate + opacity |
| Panel / modal exit | 120ms | ease-in | Reverse of enter |
| Data cell update | 600ms | ease-out | Fade from amber-300 tint back to default (signals "this value changed") |
| Route change | 0ms | — | Instant. Analysts context-switch often; transitions would enrage Sebastiaan. |
| Skeleton shimmer | 1.2s loop | ease-in-out | 0.6 → 1.0 → 0.6 opacity on `--neutral-100` |
| Tooltip | 180ms | ease-out | Opacity only |

**Never:** confetti, progress-bar bounces, loading Lotties, tooltip wobble, "celebrate" animations, page-transition slides.

**Reduced motion:** respect `prefers-reduced-motion: reduce` — disable all transforms and keep only opacity fades at half duration.

---

## 12. Writing Guidelines

**Use:** *forecast* (the product's core verb — over "predict" which reads slightly fortune-teller), *signal, gap, coverage, pipeline, skill-mix, demand, supply, bench, utilization, yield, watchlist, portfolio.*

**Avoid:** *predict* as a marketing verb (fine inside "prediction" as a noun for a specific output), *AI-powered, unlock, supercharge, revolutionary, game-changing, actionable insights, data-driven* (overused — assume the reader knows it is).

**Gap vs. shortfall:** use **gap** — shorter, reads on a dashboard label, the same word in Dutch and decoded by French speakers.

**Numbers:** always include the unit and the timeframe. *"+23 roles, 30-day rolling"* not *"+23 trending."* Always wrap numerics in Geist Mono with `tabular-nums`.

**Microcopy patterns:**
- Empty state: *"No signals match your filters. Try adjusting your date range."* + [Reset filters]
- Error: *"Couldn't refresh signals — check your connection."* + [Retry]
- Low confidence: *"Low confidence — fewer than 2 signal sources contributing."*
- Loading is mute — skeletons never show text.

**Multilingual notes** (EN is the default product UI; labels stay EN for the hackathon, these are for later localization):

- NL: *voorspelling* (forecast), *hiaat / tekort* (gap — **hiaat** is closer in register), *signaal, pijplijn.*
- FR: *prévision* (forecast), *écart* (gap — never *manque* which reads as deficiency), *signal, pipeline.*
- Get a bilingual reviewer per release — "gap" has three FR translations with different business connotations.

---

## 13. Responsive Behaviour

This is a desktop-first tool (Sebastiaan uses it on a laptop/monitor). Mobile is deprioritised but should degrade gracefully.

| Breakpoint | Layout |
|---|---|
| **≥ 1280px** (desktop) | Full layout as specified. Sidebar expanded. |
| **1024–1279px** (laptop) | Sidebar collapsed to icons. Content area fills width. |
| **768–1023px** (tablet) | Sidebar as overlay (hamburger toggle). Two-column grids → single column. |
| **< 768px** (mobile) | Not a target. If accessed: single-column stack, KPI cards → heatmap → alerts. Heatmap scrolls horizontally. |

---

## 14. Hackathon Implementation Priority

Not everything above needs to be built on day one. Prioritised by hackathon story:

| Priority | Component | Story |
|---|---|---|
| **P0 (must have)** | SidebarNav, PageHeader, ForecastHeatmap (compact + full), KPICard | Stories 1, 5 |
| **P0** | ConsultantRow, StatusBadge, DealRow | Story 2 |
| **P0** | SignalCard, SkillTag | Story 3 |
| **P1 (should have)** | DemandCurve, SignalWeightChart, ActionCard (drill-down page) | Story 5 |
| **P1** | GapAlert | Story 5 |
| **P1** | ConfidenceIndicator | Story 5 |
| **P2 (nice to have)** | FilterBar with persistence, DealTimeline (Gantt) | Story 6 |
| **P2** | Skeleton loading states, EmptyState | Story 6 |

**Hackathon shortcut:** For P0, use shadcn/ui components (Card, Table, Badge) with Tailwind. The heatmap is a custom component built with recharts or a simple CSS grid with coloured divs. Don't build a custom design system — use what exists.

---

## 15. Open UX Questions

1. **Heatmap: skills vs. disciplines as rows?** Current spec shows skills grouped under disciplines. Alternative: show only discipline-level rows, drill into skills on click. Depends on how many skills have data on day one.

2. **Recommended actions: generated or templated?** V1 could use simple templates ("Gap of +N [skill] predicted in weeks X–Y. Start recruiting now.") rather than AI-generated prose. Faster to build, easier to control.

3. **Weekly digest format:** The spec focuses on the dashboard. The weekly digest (email or notification) needs its own UX design — defer to V1 post-hackathon.

4. **Dark mode?** The colour tokens in §6.4 are invertible and a dark theme is a first-class target for V1 — analysts on long evening sessions default to dark. Not a hackathon day-one item, but don't write styles that assume light-only.

5. **Logo & monogram:** briefing is locked in §8, but the actual wordmark + monogram design needs a design pass before first external demo.

---

*Azimuth's UX specification follows Shneiderman's information-seeking mantra (overview first, zoom and filter, details on demand) and the data visualization best practices from the UX Designer skill reference. Visual system: graphite + cocoa brand, six locked semantic colors for data, warm stone neutrals, Geist Sans + Geist Mono typography. Designed for a single power user (Sebastiaan) accessing on desktop, with a clear path from glance → scan → drill.*
