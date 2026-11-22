import type {
  AtlasMap,
  AtlasRoute,
  AtlasTravelMode,
  CalendarMoonDef,
  CodexAnalyticsSummary,
  ConlangLanguage,
  Entry,
  EntryRelation,
  EntryType,
  HierarchyNode,
  WorldCalendar
} from "@/types/codex";
import { classifyPowerTier, formatUnboundedPower } from "./v3-engines";
import { toAncientScript } from "./conlang";
import { countWords, normalizeVietnamese } from "./vietnamese";
import { entrySupportsPower } from "./v5-properties";

/* ============================================================================
   1. CUSTOM WORLD CALENDAR & MULTI-MOON ENGINE
   ============================================================================ */

export function getCalendarYearDays(cal: WorldCalendar): number {
  return Math.max(
    1,
    cal.months.reduce((acc, m) => acc + Math.max(1, m.days), 0)
  );
}

export function toAbsoluteDay(
  cal: WorldCalendar,
  year: number,
  monthIndex: number,
  day: number
): number {
  const daysPerYear = getCalendarYearDays(cal);
  let daysBeforeMonth = 0;
  for (let i = 0; i < Math.min(monthIndex, cal.months.length); i++) {
    daysBeforeMonth += Math.max(1, cal.months[i].days);
  }
  return (year - 1) * daysPerYear + daysBeforeMonth + Math.max(1, day) - 1;
}

export function fromAbsoluteDay(
  cal: WorldCalendar,
  absoluteDay: number
): { year: number; monthIndex: number; day: number; weekdayIndex: number } {
  const daysPerYear = getCalendarYearDays(cal);
  const safeAbs = Math.max(0, Math.floor(absoluteDay));
  const year = Math.floor(safeAbs / daysPerYear) + 1;
  let rem = safeAbs % daysPerYear;
  let monthIndex = 0;
  for (let i = 0; i < cal.months.length; i++) {
    const d = Math.max(1, cal.months[i].days);
    if (rem < d) {
      monthIndex = i;
      break;
    }
    rem -= d;
  }
  const weekLen = Math.max(1, cal.weekdays.length);
  return {
    year,
    monthIndex,
    day: rem + 1,
    weekdayIndex: safeAbs % weekLen
  };
}

export interface MoonPhaseInfo {
  moonId: string;
  moonName: string;
  color: string;
  phaseRatio: number; // 0..1
  phaseName: string;
  glyph: string;
}

export function computeMoonPhase(
  moon: CalendarMoonDef,
  absoluteDay: number
): MoonPhaseInfo {
  const cycle = Math.max(1, moon.cycleDays);
  const pos = (((absoluteDay + (moon.offsetDays || 0)) % cycle) + cycle) % cycle;
  const ratio = pos / cycle;
  let phaseName = "Trăng Non";
  let glyph = "🌑";
  if (ratio < 0.08 || ratio >= 0.94) {
    phaseName = "Trăng Non";
    glyph = "🌑";
  } else if (ratio < 0.22) {
    phaseName = "Lưỡi Liềm Đầu";
    glyph = "🌒";
  } else if (ratio < 0.32) {
    phaseName = "Bán Nguyệt Đầu";
    glyph = "🌓";
  } else if (ratio < 0.46) {
    phaseName = "Trăng Khuyết Đầy";
    glyph = "🌔";
  } else if (ratio < 0.56) {
    phaseName = "Trăng Tròn";
    glyph = "🌕";
  } else if (ratio < 0.7) {
    phaseName = "Trăng Khuyết Tàn";
    glyph = "🌖";
  } else if (ratio < 0.8) {
    phaseName = "Bán Nguyệt Cuối";
    glyph = "🌗";
  } else {
    phaseName = "Lưỡi Liềm Cuối";
    glyph = "🌘";
  }
  return {
    moonId: moon.id,
    moonName: moon.name,
    color: moon.color,
    phaseRatio: ratio,
    phaseName,
    glyph
  };
}

/* ============================================================================
   2. ATLAS ROUTE DISTANCE & TRAVEL TIME CALCULATOR
   ============================================================================ */

export const DEFAULT_TRAVEL_MODES: AtlasTravelMode[] = [
  { id: "tm-walk", name: "Đi bộ hành quân", kmPerDay: 28, icon: "🥾" },
  { id: "tm-horse", name: "Kỵ mã đường trường", kmPerDay: 72, icon: "🐎" },
  { id: "tm-ship", name: "Chiến thuyền buồm", kmPerDay: 145, icon: "⛵" },
  { id: "tm-airship", name: "Khí cầu Ma đạo", kmPerDay: 420, icon: "🛸" }
];

export function computeRouteDistanceKm(
  route: Pick<AtlasRoute, "points">,
  map: Pick<AtlasMap, "scaleKmPerWidth" | "width" | "height">
): number {
  const pts = route.points ?? [];
  if (pts.length < 2) return 0;
  const scaleWidthKm = map.scaleKmPerWidth && map.scaleKmPerWidth > 0 ? map.scaleKmPerWidth : 2400;
  const aspect = map.width > 0 && map.height > 0 ? map.height / map.width : 0.62;
  let totalKm = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = ((pts[i].xPercent - pts[i - 1].xPercent) / 100) * scaleWidthKm;
    const dy = ((pts[i].yPercent - pts[i - 1].yPercent) / 100) * (scaleWidthKm * aspect);
    totalKm += Math.hypot(dx, dy);
  }
  return Math.round(totalKm * 10) / 10;
}

export function computeTravelTimes(
  distanceKm: number,
  modes: AtlasTravelMode[] = DEFAULT_TRAVEL_MODES
): Array<{ mode: AtlasTravelMode; days: number; label: string }> {
  return modes.map((mode) => {
    const speed = Math.max(0.1, mode.kmPerDay);
    const days = Math.round((distanceKm / speed) * 10) / 10;
    const label =
      days < 1
        ? `${Math.max(1, Math.round(days * 24))} giờ`
        : days >= 30
        ? `${days} ngày (~${(days / 30).toFixed(1)} tháng)`
        : `${days} ngày`;
    return { mode, days, label };
  });
}

/* ============================================================================
   3. LAYERED HIERARCHY / FAMILY TREE SVG LAYOUT ENGINE
   ============================================================================ */

export interface PositionedHierarchyNode {
  node: HierarchyNode;
  x: number;
  y: number;
  depth: number;
}

export interface HierarchyLayoutResult {
  nodes: PositionedHierarchyNode[];
  edges: Array<{
    from: PositionedHierarchyNode;
    to: PositionedHierarchyNode;
    label: string;
  }>;
  width: number;
  height: number;
}

export function computeHierarchyLayout(
  nodes: HierarchyNode[],
  options?: { nodeWidth?: number; nodeHeight?: number; gapX?: number; gapY?: number }
): HierarchyLayoutResult {
  const nodeWidth = options?.nodeWidth ?? 186;
  const nodeHeight = options?.nodeHeight ?? 74;
  const gapX = options?.gapX ?? 34;
  const gapY = options?.gapY ?? 82;

  if (nodes.length === 0) {
    return { nodes: [], edges: [], width: 600, height: 320 };
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<string, HierarchyNode[]>();
  const roots: HierarchyNode[] = [];

  for (const n of nodes) {
    if (!n.parentId || !byId.has(n.parentId) || n.parentId === n.id) {
      roots.push(n);
    } else {
      const list = childrenMap.get(n.parentId) ?? [];
      list.push(n);
      childrenMap.set(n.parentId, list);
    }
  }

  // Fallback if cycle prevented roots
  if (roots.length === 0) roots.push(nodes[0]);

  const visited = new Set<string>();
  const positioned: PositionedHierarchyNode[] = [];
  let cursorX = 40;
  let maxDepth = 0;

  function placeSubtree(node: HierarchyNode, depth: number): PositionedHierarchyNode {
    visited.add(node.id);
    if (depth > maxDepth) maxDepth = depth;
    const rawKids = (childrenMap.get(node.id) ?? []).filter((k) => !visited.has(k.id));
    const y = 40 + depth * (nodeHeight + gapY);

    if (rawKids.length === 0) {
      const x = cursorX;
      cursorX += nodeWidth + gapX;
      const p: PositionedHierarchyNode = { node, x, y, depth };
      positioned.push(p);
      return p;
    }

    const placedKids = rawKids.map((k) => placeSubtree(k, depth + 1));
    const firstX = placedKids[0].x;
    const lastX = placedKids[placedKids.length - 1].x;
    const x = (firstX + lastX) / 2;
    const p: PositionedHierarchyNode = { node, x, y, depth };
    positioned.push(p);
    return p;
  }

  for (const r of roots) {
    if (!visited.has(r.id)) {
      placeSubtree(r, 0);
      cursorX += 24;
    }
  }
  // Place any remaining disconnected cycle nodes
  for (const n of nodes) {
    if (!visited.has(n.id)) {
      placeSubtree(n, 0);
    }
  }

  const posMap = new Map(positioned.map((p) => [p.node.id, p]));
  const edges: HierarchyLayoutResult["edges"] = [];
  for (const p of positioned) {
    if (p.node.parentId && posMap.has(p.node.parentId)) {
      edges.push({
        from: posMap.get(p.node.parentId)!,
        to: p,
        label: p.node.relationLabel || ""
      });
    }
  }

  const maxX = Math.max(...positioned.map((p) => p.x)) + nodeWidth + 40;
  const maxY = 40 + (maxDepth + 1) * (nodeHeight + gapY) + 20;

  return {
    nodes: positioned,
    edges,
    width: Math.max(640, maxX),
    height: Math.max(320, maxY)
  };
}

export function buildHierarchySvgString(
  title: string,
  layout: HierarchyLayoutResult
): string {
  const nodeW = 186;
  const nodeH = 74;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const edgeSvg = layout.edges
    .map((e) => {
      const x1 = e.from.x + nodeW / 2;
      const y1 = e.from.y + nodeH;
      const x2 = e.to.x + nodeW / 2;
      const y2 = e.to.y;
      const midY = (y1 + y2) / 2;
      const labelSvg = e.label
        ? `<text x="${(x1 + x2) / 2}" y="${midY - 4}" text-anchor="middle" fill="#cbd5e1" font-size="10" font-family="sans-serif">${esc(e.label)}</text>`
        : "";
      return `<path d="M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}" fill="none" stroke="rgba(212,175,55,0.55)" stroke-width="2" />${labelSvg}`;
    })
    .join("\n");

  const nodeSvg = layout.nodes
    .map((p) => {
      const stroke = p.node.color || "#D4AF37";
      return `<g transform="translate(${p.x}, ${p.y})">
        <rect width="${nodeW}" height="${nodeH}" rx="14" fill="#10182f" stroke="${esc(stroke)}" stroke-width="2" />
        <text x="14" y="28" fill="#f5efdf" font-size="13" font-weight="700" font-family="sans-serif">${esc(p.node.sigil)} ${esc(p.node.label.slice(0, 22))}</text>
        <text x="14" y="48" fill="#94a3b8" font-size="11" font-family="sans-serif">${esc((p.node.subtitle || "").slice(0, 28))}</text>
      </g>`;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}">
  <rect width="100%" height="100%" fill="#080d1a" />
  <text x="24" y="26" fill="#d4af37" font-size="14" font-weight="700" font-family="sans-serif">${esc(title)}</text>
  ${edgeSvg}
  ${nodeSvg}
</svg>`;
}

/* ============================================================================
   4. MULTI-ENTITY SIDE-BY-SIDE COMPARISON ENGINE
   ============================================================================ */

export interface ComparisonRow {
  key: string;
  label: string;
  category: "power" | "attribute" | "meta";
  values: Array<{ entryId: string; display: string; numeric: number | null; isMax: boolean }>;
  allEqual: boolean;
}

export function buildComparisonMatrix(entries: Entry[]): ComparisonRow[] {
  if (entries.length === 0) return [];
  const rows: ComparisonRow[] = [];

  // 1. Power Level row
  const powerNums = entries.map((e) => (e.powerInfinite ? Number.POSITIVE_INFINITY : (e.powerLevel ?? 0)));
  const maxPower = Math.max(...powerNums);
  rows.push({
    key: "__power",
    label: "Mức sức mạnh (Power Level)",
    category: "power",
    values: entries.map((e, idx) => ({
      entryId: e.id,
      display: `${formatUnboundedPower(e.powerLevel ?? 0, e.powerInfinite)} (${classifyPowerTier(e.powerLevel ?? 0, e.powerInfinite).label})`,
      numeric: powerNums[idx],
      isMax: entries.length > 1 && powerNums[idx] === maxPower && maxPower > 0
    })),
    allEqual: new Set(powerNums).size <= 1
  });

  // 2. Unified RPG Attributes
  const attrNames = Array.from(
    new Set(entries.flatMap((e) => (e.attributes ?? []).map((a) => a.label)))
  );
  for (const attrName of attrNames) {
    const vals = entries.map((e) => {
      const found = (e.attributes ?? []).find((a) => a.label === attrName);
      if (!found) return { entryId: e.id, display: "—", numeric: null, isMax: false };
      const num = found.value;
      return {
        entryId: e.id,
        display: formatUnboundedPower(found.value, false),
        numeric: num,
        isMax: false
      };
    });
    const nums = vals.map((v) => v.numeric).filter((n): n is number => n !== null);
    const maxN = nums.length > 0 ? Math.max(...nums) : null;
    if (maxN !== null && entries.length > 1) {
      vals.forEach((v) => {
        if (v.numeric === maxN) v.isMax = true;
      });
    }
    rows.push({
      key: `attr:${attrName}`,
      label: attrName,
      category: "attribute",
      values: vals,
      allEqual: new Set(vals.map((v) => v.display)).size <= 1
    });
  }

  // 3. Canon & Abilities count
  const abilityCounts = entries.map((e) => (e.abilities ?? []).length);
  const maxAb = Math.max(...abilityCounts);
  rows.push({
    key: "__abilities",
    label: "Số Năng lực / Kỹ năng",
    category: "meta",
    values: entries.map((e, idx) => ({
      entryId: e.id,
      display: `${abilityCounts[idx]} năng lực`,
      numeric: abilityCounts[idx],
      isMax: entries.length > 1 && abilityCounts[idx] === maxAb && maxAb > 0
    })),
    allEqual: new Set(abilityCounts).size <= 1
  });

  const canonDisplays = entries.map((e) => e.canonStatus || "canon");
  rows.push({
    key: "__canon",
    label: "Trạng thái Canon",
    category: "meta",
    values: entries.map((e, idx) => ({
      entryId: e.id,
      display: canonDisplays[idx],
      numeric: null,
      isMax: false
    })),
    allEqual: new Set(canonDisplays).size <= 1
  });

  return rows;
}

export function comparisonToMarkdown(entries: Entry[], rows: ComparisonRow[]): string {
  const header = `| Tiêu chí | ${entries.map((e) => `${e.sigil} ${e.title}`).join(" | ")} |`;
  const sep = `| --- | ${entries.map(() => "---").join(" | ")} |`;
  const body = rows
    .map(
      (r) =>
        `| **${r.label}** | ${r.values.map((v) => (v.isMax ? `**${v.display}** ★` : v.display)).join(" | ")} |`
    )
    .join("\n");
  return `${header}\n${sep}\n${body}`;
}

/* ============================================================================
   5. CODEX ANALYTICS & WORLD HEALTH ENGINE
   ============================================================================ */

export function computeCodexAnalytics(
  entries: Entry[],
  relations: EntryRelation[],
  entryTypes: EntryType[]
): CodexAnalyticsSummary {
  const active = entries.filter((e) => !e.deletedAt);
  const typeMap = new Map(entryTypes.map((t) => [t.id, t]));
  const lookupToId = new Map<string, string>();
  for (const e of active) {
    lookupToId.set(normalizeVietnamese(e.title), e.id);
    lookupToId.set(e.slug.toLowerCase(), e.id);
    for (const al of e.aliases ?? []) {
      const normAl = normalizeVietnamese(al);
      if (normAl && !lookupToId.has(normAl)) lookupToId.set(normAl, e.id);
    }
  }
  const connectedIds = new Set<string>();
  const brokenLinks: CodexAnalyticsSummary["brokenLinks"] = [];

  let totalWords = 0;
  let completenessScoreSum = 0;

  for (const e of active) {
    const words = countWords(e.contentMarkdown);
    totalWords += words;

    let score = 0;
    if (e.summary && e.summary.trim().length >= 20) score += 25;
    if (words >= 40) score += 25;
    if (e.coverImage || e.thumbImage) score += 25;
    if (
      (e.tags && e.tags.length > 0) ||
      (e.attributes && e.attributes.length > 0) ||
      (e.extraFields && e.extraFields.length > 0)
    ) {
      score += 25;
    }
    completenessScoreSum += score;

    const regex = /\[\[([^[\]|]+)(?:\|[^[\]]+)?\]\]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(e.contentMarkdown)) !== null) {
      const target = m[1].trim();
      const targetId =
        lookupToId.get(normalizeVietnamese(target)) ??
        lookupToId.get(target.toLowerCase());
      if (targetId) {
        if (targetId !== e.id) {
          connectedIds.add(e.id);
          connectedIds.add(targetId);
        }
      } else {
        brokenLinks.push({
          sourceEntryId: e.id,
          sourceTitle: e.title,
          missingTitle: target
        });
      }
    }
  }

  const activeIdSet = new Set(active.map((e) => e.id));
  for (const rel of relations) {
    if (
      activeIdSet.has(rel.sourceEntryId) &&
      activeIdSet.has(rel.targetEntryId) &&
      rel.sourceEntryId !== rel.targetEntryId
    ) {
      connectedIds.add(rel.sourceEntryId);
      connectedIds.add(rel.targetEntryId);
    }
  }

  const orphanEntries = active
    .filter((e) => !connectedIds.has(e.id))
    .slice(0, 30)
    .map((e) => ({ id: e.id, title: e.title, slug: e.slug, sigil: e.sigil }));

  const byTypeCount = new Map<string, number>();
  const byCanonCount = new Map<string, number>();
  const byTierCount = new Map<string, { color: string; count: number }>();

  for (const e of active) {
    byTypeCount.set(e.entryTypeId, (byTypeCount.get(e.entryTypeId) ?? 0) + 1);
    const canon = e.canonStatus || "canon";
    byCanonCount.set(canon, (byCanonCount.get(canon) ?? 0) + 1);
    const et = typeMap.get(e.entryTypeId);
    if (entrySupportsPower(e, et)) {
      const tier = classifyPowerTier(e.powerLevel ?? 0, e.powerInfinite, e.powerTierOverride);
      const prev = byTierCount.get(tier.label);
      byTierCount.set(tier.label, { color: tier.color, count: (prev?.count ?? 0) + 1 });
    }
  }

  return {
    totalEntries: active.length,
    publishedEntries: active.filter((e) => e.status === "published").length,
    draftEntries: active.filter((e) => e.status === "draft").length,
    totalWords,
    avgWordsPerEntry: active.length > 0 ? Math.round(totalWords / active.length) : 0,
    completenessPercent: active.length > 0 ? Math.round(completenessScoreSum / active.length) : 0,
    totalRelations: relations.length,
    orphanEntries,
    brokenLinks: brokenLinks.slice(0, 40),
    byType: Array.from(byTypeCount.entries())
      .map(([typeId, count]) => {
        const t = typeMap.get(typeId);
        return {
          typeId,
          name: t?.name ?? "Khác",
          color: t?.color ?? "#D4AF37",
          count
        };
      })
      .sort((a, b) => b.count - a.count),
    byCanon: Array.from(byCanonCount.entries()).map(([status, count]) => ({ status, count })),
    byPowerTier: Array.from(byTierCount.entries()).map(([tier, info]) => ({
      tier,
      color: info.color,
      count: info.count
    }))
  };
}

/* ============================================================================
   6. CONLANG NAME & TOPONYM GENERATOR
   ============================================================================ */

export interface GeneratedConlangName {
  romanized: string;
  script: string;
  meaning: string;
  category: "character" | "city" | "kingdom" | "artifact";
}

const CATEGORY_MEANINGS: Record<GeneratedConlangName["category"], string[]> = {
  character: ["Kẻ Gác Sao", "Người Mang Lửa", "Hậu Duệ Sương Mù", "Kiếm Sĩ Hoàng Hôn", "Hiền Giả Cổ Đại", "Người Dệt Định Mệnh"],
  city: ["Thành Trì Ánh Sáng", "Cảng Biển Bạc", "Pháo Đài Băng Giá", "Thung Lũng Hoa Tuyết", "Tháp Vọng Thiên", "Chợ Đêm Cổ Ngữ"],
  kingdom: ["Đế Chế Nhật Thực", "Vương Quốc Sương Bạc", "Liên Minh Tinh Vân", "Triều Đại Ngọc Bích", "Công Quốc Hư Không", "Lãnh Địa Rừng Thiêng"],
  artifact: ["Vương Miện Vĩnh Hằng", "Thanh Kiếm Khai Thiên", "Ngọc Bội Thời Gian", "Cuốn Sách Khởi Nguyên", "Lồng Đèn Dẫn Hồn", "Chiếc Nhẫn Nhật Nguyệt"]
};

const PRESET_SYLLABLES: Record<string, { pre: string[]; mid: string[]; suf: string[] }> = {
  aethelian: { pre: ["Aeth", "Val", "Eld", "Ser", "Thal", "Cael"], mid: ["ar", "el", "or", "en", "is", "ul"], suf: ["ion", "gard", "ia", "dor", "eth", "is"] },
  celestial: { pre: ["Orak", "Lum", "Ast", "Cel", "Sol", "Mir"], mid: ["ae", "io", "ea", "ul", "yn", "ar"], suf: ["iel", "ora", "ium", "ael", "is", "on"] },
  nordic: { pre: ["Skal", "Frost", "Kjor", "Valk", "Bryn", "Hrim"], mid: ["ar", "ur", "en", "ig", "od", "al"], suf: ["heim", "fjord", "gar", "rik", "vald", "stein"] },
  solar: { pre: ["Heli", "Aur", "Sol", "Ign", "Rad", "Zeph"], mid: ["an", "or", "ia", "es", "um", "ar"], suf: ["os", "ara", "ius", "on", "en", "is"] },
  sylvan: { pre: ["Syl", "Fae", "Lyr", "Vyr", "Myr", "Thyr"], mid: ["el", "il", "ae", "yn", "or", "al"], suf: ["wen", "lor", "thil", "ia", "en", "is"] },
  void: { pre: ["Xyr", "Nyx", "Kha", "Vex", "Zul", "Qor"], mid: ["az", "ul", "ex", "or", "ik", "un"], suf: ["oth", "ak", "ul", "ix", "ar", "on"] }
};

export function generateConlangNames(
  lang: ConlangLanguage,
  category: GeneratedConlangName["category"],
  count = 6,
  seedOffset = 0
): GeneratedConlangName[] {
  const presetKey = lang.phonologyPreset && PRESET_SYLLABLES[lang.phonologyPreset] ? lang.phonologyPreset : "aethelian";
  const bank = PRESET_SYLLABLES[presetKey];
  const preList = lang.customPrefixes && lang.customPrefixes.length > 0 ? lang.customPrefixes : bank.pre;
  const sufList = lang.customSuffixes && lang.customSuffixes.length > 0 ? lang.customSuffixes : bank.suf;
  const meanings = CATEGORY_MEANINGS[category];

  const results: GeneratedConlangName[] = [];
  for (let i = 0; i < count; i++) {
    const idx = i + seedOffset * 7;
    const p = preList[idx % preList.length];
    const m = bank.mid[(idx * 3 + 1) % bank.mid.length];
    const s = sufList[(idx * 5 + 2) % sufList.length];
    const secondPart =
      category === "character"
        ? ` ${preList[(idx + 2) % preList.length]}${sufList[(idx + 3) % sufList.length]}`
        : "";
    const romanized = `${p}${m}${s}${secondPart}`;
    results.push({
      romanized,
      script: toAncientScript(romanized, lang.scriptStyle, lang.alphabet),
      meaning: meanings[idx % meanings.length],
      category
    });
  }
  return results;
}

/* ============================================================================
   7. PRINT-READY CODEX BOOK HTML EXPORTER
   ============================================================================ */

export function buildCodexBookHtml(options: {
  bookTitle: string;
  subtitle: string;
  author: string;
  preface: string;
  entries: Entry[];
  includePower: boolean;
  includeQuotes: boolean;
}): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const tocHtml = options.entries
    .map(
      (e, idx) =>
        `<li><span>${idx + 1}. ${esc(e.sigil)} ${esc(e.title)}</span><span class="toc-sub">${esc(e.subtitle || "")}</span></li>`
    )
    .join("\n");

  const chaptersHtml = options.entries
    .map((e, idx) => {
      const powerHtml =
        options.includePower && ((e.powerLevel ?? 0) > 0 || e.powerInfinite)
          ? `<div class="power-box"><strong>Power Level:</strong> ${esc(formatUnboundedPower(e.powerLevel ?? 0, e.powerInfinite))} · <em>${esc(classifyPowerTier(e.powerLevel ?? 0, e.powerInfinite).label)}</em>${
              e.attributes && e.attributes.length > 0
                ? `<div class="attr-grid">${e.attributes
                  .map(
                    (a) =>
                      `<span>${esc(a.label)}: <strong>${esc(formatUnboundedPower(a.value, false))}</strong></span>`
                  )
                  .join("")}</div>`
              : ""
          }</div>`
        : "";

      const quoteHtml =
        options.includeQuotes && e.epigraph?.quote
          ? `<blockquote>“${esc(e.epigraph.quote)}”<footer>— ${esc(e.epigraph.author || "Khuyết danh")}</footer></blockquote>`
          : "";

      const paragraphs = e.contentMarkdown
        .split(/\n{2,}/)
        .map((p) => `<p>${esc(p).replace(/\n/g, "<br/>")}</p>`)
        .join("\n");

      return `<article class="chapter">
        <h2>${idx + 1}. ${esc(e.sigil)} ${esc(e.title)}</h2>
        ${e.subtitle ? `<p class="subtitle">${esc(e.subtitle)}</p>` : ""}
        ${quoteHtml}
        ${e.summary ? `<p class="summary">${esc(e.summary)}</p>` : ""}
        ${powerHtml}
        <div class="body">${paragraphs}</div>
      </article>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>${esc(options.bookTitle)}</title>
<style>
  @page { margin: 20mm; size: A4; }
  body { font-family: Georgia, "Times New Roman", serif; color: #1e1810; background: #faf6ee; margin: 0; padding: 32px; line-height: 1.7; }
  .cover { text-align: center; padding: 80px 24px; border: 2px double #9a6b20; margin-bottom: 40px; page-break-after: always; }
  .cover h1 { font-size: 36px; margin: 0 0 12px; color: #2b1d0e; }
  .cover .sub { font-size: 16px; color: #6b5336; font-style: italic; }
  .cover .author { margin-top: 32px; font-weight: bold; letter-spacing: 0.08em; text-transform: uppercase; font-size: 13px; color: #9a6b20; }
  .preface { max-width: 560px; margin: 28px auto 0; text-align: left; font-size: 14px; color: #3c2f20; }
  .toc { page-break-after: always; }
  .toc h2 { border-bottom: 1px solid #c9b086; padding-bottom: 8px; }
  .toc ol { list-style: none; padding: 0; }
  .toc li { display: flex; justify-content: space-between; border-bottom: 1px dotted #d9c7a7; padding: 6px 0; font-size: 14px; }
  .toc-sub { color: #7a654a; font-size: 12px; }
  .chapter { page-break-before: always; margin-bottom: 36px; }
  .chapter h2 { font-size: 24px; color: #2b1d0e; border-bottom: 2px solid #9a6b20; padding-bottom: 6px; margin-bottom: 8px; }
  .subtitle { font-style: italic; color: #6b5336; margin-top: 0; }
  .summary { background: #f2ead8; padding: 12px 16px; border-left: 3px solid #9a6b20; font-size: 14px; }
  blockquote { margin: 16px 0; padding: 10px 16px; font-style: italic; border-left: 3px solid #786248; color: #4a3a26; }
  blockquote footer { font-size: 12px; margin-top: 4px; font-style: normal; }
  .power-box { background: #efe7d6; border: 1px solid #c9b086; padding: 12px 14px; margin: 14px 0; font-size: 13px; }
  .attr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 8px; }
  .body p { text-align: justify; margin: 10px 0; font-size: 14px; }
</style>
</head>
<body>
  <section class="cover">
    <h1>${esc(options.bookTitle)}</h1>
    <p class="sub">${esc(options.subtitle)}</p>
    <p class="author">Biên soạn: ${esc(options.author || "Aethel Codex")}</p>
    ${options.preface ? `<div class="preface">${esc(options.preface)}</div>` : ""}
  </section>
  <section class="toc">
    <h2>Mục Lục (${options.entries.length} hồ sơ)</h2>
    <ol>${tocHtml}</ol>
  </section>
  ${chaptersHtml}
</body>
</html>`;
}
