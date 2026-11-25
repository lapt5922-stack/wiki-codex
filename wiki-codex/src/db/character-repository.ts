import fs from "fs";
import path from "path";
import type { UserRole } from "@/types/codex";
import type {
  CharacterAbilityProfile,
  CharacterAchievementRecord,
  CharacterAffiliationRecord,
  CharacterAppearanceStage,
  CharacterAssetRecord,
  CharacterBiographyChapter,
  CharacterCodexDatabaseState,
  CharacterCustomFieldDef,
  CharacterEquipmentRelation,
  CharacterEventRecord,
  CharacterHydratedDossier,
  CharacterImageRecord,
  CharacterItemDef,
  CharacterListProjection,
  CharacterOrganizationDef,
  CharacterPersonalityStage,
  CharacterQuoteRecord,
  CharacterRecord,
  CharacterRelationshipRecord,
  CharacterSkillDef,
  CharacterSkillRelation,
  CharacterSourceRecord,
  CharacterVersionRecord,
  ContentAccessLevel
} from "@/types/character-codex";
import { matchesVietnameseQuery, normalizeVietnamese } from "@/lib/vietnamese";
import {
  REVERSE_RELATION_MAP,
  auditCharacterCodex,
  escapeCsvCell,
  nextSequentialId
} from "@/lib/character-id";
import { getPostgresPool, isPostgresConfigured } from "./pool";
import { createInitialCharacterCodexState } from "./character-seed";

const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_CHAR_FILE = path.join(LOCAL_DATA_DIR, "character-codex.json");

let cachedCharState: CharacterCodexDatabaseState | null = null;
let pgCharInit = false;

export function canViewAccessLevel(level: ContentAccessLevel, role: UserRole): boolean {
  if (role === "admin") return true;
  if (role === "editor") return level !== "admin_only";
  // Guest sees public and spoiler (gated in UI), never admin/authorized/unpublished/private_draft
  return level === "public" || level === "spoiler";
}

function defaultAbilityFor(characterId: string): CharacterAbilityProfile {
  return {
    characterId,
    stats: {
      hp: 100,
      mp: 100,
      stamina: 100,
      strength: 10,
      speed: 10,
      endurance: 10,
      defense: 10,
      reflex: 10,
      intelligence: 10,
      perception: 10,
      willpower: 10,
      energyControl: 10,
      adaptability: 10
    },
    worldStatOverrides: [],
    level: 1,
    realm: "",
    powerTier: "",
    energySystem: "",
    elements: [],
    attributes: [],
    bloodline: "",
    innateAbilities: [],
    awakenedAbilities: [],
    specialCapabilities: [],
    resistances: [],
    immunities: [],
    weaknesses: [],
    powerLimits: "",
    unbrokenLimits: "",
    progressionHistory: [],
    accessLevel: "public",
    verificationStatus: "draft"
  };
}

function hydrateState(raw: Partial<CharacterCodexDatabaseState>): CharacterCodexDatabaseState {
  const seed = createInitialCharacterCodexState();
  return {
    characters: raw.characters ?? seed.characters,
    appearances: raw.appearances ?? seed.appearances,
    personalities: raw.personalities ?? seed.personalities,
    biographies: raw.biographies ?? seed.biographies,
    abilities: raw.abilities ?? seed.abilities,
    skills: raw.skills ?? seed.skills,
    skillRelations: raw.skillRelations ?? seed.skillRelations,
    items: raw.items ?? seed.items,
    equipmentRelations: raw.equipmentRelations ?? seed.equipmentRelations,
    relationships: raw.relationships ?? seed.relationships,
    organizations: raw.organizations ?? seed.organizations,
    affiliations: raw.affiliations ?? seed.affiliations,
    events: raw.events ?? seed.events,
    eventParticipations: raw.eventParticipations ?? seed.eventParticipations,
    achievements: raw.achievements ?? seed.achievements,
    assets: raw.assets ?? seed.assets,
    quotes: raw.quotes ?? seed.quotes,
    images: raw.images ?? seed.images,
    sources: raw.sources ?? seed.sources,
    versions: raw.versions ?? seed.versions,
    customFieldDefs: raw.customFieldDefs ?? seed.customFieldDefs,
    customFieldValues: raw.customFieldValues ?? seed.customFieldValues
  };
}

export async function loadCharacterState(): Promise<CharacterCodexDatabaseState> {
  if (cachedCharState) return cachedCharState;

  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    if (pool) {
      try {
        if (!pgCharInit) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS character_codex_store (
              id TEXT PRIMARY KEY,
              payload JSONB NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `);
          pgCharInit = true;
        }
        const res = await pool.query(`SELECT payload FROM character_codex_store WHERE id = 'primary' LIMIT 1`);
        if (res.rows[0]?.payload) {
          cachedCharState = hydrateState(res.rows[0].payload as Partial<CharacterCodexDatabaseState>);
          return cachedCharState;
        }
        const initial = createInitialCharacterCodexState();
        await pool.query(
          `INSERT INTO character_codex_store (id, payload, updated_at) VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(initial)]
        );
        cachedCharState = initial;
        return cachedCharState;
      } catch {
        // Fallback to local JSON safely
      }
    }
  }

  try {
    if (fs.existsSync(LOCAL_CHAR_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LOCAL_CHAR_FILE, "utf-8"));
      cachedCharState = hydrateState(raw);
      return cachedCharState;
    }
  } catch {
    // fallback to seed
  }

  const initial = createInitialCharacterCodexState();
  cachedCharState = initial;
  await saveCharacterState(initial);
  return initial;
}

export async function saveCharacterState(state: CharacterCodexDatabaseState): Promise<void> {
  cachedCharState = state;
  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO character_codex_store (id, payload, updated_at) VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(state)]
        );
        return;
      } catch {
        // continue to local write fallback
      }
    }
  }

  if (!fs.existsSync(LOCAL_DATA_DIR)) {
    fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  }
  const jsonPayload = JSON.stringify(state, null, 2);
  for (let attempt = 0; attempt < 4; attempt++) {
    const tmpFile = `${LOCAL_CHAR_FILE}.${process.pid}.${Date.now()}.${attempt}.tmp`;
    try {
      fs.writeFileSync(tmpFile, jsonPayload, "utf-8");
      fs.renameSync(tmpFile, LOCAL_CHAR_FILE);
      break;
    } catch {
      try {
        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      } catch {
        // ignore
      }
    }
  }
}

/** Hydrate a full 17-group character dossier with strict section-level RBAC filtering */
export function buildHydratedDossier(
  state: CharacterCodexDatabaseState,
  characterId: string,
  role: UserRole
): CharacterHydratedDossier | null {
  const character = state.characters.find((c) => c.id === characterId && !c.deletedAt);
  if (!character) return null;
  if (!canViewAccessLevel(character.accessLevel, role)) return null;

  const appearances = state.appearances.filter(
    (a) => a.characterId === characterId && canViewAccessLevel(a.accessLevel, role)
  );
  const personalities = state.personalities.filter(
    (p) => p.characterId === characterId && canViewAccessLevel(p.accessLevel, role)
  );
  const biographies = state.biographies
    .filter((b) => b.characterId === characterId && canViewAccessLevel(b.accessLevel, role))
    .sort((a, b) => a.chapterOrder - b.chapterOrder);

  const rawAbility = state.abilities.find((a) => a.characterId === characterId) ?? defaultAbilityFor(characterId);
  const ability = canViewAccessLevel(rawAbility.accessLevel, role) ? rawAbility : defaultAbilityFor(characterId);

  const skillMap = new Map(state.skills.map((s) => [s.id, s]));
  const skills = state.skillRelations
    .filter((r) => r.characterId === characterId && canViewAccessLevel(r.accessLevel, role))
    .map((relation) => ({ relation, skill: skillMap.get(relation.skillId) }))
    .filter((x): x is { relation: CharacterSkillRelation; skill: CharacterSkillDef } => Boolean(x.skill));

  const itemMap = new Map(state.items.map((i) => [i.id, i]));
  const equipment = state.equipmentRelations
    .filter((r) => r.characterId === characterId && canViewAccessLevel(r.accessLevel, role))
    .map((relation) => ({ relation, item: itemMap.get(relation.itemId) }))
    .filter((x): x is { relation: CharacterEquipmentRelation; item: CharacterItemDef } => Boolean(x.item));

  const charMap = new Map(state.characters.filter((c) => !c.deletedAt).map((c) => [c.id, c]));
  const relationships = state.relationships
    .filter(
      (r) =>
        canViewAccessLevel(r.accessLevel, role) &&
        (r.characterAId === characterId || (r.isBidirectional && r.characterBId === characterId))
    )
    .map((relation) => {
      const isOutgoing = relation.characterAId === characterId;
      const otherId = isOutgoing ? relation.characterBId : relation.characterAId;
      const other = charMap.get(otherId);
      if (!other) return null;
      return {
        relation: {
          ...relation,
          privateNote: role === "guest" ? "" : relation.privateNote
        },
        otherCharacter: {
          id: other.id,
          fullName: other.fullName,
          symbol: other.symbol,
          portraitUrl: other.portraitUrl,
          titles: other.titles
        },
        direction: (isOutgoing ? "outgoing" : "incoming") as "outgoing" | "incoming"
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const orgMap = new Map(state.organizations.map((o) => [o.id, o]));
  const affiliations = state.affiliations
    .filter((a) => a.characterId === characterId && canViewAccessLevel(a.accessLevel, role))
    .map((affiliation) => ({ affiliation, organization: orgMap.get(affiliation.organizationId) }))
    .filter((x): x is { affiliation: CharacterAffiliationRecord; organization: CharacterOrganizationDef } =>
      Boolean(x.organization)
    );

  const achievements = state.achievements.filter(
    (a) => a.characterId === characterId && canViewAccessLevel(a.accessLevel, role)
  );

  const eventMap = new Map(state.events.map((e) => [e.id, e]));
  const events = state.eventParticipations
    .filter((p) => p.characterId === characterId)
    .map((participation) => {
      const ev = eventMap.get(participation.eventId);
      if (!ev || !canViewAccessLevel(ev.accessLevel, role)) return null;
      return { participation, event: ev };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .sort((a, b) => a.event.year - b.event.year);

  const assets = state.assets.filter(
    (a) => a.characterId === characterId && canViewAccessLevel(a.accessLevel, role)
  );
  const quotes = state.quotes.filter(
    (q) => q.characterId === characterId && canViewAccessLevel(q.accessLevel, role)
  );
  const images = state.images
    .filter((img) => img.characterId === characterId && canViewAccessLevel(img.accessLevel, role))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sources = state.sources.filter((s) => s.characterId === characterId);

  // Sanitize personal secrets by role
  const sanitizedCharacter: CharacterRecord = {
    ...character,
    trivia: {
      ...character.trivia,
      personalSecrets: (character.trivia?.personalSecrets ?? []).filter((sec) =>
        canViewAccessLevel(sec.accessLevel, role)
      )
    }
  };

  const wsDefs = state.customFieldDefs
    .filter((d) => d.workspaceId === character.workspaceId && d.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const valMap = new Map(
    state.customFieldValues.filter((v) => v.characterId === characterId).map((v) => [v.fieldId, v.value])
  );
  const customFields = wsDefs.map((definition) => ({
    definition,
    value: valMap.has(definition.id) ? valMap.get(definition.id) : definition.defaultValue
  }));

  return {
    character: sanitizedCharacter,
    appearances,
    personalities,
    biographies,
    ability,
    skills,
    equipment,
    relationships,
    affiliations,
    achievements,
    events,
    assets,
    quotes,
    images,
    sources,
    customFields
  };
}

function sumStats(a?: CharacterAbilityProfile): number {
  if (!a) return 0;
  const s = a.stats;
  return (
    s.strength +
    s.speed +
    s.endurance +
    s.defense +
    s.reflex +
    s.intelligence +
    s.perception +
    s.willpower +
    s.energyControl +
    s.adaptability
  );
}

export interface CharacterQueryOptions {
  workspaceId: string;
  role: UserRole;
  q?: string;
  nationality?: string;
  race?: string;
  organization?: string;
  lifeStatus?: string;
  roleFilter?: string;
  rarity?: string;
  minLevel?: number;
  maxLevel?: number;
  pinnedOnly?: boolean;
  sortBy?: "updatedAt" | "name" | "level" | "statScore";
  page?: number;
  limit?: number;
}

export async function queryCharacters(opts: CharacterQueryOptions): Promise<{
  items: CharacterListProjection[];
  total: number;
  page: number;
  totalPages: number;
  facets: {
    nationalities: string[];
    races: string[];
    organizations: string[];
  };
  allRelationships: CharacterRelationshipRecord[];
}> {
  const state = await loadCharacterState();
  const abMap = new Map(state.abilities.map((a) => [a.characterId, a]));
  const skillMap = new Map(state.skills.map((s) => [s.id, s.name]));
  const orgMap = new Map(state.organizations.map((o) => [o.id, o.name]));

  const baseChars = state.characters.filter(
    (c) => c.workspaceId === opts.workspaceId && !c.deletedAt && canViewAccessLevel(c.accessLevel, opts.role)
  );

  const nationalitiesSet = new Set<string>();
  const racesSet = new Set<string>();
  const orgsSet = new Set<string>();

  const projections: CharacterListProjection[] = baseChars.map((c) => {
    const ab = abMap.get(c.id);
    const skillNames = state.skillRelations
      .filter((r) => r.characterId === c.id)
      .map((r) => skillMap.get(r.skillId))
      .filter((x): x is string => Boolean(x));
    const organizationNames = state.affiliations
      .filter((a) => a.characterId === c.id)
      .map((a) => orgMap.get(a.organizationId))
      .filter((x): x is string => Boolean(x));

    if (c.nationality) nationalitiesSet.add(c.nationality);
    if (c.race) racesSet.add(c.race);
    for (const o of organizationNames) orgsSet.add(o);

    return {
      id: c.id,
      workspaceId: c.workspaceId,
      fullName: c.fullName,
      aliases: c.aliases,
      titles: c.titles,
      portraitUrl: c.portraitUrl,
      symbol: c.symbol,
      accentColor: c.accentColor,
      nationality: c.nationality,
      linkedNationEntryId: c.linkedNationEntryId,
      race: c.race,
      occupation: c.occupation,
      position: c.position,
      role: c.role,
      rarity: c.rarity,
      lifeStatus: c.lifeStatus,
      activityStatus: c.activityStatus,
      level: ab?.level ?? 1,
      realm: ab?.realm ?? "",
      powerTier: ab?.powerTier ?? "",
      totalStatScore: sumStats(ab),
      organizationNames,
      skillNames,
      tags: c.tags,
      pinnedToGrandHall: c.pinnedToGrandHall,
      accessLevel: c.accessLevel,
      verificationStatus: c.verificationStatus,
      updatedAt: c.updatedAt
    };
  });

  // Multi-condition filtering + full Vietnamese accent-insensitive search
  const filtered = projections.filter((p) => {
    if (opts.nationality && p.nationality !== opts.nationality) return false;
    if (opts.race && p.race !== opts.race) return false;
    if (opts.organization && !p.organizationNames.includes(opts.organization)) return false;
    if (opts.lifeStatus && p.lifeStatus !== opts.lifeStatus) return false;
    if (opts.roleFilter && p.role !== opts.roleFilter) return false;
    if (opts.rarity && p.rarity !== opts.rarity) return false;
    if (typeof opts.minLevel === "number" && p.level < opts.minLevel) return false;
    if (typeof opts.maxLevel === "number" && p.level > opts.maxLevel) return false;
    if (opts.pinnedOnly && !p.pinnedToGrandHall) return false;

    if (opts.q && opts.q.trim()) {
      const hay = [
        p.id,
        p.fullName,
        ...p.aliases,
        ...p.titles,
        p.nationality,
        p.race,
        p.occupation,
        p.position,
        p.realm,
        ...p.organizationNames,
        ...p.skillNames,
        ...p.tags
      ].join(" ");
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });

  // Sorting
  const sortBy = opts.sortBy || "updatedAt";
  filtered.sort((a, b) => {
    if (sortBy === "name") return normalizeVietnamese(a.fullName).localeCompare(normalizeVietnamese(b.fullName));
    if (sortBy === "level") return b.level - a.level;
    if (sortBy === "statScore") return b.totalStatScore - a.totalStatScore;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const page = Math.max(1, opts.page || 1);
  const limit = Math.max(1, Math.min(100, opts.limit || 24));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total,
    page,
    totalPages,
    facets: {
      nationalities: Array.from(nationalitiesSet).sort(),
      races: Array.from(racesSet).sort(),
      organizations: Array.from(orgsSet).sort()
    },
    allRelationships: state.relationships.filter(
      (r) => r.workspaceId === opts.workspaceId && canViewAccessLevel(r.accessLevel, opts.role)
    )
  };
}

export async function getCharacterDossier(id: string, role: UserRole): Promise<{
  dossier: CharacterHydratedDossier | null;
  versions: Array<{ id: string; versionNumber: number; editorName: string; changeNote: string; createdAt: string }>;
}> {
  const state = await loadCharacterState();
  const dossier = buildHydratedDossier(state, id, role);
  const versions = state.versions
    .filter((v) => v.characterId === id)
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      editorName: v.editorName,
      changeNote: v.changeNote,
      createdAt: v.createdAt
    }));
  return { dossier, versions };
}

export interface UpsertCharacterPayload {
  workspaceId: string;
  character: Partial<CharacterRecord>;
  appearances?: CharacterAppearanceStage[];
  personalities?: CharacterPersonalityStage[];
  biographies?: CharacterBiographyChapter[];
  ability?: Partial<CharacterAbilityProfile>;
  skills?: Array<{ skill: Partial<CharacterSkillDef>; relation: Partial<CharacterSkillRelation> }>;
  equipment?: Array<{ item: Partial<CharacterItemDef>; relation: Partial<CharacterEquipmentRelation> }>;
  relationships?: Array<Partial<CharacterRelationshipRecord>>;
  affiliations?: Array<{ organization: Partial<CharacterOrganizationDef>; affiliation: Partial<CharacterAffiliationRecord> }>;
  achievements?: Array<Partial<CharacterAchievementRecord>>;
  events?: Array<{ event: Partial<CharacterEventRecord>; characterRole: string; participantNames?: string[] }>;
  assets?: Array<Partial<CharacterAssetRecord>>;
  quotes?: Array<Partial<CharacterQuoteRecord>>;
  images?: Array<Partial<CharacterImageRecord>>;
  sources?: Array<Partial<CharacterSourceRecord>>;
  customFieldValues?: Record<string, unknown>;
  changeNote?: string;
}

export async function createCharacterDossier(
  payload: UpsertCharacterPayload,
  editorName: string
): Promise<CharacterHydratedDossier> {
  const state = await loadCharacterState();
  if (!payload.character.fullName?.trim()) {
    throw new Error("Vui lòng nhập Họ và tên nhân vật.");
  }

  const now = new Date().toISOString();
  const charId = nextSequentialId("CHAR", state.characters.map((c) => c.id));

  const newChar: CharacterRecord = {
    id: charId,
    workspaceId: payload.workspaceId,
    fullName: payload.character.fullName.trim(),
    birthName: payload.character.birthName || "",
    trueName: payload.character.trueName || "",
    aliases: payload.character.aliases || [],
    nicknames: payload.character.nicknames || [],
    titles: payload.character.titles || [],
    ancientTitles: payload.character.ancientTitles || [],
    historicalTitles: payload.character.historicalTitles || [],
    age: payload.character.age || "",
    birthDay: payload.character.birthDay ?? null,
    birthMonth: payload.character.birthMonth ?? null,
    birthYear: payload.character.birthYear ?? null,
    deathDate: payload.character.deathDate || "",
    deathYear: payload.character.deathYear ?? null,
    gender: payload.character.gender || "",
    race: payload.character.race ?? "",
    nationality: payload.character.nationality || "",
    hometown: payload.character.hometown || "",
    birthPlace: payload.character.birthPlace || "",
    residence: payload.character.residence || "",
    originWorld: payload.character.originWorld ?? "",
    currentWorld: payload.character.currentWorld ?? "",
    occupation: payload.character.occupation || "",
    position: payload.character.position || "",
    rank: payload.character.rank || "",
    role: payload.character.role || "supporting",
    rarity: payload.character.rarity || "common",
    lifeStatus: payload.character.lifeStatus || "alive",
    activityStatus: payload.character.activityStatus || "active",
    classification: payload.character.classification || "",
    tags: payload.character.tags || [],
    symbol: payload.character.symbol || "✦",
    accentColor: payload.character.accentColor || "#D4AF37",
    portraitUrl: payload.character.portraitUrl || "",
    coverUrl: payload.character.coverUrl || "",
    summary: payload.character.summary || "",
    linkedNationEntryId: payload.character.linkedNationEntryId ?? null,
    linkedEntryId: payload.character.linkedEntryId ?? null,
    pinnedToGrandHall: Boolean(payload.character.pinnedToGrandHall),
    accessLevel: payload.character.accessLevel || "public",
    spoilerLabel: payload.character.spoilerLabel || "",
    verificationStatus: payload.character.verificationStatus || "draft",
    combat: payload.character.combat || {
      combatStyle: "",
      schoolOrDiscipline: "",
      martialArts: [],
      combatExperience: "",
      commandRating: 0,
      tacticsRating: 0,
      defenseRating: 0,
      offenseRating: 0,
      masteredWeapons: [],
      notableOpponents: [],
      importantBattles: [],
      victoriesCount: 0,
      defeatsCount: 0,
      militaryAchievements: ""
    },
    socialStanding: payload.character.socialStanding || {
      reputation: "",
      prestigeScore: 50,
      politicalInfluence: 0,
      economicInfluence: 0,
      militaryInfluence: 0,
      culturalInfluence: 0,
      powerAuthority: "",
      legalAuthority: "",
      fameLevel: "",
      dangerLevel: "",
      nationEvaluations: [],
      organizationEvaluations: [],
      historicalTitles: []
    },
    trivia: payload.character.trivia || {
      hobbies: [],
      favoriteFood: "",
      favoriteColor: "",
      musicTaste: "",
      habits: [],
      favoriteItems: [],
      littleKnownFacts: [],
      personalSecrets: [],
      funDetails: []
    },
    profileLayout: payload.character.profileLayout,
    createdBy: editorName,
    updatedBy: editorName,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };

  state.characters.unshift(newChar);
  applySubCollectionsToState(state, charId, payload, editorName, now);

  const hydrated = buildHydratedDossier(state, charId, "admin")!;
  state.versions.push({
    id: `cver-${Date.now()}`,
    characterId: charId,
    versionNumber: 1,
    editorName,
    changeNote: payload.changeNote || "Khởi tạo hồ sơ nhân vật",
    createdAt: now,
    snapshot: structuredClone(hydrated)
  });

  await saveCharacterState(state);
  return hydrated;
}

export async function updateCharacterDossier(
  characterId: string,
  payload: Partial<UpsertCharacterPayload> & { expectedUpdatedAt?: string },
  editorName: string
): Promise<CharacterHydratedDossier | null> {
  const state = await loadCharacterState();
  const char = state.characters.find((c) => c.id === characterId && !c.deletedAt);
  if (!char) return null;

  if (payload.expectedUpdatedAt && payload.expectedUpdatedAt !== char.updatedAt) {
    const { ConcurrentEditError } = await import("@/lib/api-helpers");
    throw new ConcurrentEditError(char.updatedAt, `Nhân vật "${char.fullName}"`);
  }

  const now = new Date().toISOString();
  if (payload.character) {
    const { id: _ignoreId, createdAt: _ignoreC, createdBy: _ignoreCb, ...rest } = payload.character;
    Object.assign(char, rest, { updatedBy: editorName, updatedAt: now });
  } else {
    char.updatedBy = editorName;
    char.updatedAt = now;
  }

  applySubCollectionsToState(
    state,
    characterId,
    { workspaceId: char.workspaceId, character: char, ...payload },
    editorName,
    now
  );

  const hydrated = buildHydratedDossier(state, characterId, "admin")!;
  const existingVers = state.versions.filter((v) => v.characterId === characterId);
  const nextVer = existingVers.reduce((m, v) => Math.max(m, v.versionNumber), 0) + 1;
  state.versions.push({
    id: `cver-${Date.now()}-${nextVer}`,
    characterId,
    versionNumber: nextVer,
    editorName,
    changeNote: payload.changeNote || `Cập nhật hồ sơ phiên bản v${nextVer}`,
    createdAt: now,
    snapshot: structuredClone(hydrated)
  });

  await saveCharacterState(state);
  return hydrated;
}

function applySubCollectionsToState(
  state: CharacterCodexDatabaseState,
  characterId: string,
  payload: UpsertCharacterPayload,
  editorName: string,
  now: string
) {
  if (payload.appearances !== undefined) {
    state.appearances = state.appearances.filter((a) => a.characterId !== characterId);
    for (const a of payload.appearances) {
      state.appearances.push({ ...a, id: a.id || `app-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, characterId });
    }
  }
  if (payload.personalities !== undefined) {
    state.personalities = state.personalities.filter((p) => p.characterId !== characterId);
    for (const p of payload.personalities) {
      state.personalities.push({ ...p, id: p.id || `per-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, characterId });
    }
  }
  if (payload.biographies !== undefined) {
    state.biographies = state.biographies.filter((b) => b.characterId !== characterId);
    payload.biographies.forEach((b, idx) => {
      state.biographies.push({
        ...b,
        id: b.id || `bio-${Date.now()}-${idx}`,
        characterId,
        chapterOrder: b.chapterOrder ?? idx + 1
      });
    });
  }

  // Ability (never auto-invent stats unless provided; initialize clean baseline on create)
  const existingAb = state.abilities.find((a) => a.characterId === characterId);
  if (!existingAb) {
    const base = defaultAbilityFor(characterId);
    state.abilities.push({
      ...base,
      ...(payload.ability || {}),
      stats: { ...base.stats, ...(payload.ability?.stats || {}) },
      characterId
    });
  } else if (payload.ability) {
    Object.assign(existingAb, payload.ability, {
      stats: { ...existingAb.stats, ...(payload.ability.stats || {}) },
      characterId
    });
  }

  if (payload.skills !== undefined) {
    state.skillRelations = state.skillRelations.filter((r) => r.characterId !== characterId);
    for (const entry of payload.skills) {
      const skillId =
        entry.skill.id && state.skills.some((s) => s.id === entry.skill.id)
          ? entry.skill.id
          : nextSequentialId("SKILL", state.skills.map((s) => s.id));
      const existingSkill = state.skills.find((s) => s.id === skillId);
      if (existingSkill) {
        Object.assign(existingSkill, entry.skill, { id: skillId });
      } else {
        state.skills.push({
          id: skillId,
          workspaceId: payload.workspaceId,
          name: entry.skill.name || "Kỹ năng mới",
          otherNames: entry.skill.otherNames || [],
          icon: entry.skill.icon || "Sparkles",
          imageUrl: entry.skill.imageUrl || "",
          category: entry.skill.category || "active",
          description: entry.skill.description || "",
          mechanics: entry.skill.mechanics || "",
          usageConditions: entry.skill.usageConditions || "",
          activationMethod: entry.skill.activationMethod || "",
          cooldown: entry.skill.cooldown || "",
          energyCost: entry.skill.energyCost || "",
          effectRange: entry.skill.effectRange || "",
          limitations: entry.skill.limitations || "",
          weaknesses: entry.skill.weaknesses || "",
          origin: entry.skill.origin || "",
          verificationStatus: entry.skill.verificationStatus || "draft"
        });
      }
      state.skillRelations.push({
        id: entry.relation.id || `skrel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        characterId,
        skillId,
        skillLevel: entry.relation.skillLevel ?? 1,
        masteryLevel: entry.relation.masteryLevel || "Sơ cấp",
        mentorName: entry.relation.mentorName || "",
        ownershipStatus: entry.relation.ownershipStatus || "owned",
        acquiredAtLabel: entry.relation.acquiredAtLabel || "",
        accessLevel: entry.relation.accessLevel || "public",
        spoilerLabel: entry.relation.spoilerLabel
      });
    }
  }

  if (payload.equipment !== undefined) {
    state.equipmentRelations = state.equipmentRelations.filter((r) => r.characterId !== characterId);
    for (const entry of payload.equipment) {
      const itemId =
        entry.item.id && state.items.some((i) => i.id === entry.item.id)
          ? entry.item.id
          : nextSequentialId("ITEM", state.items.map((i) => i.id));
      const existingItem = state.items.find((i) => i.id === itemId);
      if (existingItem) {
        Object.assign(existingItem, entry.item, { id: itemId, currentOwnerId: characterId });
      } else {
        state.items.push({
          id: itemId,
          workspaceId: payload.workspaceId,
          name: entry.item.name || "Trang bị mới",
          category: entry.item.category || "weapon",
          origin: entry.item.origin || "",
          levelOrTier: entry.item.levelOrTier || "",
          currentOwnerId: characterId,
          traits: entry.item.traits || "",
          transferHistory: entry.item.transferHistory || [],
          currentStatus: entry.item.currentStatus || "equipped",
          imageUrl: entry.item.imageUrl || "",
          verificationStatus: entry.item.verificationStatus || "draft"
        });
      }
      state.equipmentRelations.push({
        id: entry.relation.id || `eq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        characterId,
        itemId,
        slotLabel: entry.relation.slotLabel || "Trang bị",
        isEquipped: entry.relation.isEquipped !== false,
        acquiredAtLabel: entry.relation.acquiredAtLabel || "",
        note: entry.relation.note || "",
        accessLevel: entry.relation.accessLevel || "public"
      });
    }
  }

  if (payload.relationships !== undefined) {
    state.relationships = state.relationships.filter((r) => r.characterAId !== characterId);
    for (const r of payload.relationships) {
      if (!r.characterBId || r.characterBId === characterId) continue;
      const relId = r.id || nextSequentialId("REL", state.relationships.map((x) => x.id));
      const relType = r.relationType || "ally";
      state.relationships.push({
        id: relId,
        workspaceId: payload.workspaceId,
        characterAId: characterId,
        characterBId: r.characterBId,
        relationType: relType,
        reverseRelationType: r.reverseRelationType || REVERSE_RELATION_MAP[relType],
        isBidirectional: r.isBidirectional !== false,
        description: r.description || "",
        startDate: r.startDate || "",
        endDate: r.endDate || "",
        status: r.status || "active",
        closeness: typeof r.closeness === "number" ? Math.max(0, Math.min(100, r.closeness)) : 60,
        historyLog: r.historyLog || [],
        relatedEventId: r.relatedEventId ?? null,
        privateNote: r.privateNote || "",
        accessLevel: r.accessLevel || "public",
        spoilerLabel: r.spoilerLabel,
        verificationStatus: r.verificationStatus || "official"
      });
    }
  }

  if (payload.affiliations !== undefined) {
    state.affiliations = state.affiliations.filter((a) => a.characterId !== characterId);
    for (const entry of payload.affiliations) {
      let orgId = entry.organization.id;
      if (!orgId || !state.organizations.some((o) => o.id === orgId)) {
        const byName = state.organizations.find(
          (o) =>
            o.workspaceId === payload.workspaceId &&
            o.name.toLowerCase() === (entry.organization.name || "").trim().toLowerCase()
        );
        if (byName) {
          orgId = byName.id;
        } else {
          orgId = nextSequentialId("ORG", state.organizations.map((o) => o.id));
          state.organizations.push({
            id: orgId,
            workspaceId: payload.workspaceId,
            name: entry.organization.name || "Tổ chức mới",
            category: entry.organization.category || "guild",
            sigil: entry.organization.sigil || "⛨",
            color: entry.organization.color || "#60A5FA",
            description: entry.organization.description || "",
            linkedWikiEntryId: entry.organization.linkedWikiEntryId ?? null
          });
        }
      }
      state.affiliations.push({
        id: entry.affiliation.id || `aff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        characterId,
        organizationId: orgId,
        position: entry.affiliation.position || "",
        rank: entry.affiliation.rank || "",
        joinDate: entry.affiliation.joinDate || "",
        leaveDate: entry.affiliation.leaveDate || "",
        roleDescription: entry.affiliation.roleDescription || "",
        authorityScope: entry.affiliation.authorityScope || "",
        memberStatus: entry.affiliation.memberStatus || "active",
        activityHistory: entry.affiliation.activityHistory || "",
        accessLevel: entry.affiliation.accessLevel || "public",
        verificationStatus: entry.affiliation.verificationStatus || "official"
      });
    }
  }

  if (payload.achievements !== undefined) {
    state.achievements = state.achievements.filter((a) => a.characterId !== characterId);
    for (const a of payload.achievements) {
      state.achievements.push({
        id: a.id || nextSequentialId("ACH", state.achievements.map((x) => x.id)),
        characterId,
        category: a.category || "personal",
        title: a.title || "Thành tựu",
        dateAchieved: a.dateAchieved || "",
        description: a.description || "",
        impactLevel: a.impactLevel || "regional",
        sourceRef: a.sourceRef || "",
        verificationStatus: a.verificationStatus || "verified",
        accessLevel: a.accessLevel || "public"
      });
    }
  }

  if (payload.events !== undefined) {
    state.eventParticipations = state.eventParticipations.filter((p) => p.characterId !== characterId);
    for (const entry of payload.events) {
      const eventId =
        entry.event.id && state.events.some((e) => e.id === entry.event.id)
          ? entry.event.id
          : nextSequentialId("EVENT", state.events.map((e) => e.id));
      const existingEv = state.events.find((e) => e.id === eventId);
      if (existingEv) {
        Object.assign(existingEv, entry.event, { id: eventId });
      } else {
        state.events.push({
          id: eventId,
          workspaceId: payload.workspaceId,
          title: entry.event.title || "Sự kiện mới",
          year: entry.event.year ?? 0,
          month: entry.event.month ?? null,
          era: entry.event.era || "",
          stageLabel: entry.event.stageLabel || "",
          location: entry.event.location || "",
          mapX: entry.event.mapX ?? null,
          mapY: entry.event.mapY ?? null,
          content: entry.event.content || "",
          outcome: entry.event.outcome || "",
          impact: entry.event.impact || "",
          linkedWikiEntryId: entry.event.linkedWikiEntryId ?? null,
          sourceRef: entry.event.sourceRef || "",
          verificationStatus: entry.event.verificationStatus || "verified",
          accessLevel: entry.event.accessLevel || "public",
          spoilerLabel: entry.event.spoilerLabel
        });
      }
      state.eventParticipations.push({
        id: `evp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        characterId,
        eventId,
        characterRole: entry.characterRole || "Tham gia",
        participantNames: entry.participantNames || []
      });
    }
  }

  if (payload.assets !== undefined) {
    state.assets = state.assets.filter((a) => a.characterId !== characterId);
    for (const a of payload.assets) {
      state.assets.push({
        id: a.id || nextSequentialId("ASSET", state.assets.map((x) => x.id)),
        characterId,
        personalWealth: a.personalWealth || "",
        currencyCode: a.currencyCode || "AUR",
        income: a.income || "",
        occupationSource: a.occupationSource || "",
        incomeSources: a.incomeSources || [],
        properties: a.properties || [],
        landHoldings: a.landHoldings || [],
        sharesAndEquity: a.sharesAndEquity || [],
        ownershipRights: a.ownershipRights || [],
        debts: a.debts || "",
        inheritance: a.inheritance || "",
        operatingCosts: a.operatingCosts || "",
        accessLevel: a.accessLevel || "public",
        verificationStatus: a.verificationStatus || "verified"
      });
    }
  }

  if (payload.quotes !== undefined) {
    state.quotes = state.quotes.filter((q) => q.characterId !== characterId);
    for (const q of payload.quotes) {
      state.quotes.push({
        id: q.id || nextSequentialId("QUO", state.quotes.map((x) => x.id)),
        characterId,
        category: q.category || "famous",
        quoteText: q.quoteText || "",
        listener: q.listener || "",
        timeLabel: q.timeLabel || "",
        location: q.location || "",
        relatedEventId: q.relatedEventId ?? null,
        verificationStatus: q.verificationStatus || "official",
        accessLevel: q.accessLevel || "public"
      });
    }
  }

  if (payload.images !== undefined) {
    state.images = state.images.filter((i) => i.characterId !== characterId);
    payload.images.forEach((img, idx) => {
      if (!img.url) return;
      state.images.push({
        id: img.id || nextSequentialId("IMG", state.images.map((x) => x.id)),
        characterId,
        category: img.category || "portrait",
        url: img.url,
        thumbUrl: img.thumbUrl || img.url,
        isCover: Boolean(img.isCover),
        isThumbnail: Boolean(img.isThumbnail),
        caption: img.caption || "",
        sourceCredit: img.sourceCredit || "",
        tags: img.tags || [],
        sortOrder: img.sortOrder ?? idx,
        accessLevel: img.accessLevel || "public"
      });
    });
  }

  if (payload.sources !== undefined) {
    state.sources = state.sources.filter((s) => s.characterId !== characterId);
    for (const s of payload.sources) {
      state.sources.push({
        id: s.id || nextSequentialId("SRC", state.sources.map((x) => x.id)),
        characterId,
        sourceType: s.sourceType || "official",
        title: s.title || "Nguồn tham khảo",
        providerOrAuthor: s.providerOrAuthor || "",
        reliability: typeof s.reliability === "number" ? s.reliability : 80,
        verificationStatus: s.verificationStatus || "verified",
        updatedAt: now,
        editorName,
        dataVersion: s.dataVersion || "1.0",
        url: s.url || ""
      });
    }
  }

  if (payload.customFieldValues) {
    for (const [fieldId, value] of Object.entries(payload.customFieldValues)) {
      const existing = state.customFieldValues.find(
        (v) => v.characterId === characterId && v.fieldId === fieldId
      );
      if (existing) {
        existing.value = value;
        existing.updatedAt = now;
      } else {
        state.customFieldValues.push({
          id: `cfv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          characterId,
          fieldId,
          value,
          updatedAt: now
        });
      }
    }
  }
}

export async function softDeleteCharacter(id: string, editorName: string): Promise<boolean> {
  const state = await loadCharacterState();
  const char = state.characters.find((c) => c.id === id);
  if (!char) return false;
  char.deletedAt = new Date().toISOString();
  char.updatedBy = editorName;
  await saveCharacterState(state);
  return true;
}

export async function restoreCharacterVersion(
  characterId: string,
  versionNumber: number,
  editorName: string
): Promise<CharacterHydratedDossier | null> {
  const state = await loadCharacterState();
  const targetVer = state.versions.find(
    (v) => v.characterId === characterId && v.versionNumber === versionNumber
  );
  if (!targetVer) return null;
  const snap = targetVer.snapshot;
  return updateCharacterDossier(
    characterId,
    {
      workspaceId: snap.character.workspaceId,
      character: snap.character,
      appearances: snap.appearances,
      personalities: snap.personalities,
      biographies: snap.biographies,
      ability: snap.ability,
      achievements: snap.achievements,
      assets: snap.assets,
      quotes: snap.quotes,
      images: snap.images,
      sources: snap.sources,
      changeNote: `Khôi phục về phiên bản v${versionNumber}`
    },
    editorName
  );
}

export async function getCharacterVersions(characterId: string): Promise<CharacterVersionRecord[]> {
  const state = await loadCharacterState();
  return state.versions
    .filter((v) => v.characterId === characterId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

/* ==================== NON-DESTRUCTIVE CUSTOM FIELDS CRUD ==================== */
export async function listCustomFieldDefs(workspaceId: string): Promise<CharacterCustomFieldDef[]> {
  const state = await loadCharacterState();
  return state.customFieldDefs
    .filter((d) => d.workspaceId === workspaceId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertCustomFieldDef(
  input: Partial<CharacterCustomFieldDef> & { workspaceId: string; label: string }
): Promise<CharacterCustomFieldDef> {
  const state = await loadCharacterState();
  const now = new Date().toISOString();
  if (input.id) {
    const existing = state.customFieldDefs.find((d) => d.id === input.id);
    if (existing) {
      // Updating label/key/dataType never deletes customFieldValues (keyed by fieldId!)
      Object.assign(existing, input, { updatedAt: now });
      await saveCharacterState(state);
      return existing;
    }
  }
  const newDef: CharacterCustomFieldDef = {
    id: nextSequentialId("CFLD", state.customFieldDefs.map((d) => d.id)),
    workspaceId: input.workspaceId,
    key:
      input.key?.trim() ||
      normalizeVietnamese(input.label).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    label: input.label.trim(),
    dataType: input.dataType || "text",
    groupName: input.groupName || "Mở rộng",
    required: Boolean(input.required),
    defaultValue: input.defaultValue || "",
    options: input.options || [],
    visible: input.visible !== false,
    editableBy: input.editableBy || ["admin", "editor"],
    sortOrder: input.sortOrder ?? state.customFieldDefs.length + 1,
    createdAt: now,
    updatedAt: now
  };
  state.customFieldDefs.push(newDef);
  await saveCharacterState(state);
  return newDef;
}

export async function deleteCustomFieldDef(id: string): Promise<boolean> {
  const state = await loadCharacterState();
  const before = state.customFieldDefs.length;
  state.customFieldDefs = state.customFieldDefs.filter((d) => d.id !== id);
  if (state.customFieldDefs.length === before) return false;
  await saveCharacterState(state);
  return true;
}

/* ==================== AUDIT & BULK JSON / CSV IO ==================== */
export async function runCharacterAudit(workspaceId: string) {
  const state = await loadCharacterState();
  return auditCharacterCodex(state, workspaceId);
}

export async function exportCharactersData(workspaceId: string, format: "json" | "csv", role: UserRole) {
  const state = await loadCharacterState();
  const chars = state.characters.filter(
    (c) => c.workspaceId === workspaceId && !c.deletedAt && canViewAccessLevel(c.accessLevel, role)
  );
  if (format === "json") {
    const dossiers = chars
      .map((c) => buildHydratedDossier(state, c.id, role))
      .filter((x): x is CharacterHydratedDossier => Boolean(x));
    return JSON.stringify({ exportedAt: new Date().toISOString(), count: dossiers.length, dossiers }, null, 2);
  }
  const headers = [
    "ID",
    "HoVaTen",
    "DanhHieu",
    "ChungToc",
    "QuocTich",
    "NgheNghiep",
    "ChucVu",
    "VaiTro",
    "DoHiem",
    "TrangThaiSong",
    "CapDo",
    "CanhGioi",
    "Tags"
  ];
  const abMap = new Map(state.abilities.map((a) => [a.characterId, a]));
  const rows = chars.map((c) => {
    const ab = abMap.get(c.id);
    return [
      c.id,
      c.fullName,
      c.titles.join(" | "),
      c.race,
      c.nationality,
      c.occupation,
      c.position,
      c.role,
      c.rarity,
      c.lifeStatus,
      ab?.level ?? 1,
      ab?.realm ?? "",
      c.tags.join(", ")
    ]
      .map(escapeCsvCell)
      .join(",");
  });
  return [headers.join(","), ...rows].join("\n");
}

export async function bulkImportCharacters(
  workspaceId: string,
  records: Array<{
    fullName: string;
    race?: string;
    nationality?: string;
    occupation?: string;
    position?: string;
    titles?: string[];
    level?: number;
    realm?: string;
    summary?: string;
    tags?: string[];
  }>,
  editorName: string
): Promise<{ imported: number; ids: string[] }> {
  const ids: string[] = [];
  for (const rec of records) {
    if (!rec.fullName?.trim()) continue;
    const created = await createCharacterDossier(
      {
        workspaceId,
        character: {
          fullName: rec.fullName.trim(),
          race: rec.race || "Nhân tộc",
          nationality: rec.nationality || "",
          occupation: rec.occupation || "",
          position: rec.position || "",
          titles: rec.titles || [],
          summary: rec.summary || "",
          tags: rec.tags || [],
          verificationStatus: "draft"
        },
        ability: {
          level: rec.level ?? 1,
          realm: rec.realm || ""
        },
        changeNote: "Nhập hàng loạt (Bulk Import)"
      },
      editorName
    );
    ids.push(created.character.id);
  }
  return { imported: ids.length, ids };
}
