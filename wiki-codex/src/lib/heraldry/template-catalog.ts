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

const CATEGORY_CURATED_POOLS: Record<
  HeraldryCategoryId,
  {
    styles: HeraldryStyleId[];
    shapes: ShieldShapeId[];
    divisions: FieldDivisionId[];
    ornaments: OrnamentId[];
    symbolIds: string[];
    mottos: string[];
  }
> = {
  royal_coat_of_arms: {
    styles: ["imperial", "royal_dynasty", "baroque", "byzantine"],
    shapes: ["royal", "french", "baroque", "oval"],
    divisions: ["quarterly", "per_pale", "radial_glow", "bordure", "seme_stars"],
    ornaments: ["imperial_crown", "royal_mantle", "laurel_wreath", "baroque_cartouche", "sunburst_halo"],
    symbolIds: ["sym-lion", "sym-double-eagle", "sym-crown", "sym-fleur-de-lis", "sym-globus-orb", "sym-throne", "sym-scepter", "sym-phoenix"],
    mottos: ["VINH QUANG HOÀNG TRIỀU", "THIÊN MỆNH ĐẾ CHẾ", "TRƯỜNG TỒN VẠN ĐẠI"]
  },
  kingdom_emblem: {
    styles: ["medieval_european", "high_medieval", "imperial", "fantasy_heraldry"],
    shapes: ["heater", "royal", "traditional", "spanish", "gothic"],
    divisions: ["per_pale", "per_fess", "quarterly", "chevron", "cross", "fess_band"],
    ornaments: ["royal_crown", "laurel_wreath", "oak_wreath", "supporters_wings", "none"],
    symbolIds: ["sym-lion", "sym-eagle", "sym-dragon", "sym-stag", "sym-wolf", "sym-bear", "sym-sword", "sym-sun"],
    mottos: ["BẢO VỆ BỜ CÕI", "DANH DỰ & QUỐC GIA", "ĐOÀN KẾT VỮNG BỀN"]
  },
  national_coat_of_arms: {
    styles: ["classical", "renaissance", "imperial", "ancient_civilization"],
    shapes: ["spanish", "italian", "oval", "round", "scutum"],
    divisions: ["per_fess", "paly_stripes", "fess_band", "cross", "gyronny", "solid"],
    ornaments: ["laurel_wreath", "oak_wreath", "decorative_frame", "sunburst_halo", "crest_stars"],
    symbolIds: ["sym-eagle", "sym-sun", "sym-star", "sym-wheat", "sym-mountain", "sym-waves", "sym-scales", "sym-laurel"],
    mottos: ["ĐỘC LẬP · PHỒN VINH", "ÁNH SÁNG ĐẠI LỤC", "HÒA BÌNH & THỊNH VƯỢNG"]
  },
  royal_seal: {
    styles: ["byzantine", "classical", "ancient_civilization", "imperial"],
    shapes: ["round", "oval", "hexagonal"],
    divisions: ["solid", "radial_glow", "bordure", "seme_stars"],
    ornaments: ["decorative_frame", "arcane_halo", "sunburst_halo", "baroque_cartouche"],
    symbolIds: ["sym-crown", "sym-double-eagle", "sym-globus-orb", "sym-key", "sym-diadem", "sym-shield-mini", "sym-scroll"],
    mottos: ["ĐẠI ẤN HOÀNG GIA", "CHỨNG CHỈ TRIỀU ĐÌNH", "SẮC LỆNH TỐI CAO"]
  },
  noble_family_crest: {
    styles: ["royal_dynasty", "high_medieval", "renaissance", "gothic"],
    shapes: ["heater", "lozenge", "french", "italian", "baroque"],
    divisions: ["quarterly", "chevron", "per_bend", "bend_sinister", "chequy", "lozengy", "pile"],
    ornaments: ["knight_helmet", "royal_crown", "laurel_wreath", "baroque_cartouche", "none"],
    symbolIds: ["sym-stag", "sym-rose", "sym-fleur-de-lis", "sym-unicorn", "sym-falcon", "sym-boar", "sym-horse", "sym-tree"],
    mottos: ["HUYẾT THỐNG CAO QUÝ", "TRUNG NGHĨA GIA TỘC", "BẤT KHUẤT QUA CÁC THẾ HỆ"]
  },
  military_insignia: {
    styles: ["gothic", "medieval_european", "high_medieval", "fantasy_heraldry"],
    shapes: ["norman", "kite", "scutum", "gothic", "heater"],
    divisions: ["per_saltire", "cross", "pile", "per_bend", "chevron", "solid"],
    ornaments: ["knight_helmet", "banner_supporters", "supporters_wings", "none"],
    symbolIds: ["sym-crossed-swords", "sym-sword", "sym-halberd", "sym-dragon", "sym-wolf", "sym-tiger", "sym-griffin", "sym-wyvern", "sym-anchor"],
    mottos: ["BẤT CHIẾN BẤT HẠI", "LÁ CHẮN THÉP", "QUÂN ĐOÀN TIÊN PHONG"]
  },
  city_emblem: {
    styles: ["renaissance", "medieval_european", "classical", "ancient_civilization"],
    shapes: ["spanish", "italian", "traditional", "round", "heater"],
    divisions: ["per_fess", "paly_stripes", "chequy", "bordure", "fess_band"],
    ornaments: ["decorative_frame", "oak_wreath", "laurel_wreath", "none"],
    symbolIds: ["sym-city-gate", "sym-tower", "sym-anchor", "sym-waves", "sym-key", "sym-hammer", "sym-wheat", "sym-mountain"],
    mottos: ["THÀNH TRÌ PHỒN HOA", "HẢI CẢNG MUÔN PHƯƠNG", "BỀN VỮNG CÙNG NĂM THÁNG"]
  },
  organization_emblem: {
    styles: ["classical", "renaissance", "original_fantasy", "arcane_heraldry"],
    shapes: ["round", "hexagonal", "oval", "traditional"],
    divisions: ["solid", "bordure", "per_pale", "gyronny", "radial_glow"],
    ornaments: ["decorative_frame", "crest_stars", "banner_supporters", "none"],
    symbolIds: ["sym-scales", "sym-compass", "sym-gear", "sym-hammer", "sym-scroll", "sym-quill", "sym-key", "sym-hourglass"],
    mottos: ["KỶ LUẬT & ĐỒNG MINH", "CÔNG LÝ & KHÁM PHÁ", "LIÊN MINH BỀN CHẶT"]
  },
  religious_emblem: {
    styles: ["mythological", "arcane_heraldry", "byzantine", "ancient_civilization"],
    shapes: ["round", "oval", "hexagonal", "gothic", "fantasy"],
    divisions: ["radial_glow", "cross", "seme_stars", "solid", "bordure"],
    ornaments: ["sunburst_halo", "arcane_halo", "supporters_wings", "crest_stars"],
    symbolIds: ["sym-halo-cross", "sym-sun", "sym-moon", "sym-lotus", "sym-chalice", "sym-mystic-eye", "sym-flame", "sym-phoenix"],
    mottos: ["ÁNH SÁNG THÁNH ĐIỆN", "TÍN NGƯỠNG VĨNH HẰNG", "SOI ĐƯỜNG THẾ GIAN"]
  },
  academy_crest: {
    styles: ["arcane_heraldry", "renaissance", "original_fantasy", "classical"],
    shapes: ["hexagonal", "fantasy", "french", "heater", "round"],
    divisions: ["quarterly", "radial_glow", "seme_stars", "lozengy", "per_saltire"],
    ornaments: ["arcane_halo", "laurel_wreath", "crest_stars", "decorative_frame"],
    symbolIds: ["sym-book", "sym-owl", "sym-torch", "sym-magic-circle", "sym-astrolabe", "sym-rune", "sym-crystal", "sym-flask", "sym-constellation", "sym-pentacle"],
    mottos: ["TRI THỨC LÀ SỨC MẠNH", "KHAI SÁNG VŨ TRỤ", "HỌC VIỆN ĐẠI THƯ VIỆN"]
  }
};

const PALETTES: Array<[string, string, string, string]> = [
  ["#6D3D49", "#101522", "#C6A568", "#E9DFC9"],
  ["#7F1D1D", "#1D2636", "#D4AF37", "#FDE68A"],
  ["#101522", "#1D2636", "#C6A568", "#D4AF37"],
  ["#9E1B32", "#1D4E89", "#D4AF37", "#E5E7EB"],
  ["#1D4E89", "#141821", "#E5E7EB", "#D4AF37"],
  ["#1B6B4A", "#141821", "#D4AF37", "#E9DFC9"],
  ["#101522", "#4A235A", "#C6A568", "#E9DFC9"],
  ["#1B3B6F", "#101522", "#CBD5E1", "#C6A568"],
  ["#5B2C6F", "#101522", "#D4AF37", "#E9DFC9"],
  ["#0F5132", "#101522", "#C6A568", "#E9DFC9"],
  ["#141821", "#6D3D49", "#C6A568", "#E9DFC9"],
  ["#8C6239", "#1D2636", "#E9DFC9", "#C6A568"]
];

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as HeraldryCategoryId[];
const SHAPE_MAP = new Map(SHIELD_SHAPES.map((s) => [s.id, s.label]));
const SYMBOL_BY_ID = new Map(HERALDIC_SYMBOLS.map((s) => [s.id, s]));

let cachedCatalog: HeraldryTemplateItem[] | null = null;

/**
 * Generates 2,400 curated, category-tailored Heraldry Templates (HTPL-000001..HTPL-002400)
 * — exactly 240 bespoke templates per each of the 10 categories!
 * Spans 14 styles, 18 shield shapes, 18 field divisions/patterns, 66 vector symbols, and 14 ornaments.
 */
export function getHeraldryTemplateCatalog(): HeraldryTemplateItem[] {
  if (cachedCatalog) return cachedCatalog;

  const list: HeraldryTemplateItem[] = [];
  const perCategory = 240;
  let globalIdx = 0;

  for (const category of ALL_CATEGORIES) {
    const pool = CATEGORY_CURATED_POOLS[category];
    for (let k = 0; k < perCategory; k++) {
      const style = pool.styles[k % pool.styles.length];
      const shape = pool.shapes[Math.floor(k / 3) % pool.shapes.length];
      const division = pool.divisions[Math.floor(k / 5) % pool.divisions.length];
      const ornament = pool.ornaments[Math.floor(k / 7) % pool.ornaments.length];
      const palette = PALETTES[(globalIdx + Math.floor(k / 4)) % PALETTES.length];
      const primarySymId = pool.symbolIds[k % pool.symbolIds.length];
      const primarySym = SYMBOL_BY_ID.get(primarySymId) || HERALDIC_SYMBOLS[globalIdx % HERALDIC_SYMBOLS.length];
      const secondarySym =
        k % 3 === 0
          ? SYMBOL_BY_ID.get(pool.symbolIds[(k + 3) % pool.symbolIds.length]) ||
            HERALDIC_SYMBOLS[(globalIdx * 7 + 5) % HERALDIC_SYMBOLS.length]
          : null;

      const layers: HeraldryDesignData["layers"] = [
        {
          id: `lyr-sym-main-${globalIdx}`,
          name: primarySym.name,
          kind: "symbol",
          visible: true,
          locked: false,
          x: 300,
          y: secondarySym && secondarySym.id !== primarySym.id ? 270 : 295,
          scale: secondarySym && secondarySym.id !== primarySym.id ? 1.55 : 1.9,
          rotation: 0,
          opacity: 1,
          color: palette[3],
          symbolId: primarySym.id
        }
      ];

      if (secondarySym && secondarySym.id !== primarySym.id) {
        layers.push({
          id: `lyr-sym-sub-${globalIdx}`,
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
          id: `lyr-orn-${globalIdx}`,
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

      const hasMotto = k % 2 === 0;
      const complexity: HeraldryTemplateItem["complexity"] =
        layers.length >= 3 && hasMotto
          ? "imperial"
          : layers.length >= 2
          ? "standard"
          : "minimal";

      const colorObj = HERALDIC_COLORS.find((c) => c.hex.toLowerCase() === palette[0].toLowerCase());
      const id = `HTPL-${String(globalIdx + 1).padStart(6, "0")}`;

      list.push({
        id,
        name: `${primarySym.name} · ${CATEGORY_LABELS[category]} #${k + 1}`,
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
            metallicEffect: complexity === "imperial",
            gradientMode: k % 4 === 0 ? "diagonal" : "none",
            textureMode: "none"
          },
          layers,
          motto: {
            enabled: hasMotto,
            text: pool.mottos[k % pool.mottos.length],
            ribbonColor: palette[1],
            textColor: palette[3],
            fontFamily: "Cinzel",
            fontSize: 16,
            curved: true
          },
          uploadedMode: "none"
        }
      });
      globalIdx++;
    }
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
