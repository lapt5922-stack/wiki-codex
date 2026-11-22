-- ============================================================================
-- WIKI CODEX — POSTGRESQL PRODUCTION SCHEMA (Local / Neon / Supabase SSL)
-- Designed for High Scale: 10,000s of cards, Millions of records, Fast Search
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'guest')),
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  sigil TEXT NOT NULL DEFAULT '✦',
  accent_color TEXT NOT NULL DEFAULT '#D4AF37',
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  default_language_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'FolderTree',
  sigil TEXT NOT NULL DEFAULT '❖',
  color TEXT NOT NULL DEFAULT '#D4AF37',
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_workspace
  ON categories (workspace_id, parent_id, sort_order)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS entry_types (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'FileText',
  sigil TEXT NOT NULL DEFAULT '✦',
  color TEXT NOT NULL DEFAULT '#D4AF37',
  enabled_tabs JSONB NOT NULL DEFAULT '["overview","details","relations","timeline","sources","gallery"]'::jsonb,
  field_schema JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entry_type_id TEXT NOT NULL REFERENCES entry_types(id) ON DELETE RESTRICT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'ScrollText',
  sigil TEXT NOT NULL DEFAULT '✦',
  cover_image TEXT NOT NULL DEFAULT '',
  thumb_image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  spoiler_gate BOOLEAN NOT NULL DEFAULT FALSE,
  spoiler_label TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  search_text TEXT NOT NULL DEFAULT '',
  content_markdown TEXT NOT NULL DEFAULT '',
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  sources_markdown TEXT NOT NULL DEFAULT '',
  private_notes TEXT NOT NULL DEFAULT '',
  gallery JSONB NOT NULL DEFAULT '[]'::jsonb,
  editorial_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by TEXT NOT NULL DEFAULT 'System',
  updated_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (workspace_id, slug)
);

-- High-scale indexes for 50,000+ cards and millions of records
CREATE INDEX IF NOT EXISTS idx_entries_cursor
  ON entries (workspace_id, deleted_at, status, visibility, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_entries_category
  ON entries (workspace_id, category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_entries_type
  ON entries (workspace_id, entry_type_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_entries_tags_gin
  ON entries USING GIN (tags);

CREATE INDEX IF NOT EXISTS idx_entries_search_trgm
  ON entries USING GIN (search_text gin_trgm_ops);

CREATE TABLE IF NOT EXISTS entry_revisions (
  id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  change_summary TEXT NOT NULL DEFAULT '',
  editor_name TEXT NOT NULL DEFAULT 'System',
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revisions_entry
  ON entry_revisions (entry_id, version_number DESC);

CREATE TABLE IF NOT EXISTS entry_relations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  source_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  target_entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  relation_type TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_relations_workspace
  ON entry_relations (workspace_id, source_entry_id, target_entry_id);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date_label TEXT NOT NULL,
  sort_year INTEGER NOT NULL DEFAULT 0,
  era TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Hourglass',
  sigil TEXT NOT NULL DEFAULT '⧗',
  color TEXT NOT NULL DEFAULT '#D4AF37',
  summary TEXT NOT NULL DEFAULT '',
  entry_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_workspace
  ON timeline_events (workspace_id, sort_year ASC);

CREATE TABLE IF NOT EXISTS atlas_maps (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL DEFAULT '',
  theme_preset TEXT DEFAULT 'aethelgard',
  width INTEGER NOT NULL DEFAULT 1200,
  height INTEGER NOT NULL DEFAULT 720,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atlas_pins (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES atlas_maps(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  x_percent DOUBLE PRECISION NOT NULL,
  y_percent DOUBLE PRECISION NOT NULL,
  color TEXT NOT NULL DEFAULT '#D4AF37',
  icon TEXT NOT NULL DEFAULT 'MapPin',
  sigil TEXT NOT NULL DEFAULT '✦',
  entry_id TEXT REFERENCES entries(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS conlangs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  native_name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sigil TEXT NOT NULL DEFAULT 'ᚨ',
  accent_color TEXT NOT NULL DEFAULT '#A78BFA',
  script_style TEXT NOT NULL DEFAULT 'runic',
  lexicon JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publish_targets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'vercel',
  webhook_url TEXT NOT NULL,
  public_base_url TEXT NOT NULL DEFAULT '',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publish_snapshots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  workspace_slug TEXT NOT NULL,
  version INTEGER NOT NULL,
  published_by TEXT NOT NULL,
  public_entry_count INTEGER NOT NULL DEFAULT 0,
  webhook_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_status TEXT NOT NULL DEFAULT 'local-only',
  public_url TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unified state store table (supports zero-friction atomic sync when PostgreSQL is connected)
CREATE TABLE IF NOT EXISTS codex_state_store (
  store_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
