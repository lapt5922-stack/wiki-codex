-- ============================================================================
-- AETHEL CODEX — KINGDOM CODEX POSTGRESQL SCHEMA (24 NORMALIZED TABLES)
-- Architected for 360+ Nations, Thousands of Polities & Millions of Records
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Core Kingdoms Table
CREATE TABLE IF NOT EXISTS kingdoms (
  id TEXT PRIMARY KEY, -- KING-000001
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  official_name TEXT NOT NULL,
  common_name TEXT NOT NULL,
  ancient_name TEXT NOT NULL DEFAULT '',
  native_name TEXT NOT NULL DEFAULT '',
  abbreviation TEXT NOT NULL DEFAULT '',
  historical_aliases TEXT[] NOT NULL DEFAULT '{}',
  polity_type TEXT NOT NULL DEFAULT 'kingdom',
  government_type TEXT NOT NULL DEFAULT '',
  current_status TEXT NOT NULL DEFAULT 'sovereign',
  development_level TEXT NOT NULL DEFAULT 'developing',
  founded_date TEXT NOT NULL DEFAULT '',
  age_years INTEGER NOT NULL DEFAULT 0,
  official_languages TEXT[] NOT NULL DEFAULT '{}',
  currency_code TEXT NOT NULL DEFAULT 'AUR',
  currency_name TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'UTC+0',
  country_code TEXT NOT NULL DEFAULT '',
  continent TEXT NOT NULL DEFAULT '',
  bloc TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  categories TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT NOT NULL DEFAULT '',
  motto TEXT NOT NULL DEFAULT '',
  workflow_status TEXT NOT NULL DEFAULT 'published'
    CHECK (workflow_status IN ('draft','published','under_review','archived')),
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official',
  linked_wiki_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL,
  linked_atlas_nation_id TEXT,
  nation_num INTEGER,
  search_text TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'System',
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kingdoms_cursor ON kingdoms (workspace_id, deleted_at, workflow_status, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_kingdoms_continent ON kingdoms (workspace_id, continent) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_kingdoms_tags_gin ON kingdoms USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_kingdoms_search_trgm ON kingdoms USING GIN (search_text gin_trgm_ops);

-- 2. Kingdom Symbols
CREATE TABLE IF NOT EXISTS kingdom_symbols (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  flag_url TEXT NOT NULL DEFAULT '',
  coat_of_arms_url TEXT NOT NULL DEFAULT '',
  emblem_config JSONB,
  anthem_title TEXT NOT NULL DEFAULT '',
  anthem_lyrics TEXT NOT NULL DEFAULT '',
  national_seal TEXT NOT NULL DEFAULT '',
  royal_symbol TEXT NOT NULL DEFAULT '',
  national_mascot TEXT NOT NULL DEFAULT '',
  representative_colors TEXT[] NOT NULL DEFAULT '{}',
  capital_image_url TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  thumb_image_url TEXT NOT NULL DEFAULT '',
  map_image_url TEXT NOT NULL DEFAULT ''
);

-- 3. Kingdom Territories
CREATE TABLE IF NOT EXISTS kingdom_territories (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  geo_location TEXT NOT NULL DEFAULT '',
  area_km2 BIGINT NOT NULL DEFAULT 0,
  border_description TEXT NOT NULL DEFAULT '',
  neighbor_kingdom_ids TEXT[] NOT NULL DEFAULT '{}',
  capital_city_id TEXT NOT NULL DEFAULT '',
  capital_name TEXT NOT NULL DEFAULT '',
  terrain_summary TEXT NOT NULL DEFAULT '',
  mountains_rivers_seas TEXT NOT NULL DEFAULT '',
  climate_summary TEXT NOT NULL DEFAULT '',
  avg_temp_c DOUBLE PRECISION,
  elevation_m INTEGER,
  natural_resources TEXT[] NOT NULL DEFAULT '{}',
  strategic_zones TEXT[] NOT NULL DEFAULT '{}',
  disputed_regions TEXT[] NOT NULL DEFAULT '{}',
  overseas_territories TEXT[] NOT NULL DEFAULT '{}',
  autonomous_regions TEXT[] NOT NULL DEFAULT '{}',
  special_zones TEXT[] NOT NULL DEFAULT '{}'
);

-- 4. Kingdom Regions & Cities (REG-XXXXXX / CITY-XXXXXX)
CREATE TABLE IF NOT EXISTS kingdom_regions (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'province',
  name TEXT NOT NULL,
  population BIGINT,
  description TEXT NOT NULL DEFAULT '',
  linked_wiki_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_kingdom_regions_k ON kingdom_regions (kingdom_id);

-- 5. Kingdom Population (Multi-Year Time Series)
CREATE TABLE IF NOT EXISTS kingdom_population (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  total_population BIGINT NOT NULL DEFAULT 0,
  density_per_km2 DOUBLE PRECISION NOT NULL DEFAULT 0,
  races JSONB NOT NULL DEFAULT '[]'::jsonb,
  ethnic_groups TEXT[] NOT NULL DEFAULT '{}',
  avg_lifespan SMALLINT NOT NULL DEFAULT 70,
  age_structure TEXT NOT NULL DEFAULT '',
  social_classes TEXT[] NOT NULL DEFAULT '{}',
  urbanization_pct SMALLINT NOT NULL DEFAULT 40,
  rural_pct SMALLINT NOT NULL DEFAULT 60,
  languages TEXT[] NOT NULL DEFAULT '{}',
  religions TEXT[] NOT NULL DEFAULT '{}',
  customs TEXT[] NOT NULL DEFAULT '{}',
  traditions TEXT[] NOT NULL DEFAULT '{}',
  festivals TEXT[] NOT NULL DEFAULT '{}',
  education_summary TEXT NOT NULL DEFAULT '',
  healthcare_summary TEXT NOT NULL DEFAULT '',
  social_welfare TEXT NOT NULL DEFAULT '',
  quality_of_life TEXT NOT NULL DEFAULT '',
  social_issues TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE (kingdom_id, year)
);

-- 6. Kingdom Governments
CREATE TABLE IF NOT EXISTS kingdom_governments (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  political_system TEXT NOT NULL DEFAULT '',
  state_structure TEXT NOT NULL DEFAULT '',
  constitution TEXT NOT NULL DEFAULT '',
  law_system TEXT NOT NULL DEFAULT '',
  legislature TEXT NOT NULL DEFAULT '',
  executive TEXT NOT NULL DEFAULT '',
  judiciary TEXT NOT NULL DEFAULT '',
  administrative_system TEXT NOT NULL DEFAULT '',
  succession_mechanism TEXT NOT NULL DEFAULT '',
  election_mechanism TEXT NOT NULL DEFAULT '',
  central_power TEXT NOT NULL DEFAULT '',
  local_power TEXT NOT NULL DEFAULT '',
  national_policies TEXT[] NOT NULL DEFAULT '{}',
  bureaucracy_system TEXT NOT NULL DEFAULT '',
  political_factions TEXT[] NOT NULL DEFAULT '{}',
  political_parties TEXT[] NOT NULL DEFAULT '{}',
  governance_apparatus TEXT NOT NULL DEFAULT '',
  political_stability TEXT NOT NULL DEFAULT ''
);

-- 7. Kingdom Rulers & Royalty (Linked to Character Codex by Character ID)
CREATE TABLE IF NOT EXISTS kingdom_rulers (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  character_id TEXT, -- FK to characters(id) CHAR-XXXXXX
  fallback_name TEXT NOT NULL DEFAULT '',
  role_title TEXT NOT NULL,
  dynasty TEXT NOT NULL DEFAULT '',
  reign_start TEXT NOT NULL DEFAULT '',
  reign_end TEXT NOT NULL DEFAULT '',
  predecessor_name TEXT NOT NULL DEFAULT '',
  successor_name TEXT NOT NULL DEFAULT '',
  is_current BOOLEAN NOT NULL DEFAULT TRUE,
  note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_kingdom_rulers_k ON kingdom_rulers (kingdom_id);

-- 8. Kingdom Economy (Multi-Year Time Series)
CREATE TABLE IF NOT EXISTS kingdom_economy (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  gdp_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  gdp_label TEXT NOT NULL DEFAULT '',
  gdp_per_capita_label TEXT NOT NULL DEFAULT '',
  total_budget TEXT NOT NULL DEFAULT '',
  budget_revenue TEXT NOT NULL DEFAULT '',
  budget_expenditure TEXT NOT NULL DEFAULT '',
  public_debt TEXT NOT NULL DEFAULT '',
  inflation_pct DOUBLE PRECISION NOT NULL DEFAULT 2.0,
  unemployment_pct DOUBLE PRECISION NOT NULL DEFAULT 4.0,
  trade_balance_label TEXT NOT NULL DEFAULT '',
  exports_share SMALLINT NOT NULL DEFAULT 50,
  imports_share SMALLINT NOT NULL DEFAULT 50,
  major_exports TEXT[] NOT NULL DEFAULT '{}',
  major_imports TEXT[] NOT NULL DEFAULT '{}',
  tax_system TEXT NOT NULL DEFAULT '',
  currency_code TEXT NOT NULL DEFAULT 'AUR',
  currency_value_note TEXT NOT NULL DEFAULT '',
  central_bank TEXT NOT NULL DEFAULT '',
  banking_system TEXT NOT NULL DEFAULT '',
  financial_market TEXT NOT NULL DEFAULT '',
  agriculture_pct SMALLINT NOT NULL DEFAULT 25,
  industry_pct SMALLINT NOT NULL DEFAULT 25,
  trade_pct SMALLINT NOT NULL DEFAULT 25,
  services_pct SMALLINT NOT NULL DEFAULT 25,
  mining_note TEXT NOT NULL DEFAULT '',
  energy_note TEXT NOT NULL DEFAULT '',
  tourism_note TEXT NOT NULL DEFAULT '',
  major_corporations TEXT[] NOT NULL DEFAULT '{}',
  merchant_families TEXT[] NOT NULL DEFAULT '{}',
  wealth_level TEXT NOT NULL DEFAULT '',
  economic_self_sufficiency SMALLINT NOT NULL DEFAULT 70,
  UNIQUE (kingdom_id, year)
);

-- 9. Kingdom Military (Worldbuilding Overview)
CREATE TABLE IF NOT EXISTS kingdom_military (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  total_force_scale TEXT NOT NULL DEFAULT '',
  army_overview TEXT NOT NULL DEFAULT '',
  navy_overview TEXT NOT NULL DEFAULT '',
  air_force_overview TEXT NOT NULL DEFAULT '',
  special_forces TEXT NOT NULL DEFAULT '',
  royal_guard TEXT NOT NULL DEFAULT '',
  defense_force TEXT NOT NULL DEFAULT '',
  intelligence_agency TEXT NOT NULL DEFAULT '',
  security_agency TEXT NOT NULL DEFAULT '',
  high_command TEXT NOT NULL DEFAULT '',
  rank_system TEXT NOT NULL DEFAULT '',
  military_academies TEXT[] NOT NULL DEFAULT '{}',
  defense_doctrine TEXT NOT NULL DEFAULT '',
  defense_capability TEXT NOT NULL DEFAULT '',
  military_tech TEXT NOT NULL DEFAULT '',
  iconic_equipment TEXT[] NOT NULL DEFAULT '{}',
  commander_character_ids TEXT[] NOT NULL DEFAULT '{}',
  organization_history TEXT NOT NULL DEFAULT '',
  historical_conflicts TEXT[] NOT NULL DEFAULT '{}'
);

-- 10. Kingdom Technology & Magic
CREATE TABLE IF NOT EXISTS kingdom_technology (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  civilization_level TEXT NOT NULL DEFAULT '',
  tech_level TEXT NOT NULL DEFAULT '',
  natural_sciences TEXT NOT NULL DEFAULT '',
  engineering TEXT NOT NULL DEFAULT '',
  medicine TEXT NOT NULL DEFAULT '',
  transportation_tech TEXT NOT NULL DEFAULT '',
  energy_tech TEXT NOT NULL DEFAULT '',
  information_tech TEXT NOT NULL DEFAULT '',
  manufacturing_tech TEXT NOT NULL DEFAULT '',
  defense_tech TEXT NOT NULL DEFAULT '',
  magic_system TEXT NOT NULL DEFAULT '',
  supernatural_energy TEXT NOT NULL DEFAULT '',
  magic_academies TEXT[] NOT NULL DEFAULT '{}',
  research_projects TEXT[] NOT NULL DEFAULT '{}',
  notable_inventions TEXT[] NOT NULL DEFAULT '{}',
  exclusive_tech TEXT[] NOT NULL DEFAULT '{}',
  ancient_tech_legacy TEXT NOT NULL DEFAULT ''
);

-- 11. Kingdom Cultures & Education
CREATE TABLE IF NOT EXISTS kingdom_cultures (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  cultural_identity TEXT NOT NULL DEFAULT '',
  royal_culture TEXT NOT NULL DEFAULT '',
  folk_culture TEXT NOT NULL DEFAULT '',
  arts TEXT NOT NULL DEFAULT '',
  music TEXT NOT NULL DEFAULT '',
  literature TEXT NOT NULL DEFAULT '',
  architecture TEXT NOT NULL DEFAULT '',
  cuisine TEXT NOT NULL DEFAULT '',
  traditional_dress TEXT NOT NULL DEFAULT '',
  martial_traditions TEXT NOT NULL DEFAULT '',
  education_system TEXT NOT NULL DEFAULT '',
  universities_and_academies TEXT[] NOT NULL DEFAULT '{}',
  religions TEXT[] NOT NULL DEFAULT '{}',
  mythology TEXT NOT NULL DEFAULT '',
  historical_monuments TEXT[] NOT NULL DEFAULT '{}',
  cultural_heritage TEXT[] NOT NULL DEFAULT '{}',
  national_holidays TEXT[] NOT NULL DEFAULT '{}'
);

-- 12. Kingdom Infrastructure
CREATE TABLE IF NOT EXISTS kingdom_infrastructure (
  kingdom_id TEXT PRIMARY KEY REFERENCES kingdoms(id) ON DELETE CASCADE,
  transport_system TEXT NOT NULL DEFAULT '',
  roads TEXT NOT NULL DEFAULT '',
  railways TEXT NOT NULL DEFAULT '',
  seaports TEXT NOT NULL DEFAULT '',
  airports TEXT NOT NULL DEFAULT '',
  energy_grid TEXT NOT NULL DEFAULT '',
  water_supply TEXT NOT NULL DEFAULT '',
  telecom TEXT NOT NULL DEFAULT '',
  hospitals_and_schools TEXT NOT NULL DEFAULT '',
  industrial_zones TEXT NOT NULL DEFAULT '',
  trade_centers TEXT NOT NULL DEFAULT '',
  public_works TEXT NOT NULL DEFAULT '',
  iconic_landmarks TEXT[] NOT NULL DEFAULT '{}',
  development_score SMALLINT NOT NULL DEFAULT 60
);

-- 13. Kingdom Resources
CREATE TABLE IF NOT EXISTS kingdom_resources (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'natural',
  name TEXT NOT NULL,
  region_name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);

-- 14. Kingdom Statistics (14 Independent Metrics with Timestamp & Source)
CREATE TABLE IF NOT EXISTS kingdom_statistics (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  stat_key TEXT NOT NULL,
  label TEXT NOT NULL,
  score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  tier_label TEXT NOT NULL DEFAULT '',
  raw_value TEXT NOT NULL DEFAULT '',
  evaluated_at TEXT NOT NULL DEFAULT '',
  source_note TEXT NOT NULL DEFAULT '',
  UNIQUE (kingdom_id, stat_key)
);

-- 15. Kingdom International Relations (Time-Evolving)
CREATE TABLE IF NOT EXISTS kingdom_relations (
  id TEXT PRIMARY KEY, -- KREL-000001
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kingdom_a_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  kingdom_b_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  intensity SMALLINT NOT NULL DEFAULT 0 CHECK (intensity BETWEEN -100 AND 100),
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  origin_cause TEXT NOT NULL DEFAULT '',
  history_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_event_id TEXT,
  current_status TEXT NOT NULL DEFAULT 'active',
  access_level TEXT NOT NULL DEFAULT 'public',
  verification_status TEXT NOT NULL DEFAULT 'official',
  CHECK (kingdom_a_id <> kingdom_b_id)
);
CREATE INDEX IF NOT EXISTS idx_kingdom_relations_pair ON kingdom_relations (workspace_id, kingdom_a_id, kingdom_b_id);

-- 16. Kingdom Treaties
CREATE TABLE IF NOT EXISTS kingdom_treaties (
  id TEXT PRIMARY KEY, -- TRT-000001
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  signed_date TEXT NOT NULL DEFAULT '',
  partner_names TEXT[] NOT NULL DEFAULT '{}',
  terms_summary TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active'
);

-- 17. Kingdom Events & Timeline
CREATE TABLE IF NOT EXISTS kingdom_events (
  id TEXT PRIMARY KEY, -- EVT-000001
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'historical',
  title TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 0,
  era TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  participant_character_ids TEXT[] NOT NULL DEFAULT '{}',
  cause TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  long_term_impact TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_kingdom_events_k_year ON kingdom_events (kingdom_id, year ASC);

-- 18. Kingdom Achievements
CREATE TABLE IF NOT EXISTS kingdom_achievements (
  id TEXT PRIMARY KEY, -- KACH-000001
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'historical',
  title TEXT NOT NULL,
  date_label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);

-- 19. Kingdom Assets (National Treasures & Royal Estates)
CREATE TABLE IF NOT EXISTS kingdom_assets (
  id TEXT PRIMARY KEY, -- KAST-000001
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  asset_kind TEXT NOT NULL DEFAULT 'national_treasure',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);

-- 20. Kingdom Images Gallery
CREATE TABLE IF NOT EXISTS kingdom_images (
  id TEXT PRIMARY KEY, -- KIMG-000001
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'gallery',
  url TEXT NOT NULL,
  thumb_url TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  source_credit TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 21. Kingdom Sources
CREATE TABLE IF NOT EXISTS kingdom_sources (
  id TEXT PRIMARY KEY, -- KSRC-000001
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  editor_name TEXT NOT NULL DEFAULT 'System',
  verification_status TEXT NOT NULL DEFAULT 'official',
  editorial_note TEXT NOT NULL DEFAULT ''
);

-- 22. Kingdom Dynamic Custom Field Definitions (13 Types)
CREATE TABLE IF NOT EXISTS kingdom_custom_field_definitions (
  id TEXT PRIMARY KEY, -- KFLD-000001
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'text',
  group_name TEXT NOT NULL DEFAULT 'Mở rộng',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  default_value TEXT NOT NULL DEFAULT '',
  options TEXT[] NOT NULL DEFAULT '{}',
  visible_to TEXT[] NOT NULL DEFAULT ARRAY['admin','editor','guest'],
  editable_by TEXT[] NOT NULL DEFAULT ARRAY['admin','editor'],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, key)
);

-- 23. Kingdom Dynamic Custom Field Values (Keyed by field_id — Non-Destructive)
CREATE TABLE IF NOT EXISTS kingdom_custom_field_values (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES kingdom_custom_field_definitions(id) ON DELETE CASCADE,
  value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (kingdom_id, field_id)
);

-- 24. Kingdom Version Snapshots
CREATE TABLE IF NOT EXISTS kingdom_versions (
  id TEXT PRIMARY KEY,
  kingdom_id TEXT NOT NULL REFERENCES kingdoms(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  editor_name TEXT NOT NULL DEFAULT 'System',
  change_note TEXT NOT NULL DEFAULT '',
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_kingdom_versions_k ON kingdom_versions (kingdom_id, version_number DESC);
