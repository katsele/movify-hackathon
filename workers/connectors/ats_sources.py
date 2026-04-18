"""ATS tenant map for Belgian named accounts — the joblist that future
`ats_<platform>.py` connectors iterate over.

Source of truth: `docs/research/ats-signals-entreprises.md`. Every row below was
verified in that research via live fetch or apply-URL inspection.

Intended consumer: per-platform connectors (`ats_successfactors.py`,
`ats_workday.py`, `ats_recruitee.py`, ...) filter `ATS_SOURCES` by `ats_type`
and call the API / scrape target listed here.

Key-joining rule: `AtsSource.client_key` reuses the exact value from
`news_clients.TARGET_CLIENTS.key` when the same organisation exists in both
rosters. This lets the forecast engine boost confidence when a news signal and
an ATS signal converge on the same client. A handful of keys are ATS-only:
- `fluxys`, `de_watergroep`, `aquafin` — below-threshold FTE, excluded from the
  news roster per `news_clients.py` docstring, but still publish jobs worth
  polling.
- `inetum`, `cegeka`, `nrb_group`, `cronos_group` — ICT vendors explicitly
  excluded from the news roster as Movify's competitors; kept here for hiring-
  velocity benchmarking.
- `bancontact_payconiq` — folded into `worldline_be` for news matching (it's an
  alias) but listed separately in the research doc, so carried across for
  completeness.

Three free-win REST feeds flagged in the research doc; implement these first:
- DPG Media on Recruitee: `https://dpgmedia.recruitee.com/api/offers/`
- AB InBev on Greenhouse + SmartRecruiters mirrors (alongside Workday primary)
- Infrabel on Open Data JSON: `opendata.infrabel.be/explore/dataset/joblistinfrabel/`

Rows marked `ats_type="unknown"` + `scrape_method="dom_render_required"` are the
worklist for the follow-up headless-browser inspection task (research doc §128
flags Mediahuis, VRT, Luminus, Katoen Natie as needing DOM snapshots before a
crawler goes live).
"""
from __future__ import annotations

from dataclasses import dataclass


ATS_TYPES: frozenset[str] = frozenset({
    "successfactors",    # SAP SuccessFactors (Career Site Builder)
    "workday",           # Workday CXS
    "oracle_taleo",      # legacy Taleo careersection
    "oracle_fusion",     # Oracle Fusion Cloud Recruiting (hcmRestApi)
    "greenhouse",        # boards-api.greenhouse.io
    "smartrecruiters",   # api.smartrecruiters.com/v1
    "recruitee",         # <slug>.recruitee.com/api/offers/
    "phenom",            # Phenom People (often over Workday)
    "cvwarehouse",       # jobpage.cvwarehouse.com?companyGuid=...
    "beehire",           # <slug>.beehire.com
    "talentsoft",        # Cegid HR / Talentsoft
    "jibe",              # Jibe CMS (legacy Taleo backend)
    "custom",            # proprietary CMS, no ATS fingerprint
    "unknown",           # needs headless DOM inspection
})

SCRAPE_METHODS: frozenset[str] = frozenset({
    "rest_api",              # clean JSON (Recruitee, Greenhouse, SmartRecruiters)
    "workday_cxs",           # POST /wday/cxs/{tenant}/{site}/jobs
    "oracle_fusion_rest",    # GET hcmRestApi/.../recruitingCEJobRequisitions
    "successfactors_csb",    # parse /go/{category}/{id}/ + /job/{slug}/{jobID}/
    "taleo_html",            # Taleo careersection HTML
    "cvwarehouse_guid",      # jobpage.cvwarehouse.com?companyGuid=...
    "phenom_json",           # Phenom /api/jobs (varies)
    "opendata",              # Infrabel open-data JSON (unique)
    "html_scrape",           # bespoke DOM scrape
    "dom_render_required",   # SPA — needs headless browser
    "none",                  # no ATS surface (e.g. email-only applications)
})


@dataclass(frozen=True)
class AtsSource:
    client_key: str                  # matches TARGET_CLIENTS.key where applicable
    company_name: str
    career_url: str
    ats_type: str                    # one of ATS_TYPES
    tenant_slug: str | None          # platform identifier (subdomain, company param, guid)
    api_endpoint: str | None         # callable REST URL; None means HTML-only
    scrape_method: str               # one of SCRAPE_METHODS
    sector: str                      # aligns with news_clients industries where possible
    notes: str | None = None


ATS_SOURCES: list[AtsSource] = [
    # ---- Banking & insurance --------------------------------------------
    AtsSource(
        "bnpp_fortis", "BNP Paribas Fortis",
        "https://group.bnpparibas/en/careers/all-job-offers/bnp-paribas-fortis/belgium",
        "oracle_taleo", "bnpparibasgt",
        "https://bnpparibasgt.taleo.net/careersection/mar_fr/jobsearch.ftl",
        "taleo_html", "banking",
    ),
    AtsSource(
        "kbc", "KBC Group",
        "https://careers.kbc-group.com/",
        "successfactors", "careers.kbc-group.com",
        None, "successfactors_csb", "banking",
        notes="BE jobs also surfaced at https://www.kbc.be/jobs/en/vacancies.html",
    ),
    AtsSource(
        "belfius", "Belfius",
        "https://jobs.belfius.be/",
        "successfactors", "jobs.belfius.be",
        "https://jobs.belfius.be/go/Tous-les-jobs/8939201/",
        "successfactors_csb", "banking",
    ),
    AtsSource(
        "ing_be", "ING Belgium",
        "https://careers.ing.com/en/working-in-belgium-jobs",
        "workday", "ing/ICSGBLCOR",
        "https://ing.wd3.myworkdayjobs.com/wday/cxs/ing/ICSGBLCOR/jobs",
        "workday_cxs", "banking",
    ),
    AtsSource(
        "argenta", "Argenta",
        "https://www.argenta.be/nl/werken-bij-argenta/vacatures.html",
        "unknown", None, None, "dom_render_required", "banking",
        notes="Proprietary argenta.be CMS; needs DOM snapshot to confirm ATS",
    ),
    AtsSource(
        "crelan", "Crelan",
        "https://crelan.beehire.com/career/crelan",
        "beehire", "crelan",
        "https://crelan.beehire.com/career/crelan",
        "html_scrape", "banking",
    ),
    AtsSource(
        "ag_insurance", "AG Insurance",
        "https://jobs.aginsurance.be",
        "custom", None, None, "html_scrape", "insurance",
        notes="Proprietary CMS; also reachable at ag.be/jobs",
    ),
    AtsSource(
        "axa_be", "AXA Belgium",
        "https://careers.axa.be/be/nl/search-results",
        "jibe", "axa-be", None, "html_scrape", "insurance",
        notes="Jibe front-end over legacy Oracle SelectMinds / Taleo backend",
    ),
    AtsSource(
        "ethias", "Ethias",
        "https://jobs.ethias.be/",
        "custom", None, None, "html_scrape", "insurance",
    ),
    AtsSource(
        "pv_vivium", "P&V / Vivium",
        "https://www.eentoffejob.be",
        "custom", None, None, "html_scrape", "insurance",
        notes="Scrape /zoek-een-job?jobId=",
    ),
    AtsSource(
        "allianz_benelux", "Allianz Benelux",
        "https://careers.allianz.com/be/nl/allianz-in-belgium",
        "phenom", "AISAIPGB",
        "https://careers.allianz.com/api/jobs",
        "phenom_json", "insurance",
        notes="Phenom front-end likely over Workday backend; JSON endpoint unverified",
    ),
    AtsSource(
        "euroclear", "Euroclear",
        "https://www.euroclear.com/careers/en.html",
        "oracle_fusion", "don.fa.em2.oraclecloud.com/CX_1003",
        "https://don.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=CX_1003",
        "oracle_fusion_rest", "banking",
    ),
    AtsSource(
        "swift", "SWIFT",
        "https://www.swift.com/about-us/careers",
        "workday", "swift/Join-Swift",
        "https://swift.wd3.myworkdayjobs.com/wday/cxs/swift/Join-Swift/jobs",
        "workday_cxs", "banking",
    ),
    AtsSource(
        "worldline_be", "Worldline Belgium",
        "https://jobs.worldline.com/",
        "successfactors", "jobs.worldline.com",
        None, "successfactors_csb", "banking",
        notes="Scrape /search/",
    ),
    AtsSource(
        "bancontact_payconiq", "Bancontact Payconiq",
        "https://www.bancontact.com/en/about-us/jobs",
        "unknown", None, None, "none", "banking",
        notes="Email-only applications; no ATS surface. Worldline subsidiary — alias of worldline_be for news matching.",
    ),

    # ---- Telecom, media & retail ----------------------------------------
    AtsSource(
        "proximus", "Proximus",
        "https://jobs.proximus.com/be/en",
        "phenom", "PIHPROGB",
        None, "html_scrape", "telecom",
        notes="Scrape /be/search-results; Phenom JSON endpoint unverified",
    ),
    AtsSource(
        "telenet", "Telenet / Wyre",
        "https://www2.telenet.be/corporate/en/careers.html",
        "oracle_fusion", "ebza/CX_1001",
        "https://ebza.fa.em2.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?finder=findReqs;siteNumber=CX_1001",
        "oracle_fusion_rest", "telecom",
    ),
    AtsSource(
        "orange_be", "Orange Belgium",
        "https://orange.jobs/gb/en/europe/belgium",
        "phenom", "OYVOCZGB",
        None, "html_scrape", "telecom",
        notes="Scrape /gb/en/belgium-search-results",
    ),
    AtsSource(
        "dpg_media", "DPG Media",
        "https://dpgmedia.recruitee.com/",
        "recruitee", "dpgmedia",
        "https://dpgmedia.recruitee.com/api/offers/",
        "rest_api", "media",
        notes="FREE WIN: clean public JSON feed — implement first",
    ),
    AtsSource(
        "mediahuis", "Mediahuis",
        "https://jobs.mediahuis.com/",
        "unknown", None, None, "dom_render_required", "media",
        notes="NL also at werkenbijmediahuis.nl/vacatures; needs DOM snapshot",
    ),
    AtsSource(
        "vrt", "VRT",
        "https://jobs.vrt.be/nl/vacatures",
        "unknown", None, None, "dom_render_required", "media",
        notes="Needs DOM snapshot to confirm ATS fingerprint",
    ),
    AtsSource(
        "rtbf", "RTBF",
        "https://emploi.rtbf.be/go/Jobs/9209701/",
        "successfactors", "acbelusprl",
        "https://career2.successfactors.eu/careers?company=acbelusprl",
        "successfactors_csb", "media",
    ),
    AtsSource(
        "rossel", "Rossel Group",
        "https://recrutement.rossel.fr",
        "unknown", None, None, "dom_render_required", "media",
        notes="BE roles fragmented across LinkedIn + SPA site",
    ),
    AtsSource(
        "colruyt", "Colruyt Group",
        "https://jobs.colruytgroup.com/nl/vacatures",
        "custom", None, None, "html_scrape", "retail",
        notes="Likely Oracle PeopleSoft backend — proprietary front-end",
    ),
    AtsSource(
        "delhaize", "Delhaize (Ahold Delhaize BE)",
        "https://jobs.delhaize.be/be/nl",
        "phenom", "DXZDELBE",
        None, "html_scrape", "retail",
        notes="Scrape /be/nl/search-results",
    ),
    AtsSource(
        "carrefour_be", "Carrefour Belgium",
        "https://belgiumjobs.carrefour.eu/",
        "successfactors", "belgiumjobs.carrefour.eu",
        None, "successfactors_csb", "retail",
    ),
    AtsSource(
        "aldi_be", "Aldi Belgium",
        "https://www.aldi.be/nl/jobs",
        "custom", None, None, "html_scrape", "retail",
        notes="Custom AEM — scrape /nl/jobs/solliciteren.html",
    ),
    AtsSource(
        "lidl_be", "Lidl Belgium",
        "https://werkenbijlidl.be/jobsearch",
        "successfactors", "lidlstiftuP2",
        "https://career5.successfactors.eu/career?company=lidlstiftuP2",
        "successfactors_csb", "retail",
    ),
    AtsSource(
        "action_be", "Action Belgium",
        "https://be.action.jobs/",
        "successfactors", "apply.action.com",
        None, "successfactors_csb", "retail",
    ),
    AtsSource(
        "ikea_be", "IKEA Belgium",
        "https://jobs.ikea.com/en/location/belgium-jobs/22908/2802361/2",
        "phenom", "22908",
        None, "html_scrape", "retail",
        notes="Phenom / TalentBrew stack",
    ),
    AtsSource(
        "decathlon_be", "Decathlon Belgium",
        "https://joinus.decathlon.be/en/annonces",
        "smartrecruiters", "DECATHLON",
        "https://api.smartrecruiters.com/v1/companies/DECATHLON/postings",
        "rest_api", "retail",
        notes="Local BE front-end is Cegid/Talentsoft; global HQ exposes SmartRecruiters API",
    ),

    # ---- Energy, utilities & transport ----------------------------------
    AtsSource(
        "engie_electrabel", "Engie Electrabel",
        "https://jobs.engie.com/belgium/",
        "successfactors", "engieinforP3",
        None, "successfactors_csb", "energy",
        notes="Scrape /search/",
    ),
    AtsSource(
        "luminus", "Luminus",
        "https://www.luminus.be/nl/corporate/vacatures/",
        "unknown", None, None, "dom_render_required", "energy",
        notes="Needs DOM snapshot to confirm ATS fingerprint",
    ),
    AtsSource(
        "elia", "Elia Group",
        "https://jobs.eliagroup.eu/elia/",
        "successfactors", "elia",
        "https://jobs.eliagroup.eu/elia/go/All-Jobs-list/8944302/",
        "successfactors_csb", "energy",
    ),
    AtsSource(
        "fluvius", "Fluvius",
        "https://jobs.fluvius.be/",
        "successfactors", "fluvius",
        None, "successfactors_csb", "energy",
    ),
    AtsSource(
        "ores", "ORES",
        "https://jobs.ores.be/offre-de-emploi/liste-offres.aspx",
        "custom", None, None, "html_scrape", "energy",
        notes="ASP.NET front-end, likely CVWarehouse backend — confirm on scrape",
    ),
    AtsSource(
        "fluxys", "Fluxys",
        "https://careers.fluxys.com/jobs",
        "jibe", "fluxys",
        None, "html_scrape", "energy",
        notes="Jibe + Taleo referrals. ATS-only key: Fluxys excluded from news roster (below-threshold FTE).",
    ),
    AtsSource(
        "de_watergroep", "De Watergroep",
        "https://jobs.dewatergroep.be/",
        "successfactors", "dewatergroP",
        "https://career5.successfactors.eu/career?career_company=dewatergroP",
        "successfactors_csb", "energy",
        notes="ATS-only key: below-threshold FTE, excluded from news roster.",
    ),
    AtsSource(
        "aquafin", "Aquafin",
        "https://jobs.aquafin.be/",
        "successfactors", "aquafin",
        "https://jobs.aquafin.be/go/Vacatures-Aquafin/9455555/",
        "successfactors_csb", "energy",
        notes="ATS-only key: below-threshold FTE, excluded from news roster.",
    ),
    AtsSource(
        "sncb", "SNCB/NMBS (HR Rail)",
        "https://jobs.hr-rail.be/HRRail/",
        "successfactors", "hr-rail.be/HRRail",
        "https://jobs.hr-rail.be/HRRail/go/Tous-les-vacatures-HR-Rail/957302/",
        "successfactors_csb", "transport_operator",
    ),
    AtsSource(
        "infrabel", "Infrabel",
        "https://jobs.infrabel.be/",
        "successfactors", "infrabel",
        "https://opendata.infrabel.be/explore/dataset/joblistinfrabel/",
        "opendata", "transport_operator",
        notes="FREE WIN: Open Data JSON feed — cleanest hiring signal in the Belgian list",
    ),
    AtsSource(
        "stib_mivb", "STIB/MIVB",
        "https://jobs.stib-mivb.be/",
        "successfactors", "stib-mivb",
        "https://jobs.stib-mivb.be/go/jobs_/9110655/",
        "successfactors_csb", "transport_operator",
    ),
    AtsSource(
        "de_lijn", "De Lijn",
        "https://jobs.delijn.be/",
        "successfactors", "delijn",
        None, "successfactors_csb", "transport_operator",
    ),
    AtsSource(
        "tec", "TEC (OTW)",
        "https://jobs.letec.be/OTW/",
        "successfactors", "letec/OTW",
        "https://jobs.letec.be/OTW/go/Toutes-les-offres/956902/",
        "successfactors_csb", "transport_operator",
    ),
    AtsSource(
        "bpost", "bpost / bpostgroup",
        "https://career.bpost.be/",
        "custom", None, None, "html_scrape", "logistics",
        notes="Drupal front-end, likely Avature backend. Scrape /en/job-search.",
    ),
    AtsSource(
        "brussels_airlines", "Brussels Airlines",
        "https://brusselsairlines.cvw.io/",
        "cvwarehouse", "brusselsairlines",
        "https://brusselsairlines.cvw.io/",
        "html_scrape", "transport_operator",
        notes="Legacy CVWarehouse URL pattern",
    ),
    AtsSource(
        "dhl_be", "DHL Belgium",
        "https://careers.dhl.com/",
        "oracle_taleo", "DHLECOMMERCE",
        "https://phg.tbe.taleo.net/phg03/ats/careers/v2/jobSearch?org=DHLECOMMERCE&cws=43",
        "taleo_html", "logistics",
        notes="Split stack: DHL Group on SuccessFactors, DHL eCommerce on Taleo (endpoint above)",
    ),
    AtsSource(
        "fedex_liege", "FedEx Belgium",
        "https://careers.fedex.com/",
        "workday", "fedex",
        None, "workday_cxs", "logistics",
        notes="Workday CXS with Belgium country filter; site slug unverified",
    ),
    AtsSource(
        "katoen_natie", "Katoen Natie",
        "https://katoennatie-jobs.be/",
        "custom", None, None, "html_scrape", "logistics",
        notes="Scrape /en/jobs/{uuid}/{slug}/",
    ),
    AtsSource(
        "h_essers", "H.Essers",
        "https://jobs.essers.com/",
        "custom", None, None, "html_scrape", "logistics",
        notes="WordPress — scrape /nl-be/vacatures/",
    ),
    AtsSource(
        "port_antwerp_bruges", "Port of Antwerp-Bruges",
        "https://www.portofantwerpbruges.com/jobs/en/vacancies",
        "unknown", None, None, "dom_render_required", "transport_operator",
        notes="JS-rendered vacancy list; needs headless browser",
    ),

    # ---- Healthcare, mutualities & hospitals ----------------------------
    AtsSource(
        "cm_mc", "CM/MC",
        "https://www.cm.be/nl/jobs/joblist",
        "custom", None, None, "html_scrape", "healthcare",
    ),
    AtsSource(
        "solidaris", "Solidaris",
        "https://jobs.solidaris-vlaanderen.be/",
        "custom", None, None, "html_scrape", "healthcare",
        notes="Drupal socmut_jobs; FR variant at jobs.solidaris.be",
    ),
    AtsSource(
        "helan", "Helan",
        "https://www.helanjobs.be/vacatures",
        "custom", "helanjobs", None, "html_scrape", "healthcare",
        notes="Likely Prato / Partena OZ backend",
    ),
    AtsSource(
        "uz_leuven", "UZ Leuven",
        "https://jobs.uzleuven.be/",
        "oracle_taleo", "uzleuven",
        "https://uzleuven.taleo.net/careersection/uz_vacaturebank_intern/jobsearch.ftl",
        "taleo_html", "healthcare",
    ),
    AtsSource(
        "uz_gent", "UZ Gent",
        "https://jobs.uzgent.be/",
        "successfactors", "uzgent",
        None, "successfactors_csb", "healthcare",
        notes="Scrape /tile-search-results/?q=",
    ),
    AtsSource(
        "chu_liege", "CHU de Liège",
        "https://www.chuliege.be/jcms/c2_17303180/fr/offres-d-emploi",
        "custom", None, None, "html_scrape", "healthcare",
        notes="Jalios jcms CMS",
    ),
    AtsSource(
        "ucl_saint_luc", "Cliniques universitaires Saint-Luc",
        "https://jobs.saintluc.be/",
        "talentsoft", "cusl-recrute",
        "https://jobs.saintluc.be/job/list-of-jobs.aspx?lcid=1036",
        "html_scrape", "healthcare",
    ),
    AtsSource(
        "uz_brussel", "UZ Brussel",
        "https://uzbrussel.cvw.io",
        "cvwarehouse", "uzbrussel",
        "https://uzbrussel.cvw.io",
        "html_scrape", "healthcare",
        notes="Front-end redirects from www.uzbrusselwerkt.be",
    ),
    AtsSource(
        "uza", "UZA",
        "https://uzajobs.be/",
        "cvwarehouse", "f3b4d8ea-ae58-47e3-b04f-ae7f48ee9790",
        "https://jobpage.cvwarehouse.com/?companyGuid=f3b4d8ea-ae58-47e3-b04f-ae7f48ee9790&lang=nl-BE",
        "cvwarehouse_guid", "healthcare",
    ),
    AtsSource(
        "zas_antwerp", "ZAS",
        "https://www.zas.be/jobs/alle-vacatures",
        "cvwarehouse", "fea14313-c97c-4405-a851-aef6192621c5",
        "https://jobpage.cvwarehouse.com/?companyGuid=fea14313-c97c-4405-a851-aef6192621c5&lang=nl-BE",
        "cvwarehouse_guid", "healthcare",
    ),

    # ---- Pharma, chemicals, automotive & manufacturing ------------------
    AtsSource(
        "gsk_be", "GSK Belgium",
        "https://jobs.gsk.com/en-be/jobs",
        "workday", "gsk/GSKCareers",
        "https://gsk.wd5.myworkdayjobs.com/wday/cxs/gsk/GSKCareers/jobs",
        "workday_cxs", "pharma",
    ),
    AtsSource(
        "janssen_beerse", "Johnson & Johnson / Janssen (Beerse)",
        "https://www.careers.jnj.com/belgium/overview",
        "workday", "jj/JJ",
        "https://jj.wd5.myworkdayjobs.com/wday/cxs/jj/JJ/jobs",
        "workday_cxs", "pharma",
    ),
    AtsSource(
        "pfizer_puurs", "Pfizer Belgium (Puurs)",
        "https://pfizer.wd1.myworkdayjobs.com/PfizerCareers",
        "workday", "pfizer/PfizerCareers",
        "https://pfizer.wd1.myworkdayjobs.com/wday/cxs/pfizer/PfizerCareers/jobs",
        "workday_cxs", "pharma",
    ),
    AtsSource(
        "ucb", "UCB (Braine-l'Alleud)",
        "https://careers.ucb.com/",
        "successfactors", "UCB",
        None, "successfactors_csb", "pharma",
        notes="Phenom front-end over SuccessFactors CSB",
    ),
    AtsSource(
        "takeda_lessines", "Takeda Belgium (Lessines)",
        "https://jobs.takeda.com/lessines",
        "workday", "takeda/External",
        "https://takeda.wd3.myworkdayjobs.com/wday/cxs/takeda/External/jobs",
        "workday_cxs", "pharma",
        notes="Phenom front-end over Workday backend",
    ),
    AtsSource(
        "basf_antwerp", "BASF Antwerpen",
        "https://basf.jobs/?addresses%2Fcountry=Belgium",
        "custom", "dark_blue_EMEA", None, "html_scrape", "chemicals",
        notes="Proprietary basf.jobs with country filter",
    ),
    AtsSource(
        "solvay", "Solvay Belgium",
        "https://jobs.solvay.com/",
        "successfactors", "solvay",
        "https://jobs.solvay.com/employment/category-jobs-in-belgium/8040/37862/2802361/2",
        "successfactors_csb", "chemicals",
    ),
    AtsSource(
        "umicore", "Umicore",
        "https://careers.umicore.com/",
        "successfactors", "UmicorePROD",
        "https://career5.successfactors.eu/careers?company=UmicorePROD",
        "successfactors_csb", "chemicals",
    ),
    AtsSource(
        "arcelormittal_be", "ArcelorMittal Belgium",
        "https://belgium.arcelormittal.com/en/career/",
        "oracle_fusion", None, None, "oracle_fusion_rest", "industrial_manufacturing",
        notes="Oracle ORC tenant; exact region/site slug needs confirmation on first fetch",
    ),
    AtsSource(
        "volvo_car_gent", "Volvo Car Gent",
        "https://jobs.volvocars.com/",
        "successfactors", "volvocars",
        "https://jobs.volvocars.com/search/?q=&locationsearch=Belgium",
        "successfactors_csb", "industrial_manufacturing",
        notes="Local landing page volvocargent.be/jobs",
    ),
    AtsSource(
        "volvo_trucks_gent", "Volvo Group Belgium",
        "https://jobs.volvogroup.com/",
        "successfactors", "volvogroup",
        None, "successfactors_csb", "industrial_manufacturing",
    ),
    AtsSource(
        "ab_inbev", "AB InBev Belgium",
        "https://europecareers.ab-inbev.com/",
        "workday", "abinbev/EUR",
        "https://abinbev.wd1.myworkdayjobs.com/wday/cxs/abinbev/EUR/jobs",
        "workday_cxs", "food_manufacturing",
        notes=(
            "FREE WIN: Greenhouse mirror at "
            "https://boards-api.greenhouse.io/v1/boards/abinbev/jobs "
            "and SmartRecruiters mirror at "
            "https://api.smartrecruiters.com/v1/companies/ABInBev1/postings. "
            "Poll all three for triangulation."
        ),
    ),
    AtsSource(
        "puratos", "Puratos",
        "https://jobs.puratos.com/go/Belgium-&-HQ_EN/9457901/",
        "successfactors", "puratos",
        "https://jobs.puratos.com/go/Belgium-&-HQ_EN/9457901/",
        "successfactors_csb", "food_manufacturing",
    ),

    # ---- Public sector, education & IT services ------------------------
    AtsSource(
        "smals", "Smals",
        "https://www.smals.be/nl/jobs/list",
        "custom", None, None, "html_scrape", "public_sector",
    ),
    AtsSource(
        "fod_financien", "FOD Financiën / SPF Finances",
        "https://www.jobfin.be/nl",
        "custom", None, None, "html_scrape", "public_sector",
        notes="Federal-wide: werkenvoor.be / travaillerpour.be (BOSA/Selor platform)",
    ),
    AtsSource(
        "armed_forces_be", "Belgian Defence",
        "https://careers.mil.be/fr/sites/Travailler-a-la-Defense/jobs",
        "oracle_fusion", None, None, "oracle_fusion_rest", "public_sector",
        notes="hcmRestApi tenant/site slug needs confirmation on first fetch",
    ),
    AtsSource(
        "federal_police", "Federal Police",
        "https://www.jobpol.be/nl",
        "custom", None, None, "html_scrape", "public_sector",
        notes="Batch intakes are schedule-driven, not rolling vacancies",
    ),
    AtsSource(
        "ku_leuven", "KU Leuven",
        "https://www.kuleuven.be/personeel/jobsite/vacatures",
        "unknown", None, None, "html_scrape", "education",
        notes="Likely SuccessFactors — confirm on fetch",
    ),
    AtsSource(
        "ugent", "UGent",
        "https://jobs.ugent.be/",
        "successfactors", "ugent",
        None, "successfactors_csb", "education",
    ),
    AtsSource(
        "uclouvain", "UCLouvain",
        "https://jobs.uclouvain.be/",
        "successfactors", "uclouvain",
        None, "successfactors_csb", "education",
    ),
    AtsSource(
        "ulb", "ULB",
        "https://www.ulb.be/fr/travailler-et-collaborer/offres-d-emploi",
        "successfactors", "ulb",
        None, "successfactors_csb", "education",
    ),
    AtsSource(
        "vub", "VUB",
        "https://jobs.vub.be/",
        "successfactors", "vub",
        None, "successfactors_csb", "education",
        notes="SuccessFactors inferred; verify on first fetch",
    ),
    AtsSource(
        "cronos_group", "Cronos Group",
        "https://cronos-groep.be",
        "custom", None, None, "html_scrape", "ict_competitor",
        notes=(
            "ATS-only key: Movify competitor, excluded from news roster. "
            "541 decentralised subsidiaries — no single ATS. Treat as meta-target: "
            "LinkedIn + per-subsidiary scraping."
        ),
    ),
    AtsSource(
        "cegeka", "Cegeka",
        "https://www.cegeka.com/en/be/jobs/all-jobs",
        "custom", None, None, "html_scrape", "ict_competitor",
        notes="ATS-only key: Movify competitor, excluded from news roster.",
    ),
    AtsSource(
        "nrb_group", "NRB Group",
        "https://nrbcareers.com/find-my-job",
        "custom", None, None, "html_scrape", "ict_competitor",
        notes="ATS-only key: Movify competitor, excluded from news roster.",
    ),
    AtsSource(
        "inetum", "Inetum (ex-Realdolmen)",
        "https://www.inetum.com/en/belgium/career",
        "smartrecruiters", "inetum2",
        "https://api.smartrecruiters.com/v1/companies/inetum2/postings",
        "rest_api", "ict_competitor",
        notes="ATS-only key: Movify competitor benchmark — hiring velocity via clean REST.",
    ),
]


def _validate() -> None:
    """Fail-fast check that every entry uses valid enumerated values and has a unique key."""
    seen_keys: set[str] = set()
    for src in ATS_SOURCES:
        if src.ats_type not in ATS_TYPES:
            raise ValueError(f"{src.client_key}: unknown ats_type {src.ats_type!r}")
        if src.scrape_method not in SCRAPE_METHODS:
            raise ValueError(f"{src.client_key}: unknown scrape_method {src.scrape_method!r}")
        if src.client_key in seen_keys:
            raise ValueError(f"duplicate client_key {src.client_key!r}")
        seen_keys.add(src.client_key)


_validate()
