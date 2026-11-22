import {
  bulkUpdateEntries,
  createEntry,
  loadState,
  queryEntriesFromState
} from "@/db/repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";
import type { EntryStatus, EntryVisibility } from "@/types/codex";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const query = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId") || null;
  const includeDescendants = searchParams.get("includeDescendants") !== "false";
  const entryTypeId = searchParams.get("entryTypeId") || null;
  const status = (searchParams.get("status") || "all") as EntryStatus | "all";
  const visibility = (searchParams.get("visibility") || "all") as EntryVisibility | "all";
  const canonStatus = searchParams.get("canonStatus") || "all";
  const minPowerParam = searchParams.get("minPower");
  const maxPowerParam = searchParams.get("maxPower");
  const minPower = minPowerParam !== null && minPowerParam !== "" ? Number(minPowerParam) : null;
  const maxPower = maxPowerParam !== null && maxPowerParam !== "" ? Number(maxPowerParam) : null;
  const tag = searchParams.get("tag") || null;
  const includeDeleted =
    user.role !== "guest" && searchParams.get("includeDeleted") === "true";
  const sortBy = (searchParams.get("sortBy") || "updatedAt") as
    | "updatedAt"
    | "title"
    | "status"
    | "powerLevel";
  const sortDir = (searchParams.get("sortDir") || "desc") as "asc" | "desc";
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "24");

  const state = await loadState();
  const resolvedWorkspaceId = workspaceId || state.workspaces[0]?.id || "";

  const result = queryEntriesFromState(state, {
    workspaceId: resolvedWorkspaceId,
    role: user.role,
    query,
    categoryId,
    includeDescendants,
    entryTypeId,
    status,
    visibility,
    canonStatus,
    minPower,
    maxPower,
    tag,
    includeDeleted,
    sortBy,
    sortDir,
    page,
    limit
  });

  // Collect distinct tags for filter chips
  const tagSet = new Set<string>();
  for (const e of state.entries) {
    if (e.workspaceId !== resolvedWorkspaceId || e.deletedAt) continue;
    if (user.role === "guest" && (e.visibility !== "public" || e.status !== "published")) {
      continue;
    }
    for (const t of e.tags) tagSet.add(t);
  }

  return jsonOk(
    { ...result, allTags: Array.from(tagSet).sort((a, b) => a.localeCompare(b, "vi")) },
    200,
    user.role === "guest"
      ? { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" }
      : undefined
  );
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();

  if (body.action === "bulk") {
    if (!Array.isArray(body.entryIds) || !body.bulkAction) {
      return jsonError("Thiếu danh sách hồ sơ hoặc thao tác hàng loạt.");
    }
    const updatedCount = await bulkUpdateEntries(
      body.entryIds,
      body.bulkAction,
      user.name
    );
    return jsonOk({ updatedCount });
  }

  if (!body.workspaceId || !body.title?.trim() || !body.entryTypeId) {
    return jsonError("Vui lòng nhập Tiêu đề và chọn Loại hồ sơ.");
  }

  const entry = await createEntry(body, user.name);
  return jsonOk({ entry }, 201);
}
