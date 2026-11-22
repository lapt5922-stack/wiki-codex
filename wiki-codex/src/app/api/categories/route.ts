import {
  createCategory,
  loadState,
  restoreCategory,
  safeDeleteCategory,
  updateCategory
} from "@/db/repository";
import { buildCategoryTree } from "@/lib/category-tree";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireAdmin,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const filter = searchParams.get("q") || "";
  const includeDeleted = searchParams.get("includeDeleted") === "true";

  const state = await loadState();
  const wsCats = state.categories.filter(
    (c) => !workspaceId || c.workspaceId === workspaceId
  );

  // Entries visible to this role (for exact non-duplicate category counts)
  const visibleEntries = state.entries.filter((e) => {
    if (workspaceId && e.workspaceId !== workspaceId) return false;
    if (e.deletedAt) return false;
    if (user.role === "guest" && (e.visibility !== "public" || e.status !== "published")) {
      return false;
    }
    return true;
  });

  const tree = buildCategoryTree(wsCats, visibleEntries, filter);
  const deleted =
    includeDeleted && user.role !== "guest"
      ? wsCats.filter((c) => Boolean(c.deletedAt))
      : [];

  return jsonOk({
    categories: wsCats.filter((c) => !c.deletedAt),
    tree,
    deleted
  });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.workspaceId || !body.name?.trim()) {
    return jsonError("Thiếu không gian hoặc tên danh mục.");
  }
  const category = await createCategory(body);
  return jsonOk({ category }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID danh mục.");

  if (body.action === "restore") {
    const category = await restoreCategory(body.id);
    if (!category) return jsonError("Không tìm thấy danh mục.", 404);
    return jsonOk({ category });
  }

  try {
    const category = await updateCategory(body.id, body);
    return jsonOk({ category });
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const body = await request.json().catch(() => ({}));
  const { searchParams } = new URL(request.url);
  const id = body.id || searchParams.get("id");
  const permanent = Boolean(body.permanent || searchParams.get("permanent") === "true");

  const denied = permanent ? requireAdmin(user) : requireEditor(user);
  if (denied) return denied;
  if (!id) return jsonError("Thiếu ID danh mục.");

  await safeDeleteCategory(id, {
    moveEntriesToCategoryId: body.moveEntriesToCategoryId,
    childStrategy: body.childStrategy || "reparent_to_parent",
    permanent
  });
  return jsonOk({ deleted: true });
}
