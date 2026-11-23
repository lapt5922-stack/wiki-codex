import {
  createCustomRelationType,
  createUniversalRelation,
  deleteUniversalRelation,
  listUniversalRelations,
  suggestCandidateRelations,
  updateUniversalRelation
} from "@/db/universal-relations-repo";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const mode = searchParams.get("mode") || "list";

  if (mode === "suggest") {
    const denied = requireEditor(user);
    if (denied) return denied;
    const suggestions = await suggestCandidateRelations(workspaceId);
    return jsonOk({ suggestions });
  }

  const res = await listUniversalRelations({
    workspaceId,
    role: user.role,
    q: searchParams.get("q") || undefined,
    entityId: searchParams.get("entityId") || undefined,
    relationTypeCode: searchParams.get("relationTypeCode") || undefined,
    verificationStatus: searchParams.get("verificationStatus") || undefined
  });

  return jsonOk(res);
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  const workspaceId = body.workspaceId || "ws-aethelgard";

  if (body.kind === "relation_type") {
    if (!body.labelVi?.trim()) return jsonError("Thiếu tên loại quan hệ.");
    const def = await createCustomRelationType({
      workspaceId,
      labelVi: body.labelVi,
      inverseLabelVi: body.inverseLabelVi,
      category: body.category,
      color: body.color
    });
    return jsonOk({ relationType: def }, 201);
  }

  if (!body.sourceId || !body.targetId || !body.relationTypeCode) {
    return jsonError("Thiếu thực thể nguồn, thực thể đích hoặc loại quan hệ.");
  }

  const created = await createUniversalRelation({
    workspaceId,
    sourceId: String(body.sourceId).trim(),
    sourceKind: body.sourceKind || "lore",
    sourceTitle: String(body.sourceTitle || body.sourceId).trim(),
    targetId: String(body.targetId).trim(),
    targetKind: body.targetKind || "lore",
    targetTitle: String(body.targetTitle || body.targetId).trim(),
    relationTypeCode: String(body.relationTypeCode).trim(),
    relationLabel: String(body.relationLabel || body.relationTypeCode).trim(),
    description: String(body.description || "").trim(),
    startDate: String(body.startDate || "").trim(),
    endDate: String(body.endDate || "").trim(),
    sources: Array.isArray(body.sources) ? body.sources : [],
    verificationStatus: body.verificationStatus || "unverified",
    notes: String(body.notes || "").trim(),
    accessLevel: body.accessLevel || "public",
    createdBy: user.name || user.role
  });

  return jsonOk({ relation: created }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID quan hệ cần cập nhật.");
  const { id, ...patch } = body;
  const updated = await updateUniversalRelation(String(id), patch);
  if (!updated) return jsonError("Không tìm thấy quan hệ.", 404);
  return jsonOk({ relation: updated });
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID quan hệ cần xóa.");
  const ok = await deleteUniversalRelation(id);
  if (!ok) return jsonError("Không tìm thấy quan hệ.", 404);
  return jsonOk({ deleted: true });
}
