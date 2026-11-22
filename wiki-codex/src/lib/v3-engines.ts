import type { Entry, EntryAttribute, EntryType, WorldUnit } from "@/types/codex";
import { entrySupportsPower } from "./v5-properties";

/* ==================== 1. UNBOUNDED POWER LEVEL & AUTO TIER ==================== */

export interface PowerTierInfo {
  code: string;
  label: string;
  color: string;
  min: number;
}

export const POWER_TIERS: PowerTierInfo[] = [
  { code: "EX/Ω", label: "Cấp Tinh Tú / Siêu Việt", color: "#D4AF37", min: 100_000_000 },
  { code: "SS", label: "Cấp Lục Địa", color: "#FB7185", min: 1_000_000 },
  { code: "S", label: "Cấp Vương Quốc", color: "#F59E0B", min: 100_000 },
  { code: "A", label: "Cấp Thành Bang", color: "#A78BFA", min: 10_000 },
  { code: "B", label: "Bậc Thầy", color: "#38BDF8", min: 1_000 },
  { code: "C", label: "Tinh Anh", color: "#34D399", min: 100 },
  { code: "F", label: "Phàm Nhân", color: "#94A3B8", min: -Infinity }
];

export function formatUnboundedPower(
  value?: number,
  isInfinite?: boolean
): string {
  if (isInfinite) return "∞ (Vô Hạn)";
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e15) return `${sign}${abs.toExponential(2).replace("e+", " × 10^")}`;
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(2).replace(/\.00$/, "")}T`;
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(2).replace(/\.00$/, "")}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(2).replace(/\.00$/, "")}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}${abs.toLocaleString("vi-VN")}`;
}

export function classifyPowerTier(
  value?: number,
  isInfinite?: boolean,
  overrideLabel?: string
): PowerTierInfo {
  if (isInfinite) {
    return {
      code: "Ω",
      label: overrideLabel || "Siêu Việt Vô Hạn",
      color: "#D4AF37",
      min: Infinity
    };
  }
  const v = value ?? 0;
  const matched =
    POWER_TIERS.find((t) => v >= t.min) ?? POWER_TIERS[POWER_TIERS.length - 1];
  return overrideLabel ? { ...matched, label: overrideLabel } : matched;
}

/* ==================== 2. PRESET ATTRIBUTE TEMPLATES ==================== */

export function createCharacterAttributePreset(): EntryAttribute[] {
  return [
    { id: "attr-int", key: "int", label: "Trí tuệ (INT)", value: 92, sliderMax: 100, color: "#60A5FA", sigil: "⚝" },
    { id: "attr-vit", key: "vit", label: "Thể chất (VIT)", value: 65, sliderMax: 100, color: "#34D399", sigil: "☥" },
    { id: "attr-agi", key: "agi", label: "Tốc độ (AGI)", value: 74, sliderMax: 100, color: "#38BDF8", sigil: "✧" },
    { id: "attr-wil", key: "wil", label: "Tinh thần / Ý chí (WIL)", value: 96, sliderMax: 100, color: "#A78BFA", sigil: "Ψ" },
    { id: "attr-arc", key: "arc", label: "Năng lượng / Cổ ngữ (ARC)", value: 88, sliderMax: 100, color: "#D4AF37", sigil: "✦" },
    { id: "attr-cha", key: "cha", label: "Uy tín / Ảnh hưởng (CHA)", value: 94, sliderMax: 100, color: "#F472B6", sigil: "⚜" }
  ];
}

export function createKingdomAttributePreset(): EntryAttribute[] {
  return [
    { id: "attr-eco", key: "eco", label: "Kinh tế & Thương mại", value: 8500, sliderMax: 10000, color: "#D4AF37", sigil: "❖" },
    { id: "attr-sci", key: "sci", label: "Học thuật & Tri thức", value: 9600, sliderMax: 10000, color: "#60A5FA", sigil: "ᚨ" },
    { id: "attr-dip", key: "dip", label: "Ngoại giao & Liên minh", value: 8900, sliderMax: 10000, color: "#A78BFA", sigil: "⚖" },
    { id: "attr-arc", key: "arch", label: "Kiến trúc & Hạ tầng", value: 9200, sliderMax: 10000, color: "#38BDF8", sigil: "◈" },
    { id: "attr-stb", key: "stb", label: "Ổn định Xã hội", value: 8800, sliderMax: 10000, color: "#34D399", sigil: "⛨" },
    { id: "attr-ter", key: "ter", label: "Quy mô Lãnh thổ", value: 7600, sliderMax: 10000, color: "#F59E0B", sigil: "⚜" }
  ];
}

/* ==================== 3. UNBOUNDED SVG RADAR CHART NORMALIZER ==================== */

export interface RadarPoint {
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  attr: EntryAttribute;
  normalizedRatio: number;
}

/**
 * Automatically switches to logarithmic normalization when attribute values
 * span huge orders of magnitude (e.g. 50 vs 1,000,000), keeping the radar legible.
 */
export function computeRadarPolygonPoints(
  attributes: EntryAttribute[],
  cx = 150,
  cy = 150,
  radius = 105
): { points: RadarPoint[]; polygonString: string; usesLogScale: boolean } {
  if (attributes.length === 0) {
    return { points: [], polygonString: "", usesLogScale: false };
  }

  const positiveVals = attributes.map((a) => Math.max(0, a.value));
  const maxVal = Math.max(...positiveVals, 100);
  const nonZero = positiveVals.filter((v) => v > 0);
  const minNonZero = nonZero.length > 0 ? Math.min(...nonZero) : 1;
  const usesLogScale = maxVal / minNonZero > 50;

  const n = attributes.length;
  const points: RadarPoint[] = attributes.map((attr, idx) => {
    const val = Math.max(0, attr.value);
    const ratio = usesLogScale
      ? Math.log10(val + 1) / Math.log10(maxVal + 1)
      : val / maxVal;
    const clampedRatio = Math.max(0.08, Math.min(1, ratio));
    const angle = (idx / n) * Math.PI * 2 - Math.PI / 2;

    return {
      x: Number((cx + Math.cos(angle) * radius * clampedRatio).toFixed(2)),
      y: Number((cy + Math.sin(angle) * radius * clampedRatio).toFixed(2)),
      labelX: Number((cx + Math.cos(angle) * (radius + 24)).toFixed(2)),
      labelY: Number((cy + Math.sin(angle) * (radius + 20)).toFixed(2)),
      attr,
      normalizedRatio: clampedRatio
    };
  });

  const polygonString = points.map((p) => `${p.x},${p.y}`).join(" ");
  return { points, polygonString, usesLogScale };
}

/* ==================== 4. WORLD CURRENCY & UNIT CONVERTER ==================== */

export function convertWorldUnit(
  amount: number,
  fromUnit: WorldUnit,
  toUnit: WorldUnit
): number {
  if (!fromUnit.ratioToBase || !toUnit.ratioToBase) return 0;
  const raw = (amount * fromUnit.ratioToBase) / toUnit.ratioToBase;
  return Math.round(raw * 10000) / 10000;
}

/* ==================== 5. ARCANE CREST & HERALDRY SVG GENERATOR ==================== */

export interface CrestConfig {
  shape: "shield" | "circle" | "diamond" | "wreath";
  layout: "solid" | "vertical" | "horizontal" | "quartered";
  primaryColor: string;
  secondaryColor: string;
  sigil: string;
  sigilColor: string;
  motto: string;
}

export function buildCrestSvgString(cfg: CrestConfig): string {
  const bgClip =
    cfg.shape === "circle"
      ? `<circle cx="150" cy="145" r="108" />`
      : cfg.shape === "diamond"
      ? `<polygon points="150,25 265,145 150,265 35,145" />`
      : `<path d="M 55 40 L 245 40 L 245 150 C 245 215, 195 255, 150 275 C 105 255, 55 215, 55 150 Z" />`;

  const patternRects =
    cfg.layout === "vertical"
      ? `<rect x="0" y="0" width="150" height="300" fill="${cfg.primaryColor}" /><rect x="150" y="0" width="150" height="300" fill="${cfg.secondaryColor}" />`
      : cfg.layout === "horizontal"
      ? `<rect x="0" y="0" width="300" height="150" fill="${cfg.primaryColor}" /><rect x="0" y="150" width="300" height="150" fill="${cfg.secondaryColor}" />`
      : cfg.layout === "quartered"
      ? `<rect x="0" y="0" width="150" height="150" fill="${cfg.primaryColor}" /><rect x="150" y="0" width="150" height="150" fill="${cfg.secondaryColor}" /><rect x="0" y="150" width="150" height="150" fill="${cfg.secondaryColor}" /><rect x="150" y="150" width="150" height="150" fill="${cfg.primaryColor}" />`
      : `<rect x="0" y="0" width="300" height="300" fill="${cfg.primaryColor}" />`;

  const safeMotto = cfg.motto.replace(/[<>&"]/g, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 320" width="300" height="320">
  <defs><clipPath id="crestClip">${bgClip}</clipPath></defs>
  <rect width="300" height="320" fill="#090e1c" rx="24" />
  <g clip-path="url(#crestClip)">${patternRects}</g>
  <g fill="none" stroke="${cfg.sigilColor}" stroke-width="5">${bgClip}</g>
  ${cfg.shape === "wreath" ? `<circle cx="150" cy="145" r="118" fill="none" stroke="${cfg.sigilColor}" stroke-width="2" stroke-dasharray="6 5" opacity="0.7" />` : ""}
  <text x="150" y="162" text-anchor="middle" font-size="84" fill="${cfg.sigilColor}">${cfg.sigil || "⚜"}</text>
  ${safeMotto ? `<text x="150" y="302" text-anchor="middle" font-size="13" font-family="Georgia, serif" font-style="italic" fill="${cfg.sigilColor}">${safeMotto}</text>` : ""}
</svg>`;
}

/* ==================== 6. WORLDBUILDING INSPIRATION FORGE ==================== */

export interface WorldPromptResult {
  kind: "kingdom" | "character" | "artifact" | "event";
  title: string;
  summary: string;
  markdown: string;
}

const KINGDOM_THEMES = [
  { name: "Cộng hòa Hải đăng Bạc", gov: "Hội đồng Hàng hải", geo: "quần đảo đá vôi nhiều sương mù", specialty: "chế tác thấu kính dẫn đường & hải đồ tinh tú" },
  { name: "Vương quốc Thung lũng Đồng Hồ", gov: "Quân chủ Học thuật", geo: "cao nguyên gió lớn quanh năm", specialty: "cơ khí thiên văn, đồng hồ nước và lưu trữ lịch pháp" },
  { name: "Liên bang Thành Cổ Hổ Phách", gov: "Liên minh Bảy Viện Hàn Lâm", geo: "ốc đảo rộng lớn giữa biển cát vàng", specialty: "dệt lụa phát quang và bảo tồn cổ thư trên phiến đất nung" }
];

const CHAR_THEMES = [
  { name: "Học giả Maelis Arven", role: "Nhà Bản đồ học & Dịch giả Cổ ngữ", trait: "trí nhớ siêu phàm về mọi hải đồ cổ", secret: "đang nắm giữ mảnh ghép cuối dẫn tới Thư viện Dưới Đáy Biển" },
  { name: "Kiến trúc sư Thalor Cael", role: "Tổng công trình sư Đài Thiên Văn", trait: "khả năng tính toán kết cấu mái vòm pha lê không cần cột chống", secret: "từng bí mật khắc bản đồ sao thất truyền lên trần mái vòm kinh đô" },
  { name: "Nữ Đại sứ Elenya Solis", role: "Nhà Ngoại giao Hòa bình Liên miền", trait: "thông thạo 5 bộ cổ ngữ lục địa", secret: "là người soạn thảo điều khoản bí mật bảo vệ Rừng Ngọc Sylvaris" }
];

const ARTIFACT_THEMES = [
  { name: "La Bàn Tinh Vân Đồng Thau", mat: "đồng thau cổ khảm thạch anh tím", origin: "Kỷ Nguyên Khởi Nguyên", lore: "luôn chỉ hướng về đài thiên văn hoặc thư viện cổ gần nhất" },
  { name: "Cuộn Giấy Không Phai Aethel", mat: "sợi thực vật phát quang Sylvaris", origin: "Năm 240 Kỷ Nguyên Ánh Sao", lore: "tự động hiển thị bản dịch song ngữ khi đặt dưới ánh trăng tròn" }
];

export function generateWorldbuildingPrompt(
  kind: "kingdom" | "character" | "artifact" | "event",
  seedIndex = 0
): WorldPromptResult {
  if (kind === "kingdom") {
    const k = KINGDOM_THEMES[seedIndex % KINGDOM_THEMES.length];
    return {
      kind,
      title: k.name,
      summary: `Chính thể ${k.gov} tọa lạc tại ${k.geo}, nổi danh với ${k.specialty}.`,
      markdown: `## Tổng quan\n\n**${k.name}** là một chính thể theo mô hình *${k.gov}* nằm trên vùng ${k.geo}.\n\n## Bản sắc & Tri thức\n\nNền văn minh này nổi tiếng khắp lục địa nhờ ${k.specialty}.`
    };
  }
  if (kind === "character") {
    const c = CHAR_THEMES[seedIndex % CHAR_THEMES.length];
    return {
      kind,
      title: c.name,
      summary: `${c.role}, nổi tiếng với ${c.trait}.`,
      markdown: `## Tiểu sử\n\n**${c.name}** là ${c.role}, được sử sách nhắc tới nhờ ${c.trait}.\n\n:::spoiler Ghi chú nghiên cứu chưa công bố\n${c.name} ${c.secret}.\n:::`
    };
  }
  const a = ARTIFACT_THEMES[seedIndex % ARTIFACT_THEMES.length];
  return {
    kind,
    title: a.name,
    summary: `Cổ vật chế tác từ ${a.mat} vào ${a.origin}.`,
    markdown: `## Mô tả Cổ vật\n\n**${a.name}** được tạo tác bằng *${a.mat}* từ ${a.origin}. Theo ghi chép học giả, cổ vật này ${a.lore}.`
  };
}

/* ==================== 7. LORE CONSISTENCY AUDITOR ==================== */

export interface ConsistencyAuditReport {
  missingCoverCount: number;
  missingPowerCount: number;
  uncategorizedCount: number;
  missingCoverEntries: Array<{ id: string; title: string }>;
  missingPowerEntries: Array<{ id: string; title: string }>;
}

export function runLoreConsistencyAudit(
  entries: Entry[],
  entryTypes: EntryType[] = []
): ConsistencyAuditReport {
  const active = entries.filter((e) => !e.deletedAt);
  const typeMap = new Map(entryTypes.map((t) => [t.id, t]));
  const missingCoverEntries = active
    .filter((e) => !e.coverImage && !e.thumbImage)
    .map((e) => ({ id: e.id, title: e.title }));
  const missingPowerEntries = active
    .filter((e) => {
      const et = typeMap.get(e.entryTypeId);
      if (et && !entrySupportsPower(e, et)) return false;
      return e.powerLevel === undefined && !e.powerInfinite;
    })
    .map((e) => ({ id: e.id, title: e.title }));
  const uncategorizedCount = active.filter((e) => !e.categoryId).length;

  return {
    missingCoverCount: missingCoverEntries.length,
    missingPowerCount: missingPowerEntries.length,
    uncategorizedCount,
    missingCoverEntries: missingCoverEntries.slice(0, 15),
    missingPowerEntries: missingPowerEntries.slice(0, 15)
  };
}
