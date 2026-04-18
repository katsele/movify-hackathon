# Taxonomy reconciliation — ESCO, Lightcast, Competent 2.0, Movify

*Movify — April 2026*
*Companion memos: `signal-to-skill-mapping.md`, `per-source-heuristics.md`*

---

## 1. Why a reconciliation memo

Three external taxonomies are candidates for the job, none of them sufficient alone, and Movify has its own discipline vocabulary that Sebastiaan staffs against. This memo picks which taxonomy owns which layer, spells out the crosswalk, and proposes a concrete seed expansion from the current 14 skills to a credible baseline (~60 occupations, ~160 skills) the system can actually work against. The aim is not to be exhaustive — it is to stop the system from silently inventing precision that doesn't exist downstream.

The mapping strategy memo (`signal-to-skill-mapping.md`) argued for a two-layer model: occupations and skills, joined explicitly. This memo populates that model.

---

## 2. The four taxonomies, in brief

### ESCO v1.2.1 (European Skills, Competences, and Occupations)

- Scope: 13,890 skill concepts, 3,000+ occupations. Multilingual (24 EU languages, including NL, FR, EN).
- Strength: the canonical European taxonomy. Free, EUPL-licensed, has a REST API and downloadable dumps.
- Weakness: lags fast-moving tech. Next.js, LangChain, dbt, specific AWS services are often missing or folded into vague parents. Design and product occupations are thin — "service designer" is not a first-class ESCO occupation; "AI strategist" does not exist.
- Best for: **occupation IDs**. ESCO occupation URIs are the most durable cross-taxonomy anchor we have.

### Lightcast Open Skills

- Scope: ~33,000 skills and 75,000 job titles. Commercial-use permitted via free registration. Distinguishes React, React Native, Next.js, Vue.js, Angular as separate skill IDs.
- Strength: IT granularity. Updated continuously. English-dominant but covers the variants that matter for a framework-level taxonomy.
- Weakness: multilingual labels are weaker than ESCO. Open Skills does not map 1:1 to Lightcast's paid occupation data — the open layer is skill-only.
- Best for: **skill IDs** at framework/tool/method level.

### Competent 2.0 (VDAB / Synerjob)

- Scope: the shared Belgian PES taxonomy, effective 13 Jan 2026 across VDAB, Le Forem, Actiris, ADG. Adds AI Engineer, data scientist, DevOps engineer as first-class occupation codes.
- Strength: what the public employment services actually return. Native NL + FR labels. Directly mapped to ESCO.
- Weakness: design and product families lag — UX designer exists, service designer and product manager do not.
- Best for: **crosswalk from VDAB / Actiris API payloads to our occupations**.

### ROME (Le Forem)

- Scope: French-origin occupation taxonomy, used by Le Forem. Has a separate code structure from Competent 2.0.
- Strength: what Le Forem's Opendatasoft feed returns.
- Weakness: Belgian adaptation has been partial; many roles still fold into generic "Concepteur multimédia" (M180501) or "Ingénieur informatique" (M180202).
- Best for: **crosswalk from Le Forem API payloads to our occupations**. Strictly a read-only translation layer.

### Movify disciplines (internal)

- Scope: Sebastiaan's staffing vocabulary. Used in Boond, in practice-lead conversations, and in the dashboard's discipline filter.
- Status: the research docs reference a "12-discipline taxonomy" but it is not explicitly enumerated anywhere in the repo (the seed file has only 5: Web Development, Platform Engineering, AI/ML, Data, Design). §3 below proposes the 12 for Sebastiaan to adjust.
- Best for: **display layer**. Disciplines do not map 1:1 to occupations — service design and UX design are two occupations in one discipline; full-stack developer and platform engineer span two disciplines. The discipline is a grouping, not a unique key.

---

## 3. Proposed Movify 12-discipline taxonomy

Drawn from the research artifacts (Compass docs both reference the same 12-family structure) plus the current seed file plus the value-prop doc. **This is a proposal for Sebastiaan to correct.** Everything downstream can still be built on five disciplines if that's where we actually land.

| # | Discipline | Typical occupations | Typical skills |
|---|---|---|---|
| 1 | Product Management | Product manager, associate PM, product ops | Discovery, roadmapping, OKRs, Jira, Linear |
| 2 | UX Research | UX researcher, user researcher, research ops | Usability testing, interviews, Dovetail, Maze |
| 3 | Product Design | UX designer, UI designer, interaction designer | Figma, prototyping, Design systems tooling |
| 4 | Service Design | Service designer, design strategist | Service blueprinting, journey mapping, workshops |
| 5 | Design Systems & Accessibility | Design system engineer, accessibility specialist | Token pipelines, WCAG 2.2, Storybook, axe |
| 6 | Web / Frontend Development | Frontend dev, full-stack dev, React dev | React, Next.js, TypeScript, Vue, HTML/CSS |
| 7 | Backend / Platform Engineering | Backend dev, platform engineer, SRE | Node.js, Go, Python, Kubernetes, Terraform |
| 8 | Data Engineering | Data engineer, analytics engineer | dbt, Snowflake, Airflow, SQL, BigQuery |
| 9 | AI / ML Engineering | AI engineer, ML engineer, MLOps | LangChain, LlamaIndex, vector DBs, PyTorch |
| 10 | AI Strategy | AI strategist, AI product lead | AI literacy, use-case scoping, model governance |
| 11 | Cloud / DevOps | Cloud engineer, DevOps engineer, cloud architect | AWS, Azure, GCP, Terraform, GitHub Actions |
| 12 | Delivery & Agile | Scrum master, delivery lead, agile coach | Scrum, SAFe, Kanban, JIRA workflow design |

Numbers 4, 5, and 10 are the disciplines most poorly served by ESCO and Competent 2.0. That's not accidental — those are the markets the research identified as "where no competitor has coverage." They're also the disciplines most likely to need Movify-owned occupation IDs rather than ESCO mappings.

---

## 4. Layer ownership rules

The two-layer model from the strategy memo is only useful if each external taxonomy has a well-defined responsibility. The rules:

1. **Every occupation row has an ESCO URI if one exists**, even if the match is loose. For occupations with no ESCO code (service designer, AI strategist), `esco_uri` is null and we own the canonical ID.
2. **Every occupation row has a `competent_code` if Competent 2.0 covers it**, null otherwise. This is what lets the VDAB connector do a deterministic lookup.
3. **Every occupation row has a `rome_code` if Le Forem covers it**, null otherwise.
4. **Every skill row has a `lightcast_id` where Lightcast covers it**, plus an `esco_uri` if the skill exists at ESCO knowledge level. Lightcast wins on ties; ESCO is the fallback.
5. **Discipline is a single text column on `occupations`**, not a foreign key, because the discipline list is a product decision under Sebastiaan's control — it shouldn't require a migration to rename "Product Design" to "UX/Product Design."
6. **`occupation_skills` is authored, not scraped.** The `typicality` scores reflect Movify's actual staffing experience, starting from a sensible default (0.8 for canonical skills of an occupation, 0.4 for adjacent skills, 0.1 for rare) and tuned over time.

---

## 5. Concrete seed expansion

Current state: 14 skills in migration `002_story1_seed.sql`, across 5 disciplines, no occupations, no aliases beyond a flat text[]. The proposal below brings the seed to roughly 60 occupations and 160 skills — enough to cover Movify's staffing reality and to validate extraction against real TED/ATS payloads.

### 5.1 Occupations seed (excerpt, full list in follow-up migration)

| Name | Discipline | ESCO URI | Competent 2.0 | ROME |
|---|---|---|---|---|
| Product manager | Product Management | `http://data.europa.eu/esco/occupation/242207` | *(null — thin Competent coverage)* | M1302 |
| UX designer | Product Design | `http://data.europa.eu/esco/occupation/216508` | C081101 | M180501 |
| UX researcher | UX Research | `http://data.europa.eu/esco/occupation/242202` | *(null)* | *(null)* |
| Service designer | Service Design | *(null — ESCO gap)* | *(null)* | *(null)* |
| Design system engineer | Design Systems & Accessibility | *(null)* | *(null)* | *(null)* |
| Accessibility specialist | Design Systems & Accessibility | `http://data.europa.eu/esco/occupation/252106` | *(null)* | *(null)* |
| Frontend developer | Web / Frontend Development | `http://data.europa.eu/esco/occupation/251203` | C071301 | M180203 |
| Full-stack developer | Web / Frontend Development | `http://data.europa.eu/esco/occupation/251204` | C071303 | M180203 |
| Backend developer | Backend / Platform Engineering | `http://data.europa.eu/esco/occupation/251205` | C071302 | M180202 |
| Platform engineer | Backend / Platform Engineering | `http://data.europa.eu/esco/occupation/251206` | *(null)* | M180202 |
| Site reliability engineer | Backend / Platform Engineering | *(null — ESCO gap)* | *(null)* | *(null)* |
| Data engineer | Data Engineering | `http://data.europa.eu/esco/occupation/252504` | C071402 | M180201 |
| Analytics engineer | Data Engineering | *(null — ESCO gap)* | *(null)* | *(null)* |
| AI engineer | AI / ML Engineering | *(Competent 2.0 has this; ESCO lags)* | C071501 *(new in 2.0)* | *(null)* |
| ML engineer | AI / ML Engineering | `http://data.europa.eu/esco/occupation/252502` | C071503 | M180202 |
| AI strategist | AI Strategy | *(null — first-class Movify ID)* | *(null)* | *(null)* |
| Cloud engineer | Cloud / DevOps | `http://data.europa.eu/esco/occupation/251207` | C071304 | M180202 |
| DevOps engineer | Cloud / DevOps | `http://data.europa.eu/esco/occupation/251208` | C071305 *(new in 2.0)* | M180202 |
| Scrum master | Delivery & Agile | `http://data.europa.eu/esco/occupation/241206` | C082304 | M180302 |

The full list targets 60 rows. URIs above are illustrative — the migration will validate them against a live ESCO API call and hold the actual URIs.

### 5.2 Skills seed (excerpt by discipline)

| Discipline | Proposed seeds |
|---|---|
| Web / Frontend | React, React Native, Next.js, Vue, Nuxt, Angular, Svelte, Astro, TypeScript, JavaScript, HTML5, CSS3, Tailwind, Storybook, Playwright, Vitest |
| Backend / Platform | Node.js, NestJS, Deno, Bun, Go, Python, FastAPI, Django, Rust, Java, Spring Boot, .NET, PostgreSQL, MongoDB, Redis, GraphQL, gRPC |
| Data Engineering | dbt, Snowflake, BigQuery, Redshift, Databricks, Airflow, Dagster, Prefect, Kafka, Fivetran, Airbyte, Looker, PowerBI |
| AI / ML Engineering | LangChain, LlamaIndex, OpenAI API, Anthropic API, Hugging Face, PyTorch, TensorFlow, scikit-learn, Pinecone, Weaviate, Qdrant, vLLM, LangGraph |
| Cloud / DevOps | AWS, Azure, GCP, Kubernetes, Docker, Terraform, Pulumi, Ansible, ArgoCD, GitHub Actions, GitLab CI, Datadog, OpenTelemetry |
| Product Design | Figma, FigJam, Sketch, Adobe XD, Protopie, Principle, Framer, Lottie |
| Service Design | Service blueprinting, Journey mapping, Stakeholder interviews, Co-creation workshops, Design sprints |
| Design Systems & Accessibility | Design tokens, Style Dictionary, WCAG 2.2, axe DevTools, ARIA patterns, Storybook, Chromatic |
| UX Research | Usability testing, Dovetail, Maze, UserTesting.com, Card sorting, Tree testing |
| Product Management | Roadmapping, OKRs, JTBD, North Star metrics, Product discovery, Linear, Jira, Productboard |
| AI Strategy | AI use-case scoping, Model governance, Responsible AI, AI Act compliance, Prompt engineering methodology |
| Delivery & Agile | Scrum, SAFe, Kanban, LeSS, Jira workflow design, Retrospective facilitation |

Target: ~160 skills across the 12 disciplines. Dedup against the current seed; drop rarely-requested ones if they bloat the alias index.

### 5.3 occupation_skills edges (authoring pattern)

For each occupation, we seed three tiers of skill association:

- **Canonical** (`typicality = 0.9`): skills the occupation is defined by. A Frontend developer is canonically associated with React, TypeScript, HTML, CSS, and one or two testing tools. Five to eight canonical skills per occupation.
- **Adjacent** (`typicality = 0.5`): skills often held by the occupation but not definitional. A Frontend developer often knows Node.js, but it's not what makes them a frontend developer. Ten to fifteen adjacent skills per occupation.
- **Seniority-gated** (`typicality = 0.6`, `seniority_from = 'senior'`): skills that only reliably appear at senior level. A Frontend developer gains "design systems ownership" and "performance budgeting" at senior but not junior.

Authoring this table is 3–4 hours of focused work for a practice lead. The mistake is to try to automate it — the `typicality` scores are where Movify's staffing knowledge actually lives.

---

## 6. The gaps, named

Four occupations in Movify's discipline list have no clean external home:

1. **Service designer** — no ESCO code, no Competent 2.0 code. Lightcast has service design as a skill, not an occupation. Movify owns this ID.
2. **AI strategist** — same story. The closest ESCO concepts are "management consultant" or "analyst," neither of which is actionable. Movify owns this ID.
3. **Design system engineer** — an emerging role. No external taxonomy has it yet. Movify owns this ID.
4. **Analytics engineer** — dbt Labs coined it. ESCO is three years behind. Movify owns this ID.

This is fine. The `occupations` table is designed so that Movify-owned IDs are first-class alongside ESCO-mapped IDs. The downstream consequence: extraction from public sources (VDAB, Forem, TED) will almost never surface these roles explicitly. They will be reached by skill-level convergence (a procurement notice mentioning "service blueprinting" + "journey mapping" + "co-design workshops" resolves to service designer via `occupation_skills` reverse lookup). This is the inference pattern the forecast engine needs to support.

The reverse inference can be formalised: if a signal mentions K of an occupation's N canonical skills, the occupation can be inferred with `confidence = K/N * max_canonical_typicality`. A signal mentioning 4 of service design's 5 canonical skills resolves to a service-designer occupation row at confidence 0.72. Below a threshold (say 0.5) we don't write the inferred occupation — we keep it as skill-level evidence and let the engine decide.

---

## 7. Alias bootstrapping strategy

The new `skill_aliases` / `occupation_aliases` tables (proposed in the strategy memo §7.2) need content before any extractor can use them. The proposed bootstrap order:

1. **Pull ESCO multilingual labels** for every occupation row that has an `esco_uri`. ESCO ships NL / FR / EN / DE labels per concept. One API call per occupation during the seed migration; cache the responses so the migration is rerunnable.
2. **Pull Lightcast variants** for every skill with a `lightcast_id`. Lightcast returns known alternate names; most are English but the normalised forms (`React.js`, `ReactJS`, `React`) are language-agnostic.
3. **Add morphological variants for NL and FR programmatically.** A small script generates `{skill}-ontwikkelaar`, `{skill}-ervaring`, `ervaring met {skill}`, `expérience en {skill}`, `{skill}-développeur`. The aliases are noisy but inclusive; the Tier 1 matcher tolerates this because false positives are cheap to review through the candidate backlog.
4. **Hand-author the first 50 tricky ones.** Things like "k8s" → Kubernetes, "ts" → TypeScript, "rails" → Ruby on Rails. One sitting.
5. **Let the Tier 4 LLM matcher discover new aliases** by capturing unrecognised spans into `skill_alias_candidates` (strategy memo §7.5). Sebastiaan reviews weekly in the first month and monthly thereafter.

Rough numbers: step 1 yields ~200 aliases across 60 occupations, step 2 yields ~400 across 160 skills, step 3 generates another ~800 programmatic variants. Total ~1,400 rows at launch. That's the taxonomy backbone.

---

## 8. Versioning and drift

The external taxonomies are versioned and will drift. ESCO has had four major releases since 2017. Competent 2.0 rolled out 13 Jan 2026 and keeps iterating. Lightcast updates continuously.

The pragmatic stance:

- **Pin a version per external source.** Store `source_taxonomy_version` in each crosswalk table (`cpv_occupation_mapping`, `competent_occupation_mapping`, etc.). Migration history tracks which version the crosswalk reflects.
- **Re-pull occupation labels and crosswalks quarterly.** A scheduled worker refreshes alias tables from ESCO / Lightcast / Competent and writes deltas to a review log rather than silently overwriting.
- **Never auto-retire a Movify-owned ID.** Even if ESCO later adds a "service designer" occupation, the Movify-owned row stays primary. The ESCO URI is added as a secondary reference, not a replacement.

This is cheap to build now and expensive to retrofit later. It goes in the first seed migration.

---

## 9. Output of this memo

What the next migration needs:

1. `occupations`, `occupation_skills`, `signal_occupations`, `deal_profile_occupations` tables (strategy memo §7.1).
2. `skill_aliases`, `occupation_aliases` tables (§7.2).
3. `cpv_occupation_mapping`, `competent_occupation_mapping`, `rome_occupation_mapping`, `external_skill_mapping` crosswalk tables (§7.3).
4. Seed: 60 occupations, 160 skills, 5 canonical + 10 adjacent edges per occupation (≈900 rows in `occupation_skills`), 1,400 alias rows.
5. A worker module `workers/taxonomy/` holding: ESCO label fetcher, Lightcast variant fetcher, morphological variant generator, crosswalk maintenance.

Estimated time: one day to draft migrations, two days for the taxonomy authoring session with Sebastiaan, half a day for the bootstrap scripts. Total ~3.5 days of work before anything else in the ingestion pipeline can meaningfully improve.

The case for doing it before adding any new connectors: every connector we add now without this taxonomy work will write low-fidelity rows that are painful to retroactively re-tag. The case against: none of it is user-visible until the downstream matcher and engine pick it up. That tension is real; the recommendation is to do it anyway, because it unblocks every other piece.

---

*All occupation URIs and Competent codes in §5 are best-effort from public documentation — they must be validated against a live ESCO API call and the VDAB Competent export before the migration merges.*
