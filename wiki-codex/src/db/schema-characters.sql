-- ============================================================================
-- AETHEL CODEX — CHARACTER CODEX POSTGRESQL SCHEMA (22 NORMALIZED TABLES)
-- Architected for Millions of Characters, Full-Text Search & Relational Scale
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Core Characters Table (Groups 1, 6, 10, 15)
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY, -- CHAR-000001
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_name TEXT NOT NULL DEFAULT '',
  true_name TEXT NOT NULL DEFAULT '',
  aliases TEXT[] NOT NULL DEFAULT '{}',
  nicknames TEXT[] NOT NULL DEFAULT '{}',
  titles TEXT[] NOT NULL DEFAULT '{}',
  ancient_titles TEXT[] NOT NULL DEFAULT '{}',
  historical_titles TEXT[] NOT NULL DEFAULT '{}',
  age TEXT NOT NULL DEFAULT '',
  birth_day SMALLINT,
  birth_month SMALLINT,
  birth_year INTEGER,
  death_date TEXT NOT NULL DEFAULT '',
  death_year INTEGER,
  gender TEXT NOT NULL DEFAULT '',
  race TEXT NOT NULL DEFAULT '',
  nationality TEXT NOT NULL DEFAULT '',
  hometown TEXT NOT NULL DEFAULT '',
  birth_place TEXT NOT NULL DEFAULT '',
  residence TEXT NOT NULL DEFAULT '',
  origin_world TEXT NOT NULL DEFAULT '',
  current_world TEXT NOT NULL DEFAULT '',
  occupation TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT '',
  rank TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'supporting',
  rarity TEXT NOT NULL DEFAULT 'common',
  life_status TEXT NOT NULL DEFAULT 'alive',
  activity_status TEXT NOT NULL DEFAULT 'active',
  classification TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  symbol TEXT NOT NULL DEFAULT '✦',
  accent_color TEXT NOT NULL DEFAULT '#D4AF37',
  portrait_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  linked_nation_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL,
  linked_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL,
  pinned_to_grand_hall BOOLEAN NOT NULL DEFAULT FALSE,
  access_level TEXT NOT NULL DEFAULT 'public'
    CHECK (access_level IN ('public','admin_only','authorized_only','spoiler','unpublished','private_draft')),
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
    CHECK (verification_status IN ('official','verified','unverified','inferred','creative','updating','draft','outdated')),
  combat_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  social_standing JSONB NOT NULL DEFAULT '{}'::jsonb,
  trivia_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  search_text TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL DEFAULT 'System',
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_characters_workspace_cursor
  ON characters (workspace_id, deleted_at, access_level, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_characters_nationality ON characters (workspace_id, nationality) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_characters_race ON characters (workspace_id, race) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_characters_tags_gin ON characters USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_characters_search_trgm ON characters USING GIN (search_text gin_trgm_ops);

-- 2. Character Appearances (Multi-Stage)
CREATE TABLE IF NOT EXISTS character_appearances (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  age_at_stage TEXT NOT NULL DEFAULT '',
  time_period TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  height TEXT NOT NULL DEFAULT '',
  weight TEXT NOT NULL DEFAULT '',
  hair_color TEXT NOT NULL DEFAULT '',
  hair_style TEXT NOT NULL DEFAULT '',
  eye_color TEXT NOT NULL DEFAULT '',
  skin_tone TEXT NOT NULL DEFAULT '',
  face_features TEXT NOT NULL DEFAULT '',
  physique TEXT NOT NULL DEFAULT '',
  distinguishing_marks TEXT NOT NULL DEFAULT '',
  scars TEXT NOT NULL DEFAULT '',
  tattoos TEXT NOT NULL DEFAULT '',
  special_markings TEXT NOT NULL DEFAULT '',
  voice TEXT NOT NULL DEFAULT '',
  demeanor TEXT NOT NULL DEFAULT '',
  casual_outfit TEXT NOT NULL DEFAULT '',
  combat_outfit TEXT NOT NULL DEFAULT '',
  ceremonial_outfit TEXT NOT NULL DEFAULT '',
  special_outfit TEXT NOT NULL DEFAULT '',
  accessories TEXT NOT NULL DEFAULT '',
  personal_emblem TEXT NOT NULL DEFAULT '',
  changes_noted TEXT NOT NULL DEFAULT '',
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_char_appearances_char ON character_appearances (character_id);

-- 3. Character Personalities (Multi-Stage Psychological Evolution)
CREATE TABLE IF NOT EXISTS character_personalities (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  period_label TEXT NOT NULL DEFAULT '',
  core_personality TEXT NOT NULL DEFAULT '',
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  likes TEXT[] NOT NULL DEFAULT '{}',
  dislikes TEXT[] NOT NULL DEFAULT '{}',
  fears TEXT[] NOT NULL DEFAULT '{}',
  motivations TEXT NOT NULL DEFAULT '',
  short_term_goals TEXT NOT NULL DEFAULT '',
  long_term_goals TEXT NOT NULL DEFAULT '',
  beliefs TEXT NOT NULL DEFAULT '',
  life_philosophy TEXT NOT NULL DEFAULT '',
  personal_principles TEXT NOT NULL DEFAULT '',
  habits TEXT NOT NULL DEFAULT '',
  psychology_profile TEXT NOT NULL DEFAULT '',
  danger_reaction TEXT NOT NULL DEFAULT '',
  pressure_reaction TEXT NOT NULL DEFAULT '',
  communication_style TEXT NOT NULL DEFAULT '',
  emotional_control TEXT NOT NULL DEFAULT '',
  internal_conflict TEXT NOT NULL DEFAULT '',
  psychological_growth TEXT NOT NULL DEFAULT '',
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_char_personalities_char ON character_personalities (character_id);

-- 4. Character Biographies (15 Standard Sections + Multi-Chapter)
CREATE TABLE IF NOT EXISTS character_biographies (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  chapter_order INTEGER NOT NULL DEFAULT 1,
  stage_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  content_markdown TEXT NOT NULL DEFAULT '',
  linked_event_id TEXT,
  linked_wiki_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL,
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_char_biographies_char ON character_biographies (character_id, chapter_order);

-- 5. Character Abilities & 13 Base Stats (Explicit Columns — Not One Giant JSON)
CREATE TABLE IF NOT EXISTS character_abilities (
  character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
  hp INTEGER NOT NULL DEFAULT 100,
  mp INTEGER NOT NULL DEFAULT 100,
  stamina INTEGER NOT NULL DEFAULT 100,
  strength INTEGER NOT NULL DEFAULT 10,
  speed INTEGER NOT NULL DEFAULT 10,
  endurance INTEGER NOT NULL DEFAULT 10,
  defense INTEGER NOT NULL DEFAULT 10,
  reflex INTEGER NOT NULL DEFAULT 10,
  intelligence INTEGER NOT NULL DEFAULT 10,
  perception INTEGER NOT NULL DEFAULT 10,
  willpower INTEGER NOT NULL DEFAULT 10,
  energy_control INTEGER NOT NULL DEFAULT 10,
  adaptability INTEGER NOT NULL DEFAULT 10,
  world_stat_overrides JSONB NOT NULL DEFAULT '[]'::jsonb,
  level INTEGER NOT NULL DEFAULT 1,
  realm TEXT NOT NULL DEFAULT '',
  power_tier TEXT NOT NULL DEFAULT '',
  energy_system TEXT NOT NULL DEFAULT '',
  elements TEXT[] NOT NULL DEFAULT '{}',
  attributes TEXT[] NOT NULL DEFAULT '{}',
  bloodline TEXT NOT NULL DEFAULT '',
  innate_abilities TEXT[] NOT NULL DEFAULT '{}',
  awakened_abilities TEXT[] NOT NULL DEFAULT '{}',
  special_capabilities TEXT[] NOT NULL DEFAULT '{}',
  resistances TEXT[] NOT NULL DEFAULT '{}',
  immunities TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  power_limits TEXT NOT NULL DEFAULT '',
  unbroken_limits TEXT NOT NULL DEFAULT '',
  progression_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  access_level TEXT NOT NULL DEFAULT 'public',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_char_abilities_level ON character_abilities (level DESC);

-- 6. Skills Master Table (SKILL-000001)
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  other_names TEXT[] NOT NULL DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  image_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'active',
  description TEXT NOT NULL DEFAULT '',
  mechanics TEXT NOT NULL DEFAULT '',
  usage_conditions TEXT NOT NULL DEFAULT '',
  activation_method TEXT NOT NULL DEFAULT '',
  cooldown TEXT NOT NULL DEFAULT '',
  energy_cost TEXT NOT NULL DEFAULT '',
  effect_range TEXT NOT NULL DEFAULT '',
  limitations TEXT NOT NULL DEFAULT '',
  weaknesses TEXT NOT NULL DEFAULT '',
  origin TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_skills_workspace ON skills (workspace_id, category);

-- 7. Character <-> Skill Relations
CREATE TABLE IF NOT EXISTS character_skill_relations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  skill_level INTEGER NOT NULL DEFAULT 1,
  mastery_level TEXT NOT NULL DEFAULT '',
  mentor_name TEXT NOT NULL DEFAULT '',
  ownership_status TEXT NOT NULL DEFAULT 'owned',
  acquired_at_label TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  UNIQUE (character_id, skill_id)
);

-- 8. Items Master Table (ITEM-000001)
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'weapon',
  origin TEXT NOT NULL DEFAULT '',
  level_or_tier TEXT NOT NULL DEFAULT '',
  current_owner_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
  traits TEXT NOT NULL DEFAULT '',
  transfer_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_status TEXT NOT NULL DEFAULT 'equipped',
  image_url TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official'
);

-- 9. Character Equipment Relations
CREATE TABLE IF NOT EXISTS character_equipment (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  slot_label TEXT NOT NULL DEFAULT '',
  is_equipped BOOLEAN NOT NULL DEFAULT TRUE,
  acquired_at_label TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public'
);
CREATE INDEX IF NOT EXISTS idx_char_equipment_char ON character_equipment (character_id);

-- 10. Relationships (REL-000001 — 22 Types, Bidirectional)
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  character_a_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  character_b_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  reverse_relation_type TEXT,
  is_bidirectional BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  closeness SMALLINT NOT NULL DEFAULT 50 CHECK (closeness BETWEEN 0 AND 100),
  history_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_event_id TEXT,
  private_note TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official',
  CHECK (character_a_id <> character_b_id)
);
CREATE INDEX IF NOT EXISTS idx_relationships_pair ON relationships (workspace_id, character_a_id, character_b_id);

-- 11. Organizations & Clans (ORG-000001)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'guild',
  sigil TEXT NOT NULL DEFAULT '⛨',
  color TEXT NOT NULL DEFAULT '#60A5FA',
  description TEXT NOT NULL DEFAULT '',
  linked_wiki_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL
);

-- 12. Affiliations (Character <-> Organization)
CREATE TABLE IF NOT EXISTS affiliations (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT '',
  rank TEXT NOT NULL DEFAULT '',
  join_date TEXT NOT NULL DEFAULT '',
  leave_date TEXT NOT NULL DEFAULT '',
  role_description TEXT NOT NULL DEFAULT '',
  authority_scope TEXT NOT NULL DEFAULT '',
  member_status TEXT NOT NULL DEFAULT 'active',
  activity_history TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public',
  verification_status TEXT NOT NULL DEFAULT 'official'
);
CREATE INDEX IF NOT EXISTS idx_affiliations_char ON affiliations (character_id);

-- 13. Events Master Table (EVENT-000001)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  year INTEGER NOT NULL DEFAULT 0,
  month SMALLINT,
  era TEXT NOT NULL DEFAULT '',
  stage_label TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  map_x DOUBLE PRECISION,
  map_y DOUBLE PRECISION,
  content TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  impact TEXT NOT NULL DEFAULT '',
  linked_wiki_entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL,
  source_ref TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official',
  access_level TEXT NOT NULL DEFAULT 'public',
  spoiler_label TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_events_workspace_year ON events (workspace_id, year ASC);

-- 14. Character <-> Event Participation
CREATE TABLE IF NOT EXISTS character_events (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  character_role TEXT NOT NULL DEFAULT '',
  participant_names TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_char_events_char ON character_events (character_id);

-- 15. Achievements (ACH-000001)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'personal',
  title TEXT NOT NULL,
  date_achieved TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  impact_level TEXT NOT NULL DEFAULT 'regional',
  source_ref TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'official',
  access_level TEXT NOT NULL DEFAULT 'public'
);

-- 16. Character Assets & Finance (ASSET-000001)
CREATE TABLE IF NOT EXISTS character_assets (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  personal_wealth TEXT NOT NULL DEFAULT '',
  currency_code TEXT NOT NULL DEFAULT 'AUR',
  income TEXT NOT NULL DEFAULT '',
  occupation_source TEXT NOT NULL DEFAULT '',
  income_sources TEXT[] NOT NULL DEFAULT '{}',
  properties TEXT[] NOT NULL DEFAULT '{}',
  land_holdings TEXT[] NOT NULL DEFAULT '{}',
  shares_and_equity TEXT[] NOT NULL DEFAULT '{}',
  ownership_rights TEXT[] NOT NULL DEFAULT '{}',
  debts TEXT NOT NULL DEFAULT '',
  inheritance TEXT NOT NULL DEFAULT '',
  operating_costs TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public',
  verification_status TEXT NOT NULL DEFAULT 'official'
);

-- 17. Character Quotes (QUO-000001)
CREATE TABLE IF NOT EXISTS character_quotes (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'famous',
  quote_text TEXT NOT NULL,
  listener TEXT NOT NULL DEFAULT '',
  time_label TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  related_event_id TEXT REFERENCES events(id) ON DELETE SET NULL,
  verification_status TEXT NOT NULL DEFAULT 'official',
  access_level TEXT NOT NULL DEFAULT 'public'
);

-- 18. Character Images Gallery (IMG-000001)
CREATE TABLE IF NOT EXISTS character_images (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'portrait',
  url TEXT NOT NULL,
  thumb_url TEXT NOT NULL DEFAULT '',
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  is_thumbnail BOOLEAN NOT NULL DEFAULT FALSE,
  caption TEXT NOT NULL DEFAULT '',
  source_credit TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  access_level TEXT NOT NULL DEFAULT 'public'
);

-- 19. Character Versions History
CREATE TABLE IF NOT EXISTS character_versions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  editor_name TEXT NOT NULL DEFAULT 'System',
  change_note TEXT NOT NULL DEFAULT '',
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_char_versions_char ON character_versions (character_id, version_number DESC);

-- 20. Sources & References (SRC-000001)
CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'official',
  title TEXT NOT NULL,
  provider_or_author TEXT NOT NULL DEFAULT '',
  reliability SMALLINT NOT NULL DEFAULT 80 CHECK (reliability BETWEEN 0 AND 100),
  verification_status TEXT NOT NULL DEFAULT 'verified',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  editor_name TEXT NOT NULL DEFAULT 'System',
  data_version TEXT NOT NULL DEFAULT '1.0',
  url TEXT NOT NULL DEFAULT ''
);

-- 21. Custom Field Definitions (CFLD-000001 — Non-Destructive Schema Evolution)
CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'text',
  group_name TEXT NOT NULL DEFAULT 'Mở rộng',
  required BOOLEAN NOT NULL DEFAULT FALSE,
  default_value TEXT NOT NULL DEFAULT '',
  options TEXT[] NOT NULL DEFAULT '{}',
  visible BOOLEAN NOT NULL DEFAULT TRUE,
  editable_by TEXT[] NOT NULL DEFAULT ARRAY['admin','editor'],
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, key)
);

-- 22. Custom Field Values (Stored by field_id so renaming/retyping preserves data)
CREATE TABLE IF NOT EXISTS custom_field_values (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  field_id TEXT NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (character_id, field_id)
);
