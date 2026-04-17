# UX Specification — Skills Demand Forecaster

*Movify — April 2026*
*Design principles: Overview first → zoom and filter → details on demand (Shneiderman's mantra)*

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
Skills Demand Forecaster
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
│ ☰  Skills Demand Forecaster              Last updated: 5 min ago 🔄│
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

### Semantic palette

| Token | Hex | Usage |
|---|---|---|
| `--gap-critical` | `#DC2626` (red-600) | Gap ≥ 3 — immediate action needed |
| `--gap-warning` | `#D97706` (amber-600) | Gap 1–2 — watch closely |
| `--gap-covered` | `#059669` (emerald-600) | Gap ≤ 0 — supply meets demand |
| `--confidence-low` | `#9CA3AF` (grey-400) | Low confidence overlay |
| `--signal-procurement` | `#2563EB` (blue-600) | Procurement source |
| `--signal-trend` | `#7C3AED` (violet-600) | Trend source |
| `--signal-posting` | `#0891B2` (cyan-600) | Job posting source |
| `--signal-pipeline` | `#059669` (emerald-600) | CRM pipeline source |
| `--surface` | `#FFFFFF` | Card/panel background |
| `--surface-secondary` | `#F9FAFB` (grey-50) | Page background |
| `--text-primary` | `#111827` (grey-900) | Primary text |
| `--text-secondary` | `#6B7280` (grey-500) | Secondary/meta text |

### Accessibility notes

- All text colours meet WCAG AA contrast (4.5:1) against their backgrounds
- Gap colours (red/amber/green) are always accompanied by textual indicators (+3, +1, 0) — never colour-alone
- Colourblind-safe: red/green are distinguished by saturation and brightness, plus text labels. The colour system works in deuteranopia simulation.
- Heatmap cells use both colour fill and a hatched pattern overlay for low confidence — two independent visual channels

---

## 7. Typography

| Element | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| KPI number | 32px | 700 (bold) | 1.2 | Big numbers on KPI cards |
| Page title | 24px | 600 (semibold) | 1.3 | Page headers |
| Section header | 18px | 600 (semibold) | 1.3 | Card/section titles |
| Body text | 14px | 400 (regular) | 1.5 | All standard text, table cells |
| Meta text | 12px | 400 (regular) | 1.4 | Timestamps, labels, secondary info |
| Skill tag | 12px | 500 (medium) | 1 | Pill-shaped skill labels |

Font: system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`). No custom fonts — maximise load performance.

---

## 8. Responsive Behaviour

This is a desktop-first tool (Sebastiaan uses it on a laptop/monitor). Mobile is deprioritised but should degrade gracefully.

| Breakpoint | Layout |
|---|---|
| **≥ 1280px** (desktop) | Full layout as specified. Sidebar expanded. |
| **1024–1279px** (laptop) | Sidebar collapsed to icons. Content area fills width. |
| **768–1023px** (tablet) | Sidebar as overlay (hamburger toggle). Two-column grids → single column. |
| **< 768px** (mobile) | Not a target. If accessed: single-column stack, KPI cards → heatmap → alerts. Heatmap scrolls horizontally. |

---

## 9. Hackathon Implementation Priority

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

## 10. Open UX Questions

1. **Heatmap: skills vs. disciplines as rows?** Current spec shows skills grouped under disciplines. Alternative: show only discipline-level rows, drill into skills on click. Depends on how many skills have data on day one.

2. **Recommended actions: generated or templated?** V1 could use simple templates ("Gap of +N [skill] predicted in weeks X–Y. Start recruiting now.") rather than AI-generated prose. Faster to build, easier to control.

3. **Weekly digest format:** The spec focuses on the dashboard. The weekly digest (email or notification) needs its own UX design — defer to V1 post-hackathon.

4. **Dark mode?** Not for hackathon. Consider for V1 if Sebastiaan uses it in the evening. The colour system is designed to be invertible.

---

*UX specification follows Shneiderman's information-seeking mantra (overview first, zoom and filter, details on demand) and the data visualization best practices from the UX Designer skill reference. Designed for a single power user (Sebastiaan) accessing on desktop, with a clear path from glance → scan → drill.*
