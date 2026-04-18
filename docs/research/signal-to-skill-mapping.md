# Signal-to-skill mapping — strategy memo

*Movify — April 2026*
*Companion memos: `taxonomy-reconciliation.md`, `per-source-heuristics.md`*

---

## 1. Purpose

Every forecast in this system is, at root, a claim of the form "signal X implies demand for skill Y at time T." That claim only holds if we can reliably get from raw signal text (a TED notice, an ATS posting, a news article, a deal description in Boond) to rows in `signal_skills` with defensible confidence scores. Today the system does one thing — case-insensitive exact match of skill aliases against lowercased text — and that works only for a narrow class of signals. This memo specifies the wider pipeline that the next build phase needs.

The memo deliberately does not prescribe the NLP stack. It specifies the **contract** every extractor must satisfy, the **taxonomy shape** every extractor writes into, and the **confidence semantics** the forecast engine can rely on. Implementation choices (spaCy vs. JobBERT vs. GPT vs. Claude) are downstream decisions; this memo says what those components are being asked to do.

---

## 2. The core modelling decision: two layers, explicit join

The existing schema has one entity (`skills`) carrying both "React" and "UX designer." That conflation is going to hurt us the moment procurement notices arrive, because a Belgian public tender does not say "React" — it says *"développeur front-end avec 3 ans d'expérience en frameworks JavaScript modernes."* The notice implies an occupation and a loose basket of skills; the Boond deal, in contrast, will say something closer to "2 React devs and 1 Next.js specialist." If everything lands in one flat `skills` table, we end up forcing occupation-level signals into skill-level rows and inventing false precision.

The fix is two layers, joined explicitly:

- **Occupation layer** — what kind of consultant the market is asking for. Granularity matches how public tenders, job boards, and salary surveys phrase demand. Examples: *UX designer, UX researcher, service designer, AI engineer, product manager, full-stack developer, platform engineer, data engineer, cloud architect*. The ESCO v1.2.1 `Occupation` concept maps 1:1 here, though several Movify roles (service designer, AI strategist) have no native ESCO code and need Movify-owned IDs.
- **Skill layer** — the frameworks, languages, tools, methods, and certifications a consultant wields. Granularity matches how staffing decisions actually happen inside Movify. Examples: *React, Next.js, dbt, Kubernetes, Figma, LangChain, service blueprinting, WCAG 2.2, PMI PMP*. The Lightcast Open Skills taxonomy covers most of this cleanly; ESCO's `Knowledge` concept is the formal parent.
- **Join: `occupation_skills`** — a many-to-many table that encodes "a service designer typically wields Figma, service blueprinting, journey mapping, stakeholder interviews." Each row carries a `typicality` score (how canonical the skill is for that occupation) and an optional `seniority_from` (some skills only start appearing at senior levels). The join lets us translate occupation-level signals (from TED, from view.brussels, from ATS job titles) into skill-level forecasts without losing information.

This does mean a schema migration. Proposed shape in §7.

**What this looks like in practice.** A TED notice tagged with CPV `72224000` (project management consultancy) and containing the phrase *"équipe de 3 consultants produit orientés IA générative"* resolves to:
- `occupations`: product manager (count 3, confidence 0.8)
- `skills`: generative AI (count inferred via `occupation_skills` expansion, confidence 0.6 — lower because it's an occupation→skills inference, not a direct mention)
- `skills` (direct mention): generative AI again, boosted to confidence 0.85 because the phrase names it explicitly

The forecast engine then sees converging evidence at both layers and can surface either view to Sebastiaan — the heatmap stays at skill level for his mental model, but the drill-down explains "this spike came from 4 procurement notices requesting *product managers with AI experience*, not from 4 notices requesting React."

---

## 3. Signal density tiers

Not every signal carries the same information. Rather than apply the same extractor to everything, we classify each source into one of four tiers and pick the matching heuristic. This is the single biggest lever for avoiding false precision.

### Tier A — Structured, already tagged

The signal arrives with explicit skill or occupation tags in a known taxonomy. Examples:
- **ICTJob.be** — every posting carries up to 250+ pre-tagged technical criteria in their proprietary taxonomy.
- **Boond deal profiles** — the `deal_profiles.skill_id` column is populated by humans against our own taxonomy.
- **Consultant profiles in Boond** — `consultant_skills` rows come from Movify's own tagging.
- **ATS endpoints exposing skill taxonomies** — Greenhouse supports custom fields; some employers tag roles.

**Extraction heuristic**: direct taxonomy mapping. If the source taxonomy is foreign (ICTJob's), maintain a crosswalk table (`external_taxonomy_mapping`) that translates source IDs to our `(occupation_id, skill_id[])`. Confidence starts at 0.95 and only degrades if the crosswalk itself is fuzzy.

No NLP involved. The engineering work is taxonomy reconciliation, not text processing.

### Tier B — Semi-structured, occupation-coded

The signal has a structured field (job title, role name, CPV code) that is highly predictive of occupation but says nothing about specific skills. Examples:
- **ATS postings without skill tags** — the job title is reliable, but the skill list sits in free-text job descriptions.
- **TED procurement CPV codes** — `79411000` reliably implies "management consultancy" as the occupation. It does not tell you whether the engagement wants AI, cloud, or data skills.
- **VDAB Competent 2.0 occupation codes** — first-class citizens in the VDAB Vacature API response. Cleanly map to ESCO.
- **Le Forem ROME codes** — same pattern, different taxonomy.
- **LinkedIn job titles in any scraped feed** — title is reliable-ish at the occupation level.

**Extraction heuristic**: a two-step pipeline.
1. Map the structured field to our `occupations` table via a deterministic lookup (`cpv_to_occupation`, `competent_to_occupation`, `rome_to_occupation` crosswalk tables). Confidence 0.8–0.9 at the occupation level.
2. Run the free-text body through the Tier C / D pipeline to extract skill mentions. Skills with no direct mention get imputed via `occupation_skills` expansion at confidence 0.4–0.6 (depending on the `typicality` score).

The critical discipline: when only the occupation code is reliable, do not generate a high-confidence skill claim. Write one occupation row, and let the `occupation_skills` expansion happen in the forecast engine, flagged as `inferred=true` so the UI can distinguish direct from inferred skill evidence.

### Tier C — Unstructured free-text, skill-dense

The signal is prose, multilingual, and skill-mention-dense. Examples:
- **Bestek / cahier des charges** attached to TED and BOSA notices.
- **ATS job descriptions** (the body below the title).
- **Boond deal descriptions and consultant CV fields**.
- **Industry news articles** (sector-specific, often skill-mentioning).
- **LinkedIn posts from target client companies** — CTO appointments, tech stack announcements (when accessible).

**Extraction heuristic**: tiered matcher, in this order, stopping at first match for each candidate skill:

1. **Whole-word alias match** against the multilingual alias index (current approach, extended to NL/FR/EN). High precision, miss rate 30–50% due to morphology ("ervaring met Kubernetes" vs. "Kubernetes-ervaring") and synonyms.
2. **Regex patterns** for common multilingual skill expressions. A small library of 20–40 patterns covers the dominant cases: *"ervaring met X"*, *"expérience en X"*, *"X developer"*, *"X-ontwikkelaar"*, *"(?:sénior|senior|lead) X"*. Generated programmatically from a template × alias cross-product; not hand-written.
3. **ESCO Competentiezoeker API** (free, NL/FR/EN, VDAB-hosted) for NL-heavy text. Returns ESCO skill URIs which we map via `skills.esco_uri`.
4. **LLM fallback** for text that passed the first three with fewer than N skills matched. Prompt: "Here is a job description / tender spec. Return the list of technical skills, tools, methods, and certifications mentioned, each with the exact span from the text. If a skill is implied but not mentioned, say so explicitly." Response is parsed, each span is verified against our skill taxonomy, and unrecognised spans become `skill_alias_candidates` for human review.

**Confidence ladder**: Tier 1 matches at 0.9, Tier 2 at 0.8, Tier 3 at 0.75, Tier 4 at 0.6 (since an LLM can hallucinate). Confidence combines multiplicatively when the same skill is matched by multiple tiers on the same document — floor at 0.5, capped at 0.98.

### Tier D — Quantitative, term-keyed

The signal is a number keyed to a search term, tag, or topic. Examples:
- **Google Trends** (already implemented) — interest index by term.
- **Stack Overflow tag velocity** — number of questions per tag per week.
- **GitHub Archive** — stars, forks, commits per repo/topic.
- **Meetup RSVPs** — attendee count per event-topic.
- **Devoxx / FOSDEM talk counts** — sessions per topic per year.

**Extraction heuristic**: a single lookup table mapping term → skill. No free-text parsing at all. This is already how the Google Trends connector works (it has `TRACKED_TERMS` inline in the Python). The improvement is to externalise that lookup into a dedicated `signal_term_mappings` table so a term like "langchain" can be updated without code changes, and so the same term used by Trends and Stack Overflow resolves to the same skill.

Confidence for Tier D signals does not come from the mapping (which is deterministic) but from the signal's own noise floor. A spike of 20% in Google Trends on a low-volume term is weaker than the same spike on a high-volume term. Each Tier D source needs its own significance test, written in the per-source memo.

---

## 4. The multilingual reality

Belgian digital work text is a mess of NL, FR, and EN, often in one document, often code-switched mid-sentence. A federal tender will have a French title, a Dutch legal preamble, and an English-language technical annex. The skill extractor needs to handle this without us hand-maintaining three taxonomies.

Two decisions make this tractable.

**First, aliases are language-tagged.** Today `skills.aliases` is a flat `text[]`. It should become a dedicated table:

```sql
create table skill_aliases (
  skill_id  uuid references skills(id) on delete cascade,
  alias     text not null,
  language  text not null check (language in ('nl','fr','en','xx')),
  primary key (skill_id, alias, language)
);
```

"xx" means language-agnostic (mostly product names: *Kubernetes, React, dbt, Figma*). NL/FR/EN entries cover the morphological variants we need. Example rows for `skills.name = 'React'`:

| alias | language |
|---|---|
| React | xx |
| ReactJS | xx |
| React.js | xx |
| React-ontwikkelaar | nl |
| React-ervaring | nl |
| développeur React | fr |
| développement React | fr |
| React developer | en |

Generating these is the painful part. Seeds can be bootstrapped from ESCO multilingual labels (ESCO ships NL/FR/DE labels per concept) and Lightcast's variant table. The LLM-fallback Tier 4 in §3.3 is also how we discover new aliases over time — every unrecognised span from a match session gets reviewed and either becomes a new alias or a new skill.

**Second, language detection runs per-paragraph, not per-document.** The `langdetect` library is ~95% accurate on paragraph-length text, much worse on titles alone. The extractor should:
1. Segment the document into paragraphs.
2. Detect language per paragraph.
3. Run the matcher with the language-filtered alias set (plus "xx" always included).
4. Union all matches.

This avoids a common failure mode where a French-dominant document drowns out the English-language technical annex in a CPV-coded tender.

---

## 5. Confidence semantics

Confidence is already in the schema (`signal_skills.confidence`, `forecasts.confidence`), but the values today are magic numbers set at extraction time. For the forecast engine to do honest convergence maths, confidence needs a defined meaning.

**The contract**: `signal_skills.confidence` is the probability that this signal genuinely contains an actionable demand mention for this skill. It decomposes into three independent factors:

1. **Extraction confidence** — how sure are we that the text mentions this skill? Comes from the Tier 1/2/3/4 ladder in §3.3.
2. **Source reliability** — how predictive is this source class for actual demand? A CRM deal profile is near-certain; a Google Trends spike is speculative. Encoded as a source-class prior, stored in `signals.source_prior` (new column, float 0–1).
3. **Recency weight** — how much has time eroded this signal? A procurement notice 6 months old is less relevant than one 3 weeks old. Computed at forecast time from `signals.detected_at`.

When we write to `signal_skills`, we store extraction confidence only. The forecast engine combines the three factors at read time. This keeps extraction independent of forecasting semantics, which we want because the source prior will be retuned as the system learns.

**Convergence bonus**: when N independent sources (different `source` values, not the same source hit N times) mention the same skill in the same time window, confidence compounds sublinearly. A reasonable formula:

```
effective_confidence = 1 - prod(1 - c_i)  for each source i
```

This caps at 1.0 and rewards source diversity without double-counting duplicates inside one source. Already partially implemented in `ForecastEngine` via the `active_signals / 4.0` heuristic; the proposed change is to weight each signal by its own confidence rather than count them binarily.

---

## 6. What the forecast engine needs from mapping

Today `forecast_engine.py` reads `signal_skills` rows and runs five scorers (`_score_crm_pipeline`, `_score_procurement`, `_score_historical_pattern`, `_score_trends`, `_score_job_postings`). The scorers each do their own SQL query and their own confidence arithmetic. That works for five sources with five well-defined shapes; it does not generalise to fifteen.

The mapping work proposed here unlocks a cleaner engine shape:

1. All signal sources write to `signals` + `signal_skills` + `signal_occupations` with a standardised `source_type`: `crm_internal | procurement | job_board | trend_index | news | event`.
2. The engine reads by `source_type`, not by source name. Adding ICTJob, VDAB, and three ATS feeds doesn't require new scorers — they share the `job_board` source_type.
3. Per-source tuning lives in a `source_weights` table (one row per source), not in Python constants. Moves source calibration from code to config.

This is additive to the existing engine — the current scorer code continues to work during the transition — but it's what lets us scale to the dozen sources the research docs recommend.

---

## 7. Schema proposals

Collected here for adjudication. Each is independent; they can ship one at a time.

### 7.1 Occupation layer

```sql
create table occupations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,             -- "UX designer"
  esco_uri    text,                      -- when mappable
  competent_code text,                   -- VDAB Competent 2.0 code
  rome_code   text,                      -- Le Forem ROME code
  discipline  text not null,             -- matches Movify discipline vocabulary
  created_at  timestamptz default now()
);

create table occupation_skills (
  occupation_id uuid references occupations(id) on delete cascade,
  skill_id      uuid references skills(id) on delete cascade,
  typicality    float default 0.5,       -- 0 = rare, 1 = canonical
  seniority_from text default 'junior' check (seniority_from in ('junior','mid','senior','expert')),
  primary key (occupation_id, skill_id)
);

create table signal_occupations (
  signal_id     uuid references signals(id) on delete cascade,
  occupation_id uuid references occupations(id) on delete cascade,
  confidence    float default 0.5,
  quantity      int default 1,           -- how many of this occupation the signal requests
  primary key (signal_id, occupation_id)
);

create table deal_profile_occupations (
  deal_profile_id uuid references deal_profiles(id) on delete cascade,
  occupation_id   uuid references occupations(id) on delete restrict,
  primary key (deal_profile_id, occupation_id)
);
```

### 7.2 Multilingual alias table

```sql
create table skill_aliases (
  skill_id  uuid references skills(id) on delete cascade,
  alias     text not null,
  language  text not null check (language in ('nl','fr','en','xx')),
  primary key (skill_id, alias, language)
);

create table occupation_aliases (
  occupation_id uuid references occupations(id) on delete cascade,
  alias         text not null,
  language      text not null check (language in ('nl','fr','en','xx')),
  primary key (occupation_id, alias, language)
);
```

Migration path: backfill from the existing `skills.aliases` text[], keep the column for one release as a read-only fallback, then drop it.

### 7.3 Crosswalk tables for structured sources

```sql
create table cpv_occupation_mapping (
  cpv_code      text primary key,        -- e.g., "79411000"
  occupation_id uuid references occupations(id) on delete restrict,
  typicality    float default 0.8
);

create table competent_occupation_mapping (
  competent_code text primary key,
  occupation_id  uuid references occupations(id) on delete restrict
);

create table rome_occupation_mapping (
  rome_code     text primary key,
  occupation_id uuid references occupations(id) on delete restrict
);

create table external_skill_mapping (
  source        text not null,           -- 'ictjob' | 'lightcast' | 'esco'
  external_id   text not null,
  skill_id      uuid references skills(id) on delete restrict,
  primary key (source, external_id)
);
```

### 7.4 Source metadata and term mappings

```sql
alter table signals add column source_type text;
-- Values: 'crm_internal' | 'procurement' | 'job_board' | 'trend_index' | 'news' | 'event'

alter table signals add column source_prior float default 0.5;
-- Class prior for this source in [0,1]. Updated by calibration jobs.

create table signal_term_mappings (
  term      text not null,               -- "langchain", "service design"
  source    text not null,               -- 'google_trends' | 'stack_overflow' | ...
  skill_id  uuid references skills(id),
  occupation_id uuid references occupations(id),
  primary key (term, source)
);
```

### 7.5 Alias discovery backlog

```sql
create table skill_alias_candidates (
  id          uuid primary key default gen_random_uuid(),
  raw_text    text not null,
  language    text,
  source      text,                      -- where the candidate was seen
  first_seen  timestamptz default now(),
  seen_count  int default 1,
  resolved_as uuid,                      -- null | skill_id | occupation_id
  resolution  text,                      -- 'skill' | 'occupation' | 'ignore' | null
  reviewed    boolean default false
);
```

Populated by the LLM-fallback Tier 4 matcher with every unrecognised span. Sebastiaan reviews periodically. Closing the loop: review decisions become new rows in `skill_aliases` / `occupation_aliases`.

---

## 8. What stays out of scope here

A few things the research explicitly defers so it doesn't balloon:

- **ML-based extraction quality improvements.** The memo specifies a tiered matcher including an LLM fallback, but does not benchmark JobBERT vs. spaCy vs. Claude. That's a downstream implementation call with a concrete A/B — skills extracted per 100 documents, precision/recall against a small hand-labelled set.
- **Active learning loops.** The `skill_alias_candidates` table enables this; designing the review UI and the retraining schedule is a V2 question.
- **Skill embedding similarity.** Useful for collapsing near-duplicates ("full-stack JS dev" ≈ "full-stack JavaScript developer"). Worth layering in once the deterministic matcher is saturating.
- **Forecast-level confidence calibration.** Referenced in §5 (source priors updated by calibration jobs) but the actual calibration algorithm is out of scope here — it's a forecast-engine concern, not a mapping concern.

---

## 9. What to build next, in order

Numbered for clarity. Each step is independently deployable and unblocks the next.

1. **Ship the `occupations` + `occupation_skills` + `signal_occupations` migration.** Seed occupations from the taxonomy reconciliation memo. No behaviour change yet — the dashboard still runs off skills.
2. **Extract occupations alongside skills** in the TED connector (Tier B pipeline: CPV → occupation, free text → skills). This proves the pattern.
3. **Replace `skills.aliases` with `skill_aliases` table** and backfill. Add language tagging. The existing Tier 1 extractor gets a one-line change to filter by detected language.
4. **Add the regex pattern library (Tier 2)** behind a feature flag. Measure lift in extracted skills per document against the current Tier 1 baseline.
5. **Add the VDAB Competentiezoeker call (Tier 3)** for NL-dominant documents. Scope creep is real here — keep the call async with a 500ms timeout, fail open to Tier 4.
6. **Add the LLM fallback (Tier 4)** with `skill_alias_candidates` capture. This is where we get the alias-discovery flywheel.
7. **Refactor `ForecastEngine` to read by `source_type`**, not source name. Unblocks all future connectors.

Phases 1–3 are low risk and high leverage. Phase 4 is where the perceived quality jump will come. Phases 5–7 are scaling investments.

---

*Written to be challenged. Anything in §3's tier assignments or §7's schema proposals is adjudicable before a line of migration lands.*
