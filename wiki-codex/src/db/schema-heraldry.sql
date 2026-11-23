-- ============================================================================
-- AETHEL CODEX — ROYAL HERALDRY STUDIO SCHEMA (ROLLBACK-SAFE, ZERO-BREAKAGE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS heraldry_designs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'kingdom_emblem',
  style TEXT NOT NULL DEFAULT 'imperial',
  mode TEXT NOT NULL DEFAULT 'template',
  design_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_official BOOLEAN NOT NULL DEFAULT FALSE,
  linked_kingdom_id TEXT,
  linked_entity_id TEXT,
  era_label TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  change_reason TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL DEFAULT 'Admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_heraldry_ws ON heraldry_designs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_heraldry_king ON heraldry_designs(linked_kingdom_id);

CREATE TABLE IF NOT EXISTS heraldry_versions (
  id TEXT PRIMARY KEY,
  design_id TEXT NOT NULL REFERENCES heraldry_designs(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  editor_name TEXT NOT NULL,
  change_note TEXT NOT NULL DEFAULT '',
  design_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_heraldry_ver_design ON heraldry_versions(design_id);
