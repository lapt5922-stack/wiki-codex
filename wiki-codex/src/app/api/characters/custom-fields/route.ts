import {
  deleteCustomFieldDef,
  listCustomFieldDefs,
  upsertCustomFieldDef
} from "@/db/character-repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const fields = await listCustomFieldDefs(workspaceId);
  return jsonOk({ fields });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.label?.trim()) {
    return jsonError("Vui lòng nhập tên trường dữ liệu.", 400);
  }
  const field = await upsertCustomFieldDef({
    ...body,
    workspaceId: body.workspaceId || "ws-aethelgard"
  });
  return jsonOk({ field }, 201);
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID trường tùy biến.", 400);
  const deleted = await deleteCustomFieldDef(id);
  return jsonOk({ deleted });
}
