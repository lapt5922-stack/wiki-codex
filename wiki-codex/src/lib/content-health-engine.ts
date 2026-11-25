import fs from "fs";
import path from "path";
import { loadState } from "@/db/repository";
import { loadCharacterState } from "@/db/character-repository";
import { queryKingdoms } from "@/db/kingdom-repository";
import { loadUniversalRelationsStore } from "@/db/universal-relations-repo";
import { normalizeVietnamese } from "@/lib/vietnamese";
import { extractWikilinks } from "@/lib/wikilinks";

export type HealthRuleCode =
  | "missing_required_fields"
  | "missing_image"
  | "broken_link"
  | "duplicate_name"
  | "invalid_relation"
  | "missing_event_date"
  | "timeline_inconsistency"
  | "missing_source"
  | "conflicting_data";

export type HealthSeverity = "critical" | "warning" | "info";
export type HealthResolutionStatus = "open" | "acknowledged" | "resolved";

export interface ContentHealthIssue {
  id: string;
  rule: HealthRuleCode;
  ruleLabel: string;
  severity: HealthSeverity;
  entityId: string;
  entityTitle: string;
  entityKind: "entry" | "character" | "kingdom" | "relation" | "event";
  description: string;
  suggestion: string;
  status: HealthResolutionStatus;
}

export interface ContentHealthSummary {
  workspaceId: string;
  generatedAt: string;
  totalIssues: number;
  bySeverity: Record<HealthSeverity, number>;
  byRule: Record<HealthRuleCode, number>;
  issues: ContentHealthIssue[];
}

const RULE_LABELS: Record<HealthRuleCode, string> = {
  missing_required_fields: "Thiếu trường quan trọng",
  missing_image: "Chưa có hình ảnh minh họa",
  broken_link: "Liên kết bị hỏng",
  duplicate_name: "Nghi trùng tên thực thể",
  invalid_relation: "Quan hệ không hợp lệ",
  missing_event_date: "Sự kiện thiếu mốc thời gian",
  timeline_inconsistency: "Mâu thuẫn dòng thời gian",
  missing_source: "Thiếu nguồn tham khảo",
  conflicting_data: "Dữ liệu mâu thuẫn"
};

import { getPostgresPool, isPostgresConfigured } from "@/db/pool";

const RES_FILE = path.join(process.cwd(), ".data", "health-resolutions.json");
let cachedResolutions: Record<string, HealthResolutionStatus> | null = null;
let pgResInit = false;

async function ensurePgHealthTable() {
  if (pgResInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_health_resolutions_blob (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgResInit = true;
}

function loadResolutionsSync(): Record<string, HealthResolutionStatus> {
  if (cachedResolutions) return cachedResolutions;
  if (!fs.existsSync(RES_FILE)) {
    cachedResolutions = {};
    return cachedResolutions;
  }
  try {
    cachedResolutions = JSON.parse(fs.readFileSync(RES_FILE, "utf8")) as Record<
      string,
      HealthResolutionStatus
    >;
    return cachedResolutions;
  } catch {
    cachedResolutions = {};
    return cachedResolutions;
  }
}

export async function loadHealthResolutionsAsync(): Promise<Record<string, HealthResolutionStatus>> {
  if (isPostgresConfigured()) {
    try {
      await ensurePgHealthTable();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query(
          `SELECT payload FROM codex_health_resolutions_blob WHERE id = 'primary' LIMIT 1`
        );
        if (res.rows[0]?.payload && typeof res.rows[0].payload === "object") {
          cachedResolutions = res.rows[0].payload as Record<string, HealthResolutionStatus>;
          return cachedResolutions;
        }
      }
    } catch {
      // fall through to local file
    }
  }
  return loadResolutionsSync();
}

async function persistResolutionsToPostgres(map: Record<string, HealthResolutionStatus>) {
  if (!isPostgresConfigured()) return;
  try {
    await ensurePgHealthTable();
    const pool = getPostgresPool();
    if (pool) {
      await pool.query(
        `INSERT INTO codex_health_resolutions_blob (id, payload, updated_at)
         VALUES ('primary', $1::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
        [JSON.stringify(map)]
      );
    }
  } catch {
    // ignore background sync failure
  }
}

function writeResolutionsLocalAtomic(map: Record<string, HealthResolutionStatus>) {
  try {
    const dir = path.dirname(RES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const json = JSON.stringify(map, null, 2);
    const tmp = `${RES_FILE}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, json, "utf8");
    fs.renameSync(tmp, RES_FILE);
  } catch {
    try {
      fs.writeFileSync(RES_FILE, JSON.stringify(map, null, 2), "utf8");
    } catch {
      // ignore
    }
  }
}

export function setHealthIssueResolution(
  issueId: string,
  status: HealthResolutionStatus
): Record<string, HealthResolutionStatus> {
  const map = { ...loadResolutionsSync(), [issueId]: status };
  cachedResolutions = map;
  writeResolutionsLocalAtomic(map);
  void persistResolutionsToPostgres(map);
  return map;
}

export async function setHealthIssueResolutionAsync(
  issueId: string,
  status: HealthResolutionStatus
): Promise<Record<string, HealthResolutionStatus>> {
  const current = await loadHealthResolutionsAsync();
  const map = { ...current, [issueId]: status };
  cachedResolutions = map;
  writeResolutionsLocalAtomic(map);
  await persistResolutionsToPostgres(map);
  return map;
}

export async function saveAllHealthResolutions(
  map: Record<string, HealthResolutionStatus>
): Promise<void> {
  cachedResolutions = { ...map };
  writeResolutionsLocalAtomic(cachedResolutions);
  await persistResolutionsToPostgres(cachedResolutions);
}

/**
 * Runs all 9 Content Health & Data Validation rules across the entire Aethel Codex dataset.
 * Never mutates official data — only reports actionable diagnostics with severity & suggestions.
 */
export async function runContentHealthAudit(workspaceId: string): Promise<ContentHealthSummary> {
  const [wikiState, charState, kingRes, relStore] = await Promise.all([
    loadState(),
    loadCharacterState(),
    queryKingdoms({ workspaceId, role: "admin", page: 1, limit: 500 }),
    loadUniversalRelationsStore()
  ]);

  const resolutions = await loadHealthResolutionsAsync();
  const issues: ContentHealthIssue[] = [];

  const pushIssue = (
    rule: HealthRuleCode,
    severity: HealthSeverity,
    entityId: string,
    entityTitle: string,
    entityKind: ContentHealthIssue["entityKind"],
    description: string,
    suggestion: string
  ) => {
    const id = `${rule}::${entityKind}::${entityId}`;
    issues.push({
      id,
      rule,
      ruleLabel: RULE_LABELS[rule],
      severity,
      entityId,
      entityTitle,
      entityKind,
      description,
      suggestion,
      status: resolutions[id] || "open"
    });
  };

  const wsEntries = wikiState.entries.filter((e) => e.workspaceId === workspaceId && !e.deletedAt);
  const wsChars = charState.characters.filter((c) => c.workspaceId === workspaceId && !c.deletedAt);
  const wsEvents = wikiState.timelineEvents.filter((ev) => ev.workspaceId === workspaceId);
  const wsRelations = relStore.relations.filter((r) => r.workspaceId === workspaceId);

  // Build known entity lookup tables
  const validTitles = new Set<string>();
  const validIds = new Set<string>();
  for (const e of wsEntries) {
    validIds.add(e.id);
    validTitles.add(normalizeVietnamese(e.title));
    validTitles.add(e.slug.toLowerCase());
    for (const al of e.aliases ?? []) validTitles.add(normalizeVietnamese(al));
  }
  for (const c of wsChars) {
    validIds.add(c.id);
    validTitles.add(normalizeVietnamese(c.fullName));
  }
  for (const k of kingRes.items) {
    validIds.add(k.id);
    validTitles.add(normalizeVietnamese(k.officialName));
    validTitles.add(normalizeVietnamese(k.commonName));
  }

  // 1, 2, 3, 4, 8 on Wiki Entries (skip bulk 360 auto-generated nations for missing_image noise)
  const seenNames = new Map<string, { id: string; title: string }>();
  for (const e of wsEntries) {
    const isAutoNation = e.id.startsWith("ent-nation-");
    const normTitle = normalizeVietnamese(e.title);

    // Rule 4: duplicate_name
    const prev = seenNames.get(normTitle);
    if (prev && prev.id !== e.id) {
      pushIssue(
        "duplicate_name",
        "warning",
        e.id,
        e.title,
        "entry",
        `Trùng tên chuẩn hóa với hồ sơ "${prev.title}" (${prev.id}).`,
        "Kiểm tra xem có phải hồ sơ trùng lặp cần gộp hoặc đặt biệt danh phân biệt không."
      );
    } else {
      seenNames.set(normTitle, { id: e.id, title: e.title });
    }

    // Rule 1: missing_required_fields
    if (!e.summary?.trim() || e.contentMarkdown.trim().length < 25) {
      pushIssue(
        "missing_required_fields",
        "warning",
        e.id,
        e.title,
        "entry",
        "Thiếu phần tóm tắt hoặc nội dung bách khoa quá ngắn (< 25 ký tự).",
        "Bổ sung tóm tắt và nội dung học thuật cơ bản trong trình soạn thảo."
      );
    }

    // Rule 2: missing_image (for non-auto-generated entries)
    if (!isAutoNation && !e.coverImage && !e.thumbImage) {
      pushIssue(
        "missing_image",
        "info",
        e.id,
        e.title,
        "entry",
        "Hồ sơ chưa có ảnh bìa hoặc ảnh thu nhỏ minh họa.",
        "Sử dụng nút Tải ảnh từ máy trong trình soạn thảo để bổ sung hình ảnh."
      );
    }

    // Rule 3: broken_link ([[Wikilinks]])
    if (e.contentMarkdown.includes("[[")) {
      const broken: string[] = [];
      for (const link of extractWikilinks(e.contentMarkdown)) {
        const key = normalizeVietnamese(link.targetTitle);
        if (!validTitles.has(key) && !validTitles.has(link.targetTitle.toLowerCase())) {
          broken.push(link.targetTitle);
        }
      }
      if (broken.length > 0) {
        pushIssue(
          "broken_link",
          "critical",
          e.id,
          e.title,
          "entry",
          `Chứa ${broken.length} liên kết [[Wikilink]] trỏ tới hồ sơ chưa tồn tại: ${broken.slice(0, 3).join(", ")}.`,
          "Tạo hồ sơ còn thiếu hoặc sửa lại tên liên kết cho khớp."
        );
      }
    }

    // Rule 8: missing_source (for published canon entries)
    if (!isAutoNation && e.status === "published" && e.canonStatus === "canon" && !e.sourcesMarkdown?.trim()) {
      pushIssue(
        "missing_source",
        "info",
        e.id,
        e.title,
        "entry",
        "Hồ sơ Canon đã xuất bản nhưng chưa ghi nhận nguồn tham khảo.",
        "Bổ sung mục Nguồn & Ghi chú để tăng độ tin cậy học thuật."
      );
    }
  }

  // Rules 1, 2, 7, 9 on Character Codex
  for (const c of wsChars) {
    if (!c.summary?.trim() || !c.race?.trim()) {
      pushIssue(
        "missing_required_fields",
        "warning",
        c.id,
        c.fullName,
        "character",
        "Hồ sơ nhân vật thiếu tóm tắt hoặc chủng tộc.",
        "Cập nhật nhóm Nhận diện trong Character Editor."
      );
    }
    if (!c.portraitUrl && !c.coverUrl) {
      pushIssue(
        "missing_image",
        "info",
        c.id,
        c.fullName,
        "character",
        "Nhân vật chưa có ảnh chân dung hoặc ảnh bìa.",
        "Tải ảnh trực tiếp trong Tab 1 của Character Editor."
      );
    }
    // Rule 7: timeline_inconsistency
    if (
      typeof c.birthYear === "number" &&
      typeof c.deathYear === "number" &&
      c.deathYear < c.birthYear
    ) {
      pushIssue(
        "timeline_inconsistency",
        "critical",
        c.id,
        c.fullName,
        "character",
        `Năm mất (${c.deathYear}) nhỏ hơn năm sinh (${c.birthYear}).`,
        "Kiểm tra và chỉnh lại mốc năm sinh / năm mất cho hợp logic lịch sử."
      );
    }
    // Rule 9: conflicting_data
    if (c.lifeStatus === "alive" && typeof c.deathYear === "number") {
      pushIssue(
        "conflicting_data",
        "warning",
        c.id,
        c.fullName,
        "character",
        `Trạng thái đang là "Còn sống" nhưng lại có Năm mất (${c.deathYear}).`,
        "Đồng bộ lại trạng thái sống/chết hoặc xóa năm mất nếu nhân vật còn sống."
      );
    }
  }

  // Rule 5: invalid_relation on Universal Relations
  for (const r of wsRelations) {
    if (r.sourceId === r.targetId) {
      pushIssue(
        "invalid_relation",
        "critical",
        r.id,
        `${r.sourceTitle} → ${r.targetTitle}`,
        "relation",
        "Quan hệ tự trỏ vào chính mình (sourceId === targetId).",
        "Xóa hoặc sửa lại thực thể đích trong Relationship Manager."
      );
    } else if (!validIds.has(r.sourceId) || !validIds.has(r.targetId)) {
      pushIssue(
        "invalid_relation",
        "warning",
        r.id,
        `${r.sourceTitle} → ${r.targetTitle}`,
        "relation",
        `Quan hệ tham chiếu tới ID chưa tìm thấy trong kho dữ liệu (${r.sourceId} / ${r.targetId}).`,
        "Kiểm tra lại mã ID nguồn/đích trong Relationship Manager."
      );
    }
  }

  // Rule 6: missing_event_date on Timeline Events
  for (const ev of wsEvents) {
    if (!ev.dateLabel?.trim() || Number.isNaN(Number(ev.sortYear))) {
      pushIssue(
        "missing_event_date",
        "warning",
        ev.id,
        ev.title,
        "event",
        "Sự kiện biên niên sử thiếu nhãn thời gian hoặc năm sắp xếp.",
        "Bổ sung mốc thời gian cụ thể trong Living History / Timeline."
      );
    }
  }

  const bySeverity: Record<HealthSeverity, number> = { critical: 0, warning: 0, info: 0 };
  const byRule: Record<HealthRuleCode, number> = {
    missing_required_fields: 0,
    missing_image: 0,
    broken_link: 0,
    duplicate_name: 0,
    invalid_relation: 0,
    missing_event_date: 0,
    timeline_inconsistency: 0,
    missing_source: 0,
    conflicting_data: 0
  };

  for (const iss of issues) {
    bySeverity[iss.severity] += 1;
    byRule[iss.rule] += 1;
  }

  return {
    workspaceId,
    generatedAt: new Date().toISOString(),
    totalIssues: issues.length,
    bySeverity,
    byRule,
    issues: issues.slice(0, 200)
  };
}
