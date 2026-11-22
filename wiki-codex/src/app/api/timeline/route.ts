import {
  createTimelineEvent,
  deleteTimelineEvent,
  loadState,
  updateTimelineEvent
} from "@/db/repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const state = await loadState();
  const events = state.timelineEvents
    .filter((t) => !workspaceId || t.workspaceId === workspaceId)
    .sort((a, b) => a.sortYear - b.sortYear);
  return jsonOk({ events });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.workspaceId || !body.title?.trim() || !body.dateLabel?.trim()) {
    return jsonError("Vui lòng nhập Tiêu đề sự kiện và Mốc thời gian.");
  }
  const event = await createTimelineEvent({
    workspaceId: body.workspaceId,
    title: body.title.trim(),
    dateLabel: body.dateLabel.trim(),
    sortYear: Number(body.sortYear ?? 0),
    era: (body.era || "Kỷ Nguyên Chung").trim(),
    icon: body.icon || "Hourglass",
    sigil: body.sigil || "⧗",
    color: body.color || "#D4AF37",
    summary: (body.summary || "").trim(),
    entryIds: Array.isArray(body.entryIds) ? body.entryIds : []
  });
  return jsonOk({ event }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID sự kiện.");
  const event = await updateTimelineEvent(body.id, body);
  if (!event) return jsonError("Không tìm thấy sự kiện.", 404);
  return jsonOk({ event });
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID sự kiện.");
  await deleteTimelineEvent(id);
  return jsonOk({ deleted: true });
}
