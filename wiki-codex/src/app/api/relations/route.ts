import { createRelation, deleteRelation, loadState } from "@/db/repository";
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
  const relations = state.relations.filter(
    (r) => !workspaceId || r.workspaceId === workspaceId
  );
  return jsonOk({ relations });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (
    !body.workspaceId ||
    !body.sourceEntryId ||
    !body.targetEntryId ||
    !body.relationType?.trim()
  ) {
    return jsonError("Thiếu thông tin quan hệ tri thức.");
  }
  const relation = await createRelation({
    workspaceId: body.workspaceId,
    sourceEntryId: body.sourceEntryId,
    targetEntryId: body.targetEntryId,
    relationType: body.relationType.trim(),
    note: (body.note || "").trim()
  });
  return jsonOk({ relation }, 201);
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID quan hệ.");
  await deleteRelation(id);
  return jsonOk({ deleted: true });
}
