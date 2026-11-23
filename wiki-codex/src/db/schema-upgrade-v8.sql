-- ============================================================================
-- AETHEL CODEX — V8.0 UPGRADE MIGRATION (ROLLBACK-SAFE, ZERO-BREAKAGE)
-- Adds Universal ID Registry, Extensible Relation Types, Universal Relations,
-- Health Audit Resolutions, Historical Documents, Event Perspectives & AI Queue.
-- ============================================================================

CREATE TABLE IF NOT EXISTS codex_universal_ids (
  universal_id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  namespace TEXT NOT NULL,
  entity_kind TEXT NOT NULL,
  record_id TEXT NOT NULL,
  canonical_title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, entity_kind, record_id)
);
CREATE INDEX IF NOT EXISTS idx_uid_workspace ON codex_universal_ids(workspace_id);
CREATE INDEX IF NOT EXISTS idx_uid_namespace ON codex_universal_ids(namespace);

CREATE TABLE IF NOT EXISTS codex_relation_types (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  code TEXT NOT NULL,
  label_vi TEXT NOT NULL,
  inverse_label_vi TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  color TEXT NOT NULL DEFAULT '#38bdf8',
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rel_types_ws ON codex_relation_types(workspace_id);

CREATE TABLE IF NOT EXISTS codex_universal_relations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_title TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_title TEXT NOT NULL,
  relation_type_code TEXT NOT NULL,
  relation_label TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  start_date TEXT NOT NULL DEFAULT '',
  end_date TEXT NOT NULL DEFAULT '',
  sources_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  notes TEXT NOT NULL DEFAULT '',
  access_level TEXT NOT NULL DEFAULT 'public',
  created_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_urel_ws ON codex_universal_relations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_urel_source ON codex_universal_relations(source_id);
CREATE INDEX IF NOT EXISTS idx_urel_target ON codex_universal_relations(target_id);
CREATE INDEX IF NOT EXISTS idx_urel_type ON codex_universal_relations(relation_type_code);

CREATE TABLE IF NOT EXISTS codex_health_resolutions (
  issue_key TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  note TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT 'Admin',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_res_ws ON codex_health_resolutions(workspace_id);
