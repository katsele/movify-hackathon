# Belgian Digital Skills Radar — Technical source inventory

This inventory catalogs **90+ data sources** with verified API endpoints, RSS feed URLs, authentication, pricing, and Belgium-filter details for a production-grade Digital Skills Radar. The critical finding: **a free, high-coverage pipeline is achievable** by combining Eurostat/Statbel APIs, KBO Open Data, NBB CBSO, TED procurement API, CrUX BigQuery, Cloudflare Radar, and Roularta/WordPress RSS feeds. **Paid tiers are only essential for three signal classes**: live startup funding data (Dealroom/Crunchbase), deep tech-stack lead lists (BuiltWith/Wappalyzer), and enterprise news (Reuters Connect / Bloomberg Terminal). Belgium has **no national OCDS procurement feed and no public salary API**; those categories require workarounds or remain PDF-only.

---

## A. Belgian business and tech media

Belgian media sites published by **Roularta Media Group and DPG Media run WordPress**, so the `/feed/` and `/tag/{slug}/feed/` patterns work reliably. Verified below.

| Source | URL | RSS / API | Lang | Signal |
|---|---|---|---|---|
| **Trends (Knack)** | trends.knack.be | `https://trends.knack.be/feed/` (WP); paywall on full text | NL | Business, M&A |
| **Trends-Tendances** | trends.levif.be | `https://trends.levif.be/feed/` | FR | Business, M&A |
| **Trends Z / Trends Business** | trendstop.knack.be | No public RSS; **Trends-Business-Information API** at `https://api.trends-business-information.be/docs/client.html` (commercial, Roularta TBI) | NL/FR | Rankings, company intel |
| **Data News** | datanews.knack.be / datanews.be | `https://datanews.knack.be/feed/` (verified — returns valid XML, hourly update, `Trends DataNews` channel) | NL | IT sector, tech adoption, awards |
| **ITdaily.be** | itdaily.be | `https://itdaily.be/feed/` (WordPress) | NL | B2B IT news |
| **Tweakers.be / .net** | tweakers.net | `https://feeds.feedburner.com/tweakers/mixed` + per-category feeds at `/feeds/` | NL | Consumer/prosumer tech |
| **Bloovi** | bloovi.be | `https://www.bloovi.be/rss` (WordPress-style) | NL | Flemish startup/scaleup |
| **Business AM** | businessam.be | `https://businessam.be/feed/` | NL/FR | Business news |
| **Silicon Canals** | siliconcanals.com | `https://siliconcanals.com/feed/` | EN | Benelux startups |
| **Le Soir** | lesoir.be | `https://www.lesoir.be/rss/17836.xml` (eco) and `/rss/17838.xml` (tech); site maintains a public RSS hub | FR | National news, eco |
| **Geeko (Le Soir)** | geeko.lesoir.be | `https://geeko.lesoir.be/feed/` | FR | Consumer tech |
| **De Standaard** | standaard.be | `https://www.standaard.be/rss/section/{section}.xml` (e.g. `economie.xml`) | NL | National, eco |
| **De Morgen** | demorgen.be | `https://www.demorgen.be/economie/rss.xml` (DPG CMS pattern) | NL | National, eco |
| **Het Laatste Nieuws** | hln.be | `https://www.hln.be/geld/rss.xml` (DPG CMS) | NL | General, business |
| **L'Avenir** | lavenir.net | `https://www.lavenir.net/arc/outboundfeeds/rss/` (Arc CMS); section-specific available | FR | Regional (Wallonia) |
| **Channelweb.be** | channelweb.be | No public RSS found; scrape sitemap.xml | NL/FR | IT channel/reseller |
| **Computable.be** | computable.be | `https://www.computable.be/feed/` (WordPress) | NL | B2B IT news |
| **ZDNet.fr** | zdnet.fr | `https://www.zdnet.fr/feeds/rss/actualites/` | FR | Enterprise IT (BE coverage marginal) |
| **LeMagIT** | lemagit.fr | `https://www.lemagit.fr/rss/IT.xml` | FR | Enterprise IT |

**Scraping feasibility note**: All DPG (HLN, De Morgen, VRT NWS) and Mediahuis (De Standaard, Gazet van Antwerpen, Nieuwsblad) titles expose **section-level RSS** via predictable URL templates; Roularta titles universally honor the WordPress `/feed/` and `/tag/{slug}/feed/` patterns, so **Belgium-specific tag feeds are buildable** (e.g. `trends.knack.be/tag/ai/feed/`).

---

## B. European tech and business news with Belgian coverage

**Tech.eu** is the single highest-value free feed: `https://tech.eu/feed/` is verified live, publishes multiple daily items, and routinely covers Belgian startups (Backbone, etc.). Combine with **EU-Startups** (`https://www.eu-startups.com/feed/` plus `/tag/belgium/feed`) and **Sifted** (`https://sifted.eu/feed/?post_type=article`) for the tightest European startup/VC signal with strong Belgium tagging.

For policy signals, **Politico Europe** and **Euractiv** both expose free WordPress-style section feeds: `https://www.politico.eu/section/technology/feed/`, `.../cybersecurity-and-data-protection/feed/`, and `https://www.euractiv.com/section/digital/feed/`. These are **Tier-1 sources for AI Act, digital-single-market, and Brussels-institution coverage** that directly affects Belgian digital policy.

**TechCrunch Europe** (`https://techcrunch.com/tag/europe/feed/`) and **The Next Web** (`https://feeds.feedburner.com/thenextweb`) provide broad EU coverage but **TNW truncates free feeds** — full content requires TNW Pro.

**Enterprise-only sources (budget warning)**:
- **Financial Times**: No public Belgium feed; **myFT personalized RSS** requires subscription (~€600/yr), FT Content API is enterprise-licensed (5–6 figures/yr).
- **Reuters**: Officially discontinued all public RSS in **June 2020**. **Reuters Connect** is the only legitimate programmatic path (enterprise contract).
- **Bloomberg**: No public RSS ever. Access requires **Terminal (~$30k/user/yr)** or **Bloomberg Data License / SAPI** (custom enterprise contracts).

---

## C. Job boards and hiring feeds

### Belgian public employment services

**VDAB (Flanders) — verified developer portal**: `https://developer.vdab.be/openservices/` with four product families: **Vacature API** (`product/5129`, v4.1.0, consumption of VDAB vacancies), **Vacature Posting API** (publish vacancies into VDAB), **Profiel API** (candidate profiles), **Competent 2 API** (occupational-competence ontology — free, no gate). Vacature API requires **signed partnership agreement + OAuth 2.0 (OIDC)** with API-key auth, TLS 1.2+, onboarding handled by `api.coe@vdab.be`. **Aggregated vacancy open data (no PII) is publicly downloadable** at `https://www.vdab.be/trends/open_data/vacatures`. Competent 2.0 ontology is mandatory for posting from 13 Jan 2026.

**Le Forem (Wallonia)** — **verified Opendatasoft portal**: `https://leforem-digitalwallonia.opendatasoft.com/` with public API console at `/api/explore/v2.1/console`. Also republished on `https://www.odwb.be` (ODWB). Free, no-auth JSON/CSV; Belgium-by-default. Contact `opendata-offres@forem.be`. Covers all Walloon vacancies Le Forem diffuses.

**Actiris (Brussels)** has no documented public API; vacancies are diffused through EURES and partner scraping agreements.

**EURES** (pan-European, covers all Belgian public PES aggregated): Portal at `https://europa.eu/eures/portal/jv-se/home`. No public REST API for general consumers; EURES ingests via national-side **input APIs** (`/input/api/jv/v0.1/getAll`, `/getChanges/{ts}`, `/getDetails`) that each state implements for publishing into EURES. For consumption, there is **no official consumer API** — scraping (Apify `lexis-solutions/eures-eu-jobs-scraper` is one commercial workaround) or the **Tableau-based Job Vacancy Statistics dashboard** at `/eures-services/eures-portal-statistics/job-vacancy-statistics_en` are the practical routes.

### Commercial job boards

| Source | Technical access | Notes |
|---|---|---|
| **ICTjob.be** | No public RSS/API; clean HTML job listings + sitemap.xml — scraping feasible | Tech-only, ~2–3k active BE listings |
| **StepStone.be** | No public RSS; XML job sitemap at `/sitemap.xml` with job-posting entries; Totaljobs Group partner feeds (commercial) | Belgium's largest generalist |
| **Jobat.be** | `https://www.jobat.be/nl/rss/` (WordPress-style; verify live) | NL; Roularta family |
| **References.be** | No documented public RSS; sitemap scrape; Rossel group | FR; Le Soir's board |
| **Indeed Belgium** (be.indeed.com) | **Publisher Job Search API DEPRECATED** (per `developer.indeed.com/docs/publisher-jobs/job-search`). **Organic single-source XML feeds being discontinued 31 March 2026**. Only path forward: **Sponsored Jobs API + direct ATS integration** (`docs.indeed.com/sponsored-jobs-api/`). No-budget alternative: scraping (Apify actors) but brittle and ToS-risky | ❗ Major deprecation in 2026 |
| **Welcome to the Jungle** | `welcometothejungle.com/{fr-be\|nl-be}/` — no public API; GraphQL endpoint used internally at `/api/v1/organizations/...`; Algolia-indexed (`csekahypsc-dsn.algolia.net`) and reverse-engineerable | FR/NL BE sub-sites |
| **LinkedIn Jobs** | **No public feed**. Talent Insights API requires Talent Solutions contract. Public scraping violates ToS. | Avoid as a feed |
| **Talent.com Publisher XML** | `https://www.talent.com/publisher` — free XML feed for job aggregators, filter by country=BE | Generalist aggregator |

### ATS job-board APIs (free, public, excellent for tracking Belgian tech employers)

These are the **highest-ROI technical pipelines** for demand signals from individual Belgian companies that self-host careers pages. All return JSON, no auth, no rate limit beyond fair-use.

- **Greenhouse**: `https://boards-api.greenhouse.io/v1/boards/{company}/jobs` and `.../jobs?content=true` for full descriptions. Company slug discoverable by scanning `boards.greenhouse.io/{slug}` of known BE firms (e.g., Collibra, Showpad).
- **Lever**: `https://api.lever.co/v0/postings/{company}?mode=json` — works for any company using lever.co.
- **Ashby**: `https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true`.
- **Workable**: `https://apply.workable.com/api/v1/widget/accounts/{subdomain}` or `https://{subdomain}.workable.com/spi/v3/jobs`.
- **Personio, Recruitee, Teamtailor, SmartRecruiters**: similar public endpoints (`api.recruitee.com/c/{company}/offers`, `careers.smartrecruiters.com/{company}/api/`).

**Discovery technique**: Crawl Belgian company careers pages; detect ATS from JS bundles or apply-URL patterns (`jobs.lever.co/`, `boards.greenhouse.io/`, etc.); then poll the public JSON endpoint daily. This gives you raw demand signals **at the individual-employer level**, enriched with tech tags, department, location, and posting date — arguably the single best free technical hiring-demand feed for Belgian scaleups and corporates.

---

## D. Public procurement

**Primary source — TED (EU) Search API v3**: `POST https://api.ted.europa.eu/v3/notices/search`, Swagger at `https://api.ted.europa.eu/swagger-ui/index.html`, docs at `https://docs.ted.europa.eu/api/latest/search.html`. **Free, anonymous** for notice search; API keys only needed for submission. Pagination to 15,000 notices per query (PAGE_NUMBER mode) or unlimited with ITERATION mode using `iterationNextToken`.

**Belgian IT/digital query (expert syntax)**:
```
buyer-country=BEL AND classification-cpv IN (72* 48* 30200000 50300000 51610000)
```
Key CPV prefixes: **72** (IT services), **48** (software), **30200000** (computer equipment), **50300000** (IT maintenance), **51610000** (computer installation). TED also publishes **daily and monthly bulk XML packages** at `https://ted.europa.eu/packages/daily/{OJS}` and `.../monthly/{YYYY-N}` — both legacy TED schema and eForms (mandatory from 25 Oct 2023) coexist. Historical archive dates back to 1993. **RDF/SPARQL endpoint** at `https://data.ted.europa.eu/`.

**Belgium-specific — BOSA e-Procurement**: Portal at `https://www.publicprocurement.be` (unified Sept 2023). **Critical finding: No public API, no OCDS publication, no bulk download advertised.** The SPA requires registration; below-EU-threshold notices live only here. Above-threshold Belgian notices all flow to TED via eSenders. For below-threshold, **scraping is the only technical route** (with legal risk) or using **OpenTender/GTI** (`https://data.open-contracting.org/en/publication/150`) which republishes TED + national data for Belgium in OCDS JSON/CSV/Excel (CC-BY-NC).

**Commercial aggregators not programmatically accessible**: **TenderWolf** (tenderwolf.com), **Govex** (govex.be), and **3P** (3p.eu) have no public APIs — all are SaaS platforms with CRM connectors only. Useful for QA but not as ingestion sources.

**Regional inventories**: Brussels City (opendata.brussels.be) publishes **annual awarded-contract datasets** via Opendatasoft v2.1 API (`/api/explore/v2.1/catalog/datasets/{id}/records`) — historical only.

---

## E. Company and startup intelligence

### Authoritative Belgian sources (free or cheap)

**KBO / BCE / CBE Open Data** is the foundation: the Crossroads Bank for Enterprises publishes the **full universe of ~2M Belgian entities daily** as a ZIP of CSVs (`meta.csv, enterprise.csv, establishment.csv, denomination.csv, address.csv, activity.csv`, etc.). Download at `https://kbopub.economie.fgov.be/kbo-open-data/login?lang=en` after free registration, or via SFTP (email `kbo-bce-webservice@economie.fgov.be`). Files retained 31 days. **Cadence is now daily** (updated from the older monthly schedule). Data includes NACE-BEL activity codes, legal form, status, addresses — but **no financials and no employee counts** (those come from NBB).

**NBB Central Balance Sheet Office (CBSO)** — production API at `https://ws.cbso.nbb.be/` with developer portal `https://developer.cbso.nbb.be/`. Authentication via `NBB-CBSO-Subscription-Key` header. **"Authentic Data Query" is free** (`GET /authentic/legalEntity/{id}/references`), as is the **daily extract** (`GET /authentic/extracts` returning ZIP of XBRL for all filings accepted that day). "Improved Data" is €3,300/yr. Returns structured annual accounts: balance sheet, P&L, **social balance (employee figures), NACE activity** — in XBRL, JSON (filings post-2022-04-04), or PDF.

**Moniteur Belge / Belgisch Staatsblad** (`ejustice.just.fgov.be`) — CC0 registered on data.gov.be as `fpsjust-moniteur`. **No RSS, no API.** Daily company publications (50–300/day: incorporations, mergers, director changes, bankruptcies). Access by date-based URL scraping or third-party **StaatsbladMonitor** (free alerts by KBO number) and Apify scrapers (`studio-amba/staatsblad-scraper`). PDF URL pattern: `https://www.ejustice.just.fgov.be/tsv_pdf/YYYY/MM/DD/{NUMAC}.pdf`.

**Trends Top (Roularta TBI)** — commercial API at `https://api.trends-business-information.be/` (docs `/docs/client.html`). Enriches KBO+NBB with Roularta-proprietary rankings, director mandates, sentiment-scored news, legal events. Contact `tbi@trends-business-information.be`.

**Companyweb** — SOAP API, subscription-based; covers BE/NL/LU with payment-behavior scores. **Graydon** merged into **Creditsafe** in 2024; legacy Graydon endpoints are being consolidated under the Creditsafe platform.

### International startup intelligence platforms

| Source | API | Pricing | BE coverage |
|---|---|---|---|
| **Dealroom** | REST, docs at `docs.dealroom.co` | €12,600/yr Premium; €17,000/yr Plus (API/Zapier); API plan custom | **Best-in-class** — powers official Belgian ecosystem dashboards |
| **Crunchbase** | `https://api.crunchbase.com/api/v4/`, Basic API free with key (~200 calls/min) | Enterprise API ~$50,000+/yr | Decent for VC-funded tech |
| **Tracxn** | REST | ~$500/mo starter; data-pack quotes | Moderate |
| **PitchBook** | REST `pitchbook.com/products/direct-access-data/api` | ~$25–30k/seat/yr + API uplift | Strong for VC/PE-backed |
| **OpenCorporates** | `https://api.opencorporates.com/v0.4/companies/be/{num}` | £2,250–12,000/yr (BE included in 145 jurisdictions) | Copy of KBO; historical directors differentiator |
| **Wellfound / AngelList** | **No data API** (deprecated) | N/A | Weak BE coverage — skip |

**BeCommerce** rankings (BCS100, BCMM) are PDF-only, members-only — no automation path.

---

## F. Technology adoption signals

The strongest free stack for Belgium-specific tech adoption combines three BigQuery public datasets with two REST APIs:

**1. Chrome UX Report (CrUX) BigQuery** — `chrome-ux-report.country_be.YYYYMM` gives the monthly list of **Belgian origins with real user traffic** and their Core Web Vitals histograms. The **experimental.popularity.rank** column lets you enumerate the **top 1k/10k/100k/1M Belgian websites** directly — use this as the seed list for all downstream tech detection. The public **CrUX History API does NOT expose country**; BigQuery is the only BE-country path.

**2. HTTP Archive BigQuery** — `httparchive.crawl.pages` carries Wappalyzer-detected tech stacks per URL but is crawled from US IPs, so filtering to Belgium requires joining on the CrUX `country_be` origin set. Free within BigQuery's 1 TB/month tier.

**3. PyPI BigQuery** — `bigquery-public-data.pypi.file_downloads` is the rare package registry that exposes `country_code`. Example: `SELECT file.project, COUNT(*) FROM pypi.file_downloads WHERE country_code='BE' AND DATE(timestamp)=...` gives **Belgium's Python package adoption** — uniquely authoritative. **npm and most other package registries do NOT expose geography.**

**4. Cloudflare Radar API** — REST at `https://api.cloudflare.com/client/v4/radar/` with `location=BE` filter on every endpoint. Free, Cloudflare API token required. Exposes **HTTP/3, TLS 1.3, IPv6, post-quantum, browser/OS share, top Belgian domains, BGP/AS112/email-security** — all with Belgian granularity, hourly-to-daily update.

**5. StatCounter Global Stats** — free CSV export from pages like `https://gs.statcounter.com/browser-market-share/all/belgium`, `/os-market-share/all/belgium`. Monthly granularity, scrape-friendly.

### Commercial tech-stack intelligence (paid but high-value)

- **BuiltWith Lists API** — `https://api.builtwith.com/lists12/api.json?KEY=...&TECH=Snowflake&COUNTRY=BE&META=yes` gives technology-adopter lists with firmographics. $295/mo Basic → $995/mo Team. **Single highest-ROI paid addition** for country-filtered tech adoption.
- **Wappalyzer** — Lookup API v2 (`api.wappalyzer.com/v2/lookup/`) + Lists API. $250–$850/mo; credit-based; live scans cost 5 credits.
- **SimilarWeb API** — country-level filter locked behind **Team tier (~$14,000/yr)**; overkill unless traffic signals are core.
- **Shodan** — `country:BE product:...` filter on `api.shodan.io/shodan/host/search`. $69/mo Freelancer → $1,099/mo Corporate. **Shodan Trends API** (`trends.shodan.io`) gives historical exposure back to 2017 — excellent for **infrastructure** tech adoption (exposed Kubernetes, Postgres versions, TLS adoption).

### Developer-community signals (free)

- **GitHub Search API** — `/search/users?q=location:Belgium+type:user` (self-reported location; 30 req/min authenticated, 1,000 results max per query). GH Archive on BigQuery for event-level historical analysis.
- **Stack Overflow Developer Survey** — annual CSV download at `https://survey.stackoverflow.co/` (2025 edition, 49,000+ responses, ODbL licensed). Filter `Country=="Belgium"`. Self-selected but authoritative baseline.
- **Stack Exchange API 2.3** (`api.stackexchange.com`) — 10,000 req/day with app key. No native country filter; harvest users by `location` substring.
- **Google Trends via pytrends** — unofficial; `geo='BE'`, regional codes `BE-BRU/BE-VLG/BE-WAL`. Rate-limits aggressively; use SerpApi's paid Trends engine for production reliability.

---

## G. Events and community signals

**FOSDEM (Brussels)** — `https://fosdem.org/2026/schedule/xml` (Pentabarf XML), `/schedule/ical`, `/schedule/xcal`. Verified stable URL pattern across years. Fully public, no auth. FOSDEM 2026 is 31 Jan – 1 Feb at ULB.

**Devoxx Belgium** uses its own open-source CFP system (`cfp.devoxx.com`; 2025 at `dvbe25.cfp.dev`, companion app at `m.devoxx.com/events/dvbe25/schedule`). Reverse-engineer the internal JSON endpoints (`/api/public/schedules/{date}`, `/talks`, `/speakers`) via browser dev tools — no published contract but stable.

**Techorama** (11–13 May 2026, Antwerp) uses **Sessionize**: `https://sessionize.com/api/v2/{endpointId}/view/{Sessions|Speakers|GridSmart|All}`. The endpoint ID is the only "auth". JSON/XML/iCal formats.

**Meetup.com — paywalled**. Since Feb 2025 the **GraphQL API at `https://api.meetup.com/gql-ext` is the only interface**; all legacy REST keys retired. OAuth 2.0 Bearer token requires a **Meetup Pro subscription** (~$98–165/month) and approval. RSS fallback still works: `https://www.meetup.com/{urlname}/events/rss/`. iCal became login-gated ~2023. **Workaround: openrss.org prefix** on any Meetup URL generates a working feed. Key Belgian groups to track: `pydata-belgium`, `python-user-group-belgium`, `generative-ai-belgium`, `theaitalksmeetup`, `school-of-ai-brussels`, `producttank-belgium`, `ux-belgium`, `big-data-developers-in-brussels`, `le-wagon-brussels-coding-bootcamp`, Belgium Kubernetes Meetup, Belgium HashiCorp User Group, dataMinds.be, Belgium NLP Meetup, Belgian PyTorch Meetup.

**Eventbrite API** — `/v3/events/{id}/`, `/organizations/{id}/events/` work; **public event search deprecated 20 Feb 2020**. Discover Belgian organizer/venue IDs by scraping `eventbrite.com/d/belgium--brussels-capital-region/events/` (schema.org Event JSON-LD embedded). Free, OAuth bearer, 1,000 calls/hr.

**Hacker News** — free, no auth, two complementary APIs. **Firebase** (`https://hacker-news.firebaseio.com/v0/item/{id}.json`, `/user/{name}.json`, `/topstories.json`, `/jobstories.json`, `/maxitem.json`, `/updates.json`) for real-time. **Algolia HN Search** (`https://hn.algolia.com/api/v1/search_by_date?tags=story,author_whoishiring` and `/items/{thread_id}` returning full nested-comments tree) for filtering "Who is Hiring" monthly threads. Belgium signal: post-retrieval regex on `Belgium|Brussels|Antwerp|Ghent|Gent|Leuven|Liège`.

**Reddit** — OAuth at `https://oauth.reddit.com/`; free non-commercial at 100 QPM, **commercial $0.24 per 1,000 calls** post-June 2023. Belgian subs: `r/belgium`, `r/BelgiumTech`, `r/belgium_jobs`, `r/ItBelgium`. RSS fallback: `https://www.reddit.com/r/belgium/new/.rss`.

**Confs.tech** (Lanyrd's replacement) — free MIT-licensed JSON at `https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/{year}/{topic}.json`. Filter `country==="Belgium"`.

---

## H. Government and institutional data

**Eurostat** is the single most important harmonized source. Three API flavors all free, no auth:
- **SDMX 2.1**: `https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/{DATASET}/{KEY}`
- **SDMX 3.0**: `.../sdmx/3.0/data/dataflow/ESTAT/{DATASET}/1.0?c[geo]=BE&c[TIME_PERIOD]=ge:2015`
- **Simpler JSON-stat**: `.../statistics/1.0/data/{DATASET}?format=JSON&geo=BE`

**Critical dataset codes for Digital Skills Radar**: `isoc_sks_itspt` (ICT specialists employed, % of total), `isoc_sks_itsps` (by sex), `isoc_skslf` (by age/education/NACE/ISCO), `isoc_sk_dskl_i21` (digital skills level — DESI KPI), `isoc_ske_itrcrn` (enterprises recruiting ICT specialists), `isoc_ske_itspen` (enterprises employing ICT specialists), `isoc_ske_ittn2` (ICT training), `isoc_cicce_use` (cloud use by enterprises), `isoc_eb_ai` (AI use by enterprises), `lfsa_egan22d`/`lfsq_egan22d` (employment by NACE incl. J), `jvs_a_rate_r2` (job vacancy rate). Regional geo codes: `BE1` Brussels, `BE2` Flanders, `BE3` Wallonia.

**Statbel (Belgian federal statistics)**: be.STAT API at `https://bestat.statbel.fgov.be/bestat/api/views/{UUID}/result/{JSON|XML|CSV|XLS}`. Open-data catalog at `https://statbel.fgov.be/en/open-data`. DCAT-AP-BE harvested by data.gov.be. Free, CC BY 4.0, 4 languages (EN/NL/FR/DE).

**Regional portals** (all Opendatasoft-powered with `/api/explore/v2.1/catalog/datasets/{id}/records`):
- **Flanders (VODAP)**: `https://opendata.vlaanderen.be` (CKAN) + WEWIS labor portal `https://opendata.wewis.vlaanderen.be` (ODS v2.1) — VDAB/knelpuntberoepen datasets.
- **Brussels**: `https://opendata.brussels.be` (ODS) + `https://datastore.brussels`.
- **Wallonia**: `https://www.odwb.be` (ODS) + `https://digitalwallonia.opendatasoft.com` — Digital Wallonia Baromètre Citoyens (citizen digital-skills indicators).
- **Federal**: `https://data.gov.be` (DCAT catalog only — discovery, not hosting).

**Cedefop Skills-OVATE** (online job-ads analytics) — **no REST API**, Tableau Public dashboards with CSV/crosstab download. Methodology: ESCO-tagged OJA + EURES vacancies. Quarterly refresh. Filter country=Belgium; BE NUTS-2 drill-down available (BE10, BE2, BE3). Microdata requires formal research request.

**OECD Data Explorer** — SDMX at `https://sdmx.oecd.org/public/rest/data/{agency},{dataflow},{version}/{key}`, free, 1M observations max per response. `REF_AREA=BEL`. Key flows: `DSD_LFS@DF_IALFS_UNE_M` (unemployment), `DSD_ICT` (ICT sector).

**NBB.Stat** (replaces Belgostat): `https://stat.nbb.be/RestSDMX/sdmx.ashx/GetData/{FLOW}/{KEY}/{START}/{END}`. SDMX-ML 2.0 (older); some 2.1 clients need adapters. Free, no auth.

**ECB Data Portal**: `https://data-api.ecb.europa.eu/service/data/{flow}/{key}?format=jsondata`. Free, SDMX 2.1.

**ILOSTAT**: Bulk CSV at `https://ilostat.ilo.org/data/bulk/` + SDMX at `https://sdmx.ilo.org/rest/`. Free, weekly refresh (Sunday 22:00 Paris). `REF_AREA=BEL`.

**European Data Portal** (`data.europa.eu`): Search API `/api/hub/search/search?country=BE`, SPARQL at `/sparql`. Free.

**Agoria** (Belgian tech federation) — **no API, no RSS, no structured open data**. "Be The Change" labor-market report and Shortage Occupations barometer are PDFs only. Treat as qualitative secondary source.

---

## I. Salary and compensation data

**Blunt finding**: **Belgium has no public salary API.** The major Belgian salary guides are distributed as PDFs:

- **Robert Half Belgium Salary Guide** (`roberthalf.com/be`) — PDF download annual, no structured data export.
- **Hays Belgium Salary Guide** (`hays.be/salary-guide`) — PDF + interactive web tool (not API-exposed).
- **Michael Page / PageGroup** — PDF.
- **Acerta, SD Worx, Partena** (Belgian payroll providers) — publish periodic benchmark reports as PDFs; SD Worx has a B2B HR-data API for clients but no public version.

**Structured sources that do exist**:
- **Statbel Structure of Earnings Survey** — dataset accessible via be.STAT API (see §H); quadrennial reference data by NACE/ISCO/sex/age. Free.
- **Eurostat `earn_ses_agt22`** — mean earnings by NACE including ICT, SDMX-accessible.
- **Salariskompas.be** (Jobat) — web calculator, scrapeable HTML but no API.
- **Glassdoor** — **no public API since 2021** (partner program only).
- **Ravio.com** — real-time compensation benchmarking; REST API available to paying clients (custom contracts, typically tens of thousands EUR/yr); good EU/BE coverage.
- **Figures.hr** — similar; private API for customers.
- **Paylab.com Belgium** — subscription data, HR-integration API for enterprise clients only.
- **Levels.fyi** — unofficial scraping only; weak BE coverage.
- **Payscale** — Peer dataset licensing available enterprise-only.

**Practical recommendation**: Combine Eurostat `earn_ses_agt22` + Statbel Structure of Earnings (authoritative but lagged 1–2 yrs) for baseline; extract PDF tables annually from Robert Half, Hays, SD Worx using PDF parsing (Tabula, Camelot); add Ravio or Figures as a paid premium layer if real-time role-level data is required.

---

## J. Social and community signals

**Twitter/X API 2026 pricing**: Free tier (post-only, 1,500 posts/month), **Basic $200/month** (50k posts read/month), **Pro $5,000/month** (1M read), **Enterprise** custom. Effectively unusable for systematic monitoring at free/Basic tiers — Pro minimum for tracking ~30 Belgian tech influencers at meaningful cadence.

**LinkedIn**: No public data API. **Marketing Developer Platform** (organic posts/campaigns for owned pages) and **Talent Insights API** (hiring data) both require partner program approval + Talent Solutions contract. Scraping public profiles violates ToS (per the *hiQ v. LinkedIn* reversal).

**Bluesky AT Protocol** — **free firehose** at `wss://bsky.network/xrpc/com.atproto.sync.subscribeRepos` + public AppView APIs at `https://public.api.bsky.app/xrpc/`. Belgian media presence growing (e.g., Data News at `datanews.knack.be` on Bluesky as `did:plc:gslnv6kozhydwdign56cbps7`).

**Mastodon** — per-instance public timelines via REST (`/api/v1/timelines/public`); Belgian-relevant instances include `mastodon.social`, `chaos.social`, plus any future `.be`-specific instance.

**YouTube Data API v3** — free 10,000 quota units/day, `key` auth. Track Belgian tech channels (Devoxx, Techorama, VRT tech segments).

**Hacker News "Who is Hiring"** — see §G. Free Firebase API, monthly thread filter via Algolia `tags=author_whoishiring`.

**Belgian tech podcasts with RSS**: Most Belgian tech podcasts distribute via standard RSS (discoverable via getrssfeed.com on their Apple Podcasts URL). Notable examples — **Tech45** (long-running NL-language tech podcast), **Bloovi Podcast**, **Data News podcasts** (published via datanews.knack.be episode pages), **Frankly Speaking (Cronos)**, **Café Startup**, **Agoria podcasts**. For each, extract the `<enclosure>` RSS feed from the Apple Podcasts page source (`feedUrl` field in the embedded JSON) — standard Apple Podcasts discovery pattern.

**Belgian tech Slack/Discord** — no comprehensive public directory. Notable communities: **Belgian Cowboys Slack**, **BeCode alumni Slack** (private), **dataMinds.be Discord**, **Brussels AI Discord**. Most are invite-only; monitoring requires human membership, not API access.

---

## Priority stack recommendation

**Free baseline (Tier 1)**: Tech.eu RSS + EU-Startups RSS + Politico EU section feeds + Euractiv + Trends/Trends-Tendances/Data News/Bloovi RSS (Belgian media) + KBO Open Data (daily CSV) + NBB CBSO Authentic API + TED v3 Search API + VDAB Competent 2 + Le Forem Opendatasoft + ATS job-board APIs (Greenhouse/Lever/Ashby/Workable poll for known BE employers) + Eurostat isoc_* + Statbel be.STAT + Cloudflare Radar + CrUX BigQuery + HTTP Archive BQ join + PyPI BQ + StatCounter CSV + Stack Overflow Survey + HN Firebase/Algolia + Reddit RSS + FOSDEM Pentabarf + Devoxx/Techorama schedule JSON + Confs.tech. **Cost: €0.**

**First paid additions (Tier 2)**: BuiltWith Basic ($295/mo) for country-filtered tech-adopter lists + Dealroom Premium (~€17k/yr) for Belgian startup funding/scaleup data + Shodan Freelancer ($69/mo) for infrastructure exposure. **Total ~€20k/yr.**

**Enterprise additions only if budget and justified (Tier 3)**: Crunchbase Enterprise API, Reuters Connect, FT Content API, Sifted Pro, Trends-TBI API, SimilarWeb Team.

## Key caveats and 2026 deprecations

- **Indeed XML single-source feeds discontinued 31 March 2026** for organic postings; direct ATS integration or multi-source feeds required. Plan migration now.
- **Reuters public RSS discontinued June 2020**; Reuters Connect is the only official route.
- **Meetup API is paywalled** since 2020 and legacy REST killed February 2025; GraphQL requires Pro subscription.
- **Eventbrite public event search deprecated February 2020**; can only fetch known org/venue IDs.
- **Eurostat legacy bulk download decommissioned October 2023**; use the dissemination API.
- **TED API v2 retired around end of September 2025**; build against v3 on `api.ted.europa.eu`. Belgian notices after 25 Oct 2023 are in eForms schema — parser must handle both legacy and eForms.
- **KBO Open Data cadence is daily**, not monthly as older docs suggest.
- **npm exposes zero geographic data** — Belgium tracking for JavaScript packages is effectively impossible at the registry level; proxy via GitHub Belgian-developer activity or Shodan Node.js version detection.
- **GitHub `location:Belgium`** is self-reported, not geolocated — skewed sample.
- **BOSA e-Procurement has no public API or OCDS feed** — below-threshold Belgian tenders only available via scraping or commercial aggregators (which themselves lack APIs).
- **Agoria, Robert Half, Hays, BeCommerce** publish only PDFs — no programmatic access to their primary Belgian market-intelligence reports.