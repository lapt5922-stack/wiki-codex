import type { ContentAccessLevel } from "@/types/character-codex";

export type FieldDisplayPolicy =
  | "show_when_not_empty"
  | "always_show"
  | "editor_only"
  | "hidden";

export type FreeformFieldKind =
  | "text"
  | "markdown"
  | "number"
  | "progress_bar"
  | "tag_list"
  | "key_value_group"
  | "table"
  | "image_card"
  | "entity_links"
  | "callout_secret";

export interface CustomProfileFieldItem {
  id: string;
  label: string;
  kind: FreeformFieldKind;
  value: string;
  numberValue?: number | null;
  maxValue?: number | null;
  unit?: string;
  barColor?: string;
  tags?: string[];
  kvPairs?: Array<{ key: string; val: string }>;
  tableHeaders?: string[];
  tableRows?: string[][];
  imageUrl?: string;
  imageCaption?: string;
  imageSource?: string;
  entityRefs?: Array<{ id: string; title: string; kind?: string }>;
  pinToInfobox?: boolean;
  displayPolicy?: FieldDisplayPolicy;
  accessLevel?: ContentAccessLevel;
  spoilerLabel?: string;
}

export interface CustomProfileBlock {
  id: string;
  /** Target tab ID (can be a built-in tab ID like 'personality', 'appearance', 'overview', or a custom tab ID) */
  tabId: string;
  title: string;
  subtitle?: string;
  order: number;
  accessLevel?: ContentAccessLevel;
  spoilerLabel?: string;
  fields: CustomProfileFieldItem[];
}

export interface CustomProfileTab {
  id: string;
  label: string;
  sigil?: string;
  order: number;
  accessLevel?: ContentAccessLevel;
}

export interface EntityProfileLayoutConfig {
  /** Whether to display RPG level & 13 combat stat bars on Character profiles */
  enableRpgStats?: boolean;
  /** Built-in tab IDs that the creator chose to hide/delete for this profile */
  hiddenBuiltInTabs?: string[];
  /** Custom labels for built-in tabs */
  renamedBuiltInTabs?: Record<string, string>;
  /** Custom tabs created by the user */
  customTabs?: CustomProfileTab[];
  /** Freeform blocks & fields added inside any built-in or custom tab */
  blocks?: CustomProfileBlock[];
  /** Optional hidden built-in field keys */
  hiddenFieldKeys?: string[];
}

const PLACEHOLDER_STRINGS = new Set([
  "—",
  "-",
  "n/a",
  "chưa cập nhật",
  "không có dữ liệu",
  "chưa xác định",
  "trống"
]);

/**
 * Universal Empty-Field Checker (Section 6.1)
 * - Returns FALSE for null, undefined, "", whitespace-only, placeholder "—", empty array [], or empty object {}.
 * - Distinguishes valid 0 and valid false from empty data!
 */
export function isMeaningfulValue(
  val: unknown,
  opts?: { allowZero?: boolean; allowFalse?: boolean }
): boolean {
  if (val === null || val === undefined) return false;

  if (typeof val === "number") {
    if (Number.isNaN(val)) return false;
    if (val === 0) return opts?.allowZero !== false;
    return true;
  }

  if (typeof val === "boolean") {
    if (val === false) return opts?.allowFalse !== false;
    return true;
  }

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (PLACEHOLDER_STRINGS.has(trimmed.toLowerCase())) return false;
    // Strip separator-only strings like " · () "
    const stripped = trimmed.replace(/[·()\-–—,\s/|]/g, "");
    return stripped.length > 0;
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return false;
    return val.some((item) => isMeaningfulValue(item, opts));
  }

  if (typeof val === "object") {
    const entries = Object.values(val as Record<string, unknown>);
    if (entries.length === 0) return false;
    return entries.some((v) => isMeaningfulValue(v, opts));
  }

  return false;
}

/**
 * Checks whether a CustomProfileFieldItem has meaningful data to display on the Detail Profile.
 */
export function isCustomFieldMeaningful(
  field: CustomProfileFieldItem,
  canEdit = false
): boolean {
  const policy = field.displayPolicy || "show_when_not_empty";
  if (policy === "hidden") return false;
  if (policy === "editor_only" && !canEdit) return false;
  if (policy === "always_show") return true;

  switch (field.kind) {
    case "number":
    case "progress_bar":
      return typeof field.numberValue === "number" && !Number.isNaN(field.numberValue);
    case "tag_list":
      return Array.isArray(field.tags) && field.tags.some((t) => isMeaningfulValue(t));
    case "key_value_group":
      return (
        Array.isArray(field.kvPairs) &&
        field.kvPairs.some((p) => isMeaningfulValue(p.key) && isMeaningfulValue(p.val))
      );
    case "table":
      return (
        Array.isArray(field.tableRows) &&
        field.tableRows.some((r) => r.some((cell) => isMeaningfulValue(cell)))
      );
    case "image_card":
      return isMeaningfulValue(field.imageUrl);
    case "entity_links":
      return Array.isArray(field.entityRefs) && field.entityRefs.length > 0;
    case "text":
    case "markdown":
    case "callout_secret":
    default:
      return isMeaningfulValue(field.value);
  }
}

/**
 * Filters an array of [label, value] rows so that empty rows are completely omitted (never rendering "—").
 */
export function filterMeaningfulRows<T extends [string, unknown]>(
  rows: T[],
  opts?: { allowZero?: boolean; allowFalse?: boolean }
): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const [label, raw] of rows) {
    if (!isMeaningfulValue(raw, opts)) continue;
    if (Array.isArray(raw)) {
      const joined = raw
        .map((x) => String(x ?? "").trim())
        .filter((x) => isMeaningfulValue(x, opts))
        .join(", ");
      if (joined) out.push([label, joined]);
    } else {
      out.push([label, String(raw).trim()]);
    }
  }
  return out;
}

/**
 * Joins multiple optional parts with a separator, omitting empty parts and returning "" if all are empty.
 */
export function joinMeaningfulParts(
  parts: Array<string | number | null | undefined>,
  sep = " · "
): string {
  return parts
    .filter((p) => isMeaningfulValue(p))
    .map((p) => String(p).trim())
    .join(sep);
}
