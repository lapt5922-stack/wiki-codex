import { loadState } from "@/db/repository";
import { getDescendantCategoryIds } from "@/lib/category-tree";
import {
  analyzeWikiHealth,
  buildKnowledgeGraph,
  buildLineageTree,
  findShortestPath
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

  const graph = buildKnowledgeGraph(visibleEntries, wsRelations, wsTypes, {
    focusEntryId,
    depth,
    categoryIds,
    entryTypeId,
    maxNodes
  });

  return jsonOk({ graph });
}
