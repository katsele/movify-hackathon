-- =============================================================================
-- ATS tenant map — read-replica of workers/connectors/ats_sources.py
-- Source of truth is the Python dataclass list (mirrors news_clients.py pattern);
-- this table exists so the Next.js side can query the roster without importing
-- Python config. Synced by `python run_connector.py ats_sources`.
-- =============================================================================

create table if not exists ats_sources (
  client_key      text primary key,
  company_name    text not null,
  career_url      text not null,
  ats_type        text not null check (ats_type in (
    'successfactors','workday','oracle_taleo','oracle_fusion',
    'greenhouse','smartrecruiters','recruitee','phenom',
    'cvwarehouse','beehire','talentsoft','jibe','custom','unknown'
  )),
  tenant_slug     text,
  api_endpoint    text,
  scrape_method   text not null check (scrape_method in (
    'rest_api','workday_cxs','oracle_fusion_rest','successfactors_csb',
    'taleo_html','cvwarehouse_guid','phenom_json','opendata',
    'html_scrape','dom_render_required','none'
  )),
  sector          text not null,
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists ats_sources_ats_type_idx on ats_sources (ats_type);
create index if not exists ats_sources_sector_idx   on ats_sources (sector);
