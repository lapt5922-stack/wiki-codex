import type { Entry, EntryCardProjection } from "@/types/codex";
import { linkFirstMention } from "./wikilinks";

export interface TocHeading {
  level: 2 | 3;
  text: string;
  slug: string;
}

export interface ReadingStats {
  words: number;
  minutes: number;
  wikilinks: number;
  footnotes: number;
}

export interface CompletenessCheckItem {
  key: string;
  label: string;
  passed: boolean;
  hint: string;
}

export interface EntryCompletenessReport {
  score: number;
  tierLabel: string;
  checks: CompletenessCheckItem[];
}

export interface LineDiffItem {
  type: "same" | "add" | "remove";
  line: string;
}

export interface MarkdownFootnote {
  id: string;
  text: string;
}

export function slugifyHeading(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "muc";
}

export function extractMarkdownToc(markdown: string): TocHeading[] {
  const headings: TocHeading[] = [];
  const usedSlugs = new Map<string, number>();
  let inCodeBlock = false;

  for (const rawLine of (markdown || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const m = /^(#{2,3})\s+(.+)$/.exec(line);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].replace(/\s+#+\s*$/, "").trim();
    if (!text) continue;

    const base = slugifyHeading(text);
    const count = usedSlugs.get(base) ?? 0;
    usedSlugs.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;

    headings.push({ level, text, slug });
  }

  return headings;
}

export function extractFootnotes(markdown: string): MarkdownFootnote[] {
  const notes: MarkdownFootnote[] = [];
  const seen = new Set<string>();
  const re = /^\[\^([^\]]+)\]:\s*(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown || "")) !== null) {
    const id = match[1].trim();
    const text = match[2].trim();
    if (id && text && !seen.has(id)) {
      seen.add(id);
      notes.push({ id, text });
    }
  }
  return notes;
}

export function estimateReadingStats(markdown: string): ReadingStats {
  const clean = (markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*_`>|[\]()]/g, " ")
    .trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 220));
  const wikilinks = ((markdown || "").match(/\[\[[^\]]+\]\]/g) || []).length;
  const footnotes = extractFootnotes(markdown).length;
  return { words, minutes, wikilinks, footnotes };
}

export function computeEntryCompleteness(
  entry: Pick<
    Entry,
    | "summary"
    | "contentMarkdown"
    | "customFields"
    | "extraFields"
    | "sourcesMarkdown"
    | "categoryId"
    | "tags"
    | "coverImage"
  >,
): EntryCompletenessReport {
  const stats = estimateReadingStats(entry.contentMarkdown || "");
  const headings = extractMarkdownToc(entry.contentMarkdown || "");
  const hasInfoboxProps =
    Object.keys(entry.customFields || {}).length > 0 ||
    (entry.extraFields || []).length > 0;
  const hasSources =
    Boolean(entry.sourcesMarkdown && entry.sourcesMarkdown.trim().length > 8) ||
    stats.footnotes > 0;
  const hasTaxonomy =
    Boolean(entry.categoryId) ||
    (entry.tags || []).length > 0 ||
    Boolean(entry.coverImage);

  const checks: CompletenessCheckItem[] = [
    {
      key: "summary",
      label: "Tóm tắt bách khoa",
      passed: Boolean(entry.summary && entry.summary.trim().length >= 24),
      hint: "Thêm tóm tắt ngắn gọn (≥ 24 ký tự) giúp đọc nhanh ở Kho Hồ sơ.",
    },
    {
      key: "depth",
      label: "Chiều sâu nội dung & Phân mục H2",
      passed: stats.words >= 100 && headings.length >= 1,
      hint: "Viết tối thiểu 100 từ và chia ít nhất 1 đề mục ## H2.",
    },
    {
      key: "wikilinks",
      label: "Liên kết chéo [[Wikilink]]",
      passed: stats.wikilinks >= 2,
      hint: "Gắn ít nhất 2 liên kết [[Thực thể]] để kết nối Đồ thị Tri thức.",
    },
    {
      key: "infobox",
      label: "Thuộc tính Infobox / Dữ liệu cấu trúc",
      passed: hasInfoboxProps,
      hint: "Bổ sung ít nhất 1 trường dữ liệu động trong bảng Infobox.",
    },
    {
      key: "sources",
      label: "Nguồn trích dẫn / Footnote [^1]",
      passed: hasSources,
      hint: "Ghi nguồn tham khảo hoặc dùng chú thích [^1]: ... để tăng độ tin cậy.",
    },
    {
      key: "taxonomy",
      label: "Phân loại Danh mục / Thẻ / Ảnh bìa",
      passed: hasTaxonomy,
      hint: "Gắn danh mục, thẻ tag hoặc ảnh bìa cho hồ sơ.",
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const tierLabel =
    score >= 90
      ? "Chuẩn Bách Khoa"
      : score >= 65
        ? "Khá Đầy Đủ"
        : score >= 35
          ? "Đang Phát Triển"
          : "Bản Sơ Khai";

  return { score, tierLabel, checks };
}

/**
 * Clean line-by-line LCS diff for Revision Diff Viewer.
 */
export function computeLineDiff(oldText: string, newText: string): LineDiffItem[] {
  const a = (oldText || "").split(/\r?\n/);
  const b = (newText || "").split(/\r?\n/);
  const m = a.length;
  const n = b.length;

  // Guard huge documents to stay instant on main thread
  if (m * n > 90_000) {
    const out: LineDiffItem[] = [];
    const maxLen = Math.max(m, n);
    for (let i = 0; i < maxLen; i++) {
      if (a[i] === b[i]) {
        if (a[i] !== undefined) out.push({ type: "same", line: a[i] });
      } else {
        if (a[i] !== undefined) out.push({ type: "remove", line: a[i] });
        if (b[i] !== undefined) out.push({ type: "add", line: b[i] });
      }
    }
    return out;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: LineDiffItem[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ type: "same", line: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: "remove", line: a[i] });
      i++;
    } else {
      result.push({ type: "add", line: b[j] });
      j++;
    }
  }
  while (i < m) result.push({ type: "remove", line: a[i++] });
  while (j < n) result.push({ type: "add", line: b[j++] });

  return result;
}

/**
 * 1-Click Auto-Wikilink: links the first unlinked occurrence of each matching Wiki entry
 * (sorted longest title first to prevent partial-word collisions).
 */
export function autoLinkAllUnlinkedMentions(
  markdown: string,
  candidates: Array<Pick<EntryCardProjection, "id" | "title">>,
  currentEntryId: string,
): { markdown: string; linkedTitles: string[] } {
  let updated = markdown || "";
  const linkedTitles: string[] = [];

  const sorted = [...candidates]
    .filter((c) => c.id !== currentEntryId && c.title.trim().length >= 3)
    .sort((a, b) => b.title.length - a.title.length);

  for (const cand of sorted) {
    const next = linkFirstMention(updated, cand.title);
    if (next !== updated) {
      updated = next;
      linkedTitles.push(cand.title);
    }
  }

  return { markdown: updated, linkedTitles };
}
