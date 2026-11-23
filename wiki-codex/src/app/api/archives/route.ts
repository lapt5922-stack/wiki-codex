import {
  createEventPerspective,
  createHistoricalDocument,
  deleteEventPerspective,
  deleteHistoricalDocument,
  queryEventPerspectives,
  queryHistoricalDocuments
} from "@/db/archives-repo";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const q = searchParams.get("q") || undefined;
  const docType = searchParams.get("docType") || undefined;
  const eventKey = searchParams.get("eventKey") || undefined;

  const [documents, perspectives] = await Promise.all([
    queryHistoricalDocuments({ workspaceId, q, docType }),
    queryEventPerspectives({ workspaceId, eventKey, q })
  ]);

  return jsonOk({ documents, perspectives });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  const workspaceId = body.workspaceId || "ws-aethelgard";

  if (body.kind === "perspective") {
    if (!body.eventTitle?.trim() || !body.holderName?.trim() || !body.body?.trim()) {
      return jsonError("Thiếu tên sự kiện, chủ thể góc nhìn hoặc nội dung.");
    }
    const perspective = await createEventPerspective({
      workspaceId,
      eventKey:
        body.eventKey?.trim() ||
        body.eventTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      eventTitle: String(body.eventTitle).trim(),
      perspectiveKind: body.perspectiveKind || "scholar",
      holderName: String(body.holderName).trim(),
      author: String(body.author || user.name || "Học giả").trim(),
      sourceTitle: String(body.sourceTitle || "").trim(),
      summary: String(body.summary || "").trim(),
      body: String(body.body).trim(),
      reliability: Number(body.reliability ?? 80)
    });
    return jsonOk({ perspective }, 201);
  }

  if (!body.title?.trim()) {
    return jsonError("Thiếu tên tư liệu lịch sử.");
  }
  const document = await createHistoricalDocument({
    workspaceId,
    title: String(body.title).trim(),
    docType: body.docType || "chronicle",
    author: String(body.author || "Khuyết danh").trim(),
    createdDateLabel: String(body.createdDateLabel || "").trim(),
    originPlace: String(body.originPlace || "").trim(),
    language: String(body.language || "Thông ngữ").trim(),
    content: String(body.content || "").trim(),
    preservationStatus: body.preservationStatus || "intact",
    archiveLocation: String(body.archiveLocation || "").trim(),
    reliabilityScore: Number(body.reliabilityScore ?? 85),
    linkedEntityIds: Array.isArray(body.linkedEntityIds) ? body.linkedEntityIds : [],
    attachmentUrl: String(body.attachmentUrl || "").trim()
  });
  return jsonOk({ document }, 201);
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "document";
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID cần xóa.");

  const ok =
    kind === "perspective"
      ? await deleteEventPerspective(id)
      : await deleteHistoricalDocument(id);
  if (!ok) return jsonError("Không tìm thấy bản ghi.", 404);
  return jsonOk({ deleted: true });
}
