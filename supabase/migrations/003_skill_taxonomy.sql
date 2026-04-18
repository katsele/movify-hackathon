-- =============================================================================
-- Story 2 — extend skill taxonomy to Movify's 12 disciplines
-- Source: docs/value-prop.md:112
-- Adds a unique(name) constraint so the idempotent `on conflict (name)` pattern
-- used below (and by future seeds) actually dedupes.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'skills_name_unique'
  ) then
    alter table skills add constraint skills_name_unique unique (name);
  end if;
end $$;

-- Reclassify two existing skills into the discipline names they really belong to.
update skills set discipline = 'Service Design'  where name = 'Service Design'  and discipline = 'Design';
update skills set discipline = 'UX/UI Design'    where name = 'Product Design'  and discipline = 'Design';

insert into skills (name, discipline, aliases) values
  -- Product Management
  ('Product Management',   'Product Management',  '{"PM","product manager","gestion de produit"}'),
  ('Product Ownership',    'Product Management',  '{"PO","product owner"}'),
  ('Product Strategy',     'Product Management',  '{"roadmap","product strategy"}'),

  -- Service Design
  ('Service Blueprinting', 'Service Design',      '{"blueprint","service blueprint"}'),
  ('Journey Mapping',      'Service Design',      '{"customer journey","parcours client"}'),

  -- UX Research
  ('UX Research',          'UX Research',         '{"user research","recherche utilisateur","UXR"}'),
  ('Usability Testing',    'UX Research',         '{"user testing","test utilisateur"}'),

  -- UX/UI Design
  ('UX Design',            'UX/UI Design',        '{"UX","user experience"}'),
  ('UI Design',            'UX/UI Design',        '{"UI","user interface","interface design"}'),
  ('Figma',                'UX/UI Design',        '{"figma","figma design"}'),

  -- AI Strategy
  ('AI Strategy',          'AI Strategy',         '{"stratégie IA","AI advisory","AI consulting"}'),
  ('LLM Ops',              'AI Strategy',         '{"LLMOps","llm operations"}'),

  -- Data Science
  ('Data Science',         'Data Science',        '{"data scientist","science des données"}'),
  ('Machine Learning',     'Data Science',        '{"ML","machine learning","apprentissage automatique"}'),

  -- Mobile Development
  ('iOS Development',      'Mobile Development',  '{"iOS","Swift","développement iOS"}'),
  ('Android Development',  'Mobile Development',  '{"Android","Kotlin","développement Android"}'),
  ('React Native',         'Mobile Development',  '{"RN","react-native"}'),
  ('Flutter',              'Mobile Development',  '{"flutter"}'),

  -- Cloud/DevOps
  ('AWS',                  'Cloud/DevOps',        '{"Amazon Web Services"}'),
  ('Azure',                'Cloud/DevOps',        '{"Microsoft Azure"}'),
  ('Google Cloud',         'Cloud/DevOps',        '{"GCP","Google Cloud Platform"}'),
  ('Terraform',            'Cloud/DevOps',        '{"IaC","infrastructure as code"}'),
  ('CI/CD',                'Cloud/DevOps',        '{"continuous integration","continuous delivery","pipeline"}'),

  -- Accessibility
  ('Web Accessibility',    'Accessibility',       '{"a11y","WCAG","accessibilité"}'),

  -- Design Systems
  ('Design Systems',       'Design Systems',      '{"design system","système de design"}')
on conflict (name) do nothing;
