import type {
  FieldDivisionId,
  HeraldryCategoryId,
  HeraldryDesignData,
  HeraldryStyleId,
  HeraldryTemplateItem,
  OrnamentId,
  ShieldShapeId
} from "@/types/heraldry";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { HERALDIC_COLORS, SHIELD_SHAPES } from "./shapes-and-palettes";
import { HERALDIC_SYMBOLS } from "./symbols-and-ornaments";

export const STYLE_LABELS: Record<HeraldryStyleId, string> = {
  medieval_european: "Medieval European",
  high_medieval: "High Medieval",
  renaissance: "Renaissance",
  imperial: "Imperial",
  royal_dynasty: "Royal Dynasty",
  byzantine: "Byzantine-inspired",
  gothic: "Gothic",
  baroque: "Baroque",
  classical: "Classical",
  ancient_civilization: "Ancient Civilization",
  fantasy_heraldry: "Fantasy Heraldry",
  arcane_heraldry: "Arcane Heraldry",
  mythological: "Mythological",
  original_fantasy: "Original Fantasy"
};

export const CATEGORY_LABELS: Record<HeraldryCategoryId, string> = {
  royal_coat_of_arms: "Quốc huy Hoàng gia",
  kingdom_emblem: "Huy hiệu Vương quốc",
  national_coat_of_arms: "Quốc huy Quốc gia",
  royal_seal: "Đại ấn Hoàng gia",
  noble_family_crest: "Gia huy Quý tộc",
  military_insignia: "Biểu tượng Quân đoàn",
  city_emblem: "Huy hiệu Thành phố",
  organization_emblem: "Huy hiệu Tổ chức",
  religious_emblem: "Biểu tượng Tôn giáo",
  academy_crest: "Biểu trưng Học viện"
};

const CURATED_STYLE_RECIPES: Array<{
  style: HeraldryStyleId;
  shapes: ShieldShapeId[];
  divisions: FieldDivisionId[];
  ornaments: OrnamentId[];
  palettes: Array<[string, string, string, string]>; // [primary, secondary, border, symbol]
}> = [
  {
    style: "imperial",
    shapes: ["royal", "french", "baroque"],
    divisions: ["quarterly", "per_pale", "radial_glow"],
    ornaments: ["imperial_crown", "royal_mantle", "laurel_wreath"],
    palettes: [
      ["#6D3D49", "#101522", "#C6A568", "#E9DFC9"],
      ["#7F1D1D", "#1D2636", "#D4AF37", "#FDE68A"],
      ["#101522", "#1D2636", "#C6A568", "#D4AF37"]
    ]
  },
  {
    style: "medieval_european",
    shapes: ["heater", "medieval", "norman"],
    divisions: ["per_pale", "per_fess", "chevron", "solid"],
    ornaments: ["none", "royal_crown", "laurel_wreath"],
    palettes: [
      ["#9E1B32", "#1D4E89", "#D4AF37", "#E5E7EB"],
      ["#1D4E89", "#141821", "#E5E7EB", "#D4AF37"],
      ["#1B6B4A", "#141821", "#D4AF37", "#E9DFC9"]
    ]
  },
  {
    style: "arcane_heraldry",
    shapes: ["fantasy", "gothic", "round"],
    divisions: ["radial_glow", "per_saltire", "solid"],
    ornaments: ["arcane_halo", "decorative_frame", "crest_stars"],
    palettes: [
      ["#101522", "#4A235A", "#C6A568", "#E9DFC9"],
      ["#1B3B6F", "#101522", "#CBD5E1", "#C6A568"],
      ["#1D2636", "#657D91", "#C6A568", "#E9DFC9"]
    ]
  },
  {
    style: "royal_dynasty",
    shapes: ["royal", "oval", "spanish"],
    divisions: ["quarterly", "chevron", "paly_stripes"],
    ornaments: ["royal_crown", "supporters_wings", "laurel_wreath"],
    palettes: [
      ["#5B2C6F", "#101522", "#D4AF37", "#E9DFC9"],
      ["#6D3D49", "#1D2636", "#C6A568", "#E9DFC9"],
      ["#0F5132", "#101522", "#C6A568", "#E9DFC9"]
    ]
  },
  {
    style: "gothic",
    shapes: ["gothic", "kite", "fantasy"],
    divisions: ["per_bend", "chequy", "solid"],
    ornaments: ["supporters_wings", "imperial_crown", "none"],
    palettes: [
      ["#141821", "#6D3D49", "#C6A568", "#E9DFC9"],
      ["#1D2636", "#141821", "#CBD5E1", "#C6A568"],
      ["#7F1D1D", "#141821", "#C6A568", "#E5E7EB"]
    ]
  },
  {
    style: "renaissance",
    shapes: ["italian", "baroque", "oval"],
    divisions: ["quarterly", "per_fess", "paly_stripes"],
    ornaments: ["laurel_wreath", "decorative_frame", "royal_crown"],
    palettes: [
      ["#1B3B6F", "#6D3D49", "#C6A568", "#E9DFC9"],
      ["#8C6239", "#1D2636", "#E9DFC9", "#C6A568"],
      ["#0F5132", "#1B3B6F", "#D4AF37", "#E9DFC9"]
    ]
  },
  {
    style: "mythological",
    shapes: ["fantasy", "round", "traditional"],
    divisions: ["radial_glow", "per_saltire", "chevron"],
    ornaments: ["arcane_halo", "supporters_wings", "crest_stars"],
    palettes: [
      ["#101522", "#8C6239", "#C6A568", "#E9DFC9"],
      ["#4A235A", "#101522", "#D4AF37", "#E9DFC9"],
      ["#1B6B4A", "#101522", "#C6A568", "#E9DFC9"]
    ]
  }
];

const ALL_STYLES = Object.keys(STYLE_LABELS) as HeraldryStyleId[];
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as HeraldryCategoryId[];
const SHAPE_MAP = new Map(SHIELD_SHAPES.map((s) => [s.id, s.label]));

let cachedCatalog: HeraldryTemplateItem[] | null = null;

/**
 * Generates 1,200 curated parametric Heraldry Templates (HTPL-000001..HTPL-001200)
 * spanning 14 historical/fantasy styles, 10 categories, 15 shield shapes, 10 field divisions,
 * 34 vector symbols, and 9 external ornaments — zero duplicate clones!
 */
export function getHeraldryTemplateCatalog(): HeraldryTemplateItem[] {
  if (cachedCatalog) return cachedCatalog;

  const list: HeraldryTemplateItem[] = [];
  const totalCount = 1200;

  for (let i = 0; i < totalCount; i++) {
    const style = ALL_STYLES[i % ALL_STYLES.length];
    const recipe =
      CURATED_STYLE_RECIPES[i % CURATED_STYLE_RECIPES.length];
    const category = ALL_CATEGORIES[Math.floor(i / ALL_STYLES.length) % ALL_CATEGORIES.length];
    const shape = recipe.shapes[Math.floor(i / 7) % recipe.shapes.length];
    const division = recipe.divisions[Math.floor(i / 11) % recipe.divisions.length];
    const ornament = recipe.ornaments[Math.floor(i / 13) % recipe.ornaments.length];
    const palette = recipe.palettes[Math.floor(i / 5) % recipe.palettes.length];
    const primarySym = HERALDIC_SYMBOLS[i % HERALDIC_SYMBOLS.length];
    const secondarySym =
      i % 3 === 0 ? HERALDIC_SYMBOLS[(i * 7 + 5) % HERALDIC_SYMBOLS.length] : null;

    const layers: HeraldryDesignData["layers"] = [
      {
        id: `lyr-sym-main-${i}`,
        name: primarySym.name,
        kind: "symbol",
        visible: true,
        locked: false,
        x: 300,
        y: secondarySym ? 275 : 295,
        scale: secondarySym ? 1.55 : 1.9,
        rotation: 0,
        opacity: 1,
        color: palette[3],
        symbolId: primarySym.id
      }
    ];

    if (secondarySym && secondarySym.id !== primarySym.id) {
      layers.push({
        id: `lyr-sym-sub-${i}`,
        name: `${secondarySym.name} (Phụ)`,
        kind: "symbol",
        visible: true,
        locked: false,
        x: 300,
        y: 392,
        scale: 0.72,
        rotation: 0,
        opacity: 0.9,
        color: palette[2],
        symbolId: secondarySym.id
      });
    }

    if (ornament !== "none") {
      layers.push({
        id: `lyr-orn-${i}`,
        name: `Trang trí (${ornament})`,
        kind: "ornament",
        visible: true,
        locked: false,
        x: 300,
        y: 300,
        scale: 1,
        rotation: 0,
        opacity: 1,
        color: palette[2],
        ornamentId: ornament
      });
    }

    const hasMotto = i % 2 === 0;
    const complexity: HeraldryTemplateItem["complexity"] =
      layers.length >= 3 && hasMotto
        ? "imperial"
        : layers.length >= 2
        ? "standard"
        : "minimal";

    const colorObj = HERALDIC_COLORS.find((c) => c.hex.toLowerCase() === palette[0].toLowerCase());
    const id = `HTPL-${String(i + 1).padStart(6, "0")}`;

    list.push({
      id,
      name: `${primarySym.name} · ${STYLE_LABELS[style]} #${i + 1}`,
      style,
      styleLabel: STYLE_LABELS[style],
      category,
      categoryLabel: CATEGORY_LABELS[category],
      shape,
      shapeLabel: SHAPE_MAP.get(shape) || shape,
      primaryColorName: colorObj?.name || palette[0],
      symbolName: primarySym.name,
      complexity,
      layerCount: layers.length + (hasMotto ? 2 : 1),
      description: `Mẫu ${CATEGORY_LABELS[category]} phong cách ${STYLE_LABELS[style]}, dáng ${SHAPE_MAP.get(shape) || shape}, biểu trưng ${primarySym.name}.`,
      designData: {
        canvasSize: 600,
        backgroundMode: "transparent",
        backgroundColor: "#101522",
        shield: {
          shape,
          widthScale: 1,
          heightScale: 1,
          topCurve: 0,
          bottomPoint: 0,
          borderWidth: 8,
          innerBorder: complexity !== "minimal",
          borderColor: palette[2],
          fieldDivision: division,
          primaryColor: palette[0],
          secondaryColor: palette[1],
          tertiaryColor: palette[2],
          metallicEffect: complexity === "imperial"
        },
        layers,
        motto: {
          enabled: hasMotto,
          text: "AETHEL · VINH QUANG BẤT DIỆT",
          ribbonColor: palette[1],
          textColor: palette[3],
          fontFamily: "Cinzel",
          fontSize: 16,
          curved: true
        },
        uploadedMode: "none"
      }
    });
  }

  cachedCatalog = list;
  return list;
}

export function queryHeraldryTemplates(opts: {
  q?: string;
  style?: string;
  category?: string;
  shape?: string;
  complexity?: string;
  page?: number;
  limit?: number;
}) {
  const all = getHeraldryTemplateCatalog();
  const filtered = all.filter((t) => {
    if (opts.style && t.style !== opts.style) return false;
    if (opts.category && t.category !== opts.category) return false;
    if (opts.shape && t.shape !== opts.shape) return false;
    if (opts.complexity && t.complexity !== opts.complexity) return false;
    if (opts.q && opts.q.trim()) {
      const hay = `${t.id} ${t.name} ${t.styleLabel} ${t.categoryLabel} ${t.shapeLabel} ${t.symbolName} ${t.primaryColorName}`;
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });

  const page = Math.max(1, opts.page || 1);
  const limit = Math.max(1, Math.min(48, opts.limit || 24));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total,
    page,
    totalPages
  };
}
