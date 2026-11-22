import {
  createWorkspace,
  deleteWorkspace,
  loadState,
  updateWorkspace
} from "@/db/repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireAdmin,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const state = await loadState();
  const workspaces =
    user.role === "guest"
      ? state.workspaces.filter((w) => w.isPublic)
      : state.workspaces;
  return jsonOk({ workspaces });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.name?.trim()) {
    return jsonError("Tên không gian không được để trống.");
  }
  const workspace = await createWorkspace(body);
  return jsonOk({ workspace }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID không gian.");
  const workspace = await updateWorkspace(body.id, body);
  if (!workspace) return jsonError("Không tìm thấy không gian.", 404);
  return jsonOk({ workspace });
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireAdmin(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID không gian.");
  try {
    const ok = await deleteWorkspace(id);
    if (!ok) return jsonError("Không tìm thấy không gian.", 404);
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}
