import { restoreKingdomVersion } from "@/db/kingdom-repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { id } = await context.params;
  const body = await request.json();
  const ver = Number(body.versionNumber);
  if (!Number.isFinite(ver)) return jsonError("Thiếu số phiên bản cần khôi phục.", 400);

  const restored = await restoreKingdomVersion(id, ver, user.name);
  if (!restored) return jsonError("Không tìm thấy phiên bản.", 404);
  return jsonOk({ dossier: restored });
}
