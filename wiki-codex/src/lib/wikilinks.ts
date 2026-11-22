import type { BacklinkItem, Entry, UnlinkedMention } from "@/types/codex";
import { normalizeVietnamese } from "./vietnamese";

export interface ParsedWikilink {
  raw: string;
  targetTitle: string;
  displayLabel: string;
  index: number;
}

export interface HeadingTocItem {
  id: string;
  level: number;
  text: string;
}

const WIKILINK_REGEX = /\[\[([^|\]]+?)(?:\|([^\]]+?))?\]\]/g;

export function extractWikilinks(markdown: string): ParsedWikilink[] {
  if (!markdown) return [];
  const results: ParsedWikilink[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(WIKILINK_REGEX.source, "g");
  while ((match = regex.exec(markdown)) !== null) {
    const targetTitle = match[1].trim();
    const displayLabel = (match[2] ?? match[1]).trim();
    if (targetTitle) {
      results.push({
        raw: match[0],
        targetTitle,
        displayLabel,
        index: match.index
      });
    }
  }
  return results;
}

export function extractHeadings(markdown: string): HeadingTocItem[] {
  if (!markdown) return [];
  const lines = markdown.split(/\r?\n/);
  const items: HeadingTocItem[] = [];
  let inCode = false;
  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      const text = m[2].replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b || a).trim();
      const id =
        "sec-" +
        normalizeVietnamese(text)
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-");
      items.push({ id, level: m[1].length, text });
    }
  }
  return items;
}

function buildSnippet(markdown: string, index: number, length: number): string {
  const start = Math.max(0, index - 65);
  const end = Math.min(markdown.length, index + length + 65);
  const raw = markdown.slice(start, end).replace(/\s+/g, " ").trim();
  const prefix = start > 0 ? "…" : "";
  const suffix = end < markdown.length ? "…" : "";
  return `${prefix}${raw}${suffix}`;
}

/**
 * Find all entries in the same workspace that link to `targetEntry` via [[Title]], [[Slug]], or [[Alias]].
 */
export function computeBacklinks(
  targetEntry: Pick<Entry, "id" | "title" | "slug" | "aliases">,
  allWorkspaceEntries: Pick<Entry, "id" | "title" | "slug" | "sigil" | "contentMarkdown" | "deletedAt">[]
): BacklinkItem[] {
  const targetKeys = new Set<string>([
    normalizeVietnamese(targetEntry.title),
    targetEntry.slug.toLowerCase(),
    ...(targetEntry.aliases ?? []).map((a) => normalizeVietnamese(a)).filter(Boolean)
  ]);
  const backlinks: BacklinkItem[] = [];

  for (const entry of allWorkspaceEntries) {
    if (entry.deletedAt || entry.id === targetEntry.id) continue;
    const links = extractWikilinks(entry.contentMarkdown);
    const hit = links.find(
      (l) =>
        targetKeys.has(normalizeVietnamese(l.targetTitle)) ||
        targetKeys.has(l.targetTitle.toLowerCase())
    );
    if (hit) {
      backlinks.push({
        sourceEntryId: entry.id,
        sourceSlug: entry.slug,
        sourceTitle: entry.title,
        sourceSigil: entry.sigil || "✦",
        contextSnippet: buildSnippet(entry.contentMarkdown, hit.index, hit.raw.length)
      });
    }
  }

  return backlinks;
}

/**
 * Detect unlinked mentions of other entry titles or aliases inside `currentEntry.contentMarkdown`.
 * Accent-insensitive matching, skips already-linked targets and very short (<3 chars) titles.
 */
export function findUnlinkedMentions(
  currentEntry: Pick<Entry, "id" | "contentMarkdown">,
  allWorkspaceEntries: Pick<Entry, "id" | "title" | "slug" | "aliases" | "deletedAt">[]
): UnlinkedMention[] {
  if (!currentEntry.contentMarkdown) return [];

  const existingLinks = extractWikilinks(currentEntry.contentMarkdown);
  const linkedNorms = new Set(
    existingLinks.flatMap((l) => [
      normalizeVietnamese(l.targetTitle),
      l.targetTitle.toLowerCase()
    ])
  );

  // Strip existing [[...]] blocks so we don't re-suggest already linked text
  const stripped = currentEntry.contentMarkdown.replace(WIKILINK_REGEX, " ");
  const strippedNorm = normalizeVietnamese(stripped);

  const mentions: UnlinkedMention[] = [];
  for (const other of allWorkspaceEntries) {
    if (other.deletedAt || other.id === currentEntry.id) continue;
    const candidatePhrases = [other.title, ...(other.aliases ?? [])];
    const allNorms = candidatePhrases.map((p) => normalizeVietnamese(p)).filter(Boolean);
    if (allNorms.some((n) => linkedNorms.has(n)) || linkedNorms.has(other.slug.toLowerCase())) {
      continue;
    }

    for (const phrase of candidatePhrases) {
      const phraseNorm = normalizeVietnamese(phrase);
      if (phraseNorm.length < 3) continue;
      const escaped = phraseNorm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
      if (regex.test(strippedNorm)) {
        mentions.push({
          targetEntryId: other.id,
          targetTitle: other.title,
          targetSlug: other.slug,
          matchedText: phrase
        });
        break;
      }
    }
  }

  return mentions;
}

/**
 * Convert the first unlinked occurrence of `targetTitle` (or `matchedText` / accent-insensitive match)
 * into `[[targetTitle]]` (or `[[targetTitle|matchedText]]`).
 */
export function linkFirstMention(
  markdown: string,
  targetTitle: string,
  matchedText?: string
): string {
  const candidates = Array.from(new Set([matchedText, targetTitle].filter((x): x is string => Boolean(x))));
  const parts = markdown.split(/(\[\[[^\]]+\]\])/g);
  let replaced = false;

  // Pass 1: Direct case-insensitive match
  for (const candidate of candidates) {
    if (replaced) break;
    const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})`, "i");
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith("[[")) continue;
      const m = re.exec(part);
      if (m) {
        const rawHit = m[1];
        const wiki =
          rawHit.toLowerCase() === targetTitle.toLowerCase()
            ? `[[${targetTitle}]]`
            : `[[${targetTitle}|${rawHit}]]`;
        parts[i] = part.slice(0, m.index) + wiki + part.slice(m.index + rawHit.length);
        replaced = true;
        break;
      }
    }
  }

  if (replaced) return parts.join("");

  // Pass 2: Accent-insensitive match across word tokens
  const targetNorm = normalizeVietnamese(matchedText || targetTitle);
  const targetWordCount = targetNorm.split(" ").filter(Boolean).length;
  if (!targetNorm || targetWordCount === 0) return markdown;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("[[")) continue;
    const wordMatches = Array.from(part.matchAll(/[\p{L}\p{N}]+/gu));
    for (let w = 0; w + targetWordCount <= wordMatches.length; w++) {
      const startIdx = wordMatches[w].index!;
      const endMatch = wordMatches[w + targetWordCount - 1];
      const endIdx = endMatch.index! + endMatch[0].length;
      const slice = part.slice(startIdx, endIdx);
      if (normalizeVietnamese(slice) === targetNorm) {
        const wiki =
          slice.toLowerCase() === targetTitle.toLowerCase()
            ? `[[${targetTitle}]]`
            : `[[${targetTitle}|${slice}]]`;
        parts[i] = part.slice(0, startIdx) + wiki + part.slice(endIdx);
        return parts.join("");
      }
    }
  }

  return markdown;
}

export interface SpoilerBlock {
  label: string;
  content: string;
}

export function extractSpoilerBlocks(markdown: string): SpoilerBlock[] {
  const blocks: SpoilerBlock[] = [];
  const regex = /:::spoiler(?:\s+([^\n]+))?\r?\n([\s\S]*?):::/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({
      label: (match[1] ?? "Nội dung tiết lộ / bản nháp").trim(),
      content: match[2].trim()
    });
  }
  return blocks;
}
