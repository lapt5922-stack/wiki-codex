import {
  getCharacterDossier,
  softDeleteCharacter,
  updateCharacterDossier
} from "@/db/character-repository";
import {
  ConcurrentEditError,
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(request);
  const { id } = await context.params;
  const result = await getCharacterDossier(id, user.role);
  if (!result.dossier) {
    return jsonError("Không tìm thấy hồ sơ nhân vật hoặc bạn không có quyền xem.", 404);
  }
  return jsonOk(result);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const updated = await updateCharacterDossier(id, body, user.name);
    if (!updated) return jsonError("Không tìm thấy hồ sơ nhân vật.", 404);
    return jsonOk({ dossier: updated });
  } catch (err) {
    if (err instanceof ConcurrentEditError || (err as Error)?.name === "ConcurrentEditError") {
      return jsonError((err as Error).message, 409);
    }
    return jsonError((err as Error).message || "Không thể cập nhật hồ sơ nhân vật.", 400);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { id } = await context.params;
  const ok = await softDeleteCharacter(id, user.name);
  if (!ok) return jsonError("Không tìm thấy hồ sơ nhân vật.", 404);
  return jsonOk({ deleted: true, id });
}
