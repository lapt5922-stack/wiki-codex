import {
  applyOfficialEmblemToKingdom,
  deleteCustomTemplate,
  deleteFlagDesign,
  deleteHeraldicMeaning,
  deleteHeraldryDesign,
  deleteRegaliaItem,
  getHeraldryVersions,
  importCustomTemplatePack,
  listCustomTemplates,
  listFlags,
  listHeraldicMeanings,
  listRegalia,
  listSavedHeraldryDesigns,
  restoreHeraldryVersion,
  saveCustomTemplate,
  saveFlagDesign,
  saveHeraldicMeaning,
  saveHeraldryDesign,
  saveRegaliaItem,
  toggleFavoriteHeraldryTemplate
} from "@/db/heraldry-repository";
import { queryHeraldryTemplates } from "@/lib/heraldry/template-catalog";
import { queryFlagTemplates } from "@/lib/heraldry/flag-engine";
import {
  analyzeHeraldryComposition,
  computeHeraldrySimilarity,
  generateHeraldryAiConcept
} from "@/lib/heraldry/renderer-and-export";
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

  if (mode === "flag_templates") {
    const res = queryFlagTemplates({
      q: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      geometry: searchParams.get("geometry") || undefined,
      layout: searchParams.get("layout") || undefined,
      page: Number(searchParams.get("page") || "1"),
      limit: Number(searchParams.get("limit") || "18")
    });
    return jsonOk(res);
  }

  if (mode === "flags") {
    return jsonOk({ flags: await listFlags(workspaceId) });
  }

  if (mode === "regalia") {
    return jsonOk({ regalia: await listRegalia(workspaceId) });
  }

  if (mode === "meanings") {
    return jsonOk({ meanings: await listHeraldicMeanings(workspaceId) });
  }

  if (mode === "custom_templates") {
    return jsonOk({ customTemplates: await listCustomTemplates(workspaceId) });
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
  const editorName = user.name || user.role;

  if (body.action === "toggle_favorite") {
    if (!body.templateId) return jsonError("Thiếu templateId.");
    const favoriteTemplateIds = await toggleFavoriteHeraldryTemplate(String(body.templateId));
    return jsonOk({ favoriteTemplateIds });
  }

  if (body.action === "ai_concept") {
    const concept = generateHeraldryAiConcept(String(body.prompt || "Quốc huy hoàng gia sư tử vàng"));
    return jsonOk({ concept });
  }

  if (body.action === "ai_analyze") {
    if (!body.designData) return jsonError("Thiếu designData.");
    const analysis = analyzeHeraldryComposition(body.designData);
    const saved = await listSavedHeraldryDesigns({ workspaceId });
    const similar = saved.designs
      .map((d) => ({
        id: d.id,
        name: d.name,
        isOfficial: d.isOfficial,
        ...computeHeraldrySimilarity(body.designData, d.designData)
      }))
      .filter((x) => x.score >= 45)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    return jsonOk({ analysis, similar });
  }

  if (body.action === "save_flag") {
    if (!body.name?.trim()) return jsonError("Thiếu tên cờ/biểu ngữ.");
    const flag = await saveFlagDesign({
      id: body.id,
      workspaceId,
      name: body.name.trim(),
      category: body.category || "national_flag",
      geometry: body.geometry || "rect_3_2",
      layout: body.layout || "horizontal_tricolor",
      primaryColor: body.primaryColor || "#101522",
      secondaryColor: body.secondaryColor || "#6D3D49",
      tertiaryColor: body.tertiaryColor || "#C6A568",
      symbolId: body.symbolId || "sym-lion",
      symbolColor: body.symbolColor || "#E9DFC9",
      symbolScale: Number(body.symbolScale || 1.5),
      borderTrim: Boolean(body.borderTrim),
      borderColor: body.borderColor || "#C6A568",
      mottoText: String(body.mottoText || ""),
      linkedKingdomId: body.linkedKingdomId || null,
      linkedEntityId: body.linkedEntityId || null,
      eraLabel: String(body.eraLabel || "Thời đại Hiện tại"),
      description: String(body.description || ""),
      createdBy: editorName
    });
    return jsonOk({ flag }, 201);
  }

  if (body.action === "save_regalia") {
    if (!body.name?.trim()) return jsonError("Thiếu tên bảo vật hoàng gia.");
    const item = await saveRegaliaItem({
      id: body.id,
      workspaceId,
      name: body.name.trim(),
      category: body.category || "crown",
      imageUrl: String(body.imageUrl || ""),
      origin: String(body.origin || ""),
      history: String(body.history || ""),
      materials: String(body.materials || ""),
      currentStatus: body.currentStatus || "active",
      linkedKingdomId: body.linkedKingdomId || null,
      linkedKingdomName: String(body.linkedKingdomName || ""),
      linkedCharacterId: body.linkedCharacterId || null,
      linkedCharacterName: String(body.linkedCharacterName || ""),
      dynastyName: String(body.dynastyName || ""),
      eraLabel: String(body.eraLabel || ""),
      sourceCitation: String(body.sourceCitation || ""),
      createdBy: editorName
    });
    return jsonOk({ item }, 201);
  }

  if (body.action === "save_meaning") {
    if (!body.title?.trim() || !body.civilization?.trim()) {
      return jsonError("Thiếu tên biểu tượng hoặc nền văn minh.");
    }
    const entry = await saveHeraldicMeaning({
      id: body.id,
      workspaceId,
      entryType: body.entryType || "symbol",
      refId: String(body.refId || ""),
      title: body.title.trim(),
      civilization: body.civilization.trim(),
      iconographicMeaning: String(body.iconographicMeaning || ""),
      colorMeaning: String(body.colorMeaning || ""),
      culturalContext: String(body.culturalContext || ""),
      politicalMeaning: String(body.politicalMeaning || ""),
      religiousMeaning: String(body.religiousMeaning || ""),
      legendAndLore: String(body.legendAndLore || ""),
      origin: String(body.origin || ""),
      sourceCitation: String(body.sourceCitation || ""),
      verificationStatus: body.verificationStatus || "unverified_draft",
      createdBy: editorName
    });
    return jsonOk({ entry }, 201);
  }

  if (body.action === "save_custom_template") {
    if (!body.name?.trim() || !body.designData) {
      return jsonError("Thiếu tên mẫu hoặc designData.");
    }
    const template = await saveCustomTemplate({
      workspaceId,
      name: body.name.trim(),
      collectionName: String(body.collectionName || "Bộ sưu tập Vương quốc"),
      category: body.category || "kingdom_emblem",
      style: body.style || "imperial",
      license: String(body.license || "Aethel Codex Internal"),
      description: String(body.description || ""),
      designData: body.designData,
      createdBy: editorName
    });
    return jsonOk({ template }, 201);
  }

  if (body.action === "import_asset_pack") {
    if (!Array.isArray(body.templates)) return jsonError("Thiếu mảng templates hợp lệ.");
    const res = await importCustomTemplatePack(workspaceId, body.templates, editorName);
    return jsonOk(res, 201);
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
    approvedBy: body.approvedBy,
    dynastyId: body.dynastyId,
    dynastyName: body.dynastyName,
    dynastyRole: body.dynastyRole,
    linkedCharacterId: body.linkedCharacterId,
    linkedEventId: body.linkedEventId,
    linkedEventTitle: body.linkedEventTitle,
    editorName
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
  const entity = searchParams.get("entity") || "design";
  if (!id) return jsonError("Thiếu ID cần xóa.");

  if (entity === "flag") {
    return jsonOk({ deleted: await deleteFlagDesign(id) });
  }
  if (entity === "regalia") {
    return jsonOk({ deleted: await deleteRegaliaItem(id) });
  }
  if (entity === "meaning") {
    return jsonOk({ deleted: await deleteHeraldicMeaning(id) });
  }
  if (entity === "custom_template") {
    return jsonOk({ deleted: await deleteCustomTemplate(id) });
  }

  const ok = await deleteHeraldryDesign(id);
  if (!ok) {
    return jsonError(
      "Không thể xóa thiết kế này (có thể đang được bảo vệ là Quốc huy chính thức).",
      400
    );
  }
  return jsonOk({ deleted: true });
}
