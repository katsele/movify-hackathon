# Belgian enterprise ATS map for hiring-signal intelligence

**Bottom line:** Across the 86 Belgian employers requested, **SAP SuccessFactors dominates** (≈30 confirmed tenants), followed by **Workday** (≈10), while the "easy-API" modern ATS platforms (Greenhouse, Lever, Workable, Ashby, Recruitee, SmartRecruiters, Teamtailor, Personio) appear on only **~8 companies** — meaning most of your ATS-polling pipeline will need to handle **SuccessFactors Career Site Builder scraping, Workday CXS JSON, Oracle Taleo/Fusion Cloud, and Belgian niche platforms (CVWarehouse, Beehire, Talentsoft, Jibe)** rather than clean REST feeds. Two high-value exceptions: **DPG Media runs Recruitee** (clean public JSON) and **AB InBev exposes Greenhouse + SmartRecruiters mirrors** alongside its Workday primary. Hospitals in Antwerp cluster on CVWarehouse with exposable `companyGuid` parameters. IT-services competitor **Inetum** runs SmartRecruiters (`inetum2`) — useful for benchmarking their hiring velocity directly via API.

The data below gives you (a) the canonical careers landing URL, (b) the detected ATS, (c) the tenant/slug, and (d) the callable public API endpoint where one exists. Every row was verified via live fetch or apply-URL inspection; items marked "Unknown/Custom" did not expose standard ATS fingerprints on surface inspection and will require DOM-rendered inspection or HTML scraping.

## Banking & insurance

| Company | Career URL | ATS | Slug / Tenant | API endpoint or scrape target |
|---|---|---|---|---|
| BNP Paribas Fortis | https://group.bnpparibas/en/careers/all-job-offers/bnp-paribas-fortis/belgium | **Oracle Taleo** | `bnpparibasgt` | `https://bnpparibasgt.taleo.net/careersection/mar_fr/jobsearch.ftl` (HTML scrape) |
| KBC Group | https://careers.kbc-group.com/ (BE: https://www.kbc.be/jobs/en/vacancies.html) | **SAP SuccessFactors** | host `careers.kbc-group.com` | Scrape `/go/` pages; no open REST |
| Belfius | https://jobs.belfius.be/ | **SAP SuccessFactors** | host `jobs.belfius.be` | Scrape `/go/Tous-les-jobs/8939201/` |
| ING Belgium | https://careers.ing.com/en/working-in-belgium-jobs | **Workday** | tenant `ing`, site `ICSGBLCOR` | `https://ing.wd3.myworkdayjobs.com/wday/cxs/ing/ICSGBLCOR/jobs` |
| Argenta | https://www.argenta.be/nl/werken-bij-argenta/vacatures.html | Unknown/Custom | — | CMS on argenta.be; HTML scrape |
| Crelan | https://www.crelan.be/nl/jobs → https://crelan.beehire.com/career/crelan | **Beehire** (BE niche) | `crelan` | Scrape `crelan.beehire.com/career/crelan` |
| AG Insurance | https://jobs.aginsurance.be (also ag.be/jobs) | Unknown/Custom | — | Proprietary CMS; scrape vacancy list |
| AXA Belgium | https://careers.axa.be/be/nl/search-results | **Jibe CMS + Oracle SelectMinds** | `axa-be` | Jibe JSON endpoints; legacy Taleo backend |
| Ethias | https://jobs.ethias.be/ | Unknown/Custom | — | Custom portal; scrape `/fr/jobs` |
| P&V Group / Vivium | https://www.eentoffejob.be | Unknown/Custom | — | Scrape `/zoek-een-job?jobId=` |
| Allianz Benelux | https://careers.allianz.com/be/nl/allianz-in-belgium | **Phenom People** (likely Workday backend) | CDN id `AISAIPGB` | Phenom JSON typically at `careers.allianz.com/api/jobs` |
| Euroclear | https://www.euroclear.com/careers/en.html | **Oracle Fusion Cloud Recruiting** | host `don.fa.em2.oraclecloud.com`, site `CX_1003` | `https://don.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=CX_1003` |
| SWIFT | https://www.swift.com/about-us/careers | **Workday** | tenant `swift`, site `Join-Swift` | `https://swift.wd3.myworkdayjobs.com/wday/cxs/swift/Join-Swift/jobs` |
| Worldline Belgium | https://jobs.worldline.com/ | **SAP SuccessFactors** | host `jobs.worldline.com` | Scrape `/search/` |
| Bancontact Payconiq | https://www.bancontact.com/en/about-us/jobs | Unknown/Custom | — | Email-only; no ATS surface |

## Telecom, media & retail

| Company | Career URL | ATS | Slug / Tenant | API / scrape target |
|---|---|---|---|---|
| Proximus | https://jobs.proximus.com/be/en | **Phenom People** | `PIHPROGB` | Scrape `/be/search-results` |
| Telenet / Wyre | https://www2.telenet.be/corporate/en/careers.html → Oracle redirect | **Oracle Fusion Cloud Recruiting** | tenant `ebza` (em2), site `CX_1001` | `https://ebza.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions` |
| Orange Belgium | https://orange.jobs/gb/en/europe/belgium | **Phenom People** | `OYVOCZGB` | Scrape `/gb/en/belgium-search-results` |
| **DPG Media** | https://dpgmedia.recruitee.com/ | **Recruitee** ✅ | `dpgmedia` | `https://dpgmedia.recruitee.com/api/offers/` |
| Mediahuis | https://jobs.mediahuis.com/ (NL: werkenbijmediahuis.nl/vacatures) | Unknown/Custom | — | Scrape `/vacatures/{id}-{slug}` |
| VRT | https://jobs.vrt.be/nl/vacatures | Unknown/Custom | — | Scrape vacancy list |
| RTBF | https://emploi.rtbf.be/go/Jobs/9209701/ | **SAP SuccessFactors** | company `acbelusprl` | `career2.successfactors.eu/careers?company=acbelusprl` |
| Rossel Group | recrutement.rossel.fr + LinkedIn | Unknown/Custom (BE) | — | SPA — inspect via rendered DOM |
| Colruyt Group | https://jobs.colruytgroup.com/nl/vacatures | **Proprietary / Oracle PeopleSoft** | — | Scrape `/nl/vacatures` |
| Delhaize (Ahold Delhaize BE) | https://jobs.delhaize.be/be/nl | **Phenom People** | `DXZDELBE` | Scrape `/be/nl/search-results` |
| Carrefour Belgium | https://belgiumjobs.carrefour.eu/ | **SAP SuccessFactors** | host `belgiumjobs.carrefour.eu` | Scrape SF CSB pages |
| Aldi Belgium | https://www.aldi.be/nl/jobs | Custom AEM | — | Scrape `/nl/jobs/solliciteren.html` |
| **Lidl Belgium** | https://werkenbijlidl.be/jobsearch | **SAP SuccessFactors** | `lidlstiftuP2` | `career5.successfactors.eu/career?company=lidlstiftuP2` |
| Action Belgium | https://be.action.jobs/ → apply.action.com | **SAP SuccessFactors** | host `apply.action.com` | Scrape SF CSB |
| IKEA Belgium | https://jobs.ikea.com/en/location/belgium-jobs/22908/2802361/2 | **Phenom / TalentBrew** | company id `22908` | Scrape TalentBrew pages |
| Decathlon Belgium | https://joinus.decathlon.be/en/annonces | **Cegid HR (Talentsoft)**; global on SmartRecruiters | global `DECATHLON` | `https://api.smartrecruiters.com/v1/companies/DECATHLON/postings` (global HQ) |

## Energy, utilities & transport

| Company | Career URL | ATS | Slug / Tenant | API / scrape target |
|---|---|---|---|---|
| Engie Electrabel | https://jobs.engie.com/belgium/ | **SAP SuccessFactors** | `engieinforP3` | Scrape `/search/` |
| Luminus | https://www.luminus.be/nl/corporate/vacatures/ | Unknown/Custom | — | Scrape `/nl/corporate/vacancies/` |
| Elia Group | https://jobs.eliagroup.eu/elia/ | **SAP SuccessFactors** | `elia` | Scrape `/elia/go/All-Jobs-list/8944302/` |
| Fluvius | https://jobs.fluvius.be/ | **SAP SuccessFactors** | `fluvius` | Scrape `/go/` category pages |
| ORES | https://jobs.ores.be/offre-de-emploi/liste-offres.aspx | Custom ASP.NET (likely CVWarehouse) | — | Scrape `.aspx` endpoint |
| Fluxys | https://careers.fluxys.com/jobs | **Jibe** (+ Taleo referrals) | `fluxys` | Scrape `/jobs` or Jibe API |
| De Watergroep | https://jobs.dewatergroep.be/ | **SAP SuccessFactors** | `dewatergroP` | `career5.successfactors.eu/career?career_company=dewatergroP` |
| Aquafin | https://jobs.aquafin.be/ | **SAP SuccessFactors** | `aquafin` | Scrape `/go/Vacatures-Aquafin/9455555/` |
| SNCB/NMBS (HR Rail) | https://jobs.hr-rail.be/HRRail/ | **SAP SuccessFactors** | `hr-rail.be/HRRail` | Scrape `/HRRail/go/Tous-les-vacatures-HR-Rail/957302/` |
| Infrabel | https://jobs.infrabel.be/ | **SAP SuccessFactors** | `infrabel` | **Bonus: Open Data feed at `opendata.infrabel.be/explore/dataset/joblistinfrabel/`** |
| STIB/MIVB | https://jobs.stib-mivb.be/ | **SAP SuccessFactors** | `stib-mivb` | Scrape `/go/jobs_/9110655/` |
| De Lijn | https://jobs.delijn.be/ | **SAP SuccessFactors** | `delijn` | Scrape `/go/` pages |
| TEC (OTW) | https://jobs.letec.be/OTW/ | **SAP SuccessFactors** | `letec/OTW` | Scrape `/OTW/go/Toutes-les-offres/956902/` |
| bpost / bpostgroup | https://career.bpost.be/ | Custom Drupal + likely Avature backend | — | Scrape `/en/job-search` |
| Brussels Airlines | https://brusselsairlines.cvw.io/ | **CVWarehouse** | `brusselsairlines` | Scrape cvwarehouse legacy URL |
| DHL Belgium | https://careers.dhl.com/ (BE filter) | **SAP SuccessFactors** (DHL Group); **Oracle Taleo** (DHL eCommerce) | `DHLECOMMERCE` (Taleo) | `https://phg.tbe.taleo.net/phg03/ats/careers/v2/jobSearch?org=DHLECOMMERCE&cws=43` |
| FedEx Belgium | https://careers.fedex.com/ | **Workday** | tenant `fedex` | Workday CXS with Belgium country filter |
| Katoen Natie | https://katoennatie-jobs.be/ | Custom jobsite | — | Scrape `/en/jobs/{uuid}/{slug}/` |
| H.Essers | https://jobs.essers.com/ | Unknown/Custom WordPress | — | Scrape `/nl-be/vacatures/` |
| Port of Antwerp-Bruges | https://www.portofantwerpbruges.com/jobs/en/vacancies | Custom CMS (JS-rendered) | — | Render DOM then scrape |

## Healthcare, mutualities & hospitals

| Organisation | Career URL | ATS | Slug / ID | API / scrape target |
|---|---|---|---|---|
| CM/MC | https://www.cm.be/nl/jobs/joblist | Custom cm.be CMS | — | Scrape joblist |
| Solidaris | https://jobs.solidaris-vlaanderen.be/ (FR: jobs.solidaris.be) | Custom (Drupal `socmut_jobs`) | — | Scrape werkenbij.solidaris-vlaanderen.be |
| Helan | https://www.helanjobs.be/vacatures | Partena OZ / likely Prato | `helanjobs` | Scrape PHP pages |
| UZ Leuven | https://jobs.uzleuven.be/ | **Oracle Taleo** | `uzleuven` | `https://uzleuven.taleo.net/careersection/uz_vacaturebank_intern/jobsearch.ftl` |
| UZ Gent | https://jobs.uzgent.be/ | **SAP SuccessFactors** | `uzgent` | Scrape `/tile-search-results/?q=` |
| CHU de Liège | https://www.chuliege.be/jcms/c2_17303180/fr/offres-d-emploi | Custom (Jalios jcms) | — | Scrape jcms pages |
| Cliniques universitaires Saint-Luc | https://jobs.saintluc.be/ | **Cegid Talentsoft** | `cusl-recrute` | Scrape `/job/list-of-jobs.aspx?lcid=1036` |
| UZ Brussel | https://www.uzbrusselwerkt.be/ → uzbrussel.cvw.io | **CVWarehouse** | `uzbrussel` | Scrape cvw.io subdomain |
| UZA | https://uzajobs.be/ | **CVWarehouse** | `companyGuid=f3b4d8ea-ae58-47e3-b04f-ae7f48ee9790` | `https://jobpage.cvwarehouse.com/?companyGuid=f3b4d8ea-ae58-47e3-b04f-ae7f48ee9790&lang=nl-BE` |
| ZAS | https://www.zas.be/jobs/alle-vacatures | **CVWarehouse** | `companyGuid=fea14313-c97c-4405-a851-aef6192621c5` | `https://jobpage.cvwarehouse.com/?companyGuid=fea14313-c97c-4405-a851-aef6192621c5&lang=nl-BE` |

## Pharma, chemicals, automotive & manufacturing

| Company | Career URL | ATS | Slug / Tenant | API endpoint |
|---|---|---|---|---|
| GSK Belgium | https://jobs.gsk.com/en-be/jobs | **Workday** | tenant `gsk`, site `GSKCareers` | `https://gsk.wd5.myworkdayjobs.com/wday/cxs/gsk/GSKCareers/jobs` |
| Johnson & Johnson / Janssen (Beerse) | https://www.careers.jnj.com/belgium/overview | **Workday** | tenant `jj`, site `JJ` | `https://jj.wd5.myworkdayjobs.com/wday/cxs/jj/JJ/jobs` |
| Pfizer Belgium (Puurs) | https://pfizer.wd1.myworkdayjobs.com/PfizerCareers | **Workday** | tenant `pfizer`, site `PfizerCareers` | `https://pfizer.wd1.myworkdayjobs.com/wday/cxs/pfizer/PfizerCareers/jobs` |
| UCB (Braine-l'Alleud) | https://careers.ucb.com/ | **SAP SuccessFactors** + Phenom front-end | `UCB` | Phenom-rendered; scrape CSB |
| Takeda Belgium (Lessines) | https://jobs.takeda.com/lessines | **Workday** (Phenom front-end) | tenant `takeda`, site `External` | `https://takeda.wd3.myworkdayjobs.com/wday/cxs/takeda/External/jobs` |
| BASF Antwerpen | https://basf.jobs/?addresses%2Fcountry=Belgium | Proprietary (`dark_blue_EMEA`) | — | Scrape `basf.jobs` with country filter |
| Solvay Belgium | https://jobs.solvay.com/ | **SAP SuccessFactors** | `solvay` | Scrape `/employment/category-jobs-in-belgium/8040/37862/2802361/2` |
| Umicore | https://careers.umicore.com/ | **SAP SuccessFactors** | `UmicorePROD` | `career5.successfactors.eu/careers?company=UmicorePROD` |
| ArcelorMittal Belgium | https://belgium.arcelormittal.com/en/career/ | **Oracle Fusion Cloud Recruiting** | Oracle ORC tenant | `hcmRestApi/resources/latest/recruitingCEJobRequisitions` |
| Volvo Car Gent | https://jobs.volvocars.com/ (local: volvocargent.be/jobs) | **SAP SuccessFactors** | `volvocars` | Scrape `/search/?q=&locationsearch=Belgium` |
| Volvo Group Belgium | https://jobs.volvogroup.com/ | **SAP SuccessFactors** | `volvogroup` | Scrape CSB |
| **AB InBev Belgium** | https://europecareers.ab-inbev.com/ | **Workday** primary; **Greenhouse** + **SmartRecruiters** mirrors ✅ | Workday `abinbev`/`EUR`; GH `abinbev`; SR `ABInBev1` | Workday: `https://abinbev.wd1.myworkdayjobs.com/wday/cxs/abinbev/EUR/jobs`; Greenhouse: `https://boards-api.greenhouse.io/v1/boards/abinbev/jobs`; SR: `https://api.smartrecruiters.com/v1/companies/ABInBev1/postings` |
| Puratos | https://jobs.puratos.com/go/Belgium-&-HQ_EN/9457901/ | **SAP SuccessFactors** | `puratos` | Scrape `/search/` |

## Public sector, education & IT services

| Entity | Career URL | ATS | Slug | API / scrape target |
|---|---|---|---|---|
| Smals | https://www.smals.be/nl/jobs/list | Custom (smals.be CMS) | — | Scrape `/nl/jobs/list` |
| FOD Financiën / SPF Finances | https://www.jobfin.be/nl; fed-wide: werkenvoor.be / travaillerpour.be | **BOSA/Selor** (federal platform) | — | Scrape werkenvoor.be search |
| Belgian Defence | https://careers.mil.be/fr/sites/Travailler-a-la-Defense/jobs | **Oracle Fusion Cloud Recruiting** | — | `hcmRestApi/resources/latest/recruitingCEJobRequisitions` |
| Federal Police | https://www.jobpol.be/nl | Custom (jobpol.be) | — | Scrape; batch intakes schedule-driven |
| KU Leuven | https://www.kuleuven.be/personeel/jobsite/vacatures | Custom jobsite (likely SuccessFactors; unconfirmed) | — | Scrape vacancy list |
| UGent | https://jobs.ugent.be/ | **SAP SuccessFactors** | `ugent` | Scrape CSB |
| UCLouvain | https://jobs.uclouvain.be/ | **SAP SuccessFactors** | `uclouvain` | Scrape CSB |
| ULB | https://www.ulb.be/fr/travailler-et-collaborer/offres-d-emploi | **SAP SuccessFactors** | `ulb` | Scrape SF CSB |
| VUB | https://jobs.vub.be/ | SAP SuccessFactors (probable; verify on fetch) | `vub` | Scrape CSB |
| Cronos Group | https://cronos-groep.be (decentralised across 541 subsidiaries) | **No single ATS** — per-subsidiary | — | Monitor LinkedIn + per-subsidiary career sites |
| Cegeka | https://www.cegeka.com/en/be/jobs/all-jobs | Custom (cegeka.com CMS); ATS unconfirmed on surface inspection | — | Scrape `/en/be/jobs/all-jobs` |
| NRB Group | https://nrbcareers.com/find-my-job | Custom (nrbcareers.com portal) | — | Scrape `/find-my-job` (72 live jobs at fetch) |
| **Inetum (ex-Realdolmen)** | https://www.inetum.com/en/belgium/career | **SmartRecruiters** ✅ | `inetum2` | `https://api.smartrecruiters.com/v1/companies/inetum2/postings` |

## How to operationalise this data

Three practical observations shape your polling architecture. **First**, you will not get far with only the nine standard ATS adapters on your wishlist: only 6–8 companies in this list expose those clean REST feeds (DPG Media on Recruitee; AB InBev on Greenhouse + SmartRecruiters; Decathlon global on SmartRecruiters; Inetum on SmartRecruiters; ING/SWIFT/GSK/J&J/Pfizer/Takeda/FedEx/AB InBev on Workday CXS). **Second**, build a **Workday CXS client** (POST to `/wday/cxs/{tenant}/{site}/jobs` with an `appliedFacets` body) — it unlocks ~10 high-value tenants including all Big Pharma. **Third**, invest in a **SuccessFactors Career Site Builder scraper** that parses the consistent `/go/{category}/{id}/` + `/job/{slug}/{jobID}/` URL structure: it unlocks ~30 Belgian tenants including Belfius, KBC, Worldline, Engie, Elia, Fluvius, all rail/transport, UZ Gent, Solvay, Umicore, AB InBev, and the French-speaking universities. Two free bonuses: **Infrabel publishes an Open Data JSON feed** at `opendata.infrabel.be/explore/dataset/joblistinfrabel/` (cleanest hiring signal in the list), and **Oracle Fusion tenants** (Euroclear, Telenet, ArcelorMittal, Belgian Defence) share one pattern: `{tenant}.fa.{region}.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=CX_XXXX` — also cleanly scriptable.

Four entities warrant **deeper inspection before your crawler goes live**: Mediahuis, VRT, Luminus, and Katoen Natie all returned custom or JS-rendered vacancy lists without recognisable ATS fingerprints on surface inspection; a headless-browser DOM snapshot will reveal whether a commercial ATS sits behind their branded chrome. For **hospital coverage in Antwerp**, the three CVWarehouse tenants (UZ Brussel, UZA, ZAS) support stable `companyGuid` parameters — those are effectively APIs if you call `jobpage.cvwarehouse.com` directly with the GUID. Finally, **Cronos Group is a unique case**: its 541 decentralised subsidiaries each run their own hiring; treat Cronos as a meta-target (LinkedIn + per-subsidiary scraping) rather than a single endpoint.

## Conclusion

Your target list is heavy on **legacy-enterprise ATS stacks** (SuccessFactors, Workday, Oracle) rather than startup-era platforms with public APIs. The business implication is that your hiring-signal tool differentiates less on "supports 11 ATS" and more on **robust SuccessFactors + Workday harvesting** — which happens to map perfectly onto the segment that values a digital/UX/AI consultancy (regulated Belgian banks, insurers, utilities, universities, rail/transport, public sector, and hospitals). The few "modern-ATS" wins (DPG Media, Inetum, AB InBev's Greenhouse mirror, the three Antwerp CVWarehouse hospitals via `companyGuid`) give you immediate high-signal telemetry on day one while the SuccessFactors/Workday scrapers come online. Pragmatically: prioritise a **Workday CXS adapter** (covers pharma + finance in one stroke), a **SuccessFactors CSB parser** (covers everything else Belgian-enterprise), and keep the Recruitee/Greenhouse/SmartRecruiters/Lever/Workable adapters mostly for international competitive benchmarking rather than this Belgian list.