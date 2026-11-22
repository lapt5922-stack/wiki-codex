import type {
  Entry,
  EntryCardProjection,
  EntryRelation,
  TimelineEvent,
} from "@/types/codex";
import type { ContinentId, PlanetaryNation } from "./planetary-atlas/types";
import { CONTINENT_NAME_VI } from "./planetary-atlas/nations-data";

export interface ChronologyParadox {
  id: string;
  severity: "warning" | "error";
  title: string;
  detail: string;
}

export interface AsymmetricRelationIssue {
  relationId: string;
  kind: "dead_link" | "asymmetric_alliance";
  detail: string;
}

export interface NationToponymyReport {
  nationNum: number;
  name: string;
  shortName: string;
  capital: string;
  prefixMeaning: string;
  linguisticFamily: string;
  capitalEtymology: string;
}

/**
 * #29 Chronology Paradox Detector
 */
export function detectChronologyParadoxes(
  events: TimelineEvent[],
  entries: Array<Pick<Entry, "id" | "title" | "eraSnapshots">>,
): ChronologyParadox[] {
  const issues: ChronologyParadox[] = [];
  const entryIds = new Set(entries.map((e) => e.id));

  for (const ev of events) {
    if (!Number.isFinite(ev.sortYear)) {
      issues.push({
        id: `paradox-year-${ev.id}`,
        severity: "error",
        title: `Sự kiện "${ev.title}" thiếu năm hợp lệ`,
        detail: `Trường sortYear không hợp lệ (${String(ev.sortYear)}).`,
      });
    }
    for (const eid of ev.entryIds || []) {
      if (!entryIds.has(eid)) {
        issues.push({
          id: `paradox-ref-${ev.id}-${eid}`,
          severity: "warning",
          title: `Sự kiện "${ev.title}" trỏ tới hồ sơ không tồn tại`,
          detail: `Mã hồ sơ "${eid}" đã bị xóa hoặc chưa được tạo.`,
        });
      }
    }
  }

  for (const ent of entries) {
    const snaps = ent.eraSnapshots || [];
    for (let i = 1; i < snaps.length; i++) {
      const prevYear = Number(/-?\d+/.exec(snaps[i - 1].yearLabel)?.[0]);
      const currYear = Number(/-?\d+/.exec(snaps[i].yearLabel)?.[0]);
      if (Number.isFinite(prevYear) && Number.isFinite(currYear) && currYear < prevYear) {
        issues.push({
          id: `paradox-era-${ent.id}-${i}`,
          severity: "warning",
          title: `Thứ tự thời kỳ ngược tại "${ent.title}"`,
          detail: `Mốc "${snaps[i].yearLabel}" đứng sau mốc "${snaps[i - 1].yearLabel}" nhưng năm nhỏ hơn.`,
        });
      }
    }
  }

  return issues;
}

/**
 * #30 Asymmetric & Dead Relation Auditor
 */
export function auditAsymmetricRelations(
  relations: EntryRelation[],
  entries: Array<Pick<Entry, "id" | "title">>,
): AsymmetricRelationIssue[] {
  const byId = new Map(entries.map((e) => [e.id, e.title]));
  const issues: AsymmetricRelationIssue[] = [];
  const pairSet = new Set(relations.map((r) => `${r.sourceEntryId}->${r.targetEntryId}`));

  for (const r of relations) {
    const srcName = byId.get(r.sourceEntryId);
    const tgtName = byId.get(r.targetEntryId);
    if (!srcName || !tgtName) {
      issues.push({
        relationId: r.id,
        kind: "dead_link",
        detail: `Quan hệ "${r.relationType}" (${r.sourceEntryId} → ${r.targetEntryId}) có hồ sơ không tồn tại.`,
      });
      continue;
    }
    const lowerType = r.relationType.toLowerCase();
    const isSymmetricType =
      lowerType.includes("đồng minh") ||
      lowerType.includes("liên minh") ||
      lowerType.includes("đối tác");
    if (isSymmetricType && !pairSet.has(`${r.targetEntryId}->${r.sourceEntryId}`)) {
      issues.push({
        relationId: r.id,
        kind: "asymmetric_alliance",
        detail: `Quan hệ "${r.relationType}" từ "${srcName}" → "${tgtName}" chưa có chiều ngược lại.`,
      });
    }
  }
  return issues;
}

/**
 * #33 Toponymy & Etymology Explorer for 360 Nations
 */
const LINGUISTIC_FAMILY_BY_CONT: Record<ContinentId, string> = {
  AURELIA: "Ngữ hệ Trung Tâm Aurelian (Valorian – Kothric – Ignic)",
  OCCIDENTALIS: "Ngữ hệ Phương Tây Occident – Ngân Hà",
  ORIENTIS: "Ngữ hệ Đông Hoa Cổ – Long Mạch",
  AUSTRALIS: "Ngữ hệ Nam Dương Austral – Opalic",
  HESPERIA: "Ngữ hệ Tây Bắc Hesperic – Tùng Bách",
  SOLARA: "Ngữ hệ Xích Đạo Solari – Lục Bảo",
  ARCTIC_ICE: "Ngữ hệ Cực Quang Boreal",
  ANTARCTIC_ICE: "Ngữ hệ Hàn Lâm Khoa Học Nam Cực",
  OCEANIC: "Ngữ hệ Hải Đảo Pelagic",
};

export function analyzeNationToponymy(nation: PlanetaryNation): NationToponymyReport {
  const name = nation.name;
  let prefixMeaning = "Chính thể địa lý khu vực";
  if (name.startsWith("Liên bang")) prefixMeaning = "Liên bang các tỉnh/bang tự trị cùng hiến chương chung";
  else if (name.startsWith("Đế chế") || name.startsWith("Thiên Triều")) prefixMeaning = "Đại quốc trung ương tập quyền lâu đời";
  else if (name.startsWith("Liên minh") || name.startsWith("Liên xã")) prefixMeaning = "Hiệp ước liên kết giữa nhiều công xã hoặc đô thị";
  else if (name.startsWith("Cộng hòa")) prefixMeaning = "Thể chế cộng hòa nghị viện và hội đồng dân biểu";
  else if (name.startsWith("Vương quốc")) prefixMeaning = "Quốc gia quân chủ lập hiến có truyền thống vương thất";
  else if (name.startsWith("Công quốc") || name.startsWith("Hầu quốc")) prefixMeaning = "Lãnh địa tự trị có quy mô vừa và truyền thống địa phương";
  else if (name.startsWith("Thành bang") || name.startsWith("Thương cảng")) prefixMeaning = "Đô thị tự do lấy thương mại và học thuật làm trung tâm";
  else if (name.startsWith("Đặc khu") || name.startsWith("Học Viện") || name.startsWith("Vùng Đệm")) prefixMeaning = "Khu vực trung lập liên quốc gia chuyên về lưu trữ & ngoại giao";

  const cap = nation.capital;
  let capitalEtymology = `Đô thị trung tâm vùng ${nation.regionName} (${CONTINENT_NAME_VI[nation.continent]}).`;
  if (/port|haven|bay|cảng|bến/i.test(cap)) {
    capitalEtymology = `Hậu tố "-port / -haven / Cảng" chỉ thương cảng ven biển hoặc bến giao thương trọng yếu.`;
  } else if (/hold|keep|burg|thành|đô|kinh/i.test(cap)) {
    capitalEtymology = `Hậu tố "-hold / -burg / Thành / Đô" bắt nguồn từ trung tâm hành chính cổ xây bằng đá.`;
  } else if (/spire|hall|đỉnh|lĩnh/i.test(cap)) {
    capitalEtymology = `Hậu tố "-spire / -hall / Đỉnh" gắn với tháp lưu trữ, đài quan trắc hoặc đô thị cao nguyên.`;
  } else if (/is|ia|ion$/i.test(cap)) {
    capitalEtymology = `Hậu tố cổ điển "-ia / -is / -ion" đặc trưng cho danh xưng đô thị học thuật vùng ${CONTINENT_NAME_VI[nation.continent]}.`;
  }

  return {
    nationNum: nation.nationNum,
    name: nation.name,
    shortName: nation.shortName,
    capital: nation.capital,
    prefixMeaning,
    linguisticFamily: `${LINGUISTIC_FAMILY_BY_CONT[nation.continent]} (${nation.primaryLanguage})`,
    capitalEtymology,
  };
}

/**
 * #34 Smart Related-Article Recommender
 */
export function recommendRelatedEntries(
  current: Pick<Entry, "id" | "categoryId" | "tags" | "contentMarkdown">,
  candidates: EntryCardProjection[],
  limit = 5,
): EntryCardProjection[] {
  const currentTags = new Set((current.tags || []).map((t) => t.toLowerCase()));
  const scored = candidates
    .filter((c) => c.id !== current.id && !c.deletedAt)
    .map((c) => {
      let score = 0;
      if (current.categoryId && c.categoryId === current.categoryId) score += 3;
      for (const tag of c.tags || []) {
        if (currentTags.has(tag.toLowerCase())) score += 2;
      }
      if ((current.contentMarkdown || "").includes(`[[${c.title}`)) score += 5;
      return { item: c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((x) => x.item);
}

/**
 * #32 Global Safe Rename: updates [[OldTitle]] and [[OldTitle|Alias]] across markdown
 */
export function renameWikilinkAcrossMarkdown(
  markdown: string,
  oldTitle: string,
  newTitle: string,
): string {
  if (!oldTitle.trim() || !newTitle.trim() || oldTitle === newTitle) return markdown;
  const escaped = oldTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\[\\[${escaped}(\\|[^\\]]+)?\\]\\]`, "g");
  return (markdown || "").replace(re, (_m, aliasPart) => `[[${newTitle}${aliasPart || ""}]]`);
}

/**
 * #31 Batch CSV Entry Parser (title,summary,tags,markdown)
 */
export function parseBatchEntriesCsv(csvText: string): Array<{
  title: string;
  summary: string;
  tags: string[];
  contentMarkdown: string;
}> {
  const lines = (csvText || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const splitRow = (row: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const results: Array<{
    title: string;
    summary: string;
    tags: string[];
    contentMarkdown: string;
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    const title = cols[0];
    if (!title) continue;
    const summary = cols[1] || `Hồ sơ bách khoa ${title}.`;
    const tags = (cols[2] || "")
      .split(/[;|]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const contentMarkdown =
      cols[3] || `## Tổng quan\n\n${summary}\n\n## Chi tiết\n\nĐang bổ sung tư liệu.`;
    results.push({ title, summary, tags, contentMarkdown });
  }

  return results;
}
