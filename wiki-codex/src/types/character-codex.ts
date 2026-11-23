import type { UserRole } from "./codex";

/* ==================== ACCESS CONTROL, SPOILER & VERIFICATION ==================== */
export type ContentAccessLevel =
  | "public"
  | "admin_only"
  | "authorized_only"
  | "spoiler"
  | "unpublished"
  | "private_draft";

export type VerificationStatus =
  | "official"
  | "verified"
  | "unverified"
  | "inferred"
  | "creative"
  | "updating"
  | "draft"
  | "outdated";

export type CharacterLifeStatus = "alive" | "deceased" | "missing" | "unknown" | "immortal" | "sealed";
export type CharacterActivityStatus = "active" | "retired" | "dormant" | "exiled" | "imprisoned";
export type CharacterRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic" | "unique";
export type CharacterRoleType =
  | "protagonist"
  | "deuteragonist"
  | "antagonist"
  | "supporting"
  | "mentor"
  | "ruler"
  | "historical"
  | "legendary_entity"
  | "neutral";

/* ==================== 1. IDENTITY (34 FIELDS) ==================== */
export interface CharacterRecord {
  id: string; // CHAR-000001
  workspaceId: string;
  fullName: string;
  birthName: string;
  trueName: string;
  aliases: string[];
  nicknames: string[];
  titles: string[];
  ancientTitles: string[];
  historicalTitles: string[];
  age: string;
  birthDay?: number | null;
  birthMonth?: number | null;
  birthYear?: number | null;
  deathDate: string;
  deathYear?: number | null;
  gender: string;
  race: string;
  nationality: string;
  hometown: string;
  birthPlace: string;
  residence: string;
  originWorld: string;
  currentWorld: string;
  occupation: string;
  position: string;
  rank: string;
  role: CharacterRoleType;
  rarity: CharacterRarity;
  lifeStatus: CharacterLifeStatus;
  activityStatus: CharacterActivityStatus;
  classification: string;
  tags: string[];
  symbol: string;
  accentColor: string;
  portraitUrl: string;
  coverUrl: string;
  summary: string;
  linkedNationEntryId?: string | null;
  linkedEntryId?: string | null;
  pinnedToGrandHall: boolean;
  accessLevel: ContentAccessLevel;
  spoilerLabel: string;
  verificationStatus: VerificationStatus;
  /** Group 6: Combat & Experience */
  combat: CharacterCombatProfile;
  /** Group 10: Social Standing & Influence */
  socialStanding: CharacterSocialStanding;
  /** Group 15: Trivia & Secrets */
  trivia: CharacterTriviaProfile;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/* ==================== 2. APPEARANCE (20 FIELDS + MULTI-STAGE) ==================== */
export interface CharacterAppearanceStage {
  id: string;
  characterId: string;
  stageName: string;
  ageAtStage: string;
  timePeriod: string;
  description: string;
  imageUrl: string;
  height: string;
  weight: string;
  hairColor: string;
  hairStyle: string;
  eyeColor: string;
  skinTone: string;
  faceFeatures: string;
  physique: string;
  distinguishingMarks: string;
  scars: string;
  tattoos: string;
  specialMarkings: string;
  voice: string;
  demeanor: string;
  casualOutfit: string;
  combatOutfit: string;
  ceremonialOutfit: string;
  specialOutfit: string;
  accessories: string;
  personalEmblem: string;
  changesNoted: string;
  isCurrent: boolean;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
  verificationStatus: VerificationStatus;
}

/* ==================== 3. PERSONALITY & PSYCHOLOGY (20 FIELDS + STAGES) ==================== */
export interface CharacterPersonalityStage {
  id: string;
  characterId: string;
  stageName: string;
  periodLabel: string;
  corePersonality: string;
  strengths: string[];
  weaknesses: string[];
  likes: string[];
  dislikes: string[];
  fears: string[];
  motivations: string;
  shortTermGoals: string;
  longTermGoals: string;
  beliefs: string;
  lifePhilosophy: string;
  personalPrinciples: string;
  habits: string;
  psychologyProfile: string;
  dangerReaction: string;
  pressureReaction: string;
  communicationStyle: string;
  emotionalControl: string;
  internalConflict: string;
  psychologicalGrowth: string;
  isCurrent: boolean;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
  verificationStatus: VerificationStatus;
}

/* ==================== 4. BIOGRAPHY (15 SECTIONS + MULTI-CHAPTER) ==================== */
export type BiographySectionKey =
  | "origin"
  | "family"
  | "childhood"
  | "adolescence"
  | "adulthood"
  | "education"
  | "training"
  | "major_incidents"
  | "life_changing_events"
  | "growth_journey"
  | "failures"
  | "successes"
  | "secret_past"
  | "current_bio"
  | "future_direction";

export interface CharacterBiographyChapter {
  id: string;
  characterId: string;
  sectionKey: BiographySectionKey;
  chapterOrder: number;
  stageLabel: string;
  title: string;
  contentMarkdown: string;
  linkedEventId?: string | null;
  linkedWikiEntryId?: string | null;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
  verificationStatus: VerificationStatus;
}

/* ==================== 5. ABILITIES, 13 STATS, SKILLS & PROGRESSION ==================== */
export interface CharacterBaseStats {
  hp: number;
  mp: number;
  stamina: number;
  strength: number;
  speed: number;
  endurance: number;
  defense: number;
  reflex: number;
  intelligence: number;
  perception: number;
  willpower: number;
  energyControl: number;
  adaptability: number;
}

export interface PowerProgressionEntry {
  id: string;
  dateLabel: string;
  stageLabel: string;
  kind: "level_up" | "stat_gain" | "skill_learned" | "awakening" | "evolution" | "realm_breakthrough" | "limit";
  levelValue?: number;
  realmLabel?: string;
  summary: string;
  breakthroughCondition?: string;
  confirmedByEditor: boolean;
  editorName: string;
  recordedAt: string;
}

export interface CharacterAbilityProfile {
  characterId: string;
  stats: CharacterBaseStats;
  /** Optional world-specific custom stat overrides */
  worldStatOverrides: Array<{ key: string; label: string; value: number; maxValue?: number; unit?: string }>;
  level: number;
  realm: string;
  powerTier: string;
  energySystem: string;
  elements: string[];
  attributes: string[];
  bloodline: string;
  innateAbilities: string[];
  awakenedAbilities: string[];
  specialCapabilities: string[];
  resistances: string[];
  immunities: string[];
  weaknesses: string[];
  powerLimits: string;
  unbrokenLimits: string;
  progressionHistory: PowerProgressionEntry[];
  accessLevel: ContentAccessLevel;
  verificationStatus: VerificationStatus;
}

export type SkillCategory =
  | "active"
  | "passive"
  | "support"
  | "defense"
  | "attack"
  | "movement"
  | "healing"
  | "magic"
  | "ultimate"
  | "forbidden"
  | "special";

export interface CharacterSkillDef {
  id: string; // SKILL-000001
  workspaceId: string;
  name: string;
  otherNames: string[];
  icon: string;
  imageUrl: string;
  category: SkillCategory;
  description: string;
  mechanics: string;
  usageConditions: string;
  activationMethod: string;
  cooldown: string;
  energyCost: string;
  effectRange: string;
  limitations: string;
  weaknesses: string;
  origin: string;
  verificationStatus: VerificationStatus;
}

export interface CharacterSkillRelation {
  id: string;
  characterId: string;
  skillId: string;
  skillLevel: number;
  masteryLevel: string;
  mentorName: string;
  ownershipStatus: "owned" | "sealed" | "lost" | "temporary" | "evolving";
  acquiredAtLabel: string;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
}

/* ==================== 6. COMBAT & EXPERIENCE (14 FIELDS) ==================== */
export interface CharacterBattleLink {
  id: string;
  battleName: string;
  eventId?: string | null;
  wikiEntryId?: string | null;
  outcome: "victory" | "defeat" | "draw" | "ongoing";
  opponent: string;
  note: string;
}

export interface CharacterCombatProfile {
  combatStyle: string;
  schoolOrDiscipline: string;
  martialArts: string[];
  combatExperience: string;
  commandRating: number; // 0-100
  tacticsRating: number; // 0-100
  defenseRating: number; // 0-100
  offenseRating: number; // 0-100
  masteredWeapons: string[];
  notableOpponents: string[];
  importantBattles: CharacterBattleLink[];
  victoriesCount: number;
  defeatsCount: number;
  militaryAchievements: string;
}

/* ==================== 7. EQUIPMENT & ITEMS ==================== */
export type ItemCategory =
  | "weapon"
  | "armor"
  | "outfit"
  | "accessory"
  | "jewelry"
  | "consumable"
  | "artifact"
  | "treasure"
  | "vehicle"
  | "house"
  | "land"
  | "special_asset";

export interface CharacterItemDef {
  id: string; // ITEM-000001
  workspaceId: string;
  name: string;
  category: ItemCategory;
  origin: string;
  levelOrTier: string;
  currentOwnerId?: string | null;
  traits: string;
  transferHistory: Array<{ dateLabel: string; from: string; to: string; note: string }>;
  currentStatus: "equipped" | "stored" | "lost" | "destroyed" | "sealed" | "loaned";
  imageUrl: string;
  verificationStatus: VerificationStatus;
}

export interface CharacterEquipmentRelation {
  id: string;
  characterId: string;
  itemId: string;
  slotLabel: string;
  isEquipped: boolean;
  acquiredAtLabel: string;
  note: string;
  accessLevel: ContentAccessLevel;
}

/* ==================== 8. RELATIONSHIPS (22 TYPES, BIDIRECTIONAL) ==================== */
export type CharacterRelationType =
  | "father"
  | "mother"
  | "sibling"
  | "child"
  | "relative"
  | "ancestor"
  | "descendant"
  | "friend"
  | "best_friend"
  | "comrade"
  | "lover"
  | "spouse"
  | "mentor"
  | "disciple"
  | "ally"
  | "rival"
  | "enemy"
  | "master"
  | "subordinate"
  | "political_ally"
  | "partner"
  | "special";

export interface CharacterRelationshipRecord {
  id: string; // REL-000001
  workspaceId: string;
  characterAId: string;
  characterBId: string;
  relationType: CharacterRelationType;
  reverseRelationType?: CharacterRelationType;
  isBidirectional: boolean;
  description: string;
  startDate: string;
  endDate: string;
  status: "active" | "estranged" | "ended" | "secret" | "complicated";
  closeness: number; // 0-100
  historyLog: Array<{ period: string; changeNote: string }>;
  relatedEventId?: string | null;
  privateNote: string;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
  verificationStatus: VerificationStatus;
}

/* ==================== 9. CLANS & ORGANIZATIONS (12 TYPES) ==================== */
export type OrganizationCategory =
  | "clan"
  | "bloodline"
  | "royal_house"
  | "imperial_family"
  | "sect"
  | "guild"
  | "military"
  | "brotherhood"
  | "political"
  | "religious"
  | "underground"
  | "nation";

export interface CharacterOrganizationDef {
  id: string; // ORG-000001
  workspaceId: string;
  name: string;
  category: OrganizationCategory;
  sigil: string;
  color: string;
  description: string;
  linkedWikiEntryId?: string | null;
}

export interface CharacterAffiliationRecord {
  id: string;
  characterId: string;
  organizationId: string;
  position: string;
  rank: string;
  joinDate: string;
  leaveDate: string;
  roleDescription: string;
  authorityScope: string;
  memberStatus: "active" | "former" | "founder" | "expelled" | "secret_member" | "deceased_member";
  activityHistory: string;
  accessLevel: ContentAccessLevel;
  verificationStatus: VerificationStatus;
}

/* ==================== 10. SOCIAL STANDING & INFLUENCE ==================== */
export interface NationEvaluationItem {
  nationEntryId?: string | null;
  nationName: string;
  standingLabel: string; // VD: "Anh hùng Dân tộc", "Nhân vật Trung lập", "Bị truy nã"
  reputationScore: number; // -100 to 100
  note: string;
}

export interface CharacterSocialStanding {
  reputation: string;
  prestigeScore: number; // 0-100
  politicalInfluence: number; // 0-100
  economicInfluence: number; // 0-100
  militaryInfluence: number; // 0-100
  culturalInfluence: number; // 0-100
  powerAuthority: string;
  legalAuthority: string;
  fameLevel: string;
  dangerLevel: string;
  nationEvaluations: NationEvaluationItem[];
  organizationEvaluations: Array<{ orgName: string; verdict: string }>;
  historicalTitles: string[];
}

/* ==================== 11. ACHIEVEMENTS & FEATS (11 TYPES) ==================== */
export type AchievementCategory =
  | "personal"
  | "academic"
  | "political"
  | "military"
  | "economic"
  | "exploration"
  | "historical"
  | "medal"
  | "title"
  | "record"
  | "legacy";

export interface CharacterAchievementRecord {
  id: string; // ACH-000001
  characterId: string;
  category: AchievementCategory;
  title: string;
  dateAchieved: string;
  description: string;
  impactLevel: "local" | "regional" | "national" | "continental" | "planetary" | "cosmic";
  sourceRef: string;
  verificationStatus: VerificationStatus;
  accessLevel: ContentAccessLevel;
}

/* ==================== 12. EVENTS & TIMELINE ==================== */
export interface CharacterEventRecord {
  id: string; // EVENT-000001
  workspaceId: string;
  title: string;
  year: number;
  month?: number | null;
  era: string;
  stageLabel: string;
  location: string;
  /** Optional normalized coordinates [0..1] on Aethelgard Prime Atlas for Journey Map */
  mapX?: number | null;
  mapY?: number | null;
  content: string;
  outcome: string;
  impact: string;
  linkedWikiEntryId?: string | null;
  sourceRef: string;
  verificationStatus: VerificationStatus;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
}

export interface CharacterEventParticipation {
  id: string;
  characterId: string;
  eventId: string;
  characterRole: string;
  participantNames: string[];
}

/* ==================== 13. FINANCE & ASSETS ==================== */
export interface CharacterAssetRecord {
  id: string; // ASSET-000001
  characterId: string;
  personalWealth: string;
  currencyCode: string; // AUR, ARG, NGO...
  income: string;
  occupationSource: string;
  incomeSources: string[];
  properties: string[];
  landHoldings: string[];
  sharesAndEquity: string[];
  ownershipRights: string[];
  debts: string;
  inheritance: string;
  operatingCosts: string;
  accessLevel: ContentAccessLevel;
  verificationStatus: VerificationStatus;
}

/* ==================== 14. QUOTES & DIALOGUE ==================== */
export interface CharacterQuoteRecord {
  id: string; // QUO-000001
  characterId: string;
  category: "famous" | "statement" | "declaration" | "battle_cry" | "maxim";
  quoteText: string;
  listener: string;
  timeLabel: string;
  location: string;
  relatedEventId?: string | null;
  verificationStatus: VerificationStatus;
  accessLevel: ContentAccessLevel;
}

/* ==================== 15. TRIVIA & SECRETS ==================== */
export interface CharacterTriviaProfile {
  hobbies: string[];
  favoriteFood: string;
  favoriteColor: string;
  musicTaste: string;
  habits: string[];
  favoriteItems: string[];
  littleKnownFacts: string[];
  personalSecrets: Array<{
    id: string;
    title: string;
    content: string;
    accessLevel: ContentAccessLevel;
    spoilerLabel?: string;
  }>;
  funDetails: string[];
}

/* ==================== 16. IMAGE GALLERY (10 CATEGORIES) ==================== */
export type CharacterImageCategory =
  | "portrait"
  | "full_body"
  | "outfit"
  | "combat"
  | "skill"
  | "weapon"
  | "family"
  | "ally"
  | "event"
  | "progression_stage";

export interface CharacterImageRecord {
  id: string; // IMG-000001
  characterId: string;
  category: CharacterImageCategory;
  url: string;
  thumbUrl: string;
  isCover: boolean;
  isThumbnail: boolean;
  caption: string;
  sourceCredit: string;
  tags: string[];
  sortOrder: number;
  accessLevel: ContentAccessLevel;
}

/* ==================== 17. SOURCES & REFERENCES ==================== */
export interface CharacterSourceRecord {
  id: string; // SRC-000001
  characterId: string;
  sourceType: "official" | "historical_doc" | "book" | "manuscript" | "archive" | "informant";
  title: string;
  providerOrAuthor: string;
  reliability: number; // 0-100
  verificationStatus: VerificationStatus;
  updatedAt: string;
  editorName: string;
  dataVersion: string;
  url?: string;
}

/* ==================== CUSTOM FIELDS (13 DATA TYPES — NON-DESTRUCTIVE) ==================== */
export type CharacterCustomFieldDataType =
  | "text"
  | "long_text"
  | "integer"
  | "decimal"
  | "date"
  | "boolean"
  | "list"
  | "select"
  | "multi_select"
  | "url"
  | "image"
  | "entity_ref"
  | "json";

export interface CharacterCustomFieldDef {
  id: string; // CFLD-000001
  workspaceId: string;
  key: string;
  label: string;
  dataType: CharacterCustomFieldDataType;
  groupName: string;
  required: boolean;
  defaultValue: string;
  options: string[];
  visible: boolean;
  editableBy: UserRole[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterCustomFieldValue {
  id: string;
  characterId: string;
  fieldId: string;
  value: unknown;
  updatedAt: string;
}

/* ==================== VERSIONING & DIFF ==================== */
export interface CharacterVersionRecord {
  id: string;
  characterId: string;
  versionNumber: number;
  editorName: string;
  changeNote: string;
  createdAt: string;
  snapshot: CharacterHydratedDossier;
}

/* ==================== HYDRATED DOSSIER & NORMALIZED STORE ==================== */
export interface CharacterHydratedDossier {
  character: CharacterRecord;
  appearances: CharacterAppearanceStage[];
  personalities: CharacterPersonalityStage[];
  biographies: CharacterBiographyChapter[];
  ability: CharacterAbilityProfile;
  skills: Array<{ relation: CharacterSkillRelation; skill: CharacterSkillDef }>;
  equipment: Array<{ relation: CharacterEquipmentRelation; item: CharacterItemDef }>;
  relationships: Array<{
    relation: CharacterRelationshipRecord;
    otherCharacter: { id: string; fullName: string; symbol: string; portraitUrl: string; titles: string[] };
    direction: "outgoing" | "incoming";
  }>;
  affiliations: Array<{ affiliation: CharacterAffiliationRecord; organization: CharacterOrganizationDef }>;
  achievements: CharacterAchievementRecord[];
  events: Array<{ participation: CharacterEventParticipation; event: CharacterEventRecord }>;
  assets: CharacterAssetRecord[];
  quotes: CharacterQuoteRecord[];
  images: CharacterImageRecord[];
  sources: CharacterSourceRecord[];
  customFields: Array<{ definition: CharacterCustomFieldDef; value: unknown }>;
}

export interface CharacterListProjection {
  id: string;
  workspaceId: string;
  fullName: string;
  aliases: string[];
  titles: string[];
  portraitUrl: string;
  symbol: string;
  accentColor: string;
  nationality: string;
  linkedNationEntryId?: string | null;
  race: string;
  occupation: string;
  position: string;
  role: CharacterRoleType;
  rarity: CharacterRarity;
  lifeStatus: CharacterLifeStatus;
  activityStatus: CharacterActivityStatus;
  level: number;
  realm: string;
  powerTier: string;
  totalStatScore: number;
  organizationNames: string[];
  skillNames: string[];
  tags: string[];
  pinnedToGrandHall: boolean;
  accessLevel: ContentAccessLevel;
  verificationStatus: VerificationStatus;
  updatedAt: string;
}

export interface CharacterCodexDatabaseState {
  characters: CharacterRecord[];
  appearances: CharacterAppearanceStage[];
  personalities: CharacterPersonalityStage[];
  biographies: CharacterBiographyChapter[];
  abilities: CharacterAbilityProfile[];
  skills: CharacterSkillDef[];
  skillRelations: CharacterSkillRelation[];
  items: CharacterItemDef[];
  equipmentRelations: CharacterEquipmentRelation[];
  relationships: CharacterRelationshipRecord[];
  organizations: CharacterOrganizationDef[];
  affiliations: CharacterAffiliationRecord[];
  events: CharacterEventRecord[];
  eventParticipations: CharacterEventParticipation[];
  achievements: CharacterAchievementRecord[];
  assets: CharacterAssetRecord[];
  quotes: CharacterQuoteRecord[];
  images: CharacterImageRecord[];
  sources: CharacterSourceRecord[];
  versions: CharacterVersionRecord[];
  customFieldDefs: CharacterCustomFieldDef[];
  customFieldValues: CharacterCustomFieldValue[];
}

export interface CharacterAuditIssue {
  id: string;
  severity: "error" | "warning" | "info";
  kind: "duplicate_id" | "missing_relation_target" | "timeline_paradox" | "unconfirmed_power" | "empty_sources";
  characterId?: string;
  characterName?: string;
  message: string;
}
