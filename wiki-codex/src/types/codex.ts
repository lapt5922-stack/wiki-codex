export type UserRole = "admin" | "editor" | "guest";

export type EntryStatus = "draft" | "review" | "published" | "archived";
export type EntryVisibility = "public" | "private";
export type CanonStatus = "canon" | "apocrypha" | "hypothesis" | "unverified";

export type EntryTabKey =
  | "overview"
  | "power"
  | "holdings"
  | "roster"
  | "details"
  | "sections"
  | "eras"
  | "relations"
  | "timeline"
  | "sources"
  | "gallery";

export type CustomFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "entity_ref"
  | "table"
  | "private_note";

export type FantasyThemeId =
  | "astral-grimoire"
  | "velvet-eclipse"
  | "imperial-amber"
  | "sylvan-emerald"
  | "gilded-parchment"
  | "celestial-ivory"
  | "astral-scifi"
  | "jade-ink";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sigil: string;
  accentColor: string;
  isPublic: boolean;
  defaultLanguageId?: string;
  publicTagline?: string;
  publicBannerUrl?: string;
  defaultTheme?: FantasyThemeId;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sigil: string;
  color: string;
  sortOrder: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  directCount: number;
  totalUniqueCount: number;
  depth: number;
  matchesFilter?: boolean;
  hasMatchingDescendant?: boolean;
}

export interface CustomFieldDef {
  key: string;
  label: string;
  type: CustomFieldType;
  unit?: string;
  options?: string[];
  columns?: string[];
  showInInfobox?: boolean;
  placeholder?: string;
}

export type EntityCardStyle =
  | "character"
  | "kingdom"
  | "language"
  | "artifact"
  | "creature"
  | "city"
  | "landmark"
  | "religion"
  | "system"
  | "event"
  | "organization"
  | "house"
  | "lore";

export type DynamicPropertyKind =
  | "text"
  | "textarea"
  | "number"
  | "progress"
  | "tags"
  | "date"
  | "rating"
  | "entity_ref"
  | "url"
  | "private_note";

export interface EntryCustomProperty {
  id: string;
  label: string;
  group: string;
  kind: DynamicPropertyKind;
  value: string;
  unit?: string;
  color?: string;
  showInInfobox: boolean;
  order: number;
}

export interface PropertyBlueprint {
  id: string;
  workspaceId: string;
  name: string;
  entryTypeId?: string;
  sigil: string;
  fields: Array<Omit<EntryCustomProperty, "id">>;
  createdAt: string;
}

export interface EntryType {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sigil: string;
  color: string;
  /** V5.0: Whether this entity type naturally has RPG-style Power Level & Attributes */
  supportsPower?: boolean;
  /** V5.0: Whether this entity type naturally has alternate forms/variants */
  supportsVariants?: boolean;
  /** V5.0: Default attribute preset family */
  powerPresetKind?: "character" | "kingdom" | "organization" | "artifact" | "creature";
  /** V5.0: Collectible Wiki Card visual archetype */
  cardStyle?: EntityCardStyle;
  enabledTabs: EntryTabKey[];
  fieldSchema: CustomFieldDef[];
}

export interface TableFieldValue {
  headers: string[];
  rows: string[][];
}

export type CustomFieldValue =
  | string
  | number
  | string[]
  | TableFieldValue
  | null
  | undefined;

export interface GalleryItem {
  id: string;
  thumbUrl: string;
  fullUrl: string;
  caption: string;
  alt: string;
  dominantColor?: string;
}

export interface EditorialNote {
  id: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
}

export interface EntityEpigraph {
  quote: string;
  author: string;
  source?: string;
}

export interface EntityCustomSection {
  id: string;
  title: string;
  sigil: string;
  content: string;
}

export interface EntityEraSnapshot {
  id: string;
  eraLabel: string;
  yearLabel: string;
  summary: string;
  keyChanges: string;
}

export interface ProportionalBarItem {
  id: string;
  groupTitle: string;
  label: string;
  percentage: number;
  color: string;
}

/* ==================== V3.0 POWER LEVEL & UNBOUNDED RPG ATTRIBUTES ==================== */

export interface EntryAttribute {
  id: string;
  key: string;
  label: string;
  value: number; // Unbounded!
  sliderMax: number;
  color: string;
  sigil: string;
}

export interface PowerHistoryPoint {
  id: string;
  eraLabel: string;
  yearLabel: string;
  powerLevel: number;
}

export interface EntityAbility {
  id: string;
  name: string;
  category: string;
  rank: string;
  sigil: string;
  description: string;
}

export interface EntityFeat {
  id: string;
  title: string;
  yearLabel: string;
  description: string;
}

export interface Entry {
  id: string;
  workspaceId: string;
  entryTypeId: string;
  categoryId: string | null;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  icon: string;
  sigil: string;
  coverImage: string;
  thumbImage: string;
  status: EntryStatus;
  visibility: EntryVisibility;
  canonStatus?: CanonStatus;
  aliases?: string[];
  epigraph?: EntityEpigraph;
  customSections?: EntityCustomSection[];
  eraSnapshots?: EntityEraSnapshot[];
  breakdownBars?: ProportionalBarItem[];
  // V3.0 Unbounded Power Level & Attributes (pure encyclopedic profile, non-game)
  powerLevel?: number;
  powerInfinite?: boolean;
  powerTierOverride?: string;
  powerSourceLabel?: string;
  attributes?: EntryAttribute[];
  powerHistory?: PowerHistoryPoint[];
  abilities?: EntityAbility[];
  feats?: EntityFeat[];
  // V4.0 Multi-Form / Alternate Canon Variants
  variants?: EntryVariant[];
  // V5.0 Per-Entry Dynamic Properties & Tab Overrides
  extraFields?: EntryCustomProperty[];
  hiddenSchemaKeys?: string[];
  tabOverrides?: {
    enabled?: EntryTabKey[];
    disabled?: EntryTabKey[];
  };
  // V6.0 Rich Dossier Modules (Roster, Laws, Statecraft, Rumors & Secrets)
  roster?: EntryRosterMember[];
  lawsAndCustoms?: EntryCustomLaw[];
  forceUnits?: EntryForceUnit[];
  resourceItems?: EntryResourceItem[];
  rumorsAndSecrets?: EntryRumorSecret[];
  featured?: boolean;
  spoilerGate: boolean;
  spoilerLabel: string;
  tags: string[];
  contentMarkdown: string;
  customFields: Record<string, CustomFieldValue>;
  sourcesMarkdown: string;
  privateNotes: string;
  gallery: GalleryItem[];
  editorialNotes: EditorialNote[];
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EntryCardProjection {
  id: string;
  workspaceId: string;
  entryTypeId: string;
  categoryId: string | null;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  icon: string;
  sigil: string;
  thumbImage: string;
  status: EntryStatus;
  visibility: EntryVisibility;
  canonStatus?: CanonStatus;
  aliases?: string[];
  powerLevel?: number;
  powerInfinite?: boolean;
  powerTierOverride?: string;
  attributes?: EntryAttribute[];
  // V5.0 Collectible Card Highlights & Entity-Aware Metadata
  supportsPower?: boolean;
  cardStyle?: EntityCardStyle;
  cardHighlights?: Array<{ label: string; value: string; color?: string }>;
  extraFieldCount?: number;
  variantCount?: number;
  featured?: boolean;
  spoilerGate: boolean;
  tags: string[];
  updatedAt: string;
  deletedAt: string | null;
  backlinkCount: number;
  wordCount: number;
}

export interface EntryRevision {
  id: string;
  entryId: string;
  versionNumber: number;
  changeSummary: string;
  editorName: string;
  createdAt: string;
  snapshot: {
    title: string;
    subtitle: string;
    summary: string;
    categoryId: string | null;
    status: EntryStatus;
    visibility: EntryVisibility;
    canonStatus?: CanonStatus;
    aliases?: string[];
    epigraph?: EntityEpigraph;
    customSections?: EntityCustomSection[];
    eraSnapshots?: EntityEraSnapshot[];
    breakdownBars?: ProportionalBarItem[];
    powerLevel?: number;
    powerInfinite?: boolean;
    powerTierOverride?: string;
    powerSourceLabel?: string;
    attributes?: EntryAttribute[];
    powerHistory?: PowerHistoryPoint[];
    abilities?: EntityAbility[];
    feats?: EntityFeat[];
    variants?: EntryVariant[];
    extraFields?: EntryCustomProperty[];
    hiddenSchemaKeys?: string[];
    tabOverrides?: {
      enabled?: EntryTabKey[];
      disabled?: EntryTabKey[];
    };
    roster?: EntryRosterMember[];
    lawsAndCustoms?: EntryCustomLaw[];
    forceUnits?: EntryForceUnit[];
    resourceItems?: EntryResourceItem[];
    rumorsAndSecrets?: EntryRumorSecret[];
    tags: string[];
    contentMarkdown: string;
    customFields: Record<string, CustomFieldValue>;
    sourcesMarkdown: string;
    privateNotes: string;
    gallery: GalleryItem[];
  };
}

export interface EntryRelation {
  id: string;
  workspaceId: string;
  sourceEntryId: string;
  targetEntryId: string;
  relationType: string;
  note: string;
  createdAt: string;
}

export interface BacklinkItem {
  sourceEntryId: string;
  sourceSlug: string;
  sourceTitle: string;
  sourceSigil: string;
  contextSnippet: string;
}

export interface UnlinkedMention {
  targetEntryId: string;
  targetTitle: string;
  targetSlug: string;
  matchedText: string;
}

export interface TimelineEvent {
  id: string;
  workspaceId: string;
  title: string;
  dateLabel: string;
  sortYear: number;
  calendarMonthIndex?: number;
  calendarDay?: number;
  era: string;
  icon: string;
  sigil: string;
  color: string;
  summary: string;
  entryIds: string[];
  createdAt: string;
}

export interface AtlasTravelMode {
  id: string;
  name: string;
  kmPerDay: number;
  icon?: string;
}

export interface AtlasMap {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  imageUrl: string;
  themePreset?: "aethelgard" | "architecture" | "custom";
  scaleKmPerWidth?: number;
  travelModes?: AtlasTravelMode[];
  width: number;
  height: number;
  createdAt: string;
}

export interface AtlasPin {
  id: string;
  mapId: string;
  workspaceId: string;
  label: string;
  description: string;
  xPercent: number;
  yPercent: number;
  color: string;
  icon: string;
  sigil: string;
  layer?: string;
  entryId: string | null;
}

export interface AtlasRoute {
  id: string;
  mapId: string;
  workspaceId: string;
  name: string;
  description: string;
  color: string;
  dashed: boolean;
  points: Array<{ xPercent: number; yPercent: number }>;
}

/* ==================== V3.0 OMNILINGUAL CONLANG & ALPHABET ==================== */

export interface ConlangLetter {
  latin: string;
  glyph: string;
  letterName: string;
  phonetic: string;
  meaning: string;
}

export type ConlangPhonologyPreset =
  | "aethelian"
  | "celestial"
  | "nordic"
  | "solar"
  | "sylvan"
  | "void"
  | "custom";

export interface ConlangWord {
  id: string;
  vietnamese: string;
  romanized: string;
  runic: string;
  partOfSpeech: string;
  pronunciation?: string;
  note: string;
}

export interface ConlangLanguage {
  id: string;
  workspaceId: string;
  name: string;
  nativeName: string;
  description: string;
  sigil: string;
  accentColor: string;
  scriptStyle: "runic" | "celestial" | "elder" | "frost" | "sylvan" | "void";
  phonologyPreset?: ConlangPhonologyPreset;
  customPrefixes?: string[];
  customSuffixes?: string[];
  alphabet?: ConlangLetter[];
  isPrimary?: boolean;
  lexicon: ConlangWord[];
  createdAt: string;
}

export interface CodexTemplate {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  sigil: string;
  entryTypeId: string;
  defaultTags: string[];
  contentMarkdown: string;
  customSections: EntityCustomSection[];
  createdAt: string;
}

export interface LoreboardNode {
  id: string;
  kind: "entry" | "note" | "group";
  title: string;
  content: string;
  entryId?: string;
  x: number;
  y: number;
  width: number;
  color: string;
  sigil: string;
}

export interface LoreboardEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string;
  color: string;
}

export interface Loreboard {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  nodes: LoreboardNode[];
  edges: LoreboardEdge[];
  updatedAt: string;
}

export interface CalendarMonthDef {
  name: string;
  days: number;
  season: string;
  sigil: string;
}

export interface CalendarMoonDef {
  id: string;
  name: string;
  cycleDays: number;
  offsetDays: number;
  color: string;
}

export interface CalendarHoliday {
  id: string;
  monthIndex: number;
  day: number;
  name: string;
  description: string;
  sigil: string;
}

export interface WorldCalendar {
  id: string;
  workspaceId: string;
  name: string;
  eraName: string;
  currentYear: number;
  moonCycleDays: number;
  weekdays: string[];
  months: CalendarMonthDef[];
  moons?: CalendarMoonDef[];
  holidays?: CalendarHoliday[];
}

export interface MediaAsset {
  id: string;
  workspaceId: string;
  title: string;
  thumbUrl: string;
  fullUrl: string;
  tags: string[];
  caption: string;
  source: "upload" | "external";
  createdAt: string;
}

export interface GlossaryTerm {
  id: string;
  workspaceId: string;
  term: string;
  shortDef: string;
  category: string;
  sigil: string;
  linkedEntryId?: string | null;
}

export interface CuratedCollection {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  sigil: string;
  color: string;
  isPublic: boolean;
  entryIds: string[];
  createdAt: string;
}

export interface EditorialTask {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  stage: "idea" | "writing" | "review" | "done";
  priority: "low" | "medium" | "high";
  linkedEntryId?: string | null;
  createdAt: string;
}

export interface ActivityLogItem {
  id: string;
  workspaceId: string;
  actor: string;
  action: string;
  targetTitle: string;
  targetType: string;
  createdAt: string;
}

/* ==================== V3.0 WORLD UNITS & SAVED VIEWS ==================== */

export interface WorldUnit {
  id: string;
  workspaceId: string;
  category: "currency" | "length" | "weight" | "time";
  name: string;
  symbol: string;
  ratioToBase: number;
  note: string;
}

export interface SavedView {
  id: string;
  workspaceId: string;
  name: string;
  sigil: string;
  filters: {
    query?: string;
    categoryId?: string | null;
    entryTypeId?: string;
    canonStatus?: string;
    minPower?: number | null;
    maxPower?: number | null;
    sortBy?: "updatedAt" | "title" | "status" | "powerLevel";
  };
}

export interface PublishTarget {
  id: string;
  name: string;
  provider: "vercel" | "netlify" | "cloudflare" | "render" | "github" | "custom";
  webhookUrl: string;
  publicBaseUrl: string;
  enabled: boolean;
  createdAt: string;
}

export interface PublishSnapshot {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  version: number;
  publishedBy: string;
  publicEntryCount: number;
  webhookTriggered: boolean;
  webhookStatus: string;
  publicUrl: string;
  note: string;
  createdAt: string;
}

export interface WikiHealthReport {
  totalEntries: number;
  publishedEntries: number;
  draftEntries: number;
  totalWords: number;
  totalImages: number;
  totalLinks: number;
  orphanEntries: Array<{ id: string; title: string; slug: string; sigil: string }>;
  brokenLinks: Array<{
    sourceEntryId: string;
    sourceTitle: string;
    missingTitle: string;
  }>;
  stubEntries: Array<{ id: string; title: string; slug: string; wordCount: number }>;
}

export interface PaginatedEntriesResult {
  items: EntryCardProjection[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  nextCursor: string | null;
  hasMore: boolean;
}

/* ==================== V4.0 DEEP WORLDBUILDING & PUBLISHING ==================== */

export interface EntryVariant {
  id: string;
  name: string;
  badge: string;
  eraLabel: string;
  avatarUrl: string;
  summary: string;
  powerLevel: number;
  powerInfinite?: boolean;
  attributes: EntryAttribute[];
  isDefault?: boolean;
}

export interface HierarchyNode {
  id: string;
  label: string;
  subtitle: string;
  sigil: string;
  color: string;
  parentId: string | null;
  relationLabel: string;
  entryId?: string | null;
}

export interface HierarchyChart {
  id: string;
  workspaceId: string;
  name: string;
  kind: "genealogy" | "organization" | "evolution";
  description: string;
  nodes: HierarchyNode[];
  updatedAt: string;
}

export interface SystemTier {
  id: string;
  rank: number;
  name: string;
  requirement: string;
  powerHint: string;
  color: string;
}

export type InteractionEffect = "strong" | "weak" | "synergy" | "nullify" | "neutral";

export interface WorldSystemRule {
  id: string;
  workspaceId: string;
  name: string;
  category: "magic" | "technology" | "cultivation" | "cosmology";
  energySource: string;
  costAndLimits: string;
  description: string;
  elements: string[];
  /** Key format: `${sourceElement}::${targetElement}` */
  matrix: Record<string, InteractionEffect>;
  tiers: SystemTier[];
  updatedAt: string;
}

export type TaxonomyRank =
  | "Giới"
  | "Ngành"
  | "Lớp"
  | "Bộ"
  | "Họ"
  | "Chi"
  | "Loài";

export interface TaxonomyNode {
  id: string;
  workspaceId: string;
  parentId: string | null;
  rank: TaxonomyRank;
  name: string;
  scientificName: string;
  biome: string;
  rarity: "Phổ biến" | "Ít gặp" | "Hiếm" | "Huyền thoại" | "Tuyệt chủng";
  dietOrRole: string;
  description: string;
  sigil: string;
  linkedEntryId?: string | null;
}

export interface TradeCommodity {
  id: string;
  workspaceId: string;
  name: string;
  category: "Lương thực" | "Vũ khí" | "Dược liệu" | "Khoáng sản" | "Ma pháp" | "Công nghệ" | "Xa xỉ phẩm";
  basePrice: number;
  unitLabel: string;
  rarity: "Dồi dào" | "Ổn định" | "Khan hiếm" | "Độc quyền" | "Vô giá";
  originLabel: string;
  originEntryId?: string | null;
  tradeRouteNote: string;
}

export interface ChronicleChapter {
  id: string;
  workspaceId: string;
  bookTitle: string;
  chapterNumber: number;
  title: string;
  eraLabel: string;
  summary: string;
  contentMarkdown: string;
  published: boolean;
  updatedAt: string;
}

export interface CodexAnalyticsSummary {
  totalEntries: number;
  publishedEntries: number;
  draftEntries: number;
  totalWords: number;
  avgWordsPerEntry: number;
  completenessPercent: number;
  totalRelations: number;
  orphanEntries: Array<{ id: string; title: string; slug: string; sigil: string }>;
  brokenLinks: Array<{ sourceEntryId: string; sourceTitle: string; missingTitle: string }>;
  byType: Array<{ typeId: string; name: string; color: string; count: number }>;
  byCanon: Array<{ status: string; count: number }>;
  byPowerTier: Array<{ tier: string; color: string; count: number }>;
}

/* ==================== V6.0 BIDIRECTIONAL HOLDINGS & RICH DOSSIER ==================== */

export type HoldingKind =
  | "territory"
  | "city"
  | "landmark"
  | "fortress"
  | "headquarters"
  | "branch"
  | "vassal"
  | "artifact"
  | "fleet";

export type HoldingStatus = "active" | "contested" | "former" | "ruined";

export interface EntityHolding {
  id: string;
  workspaceId: string;
  ownerEntryId: string;
  targetEntryId: string | null;
  customName: string;
  holdingKind: HoldingKind;
  roleLabel: string;
  status: HoldingStatus;
  eraNote: string;
  summary: string;
  createdAt: string;
}

export interface HydratedHolding extends EntityHolding {
  ownerTitle: string;
  ownerSigil: string;
  ownerTypeName: string;
  targetTitle: string;
  targetSigil: string;
  targetThumb: string;
  targetTypeName: string;
  targetTypeColor: string;
}

export interface EntryRosterMember {
  id: string;
  name: string;
  entryId?: string | null;
  roleTitle: string;
  department: string;
  rankOrder: number;
  tenure: string;
  status: "active" | "former" | "deceased";
  note: string;
}

export interface EntryCustomLaw {
  id: string;
  title: string;
  category: "law" | "custom" | "taboo" | "ritual" | "doctrine";
  summary: string;
  enforcement: string;
}

export interface EntryForceUnit {
  id: string;
  name: string;
  branch: "Hải quân" | "Lục quân" | "Kỵ binh" | "Học giả / Pháp sư" | "Cận vệ" | "Thương đội";
  sizeLabel: string;
  commander: string;
  baseLocation: string;
  note: string;
}

export interface EntryResourceItem {
  id: string;
  name: string;
  abundance: "Độc quyền" | "Dồi dào" | "Ổn định" | "Khan hiếm";
  tradeRole: "Xuất khẩu chủ lực" | "Nội địa" | "Nhập khẩu";
  note: string;
}

export interface EntryRumorSecret {
  id: string;
  title: string;
  tier: "fact" | "rumor" | "secret";
  truthPercent: number;
  content: string;
  sourceLabel: string;
  gmOnly?: boolean;
}

export interface CodexDatabaseState {
  users: UserAccount[];
  workspaces: Workspace[];
  categories: Category[];
  entryTypes: EntryType[];
  entries: Entry[];
  revisions: EntryRevision[];
  relations: EntryRelation[];
  timelineEvents: TimelineEvent[];
  atlasMaps: AtlasMap[];
  atlasPins: AtlasPin[];
  atlasRoutes: AtlasRoute[];
  conlangs: ConlangLanguage[];
  templates: CodexTemplate[];
  loreboards: Loreboard[];
  calendars: WorldCalendar[];
  mediaAssets: MediaAsset[];
  glossaryTerms: GlossaryTerm[];
  collections: CuratedCollection[];
  editorialTasks: EditorialTask[];
  activityLog: ActivityLogItem[];
  worldUnits: WorldUnit[];
  savedViews: SavedView[];
  // V4.0 Collections
  hierarchyCharts: HierarchyChart[];
  systemRules: WorldSystemRule[];
  taxonomyNodes: TaxonomyNode[];
  tradeCommodities: TradeCommodity[];
  chronicleChapters: ChronicleChapter[];
  // V5.0 Reusable Property Blueprints
  propertyBlueprints: PropertyBlueprint[];
  // V6.0 Bidirectional Ownership & Holdings
  holdings: EntityHolding[];
  publishTargets: PublishTarget[];
  publishSnapshots: PublishSnapshot[];
}
