import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { UserRole } from "@/types/codex";
import type { EditorialVerificationStatus } from "@/lib/codex-modules";
import type { UniversalEntityKind } from "@/lib/universal-id";
import { matchesVietnameseQuery, normalizeVietnamese } from "@/lib/vietnamese";
import { getPostgresPool, isPostgresConfigured } from "./pool";
import { loadState } from "./repository";
import { loadCharacterState } from "./character-repository";
import { queryKingdoms } from "./kingdom-repository";

export interface RelationTypeDef {
  id: string;
  workspaceId: string;
  code: string;
  labelVi: string;
  inverseLabelVi: string;
  category: "political" | "social" | "family" | "historical" | "possession" | "geographic" | "general";
  color: string;
  isSystem: boolean;
  createdAt: string;
}

export interface UniversalRelationSource {
  title: string;
  urlOrRef?: string;
  note?: string;
}

export interface UniversalRelationRecord {
  id: string;
  workspaceId: string;
  sourceId: string;
  sourceKind: UniversalEntityKind;
  sourceTitle: string;
  targetId: string;
  targetKind: UniversalEntityKind;
  targetTitle: string;
  relationTypeCode: string;
  relationLabel: string;
  description: string;
  startDate: string;
  endDate: string;
  sources: UniversalRelationSource[];
  verificationStatus: EditorialVerificationStatus;
  notes: string;
  accessLevel: "public" | "editor_only" | "admin_only";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuggestedRelationCandidate {
  id: string;
  sourceId: string;
  sourceKind: UniversalEntityKind;
  sourceTitle: string;
  targetId: string;
  targetKind: UniversalEntityKind;
  targetTitle: string;
  suggestedTypeCode: string;
  suggestedLabel: string;
  reason: string;
}

interface UniversalRelationsStore {
  relationTypes: RelationTypeDef[];
  relations: UniversalRelationRecord[];
}

const LOCAL_FILE = path.join(process.cwd(), ".data", "universal-relations.json");
let cachedStore: UniversalRelationsStore | null = null;
let pgInit = false;

const DEFAULT_SYSTEM_RELATION_TYPES: Omit<RelationTypeDef, "workspaceId" | "createdAt">[] = [
  { id: "rtype-belongs", code: "belongs_to", labelVi: "Thuộc về", inverseLabelVi: "Bao gồm", category: "general", color: "#38bdf8", isSystem: true },
  { id: "rtype-owns", code: "owns", labelVi: "Sở hữu", inverseLabelVi: "Thuộc sở hữu của", category: "possession", color: "#f59e0b", isSystem: true },
  { id: "rtype-member", code: "member_of", labelVi: "Thành viên", inverseLabelVi: "Có thành viên", category: "social", color: "#a78bfa", isSystem: true },
  { id: "rtype-leader", code: "leader_of", labelVi: "Người đứng đầu", inverseLabelVi: "Được lãnh đạo bởi", category: "political", color: "#fbbf24", isSystem: true },
  { id: "rtype-ally", code: "ally_of", labelVi: "Đồng minh", inverseLabelVi: "Đồng minh", category: "political", color: "#34d399", isSystem: true },
  { id: "rtype-rival", code: "rival_of", labelVi: "Đối địch", inverseLabelVi: "Đối địch", category: "political", color: "#fb7185", isSystem: true },
  { id: "rtype-parent", code: "parent_of", labelVi: "Cha mẹ", inverseLabelVi: "Con cái", category: "family", color: "#22d3ee", isSystem: true },
  { id: "rtype-child", code: "child_of", labelVi: "Con cái", inverseLabelVi: "Cha mẹ", category: "family", color: "#22d3ee", isSystem: true },
  { id: "rtype-spouse", code: "married_to", labelVi: "Hôn nhân", inverseLabelVi: "Hôn nhân", category: "family", color: "#f472b6", isSystem: true },
  { id: "rtype-heir", code: "heir_of", labelVi: "Người kế vị", inverseLabelVi: "Tiền nhiệm của", category: "family", color: "#eab308", isSystem: true },
  { id: "rtype-founder", code: "founder_of", labelVi: "Người sáng lập", inverseLabelVi: "Được sáng lập bởi", category: "historical", color: "#c084fc", isSystem: true },
  { id: "rtype-participated", code: "participated_in", labelVi: "Tham gia sự kiện", inverseLabelVi: "Có sự tham gia của", category: "historical", color: "#fb923c", isSystem: true },
  { id: "rtype-occurred", code: "occurred_at", labelVi: "Xảy ra tại", inverseLabelVi: "Là nơi diễn ra", category: "geographic", color: "#4ade80", isSystem: true },
  { id: "rtype-created", code: "created_by", labelVi: "Được tạo ra bởi", inverseLabelVi: "Chế tác / Sáng tạo", category: "possession", color: "#60a5fa", isSystem: true },
  { id: "rtype-origin", code: "originated_from", labelVi: "Có nguồn gốc từ", inverseLabelVi: "Là nguồn gốc của", category: "geographic", color: "#2dd4bf", isSystem: true },
  { id: "rtype-influences", code: "influences", labelVi: "Ảnh hưởng đến", inverseLabelVi: "Chịu ảnh hưởng từ", category: "general", color: "#e879f9", isSystem: true }
];

function buildDefaultStore(): UniversalRelationsStore {
  const now = new Date().toISOString();
  return {
    relationTypes: DEFAULT_SYSTEM_RELATION_TYPES.map((t) => ({
      ...t,
      workspaceId: "*",
      createdAt: now
    })),
    relations: [
      {
        id: "UREL-000001",
        workspaceId: "ws-aethelgard",
        sourceId: "CHAR-000001",
        sourceKind: "character",
        sourceTitle: "Hoàng Đế Aurelius Solis III",
        targetId: "KING-000001",
        targetKind: "kingdom",
        targetTitle: "Đế chế Hoàng Kim Solana",
        relationTypeCode: "leader_of",
        relationLabel: "Người đứng đầu",
        description: "Đương kim Hoàng đế trị vì Đế chế Hoàng Kim Solana và người ký Hiệp ước Ánh Dương.",
        startDate: "Năm 762",
        endDate: "Hiện tại",
        sources: [{ title: "Biên niên sử Hoàng triều Solana", note: "Bản chính thức lưu tại Tháp Tinh Tú" }],
        verificationStatus: "canon",
        notes: "Quan hệ chuẩn hóa 2 chiều giữa Character Codex và Kingdom Codex.",
        accessLevel: "public",
        createdBy: "System",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "UREL-000002",
        workspaceId: "ws-aethelgard",
        sourceId: "CHAR-000002",
        sourceKind: "character",
        sourceTitle: "Lyraen Vaelor",
        targetId: "KING-000002",
        targetKind: "kingdom",
        targetTitle: "Vương quốc Băng Triều",
        relationTypeCode: "originated_from",
        relationLabel: "Có nguồn gốc từ",
        description: "Đại Sử Gia xuất thân từ Gia tộc Vaelor thuộc Vương quốc Băng Triều.",
        startDate: "Năm 288",
        endDate: "Năm 374",
        sources: [{ title: "Gia phả Gia tộc Vaelor" }],
        verificationStatus: "verified",
        notes: "",
        accessLevel: "public",
        createdBy: "System",
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

async function ensurePgTable() {
  if (pgInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_universal_relations_blob (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgInit = true;
}

export async function loadUniversalRelationsStore(): Promise<UniversalRelationsStore> {
  if (cachedStore) return cachedStore;

  if (isPostgresConfigured()) {
    try {
      await ensurePgTable();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query(
          `SELECT payload FROM codex_universal_relations_blob WHERE id = 'primary' LIMIT 1`
        );
        if (res.rows[0]?.payload) {
          cachedStore = res.rows[0].payload as UniversalRelationsStore;
          return cachedStore;
        }
      }
    } catch {
      // fall through
    }
  }

  if (fs.existsSync(LOCAL_FILE)) {
    try {
      cachedStore = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as UniversalRelationsStore;
      return cachedStore;
    } catch {
      // fall through
    }
  }

  cachedStore = buildDefaultStore();
  return cachedStore;
}

async function saveUniversalRelationsStore(store: UniversalRelationsStore) {
  cachedStore = store;
  if (isPostgresConfigured()) {
    try {
      await ensurePgTable();
      const pool = getPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO codex_universal_relations_blob (id, payload, updated_at)
           VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(store)]
        );
      }
    } catch {
      // ignore
    }
  }
  try {
    const dir = path.dirname(LOCAL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // ignore
  }
}

function canViewRelation(rel: UniversalRelationRecord, role: UserRole): boolean {
  if (rel.accessLevel === "public") return true;
  if (rel.accessLevel === "editor_only") return role === "editor" || role === "admin";
  return role === "admin";
}

export async function listUniversalRelations(opts: {
  workspaceId: string;
  role: UserRole;
  q?: string;
  entityId?: string;
  relationTypeCode?: string;
  verificationStatus?: string;
}) {
  const store = await loadUniversalRelationsStore();
  const types = store.relationTypes.filter(
    (t) => t.workspaceId === "*" || t.workspaceId === opts.workspaceId
  );

  const relations = store.relations.filter((r) => {
    if (opts.workspaceId && r.workspaceId !== opts.workspaceId) return false;
    if (!canViewRelation(r, opts.role)) return false;
    if (opts.entityId && r.sourceId !== opts.entityId && r.targetId !== opts.entityId) return false;
    if (opts.relationTypeCode && r.relationTypeCode !== opts.relationTypeCode) return false;
    if (opts.verificationStatus && r.verificationStatus !== opts.verificationStatus) return false;
    if (opts.q && opts.q.trim()) {
      const hay = `${r.id} ${r.sourceId} ${r.sourceTitle} ${r.targetId} ${r.targetTitle} ${r.relationLabel} ${r.description} ${r.notes}`;
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });

  return { relations, relationTypes: types };
}

export async function createUniversalRelation(
  input: Omit<UniversalRelationRecord, "id" | "createdAt" | "updatedAt">
): Promise<UniversalRelationRecord> {
  const store = await loadUniversalRelationsStore();
  const now = new Date().toISOString();
  const nextNum = store.relations.length + 1;
  const id = `UREL-${String(nextNum).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`;
  const rec: UniversalRelationRecord = {
    ...input,
    id,
    createdAt: now,
    updatedAt: now
  };
  store.relations.unshift(rec);
  await saveUniversalRelationsStore(store);
  return rec;
}

export async function updateUniversalRelation(
  id: string,
  patch: Partial<Omit<UniversalRelationRecord, "id" | "createdAt">>
): Promise<UniversalRelationRecord | null> {
  const store = await loadUniversalRelationsStore();
  const found = store.relations.find((r) => r.id === id);
  if (!found) return null;
  Object.assign(found, patch, { updatedAt: new Date().toISOString() });
  await saveUniversalRelationsStore(store);
  return found;
}

export async function deleteUniversalRelation(id: string): Promise<boolean> {
  const store = await loadUniversalRelationsStore();
  const before = store.relations.length;
  store.relations = store.relations.filter((r) => r.id !== id);
  if (store.relations.length === before) return false;
  await saveUniversalRelationsStore(store);
  return true;
}

export async function createCustomRelationType(input: {
  workspaceId: string;
  labelVi: string;
  inverseLabelVi?: string;
  category?: RelationTypeDef["category"];
  color?: string;
}): Promise<RelationTypeDef> {
  const store = await loadUniversalRelationsStore();
  const now = new Date().toISOString();
  const code = normalizeVietnamese(input.labelVi)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const def: RelationTypeDef = {
    id: `rtype-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
    workspaceId: input.workspaceId,
    code: code || `custom_${Date.now()}`,
    labelVi: input.labelVi.trim(),
    inverseLabelVi: (input.inverseLabelVi || input.labelVi).trim(),
    category: input.category || "general",
    color: input.color || "#38bdf8",
    isSystem: false,
    createdAt: now
  };
  store.relationTypes.push(def);
  await saveUniversalRelationsStore(store);
  return def;
}

/**
 * Auto-detects candidate links across Characters, Kingdoms, and Wiki Entries based on names/nationalities/IDs.
 * NEVER auto-creates official relations — returns proposals for Editor/Admin confirmation!
 */
export async function suggestCandidateRelations(
  workspaceId: string
): Promise<SuggestedRelationCandidate[]> {
  const [store, charState, kingRes, wikiState] = await Promise.all([
    loadUniversalRelationsStore(),
    loadCharacterState(),
    queryKingdoms({ workspaceId, role: "admin", page: 1, limit: 360 }),
    loadState()
  ]);

  const existingPairSet = new Set(
    store.relations.map((r) => `${r.sourceId}::${r.targetId}::${r.relationTypeCode}`)
  );
  const suggestions: SuggestedRelationCandidate[] = [];

  // 1. Match Character nationality -> Kingdom officialName / commonName
  const activeChars = charState.characters.filter(
    (c) => !c.deletedAt && c.workspaceId === workspaceId
  );
  for (const ch of activeChars) {
    if (!ch.nationality) continue;
    const normNat = normalizeVietnamese(ch.nationality);
    const matchedKing = kingRes.items.find(
      (k) =>
        normalizeVietnamese(k.officialName).includes(normNat) ||
        normalizeVietnamese(k.commonName).includes(normNat) ||
        normNat.includes(normalizeVietnamese(k.commonName))
    );
    if (matchedKing) {
      const key = `${ch.id}::${matchedKing.id}::belongs_to`;
      if (!existingPairSet.has(key)) {
        suggestions.push({
          id: `sug-${ch.id}-${matchedKing.id}`,
          sourceId: ch.id,
          sourceKind: "character",
          sourceTitle: ch.fullName,
          targetId: matchedKing.id,
          targetKind: "kingdom",
          targetTitle: matchedKing.officialName,
          suggestedTypeCode: "belongs_to",
          suggestedLabel: "Thuộc về",
          reason: `Quốc tịch "${ch.nationality}" khớp với hồ sơ ${matchedKing.id}`
        });
      }
    }
  }

  // 2. Match Wiki Entry [[Wikilinks]] mentioning known Characters
  const wsEntries = wikiState.entries.filter((e) => !e.deletedAt && e.workspaceId === workspaceId);
  for (const ch of activeChars.slice(0, 20)) {
    const normName = normalizeVietnamese(ch.fullName);
    if (normName.length < 4) continue;
    for (const ent of wsEntries.slice(0, 80)) {
      if (ent.id.startsWith("ent-nation-")) continue;
      if (normalizeVietnamese(ent.contentMarkdown).includes(normName)) {
        const key = `${ch.id}::${ent.id}::influences`;
        if (!existingPairSet.has(key)) {
          suggestions.push({
            id: `sug-${ch.id}-${ent.id}`,
            sourceId: ch.id,
            sourceKind: "character",
            sourceTitle: ch.fullName,
            targetId: ent.id,
            targetKind: "lore",
            targetTitle: ent.title,
            suggestedTypeCode: "influences",
            suggestedLabel: "Ảnh hưởng đến",
            reason: `Tên nhân vật xuất hiện trong nội dung hồ sơ "${ent.title}"`
          });
        }
      }
    }
  }

  return suggestions.slice(0, 20);
}
