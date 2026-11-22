import type {
  Entry,
  EntryRelation,
  EntryType,
  WikiHealthReport
} from "@/types/codex";
import { countWords, normalizeVietnamese } from "./vietnamese";
import { extractWikilinks } from "./wikilinks";

export interface GraphNode {
  id: string;
  slug: string;
  title: string;
  sigil: string;
  color: string;
  entryTypeId: string;
  categoryId: string | null;
  degree: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  kind: "wikilink" | "relation";
}

export interface KnowledgeGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  totalEntriesInWorkspace: number;
  truncated: boolean;
}

export interface ShortestPathResult {
  found: boolean;
  pathNodeIds: string[];
  steps: Array<{
    fromId: string;
    toId: string;
    label: string;
  }>;
}

export interface LineageNode {
  entryId: string;
  title: string;
  sigil: string;
  color: string;
  relationLabel: string;
  children: LineageNode[];
}

function collectAllEdges(
  entries: Entry[],
  relations: EntryRelation[]
): { edges: GraphEdge[]; activeIds: Set<string>; titleMap: Map<string, Entry> } {
  const activeEntries = entries.filter((e) => !e.deletedAt);
  const activeIds = new Set(activeEntries.map((e) => e.id));
  const titleMap = new Map<string, Entry>();
  for (const e of activeEntries) {
    titleMap.set(normalizeVietnamese(e.title), e);
    titleMap.set(e.slug.toLowerCase(), e);
    for (const al of e.aliases ?? []) {
      const normAl = normalizeVietnamese(al);
      if (normAl && !titleMap.has(normAl)) titleMap.set(normAl, e);
    }
  }

  const edges: GraphEdge[] = [];
  const edgeDedup = new Set<string>();

  for (const rel of relations) {
    if (!activeIds.has(rel.sourceEntryId) || !activeIds.has(rel.targetEntryId)) continue;
    const key = `rel:${rel.sourceEntryId}->${rel.targetEntryId}:${rel.relationType}`;
    if (!edgeDedup.has(key)) {
      edgeDedup.add(key);
      edges.push({
        id: rel.id,
        source: rel.sourceEntryId,
        target: rel.targetEntryId,
        label: rel.relationType,
        kind: "relation"
      });
    }
  }

  for (const entry of activeEntries) {
    const links = extractWikilinks(entry.contentMarkdown);
    for (const link of links) {
      const target =
        titleMap.get(normalizeVietnamese(link.targetTitle)) ??
        titleMap.get(link.targetTitle.toLowerCase());
      if (target && target.id !== entry.id) {
        const key = `wiki:${entry.id}->${target.id}`;
        if (!edgeDedup.has(key)) {
          edgeDedup.add(key);
          edges.push({
            id: key,
            source: entry.id,
            target: target.id,
            label: "Nhắc tới",
            kind: "wikilink"
          });
        }
      }
    }
  }

  return { edges, activeIds, titleMap };
}

/**
 * Scalable Knowledge Graph builder:
 * Supports Ego-Graph slicing (focusEntryId + depth) and Top-N hub truncation
 * so a workspace with 50,000+ entries never freezes the browser.
 */
export function buildKnowledgeGraph(
  entries: Entry[],
  relations: EntryRelation[],
  entryTypes: EntryType[],
  options?: {
    focusEntryId?: string | null;
    depth?: number;
    categoryIds?: Set<string> | null;
    entryTypeId?: string | null;
    maxNodes?: number;
  }
): KnowledgeGraphResult {
  const maxNodes = options?.maxNodes ?? 150;
  const typeColorMap = new Map(entryTypes.map((t) => [t.id, t.color]));
  const activeEntries = entries.filter((e) => !e.deletedAt);
  const entryById = new Map(activeEntries.map((e) => [e.id, e]));

  const { edges: allEdges } = collectAllEdges(activeEntries, relations);

  // Build undirected adjacency for degree & ego-graph traversal
  const adj = new Map<string, Set<string>>();
  for (const e of activeEntries) adj.set(e.id, new Set());
  for (const edge of allEdges) {
    adj.get(edge.source)?.add(edge.target);
    adj.get(edge.target)?.add(edge.source);
  }

  let candidateIds: Set<string>;

  if (options?.focusEntryId && entryById.has(options.focusEntryId)) {
    const maxDepth = Math.max(1, Math.min(options.depth ?? 2, 3));
    candidateIds = new Set([options.focusEntryId]);
    let frontier = [options.focusEntryId];
    for (let d = 0; d < maxDepth; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const neighbor of adj.get(id) ?? []) {
          if (!candidateIds.has(neighbor)) {
            candidateIds.add(neighbor);
            next.push(neighbor);
            if (candidateIds.size >= maxNodes) break;
          }
        }
        if (candidateIds.size >= maxNodes) break;
      }
      frontier = next;
      if (candidateIds.size >= maxNodes || frontier.length === 0) break;
    }
  } else {
    let filtered = activeEntries;
    if (options?.categoryIds && options.categoryIds.size > 0) {
      filtered = filtered.filter(
        (e) => e.categoryId && options.categoryIds!.has(e.categoryId)
      );
    }
    if (options?.entryTypeId) {
      filtered = filtered.filter((e) => e.entryTypeId === options.entryTypeId);
    }
    // Sort by connectivity (degree DESC) so most central hubs appear first
    const sorted = [...filtered].sort(
      (a, b) => (adj.get(b.id)?.size ?? 0) - (adj.get(a.id)?.size ?? 0)
    );
    candidateIds = new Set(sorted.slice(0, maxNodes).map((e) => e.id));
  }

  const nodes: GraphNode[] = [];
  for (const id of candidateIds) {
    const e = entryById.get(id);
    if (!e) continue;
    nodes.push({
      id: e.id,
      slug: e.slug,
      title: e.title,
      sigil: e.sigil || "✦",
      color: typeColorMap.get(e.entryTypeId) ?? "#D4AF37",
      entryTypeId: e.entryTypeId,
      categoryId: e.categoryId,
      degree: adj.get(e.id)?.size ?? 0
    });
  }

  const edges = allEdges.filter(
    (edge) => candidateIds.has(edge.source) && candidateIds.has(edge.target)
  );

  return {
    nodes,
    edges,
    totalEntriesInWorkspace: activeEntries.length,
    truncated: activeEntries.length > nodes.length && !options?.focusEntryId
  };
}

/**
 * BFS Shortest Path between two entries across both wikilinks and typed relations.
 */
export function findShortestPath(
  entries: Entry[],
  relations: EntryRelation[],
  startEntryId: string,
  endEntryId: string
): ShortestPathResult {
  if (startEntryId === endEntryId) {
    return { found: true, pathNodeIds: [startEntryId], steps: [] };
  }

  const { edges, activeIds } = collectAllEdges(entries, relations);
  if (!activeIds.has(startEntryId) || !activeIds.has(endEntryId)) {
    return { found: false, pathNodeIds: [], steps: [] };
  }

  const adj = new Map<string, Array<{ to: string; label: string }>>();
  for (const edge of edges) {
    const fwd = adj.get(edge.source) ?? [];
    fwd.push({ to: edge.target, label: edge.label });
    adj.set(edge.source, fwd);

    const rev = adj.get(edge.target) ?? [];
    rev.push({ to: edge.source, label: edge.label });
    adj.set(edge.target, rev);
  }

  const visited = new Set<string>([startEntryId]);
  const parent = new Map<string, { prev: string; label: string }>();
  const queue: string[] = [startEntryId];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr === endEntryId) break;
    for (const edge of adj.get(curr) ?? []) {
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        parent.set(edge.to, { prev: curr, label: edge.label });
        queue.push(edge.to);
      }
    }
  }

  if (!visited.has(endEntryId)) {
    return { found: false, pathNodeIds: [], steps: [] };
  }

  const pathNodeIds: string[] = [];
  const steps: Array<{ fromId: string; toId: string; label: string }> = [];
  let cursor = endEntryId;
  while (cursor !== startEntryId) {
    pathNodeIds.unshift(cursor);
    const p = parent.get(cursor)!;
    steps.unshift({ fromId: p.prev, toId: cursor, label: p.label });
    cursor = p.prev;
  }
  pathNodeIds.unshift(startEntryId);

  return { found: true, pathNodeIds, steps };
}

/**
 * Build a hierarchical Lineage / Organization Tree from a root entry via relations.
 */
export function buildLineageTree(
  rootEntryId: string,
  entries: Entry[],
  relations: EntryRelation[],
  entryTypes: EntryType[],
  maxDepth = 4
): LineageNode | null {
  const active = entries.filter((e) => !e.deletedAt);
  const entryMap = new Map(active.map((e) => [e.id, e]));
  const colorMap = new Map(entryTypes.map((t) => [t.id, t.color]));
  const root = entryMap.get(rootEntryId);
  if (!root) return null;

  const outgoing = new Map<string, EntryRelation[]>();
  for (const r of relations) {
    const list = outgoing.get(r.sourceEntryId) ?? [];
    list.push(r);
    outgoing.set(r.sourceEntryId, list);
  }

  function walk(id: string, relationLabel: string, depth: number, visited: Set<string>): LineageNode {
    const entry = entryMap.get(id)!;
    const nextVisited = new Set(visited);
    nextVisited.add(id);

    const children: LineageNode[] = [];
    if (depth < maxDepth) {
      for (const rel of outgoing.get(id) ?? []) {
        if (!nextVisited.has(rel.targetEntryId) && entryMap.has(rel.targetEntryId)) {
          children.push(walk(rel.targetEntryId, rel.relationType, depth + 1, nextVisited));
        }
      }
    }

    return {
      entryId: entry.id,
      title: entry.title,
      sigil: entry.sigil || "✦",
      color: colorMap.get(entry.entryTypeId) ?? "#D4AF37",
      relationLabel,
      children
    };
  }

  return walk(root.id, "Gốc", 0, new Set());
}

/**
 * Wiki Health & Analytics analyzer:
 * Detects Orphan entries, Broken [[Red Links]], and Stub entries.
 */
export function analyzeWikiHealth(
  entries: Entry[],
  relations: EntryRelation[]
): WikiHealthReport {
  const active = entries.filter((e) => !e.deletedAt);
  const { edges, titleMap } = collectAllEdges(active, relations);

  const connectedIds = new Set<string>();
  for (const edge of edges) {
    connectedIds.add(edge.source);
    connectedIds.add(edge.target);
  }

  let totalWords = 0;
  let totalImages = 0;
  let publishedEntries = 0;
  let draftEntries = 0;
  const orphanEntries: WikiHealthReport["orphanEntries"] = [];
  const brokenLinks: WikiHealthReport["brokenLinks"] = [];
  const stubEntries: WikiHealthReport["stubEntries"] = [];

  for (const entry of active) {
    if (entry.status === "published") publishedEntries++;
    if (entry.status === "draft") draftEntries++;

    const wc = countWords(entry.contentMarkdown);
    totalWords += wc;
    totalImages += entry.gallery.length + (entry.coverImage ? 1 : 0);

    if (!connectedIds.has(entry.id)) {
      orphanEntries.push({
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        sigil: entry.sigil || "✦"
      });
    }

    if (wc < 40) {
      stubEntries.push({
        id: entry.id,
        title: entry.title,
        slug: entry.slug,
        wordCount: wc
      });
    }

    const links = extractWikilinks(entry.contentMarkdown);
    for (const link of links) {
      const resolved =
        titleMap.get(normalizeVietnamese(link.targetTitle)) ??
        titleMap.get(link.targetTitle.toLowerCase());
      if (!resolved) {
        brokenLinks.push({
          sourceEntryId: entry.id,
          sourceTitle: entry.title,
          missingTitle: link.targetTitle
        });
      }
    }
  }

  return {
    totalEntries: active.length,
    publishedEntries,
    draftEntries,
    totalWords,
    totalImages,
    totalLinks: edges.length,
    orphanEntries,
    brokenLinks,
    stubEntries
  };
}
