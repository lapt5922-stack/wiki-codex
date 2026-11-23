import {
  getKingdomDossier,
  softDeleteKingdom,
  updateKingdomDossier
} from "@/db/kingdom-repository";
import {
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
  const result = await getKingdomDossier(id, user.role);
  if (!result.dossier) {
    return jsonError("Không tìm thấy hồ sơ quốc gia hoặc không có quyền truy cập.", 404);
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
    const updated = await updateKingdomDossier(id, body, user.name);
    if (!updated) return jsonError("Không tìm thấy hồ sơ quốc gia.", 404);
    return jsonOk({ dossier: updated });
  } catch (err) {
    return jsonError((err as Error).message || "Không thể cập nhật hồ sơ quốc gia.", 400);
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
  await softDeleteKingdom(id);
  return jsonOk({ deleted: true, id });
}
