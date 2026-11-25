import { loadState } from "@/db/repository";
import { queryCharacters } from "@/db/character-repository";
import { queryKingdoms } from "@/db/kingdom-repository";
import {
  listUniversalRelations,
  suggestCandidateRelations
} from "@/db/universal-relations-repo";
import { getDescendantCategoryIds } from "@/lib/category-tree";
import {
  analyzeWikiHealth,
  buildKnowledgeGraph,
  buildLineageTree,
  findShortestPath,
  type GraphEdge,
  type GraphNode
} from "@/lib/graph";
import { filterEntriesForRole } from "@/lib/rbac";
import { getRequestUser, jsonOk } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const mode = searchParams.get("mode") || "graph";
  const focusEntryId = searchParams.get("focusEntryId");
  const depth = Number(searchParams.get("depth") || "2");
  const categoryId = searchParams.get("categoryId");
  const entryTypeId = searchParams.get("entryTypeId");
  const maxNodes = Number(searchParams.get("maxNodes") || "120");
  const startId = searchParams.get("startId");
  const endId = searchParams.get("endId");
  const rootId = searchParams.get("rootId");
  const crossDomain = searchParams.get("crossDomain") === "true";

  const state = await loadState();
  const wsId = workspaceId || state.workspaces[0]?.id || "";
  const wsTypes = state.entryTypes.filter((t) => t.workspaceId === wsId);
  const rawEntries = state.entries.filter((e) => e.workspaceId === wsId && !e.deletedAt);
  const visibleEntries = filterEntriesForRole(rawEntries, user.role, wsTypes);
  const wsRelations = state.relations.filter((r) => r.workspaceId === wsId);

  if (mode === "path" && startId && endId) {
    const path = findShortestPath(visibleEntries, wsRelations, startId, endId);
    return jsonOk({ path });
  }

  if (mode === "lineage" && rootId) {
    const tree = buildLineageTree(rootId, visibleEntries, wsRelations, wsTypes, 4);
    return jsonOk({ tree });
  }

  if (mode === "health") {
    const health = analyzeWikiHealth(visibleEntries, wsRelations);
    return jsonOk({ health });
  }

  let categoryIds: Set<string> | null = null;
  if (categoryId) {
    const wsCats = state.categories.filter((c) => c.workspaceId === wsId);
    categoryIds = getDescendantCategoryIds(wsCats, categoryId);
  }

  const baseGraph = buildKnowledgeGraph(visibleEntries, wsRelations, wsTypes, {
    focusEntryId,
    depth,
    categoryIds,
    entryTypeId,
    maxNodes
  });

  if (!crossDomain) {
    const topHubs = [...baseGraph.nodes]
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 6);
    return jsonOk({
      graph: baseGraph,
      proInsights: {
        crossDomain: false,
        topHubs,
        missingLinkCandidates: []
      }
    });
  }

  // Knowledge Graph Pro: fuse Entries + Characters + Kingdoms + Universal Relations
  const [charRes, kingRes, univRes, candidateLinks] = await Promise.all([
    queryCharacters({ workspaceId: wsId, role: user.role, page: 1, limit: 40 }).catch(() => ({
      items: []
    })),
    queryKingdoms({ workspaceId: wsId, role: user.role, page: 1, limit: 40 }).catch(() => ({
      items: []
    })),
    listUniversalRelations({ workspaceId: wsId, role: user.role }).catch(() => ({
      relations: []
    })),
    suggestCandidateRelations(wsId).catch(() => [])
  ]);

  const nodeMap = new Map<string, GraphNode>();
  for (const n of baseGraph.nodes) {
    nodeMap.set(n.id, { ...n });
  }

  for (const c of charRes.items) {
    if (!nodeMap.has(c.id)) {
      nodeMap.set(c.id, {
        id: c.id,
        slug: c.id.toLowerCase(),
        title: c.fullName,
        sigil: c.symbol || "✦",
        entryTypeId: "character_codex",
        categoryId: null,
        color: "#22d3ee",
        degree: 0
      });
    }
  }

  for (const k of kingRes.items.slice(0, 30)) {
    if (!nodeMap.has(k.id)) {
      nodeMap.set(k.id, {
        id: k.id,
        slug: k.id.toLowerCase(),
        title: k.officialName,
        sigil: "👑",
        entryTypeId: "kingdom_codex",
        categoryId: null,
        color: "#f59e0b",
        degree: 0
      });
    }
  }

  const edgeList: GraphEdge[] = [...baseGraph.edges];
  const seenEdgeIds = new Set(edgeList.map((e) => e.id));

  for (const rel of univRes.relations) {
    if (!nodeMap.has(rel.sourceId)) {
      nodeMap.set(rel.sourceId, {
        id: rel.sourceId,
        slug: rel.sourceId.toLowerCase(),
        title: rel.sourceTitle,
        sigil: rel.sourceKind === "character" ? "✦" : rel.sourceKind === "kingdom" ? "👑" : "◈",
        entryTypeId: rel.sourceKind,
        categoryId: null,
        color: rel.sourceKind === "character" ? "#22d3ee" : "#f59e0b",
        degree: 0
      });
    }
    if (!nodeMap.has(rel.targetId)) {
      nodeMap.set(rel.targetId, {
        id: rel.targetId,
        slug: rel.targetId.toLowerCase(),
        title: rel.targetTitle,
        sigil: rel.targetKind === "character" ? "✦" : rel.targetKind === "kingdom" ? "👑" : "◈",
        entryTypeId: rel.targetKind,
        categoryId: null,
        color: rel.targetKind === "character" ? "#22d3ee" : "#f59e0b",
        degree: 0
      });
    }
    if (!seenEdgeIds.has(rel.id)) {
      seenEdgeIds.add(rel.id);
      edgeList.push({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
        label: rel.relationLabel,
        kind: "relation"
      });
      const sNode = nodeMap.get(rel.sourceId);
      const tNode = nodeMap.get(rel.targetId);
      if (sNode) sNode.degree += 1;
      if (tNode) tNode.degree += 1;
    }
  }

  const allMergedNodes = Array.from(nodeMap.values()).sort((a, b) => b.degree - a.degree);
  // Balanced multi-domain representation so 360+ Entry hubs never starve Character & Kingdom nodes
  const charNodes = allMergedNodes
    .filter((n) => n.id.startsWith("CHAR-"))
    .slice(0, Math.min(20, Math.max(4, Math.floor(maxNodes * 0.2))));
  const kingNodes = allMergedNodes
    .filter((n) => n.id.startsWith("KING-"))
    .slice(0, Math.min(20, Math.max(4, Math.floor(maxNodes * 0.2))));
  const pickedMap = new Map<string, GraphNode>();
  for (const n of [...charNodes, ...kingNodes]) pickedMap.set(n.id, n);
  for (const n of allMergedNodes) {
    if (pickedMap.size >= maxNodes) break;
    if (!pickedMap.has(n.id)) pickedMap.set(n.id, n);
  }
  const cappedNodes = Array.from(pickedMap.values()).sort((a, b) => b.degree - a.degree);
  const cappedIdSet = new Set(cappedNodes.map((n) => n.id));
  const cappedEdges = edgeList.filter(
    (e) => cappedIdSet.has(e.source) && cappedIdSet.has(e.target)
  );

  const topHubs = cappedNodes.slice(0, 8);

  return jsonOk({
    graph: {
      nodes: cappedNodes,
      edges: cappedEdges,
      totalEntriesInWorkspace: allMergedNodes.length,
      truncated: allMergedNodes.length > maxNodes
    },
    proInsights: {
      crossDomain: true,
      topHubs,
      missingLinkCandidates: candidateLinks.slice(0, 8)
    }
  });
}
