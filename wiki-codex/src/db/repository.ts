import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  ActivityLogItem,
  AtlasMap,
  AtlasPin,
  AtlasRoute,
  Category,
  ChronicleChapter,
  CodexAnalyticsSummary,
  CodexDatabaseState,
  CodexTemplate,
  ConlangLanguage,
  ConlangWord,
  CuratedCollection,
  EditorialNote,
  EditorialTask,
  EntityHolding,
  Entry,
  EntryCardProjection,
  EntryRelation,
  EntryRevision,
  EntryStatus,
  EntryType,
  EntryVisibility,
  GlossaryTerm,
  HierarchyChart,
  HydratedHolding,
  Loreboard,
  MediaAsset,
  PaginatedEntriesResult,
  PropertyBlueprint,
  PublishSnapshot,
  PublishTarget,
  SavedView,
  TaxonomyNode,
  TimelineEvent,
  TradeCommodity,
  UserRole,
  WorldCalendar,
  WorldSystemRule,
  WorldUnit,
  Workspace
} from "@/types/codex";
import { computeCodexAnalytics } from "@/lib/v4-engines";
import {
  entrySupportsPower,
  entryTypeSupportsPower,
  extractCardHighlights
} from "@/lib/v5-properties";
import { getPostgresPool, isPostgresConfigured } from "./pool";
import { createInitialSeedState } from "./seed-data";
import { renameWikilinkAcrossMarkdown } from "@/lib/wiki-auditor-pro";
import { extractEconomySummary } from "@/lib/economy-engine";
import {
  countWords,
  matchesVietnameseQuery,
  normalizeVietnamese,
  slugifyVietnamese
} from "@/lib/vietnamese";
import {
  getDescendantCategoryIds,
  wouldCreateCategoryCycle
} from "@/lib/category-tree";
import { extractWikilinks } from "@/lib/wikilinks";
import { filterEntriesForRole, sanitizeEntryForRole } from "@/lib/rbac";
import { buildAlphabetForStyle, toAncientScript } from "@/lib/conlang";

const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_DATA_FILE = path.join(LOCAL_DATA_DIR, "codex-db.json");

let cachedState: CodexDatabaseState | null = null;
let storageBackend: "postgresql" | "local-json" = "local-json";
let pgInitialized = false;

export function generateId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

export function getStorageInfo(): {
  backend: "postgresql" | "local-json";
  postgresConfigured: boolean;
} {
  return {
    backend: storageBackend,
    postgresConfigured: isPostgresConfigured()
  };
}

/**
 * Seamlessly upgrade V1.0 persisted JSON/Postgres states to V2.0 Grand Edition
 * by backfilling any missing V2.0 collections, new categories, or new entry types.
 */
function hydrateV2State(raw: Partial<CodexDatabaseState>): CodexDatabaseState {
  const seed = createInitialSeedState();
  const state: CodexDatabaseState = {
    users: raw.users ?? seed.users,
    workspaces: raw.workspaces ?? seed.workspaces,
    categories: raw.categories ?? seed.categories,
    entryTypes: raw.entryTypes ?? seed.entryTypes,
    entries: raw.entries ?? seed.entries,
    revisions: raw.revisions ?? seed.revisions,
    relations: raw.relations ?? seed.relations,
    timelineEvents: raw.timelineEvents ?? seed.timelineEvents,
    atlasMaps: raw.atlasMaps ?? seed.atlasMaps,
    atlasPins: raw.atlasPins ?? seed.atlasPins,
    atlasRoutes: raw.atlasRoutes ?? seed.atlasRoutes,
    conlangs: raw.conlangs ?? seed.conlangs,
    templates: raw.templates ?? seed.templates,
    loreboards: raw.loreboards ?? seed.loreboards,
    calendars: raw.calendars ?? seed.calendars,
    mediaAssets: raw.mediaAssets ?? seed.mediaAssets,
    glossaryTerms: raw.glossaryTerms ?? seed.glossaryTerms,
    collections: raw.collections ?? seed.collections,
    editorialTasks: raw.editorialTasks ?? seed.editorialTasks,
    activityLog: raw.activityLog ?? seed.activityLog,
    worldUnits: raw.worldUnits ?? seed.worldUnits,
    savedViews: raw.savedViews ?? seed.savedViews,
    hierarchyCharts: raw.hierarchyCharts ?? seed.hierarchyCharts,
    systemRules: raw.systemRules ?? seed.systemRules,
    taxonomyNodes: raw.taxonomyNodes ?? seed.taxonomyNodes,
    tradeCommodities: raw.tradeCommodities ?? seed.tradeCommodities,
    chronicleChapters: raw.chronicleChapters ?? seed.chronicleChapters,
    propertyBlueprints: raw.propertyBlueprints ?? seed.propertyBlueprints,
    holdings: raw.holdings ?? seed.holdings,
    publishTargets: raw.publishTargets ?? seed.publishTargets,
    publishSnapshots: raw.publishSnapshots ?? seed.publishSnapshots
  };

  // V6.0 Auto-Migration: backfill holdings & holdings/roster tabs + flagship dossier modules
  if (!raw.holdings) {
    for (const st of seed.entryTypes) {
      const existing = state.entryTypes.find((t) => t.id === st.id);
      if (existing) {
        for (const tab of ["holdings", "roster"] as const) {
          if (st.enabledTabs.includes(tab) && !existing.enabledTabs.includes(tab)) {
            existing.enabledTabs.splice(1, 0, tab);
          }
        }
      }
    }
    const bt = state.entries.find((e) => e.id === "ent-bang-trieu");
    const seedBt = seed.entries.find((e) => e.id === "ent-bang-trieu");
    if (bt && seedBt) {
      if (!bt.roster || bt.roster.length === 0) bt.roster = seedBt.roster;
      if (!bt.lawsAndCustoms || bt.lawsAndCustoms.length === 0) bt.lawsAndCustoms = seedBt.lawsAndCustoms;
      if (!bt.forceUnits || bt.forceUnits.length === 0) bt.forceUnits = seedBt.forceUnits;
      if (!bt.resourceItems || bt.resourceItems.length === 0) bt.resourceItems = seedBt.resourceItems;
      if (!bt.rumorsAndSecrets || bt.rumorsAndSecrets.length === 0) bt.rumorsAndSecrets = seedBt.rumorsAndSecrets;
    }
  }

  // V5.0 Auto-Migration: Fix non-power types having "power" tab, sync 14 types & new seed entries
  if (!raw.propertyBlueprints) {
    const seedTypeMap = new Map(seed.entryTypes.map((t) => [t.id, t]));
    for (const st of seed.entryTypes) {
      const existing = state.entryTypes.find((t) => t.id === st.id);
      if (!existing) {
        state.entryTypes.push(st);
      } else {
        existing.supportsPower = st.supportsPower;
        existing.supportsVariants = st.supportsVariants;
        existing.powerPresetKind = st.powerPresetKind;
        existing.cardStyle = st.cardStyle;
        if (st.supportsPower === false) {
          existing.enabledTabs = existing.enabledTabs.filter((tab) => tab !== "power");
        }
        // Merge any new V5 schema fields without removing user's custom fields
        const existingKeys = new Set(existing.fieldSchema.map((f) => f.key));
        for (const sf of st.fieldSchema) {
          if (!existingKeys.has(sf.key)) existing.fieldSchema.push(sf);
        }
      }
    }
    // Also clean up any custom non-power type
    for (const et of state.entryTypes) {
      if (!seedTypeMap.has(et.id) && !entryTypeSupportsPower(et)) {
        et.supportsPower = false;
        et.enabledTabs = et.enabledTabs.filter((tab) => tab !== "power");
      }
    }
    // Migrate ent-aethelva from type-lore -> type-language & backfill V5 entries
    const aethelva = state.entries.find((e) => e.id === "ent-aethelva");
    const seedAethelva = seed.entries.find((e) => e.id === "ent-aethelva");
    if (aethelva && seedAethelva) {
      aethelva.entryTypeId = "type-language";
      aethelva.powerLevel = undefined;
      aethelva.powerInfinite = false;
      if (!aethelva.extraFields || aethelva.extraFields.length === 0) {
        aethelva.extraFields = seedAethelva.extraFields;
      }
      aethelva.customFields = { ...seedAethelva.customFields, ...aethelva.customFields };
    }
    const existingEntryIds = new Set(state.entries.map((e) => e.id));
    for (const se of seed.entries) {
      if (!existingEntryIds.has(se.id)) {
        state.entries.push(se);
      }
    }
  }

  // V4.0 Auto-Migration: backfill multi-moons/holidays on calendars & flagship variants
  if (!raw.hierarchyCharts) {
    for (const seedCal of seed.calendars) {
      const targetCal = state.calendars.find((c) => c.id === seedCal.id);
      if (targetCal) {
        if (!targetCal.moons || targetCal.moons.length === 0) targetCal.moons = seedCal.moons;
        if (!targetCal.holidays || targetCal.holidays.length === 0) targetCal.holidays = seedCal.holidays;
      }
    }
    for (const seedEnt of seed.entries) {
      if (seedEnt.variants && seedEnt.variants.length > 0) {
        const targetEnt = state.entries.find((e) => e.id === seedEnt.id);
        if (targetEnt && (!targetEnt.variants || targetEnt.variants.length === 0)) {
          targetEnt.variants = seedEnt.variants;
        }
      }
    }
  }

  // V3.0 Auto-Migration: ensure 6 languages + alphabets + power tab + flagship power stats
  if (!raw.worldUnits) {
    const existingLangIds = new Set(state.conlangs.map((l) => l.id));
    for (const lang of seed.conlangs) {
      if (!existingLangIds.has(lang.id)) {
        state.conlangs.push(lang);
      }
    }
    for (const lang of state.conlangs) {
      if (!lang.alphabet || lang.alphabet.length === 0) {
        lang.alphabet = buildAlphabetForStyle(lang.scriptStyle);
      }
    }
    for (const et of state.entryTypes) {
      if (entryTypeSupportsPower(et) && !et.enabledTabs.includes("power")) {
        et.enabledTabs.splice(1, 0, "power");
      }
    }
    for (const seedEnt of seed.entries) {
      const target = state.entries.find((e) => e.id === seedEnt.id);
      if (target && target.powerLevel === undefined && seedEnt.powerLevel !== undefined) {
        target.powerLevel = seedEnt.powerLevel;
        target.powerSourceLabel = seedEnt.powerSourceLabel;
        target.attributes = seedEnt.attributes;
        target.powerHistory = seedEnt.powerHistory;
        target.abilities = seedEnt.abilities;
        target.feats = seedEnt.feats;
      }
    }
  }

  // Backfill new V2.0 categories & entry types if migrating from V1.0 local store
  if (!raw.templates) {
    const existingCatIds = new Set(state.categories.map((c) => c.id));
    for (const c of seed.categories) {
      if (!existingCatIds.has(c.id)) state.categories.push(c);
    }
    const existingTypeIds = new Set(state.entryTypes.map((t) => t.id));
    for (const t of seed.entryTypes) {
      if (!existingTypeIds.has(t.id)) state.entryTypes.push(t);
    }
    const existingEntryIds = new Set(state.entries.map((e) => e.id));
    for (const e of seed.entries) {
      if (!existingEntryIds.has(e.id)) state.entries.push(e);
    }
    // Enrich flagship entry with V2.0 epigraph/sections/eras/bars if absent
    const bt = state.entries.find((e) => e.id === "ent-bang-trieu");
    const seedBt = seed.entries.find((e) => e.id === "ent-bang-trieu");
    if (bt && seedBt && !bt.epigraph) {
      bt.epigraph = seedBt.epigraph;
      bt.aliases = seedBt.aliases;
      bt.canonStatus = seedBt.canonStatus;
      bt.featured = true;
      bt.customSections = seedBt.customSections;
      bt.eraSnapshots = seedBt.eraSnapshots;
      bt.breakdownBars = seedBt.breakdownBars;
    }
  }

  // Planetary 360-Nation Auto-Migration: ensure all 9 continent categories, 360 nation dossiers, and alliance relations exist
  if (!state.entries.some((e) => e.id === "ent-nation-1")) {
    const existingCatIds = new Set(state.categories.map((c) => c.id));
    for (const c of seed.categories) {
      if (c.id.startsWith("cat-cont-") && !existingCatIds.has(c.id)) {
        state.categories.push(c);
      }
    }
    const existingEntryIds = new Set(state.entries.map((e) => e.id));
    for (const e of seed.entries) {
      if (e.id.startsWith("ent-nation-") && !existingEntryIds.has(e.id)) {
        state.entries.push(e);
      }
    }
    const existingRelIds = new Set(state.relations.map((r) => r.id));
    for (const r of seed.relations) {
      if (r.id.startsWith("rel-planet-") && !existingRelIds.has(r.id)) {
        state.relations.push(r);
      }
    }
  } else {
    // Backfill rich Kingdom modules onto existing 360 nation entries without overwriting manual edits
    const seedNationById = new Map(
      seed.entries.filter((e) => e.id.startsWith("ent-nation-")).map((e) => [e.id, e])
    );
    for (const ent of state.entries) {
      if (!ent.id.startsWith("ent-nation-")) continue;
      const src = seedNationById.get(ent.id);
      if (!src) continue;
      if (!ent.roster?.length) {
        ent.epigraph = ent.epigraph ?? src.epigraph;
        ent.roster = src.roster;
        ent.lawsAndCustoms = src.lawsAndCustoms;
        ent.resourceItems = src.resourceItems;
        ent.rumorsAndSecrets = src.rumorsAndSecrets;
        ent.customSections = src.customSections;
        ent.breakdownBars = src.breakdownBars;
        ent.eraSnapshots = src.eraSnapshots;
      }
      // V7.0 Economy Profile & Emblem Backfill
      if (!ent.economyProfile && src.economyProfile) {
        ent.economyProfile = src.economyProfile;
      }
      if (!ent.emblemConfig && src.emblemConfig) {
        ent.emblemConfig = src.emblemConfig;
      }
      if (!ent.tabOverrides?.enabled?.includes("economy")) {
        ent.tabOverrides = {
          enabled: Array.from(new Set([...(ent.tabOverrides?.enabled ?? []), "economy"])),
          disabled: ent.tabOverrides?.disabled
        };
      }
    }
  }

  // V7.0 Auto-Migration: Ensure Economy category + subcategories & "economy" tab on relevant entryTypes
  const existingCatIdsV7 = new Set(state.categories.map((c) => c.id));
  for (const c of seed.categories) {
    if ((c.id === "cat-kinh-te" || c.id.startsWith("cat-econ-")) && !existingCatIdsV7.has(c.id)) {
      state.categories.push(c);
    }
  }
  for (const st of seed.entryTypes) {
    if (!st.enabledTabs.includes("economy")) continue;
    const existing = state.entryTypes.find((t) => t.id === st.id);
    if (existing && !existing.enabledTabs.includes("economy")) {
      existing.enabledTabs.splice(1, 0, "economy");
    }
  }

  return state;
}

async function ensurePostgresTable(): Promise<boolean> {
  const pool = getPostgresPool();
  if (!pool) return false;
  if (pgInitialized) return true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS codex_state_store (
        store_key TEXT PRIMARY KEY,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    pgInitialized = true;
    return true;
  } catch (err) {
    console.warn("[WikiCodex] PostgreSQL unavailable, falling back to local JSON store:", err);
    return false;
  }
}

export async function loadState(): Promise<CodexDatabaseState> {
  if (cachedState) return cachedState;

  if (isPostgresConfigured()) {
    const ok = await ensurePostgresTable();
    const pool = getPostgresPool();
    if (ok && pool) {
      try {
        const res = await pool.query<{ payload: Partial<CodexDatabaseState> }>(
          "SELECT payload FROM codex_state_store WHERE store_key = $1",
          ["primary"]
        );
        if (res.rows.length > 0 && res.rows[0].payload) {
          cachedState = hydrateV2State(res.rows[0].payload);
          storageBackend = "postgresql";
          return cachedState;
        }
        const seed = createInitialSeedState();
        await pool.query(
          `INSERT INTO codex_state_store (store_key, payload, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (store_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          ["primary", JSON.stringify(seed)]
        );
        cachedState = seed;
        storageBackend = "postgresql";
        return cachedState;
      } catch (err) {
        console.warn("[WikiCodex] PostgreSQL read error, falling back to local JSON:", err);
      }
    }
  }

  storageBackend = "local-json";
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const raw = fs.readFileSync(LOCAL_DATA_FILE, "utf8");
      const hydrated = hydrateV2State(JSON.parse(raw) as Partial<CodexDatabaseState>);
      cachedState = hydrated;
      return cachedState;
    }
  } catch (err) {
    console.warn("[WikiCodex] Failed to parse local store, re-seeding:", err);
  }

  const seed = createInitialSeedState();
  cachedState = seed;
  await saveState(seed);
  return seed;
}

export async function saveState(state: CodexDatabaseState): Promise<void> {
  cachedState = state;

  if (isPostgresConfigured() && (await ensurePostgresTable())) {
    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO codex_state_store (store_key, payload, updated_at)
           VALUES ($1, $2::jsonb, NOW())
           ON CONFLICT (store_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          ["primary", JSON.stringify(state)]
        );
        storageBackend = "postgresql";
        return;
      } catch (err) {
        console.warn("[WikiCodex] PostgreSQL write failed, persisting to local JSON:", err);
      }
    }
  }

  storageBackend = "local-json";
  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  const tmpFile = `${LOCAL_DATA_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), "utf8");
  fs.renameSync(tmpFile, LOCAL_DATA_FILE);
}

export function appendActivity(
  state: CodexDatabaseState,
  workspaceId: string,
  actor: string,
  action: string,
  targetTitle: string,
  targetType: string
) {
  const item: ActivityLogItem = {
    id: generateId("act"),
    workspaceId,
    actor,
    action,
    targetTitle,
    targetType,
    createdAt: new Date().toISOString()
  };
  state.activityLog.unshift(item);
  if (state.activityLog.length > 150) {
    state.activityLog.length = 150;
  }
}

export function projectEntryToCard(
  entry: Entry,
  backlinkCounts: Map<string, number>,
  entryType?: EntryType | null
): EntryCardProjection {
  const supportsPower = entrySupportsPower(entry, entryType);
  return {
    id: entry.id,
    workspaceId: entry.workspaceId,
    entryTypeId: entry.entryTypeId,
    categoryId: entry.categoryId,
    slug: entry.slug,
    title: entry.title,
    subtitle: entry.subtitle,
    summary: entry.summary,
    icon: entry.icon,
    sigil: entry.sigil,
    thumbImage: entry.thumbImage || entry.coverImage,
    status: entry.status,
    visibility: entry.visibility,
    canonStatus: entry.canonStatus,
    aliases: entry.aliases,
    powerLevel: supportsPower ? entry.powerLevel : undefined,
    powerInfinite: supportsPower ? entry.powerInfinite : false,
    powerTierOverride: supportsPower ? entry.powerTierOverride : undefined,
    attributes: supportsPower ? entry.attributes : undefined,
    supportsPower,
    cardStyle: entryType?.cardStyle,
    cardHighlights: extractCardHighlights(entry, entryType),
    extraFieldCount: (entry.extraFields ?? []).filter((f) => f.kind !== "private_note").length,
    variantCount: (entry.variants ?? []).length,
    emblemConfig: entry.emblemConfig,
    economySummary: extractEconomySummary(entry),
    featured: entry.featured,
    spoilerGate: entry.spoilerGate,
    tags: entry.tags,
    updatedAt: entry.updatedAt,
    deletedAt: entry.deletedAt,
    backlinkCount: backlinkCounts.get(entry.id) ?? 0,
    wordCount: countWords(entry.contentMarkdown)
  };
}

export interface EntryQueryParams {
  workspaceId: string;
  role: UserRole;
  query?: string;
  categoryId?: string | null;
  includeDescendants?: boolean;
  entryTypeId?: string | null;
  status?: EntryStatus | "all";
  visibility?: EntryVisibility | "all";
  canonStatus?: string | "all";
  minPower?: number | null;
  maxPower?: number | null;
  tag?: string | null;
  includeDeleted?: boolean;
  sortBy?: "updatedAt" | "title" | "status" | "powerLevel";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function queryEntriesFromState(
  state: CodexDatabaseState,
  params: EntryQueryParams
): PaginatedEntriesResult {
  const limit = Math.max(1, Math.min(params.limit ?? 24, 100));
  const page = Math.max(1, params.page ?? 1);

  const workspaceEntries = state.entries.filter(
    (e) => e.workspaceId === params.workspaceId
  );

  const typeMap = new Map(state.entryTypes.map((t) => [t.id, t]));
  const titleToId = new Map<string, string>();
  for (const e of workspaceEntries) {
    if (!e.deletedAt) {
      titleToId.set(normalizeVietnamese(e.title), e.id);
      titleToId.set(e.slug.toLowerCase(), e.id);
      for (const al of e.aliases ?? []) {
        const normAl = normalizeVietnamese(al);
        if (normAl && !titleToId.has(normAl)) titleToId.set(normAl, e.id);
      }
    }
  }
  const backlinkCounts = new Map<string, number>();
  for (const e of workspaceEntries) {
    if (e.deletedAt || !e.contentMarkdown.includes("[[")) continue;
    const seen = new Set<string>();
    for (const l of extractWikilinks(e.contentMarkdown)) {
      const targetId =
        titleToId.get(normalizeVietnamese(l.targetTitle)) ??
        titleToId.get(l.targetTitle.toLowerCase());
      if (targetId && targetId !== e.id && !seen.has(targetId)) {
        seen.add(targetId);
        backlinkCounts.set(targetId, (backlinkCounts.get(targetId) ?? 0) + 1);
      }
    }
  }

  let allowedCategories: Set<string> | null = null;
  if (params.categoryId) {
    if (params.includeDescendants !== false) {
      const wsCats = state.categories.filter(
        (c) => c.workspaceId === params.workspaceId
      );
      allowedCategories = getDescendantCategoryIds(wsCats, params.categoryId);
    } else {
      allowedCategories = new Set([params.categoryId]);
    }
  }

  const normalizedTag = params.tag ? normalizeVietnamese(params.tag) : "";
  const queryText = params.query?.trim() ?? "";

  const filtered = workspaceEntries.filter((e) => {
    if (params.includeDeleted) {
      if (!e.deletedAt) return false;
    } else {
      if (e.deletedAt) return false;
    }

    if (params.role === "guest") {
      if (e.visibility !== "public" || e.status !== "published" || e.deletedAt) {
        return false;
      }
    }

    if (allowedCategories) {
      if (!e.categoryId || !allowedCategories.has(e.categoryId)) return false;
    }

    if (params.entryTypeId && e.entryTypeId !== params.entryTypeId) return false;
    if (params.status && params.status !== "all" && e.status !== params.status) {
      return false;
    }
    if (
      params.visibility &&
      params.visibility !== "all" &&
      e.visibility !== params.visibility
    ) {
      return false;
    }
    if (
      params.canonStatus &&
      params.canonStatus !== "all" &&
      (e.canonStatus || "canon") !== params.canonStatus
    ) {
      return false;
    }
    if (params.minPower !== undefined && params.minPower !== null) {
      const supportsPwr = entrySupportsPower(e, typeMap.get(e.entryTypeId));
      if (!supportsPwr) return false;
      const effectivePower = e.powerInfinite ? Number.MAX_SAFE_INTEGER : e.powerLevel ?? -Infinity;
      if (effectivePower < params.minPower) return false;
    }
    if (params.maxPower !== undefined && params.maxPower !== null) {
      const supportsPwr = entrySupportsPower(e, typeMap.get(e.entryTypeId));
      if (!supportsPwr) return false;
      const effectivePower = e.powerInfinite ? Number.MAX_SAFE_INTEGER : e.powerLevel ?? Infinity;
      if (effectivePower > params.maxPower) return false;
    }
    if (normalizedTag) {
      const hasTag = e.tags.some((t) => normalizeVietnamese(t) === normalizedTag);
      if (!hasTag) return false;
    }
    if (queryText) {
      // Search across title, subtitle, aliases, summary, tags, customFields, and V5 extraFields (accent-insensitive)
      const extraText = (e.extraFields ?? [])
        .filter((f) => params.role !== "guest" || f.kind !== "private_note")
        .map((f) => `${f.label} ${f.value}`)
        .join(" ");
      const customText = Object.values(e.customFields ?? {})
        .filter((v) => typeof v === "string" || typeof v === "number")
        .join(" ");
      const haystack = `${e.title} ${e.subtitle} ${(e.aliases || []).join(" ")} ${e.summary} ${e.tags.join(" ")} ${extraText} ${customText}`;
      if (!matchesVietnameseQuery(haystack, queryText)) return false;
    }
    return true;
  });

  const dir = params.sortDir === "asc" ? 1 : -1;
  const sortBy = params.sortBy ?? "updatedAt";
  filtered.sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title, "vi") * dir;
    }
    if (sortBy === "status") {
      return a.status.localeCompare(b.status) * dir;
    }
    if (sortBy === "powerLevel") {
      const supA = entrySupportsPower(a, typeMap.get(a.entryTypeId));
      const supB = entrySupportsPower(b, typeMap.get(b.entryTypeId));
      if (supA !== supB) return supA ? -1 : 1;
      const pa = a.powerInfinite ? Number.MAX_SAFE_INTEGER : a.powerLevel ?? -1;
      const pb = b.powerInfinite ? Number.MAX_SAFE_INTEGER : b.powerLevel ?? -1;
      return (pa - pb) * dir;
    }
    return a.updatedAt.localeCompare(b.updatedAt) * dir;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const slice = filtered.slice(start, start + limit);
  const items = slice.map((e) => projectEntryToCard(e, backlinkCounts, typeMap.get(e.entryTypeId)));
  const hasMore = start + slice.length < total;

  return {
    items,
    total,
    page: safePage,
    limit,
    totalPages,
    nextCursor: hasMore && slice.length > 0 ? slice[slice.length - 1].id : null,
    hasMore
  };
}

// ==================== WORKSPACES CRUD ====================

export async function createWorkspace(input: {
  name: string;
  description?: string;
  icon?: string;
  sigil?: string;
  accentColor?: string;
  isPublic?: boolean;
  publicTagline?: string;
}): Promise<Workspace> {
  const state = await loadState();
  const now = new Date().toISOString();
  const baseSlug = slugifyVietnamese(input.name);
  let slug = baseSlug;
  let counter = 2;
  while (state.workspaces.some((w) => w.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const ws: Workspace = {
    id: generateId("ws"),
    slug,
    name: input.name.trim(),
    description: (input.description ?? "").trim(),
    icon: input.icon || "BookOpen",
    sigil: input.sigil || "✦",
    accentColor: input.accentColor || "#D4AF37",
    isPublic: input.isPublic ?? true,
    publicTagline: input.publicTagline || "",
    createdAt: now,
    updatedAt: now
  };
  state.workspaces.push(ws);

  state.entryTypes.push({
    id: generateId("type"),
    workspaceId: ws.id,
    name: "Hồ sơ Tri thức",
    slug: "ho-so-tri-thuc",
    description: "Loại hồ sơ bách khoa mặc định.",
    icon: "ScrollText",
    sigil: "✦",
    color: ws.accentColor,
    enabledTabs: ["overview", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
    fieldSchema: [
      { key: "classification", label: "Phân loại", type: "text", showInInfobox: true },
      { key: "era", label: "Niên đại / Giai đoạn", type: "text", showInInfobox: true },
      { key: "private_note", label: "Ghi chú riêng tư", type: "private_note" }
    ]
  });

  await saveState(state);
  return ws;
}

export async function updateWorkspace(
  id: string,
  patch: Partial<Pick<Workspace, "name" | "description" | "icon" | "sigil" | "accentColor" | "isPublic" | "defaultLanguageId" | "publicTagline" | "publicBannerUrl" | "defaultTheme">>
): Promise<Workspace | null> {
  const state = await loadState();
  const ws = state.workspaces.find((w) => w.id === id);
  if (!ws) return null;
  Object.assign(ws, patch, { updatedAt: new Date().toISOString() });
  await saveState(state);
  return ws;
}

export async function deleteWorkspace(id: string): Promise<boolean> {
  const state = await loadState();
  if (state.workspaces.length <= 1) {
    throw new Error("Không thể xóa không gian cuối cùng trong hệ thống.");
  }
  const idx = state.workspaces.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  state.workspaces.splice(idx, 1);
  state.categories = state.categories.filter((c) => c.workspaceId !== id);
  state.entryTypes = state.entryTypes.filter((t) => t.workspaceId !== id);
  const removedEntryIds = new Set(
    state.entries.filter((e) => e.workspaceId === id).map((e) => e.id)
  );
  state.entries = state.entries.filter((e) => e.workspaceId !== id);
  state.revisions = state.revisions.filter((r) => !removedEntryIds.has(r.entryId));
  state.relations = state.relations.filter((r) => r.workspaceId !== id);
  state.timelineEvents = state.timelineEvents.filter((t) => t.workspaceId !== id);
  state.atlasMaps = state.atlasMaps.filter((m) => m.workspaceId !== id);
  state.atlasPins = state.atlasPins.filter((p) => p.workspaceId !== id);
  state.atlasRoutes = state.atlasRoutes.filter((r) => r.workspaceId !== id);
  state.conlangs = state.conlangs.filter((l) => l.workspaceId !== id);
  state.templates = state.templates.filter((t) => t.workspaceId !== id);
  state.loreboards = state.loreboards.filter((l) => l.workspaceId !== id);
  state.calendars = state.calendars.filter((c) => c.workspaceId !== id);
  state.mediaAssets = state.mediaAssets.filter((m) => m.workspaceId !== id);
  state.glossaryTerms = state.glossaryTerms.filter((g) => g.workspaceId !== id);
  state.collections = state.collections.filter((c) => c.workspaceId !== id);
  state.editorialTasks = state.editorialTasks.filter((t) => t.workspaceId !== id);
  state.activityLog = state.activityLog.filter((a) => a.workspaceId !== id);
  state.worldUnits = state.worldUnits.filter((u) => u.workspaceId !== id);
  state.savedViews = state.savedViews.filter((v) => v.workspaceId !== id);
  state.hierarchyCharts = state.hierarchyCharts.filter((h) => h.workspaceId !== id);
  state.systemRules = state.systemRules.filter((s) => s.workspaceId !== id);
  state.taxonomyNodes = state.taxonomyNodes.filter((t) => t.workspaceId !== id);
  state.tradeCommodities = state.tradeCommodities.filter((c) => c.workspaceId !== id);
  state.chronicleChapters = state.chronicleChapters.filter((c) => c.workspaceId !== id);
  state.propertyBlueprints = (state.propertyBlueprints ?? []).filter((b) => b.workspaceId !== id);
  state.holdings = (state.holdings ?? []).filter((h) => h.workspaceId !== id);
  state.publishSnapshots = state.publishSnapshots.filter((s) => s.workspaceId !== id);
  await saveState(state);
  return true;
}

// ==================== CATEGORIES CRUD ====================

export async function createCategory(input: {
  workspaceId: string;
  parentId?: string | null;
  name: string;
  description?: string;
  icon?: string;
  sigil?: string;
  color?: string;
  sortOrder?: number;
}): Promise<Category> {
  const state = await loadState();
  const now = new Date().toISOString();
  const cat: Category = {
    id: generateId("cat"),
    workspaceId: input.workspaceId,
    parentId: input.parentId || null,
    name: input.name.trim(),
    slug: slugifyVietnamese(input.name),
    description: (input.description ?? "").trim(),
    icon: input.icon || "FolderTree",
    sigil: input.sigil || "❖",
    color: input.color || "#D4AF37",
    sortOrder: input.sortOrder ?? 0,
    deletedAt: null,
    createdAt: now,
    updatedAt: now
  };
  state.categories.push(cat);
  appendActivity(state, input.workspaceId, "Biên tập viên", "Tạo danh mục mới", cat.name, "category");
  await saveState(state);
  return cat;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "parentId" | "name" | "description" | "icon" | "sigil" | "color" | "sortOrder">>
): Promise<Category> {
  const state = await loadState();
  const cat = state.categories.find((c) => c.id === id);
  if (!cat) throw new Error("Không tìm thấy danh mục.");

  if (patch.parentId !== undefined) {
    const wsCats = state.categories.filter((c) => c.workspaceId === cat.workspaceId);
    if (wouldCreateCategoryCycle(wsCats, id, patch.parentId)) {
      throw new Error("Không thể đổi danh mục cha vì sẽ tạo vòng lặp (cha -> con -> cha).");
    }
    cat.parentId = patch.parentId;
  }

  if (patch.name !== undefined) {
    cat.name = patch.name.trim();
    cat.slug = slugifyVietnamese(cat.name);
  }
  if (patch.description !== undefined) cat.description = patch.description.trim();
  if (patch.icon !== undefined) cat.icon = patch.icon;
  if (patch.sigil !== undefined) cat.sigil = patch.sigil;
  if (patch.color !== undefined) cat.color = patch.color;
  if (patch.sortOrder !== undefined) cat.sortOrder = patch.sortOrder;
  cat.updatedAt = new Date().toISOString();

  await saveState(state);
  return cat;
}

export async function safeDeleteCategory(
  id: string,
  options: {
    moveEntriesToCategoryId?: string | null;
    childStrategy?: "reparent_to_parent" | "cascade_soft_delete";
    permanent?: boolean;
  }
): Promise<void> {
  const state = await loadState();
  const cat = state.categories.find((c) => c.id === id);
  if (!cat) return;

  const now = new Date().toISOString();
  const wsCats = state.categories.filter((c) => c.workspaceId === cat.workspaceId);
  const descendants = getDescendantCategoryIds(wsCats, id);

  const targetCategoryId =
    options.moveEntriesToCategoryId !== undefined
      ? options.moveEntriesToCategoryId
      : cat.parentId;

  if (options.childStrategy === "cascade_soft_delete") {
    for (const e of state.entries) {
      if (e.categoryId && descendants.has(e.categoryId)) {
        e.categoryId = targetCategoryId && !descendants.has(targetCategoryId) ? targetCategoryId : null;
      }
    }
    if (options.permanent) {
      state.categories = state.categories.filter((c) => !descendants.has(c.id));
    } else {
      for (const c of state.categories) {
        if (descendants.has(c.id)) c.deletedAt = now;
      }
    }
  } else {
    for (const c of state.categories) {
      if (c.parentId === id) c.parentId = cat.parentId;
    }
    for (const e of state.entries) {
      if (e.categoryId === id) {
        e.categoryId = targetCategoryId !== id ? targetCategoryId : null;
      }
    }
    if (options.permanent) {
      state.categories = state.categories.filter((c) => c.id !== id);
    } else {
      cat.deletedAt = now;
    }
  }

  await saveState(state);
}

export async function restoreCategory(id: string): Promise<Category | null> {
  const state = await loadState();
  const cat = state.categories.find((c) => c.id === id);
  if (!cat) return null;
  cat.deletedAt = null;
  if (cat.parentId) {
    const parent = state.categories.find((c) => c.id === cat.parentId);
    if (!parent || parent.deletedAt) cat.parentId = null;
  }
  cat.updatedAt = new Date().toISOString();
  await saveState(state);
  return cat;
}

// ==================== ENTRY TYPES CRUD ====================

export async function createEntryType(input: Omit<EntryType, "id" | "slug">): Promise<EntryType> {
  const state = await loadState();
  const item: EntryType = {
    ...input,
    id: generateId("type"),
    slug: slugifyVietnamese(input.name)
  };
  state.entryTypes.push(item);
  await saveState(state);
  return item;
}

export async function updateEntryType(
  id: string,
  patch: Partial<Omit<EntryType, "id" | "workspaceId">>
): Promise<EntryType | null> {
  const state = await loadState();
  const item = state.entryTypes.find((t) => t.id === id);
  if (!item) return null;
  Object.assign(item, patch);
  if (patch.name) item.slug = slugifyVietnamese(patch.name);
  await saveState(state);
  return item;
}

export async function deleteEntryType(id: string): Promise<boolean> {
  const state = await loadState();
  const target = state.entryTypes.find((t) => t.id === id);
  if (!target) return false;
  const siblings = state.entryTypes.filter(
    (t) => t.workspaceId === target.workspaceId && t.id !== id
  );
  if (siblings.length === 0) {
    throw new Error("Mỗi không gian phải có ít nhất 1 Loại hồ sơ.");
  }
  const fallbackType = siblings[0];
  for (const e of state.entries) {
    if (e.entryTypeId === id) e.entryTypeId = fallbackType.id;
  }
  state.entryTypes = state.entryTypes.filter((t) => t.id !== id);
  await saveState(state);
  return true;
}

// ==================== ENTRIES CRUD & REVISIONS ====================

export async function getEntryDetail(idOrSlug: string, role: UserRole): Promise<{
  entry: Entry;
  revisions: EntryRevision[];
} | null> {
  const state = await loadState();
  const raw = state.entries.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
  if (!raw) return null;
  const entryType = state.entryTypes.find((t) => t.id === raw.entryTypeId);
  const sanitized = sanitizeEntryForRole(raw, role, entryType);
  if (!sanitized) return null;

  const revisions =
    role === "guest"
      ? []
      : state.revisions
          .filter((r) => r.entryId === raw.id)
          .sort((a, b) => b.versionNumber - a.versionNumber);

  return { entry: sanitized, revisions };
}

function buildRevisionSnapshot(entry: Entry): EntryRevision["snapshot"] {
  return {
    title: entry.title,
    subtitle: entry.subtitle,
    summary: entry.summary,
    categoryId: entry.categoryId,
    status: entry.status,
    visibility: entry.visibility,
    canonStatus: entry.canonStatus,
    aliases: entry.aliases ? [...entry.aliases] : undefined,
    epigraph: entry.epigraph ? { ...entry.epigraph } : undefined,
    customSections: entry.customSections ? entry.customSections.map((s) => ({ ...s })) : undefined,
    eraSnapshots: entry.eraSnapshots ? entry.eraSnapshots.map((e) => ({ ...e })) : undefined,
    breakdownBars: entry.breakdownBars ? entry.breakdownBars.map((b) => ({ ...b })) : undefined,
    powerLevel: entry.powerLevel,
    powerInfinite: entry.powerInfinite,
    powerTierOverride: entry.powerTierOverride,
    powerSourceLabel: entry.powerSourceLabel,
    attributes: entry.attributes ? entry.attributes.map((a) => ({ ...a })) : undefined,
    powerHistory: entry.powerHistory ? entry.powerHistory.map((p) => ({ ...p })) : undefined,
    abilities: entry.abilities ? entry.abilities.map((a) => ({ ...a })) : undefined,
    feats: entry.feats ? entry.feats.map((f) => ({ ...f })) : undefined,
    variants: entry.variants ? entry.variants.map((v) => ({ ...v, attributes: (v.attributes || []).map((a) => ({ ...a })) })) : undefined,
    extraFields: entry.extraFields ? entry.extraFields.map((f) => ({ ...f })) : undefined,
    hiddenSchemaKeys: entry.hiddenSchemaKeys ? [...entry.hiddenSchemaKeys] : undefined,
    tabOverrides: entry.tabOverrides
      ? {
          enabled: entry.tabOverrides.enabled ? [...entry.tabOverrides.enabled] : undefined,
          disabled: entry.tabOverrides.disabled ? [...entry.tabOverrides.disabled] : undefined
        }
      : undefined,
    roster: entry.roster ? entry.roster.map((r) => ({ ...r })) : undefined,
    lawsAndCustoms: entry.lawsAndCustoms ? entry.lawsAndCustoms.map((l) => ({ ...l })) : undefined,
    forceUnits: entry.forceUnits ? entry.forceUnits.map((u) => ({ ...u })) : undefined,
    resourceItems: entry.resourceItems ? entry.resourceItems.map((i) => ({ ...i })) : undefined,
    rumorsAndSecrets: entry.rumorsAndSecrets ? entry.rumorsAndSecrets.map((r) => ({ ...r })) : undefined,
    economyProfile: entry.economyProfile ? structuredClone(entry.economyProfile) : undefined,
    emblemConfig: entry.emblemConfig ? { ...entry.emblemConfig } : undefined,
    tags: [...entry.tags],
    contentMarkdown: entry.contentMarkdown,
    customFields: { ...entry.customFields },
    sourcesMarkdown: entry.sourcesMarkdown,
    privateNotes: entry.privateNotes,
    gallery: entry.gallery.map((g) => ({ ...g }))
  };
}

export async function createEntry(
  input: Partial<Entry> & { workspaceId: string; title: string; entryTypeId: string },
  editorName: string
): Promise<Entry> {
  const state = await loadState();
  const now = new Date().toISOString();
  const baseSlug = slugifyVietnamese(input.title);
  let slug = baseSlug;
  let n = 2;
  while (
    state.entries.some(
      (e) => e.workspaceId === input.workspaceId && e.slug === slug
    )
  ) {
    slug = `${baseSlug}-${n++}`;
  }

  const entry: Entry = {
    id: generateId("ent"),
    workspaceId: input.workspaceId,
    entryTypeId: input.entryTypeId,
    categoryId: input.categoryId ?? null,
    slug,
    title: input.title.trim(),
    subtitle: (input.subtitle ?? "").trim(),
    summary: (input.summary ?? "").trim(),
    icon: input.icon || "ScrollText",
    sigil: input.sigil || "✦",
    coverImage: input.coverImage || "",
    thumbImage: input.thumbImage || input.coverImage || "",
    status: input.status || "published",
    visibility: input.visibility || "public",
    canonStatus: input.canonStatus || "canon",
    aliases: Array.isArray(input.aliases) ? input.aliases.filter(Boolean) : [],
    epigraph: input.epigraph,
    customSections: input.customSections || [],
    eraSnapshots: input.eraSnapshots || [],
    breakdownBars: input.breakdownBars || [],
    powerLevel: input.powerLevel,
    powerInfinite: input.powerInfinite,
    powerTierOverride: input.powerTierOverride,
    powerSourceLabel: input.powerSourceLabel,
    attributes: input.attributes,
    powerHistory: input.powerHistory,
    abilities: input.abilities,
    feats: input.feats,
    variants: input.variants,
    extraFields: Array.isArray(input.extraFields) ? input.extraFields : [],
    hiddenSchemaKeys: Array.isArray(input.hiddenSchemaKeys) ? input.hiddenSchemaKeys : [],
    tabOverrides: input.tabOverrides,
    roster: Array.isArray(input.roster) ? input.roster : [],
    lawsAndCustoms: Array.isArray(input.lawsAndCustoms) ? input.lawsAndCustoms : [],
    forceUnits: Array.isArray(input.forceUnits) ? input.forceUnits : [],
    resourceItems: Array.isArray(input.resourceItems) ? input.resourceItems : [],
    rumorsAndSecrets: Array.isArray(input.rumorsAndSecrets) ? input.rumorsAndSecrets : [],
    economyProfile: input.economyProfile,
    emblemConfig: input.emblemConfig,
    featured: Boolean(input.featured),
    spoilerGate: Boolean(input.spoilerGate),
    spoilerLabel: input.spoilerLabel || "",
    tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : [],
    contentMarkdown: input.contentMarkdown || "",
    customFields: input.customFields || {},
    sourcesMarkdown: input.sourcesMarkdown || "",
    privateNotes: input.privateNotes || "",
    gallery: input.gallery || [],
    editorialNotes: [],
    createdBy: editorName,
    updatedBy: editorName,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };

  state.entries.unshift(entry);
  state.revisions.push({
    id: generateId("rev"),
    entryId: entry.id,
    versionNumber: 1,
    changeSummary: "Khởi tạo hồ sơ",
    editorName,
    createdAt: now,
    snapshot: buildRevisionSnapshot(entry)
  });

  appendActivity(state, entry.workspaceId, editorName, "Tạo hồ sơ mới", entry.title, "entry");
  await saveState(state);
  return entry;
}

export async function updateEntry(
  id: string,
  patch: Partial<Entry> & { changeSummary?: string },
  editorName: string
): Promise<Entry | null> {
  const state = await loadState();
  const entry = state.entries.find((e) => e.id === id);
  if (!entry) return null;

  const now = new Date().toISOString();
  const { changeSummary, ...fields } = patch;
  const prevTitle = entry.title;

  // #18 Canon Lock protection: block content edits when locked unless explicitly unlocking
  if (entry.locked && fields.locked !== false) {
    return entry;
  }

  Object.assign(entry, fields, {
    updatedBy: editorName,
    updatedAt: now
  });

  // #19 Global Safe Rename: automatically update [[OldTitle]] across workspace when title changes
  if (fields.title && fields.title.trim() && fields.title !== prevTitle) {
    for (const other of state.entries) {
      if (other.workspaceId === entry.workspaceId && other.id !== entry.id && !other.deletedAt) {
        other.contentMarkdown = renameWikilinkAcrossMarkdown(
          other.contentMarkdown,
          prevTitle,
          fields.title
        );
      }
    }
  }

  if (fields.coverImage !== undefined && fields.thumbImage === undefined) {
    entry.thumbImage = fields.coverImage;
  }

  const existingRevs = state.revisions.filter((r) => r.entryId === entry.id);
  const nextVer =
    existingRevs.reduce((max, r) => Math.max(max, r.versionNumber), 0) + 1;

  state.revisions.push({
    id: generateId("rev"),
    entryId: entry.id,
    versionNumber: nextVer,
    changeSummary: changeSummary || `Cập nhật phiên bản #${nextVer}`,
    editorName,
    createdAt: now,
    snapshot: buildRevisionSnapshot(entry)
  });

  appendActivity(state, entry.workspaceId, editorName, "Cập nhật hồ sơ", entry.title, "entry");
  await saveState(state);
  return entry;
}

export async function restoreEntryRevision(
  entryId: string,
  revisionId: string,
  editorName: string
): Promise<Entry | null> {
  const state = await loadState();
  const rev = state.revisions.find(
    (r) => r.id === revisionId && r.entryId === entryId
  );
  if (!rev) return null;

  return updateEntry(
    entryId,
    {
      ...rev.snapshot,
      changeSummary: `Khôi phục về phiên bản #${rev.versionNumber}`
    },
    editorName
  );
}

export async function duplicateEntry(
  id: string,
  editorName: string
): Promise<Entry | null> {
  const state = await loadState();
  const src = state.entries.find((e) => e.id === id);
  if (!src) return null;

  return createEntry(
    {
      ...src,
      title: `${src.title} (Bản sao)`,
      status: "draft"
    },
    editorName
  );
}

export async function addEditorialNote(
  entryId: string,
  note: Omit<EditorialNote, "id" | "createdAt">
): Promise<EditorialNote | null> {
  const state = await loadState();
  const entry = state.entries.find((e) => e.id === entryId);
  if (!entry) return null;
  const created: EditorialNote = {
    ...note,
    id: generateId("edn"),
    createdAt: new Date().toISOString()
  };
  entry.editorialNotes.unshift(created);
  await saveState(state);
  return created;
}

export async function softDeleteEntry(id: string): Promise<boolean> {
  const state = await loadState();
  const entry = state.entries.find((e) => e.id === id);
  if (!entry) return false;
  entry.deletedAt = new Date().toISOString();
  await saveState(state);
  return true;
}

export async function restoreEntry(id: string): Promise<boolean> {
  const state = await loadState();
  const entry = state.entries.find((e) => e.id === id);
  if (!entry) return false;
  entry.deletedAt = null;
  await saveState(state);
  return true;
}

export async function permanentDeleteEntry(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.entries.length;
  state.entries = state.entries.filter((e) => e.id !== id);
  state.revisions = state.revisions.filter((r) => r.entryId !== id);
  state.relations = state.relations.filter(
    (r) => r.sourceEntryId !== id && r.targetEntryId !== id
  );
  state.holdings = (state.holdings ?? []).filter(
    (h) => h.ownerEntryId !== id && h.targetEntryId !== id
  );
  for (const pin of state.atlasPins) {
    if (pin.entryId === id) pin.entryId = null;
  }
  for (const ev of state.timelineEvents) {
    ev.entryIds = ev.entryIds.filter((eid) => eid !== id);
  }
  for (const col of state.collections) {
    col.entryIds = col.entryIds.filter((eid) => eid !== id);
  }
  for (const lb of state.loreboards) {
    const removedNodeIds = new Set(
      lb.nodes.filter((n) => n.entryId === id).map((n) => n.id)
    );
    if (removedNodeIds.size > 0) {
      lb.nodes = lb.nodes.filter((n) => !removedNodeIds.has(n.id));
      lb.edges = lb.edges.filter(
        (e) => !removedNodeIds.has(e.fromNodeId) && !removedNodeIds.has(e.toNodeId)
      );
    }
  }
  for (const chart of state.hierarchyCharts ?? []) {
    for (const n of chart.nodes) {
      if (n.entryId === id) n.entryId = null;
    }
  }
  for (const tax of state.taxonomyNodes ?? []) {
    if (tax.linkedEntryId === id) tax.linkedEntryId = null;
  }
  for (const com of state.tradeCommodities ?? []) {
    if (com.originEntryId === id) com.originEntryId = null;
  }
  for (const gl of state.glossaryTerms ?? []) {
    if (gl.linkedEntryId === id) gl.linkedEntryId = null;
  }
  for (const tsk of state.editorialTasks ?? []) {
    if (tsk.linkedEntryId === id) tsk.linkedEntryId = null;
  }
  for (const ent of state.entries) {
    if (ent.roster) {
      for (const member of ent.roster) {
        if (member.entryId === id) member.entryId = null;
      }
    }
  }
  await saveState(state);
  return state.entries.length < before;
}

export async function bulkUpdateEntries(
  entryIds: string[],
  action:
    | { type: "set_category"; categoryId: string | null }
    | { type: "set_status"; status: EntryStatus }
    | { type: "set_visibility"; visibility: EntryVisibility }
    | { type: "add_tag"; tag: string }
    | { type: "remove_tag"; tag: string }
    | { type: "soft_delete" }
    | { type: "restore" },
  editorName: string
): Promise<number> {
  const state = await loadState();
  const idSet = new Set(entryIds);
  const now = new Date().toISOString();
  let count = 0;

  for (const e of state.entries) {
    if (!idSet.has(e.id)) continue;
    count++;
    e.updatedAt = now;
    e.updatedBy = editorName;

    switch (action.type) {
      case "set_category":
        e.categoryId = action.categoryId;
        break;
      case "set_status":
        e.status = action.status;
        break;
      case "set_visibility":
        e.visibility = action.visibility;
        break;
      case "add_tag": {
        const t = action.tag.trim();
        if (t && !e.tags.some((x) => normalizeVietnamese(x) === normalizeVietnamese(t))) {
          e.tags.push(t);
        }
        break;
      }
      case "remove_tag": {
        const norm = normalizeVietnamese(action.tag);
        e.tags = e.tags.filter((x) => normalizeVietnamese(x) !== norm);
        break;
      }
      case "soft_delete":
        e.deletedAt = now;
        break;
      case "restore":
        e.deletedAt = null;
        break;
    }
  }

  await saveState(state);
  return count;
}

// ==================== RELATIONS, TIMELINE, ATLAS, CONLANG ====================

export async function createRelation(
  input: Omit<EntryRelation, "id" | "createdAt">
): Promise<EntryRelation> {
  const state = await loadState();
  const rel: EntryRelation = { ...input, id: generateId("rel"), createdAt: new Date().toISOString() };
  state.relations.push(rel);
  await saveState(state);
  return rel;
}

export async function deleteRelation(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.relations.length;
  state.relations = state.relations.filter((r) => r.id !== id);
  await saveState(state);
  return state.relations.length < before;
}

export async function createTimelineEvent(
  input: Omit<TimelineEvent, "id" | "createdAt">
): Promise<TimelineEvent> {
  const state = await loadState();
  const ev: TimelineEvent = { ...input, id: generateId("tl"), createdAt: new Date().toISOString() };
  state.timelineEvents.push(ev);
  await saveState(state);
  return ev;
}

export async function updateTimelineEvent(
  id: string,
  patch: Partial<Omit<TimelineEvent, "id" | "workspaceId">>
): Promise<TimelineEvent | null> {
  const state = await loadState();
  const ev = state.timelineEvents.find((t) => t.id === id);
  if (!ev) return null;
  Object.assign(ev, patch);
  await saveState(state);
  return ev;
}

export async function deleteTimelineEvent(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.timelineEvents.length;
  state.timelineEvents = state.timelineEvents.filter((t) => t.id !== id);
  await saveState(state);
  return state.timelineEvents.length < before;
}

export async function createAtlasMap(input: Omit<AtlasMap, "id" | "createdAt">): Promise<AtlasMap> {
  const state = await loadState();
  const m: AtlasMap = { ...input, id: generateId("map"), createdAt: new Date().toISOString() };
  state.atlasMaps.push(m);
  await saveState(state);
  return m;
}

export async function updateAtlasMap(id: string, patch: Partial<Omit<AtlasMap, "id" | "workspaceId">>): Promise<AtlasMap | null> {
  const state = await loadState();
  const m = state.atlasMaps.find((x) => x.id === id);
  if (!m) return null;
  Object.assign(m, patch);
  await saveState(state);
  return m;
}

export async function deleteAtlasMap(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.atlasMaps.length;
  state.atlasMaps = state.atlasMaps.filter((m) => m.id !== id);
  state.atlasPins = state.atlasPins.filter((p) => p.mapId !== id);
  state.atlasRoutes = state.atlasRoutes.filter((r) => r.mapId !== id);
  await saveState(state);
  return state.atlasMaps.length < before;
}

export async function createAtlasPin(input: Omit<AtlasPin, "id">): Promise<AtlasPin> {
  const state = await loadState();
  const pin: AtlasPin = { ...input, id: generateId("pin") };
  state.atlasPins.push(pin);
  await saveState(state);
  return pin;
}

export async function updateAtlasPin(id: string, patch: Partial<Omit<AtlasPin, "id" | "workspaceId">>): Promise<AtlasPin | null> {
  const state = await loadState();
  const pin = state.atlasPins.find((p) => p.id === id);
  if (!pin) return null;
  Object.assign(pin, patch);
  await saveState(state);
  return pin;
}

export async function deleteAtlasPin(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.atlasPins.length;
  state.atlasPins = state.atlasPins.filter((p) => p.id !== id);
  await saveState(state);
  return state.atlasPins.length < before;
}

export async function createAtlasRoute(input: Omit<AtlasRoute, "id">): Promise<AtlasRoute> {
  const state = await loadState();
  const route: AtlasRoute = { ...input, id: generateId("route") };
  state.atlasRoutes.push(route);
  await saveState(state);
  return route;
}

export async function deleteAtlasRoute(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.atlasRoutes.length;
  state.atlasRoutes = state.atlasRoutes.filter((r) => r.id !== id);
  await saveState(state);
  return state.atlasRoutes.length < before;
}

export async function createConlang(input: Omit<ConlangLanguage, "id" | "createdAt">): Promise<ConlangLanguage> {
  const state = await loadState();
  const lang: ConlangLanguage = { ...input, id: generateId("lang"), createdAt: new Date().toISOString() };
  state.conlangs.push(lang);
  await saveState(state);
  return lang;
}

export async function updateConlang(id: string, patch: Partial<Omit<ConlangLanguage, "id" | "workspaceId">>): Promise<ConlangLanguage | null> {
  const state = await loadState();
  const lang = state.conlangs.find((l) => l.id === id);
  if (!lang) return null;
  Object.assign(lang, patch);
  await saveState(state);
  return lang;
}

export async function deleteConlang(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.conlangs.length;
  state.conlangs = state.conlangs.filter((l) => l.id !== id);
  await saveState(state);
  return state.conlangs.length < before;
}

export async function upsertConlangWord(
  languageId: string,
  word: Omit<ConlangWord, "id" | "runic"> & { id?: string; runic?: string }
): Promise<ConlangWord | null> {
  const state = await loadState();
  const lang = state.conlangs.find((l) => l.id === languageId);
  if (!lang) return null;
  const computedRunic = word.runic?.trim() || toAncientScript(word.romanized, lang.scriptStyle);

  if (word.id) {
    const existing = lang.lexicon.find((w) => w.id === word.id);
    if (existing) {
      existing.vietnamese = word.vietnamese.trim();
      existing.romanized = word.romanized.trim();
      existing.runic = computedRunic;
      existing.partOfSpeech = word.partOfSpeech || "Danh từ";
      existing.pronunciation = word.pronunciation || "";
      existing.note = word.note || "";
      await saveState(state);
      return existing;
    }
  }

  const created: ConlangWord = {
    id: generateId("w"),
    vietnamese: word.vietnamese.trim(),
    romanized: word.romanized.trim(),
    runic: computedRunic,
    partOfSpeech: word.partOfSpeech || "Danh từ",
    pronunciation: word.pronunciation || "",
    note: word.note || ""
  };
  lang.lexicon.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteConlangWord(languageId: string, wordId: string): Promise<boolean> {
  const state = await loadState();
  const lang = state.conlangs.find((l) => l.id === languageId);
  if (!lang) return false;
  const before = lang.lexicon.length;
  lang.lexicon = lang.lexicon.filter((w) => w.id !== wordId);
  await saveState(state);
  return lang.lexicon.length < before;
}

// ==================== V2.0 COLLECTIONS CRUD ====================

export async function upsertTemplate(input: Omit<CodexTemplate, "id" | "createdAt"> & { id?: string }): Promise<CodexTemplate> {
  const state = await loadState();
  if (input.id) {
    const found = state.templates.find((t) => t.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: CodexTemplate = { ...input, id: generateId("tpl"), createdAt: new Date().toISOString() };
  state.templates.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteTemplate(id: string): Promise<void> {
  const state = await loadState();
  state.templates = state.templates.filter((t) => t.id !== id);
  await saveState(state);
}

export async function upsertLoreboard(input: Omit<Loreboard, "id" | "updatedAt"> & { id?: string }): Promise<Loreboard> {
  const state = await loadState();
  const now = new Date().toISOString();
  if (input.id) {
    const found = state.loreboards.find((l) => l.id === input.id);
    if (found) {
      Object.assign(found, input, { updatedAt: now });
      await saveState(state);
      return found;
    }
  }
  const created: Loreboard = { ...input, id: generateId("lb"), updatedAt: now };
  state.loreboards.push(created);
  await saveState(state);
  return created;
}

export async function deleteLoreboard(id: string): Promise<void> {
  const state = await loadState();
  state.loreboards = state.loreboards.filter((l) => l.id !== id);
  await saveState(state);
}

export async function upsertCalendar(input: Omit<WorldCalendar, "id"> & { id?: string }): Promise<WorldCalendar> {
  const state = await loadState();
  if (input.id) {
    const found = state.calendars.find((c) => c.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: WorldCalendar = { ...input, id: generateId("cal") };
  state.calendars.push(created);
  await saveState(state);
  return created;
}

export async function upsertMediaAsset(input: Omit<MediaAsset, "id" | "createdAt"> & { id?: string }): Promise<MediaAsset> {
  const state = await loadState();
  if (input.id) {
    const found = state.mediaAssets.find((m) => m.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: MediaAsset = { ...input, id: generateId("med"), createdAt: new Date().toISOString() };
  state.mediaAssets.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteMediaAsset(id: string): Promise<void> {
  const state = await loadState();
  state.mediaAssets = state.mediaAssets.filter((m) => m.id !== id);
  await saveState(state);
}

export async function upsertGlossaryTerm(input: Omit<GlossaryTerm, "id"> & { id?: string }): Promise<GlossaryTerm> {
  const state = await loadState();
  if (input.id) {
    const found = state.glossaryTerms.find((g) => g.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: GlossaryTerm = { ...input, id: generateId("gl") };
  state.glossaryTerms.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteGlossaryTerm(id: string): Promise<void> {
  const state = await loadState();
  state.glossaryTerms = state.glossaryTerms.filter((g) => g.id !== id);
  await saveState(state);
}

export async function upsertCollection(input: Omit<CuratedCollection, "id" | "createdAt"> & { id?: string }): Promise<CuratedCollection> {
  const state = await loadState();
  if (input.id) {
    const found = state.collections.find((c) => c.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: CuratedCollection = { ...input, id: generateId("col"), createdAt: new Date().toISOString() };
  state.collections.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteCollection(id: string): Promise<void> {
  const state = await loadState();
  state.collections = state.collections.filter((c) => c.id !== id);
  await saveState(state);
}

export async function upsertEditorialTask(input: Omit<EditorialTask, "id" | "createdAt"> & { id?: string }): Promise<EditorialTask> {
  const state = await loadState();
  if (input.id) {
    const found = state.editorialTasks.find((t) => t.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: EditorialTask = { ...input, id: generateId("tsk"), createdAt: new Date().toISOString() };
  state.editorialTasks.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteEditorialTask(id: string): Promise<void> {
  const state = await loadState();
  state.editorialTasks = state.editorialTasks.filter((t) => t.id !== id);
  await saveState(state);
}

// ==================== SCALE STRESS SIMULATOR (ADMIN ONLY) ====================

export async function seedStressEntries(
  workspaceId: string,
  count: number,
  actor: string
): Promise<number> {
  const state = await loadState();
  const safeCount = Math.max(10, Math.min(count, 5000));
  const wsTypes = state.entryTypes.filter((t) => t.workspaceId === workspaceId);
  const wsCats = state.categories.filter((c) => c.workspaceId === workspaceId && !c.deletedAt);
  const now = new Date().toISOString();

  const prefixes = ["Vương quốc", "Học giả", "Thành cổ", "Dòng tộc", "Biên niên", "Thư viện"];
  const sigils = ["✦", "⚜", "⚝", "◈", "❖", "ᛟ", "ᚨ"];

  for (let i = 1; i <= safeCount; i++) {
    const t = wsTypes[i % wsTypes.length];
    const c = wsCats[i % wsCats.length];
    const title = `${prefixes[i % prefixes.length]} Kiểm Thử Quy Mô #${i}`;
    state.entries.push({
      id: `ent-stress-${workspaceId}-${Date.now()}-${i}`,
      workspaceId,
      entryTypeId: t?.id || "type-kingdom",
      categoryId: c?.id || null,
      slug: `stress-card-${Date.now()}-${i}`,
      title,
      subtitle: `Hồ sơ kiểm thử hiệu năng tải quy mô lớn (${i}/${safeCount})`,
      summary: "Dữ liệu giả lập tự động giúp kiểm chứng tốc độ phân trang, tìm kiếm không dấu và đếm cây danh mục.",
      icon: t?.icon || "ScrollText",
      sigil: sigils[i % sigils.length],
      coverImage: "",
      thumbImage: "",
      status: "published",
      visibility: "public",
      canonStatus: "canon",
      spoilerGate: false,
      spoilerLabel: "",
      tags: ["stress-test", "quy-mo-lon"],
      contentMarkdown: `## Hồ sơ Kiểm thử #${i}\n\nDữ liệu sinh tự động để kiểm chứng hiệu năng tải mượt mà trên hàng nghìn thẻ.`,
      customFields: {},
      sourcesMarkdown: "",
      privateNotes: "",
      gallery: [],
      editorialNotes: [],
      createdBy: actor,
      updatedBy: actor,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
  }

  appendActivity(state, workspaceId, actor, `Sinh ${safeCount} thẻ kiểm thử tải`, "Scale Stress Simulator", "system");
  await saveState(state);
  return safeCount;
}

export async function clearStressEntries(workspaceId: string, actor: string): Promise<number> {
  const state = await loadState();
  const before = state.entries.length;
  state.entries = state.entries.filter(
    (e) => !(e.workspaceId === workspaceId && e.id.startsWith("ent-stress-"))
  );
  const removed = before - state.entries.length;
  if (removed > 0) {
    appendActivity(state, workspaceId, actor, `Dọn sạch ${removed} thẻ kiểm thử tải`, "Scale Stress Simulator", "system");
    await saveState(state);
  }
  return removed;
}

// ==================== 1-CLICK PUBLISH TO PUBLIC WEB ====================

export async function upsertPublishTarget(
  input: Omit<PublishTarget, "id" | "createdAt"> & { id?: string }
): Promise<PublishTarget> {
  const state = await loadState();
  if (input.id) {
    const existing = state.publishTargets.find((t) => t.id === input.id);
    if (existing) {
      Object.assign(existing, input);
      await saveState(state);
      return existing;
    }
  }
  const created: PublishTarget = { ...input, id: generateId("pub"), createdAt: new Date().toISOString() };
  state.publishTargets.push(created);
  await saveState(state);
  return created;
}

export async function deletePublishTarget(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.publishTargets.length;
  state.publishTargets = state.publishTargets.filter((t) => t.id !== id);
  await saveState(state);
  return state.publishTargets.length < before;
}

export async function getPublishPreviewStats(workspaceId: string) {
  const state = await loadState();
  const activeEntries = state.entries.filter((e) => e.workspaceId === workspaceId && !e.deletedAt);
  const lastSnap = state.publishSnapshots.find((s) => s.workspaceId === workspaceId);
  const lastPushMs = lastSnap ? new Date(lastSnap.createdAt).getTime() : 0;

  const publishedPublicCount = activeEntries.filter(
    (e) => e.visibility === "public" && e.status === "published"
  ).length;
  const draftOrReviewPublicCount = activeEntries.filter(
    (e) => e.visibility === "public" && (e.status === "draft" || e.status === "review")
  ).length;
  const privateCount = activeEntries.filter((e) => e.visibility === "private").length;
  const changedSinceLastPush = lastPushMs
    ? activeEntries.filter((e) => new Date(e.updatedAt).getTime() > lastPushMs).length
    : activeEntries.length;
  const economyCount = activeEntries.filter((e) => Boolean(e.economyProfile)).length;
  const categoriesCount = state.categories.filter((c) => c.workspaceId === workspaceId && !c.deletedAt).length;
  const collectionsCount = state.collections.filter((c) => c.workspaceId === workspaceId).length;
  const timelineCount = state.timelineEvents.filter((t) => t.workspaceId === workspaceId).length;

  return {
    totalActiveEntries: activeEntries.length,
    publishedPublicCount,
    draftOrReviewPublicCount,
    privateCount,
    changedSinceLastPush,
    economyCount,
    categoriesCount,
    collectionsCount,
    timelineCount,
    lastVersion: lastSnap?.version ?? 0,
    lastPublishedAt: lastSnap?.createdAt ?? null
  };
}

export async function executeOneClickPublish(input: {
  workspaceId: string;
  publishedBy: string;
  note?: string;
  targetId?: string;
  autoPromoteDrafts?: boolean;
  includePrivate?: boolean;
  publishAllCollections?: boolean;
}): Promise<PublishSnapshot> {
  const state = await loadState();
  const ws = state.workspaces.find((w) => w.id === input.workspaceId);
  if (!ws) throw new Error("Không tìm thấy không gian cần xuất bản.");

  const now = new Date().toISOString();
  ws.isPublic = true;
  ws.updatedAt = now;

  // Auto-sync everything currently on the web workspace to public web
  const autoPromoteDrafts = input.autoPromoteDrafts !== false;
  const includePrivate = Boolean(input.includePrivate);
  const publishAllCollections = input.publishAllCollections !== false;

  let promotedCount = 0;
  for (const e of state.entries) {
    if (e.workspaceId !== ws.id || e.deletedAt) continue;
    let changed = false;
    if (includePrivate && e.visibility === "private") {
      e.visibility = "public";
      changed = true;
    }
    if (autoPromoteDrafts && e.visibility === "public" && (e.status === "draft" || e.status === "review")) {
      e.status = "published";
      changed = true;
    }
    if (changed) {
      e.updatedAt = now;
      e.updatedBy = input.publishedBy;
      promotedCount++;
    }
  }

  let syncedCollectionsCount = 0;
  if (publishAllCollections) {
    for (const col of state.collections) {
      if (col.workspaceId === ws.id && !col.isPublic) {
        col.isPublic = true;
        syncedCollectionsCount++;
      }
    }
  }

  const publicEntryCount = state.entries.filter(
    (e) =>
      e.workspaceId === ws.id &&
      !e.deletedAt &&
      e.visibility === "public" &&
      e.status === "published"
  ).length;

  const existingVersions = state.publishSnapshots.filter((s) => s.workspaceId === ws.id);
  const nextVersion = existingVersions.reduce((m, s) => Math.max(m, s.version), 0) + 1;

  const target =
    (input.targetId
      ? state.publishTargets.find((t) => t.id === input.targetId)
      : state.publishTargets.find((t) => t.enabled && t.webhookUrl)) ??
    state.publishTargets[0];

  const baseUrl = (target?.publicBaseUrl || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const publicUrl = baseUrl ? `${baseUrl}/public/${ws.slug}` : `/public/${ws.slug}`;

  let webhookTriggered = false;
  let webhookStatus =
    promotedCount > 0
      ? `Đã tự động đồng bộ ${promotedCount} hồ sơ mới/nháp và đẩy toàn bộ ${publicEntryCount} hồ sơ lên Web Công khai (/public/${ws.slug})`
      : `Đã đồng bộ tức thì toàn bộ ${publicEntryCount} hồ sơ hiện tại lên Web Công khai (/public/${ws.slug})`;

  const hookUrl =
    target?.webhookUrl ||
    process.env.DEPLOY_WEBHOOK_URL ||
    process.env.RENDER_DEPLOY_HOOK_URL ||
    "";
  if (hookUrl && /^https?:\/\//i.test(hookUrl)) {
    webhookTriggered = true;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(hookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.DEPLOY_WEBHOOK_SECRET
            ? { "X-Codex-Deploy-Secret": process.env.DEPLOY_WEBHOOK_SECRET }
            : {})
        },
        body: JSON.stringify({
          event: "wiki_codex_publish",
          workspaceSlug: ws.slug,
          version: nextVersion,
          publicEntryCount,
          publishedBy: input.publishedBy
        }),
        signal: controller.signal
      });
      clearTimeout(timer);
      webhookStatus = res.ok
        ? `Đã kích hoạt Deploy Webhook thành công (HTTP ${res.status})`
        : `Webhook phản hồi HTTP ${res.status} (Cổng /public vẫn đã cập nhật)`;
    } catch {
      webhookStatus = "Cổng /public đã cập nhật tức thì (Webhook ngoại tuyến hoặc quá thời gian chờ)";
    }
  }

  const snapshot: PublishSnapshot = {
    id: generateId("snap"),
    workspaceId: ws.id,
    workspaceSlug: ws.slug,
    version: nextVersion,
    publishedBy: input.publishedBy,
    publicEntryCount,
    promotedCount,
    syncedCollectionsCount,
    webhookTriggered,
    webhookStatus,
    publicUrl,
    note: input.note?.trim() || `Xuất bản tự động v${nextVersion} (${publicEntryCount} hồ sơ công khai${promotedCount > 0 ? `, +${promotedCount} mới đẩy` : ""})`,
    createdAt: new Date().toISOString()
  };

  state.publishSnapshots.unshift(snapshot);
  appendActivity(state, ws.id, input.publishedBy, `Xuất bản 1-Click v${nextVersion}`, ws.name, "publish");
  await saveState(state);
  return snapshot;
}

// ==================== V3.0 WORLD UNITS, SAVED VIEWS & BATCH CREATOR ====================

export async function upsertWorldUnit(
  input: Omit<WorldUnit, "id"> & { id?: string }
): Promise<WorldUnit> {
  const state = await loadState();
  if (input.id) {
    const found = state.worldUnits.find((u) => u.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: WorldUnit = { ...input, id: generateId("unit") };
  state.worldUnits.push(created);
  await saveState(state);
  return created;
}

export async function deleteWorldUnit(id: string): Promise<void> {
  const state = await loadState();
  state.worldUnits = state.worldUnits.filter((u) => u.id !== id);
  await saveState(state);
}

export async function upsertSavedView(
  input: Omit<SavedView, "id"> & { id?: string }
): Promise<SavedView> {
  const state = await loadState();
  if (input.id) {
    const found = state.savedViews.find((v) => v.id === input.id);
    if (found) {
      Object.assign(found, input);
      await saveState(state);
      return found;
    }
  }
  const created: SavedView = { ...input, id: generateId("sv") };
  state.savedViews.unshift(created);
  await saveState(state);
  return created;
}

export async function deleteSavedView(id: string): Promise<void> {
  const state = await loadState();
  state.savedViews = state.savedViews.filter((v) => v.id !== id);
  await saveState(state);
}

export async function batchCreateEntries(
  workspaceId: string,
  rows: Array<{
    title: string;
    entryTypeId: string;
    categoryId?: string | null;
    powerLevel?: number;
    summary?: string;
    tags?: string[];
  }>,
  editorName: string
): Promise<Entry[]> {
  const state = await loadState();
  const now = new Date().toISOString();
  const created: Entry[] = [];

  for (const row of rows) {
    if (!row.title?.trim()) continue;
    const baseSlug = slugifyVietnamese(row.title);
    let slug = baseSlug;
    let n = 2;
    while (state.entries.some((e) => e.workspaceId === workspaceId && e.slug === slug)) {
      slug = `${baseSlug}-${n++}`;
    }
    const entry: Entry = {
      id: generateId("ent"),
      workspaceId,
      entryTypeId: row.entryTypeId || state.entryTypes[0]?.id || "type-kingdom",
      categoryId: row.categoryId || null,
      slug,
      title: row.title.trim(),
      subtitle: "",
      summary: (row.summary || "").trim(),
      icon: "ScrollText",
      sigil: "✦",
      coverImage: "",
      thumbImage: "",
      status: "published",
      visibility: "public",
      canonStatus: "canon",
      powerLevel: row.powerLevel,
      spoilerGate: false,
      spoilerLabel: "",
      tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
      contentMarkdown: `## Tổng quan\n\n${row.summary || row.title}`,
      customFields: {},
      sourcesMarkdown: "",
      privateNotes: "",
      gallery: [],
      editorialNotes: [],
      createdBy: editorName,
      updatedBy: editorName,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    state.entries.unshift(entry);
    created.push(entry);
  }

  if (created.length > 0) {
    appendActivity(state, workspaceId, editorName, `Tạo hàng loạt ${created.length} hồ sơ`, "Batch Creator", "entry");
    await saveState(state);
  }
  return created;
}

/* ==================== V4.0 DEEP WORLDBUILDING REPOSITORY ==================== */

export async function getV4Bundle(workspaceId: string) {
  const state = await loadState();
  return {
    calendars: state.calendars.filter((c) => c.workspaceId === workspaceId),
    hierarchyCharts: state.hierarchyCharts.filter((h) => h.workspaceId === workspaceId),
    systemRules: state.systemRules.filter((s) => s.workspaceId === workspaceId),
    taxonomyNodes: state.taxonomyNodes.filter((t) => t.workspaceId === workspaceId),
    tradeCommodities: state.tradeCommodities.filter((c) => c.workspaceId === workspaceId),
    chronicleChapters: state.chronicleChapters
      .filter((ch) => ch.workspaceId === workspaceId)
      .sort((a, b) => a.bookTitle.localeCompare(b.bookTitle) || a.chapterNumber - b.chapterNumber),
    propertyBlueprints: (state.propertyBlueprints ?? []).filter((b) => b.workspaceId === workspaceId)
  };
}

export async function upsertPropertyBlueprint(
  bp: Omit<PropertyBlueprint, "id" | "createdAt"> & { id?: string },
  actor = "Admin"
): Promise<PropertyBlueprint> {
  const state = await loadState();
  const now = new Date().toISOString();
  if (!state.propertyBlueprints) state.propertyBlueprints = [];
  const idx = bp.id ? state.propertyBlueprints.findIndex((b) => b.id === bp.id) : -1;
  const saved: PropertyBlueprint = {
    ...bp,
    id: bp.id && idx >= 0 ? bp.id : generateId("bp"),
    createdAt: idx >= 0 ? state.propertyBlueprints[idx].createdAt : now
  };
  if (idx >= 0) state.propertyBlueprints[idx] = saved;
  else state.propertyBlueprints.push(saved);
  appendActivity(state, saved.workspaceId, actor, "Lưu bản mẫu thuộc tính", saved.name, "blueprint");
  await saveState(state);
  return saved;
}

export async function deletePropertyBlueprint(id: string): Promise<boolean> {
  const state = await loadState();
  const before = (state.propertyBlueprints ?? []).length;
  state.propertyBlueprints = (state.propertyBlueprints ?? []).filter((b) => b.id !== id);
  if (state.propertyBlueprints.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}

/* ==================== V6.0 BIDIRECTIONAL OWNERSHIP & HOLDINGS ENGINE ==================== */

export function getEntryHoldingsContext(
  state: CodexDatabaseState,
  entryId: string,
  role: UserRole
): {
  ownedHoldings: HydratedHolding[];
  ownedBy: HydratedHolding[];
  ownershipChain: Array<{ id: string; title: string; sigil: string; roleLabel: string }>;
} {
  const entryMap = new Map(state.entries.map((e) => [e.id, e]));
  const typeMap = new Map(state.entryTypes.map((t) => [t.id, t]));
  const allHoldings = state.holdings ?? [];

  function isVisible(ent?: Entry): boolean {
    if (!ent || ent.deletedAt) return false;
    if (role === "guest" && (ent.visibility !== "public" || ent.status !== "published")) {
      return false;
    }
    return true;
  }

  function hydrate(h: EntityHolding): HydratedHolding | null {
    const owner = entryMap.get(h.ownerEntryId);
    if (!isVisible(owner)) return null;
    const target = h.targetEntryId ? entryMap.get(h.targetEntryId) : undefined;
    if (h.targetEntryId && !isVisible(target)) return null;
    const ownerType = owner ? typeMap.get(owner.entryTypeId) : undefined;
    const targetType = target ? typeMap.get(target.entryTypeId) : undefined;
    return {
      ...h,
      ownerTitle: owner?.title || "Không rõ",
      ownerSigil: owner?.sigil || "✦",
      ownerTypeName: ownerType?.name || "Thực thể",
      targetTitle: target?.title || h.customName,
      targetSigil: target?.sigil || "❖",
      targetThumb: target?.thumbImage || target?.coverImage || "",
      targetTypeName: targetType?.name || "Địa điểm / Tài sản",
      targetTypeColor: targetType?.color || "#38BDF8"
    };
  }

  const ownedHoldings = allHoldings
    .filter((h) => h.ownerEntryId === entryId)
    .map(hydrate)
    .filter((x): x is HydratedHolding => x !== null);

  const ownedBy = allHoldings
    .filter((h) => h.targetEntryId === entryId)
    .map(hydrate)
    .filter((x): x is HydratedHolding => x !== null);

  // Build upward ownership chain (Breadcrumb: Root Owner -> ... -> Immediate Owner)
  const ownershipChain: Array<{ id: string; title: string; sigil: string; roleLabel: string }> = [];
  const visited = new Set<string>([entryId]);
  let cursorId = entryId;
  for (let depth = 0; depth < 6; depth++) {
    const parentHolding = allHoldings.find(
      (h) => h.targetEntryId === cursorId && h.status === "active" && !visited.has(h.ownerEntryId)
    ) ?? allHoldings.find(
      (h) => h.targetEntryId === cursorId && !visited.has(h.ownerEntryId)
    );
    if (!parentHolding) break;
    const owner = entryMap.get(parentHolding.ownerEntryId);
    if (!isVisible(owner) || !owner) break;
    visited.add(owner.id);
    ownershipChain.unshift({
      id: owner.id,
      title: owner.title,
      sigil: owner.sigil,
      roleLabel: parentHolding.roleLabel
    });
    cursorId = owner.id;
  }

  return { ownedHoldings, ownedBy, ownershipChain };
}

export async function listHoldings(workspaceId: string): Promise<EntityHolding[]> {
  const state = await loadState();
  return (state.holdings ?? []).filter((h) => h.workspaceId === workspaceId);
}

export async function upsertHolding(
  input: Omit<EntityHolding, "id" | "createdAt"> & { id?: string },
  actor = "Admin"
): Promise<EntityHolding> {
  const state = await loadState();
  if (!state.holdings) state.holdings = [];

  if (input.targetEntryId && input.ownerEntryId === input.targetEntryId) {
    throw new Error("Một thực thể không thể tự sở hữu chính nó.");
  }

  // Prevent ownership cycle: if targetEntryId already directly or indirectly owns ownerEntryId
  if (input.targetEntryId) {
    const visited = new Set<string>([input.targetEntryId]);
    let cursor: string | null = input.ownerEntryId;
    while (cursor) {
      if (visited.has(cursor)) {
        throw new Error(
          "Không thể gắn sở hữu vì sẽ tạo vòng lặp phân cấp (Thực thể con đang là chủ sở hữu cấp trên)."
        );
      }
      visited.add(cursor);
      const parentHld = state.holdings.find(
        (h) => h.id !== input.id && h.targetEntryId === cursor
      );
      cursor = parentHld ? parentHld.ownerEntryId : null;
    }
  }

  const now = new Date().toISOString();
  let idx = input.id ? state.holdings.findIndex((h) => h.id === input.id) : -1;
  // Deduplicate if same ownerEntryId + targetEntryId already exists
  if (idx < 0 && input.targetEntryId) {
    idx = state.holdings.findIndex(
      (h) =>
        h.workspaceId === input.workspaceId &&
        h.ownerEntryId === input.ownerEntryId &&
        h.targetEntryId === input.targetEntryId
    );
  }
  const saved: EntityHolding = {
    ...input,
    id: idx >= 0 ? state.holdings[idx].id : input.id || generateId("hld"),
    createdAt: idx >= 0 ? state.holdings[idx].createdAt : now
  };
  if (idx >= 0) state.holdings[idx] = saved;
  else state.holdings.push(saved);
  appendActivity(
    state,
    saved.workspaceId,
    actor,
    idx >= 0 ? "Cập nhật lãnh địa trực thuộc" : "Gắn lãnh địa / trực thuộc",
    saved.customName || saved.roleLabel,
    "holding"
  );
  await saveState(state);
  return saved;
}

export async function deleteHolding(id: string): Promise<boolean> {
  const state = await loadState();
  const before = (state.holdings ?? []).length;
  state.holdings = (state.holdings ?? []).filter((h) => h.id !== id);
  if (state.holdings.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}

export async function getWorkspaceAnalytics(
  workspaceId: string,
  role: UserRole = "admin"
): Promise<CodexAnalyticsSummary> {
  const state = await loadState();
  const entryTypes = state.entryTypes.filter((t) => t.workspaceId === workspaceId);
  const rawEntries = state.entries.filter((e) => e.workspaceId === workspaceId && !e.deletedAt);
  const entries = filterEntriesForRole(rawEntries, role, entryTypes);
  const visibleIds = new Set(entries.map((e) => e.id));
  const relations = state.relations.filter(
    (r) =>
      r.workspaceId === workspaceId &&
      visibleIds.has(r.sourceEntryId) &&
      visibleIds.has(r.targetEntryId)
  );
  return computeCodexAnalytics(entries, relations, entryTypes);
}

export async function updateWorldCalendarV4(
  calendar: WorldCalendar,
  actor = "Admin"
): Promise<WorldCalendar> {
  const state = await loadState();
  const idx = state.calendars.findIndex((c) => c.id === calendar.id);
  if (idx >= 0) {
    state.calendars[idx] = calendar;
  } else {
    state.calendars.push({ ...calendar, id: calendar.id || generateId("cal") });
  }
  appendActivity(state, calendar.workspaceId, actor, "Cập nhật hệ lịch & thiên văn", calendar.name, "calendar");
  await saveState(state);
  return calendar;
}

export async function upsertHierarchyChart(
  chart: Omit<HierarchyChart, "id" | "updatedAt"> & { id?: string },
  actor = "Admin"
): Promise<HierarchyChart> {
  const state = await loadState();
  const now = new Date().toISOString();
  const existingIdx = chart.id ? state.hierarchyCharts.findIndex((h) => h.id === chart.id) : -1;
  const saved: HierarchyChart = {
    ...chart,
    id: chart.id && existingIdx >= 0 ? chart.id : generateId("hier"),
    updatedAt: now
  };
  if (existingIdx >= 0) state.hierarchyCharts[existingIdx] = saved;
  else state.hierarchyCharts.push(saved);
  appendActivity(state, saved.workspaceId, actor, "Lưu sơ đồ phả hệ", saved.name, "hierarchy");
  await saveState(state);
  return saved;
}

export async function deleteHierarchyChart(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.hierarchyCharts.length;
  state.hierarchyCharts = state.hierarchyCharts.filter((h) => h.id !== id);
  if (state.hierarchyCharts.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}

export async function upsertSystemRule(
  rule: Omit<WorldSystemRule, "id" | "updatedAt"> & { id?: string },
  actor = "Admin"
): Promise<WorldSystemRule> {
  const state = await loadState();
  const now = new Date().toISOString();
  const existingIdx = rule.id ? state.systemRules.findIndex((s) => s.id === rule.id) : -1;
  const saved: WorldSystemRule = {
    ...rule,
    id: rule.id && existingIdx >= 0 ? rule.id : generateId("sys"),
    updatedAt: now
  };
  if (existingIdx >= 0) state.systemRules[existingIdx] = saved;
  else state.systemRules.push(saved);
  appendActivity(state, saved.workspaceId, actor, "Lưu quy luật vũ trụ / ma pháp", saved.name, "system_rule");
  await saveState(state);
  return saved;
}

export async function deleteSystemRule(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.systemRules.length;
  state.systemRules = state.systemRules.filter((s) => s.id !== id);
  if (state.systemRules.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}

export async function upsertTaxonomyNode(
  node: Omit<TaxonomyNode, "id"> & { id?: string },
  actor = "Admin"
): Promise<TaxonomyNode> {
  const state = await loadState();
  const existingIdx = node.id ? state.taxonomyNodes.findIndex((t) => t.id === node.id) : -1;
  const saved: TaxonomyNode = {
    ...node,
    id: node.id && existingIdx >= 0 ? node.id : generateId("tax")
  };
  if (existingIdx >= 0) state.taxonomyNodes[existingIdx] = saved;
  else state.taxonomyNodes.push(saved);
  appendActivity(state, saved.workspaceId, actor, "Cập nhật phân loại sinh học", saved.name, "taxonomy");
  await saveState(state);
  return saved;
}

export async function deleteTaxonomyNode(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.taxonomyNodes.length;
  state.taxonomyNodes = state.taxonomyNodes.filter((t) => t.id !== id && t.parentId !== id);
  if (state.taxonomyNodes.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}

export async function upsertTradeCommodity(
  item: Omit<TradeCommodity, "id"> & { id?: string },
  actor = "Admin"
): Promise<TradeCommodity> {
  const state = await loadState();
  const existingIdx = item.id ? state.tradeCommodities.findIndex((c) => c.id === item.id) : -1;
  const saved: TradeCommodity = {
    ...item,
    id: item.id && existingIdx >= 0 ? item.id : generateId("com")
  };
  if (existingIdx >= 0) state.tradeCommodities[existingIdx] = saved;
  else state.tradeCommodities.push(saved);
  appendActivity(state, saved.workspaceId, actor, "Cập nhật sổ cái kinh tế", saved.name, "commodity");
  await saveState(state);
  return saved;
}

export async function deleteTradeCommodity(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.tradeCommodities.length;
  state.tradeCommodities = state.tradeCommodities.filter((c) => c.id !== id);
  if (state.tradeCommodities.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}

export async function upsertChronicleChapter(
  chapter: Omit<ChronicleChapter, "id" | "updatedAt"> & { id?: string },
  actor = "Admin"
): Promise<ChronicleChapter> {
  const state = await loadState();
  const now = new Date().toISOString();
  const existingIdx = chapter.id ? state.chronicleChapters.findIndex((c) => c.id === chapter.id) : -1;
  const saved: ChronicleChapter = {
    ...chapter,
    id: chapter.id && existingIdx >= 0 ? chapter.id : generateId("chr"),
    updatedAt: now
  };
  if (existingIdx >= 0) state.chronicleChapters[existingIdx] = saved;
  else state.chronicleChapters.push(saved);
  appendActivity(state, saved.workspaceId, actor, "Lưu chương biên niên sử", saved.title, "chronicle");
  await saveState(state);
  return saved;
}

export async function deleteChronicleChapter(id: string): Promise<boolean> {
  const state = await loadState();
  const before = state.chronicleChapters.length;
  state.chronicleChapters = state.chronicleChapters.filter((c) => c.id !== id);
  if (state.chronicleChapters.length < before) {
    await saveState(state);
    return true;
  }
  return false;
}


