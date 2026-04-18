# Per-source extraction heuristics

*Movify — April 2026*
*Companion memos: `signal-to-skill-mapping.md`, `taxonomy-reconciliation.md`*

---

## 0. Reading guide

Each section below follows the same shape:

- **What it is** — one paragraph on the source and why it matters.
- **Payload shape** — the realistic structure of what comes back, with representative field names. Where the research is under-validated, this is flagged.
- **Skill vocabulary** — the language we expect to see and should be able to recognise.
- **Extraction heuristic** — which tier (A/B/C/D from the strategy memo §3) applies, and the specific pipeline for this source.
- **Confidence and noise** — what the extraction confidence looks like, what the failure modes are.
- **Implementation notes** — blockers, dependencies, partnership requirements, legal posture.

Sources are ordered by build priority, not by information density. The last section consolidates the recommended build order.

The two already-coded connectors (TED procurement and Google Trends) are out of scope here by Sebastiaan's request — they get their own iteration later when the taxonomy backbone is in place.

---

## 1. Boond CRM — internal signals

**What it is.** Movify's own system of record: pipeline deals, deal profiles, historical projects, consultant bench, consultant skill assignments. The highest-confidence and most specific data source the system will ever have, provided we don't distort it in ingestion.

**Payload shape (assumed until access is confirmed).** Boond is a French PSA vendor; the data model is broadly: clients → opportunities → needs (profiles) → proposals → contracts → missions. For mapping purposes the useful objects are:

- **Deals / opportunities**: `id`, `title`, `client_id`, `status`, `probability`, `expected_start`, `expected_end`, free-text `description` (often the part with the real skill mentions), an array of requested profiles with `quantity` and `seniority`.
- **Consultants**: `id`, `name`, `seniority`, `current_mission_end`, `skills` (tagged against Boond's internal skill table), `cv_text` (free-text pasted from CVs).
- **Missions / historical projects**: `id`, `title`, `sector`, `started_at`, `ended_at`, assigned consultants, project-level skill tags.

The explicit structured tags are the gold layer. The free-text fields (`description`, `cv_text`, project notes) are Tier C text that contains far more skill mentions than the structured fields do, and this is where historical pattern learning becomes possible.

**Skill vocabulary.** Belgian-French dominant, with English for tech names, code-switched. Expect: *"3 consultants UX senior dont un avec expérience design system"*, *"profil full-stack React/Node ou équivalent"*, *"mission de transformation data platform, Snowflake + dbt + Airflow requis"*. Proper nouns stay English; roles and verbs are French.

**Extraction heuristic.**

- Structured tags (`deal_profiles.skill_id`, `consultant_skills`) are Tier A — direct taxonomy mapping. Today these land in `skill_id` with no occupation layer; the migration needs a `deal_profile_occupations` counterpart so deals that ask for "UX designer" go to an occupation row, not a skill row.
- Free-text fields (`description`, `cv_text`, mission notes) are Tier C — run through the full four-tier matcher, language-detected per paragraph. High yield expected because the text is terse, skill-dense, and written by people who use canonical names.
- Boond's own skill taxonomy is unlikely to match ours 1:1. Build `external_skill_mapping` rows with `source = 'boond'` during the first sync; unrecognised Boond skill IDs get logged into `skill_alias_candidates` for Sebastiaan to resolve.

**Confidence and noise.** Structured tags at 0.95 (trust the humans). Free-text extraction at the tier-ladder confidences (0.9 / 0.8 / 0.75 / 0.6). Convergence when structured tag + free-text mention agree → capped at 0.98. Noise profile is low: the data is internal and reviewed. The main failure mode is *outdated tags* — a consultant's skill tags in Boond may lag what they've actually been working on for the last 12 months. Mitigation: pull recent mission notes into the consultant skill inference, not just the consultant record.

**Implementation notes.** Currently blocked on `fetch_raw` and `_read_exports` being `NotImplementedError`. First job is to confirm API vs. export. Boond has a documented REST API with three-credential auth (`client_key`, `user_token`, `app_key`) already scaffolded in the connector. A bearer token path also exists as fallback. Whichever path unlocks, prioritise fetching deals + consultants + missions in that order — the first two power the dashboard today, missions power pattern learning later.

---

## 2. BOSA e-Procurement

**What it is.** The Belgian federal e-procurement portal (`enot.publicprocurement.be`). Mandatory for public contracts over €30k since 2017. Overlaps with TED for above-threshold contracts (>€215k for supplies/services) but uniquely captures the below-threshold range — €30k to €215k — which is where SME consulting contracts live. That's exactly Movify's bread and butter: small framework contracts, per-mission mandates, agile extension orders.

**Payload shape.** There is no public API. The portal serves HTML pages with structured data embedded in tables and PDFs attached as annexes. A scrape must handle:

- Notice pages with metadata: title, contracting authority, CPV codes, estimated value, submission deadline, publication date.
- Attached `bestek` documents (Dutch) or `cahier spécial des charges` (French), typically PDF, occasionally Word. Contain the operational requirements — technology stack, seniority levels, team composition, per-profile day rates.
- Award notices published after contract close, linking to the winning bidder (often useful for client-intelligence).

**Skill vocabulary.** More formal than private-sector job ads but also more specific. Federal tenders are prescriptive: *"2 ETP consultants développeurs Java senior, minimum 5 ans d'expérience Spring Boot, certification AWS Solutions Architect Associate"*. Public-sector NL tenders from Flemish agencies are similarly detailed. The annex documents are where the value lives — the notice abstract is usually too thin to matter.

**Extraction heuristic.**

- Notice-level metadata is Tier B: CPV code → occupation via `cpv_occupation_mapping`, value and deadline are structured data.
- Annex documents are Tier C: PDF-to-text extraction (`pypdf` or `pdfplumber`), paragraph-level language detection, then the full tiered matcher. Bestek documents are long — 20 to 80 pages. Chunk by section heading; skill density is highest in the "exigences techniques" / "technische vereisten" and "profils demandés" sections, which are always named similarly.
- Contracting authority is itself a signal. A bestek from Smals (federal social security IT), CIRB (Brussels ICT consultancy), or the National Bank is a more reliable demand indicator than one from a municipal IT service. Encode this in a `contracting_authority_priors` table.

**Confidence and noise.** Occupation confidence from CPV codes at 0.8 (CPV codes are reliable but broad). Skill confidence from bestek text at the tier-ladder values. Authority-weighted source prior (Smals → 0.9, municipal → 0.5). Noise profile is moderate: a bestek may list desirable skills or certifications that are nice-to-have rather than hard requirements. Some heuristic detection of "required" vs. "preferred" sections is worthwhile (simple regex on "obligatoire" / "souhaité" / "verplicht" / "gewenst" tokens).

**Implementation notes.** Scraping is legally fine (public procurement data is open-licensed for commercial reuse — flagged in the research docs). Rate-limit politely; the portal is not heavily engineered. Commercial alternatives (TenderWolf, Govex) offer the same data at €79–149/month with better UX — potentially worth it for speed once the system is proving value. For V1 a crawler is sufficient. Plan for PDF parsing to be the bottleneck; scanned PDFs will need OCR (Tesseract) with Dutch + French language packs.

---

## 3. ATS endpoints — Greenhouse, Lever, Ashby, Workable

**What it is.** Public-read JSON endpoints published by ATS vendors on behalf of client companies. Greenhouse's `boards-api.greenhouse.io/v1/boards/{company}/jobs` is the most generous: no auth, no rate limit in practice, full job descriptions. Lever, Ashby, and Workable have equivalents with slightly different shapes. The research identified 100–200 Belgian scale-ups publishing machine-readable jobs this way — Collibra, Showpad, Odoo, Teamleader, Silverfin, Deliverect, etc. — covering exactly the segment that bypasses VDAB.

**Payload shape (Greenhouse example).**

```json
{
  "jobs": [
    {
      "id": 4123445,
      "title": "Senior Frontend Engineer (React)",
      "location": {"name": "Brussels, Belgium"},
      "departments": [{"name": "Engineering"}],
      "offices": [{"name": "Brussels"}],
      "updated_at": "2026-04-10T09:31:00Z",
      "absolute_url": "https://...",
      "content": "<html>... full job description with HTML ..."
    }
  ]
}
```

Lever and Ashby return similar shapes; the `content` field is always the free-text hero. All four formats need a company-specific URL seed list, which we have to build.

**Skill vocabulary.** English-dominant (scale-ups skew Anglo), but with Belgian location signals. Titles are clean (*Senior Backend Engineer (Go)*, *Product Designer — Design System*, *Data Platform Engineer (dbt, Snowflake)*). Descriptions have the familiar structure: company blurb, role responsibilities, requirements, nice-to-haves, benefits. The "requirements" and "nice-to-haves" sections are where extraction should focus.

**Extraction heuristic.**

- Title is Tier B: a lightweight parser mapping common title patterns to an occupation (*"{Senior\|Lead\|Staff} {Frontend\|Backend\|Full-stack} {Engineer\|Developer}"*). A small classifier can be replaced with a regex library for the hackathon; upgrade to an LLM title parser once `skill_alias_candidates` starts surfacing unrecognised patterns.
- Location filter: keep only jobs with a Belgian location (Brussels, Antwerp, Ghent, Liège, Leuven, Namur, "Belgium", remote-EMEA when company HQ is Belgian). `offices` + `location` cross-check.
- Description body is Tier C: HTML strip, section-detect, skill matcher. Requirements sections often contain structured bullet lists, which should be prioritised — a skill in a bullet list is higher-confidence than the same skill in narrative prose.
- Department / team metadata is a weak signal but useful for noise reduction: a "Sales" department job containing the word "Python" is almost certainly not a Python developer role.

**Confidence and noise.** High: these are real demand with named employers. Extraction confidence tracks the tier ladder. The failure mode is *posting lag* — some ATS boards leave closed roles up for weeks. Mitigation: the extractor carries a `valid_until` that defaults to 60 days post-`updated_at`; forecast engine recency decay handles the rest.

**Implementation notes.** Legally unambiguous. Technically trivial. The real work is building the company seed list. Good sources for that list: imec scale-up portfolio, Agoria Digital Wallonia database, Scale-Ups.eu Belgium filter, and the Ravio customer list (public). Aim for 150 seed companies at launch, with a simple CLI to add/remove. Write a small `company_ats_endpoints` table to track which vendor each company uses and when the endpoint was last validated.

---

## 4. VDAB Vacature API + Competentiezoeker

**What it is.** VDAB's OAuth-secured vacancy API plus its NLP service that extracts ESCO competences from any text. Free after partnership approval. The API provides Flemish vacancies (~60–70% of Belgian digital hiring by volume, but skewed towards traditional employers and IT services shops). Competentiezoeker is the interesting bit — it's a multilingual (NL/FR/EN) skill extractor the PES itself uses.

**Payload shape.** The `changes-since` endpoint returns JSON arrays of vacancies with `id`, `title`, `description_html`, `employer`, `location`, `language`, `competences[]` (ESCO URIs where VDAB has auto-tagged the vacancy), `publication_date`, `expiry_date`. Competencies are present on 40–60% of vacancies per VDAB's documentation — the NLP runs at ingestion, but coverage is not universal.

**Skill vocabulary.** Multilingual with NL as primary, then FR, then EN. Proper nouns in English. Expect morphologically rich NL: *"React-ontwikkelaar met ervaring in moderne JavaScript-frameworks"*. Competencies-as-URIs when present means we skip extraction entirely for those rows.

**Extraction heuristic.**

- Tier A when `competences[]` is populated: map each ESCO URI to our skill via `skills.esco_uri`. Write `signal_skills` rows at confidence 0.9.
- Tier B from title + Competent 2.0 occupation code (present on the vacancy): deterministic occupation assignment.
- Tier C on `description_html` for vacancies where VDAB didn't auto-tag and for skills VDAB's NLP missed. This is where Competentiezoeker itself becomes useful — a second pass on NL-dominant text produces additional ESCO URIs. Treat it as a Tier 3 external matcher per the strategy memo.
- Cross-check: when Tier A and Tier C disagree (e.g., VDAB says "Kubernetes" but the text also mentions "OpenShift"), we union; we don't override.

**Confidence and noise.** Structured competencies at 0.9. Competent 2.0 occupation codes at 0.85. Free-text at the tier ladder. Noise is low — VDAB's own text is clean. The selection bias is the known issue: VDAB under-represents senior roles, consulting work, and design/product/AI-strategy disciplines. Do not treat VDAB as a complete market picture; treat it as a calibration anchor for engineering + data roles.

**Implementation notes.** Partnership approval is the blocker. Application is via Synerjob; turnaround in the research docs is "weeks" without specifics. Not a hackathon source. Le Forem (§5 below) is the open equivalent and should run first.

---

## 5. Le Forem Opendatasoft

**What it is.** Le Forem's fully open vacancy feed at `leforem-digitalwallonia.opendatasoft.com`. No auth, no rate limit, real-time JSON. Covers Wallonia. Uses ROME occupation codes.

**Payload shape.** Opendatasoft serves a REST endpoint with query parameters for filtering. Vacancy records include `reference`, `intitule` (title), `rome_code`, `description`, `entreprise`, `localisation`, `publication_date`, `type_contrat`, `langue`. Skills are not pre-tagged — everything is in `description`.

**Skill vocabulary.** French-dominant with English proper nouns. Descriptions are terser than VDAB's, often bullet lists. Walloon vacancies skew towards services companies, public-sector IT, and traditional industries — design and product coverage is even thinner than VDAB's.

**Extraction heuristic.**

- Tier B on `rome_code` → occupation via `rome_occupation_mapping`. ROME is coarser than Competent 2.0 (many digital roles collapse into M180202 "Ingénieur informatique"), so the occupation extraction here is lower-confidence than VDAB's at 0.6.
- Tier C on `description` — full text matcher, French as detected primary language.
- Because ROME is so coarse, the `description`-level skill extraction does more work here than for VDAB. A Le Forem posting tagged M180202 could be Java, Python, cloud, or DevOps — the skill match is what disambiguates.

**Confidence and noise.** Occupation at 0.6 (ROME coarseness). Skill at the tier ladder. Noise profile: the feed includes interim / temporary / internship postings that skew the volume; filter by `type_contrat` to exclude stages unless explicitly wanted. Regional skew: Liège, Namur, Charleroi dominate; Luxembourg province and rural postings are a minority.

**Implementation notes.** Zero blockers. This should be the second public-employment connector after TED (which is already coded). Estimated build time: 2 hours for the connector + 1 hour for ROME crosswalk seed. Good candidate for the next sprint.

---

## 6. Actiris (Brussels)

**What it is.** The Brussels public employment service. Structurally the weakest of the three PES: no public vacancy API, limited SFTP extract of selected vacancies, monthly PDF reports from View.brussels. The research flagged Brussels as structurally under-sampled unless scraped from `panorama.actiris.brussels`.

**Payload shape.** Not a real-time data feed at all. The usable artefacts are:

- View.brussels monthly PDF reports with aggregate occupation counts.
- The panorama.actiris.brussels scrape, which exposes a search interface over selected postings. Scraping produces title, employer, sector, publication date, free-text description.
- Eventually, when VDAB / Forem / Actiris complete Synerjob integration, Brussels vacancies will flow through VDAB's API. Timing is unclear.

**Skill vocabulary.** Bilingual NL/FR with heavy EN for international employers. Brussels job mix skews international — EU institutions, multinationals, federal agencies, NATO. A separate noise profile to Flanders and Wallonia.

**Extraction heuristic.** Not worth building a dedicated Tier C matcher for View.brussels PDFs — they're aggregates, not per-vacancy. The value is macro calibration (how many "Analystes développeurs" are listed in Brussels this quarter vs. last quarter), which feeds the historical pattern layer in the forecast engine rather than the skill-level signal layer.

A lightweight panorama scraper is possible for titles + employer + CPV-equivalent tagging, but volume is low and the posting quality mixed. Deprioritise unless Brussels-specific reporting becomes a requirement.

**Confidence and noise.** Low reliability overall. Noise includes heavy temporary-work and internship posting volume.

**Implementation notes.** Accept the blind spot for V1. Document it in the value-prop doc. Revisit when VDAB integration stabilises or when we have a partnership with View.brussels / BISA.

---

## 7. ICTJob.be

**What it is.** Belgium's pure-play IT board. ~900 active IT jobs, 130K CV database, and — most importantly — a proprietary taxonomy of 250+ technical criteria pre-tagged on every listing. Each posting carries structured skill tags that read like our target granularity (framework level, tool level, method level). The research doc called this "the single highest-leverage data partnership conversation" for Belgium-specific coverage.

**Payload shape.** No public API. Partnership would (in best case) expose a daily XML/JSON export with: `job_id`, `title`, `employer`, `location`, `description`, `criteria[]` (the 250-taxonomy tags), `seniority`, `publication_date`, `application_url`. The `criteria[]` field is the reason to bother.

**Skill vocabulary.** The taxonomy is authored by ICTJob editors, and it's coherent. Examples of the 250 tags: *React*, *Angular*, *Vue.js*, *.NET Core*, *Spring Boot*, *Azure DevOps*, *SAP ABAP*, *IBM DataPower*, *Sitecore*, *AEM*. Granularity is comparable to Lightcast but Belgian-market-specific (includes European enterprise tools that Lightcast under-covers).

**Extraction heuristic.** Tier A. The entire value proposition of ICTJob is that extraction is already done. All that's needed:

1. One-time crosswalk authoring: map all 250+ criteria to our `skills` and, where applicable, our `occupations`. Some ICTJob tags are occupation-level (*"Scrum Master"*); most are skill-level.
2. Runtime ingestion: for each new job, create a `signals` row plus `signal_skills` / `signal_occupations` rows from the crosswalk. No text parsing needed.
3. A Tier C pass on the free-text description remains useful as a backup — catches anything the ICTJob tagger missed. Configure this to write skill rows at lower confidence (0.7) so as not to over-count against the primary Tier A extraction.

**Confidence and noise.** ICTJob tags at 0.95 — their editors curate, and false positives are rare. Noise profile: the platform skews enterprise IT services and large employers; start-ups and scale-ups prefer ATS boards (§3). Treat ICTJob and ATS feeds as complementary, not redundant.

**Implementation notes.** Partnership is the blocker. The research doc puts the license at €10–30K/yr. Not a hackathon source. Worth a conversation with ICTJob's commercial team in parallel with the V1 build — lead times for signing a partnership likely exceed the build time.

---

## 8. Industry news

**What it is.** A catch-all for textual signals of client intent: CTO appointments, M&A announcements, AI strategy press releases, investment rounds, regulatory filings. The research artifacts explicitly flagged "KBC pushing AI → anticipate AI engineer demand" as a canonical pattern.

**Payload shape.** There is no single feed. The realistic sources are:

- **De Tijd / L'Echo** (Belgian business press) — RSS feeds are available, full-text often behind paywall. Scrape titles and abstracts only.
- **Data News / De Standaard Business** — RSS.
- **Press release aggregators** (Belga Press, FlandersNews.be).
- **Company press rooms** of target Belgian clients — iterate through a seed list of 50–100 enterprise clients (KBC, Proximus, UCB, Solvay, bpost, AG Insurance, etc.) and monitor their news pages. Low yield per site, high signal density when there is a hit.
- **LinkedIn posts from target-client executives** — not systematically accessible; skip.
- **Belgian regulatory bulletins** — Moniteur Belge / Belgisch Staatsblad for legal and regulatory shifts.

**Skill vocabulary.** Unstructured prose, NL/FR/EN mix, heavy corporate-speak. The signal is *implicit*: "KBC announces €200M AI investment" doesn't mention any skill but strongly implies demand for AI engineers, MLOps, data platform engineers for KBC-aligned consultancies. This is fundamentally different from procurement or job-board signals.

**Extraction heuristic.** This is where naive Tier C matching will fail most often. Two-pass approach:

- Pass 1 — **entity and event extraction**: named-entity recognition over titles and leads. Identify (a) company name, (b) event type (investment, hire, launch, layoff, restructuring, partnership), (c) explicit technology mentions if any. Use an LLM with a strict JSON schema output; the volume is small enough to pay for.
- Pass 2 — **signal-to-skill inference via company and event type**: lookup tables map (company, event_type) → likely skill demand. A `client_industry_priors` table encodes that KBC-announces-AI-investment implies high demand for AI engineers + MLOps + data platform + security consulting. This is not extraction — this is *authored inference*, curated by Sebastiaan and practice leads.

**Confidence and noise.** Low extraction confidence (0.5–0.65) because the inference chain is long. The value is not single-signal precision; it is *convergence with procurement and ATS signals* — when a news hit, a procurement notice, and an ATS posting from the same client all point at the same skill within a few weeks, that triangulation is what the forecast engine should weight heavily.

**Implementation notes.** Build only the RSS aggregation + LLM entity pass for V1. The `client_industry_priors` table is where the real value accrues; treat it as a curated asset with an explicit review cadence. Do not scrape paywalled content — title and abstract are sufficient for the signal.

---

## 9. Tech community: Devoxx, FOSDEM, Meetup

**What it is.** Conference session rosters and meetup topics as 6–9 month leading indicators of technology mindshare. The signal is that technologies gain talk counts and RSVPs before they gain job postings.

**Payload shape.** Varies wildly by source:

- **Devoxx Belgium** — session list published annually on devoxx.be. HTML scrape; no API. Has title, speaker, abstract, track, company (speaker affiliation).
- **FOSDEM** — published via Pentabarf XML, machine-readable, fully public. Includes titles, abstracts, tracks, and speaker metadata.
- **Meetup** — GraphQL API, requires Meetup Pro (~$200/month). Exposes event topics, sponsor companies, RSVP counts. Target groups in Belgium: ProductTank Belgium, Brussels Data Science Community, Generative AI Belgium, Data Mesh Belgium, BeJUG, Drupal Belgium.
- **hackeragenda.be** — aggregator of Belgian tech events, scrapeable.

**Skill vocabulary.** Dense and framework-specific by construction. Devoxx and FOSDEM talk titles explicitly name frameworks, tools, and patterns (*"Building LLM agents with LangGraph"*, *"Zero-trust networking on Kubernetes"*). The signal is cleaner than news but sparser than ATS.

**Extraction heuristic.** Tier D for RSVP counts and talk counts as quantitative signals. Tier C for titles and abstracts as skill-mention text.

- For a given skill, count appearances in titles + abstracts per quarter. A quarter-on-quarter rise of >50% is a notable trend signal.
- Sponsor companies are a weak Tier A signal: if KBC sponsors ProductTank Brussels, they have product-discipline intent. Encode in `company_event_sponsorships`.
- Speaker company affiliation maps skills to employers: *"Mathieu from Collibra speaks on data governance at Devoxx"* is an implicit data-governance investment at Collibra.

**Confidence and noise.** Low per-event, moderate in aggregate. A single talk signal is 0.4; a pattern of repeated talks + RSVP growth + sponsor presence across multiple events is where this becomes meaningfully predictive (0.75 at convergence).

**Implementation notes.** FOSDEM and hackeragenda are free and easy. Devoxx requires a scraper. Meetup is the interesting question: $200/month for Meetup Pro is cheap if the signal works, but Meetup volume in Belgium is moderate and the RSVP data is noisy. Build FOSDEM + hackeragenda first; evaluate Meetup Pro after V1 based on signal lift.

---

## 10. GitHub Archive + Stack Overflow

**What it is.** The two raw-developer-behaviour datasets. GitHub Archive on BigQuery offers commits, stars, and repo creation. Stack Overflow's tag velocity (questions per tag per week) is a leading indicator for tool adoption.

**Payload shape.** Public BigQuery datasets: `githubarchive.day.*` and `bigquery-public-data.stackoverflow.*`. Both queryable but not trivially — a well-composed query over GitHub Archive returns gigabytes unless filtered.

**Skill vocabulary.** Tags and repo topics are the vocabulary. Stack Overflow tags are clean; GitHub topics are noisy (anyone can tag a repo with anything).

**Extraction heuristic.** Tier D, same as Google Trends.

- A curated term → skill map (reusing `signal_term_mappings` from the strategy memo §7.4).
- For each term, a weekly count from both sources.
- Significance testing: flag a weekly count >2 standard deviations above the 12-week rolling mean.

The Belgian-specific filter is the catch: GitHub Archive captures a user's free-text `location` field, which is 20–30% filled and noisy. Filter on variants of *Belgium, België, Belgique, Brussels, Bruxelles, Gent, Antwerp, Leuven, Liège*. Accept that Belgian coverage is partial; supplement with overall EU trend as a proxy when Belgian volume is too low for significance testing.

**Confidence and noise.** Low per-signal (Tier D aggregates). The value is as a 3–9 month leading indicator for emerging tools. LangChain's adoption curve on Stack Overflow led its appearance in Belgian ATS postings by about 6 months; dbt was similar 18 months earlier. This is where the forecaster earns its "we saw this coming" narrative.

**Implementation notes.** BigQuery has a generous free tier for the data volumes in question. No partnership needed. Build a small Python worker that runs a parameterised query per tracked term weekly and writes counts to `signal_term_observations` (new table, or just `signals` rows with `signal_type = 'tag_velocity'`).

---

## 11. MEOS, Agoria, Statbel — macro calibration layer

**What it is.** Three sources of macro-level employment statistics that calibrate the forecast but don't drive individual skill predictions.

- **ManpowerGroup Employment Outlook Survey (MEOS)** — quarterly, Belgian-specific, 3-month forward-looking hiring intentions, regional breakdowns. Free PDF.
- **Agoria** — quarterly digital-skills reports, vacancy rates per ICT segment (4.92% in Q1 2025 per the research docs).
- **Statbel Quarterly Job Vacancy Survey** — ground-truth overall vacancy rate by NACE sector.

**Payload shape.** All three are published reports. No API. Extract structured tables from PDFs using `pdfplumber` or `tabula-py`. Values are percentages, counts, and trend indicators.

**Skill vocabulary.** Occupation-level or sector-level, not skill-level. MEOS says "IT Net Employment Outlook +49%"; Agoria says "Cybersecurity vacancy rate 12.4%"; Statbel says "Information and communication sector vacancy rate 4.5%."

**Extraction heuristic.** These don't fit the Tier A/B/C/D pattern. They are *calibration inputs*, read by the forecast engine to normalise raw signal counts against sector baseline demand. Structure as:

- `macro_indicators` table: `source`, `indicator_type`, `region`, `sector_or_occupation`, `value`, `period_start`, `period_end`.
- Ingestion is quarterly, manual or semi-manual (PDF parsing + review). Low volume, high importance.
- The forecast engine references `macro_indicators` when computing the *expected baseline* for each skill's demand. A forecast that exceeds the baseline by 2σ is a high-confidence alert; a forecast consistent with the baseline is a weak signal.

**Confidence and noise.** Not applicable in the `signal_skills` sense. These are *priors*.

**Implementation notes.** Low effort, high value. The PDFs parse cleanly because the report authors use consistent tabular formats. A single worker can handle all three sources on a quarterly schedule.

---

## 12. Build order

The strategy memo §9 put taxonomy and matcher upgrades first. Assuming that foundation is in place, here is the order for adding new connectors.

| # | Source | Effort | Signal quality | Prerequisites |
|---|---|---|---|---|
| 1 | **Boond CRM** | High (Boond API) | Highest — internal ground truth | Boond API or export access |
| 2 | **Le Forem Opendatasoft** | Low (open API) | Moderate (Walloon coverage) | ROME crosswalk seed |
| 3 | **ATS endpoints** (Greenhouse first, then Lever/Ashby/Workable) | Medium | High (scale-up coverage) | Company seed list |
| 4 | **BOSA e-Procurement** | Medium-high (scrape + PDF) | High (Belgian below-threshold tenders) | CPV crosswalk, PDF parser |
| 5 | **MEOS / Agoria / Statbel** | Low (quarterly PDF parse) | Calibration layer, not forecasting | `macro_indicators` table |
| 6 | **FOSDEM + hackeragenda** | Low | Low but cheap | `signal_term_mappings` seed |
| 7 | **Industry news (RSS)** | Medium (LLM extraction) | Moderate at convergence | `client_industry_priors` |
| 8 | **VDAB Vacature API** | Partnership-blocked | Moderate-high | Synerjob approval |
| 9 | **ICTJob.be** | Partnership-blocked | Very high (Tier A) | Commercial agreement |
| 10 | **GitHub Archive + Stack Overflow** | Medium (BigQuery) | Long-horizon leading indicator | `signal_term_mappings` |
| 11 | **Devoxx scrape + Meetup** | Medium | Low per-event; useful at aggregate | Meetup Pro subscription to unlock Meetup |
| 12 | **Actiris / View.brussels** | Deprioritised | Low | Accept Brussels blind spot |

The first four sources in this list, plus the taxonomy foundation from the strategy memo, bring the system to a point where "triangulate procurement + ATS + CRM + public employment" is real, not aspirational. Everything below #4 compounds value but isn't what proves the product.

---

*Each section here is deliberately shorter than it could be — these are heuristics memos, not implementation specs. Promote to detailed implementation docs as each source enters its build sprint.*
