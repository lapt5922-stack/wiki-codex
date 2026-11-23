import type { EntityEmblemConfig, UserRole } from "./codex";
import type { ContentAccessLevel, VerificationStatus } from "./character-codex";
import type { EntityProfileLayoutConfig } from "@/lib/empty-field-engine";

export type KingdomWorkflowStatus = "draft" | "published" | "under_review" | "archived";

export type KingdomPolityType =
  | "kingdom"
  | "empire"
  | "federation"
  | "republic"
  | "city_state"
  | "principality"
  | "theocracy"
  | "confederation"
  | "special_zone";

/* ==================== 1. IDENTITY ==================== */
export interface KingdomRecord {
  id: string; // KING-000001
  workspaceId: string;
  officialName: string;
  commonName: string;
  ancientName: string;
  nativeName: string;
  abbreviation: string;
  historicalAliases: string[];
  polityType: KingdomPolityType;
  governmentType: string;
  currentStatus: "sovereign" | "vassal" | "federated" | "disputed" | "collapsed" | "reforming";
  developmentLevel: "superpower" | "developed" | "developing" | "emerging" | "frontier";
  foundedDate: string;
  ageYears: number;
  officialLanguages: string[];
  currencyCode: string;
  currencyName: string;
  timezone: string;
  countryCode: string;
  continent: string;
  bloc: string;
  tags: string[];
  categories: string[];
  summary: string;
  motto: string;
  workflowStatus: KingdomWorkflowStatus;
  accessLevel: ContentAccessLevel;
  spoilerLabel: string;
  verificationStatus: VerificationStatus;
  linkedWikiEntryId?: string | null;
  linkedAtlasNationId?: string | null;
  nationNum?: number | null;
  profileLayout?: EntityProfileLayoutConfig;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/* ==================== 2. SYMBOLS & VISUAL IDENTITY ==================== */
export interface KingdomSymbols {
  kingdomId: string;
  flagUrl: string;
  coatOfArmsUrl: string;
  emblemConfig?: EntityEmblemConfig;
  anthemTitle: string;
  anthemLyrics: string;
  nationalSeal: string;
  royalSymbol: string;
  nationalMascot: string;
  representativeColors: string[];
  capitalImageUrl: string;
  coverImageUrl: string;
  thumbImageUrl: string;
  mapImageUrl: string;
}

/* ==================== 3. GEOGRAPHY & TERRITORY ==================== */
export interface KingdomRegionRecord {
  id: string; // REG-000001 or CITY-000001
  kingdomId: string;
  kind: "capital" | "city" | "province" | "autonomous" | "overseas" | "special" | "disputed";
  name: string;
  population?: number;
  description: string;
  linkedWikiEntryId?: string | null;
}

export interface KingdomTerritory {
  kingdomId: string;
  geoLocation: string;
  areaKm2: number;
  borderDescription: string;
  neighborKingdomIds: string[];
  capitalCityId: string;
  capitalName: string;
  terrainSummary: string;
  mountainsRiversSeas: string;
  climateSummary: string;
  avgTempC?: number;
  elevationM?: number;
  naturalResources: string[];
  strategicZones: string[];
  disputedRegions: string[];
  overseasTerritories: string[];
  autonomousRegions: string[];
  specialZones: string[];
  /** Real polygon path & bbox sourced directly from Planetary Atlas (never fabricated) */
  atlasSvgPath?: string;
  atlasBbox?: { minX: number; maxX: number; minY: number; maxY: number };
}

/* ==================== 4. POPULATION & SOCIETY (MULTI-YEAR) ==================== */
export interface KingdomPopulationYear {
  id: string;
  kingdomId: string;
  year: number;
  totalPopulation: number;
  densityPerKm2: number;
  races: Array<{ name: string; pct: number }>;
  ethnicGroups: string[];
  avgLifespan: number;
  ageStructure: string;
  socialClasses: string[];
  urbanizationPct: number;
  ruralPct: number;
  languages: string[];
  religions: string[];
  customs: string[];
  traditions: string[];
  festivals: string[];
  educationSummary: string;
  healthcareSummary: string;
  socialWelfare: string;
  qualityOfLife: string;
  socialIssues: string[];
}

/* ==================== 5. POLITICS & GOVERNMENT ==================== */
export interface KingdomGovernment {
  kingdomId: string;
  politicalSystem: string;
  stateStructure: string;
  constitution: string;
  lawSystem: string;
  legislature: string;
  executive: string;
  judiciary: string;
  administrativeSystem: string;
  successionMechanism: string;
  electionMechanism: string;
  centralPower: string;
  localPower: string;
  nationalPolicies: string[];
  bureaucracySystem: string;
  politicalFactions: string[];
  politicalParties: string[];
  governanceApparatus: string;
  politicalStability: string;
}

/* ==================== 6. ROYALTY & RULERS (LINKED BY CHARACTER ID) ==================== */
export interface KingdomRulerLink {
  id: string;
  kingdomId: string;
  characterId?: string | null; // CHAR-000001 — no duplicate character data!
  fallbackName: string;
  roleTitle: string; // Quốc vương, Hoàng hậu, Thái tử, Tể tướng, Cố vấn...
  dynasty: string;
  reignStart: string;
  reignEnd: string;
  predecessorName: string;
  successorName: string;
  isCurrent: boolean;
  note: string;
}

/* ==================== 7. ECONOMY & FINANCE (MULTI-YEAR) ==================== */
export interface KingdomEconomyYear {
  id: string;
  kingdomId: string;
  year: number;
  gdpValue: number; // in millions of Aurel equivalent for charting
  gdpLabel: string;
  gdpPerCapitaLabel: string;
  totalBudget: string;
  budgetRevenue: string;
  budgetExpenditure: string;
  publicDebt: string;
  inflationPct: number;
  unemploymentPct: number;
  tradeBalanceLabel: string;
  exportsShare: number;
  importsShare: number;
  majorExports: string[];
  majorImports: string[];
  taxSystem: string;
  currencyCode: string;
  currencyValueNote: string;
  centralBank: string;
  bankingSystem: string;
  financialMarket: string;
  agriculturePct: number;
  industryPct: number;
  tradePct: number;
  servicesPct: number;
  miningNote: string;
  energyNote: string;
  tourismNote: string;
  majorCorporations: string[];
  merchantFamilies: string[];
  wealthLevel: string;
  economicSelfSufficiency: number; // 0-100
}

/* ==================== 8. MILITARY & DEFENSE (FANTASY WORLD OVERVIEW) ==================== */
export interface KingdomMilitaryOverview {
  kingdomId: string;
  totalForceScale: string;
  armyOverview: string;
  navyOverview: string;
  airForceOverview: string;
  specialForces: string;
  royalGuard: string;
  defenseForce: string;
  intelligenceAgency: string;
  securityAgency: string;
  highCommand: string;
  rankSystem: string;
  militaryAcademies: string[];
  defenseDoctrine: string;
  defenseCapability: string;
  militaryTech: string;
  iconicEquipment: string[];
  commanderCharacterIds: string[];
  organizationHistory: string;
  historicalConflicts: string[];
}

/* ==================== 9. TECHNOLOGY, SCIENCE & MAGIC ==================== */
export interface KingdomTechnologyMagic {
  kingdomId: string;
  civilizationLevel: string;
  techLevel: string;
  naturalSciences: string;
  engineering: string;
  medicine: string;
  transportationTech: string;
  energyTech: string;
  informationTech: string;
  manufacturingTech: string;
  defenseTech: string;
  magicSystem: string;
  supernaturalEnergy: string;
  magicAcademies: string[];
  researchProjects: string[];
  notableInventions: string[];
  exclusiveTech: string[];
  ancientTechLegacy: string;
}

/* ==================== 10. CULTURE, EDUCATION & RELIGION ==================== */
export interface KingdomCultureEducation {
  kingdomId: string;
  culturalIdentity: string;
  royalCulture: string;
  folkCulture: string;
  arts: string;
  music: string;
  literature: string;
  architecture: string;
  cuisine: string;
  traditionalDress: string;
  martialTraditions: string;
  educationSystem: string;
  universitiesAndAcademies: string[];
  religions: string[];
  mythology: string;
  historicalMonuments: string[];
  culturalHeritage: string[];
  nationalHolidays: string[];
}

/* ==================== 11. INFRASTRUCTURE & URBAN ==================== */
export interface KingdomInfrastructure {
  kingdomId: string;
  transportSystem: string;
  roads: string;
  railways: string;
  seaports: string;
  airports: string;
  energyGrid: string;
  waterSupply: string;
  telecom: string;
  hospitalsAndSchools: string;
  industrialZones: string;
  tradeCenters: string;
  publicWorks: string;
  iconicLandmarks: string[];
  developmentScore: number; // 0-100
}

/* ==================== 12. RELATIONS & TREATIES ==================== */
export type KingdomRelationKind =
  | "alliance"
  | "strategic_partner"
  | "trade_partner"
  | "neutral"
  | "rival"
  | "hostile"
  | "territorial_dispute"
  | "sanction"
  | "scientific_coop";

export interface KingdomRelationRecord {
  id: string; // KREL-000001
  workspaceId: string;
  kingdomAId: string;
  kingdomBId: string;
  kingdomBName: string;
  relationType: KingdomRelationKind;
  intensity: number; // -100..100
  startDate: string;
  endDate: string;
  originCause: string;
  historyChanges: Array<{ period: string; note: string }>;
  relatedEventId?: string | null;
  currentStatus: "active" | "suspended" | "ended" | "secret";
  accessLevel: ContentAccessLevel;
  verificationStatus: VerificationStatus;
}

export interface KingdomTreatyRecord {
  id: string; // TRT-000001
  kingdomId: string;
  title: string;
  signedDate: string;
  partnerNames: string[];
  termsSummary: string;
  status: "active" | "expired" | "broken";
}

/* ==================== 13 & 17. HISTORY & TIMELINE ==================== */
export type KingdomEventCategory =
  | "founding"
  | "dynasty_change"
  | "expansion"
  | "reform"
  | "war"
  | "peace_treaty"
  | "crisis"
  | "revolution"
  | "regime_change"
  | "economic_milestone"
  | "modern";

export interface KingdomEventRecord {
  id: string; // EVT-000001
  kingdomId: string;
  category: KingdomEventCategory;
  title: string;
  year: number;
  era: string;
  location: string;
  participantCharacterIds: string[];
  cause: string;
  summary: string;
  outcome: string;
  longTermImpact: string;
  accessLevel: ContentAccessLevel;
  spoilerLabel?: string;
  verificationStatus: VerificationStatus;
}

/* ==================== 14. RESOURCES & ASSETS ==================== */
export interface KingdomResourceAsset {
  id: string; // KAST-000001
  kingdomId: string;
  kind:
    | "natural"
    | "mineral"
    | "water"
    | "forest"
    | "farmland"
    | "energy"
    | "relic"
    | "national_treasure"
    | "special_building"
    | "royal_asset"
    | "heritage"
    | "magic_resource"
    | "strategic_zone";
  name: string;
  regionName: string;
  description: string;
  verificationStatus: VerificationStatus;
}

/* ==================== 15. KINGDOM STATISTICS (14 DISTINCT METRICS) ==================== */
export type KingdomStatKey =
  | "territory_scale"
  | "population_scale"
  | "economic_power"
  | "political_stability"
  | "governance_capacity"
  | "tech_level"
  | "scientific_capacity"
  | "diplomatic_influence"
  | "defense_capability"
  | "infrastructure_dev"
  | "education_quality"
  | "living_standard"
  | "cultural_strength"
  | "magic_potential";

export interface KingdomStatisticItem {
  key: KingdomStatKey;
  label: string;
  score: number; // 0-100
  tierLabel: string;
  rawValue?: string;
  evaluatedAt: string;
  sourceNote: string;
}

/* ==================== 16. ACHIEVEMENTS & LEGACY ==================== */
export interface KingdomAchievementRecord {
  id: string; // KACH-000001
  kingdomId: string;
  category: "historical" | "economic" | "scientific" | "cultural" | "diplomatic" | "landmark" | "legacy";
  title: string;
  dateLabel: string;
  description: string;
  verificationStatus: VerificationStatus;
}

/* ==================== GALLERY & SOURCES (GROUP 2 & 18) ==================== */
export interface KingdomImageRecord {
  id: string; // KIMG-000001
  kingdomId: string;
  category: "flag" | "coat_of_arms" | "capital" | "architecture" | "historical_era" | "map" | "gallery";
  url: string;
  thumbUrl: string;
  caption: string;
  sourceCredit: string;
  sortOrder: number;
}

export interface KingdomSourceRecord {
  id: string; // KSRC-000001
  kingdomId: string;
  title: string;
  author: string;
  url: string;
  updatedAt: string;
  editorName: string;
  verificationStatus: VerificationStatus;
  editorialNote: string;
}

/* ==================== DYNAMIC CUSTOM FIELDS (13 TYPES) ==================== */
export type KingdomCustomFieldType =
  | "text"
  | "long_text"
  | "number"
  | "decimal"
  | "date"
  | "boolean"
  | "select"
  | "multi_select"
  | "url"
  | "image"
  | "file"
  | "relation"
  | "json";

export interface KingdomCustomFieldDef {
  id: string; // KFLD-000001
  workspaceId: string;
  key: string;
  label: string;
  dataType: KingdomCustomFieldType;
  groupName: string;
  required: boolean;
  defaultValue: string;
  options: string[];
  visibleTo: UserRole[];
  editableBy: UserRole[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface KingdomCustomFieldValue {
  id: string;
  kingdomId: string;
  fieldId: string;
  value: unknown;
  updatedAt: string;
}

/* ==================== HYDRATED DOSSIER, PROJECTION & VERSIONS ==================== */
export interface KingdomHydratedDossier {
  kingdom: KingdomRecord;
  symbols: KingdomSymbols;
  territory: KingdomTerritory;
  regions: KingdomRegionRecord[];
  populationHistory: KingdomPopulationYear[];
  government: KingdomGovernment;
  rulers: Array<
    KingdomRulerLink & {
      linkedCharacter?: { id: string; fullName: string; symbol: string; portraitUrl: string; titles: string[] } | null;
    }
  >;
  economyHistory: KingdomEconomyYear[];
  military: KingdomMilitaryOverview;
  technology: KingdomTechnologyMagic;
  culture: KingdomCultureEducation;
  infrastructure: KingdomInfrastructure;
  resources: KingdomResourceAsset[];
  statistics: KingdomStatisticItem[];
  relations: KingdomRelationRecord[];
  treaties: KingdomTreatyRecord[];
  events: KingdomEventRecord[];
  achievements: KingdomAchievementRecord[];
  images: KingdomImageRecord[];
  sources: KingdomSourceRecord[];
  customFields: Array<{ definition: KingdomCustomFieldDef; value: unknown }>;
}

export interface KingdomListProjection {
  id: string;
  workspaceId: string;
  officialName: string;
  commonName: string;
  ancientName: string;
  countryCode: string;
  continent: string;
  bloc: string;
  polityType: KingdomPolityType;
  governmentType: string;
  currentStatus: KingdomRecord["currentStatus"];
  developmentLevel: KingdomRecord["developmentLevel"];
  workflowStatus: KingdomWorkflowStatus;
  capitalName: string;
  population: number;
  areaKm2: number;
  gdpValue: number;
  currencyCode: string;
  emblemConfig?: EntityEmblemConfig;
  accentColor: string;
  tags: string[];
  linkedWikiEntryId?: string | null;
  linkedAtlasNationId?: string | null;
  updatedAt: string;
}

export interface KingdomVersionRecord {
  id: string;
  kingdomId: string;
  versionNumber: number;
  editorName: string;
  changeNote: string;
  createdAt: string;
  snapshot: KingdomHydratedDossier;
}
