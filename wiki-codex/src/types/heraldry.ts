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
  | "radial_glow";

export type OrnamentId =
  | "none"
  | "imperial_crown"
  | "royal_crown"
  | "laurel_wreath"
  | "royal_mantle"
  | "decorative_frame"
  | "supporters_wings"
  | "arcane_halo"
  | "crest_stars";

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
}

export type HeraldryLayerKind = "symbol" | "uploaded_image" | "text" | "ornament";

export interface HeraldryLayer {
  id: string;
  name: string;
  kind: HeraldryLayerKind;
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
  createdAt: string;
  updatedAt: string;
}

export interface HeraldryVersionRecord {
  id: string;
  designId: string;
  versionNumber: number;
  editorName: string;
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
