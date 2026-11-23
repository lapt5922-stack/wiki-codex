import type { CodexModuleId } from "./codex-modules";
import { CODEX_MODULES } from "./codex-modules";

export type UniversalEntityKind =
  | "world"
  | "kingdom"
  | "character"
  | "organization"
  | "location"
  | "history"
  | "event"
  | "lore"
  | "power"
  | "item"
  | "culture"
  | "religion"
  | "technology"
  | "species"
  | "document";

const KIND_TO_PREFIX: Record<UniversalEntityKind, string> = {
  world: "WRLD",
  kingdom: "KING",
  character: "CHAR",
  organization: "ORG",
  location: "LOC",
  history: "HIST",
  event: "EVT",
  lore: "LORE",
  power: "PWR",
  item: "ITEM",
  culture: "CUL",
  religion: "REL",
  technology: "TECH",
  species: "RACE",
  document: "DOC"
};

/**
 * Computes a deterministic, immutable Universal ID for any record across the platform.
 * - Already-canonical IDs (CHAR-000001, KING-000001, DOC-000001, etc.) are preserved verbatim.
 * - Nation Wiki entries `ent-nation-N` map canonically to `KING-00000N`.
 * - Legacy `ent-*` or `evt-*` records receive a stable hash-based numeric code under their namespace
 *   so renaming the record title NEVER changes its Universal ID!
 */
export function resolveUniversalId(
  recordId: string,
  kind: UniversalEntityKind | CodexModuleId = "lore"
): string {
  const trimmed = (recordId || "").trim();
  if (/^(WRLD|KING|CHAR|ORG|LOC|HIST|EVT|LORE|PWR|ITEM|CUL|REL|TECH|RACE|DOC)-\d{6}$/.test(trimmed)) {
    return trimmed;
  }

  const nationMatch = /^ent-nation-(\d+)$/i.exec(trimmed);
  if (nationMatch) {
    return `KING-${String(Number(nationMatch[1])).padStart(6, "0")}`;
  }

  const prefix = KIND_TO_PREFIX[kind as UniversalEntityKind] || "LORE";
  // Deterministic FNV-1a 32-bit hash -> 6-digit stable identifier (never changes on title rename)
  let hash = 2166136261;
  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = (Math.abs(hash) % 899999) + 100000;
  return `${prefix}-${String(num).padStart(6, "0")}`;
}

export function getNamespaceMeta(kind: UniversalEntityKind) {
  const mod = CODEX_MODULES.find((m) => m.id === kind);
  if (mod) {
    return {
      prefix: mod.idPrefix,
      label: mod.titleVi,
      color: mod.accentColor,
      sigil: mod.sigil
    };
  }
  return {
    prefix: "DOC",
    label: "Tư liệu Lịch sử",
    color: "#fbbf24",
    sigil: "📄"
  };
}

export interface FieldDiffItem {
  field: string;
  label: string;
  before: string;
  after: string;
}

const FRIENDLY_FIELD_LABELS: Record<string, string> = {
  title: "Tiêu đề",
  officialName: "Tên chính thức",
  fullName: "Họ và tên",
  subtitle: "Phụ đề",
  summary: "Tóm tắt",
  status: "Trạng thái xuất bản",
  workflowStatus: "Trạng thái quy trình",
  canonStatus: "Trạng thái xác thực",
  visibility: "Phạm vi hiển thị",
  contentMarkdown: "Nội dung bách khoa",
  tags: "Thẻ phân loại",
  capitalName: "Thủ đô",
  governmentType: "Thể chế",
  currencyCode: "Tiền tệ",
  motto: "Danh ngôn",
  portraitUrl: "Ảnh chân dung",
  coverImage: "Ảnh bìa"
};

function stringifyVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string") return v.length > 160 ? `${v.slice(0, 160)}…` : v || "—";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    if (typeof v[0] === "string" || typeof v[0] === "number") return v.join(", ");
    return `[${v.length} mục]`;
  }
  try {
    const s = JSON.stringify(v);
    return s.length > 160 ? `${s.slice(0, 160)}…` : s;
  } catch {
    return "[Object]";
  }
}

/**
 * Computes field-level diff between two version snapshots for transparent Version History inspection.
 */
export function computeFieldLevelDiff(
  beforeObj: Record<string, unknown> | null | undefined,
  afterObj: Record<string, unknown> | null | undefined,
  ignoreKeys = new Set(["updatedAt", "createdAt", "updatedBy", "versionNumber", "id"])
): FieldDiffItem[] {
  const a = beforeObj || {};
  const b = afterObj || {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const diffs: FieldDiffItem[] = [];

  for (const key of keys) {
    if (ignoreKeys.has(key)) continue;
    const va = a[key];
    const vb = b[key];
    if (JSON.stringify(va) === JSON.stringify(vb)) continue;
    diffs.push({
      field: key,
      label: FRIENDLY_FIELD_LABELS[key] || key,
      before: stringifyVal(va),
      after: stringifyVal(vb)
    });
  }
  return diffs;
}
