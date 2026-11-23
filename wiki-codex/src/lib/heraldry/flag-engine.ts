import type {
  FlagCategoryId,
  FlagGeometryId,
  FlagLayoutId,
  FlagTemplateItem,
  HeraldryFlagDesign
} from "@/types/heraldry";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { HERALDIC_SYMBOLS } from "./symbols-and-ornaments";

export const FLAG_CATEGORY_LABELS: Record<FlagCategoryId, string> = {
  national_flag: "Quốc kỳ Vương quốc",
  royal_standard: "Cờ Hoàng gia (Royal Standard)",
  military_banner: "Cờ Quân đoàn & Chiến trận",
  naval_ensign: "Cờ Hải quân & Hạm đội",
  city_flag: "Cờ Thành phố & Đô thị",
  dynasty_banner: "Cờ Gia tộc & Dòng họ",
  organization_flag: "Cờ Tổ chức & Hội đồng",
  ceremonial_banner: "Cờ Nghi lễ Hoàng cung",
  historical_banner: "Biểu ngữ Lịch sử"
};

export const FLAG_GEOMETRY_LABELS: Record<FlagGeometryId, string> = {
  rect_3_2: "Chữ nhật Chuẩn (3:2)",
  rect_2_1: "Chữ nhật Dài (2:1)",
  swallowtail: "Đuôi én Chiến trận (Swallowtail)",
  gonfalon_1_2: "Biểu ngữ Treo dọc (Gonfalon 1:2)"
};

export const FLAG_LAYOUT_LABELS: Record<FlagLayoutId, string> = {
  solid: "Đơn sắc Nghi lễ",
  horizontal_bicolor: "Nhị sắc Ngang",
  vertical_bicolor: "Nhị sắc Dọc",
  horizontal_tricolor: "Tam tài Ngang",
  vertical_tricolor: "Tam tài Dọc",
  nordic_cross: "Thập tự Bắc Âu (Nordic Cross)",
  symmetric_cross: "Thập tự Cân xứng",
  saltire: "Chữ X Chiến kỳ (Saltire)",
  canton: "Góc Quyền uy (Canton)",
  chevron_hoist: "Mũi nhọn Cán cờ (Chevron)",
  quarterly: "Chia tư Hoàng gia (Quarterly)",
  rising_sun: "Tia sáng Thái dương"
};

const SYMBOL_MAP = new Map(HERALDIC_SYMBOLS.map((s) => [s.id, s]));

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Pure vector SVG renderer for Flag & Banner Studio.
 * Supports 4 geometries (3:2, 2:1, Swallowtail, Vertical Gonfalon 1:2), 12 layouts,
 * 66 reused heraldic symbols, ornamental trim borders, and Vietnamese motto inscription.
 */
export function renderFlagToSvgString(
  cfg: Pick<
    HeraldryFlagDesign,
    | "geometry"
    | "layout"
    | "primaryColor"
    | "secondaryColor"
    | "tertiaryColor"
    | "symbolId"
    | "symbolColor"
    | "symbolScale"
    | "borderTrim"
    | "borderColor"
    | "mottoText"
  >,
  uid = "flag"
): string {
  const safeUid = uid.replace(/[^a-zA-Z0-9_-]/g, "");
  const clipId = `flag-clip-${safeUid}`;
  const isVertical = cfg.geometry === "gonfalon_1_2";
  const w = isVertical ? 360 : cfg.geometry === "rect_2_1" ? 720 : 600;
  const h = isVertical ? 640 : 400;

  let shapePath = `M 0 0 H ${w} V ${h} H 0 Z`;
  if (cfg.geometry === "swallowtail") {
    shapePath = `M 0 0 H ${w} L ${w - 110} ${h / 2} L ${w} ${h} H 0 Z`;
  } else if (cfg.geometry === "gonfalon_1_2") {
    shapePath = `M 0 0 H ${w} V ${h - 90} L ${w / 2} ${h} L 0 ${h - 90} Z`;
  }

  const p = cfg.primaryColor;
  const s = cfg.secondaryColor;
  const t = cfg.tertiaryColor;

  let layoutSvg = `<rect width="${w}" height="${h}" fill="${p}"/>`;
  switch (cfg.layout) {
    case "horizontal_bicolor":
      layoutSvg = `<rect width="${w}" height="${h / 2}" fill="${p}"/><rect y="${h / 2}" width="${w}" height="${h / 2}" fill="${s}"/>`;
      break;
    case "vertical_bicolor":
      layoutSvg = `<rect width="${w / 2}" height="${h}" fill="${p}"/><rect x="${w / 2}" width="${w / 2}" height="${h}" fill="${s}"/>`;
      break;
    case "horizontal_tricolor":
      layoutSvg = `<rect width="${w}" height="${h / 3}" fill="${p}"/><rect y="${h / 3}" width="${w}" height="${h / 3}" fill="${s}"/><rect y="${(2 * h) / 3}" width="${w}" height="${h / 3}" fill="${t}"/>`;
      break;
    case "vertical_tricolor":
      layoutSvg = `<rect width="${w / 3}" height="${h}" fill="${p}"/><rect x="${w / 3}" width="${w / 3}" height="${h}" fill="${s}"/><rect x="${(2 * w) / 3}" width="${w / 3}" height="${h}" fill="${t}"/>`;
      break;
    case "nordic_cross": {
      const cx = isVertical ? w * 0.5 : w * 0.34;
      const cy = isVertical ? h * 0.36 : h * 0.5;
      layoutSvg = `<rect width="${w}" height="${h}" fill="${p}"/><rect x="${cx - 34}" y="0" width="68" height="${h}" fill="${t}"/><rect x="0" y="${cy - 34}" width="${w}" height="68" fill="${t}"/><rect x="${cx - 20}" y="0" width="40" height="${h}" fill="${s}"/><rect x="0" y="${cy - 20}" width="${w}" height="40" fill="${s}"/>`;
      break;
    }
    case "symmetric_cross":
      layoutSvg = `<rect width="${w}" height="${h}" fill="${p}"/><rect x="${w / 2 - 36}" y="0" width="72" height="${h}" fill="${t}"/><rect x="0" y="${h / 2 - 36}" width="${w}" height="72" fill="${t}"/><rect x="${w / 2 - 22}" y="0" width="44" height="${h}" fill="${s}"/><rect x="0" y="${h / 2 - 22}" width="${w}" height="44" fill="${s}"/>`;
      break;
    case "saltire":
      layoutSvg = `<rect width="${w}" height="${h}" fill="${p}"/><line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${t}" stroke-width="64"/><line x1="${w}" y1="0" x2="0" y2="${h}" stroke="${t}" stroke-width="64"/><line x1="0" y1="0" x2="${w}" y2="${h}" stroke="${s}" stroke-width="40"/><line x1="${w}" y1="0" x2="0" y2="${h}" stroke="${s}" stroke-width="40"/>`;
      break;
    case "canton":
      layoutSvg = `<rect width="${w}" height="${h}" fill="${p}"/><rect x="0" y="${h * 0.25}" width="${w}" height="${h * 0.14}" fill="${s}"/><rect x="0" y="${h * 0.61}" width="${w}" height="${h * 0.14}" fill="${s}"/><rect x="0" y="0" width="${w * 0.44}" height="${h * 0.52}" fill="${t}"/>`;
      break;
    case "chevron_hoist":
      layoutSvg = `<rect width="${w}" height="${h}" fill="${p}"/><rect y="${h * 0.5}" width="${w}" height="${h * 0.5}" fill="${s}"/><polygon points="0,0 ${w * 0.45},${h / 2} 0,${h}" fill="${t}"/>`;
      break;
    case "quarterly":
      layoutSvg = `<rect width="${w / 2}" height="${h / 2}" fill="${p}"/><rect x="${w / 2}" width="${w / 2}" height="${h / 2}" fill="${s}"/><rect y="${h / 2}" width="${w / 2}" height="${h / 2}" fill="${s}"/><rect x="${w / 2}" y="${h / 2}" width="${w / 2}" height="${h / 2}" fill="${p}"/>`;
      break;
    case "rising_sun": {
      const cx = w / 2;
      const cy = isVertical ? h * 0.42 : h / 2;
      const rays: string[] = [`<rect width="${w}" height="${h}" fill="${p}"/>`];
      for (let i = 0; i < 12; i++) {
        const a1 = ((i * 30) * Math.PI) / 180;
        const a2 = ((i * 30 + 15) * Math.PI) / 180;
        rays.push(
          `<polygon points="${cx},${cy} ${(cx + Math.cos(a1) * 700).toFixed(1)},${(cy + Math.sin(a1) * 700).toFixed(1)} ${(cx + Math.cos(a2) * 700).toFixed(1)},${(cy + Math.sin(a2) * 700).toFixed(1)}" fill="${s}" fill-opacity="0.72"/>`
        );
      }
      rays.push(`<circle cx="${cx}" cy="${cy}" r="${isVertical ? 82 : 90}" fill="${t}" fill-opacity="0.28"/>`);
      layoutSvg = rays.join("");
      break;
    }
    default:
      break;
  }

  const sym = SYMBOL_MAP.get(cfg.symbolId);
  const symX =
    cfg.layout === "canton"
      ? w * 0.22
      : cfg.layout === "nordic_cross" && !isVertical
      ? w * 0.34
      : cfg.layout === "chevron_hoist"
      ? w * 0.16
      : cfg.geometry === "swallowtail"
      ? w * 0.42
      : w * 0.5;
  const symY =
    cfg.layout === "canton"
      ? h * 0.26
      : isVertical
      ? h * 0.42
      : h * 0.5;
  const symScale = (cfg.symbolScale || 1.5) * (cfg.layout === "canton" ? 0.68 : 1);

  const symSvg = sym
    ? `<g transform="translate(${symX}, ${symY}) scale(${symScale})" color="${cfg.symbolColor}" style="color:${cfg.symbolColor}">${sym.svgInner}</g>`
    : "";

  const mottoSvg =
    cfg.mottoText && cfg.mottoText.trim()
      ? `<text x="${w / 2}" y="${isVertical ? h - 125 : h - 22}" text-anchor="middle" fill="${cfg.symbolColor}" font-family="Cinzel, serif" font-size="${isVertical ? 18 : 16}" font-weight="700" letter-spacing="3">${escapeXml(cfg.mottoText.trim())}</text>`
      : "";

  const trimSvg = cfg.borderTrim
    ? `<path d="${shapePath}" fill="none" stroke="${cfg.borderColor || "#C6A568"}" stroke-width="14"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <clipPath id="${clipId}"><path d="${shapePath}"/></clipPath>
    <linearGradient id="${clipId}-wave" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#000" stop-opacity="0.12"/>
      <stop offset="30%" stop-color="#fff" stop-opacity="0.08"/>
      <stop offset="65%" stop-color="#000" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0.06"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#${clipId})">
    ${layoutSvg}
    <rect width="${w}" height="${h}" fill="url(#${clipId}-wave)"/>
    ${symSvg}
    ${mottoSvg}
    ${trimSvg}
  </g>
</svg>`;
}

const FLAG_PALETTES: Array<[string, string, string, string]> = [
  ["#101522", "#6D3D49", "#C6A568", "#E9DFC9"],
  ["#9E1B32", "#101522", "#D4AF37", "#E9DFC9"],
  ["#1D4E89", "#E5E7EB", "#C6A568", "#D4AF37"],
  ["#0F5132", "#101522", "#C6A568", "#E9DFC9"],
  ["#4A235A", "#1D2636", "#D4AF37", "#E9DFC9"],
  ["#7F1D1D", "#C6A568", "#101522", "#E9DFC9"],
  ["#1B3B6F", "#657D91", "#E9DFC9", "#C6A568"],
  ["#141821", "#8C6239", "#C6A568", "#E9DFC9"]
];

const ALL_FLAG_CATEGORIES = Object.keys(FLAG_CATEGORY_LABELS) as FlagCategoryId[];
const ALL_FLAG_GEOMETRIES = Object.keys(FLAG_GEOMETRY_LABELS) as FlagGeometryId[];
const ALL_FLAG_LAYOUTS = Object.keys(FLAG_LAYOUT_LABELS) as FlagLayoutId[];

let cachedFlags: FlagTemplateItem[] | null = null;

/**
 * Generates 450 curated Flag & Banner templates (FTPL-000001..FTPL-000450)
 * — exactly 50 tailored templates per each of the 9 flag categories.
 */
export function getFlagTemplateCatalog(): FlagTemplateItem[] {
  if (cachedFlags) return cachedFlags;
  const list: FlagTemplateItem[] = [];
  let idx = 0;

  for (const category of ALL_FLAG_CATEGORIES) {
    for (let k = 0; k < 50; k++) {
      const geometry: FlagGeometryId =
        category === "ceremonial_banner" || category === "historical_banner"
          ? k % 2 === 0
            ? "gonfalon_1_2"
            : "swallowtail"
          : category === "military_banner" || category === "naval_ensign"
          ? k % 2 === 0
            ? "swallowtail"
            : "rect_2_1"
          : ALL_FLAG_GEOMETRIES[k % ALL_FLAG_GEOMETRIES.length];

      const layout = ALL_FLAG_LAYOUTS[(idx + k) % ALL_FLAG_LAYOUTS.length];
      const pal = FLAG_PALETTES[(idx + Math.floor(k / 3)) % FLAG_PALETTES.length];
      const sym = HERALDIC_SYMBOLS[(idx * 3 + k) % HERALDIC_SYMBOLS.length];
      const id = `FTPL-${String(idx + 1).padStart(6, "0")}`;

      list.push({
        id,
        name: `${FLAG_CATEGORY_LABELS[category]} · ${sym.name} #${k + 1}`,
        category,
        categoryLabel: FLAG_CATEGORY_LABELS[category],
        geometry,
        geometryLabel: FLAG_GEOMETRY_LABELS[geometry],
        layout,
        layoutLabel: FLAG_LAYOUT_LABELS[layout],
        symbolName: sym.name,
        config: {
          name: `${FLAG_CATEGORY_LABELS[category]} · ${sym.name}`,
          category,
          geometry,
          layout,
          primaryColor: pal[0],
          secondaryColor: pal[1],
          tertiaryColor: pal[2],
          symbolId: sym.id,
          symbolColor: pal[3],
          symbolScale: 1.55,
          borderTrim: k % 2 === 0,
          borderColor: "#C6A568",
          mottoText: k % 3 === 0 ? "AETHEL · VINH QUANG" : "",
          eraLabel: "Kỷ nguyên Hiện tại",
          description: `Mẫu ${FLAG_CATEGORY_LABELS[category]} bố cục ${FLAG_LAYOUT_LABELS[layout]} (${FLAG_GEOMETRY_LABELS[geometry]}).`
        }
      });
      idx++;
    }
  }

  cachedFlags = list;
  return list;
}

export function queryFlagTemplates(opts: {
  q?: string;
  category?: string;
  geometry?: string;
  layout?: string;
  page?: number;
  limit?: number;
}) {
  const all = getFlagTemplateCatalog();
  const filtered = all.filter((f) => {
    if (opts.category && f.category !== opts.category) return false;
    if (opts.geometry && f.geometry !== opts.geometry) return false;
    if (opts.layout && f.layout !== opts.layout) return false;
    if (opts.q && opts.q.trim()) {
      const hay = `${f.id} ${f.name} ${f.categoryLabel} ${f.geometryLabel} ${f.layoutLabel} ${f.symbolName}`;
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });

  const page = Math.max(1, opts.page || 1);
  const limit = Math.max(1, Math.min(48, opts.limit || 18));
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
