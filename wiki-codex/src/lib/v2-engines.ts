import type {
  ConlangLanguage,
  Entry,
  EntryType,
  WorldCalendar
} from "@/types/codex";
import { toAncientScript } from "./conlang";
import { normalizeVietnamese } from "./vietnamese";

/* ==================== 1. VISUAL REVISION DIFF ==================== */

export interface DiffLine {
  type: "same" | "added" | "removed";
  text: string;
}

/**
 * Clean line-by-line LCS diff for Visual Revision Diff Viewer.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText.split(/\r?\n/);
  const b = newText.split(/\r?\n/);
  const m = a.length;
  const n = b.length;

  // Build DP table for LCS
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "removed", text: a[i] });
      i++;
    } else {
      out.push({ type: "added", text: b[j] });
      j++;
    }
  }
  while (i < m) {
    out.push({ type: "removed", text: a[i++] });
  }
  while (j < n) {
    out.push({ type: "added", text: b[j++] });
  }
  return out;
}

/* ==================== 2. WORLD CALENDAR & MOON PHASES ==================== */

const MOON_PHASES = [
  { glyph: "🌑", label: "Sóc Nguyệt (Trăng mới)" },
  { glyph: "🌒", label: "Lưỡi liềm đầu tháng" },
  { glyph: "🌓", label: "Thượng huyền" },
  { glyph: "🌔", label: "Khuyết tròn dần" },
  { glyph: "🌕", label: "Vọng Nguyệt (Trăng tròn)" },
  { glyph: "🌖", label: "Khuyết cuối tháng" },
  { glyph: "🌗", label: "Hạ huyền" },
  { glyph: "🌘", label: "Tàn nguyệt" }
];

export function getMoonPhaseForDay(
  absoluteDay: number,
  moonCycleDays = 28
): { glyph: string; label: string } {
  const cycle = Math.max(4, moonCycleDays);
  const pos = ((absoluteDay % cycle) + cycle) % cycle;
  const idx = Math.floor((pos / cycle) * MOON_PHASES.length) % MOON_PHASES.length;
  return MOON_PHASES[idx];
}

export function getAbsoluteDayInYear(
  calendar: WorldCalendar,
  monthIndex: number,
  day: number
): number {
  let total = 0;
  for (let i = 0; i < monthIndex && i < calendar.months.length; i++) {
    total += calendar.months[i].days;
  }
  return total + day;
}

/* ==================== 3. CONLANG V2: NAME GENERATOR & REVERSE TRANSLATE ==================== */

export interface GeneratedWorldName {
  romanized: string;
  runic: string;
  category: "kingdom" | "character" | "landmark" | "house";
  meaningHint: string;
}

const NAME_PREFIXES = {
  kingdom: ["Val", "Sol", "Ael", "Glac", "Thal", "Imper", "Syl", "Aur", "Bore", "Cael"],
  character: ["Lyr", "Ser", "Vael", "Elen", "Khor", "Mir", "Or", "Thar", "Cael", "Ael"],
  landmark: ["Orak", "Aurel", "Sylvar", "Drak", "Astrel", "Lun", "Thalass", "Cryst", "Etern", "Solis"],
  house: ["Vael", "Othal", "Ael", "Sol", "Khor", "Glac", "Lumen", "Bore", "Cael", "Syl"]
};

const NAME_SUFFIXES = {
  kingdom: ["doria", "aria", "ien", "oria", "vael", "ion", "landis", "heim"],
  character: ["aen", "elor", "is", "ion", "areth", "or", "ia", "en"],
  landmark: ["'on", "is", "mor", "el", "spire", "gard", "vael", "haven"],
  house: ["'or", "en", "ir", "vael", "aris", "ion", "eth", "al"]
};

const MEANING_HINTS: Record<"kingdom" | "character" | "landmark" | "house", string[]> = {
  kingdom: [
    "Đế chế Nhật Thực",
    "Vương quốc Sương Bạc",
    "Liên minh Tinh Vân",
    "Triều đại Ngọc Bích",
    "Lãnh địa Rừng Thiêng",
    "Hoàng triều Phương Bắc",
    "Cộng hòa Hải Đăng",
    "Vương triều Bình Minh"
  ],
  character: [
    "Kẻ Gác Sao",
    "Người Mang Lửa",
    "Hậu Duệ Sương Mù",
    "Kiếm Sĩ Hoàng Hôn",
    "Hiền Giả Cổ Đại",
    "Người Dệt Định Mệnh",
    "Học Giả Tháp Tinh Tú",
    "Sứ Giả Băng Triều"
  ],
  landmark: [
    "Thành Trì Ánh Sáng",
    "Cảng Biển Bạc",
    "Pháo Đài Băng Giá",
    "Thung Lũng Hoa Tuyết",
    "Tháp Vọng Thiên",
    "Bến Bờ Tri Thức",
    "Đài Thiên Văn Cổ",
    " Thư Viện Đại Tàng"
  ],
  house: [
    "Gia tộc Hộ Quốc",
    "Dòng dõi Tinh Tú",
    "Huyết mạch Cổ Thư",
    "Gia tộc Hải Đồ Vàng",
    "Dòng họ Tháp Bạc",
    "Hậu duệ Khởi Nguyên",
    "Gia tộc Rừng Ngọc",
    "Dòng tộc Thái Dương"
  ]
};

const PHONOLOGY_NAME_BANKS: Record<string, { pre: string[]; mid: string[]; suf: string[] }> = {
  aethelian: { pre: ["Aeth", "Val", "Eld", "Ser", "Thal", "Cael", "Lyr", "Orak"], mid: ["ar", "el", "or", "en", "is", "ul"], suf: ["ion", "gard", "ia", "dor", "eth", "is", "vael", "or"] },
  celestial: { pre: ["Orak", "Lum", "Ast", "Cel", "Sol", "Mir", "Stell", "Aeth"], mid: ["ae", "io", "ea", "ul", "yn", "ar"], suf: ["iel", "ora", "ium", "ael", "is", "on", "el", "os"] },
  nordic: { pre: ["Skal", "Frost", "Kjor", "Valk", "Bryn", "Hrim", "Glac", "Bore"], mid: ["ar", "ur", "en", "ig", "od", "al"], suf: ["heim", "fjord", "gard", "rik", "vald", "stein", "or", "ur"] },
  solar: { pre: ["Heli", "Aur", "Sol", "Ign", "Rad", "Zeph", "Imp", "Luc"], mid: ["an", "or", "ia", "es", "um", "ar"], suf: ["os", "ara", "ius", "on", "en", "is", "ia", "um"] },
  sylvan: { pre: ["Syl", "Fae", "Lyr", "Vyr", "Myr", "Thyr", "Elen", "Nym"], mid: ["el", "il", "ae", "yn", "or", "al"], suf: ["wen", "lor", "thil", "ia", "en", "is", "iel", "yn"] },
  void: { pre: ["Xyr", "Nyx", "Kha", "Vex", "Zul", "Qor", "Voi", "Umb"], mid: ["az", "ul", "ex", "or", "ik", "un"], suf: ["oth", "ak", "ul", "ix", "ar", "on", "'ar", "'ul"] }
};

export function generateConlangNames(
  category: "kingdom" | "character" | "landmark" | "house",
  count = 8,
  language?: Pick<
    ConlangLanguage,
    "scriptStyle" | "phonologyPreset" | "customPrefixes" | "customSuffixes" | "alphabet"
  >,
  seedOffset = 0
): GeneratedWorldName[] {
  const presetKey =
    language?.phonologyPreset && PHONOLOGY_NAME_BANKS[language.phonologyPreset]
      ? language.phonologyPreset
      : "aethelian";
  const bank = PHONOLOGY_NAME_BANKS[presetKey];
  const prefixes =
    language?.customPrefixes && language.customPrefixes.length > 0
      ? language.customPrefixes
      : language?.phonologyPreset && PHONOLOGY_NAME_BANKS[language.phonologyPreset]
      ? bank.pre
      : NAME_PREFIXES[category];
  const suffixes =
    language?.customSuffixes && language.customSuffixes.length > 0
      ? language.customSuffixes
      : language?.phonologyPreset && PHONOLOGY_NAME_BANKS[language.phonologyPreset]
      ? bank.suf
      : NAME_SUFFIXES[category];
  const style = language?.scriptStyle ?? "runic";
  const hints = MEANING_HINTS[category] ?? MEANING_HINTS.kingdom;
  const out: GeneratedWorldName[] = [];

  for (let i = 0; i < count; i++) {
    const idx = i + seedOffset * 7;
    const p = prefixes[(idx * 3) % prefixes.length];
    const m = bank.mid[(idx * 3 + 1) % bank.mid.length];
    const s = suffixes[(idx * 5 + 1) % suffixes.length];
    const useMid = p.length <= 3 && !s.startsWith("'");
    const rom = useMid ? `${p}${m}${s}` : `${p}${s}`;
    out.push({
      romanized: rom,
      runic: toAncientScript(rom, style, language?.alphabet),
      category,
      meaningHint: hints[(i + seedOffset) % hints.length]
    });
  }
  return out;
}

export function reverseTranslateConlang(
  conlangText: string,
  language?: Pick<ConlangLanguage, "lexicon">
): {
  vietnamese: string;
  matchedCount: number;
  matches: Array<{ source: string; vietnamese: string; note: string }>;
} {
  const lexicon = language?.lexicon ?? [];
  const romMap = new Map(
    lexicon.map((w) => [normalizeVietnamese(w.romanized), w])
  );
  const runicMap = new Map(lexicon.map((w) => [w.runic.trim(), w]));

  const parts = conlangText.split(/(\s+|[.,!?;:()]+)/).filter(Boolean);
  const matches: Array<{ source: string; vietnamese: string; note: string }> = [];
  const out = parts.map((part) => {
    const trimmed = part.trim();
    if (!trimmed) return part;
    const hit =
      romMap.get(normalizeVietnamese(trimmed)) ?? runicMap.get(trimmed);
    if (hit) {
      matches.push({
        source: trimmed,
        vietnamese: hit.vietnamese,
        note: hit.note
      });
      return hit.vietnamese;
    }
    return part;
  });

  return {
    vietnamese: out.join(""),
    matchedCount: matches.length,
    matches
  };
}

/* ==================== 4. ATLAS V2 DISTANCE RULER ==================== */

export function calculateRouteDistanceKm(
  points: Array<{ xPercent: number; yPercent: number }>,
  scaleKmPerWidth = 2400
): number {
  if (points.length < 2) return 0;
  let totalPercent = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].xPercent - points[i - 1].xPercent;
    // Aspect ratio 16:9 correction for Y axis
    const dy = (points[i].yPercent - points[i - 1].yPercent) * (9 / 16);
    totalPercent += Math.hypot(dx, dy);
  }
  return Math.round((totalPercent / 100) * scaleKmPerWidth);
}

export function estimateTravelDays(distanceKm: number): {
  onFootDays: number;
  horseCarriageDays: number;
  sailingShipDays: number;
} {
  return {
    onFootDays: Math.max(1, Math.round(distanceKm / 30)),
    horseCarriageDays: Math.max(1, Math.round(distanceKm / 75)),
    sailingShipDays: Math.max(1, Math.round(distanceKm / 160))
  };
}

/* ==================== 5. CSV EXPORT & MULTI-ENTITY MATRIX ==================== */

function csvEscape(v: string): string {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportEntriesToCsv(entries: Entry[]): string {
  const headers = [
    "ID",
    "Tiêu đề",
    "Phụ đề",
    "Biệt danh",
    "Trạng thái",
    "Phạm vi",
    "Xác thực",
    "Thẻ",
    "Cập nhật"
  ];
  const rows = entries.map((e) => [
    e.id,
    e.title,
    e.subtitle,
    (e.aliases || []).join("; "),
    e.status,
    e.visibility,
    e.canonStatus || "canon",
    e.tags.join("; "),
    e.updatedAt
  ]);
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(","))
  ].join("\n");
}

export function buildComparisonMatrixMarkdown(
  entries: Entry[],
  entryTypes: EntryType[]
): string {
  if (entries.length === 0) return "";
  const fieldKeys = new Set<string>();
  const fieldLabels = new Map<string, string>();

  for (const e of entries) {
    const t = entryTypes.find((x) => x.id === e.entryTypeId);
    for (const f of t?.fieldSchema ?? []) {
      if (f.type !== "private_note" && f.type !== "table") {
        fieldKeys.add(f.key);
        fieldLabels.set(f.key, f.label);
      }
    }
  }

  const headerRow = `| Thuộc tính | ${entries.map((e) => `${e.sigil} ${e.title}`).join(" | ")} |`;
  const sepRow = `| --- | ${entries.map(() => "---").join(" | ")} |`;
  const baseRows = [
    `| Trạng thái | ${entries.map((e) => e.status).join(" | ")} |`,
    `| Xác thực | ${entries.map((e) => e.canonStatus || "canon").join(" | ")} |`,
    `| Biệt danh | ${entries.map((e) => (e.aliases || []).join(", ") || "—").join(" | ")} |`,
    `| Thẻ | ${entries.map((e) => e.tags.join(", ") || "—").join(" | ")} |`
  ];

  const dynamicRows = Array.from(fieldKeys).map((k) => {
    const label = fieldLabels.get(k) || k;
    const vals = entries.map((e) => {
      const v = e.customFields?.[k];
      if (v === undefined || v === null || v === "") return "—";
      return Array.isArray(v) ? v.join(", ") : String(v);
    });
    return `| ${label} | ${vals.join(" | ")} |`;
  });

  return [headerRow, sepRow, ...baseRows, ...dynamicRows].join("\n");
}
