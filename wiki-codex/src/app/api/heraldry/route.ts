import {
  applyOfficialEmblemToKingdom,
  deleteHeraldryDesign,
  getHeraldryVersions,
  listSavedHeraldryDesigns,
  restoreHeraldryVersion,
  saveHeraldryDesign,
  toggleFavoriteHeraldryTemplate
} from "@/db/heraldry-repository";
import { queryHeraldryTemplates } from "@/lib/heraldry/template-catalog";
import { generateHeraldryAiConcept } from "@/lib/heraldry/renderer-and-export";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || "templates";
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";

  if (mode === "templates") {
    const res = queryHeraldryTemplates({
      q: searchParams.get("q") || undefined,
      style: searchParams.get("style") || undefined,
      category: searchParams.get("category") || undefined,
      shape: searchParams.get("shape") || undefined,
      complexity: searchParams.get("complexity") || undefined,
      page: Number(searchParams.get("page") || "1"),
      limit: Number(searchParams.get("limit") || "24")
    });
    const saved = await listSavedHeraldryDesigns({ workspaceId });
    return jsonOk({ ...res, favoriteTemplateIds: saved.favoriteTemplateIds });
  }

  if (mode === "versions") {
    const designId = searchParams.get("designId") || "";
    const versions = await getHeraldryVersions(designId);
    return jsonOk({ versions });
  }

  const saved = await listSavedHeraldryDesigns({
    workspaceId,
    linkedKingdomId: searchParams.get("linkedKingdomId") || undefined
  });
  return jsonOk(saved);
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  const workspaceId = body.workspaceId || "ws-aethelgard";

  if (body.action === "toggle_favorite") {
    if (!body.templateId) return jsonError("Thiếu templateId.");
    const favoriteTemplateIds = await toggleFavoriteHeraldryTemplate(String(body.templateId));
    return jsonOk({ favoriteTemplateIds });
  }

  if (body.action === "ai_concept") {
    const concept = generateHeraldryAiConcept(String(body.prompt || "Quốc huy hoàng gia sư tử vàng"));
    return jsonOk({ concept });
  }

  if (!body.name?.trim() || !body.designData) {
    return jsonError("Thiếu tên thiết kế hoặc cấu trúc designData.");
  }

  const design = await saveHeraldryDesign({
    id: body.id,
    workspaceId,
    name: body.name,
    description: body.description,
    category: body.category,
    style: body.style,
    mode: body.mode,
    designData: body.designData,
    status: body.status,
    linkedKingdomId: body.linkedKingdomId,
    linkedEntityId: body.linkedEntityId,
    eraLabel: body.eraLabel,
    startDate: body.startDate,
    endDate: body.endDate,
    changeReason: body.changeReason,
    editorName: user.name || user.role
  });

  return jsonOk({ design }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();

  if (body.action === "apply_official") {
    if (!body.designId || !body.kingdomId) {
      return jsonError("Thiếu designId hoặc kingdomId.");
    }
    const result = await applyOfficialEmblemToKingdom({
      designId: String(body.designId),
      kingdomId: String(body.kingdomId),
      confirmReplaceOfficial: Boolean(body.confirmReplaceOfficial),
      changeReason: String(body.changeReason || ""),
      editorName: user.name || user.role
    });
    if ("error" in result) return jsonError(result.error, 400);
    return jsonOk(result);
  }

  if (body.action === "restore_version") {
    if (!body.designId || !body.versionNumber) {
      return jsonError("Thiếu designId hoặc versionNumber.");
    }
    const restored = await restoreHeraldryVersion(
      String(body.designId),
      Number(body.versionNumber),
      user.name || user.role
    );
    if (!restored) return jsonError("Không tìm thấy phiên bản cần khôi phục.", 404);
    return jsonOk({ design: restored });
  }

  return jsonError("Hành động PATCH không được hỗ trợ.", 400);
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID thiết kế.");
  const ok = await deleteHeraldryDesign(id);
  if (!ok) {
    return jsonError(
      "Không thể xóa thiết kế này (có thể đang được bảo vệ là Quốc huy chính thức).",
      400
    );
  }
  return jsonOk({ deleted: true });
}
