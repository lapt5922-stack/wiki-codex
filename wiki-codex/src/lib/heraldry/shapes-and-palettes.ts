import type {
  FieldDivisionId,
  HeraldryShieldConfig,
  ShieldShapeId
} from "@/types/heraldry";

export const SHIELD_SHAPES: Array<{ id: ShieldShapeId; label: string; group: string }> = [
  { id: "traditional", label: "Khiên Cổ điển", group: "Cổ điển" },
  { id: "medieval", label: "Khiên Trung cổ", group: "Trung cổ" },
  { id: "norman", label: "Khiên Norman", group: "Trung cổ" },
  { id: "heater", label: "Khiên Heater", group: "Trung cổ" },
  { id: "kite", label: "Khiên Cánh diều (Kite)", group: "Trung cổ" },
  { id: "round", label: "Khiên Tròn (Round)", group: "Hình học" },
  { id: "oval", label: "Khiên Oval Hoàng gia", group: "Hình học" },
  { id: "french", label: "Khiên Pháp (French)", group: "Châu Âu" },
  { id: "spanish", label: "Khiên Tây Ban Nha (Iberian)", group: "Châu Âu" },
  { id: "italian", label: "Khiên Ý (Italian)", group: "Phục hưng" },
  { id: "gothic", label: "Khiên Gothic", group: "Kiến trúc" },
  { id: "baroque", label: "Khiên Baroque", group: "Phục hưng" },
  { id: "royal", label: "Khiên Đế chế (Royal)", group: "Hoàng gia" },
  { id: "fantasy", label: "Khiên Huyền ảo (Fantasy)", group: "Fantasy" },
  { id: "custom", label: "Khiên Tùy chỉnh Hình học", group: "Tùy chỉnh" }
];

export const FIELD_DIVISIONS: Array<{ id: FieldDivisionId; label: string }> = [
  { id: "solid", label: "Đơn sắc (Solid)" },
  { id: "per_pale", label: "Chia đôi dọc (Per Pale)" },
  { id: "per_fess", label: "Chia đôi ngang (Per Fess)" },
  { id: "quarterly", label: "Chia tư Hoàng gia (Quarterly)" },
  { id: "per_bend", label: "Chia chéo (Per Bend)" },
  { id: "per_saltire", label: "Chữ X (Per Saltire)" },
  { id: "chevron", label: "Chữ V (Chevron)" },
  { id: "paly_stripes", label: "Sọc dọc (Paly)" },
  { id: "chequy", label: "Ô bàn cờ (Chequy)" },
  { id: "radial_glow", label: "Hào quang Tâm điểm" }
];

export interface HeraldicColorDef {
  id: string;
  name: string;
  hex: string;
  group: "traditional" | "imperial";
}

export const HERALDIC_COLORS: HeraldicColorDef[] = [
  // Traditional Tinctures
  { id: "or", name: "Or (Vàng Kim)", hex: "#D4AF37", group: "traditional" },
  { id: "argent", name: "Argent (Bạc Trắng)", hex: "#E5E7EB", group: "traditional" },
  { id: "gules", name: "Gules (Đỏ Son)", hex: "#9E1B32", group: "traditional" },
  { id: "azure", name: "Azure (Xanh Lam)", hex: "#1D4E89", group: "traditional" },
  { id: "sable", name: "Sable (Đen Tuyền)", hex: "#141821", group: "traditional" },
  { id: "vert", name: "Vert (Lục Bảo)", hex: "#1B6B4A", group: "traditional" },
  { id: "purpure", name: "Purpure (Tím Hoàng Gia)", hex: "#5B2C6F", group: "traditional" },
  // Imperial Fantasy Palette
  { id: "royal_burgundy", name: "Royal Burgundy", hex: "#6D3D49", group: "imperial" },
  { id: "imperial_crimson", name: "Imperial Crimson", hex: "#7F1D1D", group: "imperial" },
  { id: "midnight_navy", name: "Midnight Navy", hex: "#101522", group: "imperial" },
  { id: "royal_slate", name: "Royal Slate", hex: "#1D2636", group: "imperial" },
  { id: "antique_gold", name: "Antique Gold", hex: "#C6A568", group: "imperial" },
  { id: "ivory", name: "Ivory (Ngà Cổ)", hex: "#E9DFC9", group: "imperial" },
  { id: "arcane_blue", name: "Arcane Blue", hex: "#657D91", group: "imperial" },
  { id: "emerald", name: "Emerald", hex: "#0F5132", group: "imperial" },
  { id: "sapphire", name: "Sapphire", hex: "#1B3B6F", group: "imperial" },
  { id: "amethyst", name: "Amethyst", hex: "#4A235A", group: "imperial" },
  { id: "bronze", name: "Bronze", hex: "#8C6239", group: "imperial" },
  { id: "copper", name: "Copper", hex: "#B87333", group: "imperial" },
  { id: "platinum", name: "Platinum Silver", hex: "#CBD5E1", group: "imperial" }
];

/**
 * Generates an exact, responsive SVG path in 600x600 coordinate space for any of the 15 shield shapes
 * taking widthScale, heightScale, topCurve, and bottomPoint into account.
 */
export function buildShieldPath(cfg: HeraldryShieldConfig): string {
  const cx = 300;
  const cy = 295;
  const hw = 148 * Math.max(0.7, Math.min(1.3, cfg.widthScale || 1));
  const hh = 178 * Math.max(0.7, Math.min(1.3, cfg.heightScale || 1));
  const left = cx - hw;
  const right = cx + hw;
  const top = cy - hh;
  const bottom = cy + hh + (cfg.bottomPoint || 0) * 0.6;
  const tc = cfg.topCurve || 0;

  switch (cfg.shape) {
    case "round": {
      const r = Math.min(hw, hh);
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 0 ${cx} ${cy + r} A ${r} ${r} 0 1 0 ${cx} ${cy - r} Z`;
    }
    case "oval": {
      return `M ${cx} ${top} A ${hw} ${hh} 0 1 0 ${cx} ${cy + hh} A ${hw} ${hh} 0 1 0 ${cx} ${top} Z`;
    }
    case "norman":
    case "kite": {
      return `M ${left} ${top + 38} Q ${cx} ${top - 22 + tc} ${right} ${top + 38} C ${right + 6} ${cy + 10} ${cx + 55} ${bottom - 45} ${cx} ${bottom + 24} C ${cx - 55} ${bottom - 45} ${left - 6} ${cy + 10} ${left} ${top + 38} Z`;
    }
    case "spanish": {
      return `M ${left} ${top} Q ${cx} ${top + tc} ${right} ${top} V ${cy + hh * 0.35} A ${hw} ${hh * 0.65} 0 0 1 ${left} ${cy + hh * 0.35} Z`;
    }
    case "french": {
      return `M ${left} ${top} Q ${cx} ${top - 8 + tc} ${right} ${top} V ${cy + hh * 0.45} Q ${right} ${bottom - 20} ${cx + 22} ${bottom - 18} L ${cx} ${bottom + 14} L ${cx - 22} ${bottom - 18} Q ${left} ${bottom - 20} ${left} ${cy + hh * 0.45} Z`;
    }
    case "gothic": {
      return `M ${left + 12} ${top} Q ${cx} ${top + 18 + tc} ${right - 12} ${top} L ${right} ${top + 36} C ${right - 12} ${cy + 60} ${cx + 58} ${bottom - 35} ${cx} ${bottom + 18} C ${cx - 58} ${bottom - 35} ${left + 12} ${cy + 60} ${left} ${top + 36} Z`;
    }
    case "baroque": {
      return `M ${left + 16} ${top + 8} Q ${cx} ${top - 20 + tc} ${right - 16} ${top + 8} C ${right + 22} ${top + 65} ${right - 22} ${cy + 25} ${right - 8} ${cy + 80} C ${right - 26} ${bottom - 30} ${cx + 42} ${bottom - 8} ${cx} ${bottom + 16} C ${cx - 42} ${bottom - 8} ${left + 26} ${bottom - 30} ${left + 8} ${cy + 80} C ${left + 22} ${cy + 25} ${left - 22} ${top + 65} ${left + 16} ${top + 8} Z`;
    }
    case "italian": {
      return `M ${cx} ${top - 12 + tc} C ${right + 14} ${top + 30} ${right + 14} ${bottom - 45} ${cx} ${bottom + 14} C ${left - 14} ${bottom - 45} ${left - 14} ${top + 30} ${cx} ${top - 12 + tc} Z`;
    }
    case "royal": {
      return `M ${left} ${top + 14} L ${cx} ${top - 16 + tc} L ${right} ${top + 14} V ${cy + 26} C ${right} ${bottom - 35} ${cx + 62} ${bottom - 8} ${cx} ${bottom + 16} C ${cx - 62} ${bottom - 8} ${left} ${bottom - 35} ${left} ${cy + 26} Z`;
    }
    case "fantasy": {
      return `M ${left - 8} ${top + 20} L ${left + 32} ${top - 6} Q ${cx} ${top + 22 + tc} ${right - 32} ${top - 6} L ${right + 8} ${top + 20} L ${right - 10} ${cy + 28} L ${cx} ${bottom + 24} L ${left + 10} ${cy + 28} Z`;
    }
    case "heater":
    case "medieval":
    case "traditional":
    case "custom":
    default: {
      return `M ${left} ${top} Q ${cx} ${top + tc} ${right} ${top} V ${cy + 10} C ${right} ${bottom - 48} ${cx + 68} ${bottom - 14} ${cx} ${bottom + 10} C ${cx - 68} ${bottom - 14} ${left} ${bottom - 48} ${left} ${cy + 10} Z`;
    }
  }
}

/** WCAG 2.1 Contrast Ratio checker to warn users when emblem colors lack contrast */
export function computeContrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const clean = hex.replace("#", "").trim();
    if (clean.length !== 6) return 0.5;
    const rgb = [0, 2, 4].map((i) => {
      const c = parseInt(clean.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  const l1 = lum(hex1);
  const l2 = lum(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return +((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

/**
 * Security sanitizer for uploaded or user-supplied SVG markup.
 * Strips <script>, <iframe>, <foreignObject>, inline event handlers (on*=), and javascript: URIs.
 */
export function sanitizeSvgContent(svgMarkup: string): string {
  return svgMarkup
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<foreignObject[\s\S]*?>[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "blocked:");
}
