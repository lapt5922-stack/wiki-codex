-- Royal Heraldry Studio V2 Expansion — Additive Safe Migration
-- Never alters or drops V1 tables (heraldry_designs, heraldry_versions).

CREATE TABLE IF NOT EXISTS heraldry_flags (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  geometry TEXT NOT NULL,
  layout TEXT NOT NULL,
  config_json JSONB NOT NULL,
  linked_kingdom_id TEXT,
  linked_entity_id TEXT,
  era_label TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heraldry_regalia (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  history TEXT DEFAULT '',
  materials TEXT DEFAULT '',
  current_status TEXT NOT NULL DEFAULT 'active',
  linked_kingdom_id TEXT,
  linked_character_id TEXT,
  dynasty_name TEXT DEFAULT '',
  era_label TEXT DEFAULT '',
  source_citation TEXT DEFAULT '',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heraldry_meanings (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  civilization TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  source_citation TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'unverified_draft',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS heraldry_custom_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  collection_name TEXT NOT NULL DEFAULT 'Bộ sưu tập Chung',
  category TEXT NOT NULL,
  style TEXT NOT NULL,
  license TEXT NOT NULL DEFAULT 'Aethel Codex Internal',
  description TEXT DEFAULT '',
  design_data JSONB NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
