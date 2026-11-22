/**
 * Vietnamese text utilities:
 * - Accent-insensitive normalization (tìm kiếm tiếng Việt không dấu)
 * - Clean URL slug generation
 * - Word counting & snippet highlighting
 */

export function normalizeVietnamese(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyVietnamese(input: string): string {
  const norm = normalizeVietnamese(input);
  const slug = norm
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "muc-codex";
}

export function matchesVietnameseQuery(haystack: string, query: string): boolean {
  const q = normalizeVietnamese(query);
  if (!q) return true;
  const h = normalizeVietnamese(haystack);
  const tokens = q.split(" ").filter(Boolean);
  return tokens.every((token) => h.includes(token));
}

export function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`[\]()|:-]+/g, " ")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

export function buildExcerpt(markdown: string, maxLength = 160): string {
  const plain = markdown
    .replace(/:::spoiler[^\n]*\n[\s\S]*?:::/g, "[Nội dung ẩn]")
    .replace(/:::conlang\s*([\s\S]*?):::/g, "$1")
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[#>*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength - 1).trimEnd() + "…";
}
