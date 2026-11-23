export type HeraldryStyleId =
  | "medieval_european"
  | "high_medieval"
  | "renaissance"
  | "imperial"
  | "royal_dynasty"
  | "byzantine"
  | "gothic"
  | "baroque"
  | "classical"
  | "ancient_civilization"
  | "fantasy_heraldry"
  | "arcane_heraldry"
  | "mythological"
  | "original_fantasy";

export type HeraldryCategoryId =
  | "royal_coat_of_arms"
  | "kingdom_emblem"
  | "national_coat_of_arms"
  | "royal_seal"
  | "noble_family_crest"
  | "military_insignia"
  | "city_emblem"
  | "organization_emblem"
  | "religious_emblem"
  | "academy_crest";

export type ShieldShapeId =
  | "traditional"
  | "medieval"
  | "norman"
  | "heater"
  | "kite"
  | "round"
  | "oval"
  | "french"
  | "spanish"
  | "italian"
  | "gothic"
  | "baroque"
  | "royal"
  | "fantasy"
  | "lozenge"
  | "scutum"
  | "hexagonal"
  | "custom";

export type FieldDivisionId =
  | "solid"
  | "per_pale"
  | "per_fess"
  | "quarterly"
  | "per_bend"
  | "per_saltire"
  | "chevron"
  | "paly_stripes"
  | "chequy"
  | "radial_glow"
  | "cross"
  | "pile"
  | "bordure"
  | "gyronny"
  | "lozengy"
  | "seme_stars"
  | "fess_band"
  | "bend_sinister";

export type OrnamentId =
  | "none"
  | "imperial_crown"
  | "royal_crown"
  | "laurel_wreath"
  | "royal_mantle"
  | "decorative_frame"
  | "supporters_wings"
  | "arcane_halo"
  | "crest_stars"
  | "knight_helmet"
  | "banner_supporters"
  | "oak_wreath"
  | "sunburst_halo"
  | "baroque_cartouche";

export type SymbolCategoryId =
  | "animals"
  | "royal"
  | "nature"
  | "arcane"
  | "civilization";

export interface HeraldryShieldConfig {
  shape: ShieldShapeId;
  widthScale: number; // 0.7 - 1.3
  heightScale: number; // 0.7 - 1.3
  topCurve: number; // -20 to 30
  bottomPoint: number; // 0 to 40
  borderWidth: number; // 0 to 16
  innerBorder: boolean;
  borderColor: string;
  fieldDivision: FieldDivisionId;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  metallicEffect: boolean;
  gradientMode?: "none" | "vertical" | "diagonal" | "radial";
  textureMode?: "none" | "parchment" | "metal_grain" | "linen";
}

export type HeraldryLayerKind = "symbol" | "uploaded_image" | "text" | "ornament";

export interface HeraldryLayer {
  id: string;
  name: string;
  kind: HeraldryLayerKind;
  groupId?: string;
  visible: boolean;
  locked: boolean;
  /** Center X in 600x600 canvas space */
  x: number;
  /** Center Y in 600x600 canvas space */
  y: number;
  scale: number;
  rotation: number;
  flipX?: boolean;
  flipY?: boolean;
  opacity: number;
  color: string;
  strokeColor?: string;
  /** For kind === "symbol" */
  symbolId?: string;
  /** For kind === "ornament" */
  ornamentId?: OrnamentId;
  /** For kind === "uploaded_image" */
  imageUrl?: string;
  clipToShield?: boolean;
  /** For kind === "text" */
  text?: string;
  fontFamily?: "Cinzel" | "Cormorant Garamond" | "Inter";
  fontSize?: number;
  letterSpacing?: number;
  curved?: boolean;
}

export interface HeraldryMottoConfig {
  enabled: boolean;
  text: string;
  ribbonColor: string;
  textColor: string;
  fontFamily: "Cinzel" | "Cormorant Garamond" | "Inter";
  fontSize: number;
  curved: boolean;
}

export interface HeraldryDesignData {
  canvasSize: number; // 600
  backgroundMode: "transparent" | "solid" | "radial";
  backgroundColor: string;
  shield: HeraldryShieldConfig;
  layers: HeraldryLayer[];
  motto: HeraldryMottoConfig;
  uploadedMode?: "none" | "use_as_image" | "edit_overlay";
  uploadedImageUrl?: string;
}

export interface HeraldryTemplateItem {
  id: string; // HTPL-000001..HTPL-001200
  name: string;
  style: HeraldryStyleId;
  styleLabel: string;
  category: HeraldryCategoryId;
  categoryLabel: string;
  shape: ShieldShapeId;
  shapeLabel: string;
  primaryColorName: string;
  symbolName: string;
  complexity: "minimal" | "standard" | "imperial";
  layerCount: number;
  description: string;
  designData: HeraldryDesignData;
}

export interface HeraldrySavedDesign {
  id: string; // HRLD-000001
  workspaceId: string;
  name: string;
  description: string;
  category: HeraldryCategoryId;
  style: HeraldryStyleId;
  mode: "template" | "custom" | "upload";
  designData: HeraldryDesignData;
  status: "draft" | "verified" | "official" | "historical";
  isOfficial: boolean;
  linkedKingdomId: string | null;
  linkedEntityId: string | null;
  eraLabel: string;
  startDate: string;
  endDate: string;
  changeReason: string;
  version: number;
  createdBy: string;
  approvedBy?: string;
  dynastyId?: string | null;
  dynastyName?: string;
  dynastyRole?:
    | "royal_house"
    | "noble_family"
    | "cadet_branch"
    | "personal_arms"
    | "heir_apparent"
    | "marriage_alliance";
  linkedCharacterId?: string | null;
  linkedEventId?: string | null;
  linkedEventTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeraldryVersionRecord {
  id: string;
  designId: string;
  versionNumber: number;
  editorName: string;
  approverName?: string;
  eraLabel?: string;
  dynastyName?: string;
  eventTitle?: string;
  changeNote: string;
  designData: HeraldryDesignData;
  createdAt: string;
}

export type HeraldryPreviewMode =
  | "standard"
  | "transparent"
  | "dark"
  | "light"
  | "royal_document"
  | "kingdom_flag"
  | "royal_banner"
  | "official_seal"
  | "profile_card"
  | "archive_card";

// ============================================================
// V2 EXPANSION TYPES — FLAGS, REGALIA, MEANINGS, ASSET PACKS
// ============================================================

export type FlagCategoryId =
  | "national_flag"
  | "royal_standard"
  | "military_banner"
  | "naval_ensign"
  | "city_flag"
  | "dynasty_banner"
  | "organization_flag"
  | "ceremonial_banner"
  | "historical_banner";

export type FlagGeometryId = "rect_3_2" | "rect_2_1" | "swallowtail" | "gonfalon_1_2";

export type FlagLayoutId =
  | "solid"
  | "horizontal_bicolor"
  | "vertical_bicolor"
  | "horizontal_tricolor"
  | "vertical_tricolor"
  | "nordic_cross"
  | "symmetric_cross"
  | "saltire"
  | "canton"
  | "chevron_hoist"
  | "quarterly"
  | "rising_sun";

export interface HeraldryFlagDesign {
  id: string; // FLAG-000001
  workspaceId: string;
  name: string;
  category: FlagCategoryId;
  geometry: FlagGeometryId;
  layout: FlagLayoutId;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  symbolId: string;
  symbolColor: string;
  symbolScale: number;
  borderTrim: boolean;
  borderColor: string;
  mottoText: string;
  linkedKingdomId: string | null;
  linkedEntityId: string | null;
  eraLabel: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FlagTemplateItem {
  id: string; // FTPL-000001..FTPL-000450
  name: string;
  category: FlagCategoryId;
  categoryLabel: string;
  geometry: FlagGeometryId;
  geometryLabel: string;
  layout: FlagLayoutId;
  layoutLabel: string;
  symbolName: string;
  config: Omit<
    HeraldryFlagDesign,
    "id" | "workspaceId" | "linkedKingdomId" | "linkedEntityId" | "createdBy" | "createdAt" | "updatedAt"
  >;
}

export type RegaliaCategoryId =
  | "crown"
  | "scepter"
  | "throne"
  | "great_seal"
  | "ceremonial_sword"
  | "royal_jewelry"
  | "coronation_mantle"
  | "heirloom"
  | "coronation_artifact";

export interface RoyalRegaliaItem {
  id: string; // REGA-000001
  workspaceId: string;
  name: string;
  category: RegaliaCategoryId;
  imageUrl: string;
  origin: string;
  history: string;
  materials: string;
  currentStatus: "active" | "archived" | "lost" | "destroyed" | "ceremonial_only";
  linkedKingdomId: string | null;
  linkedKingdomName: string;
  linkedCharacterId: string | null;
  linkedCharacterName: string;
  dynastyName: string;
  eraLabel: string;
  sourceCitation: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeraldicMeaningEntry {
  id: string; // HMEAN-000001
  workspaceId: string;
  entryType: "symbol" | "color" | "division" | "ornament";
  refId: string;
  title: string;
  civilization: string;
  iconographicMeaning: string;
  colorMeaning: string;
  culturalContext: string;
  politicalMeaning: string;
  religiousMeaning: string;
  legendAndLore: string;
  origin: string;
  sourceCitation: string;
  verificationStatus: "verified_source" | "in_world_canon" | "unverified_draft";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HeraldryCustomTemplate {
  id: string; // CTPL-000001
  workspaceId: string;
  name: string;
  collectionName: string;
  category: HeraldryCategoryId;
  style: HeraldryStyleId;
  license: string;
  description: string;
  designData: HeraldryDesignData;
  createdBy: string;
  createdAt: string;
}
