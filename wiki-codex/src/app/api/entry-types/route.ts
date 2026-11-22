import {
  createEntryType,
  deleteEntryType,
  loadState,
  updateEntryType
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
  const entryTypes = state.entryTypes.filter(
    (t) => !workspaceId || t.workspaceId === workspaceId
  );
  return jsonOk({ entryTypes });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.workspaceId || !body.name?.trim()) {
    return jsonError("Thiếu tên Loại hồ sơ hoặc Không gian.");
  }
  const entryType = await createEntryType({
    workspaceId: body.workspaceId,
    name: body.name.trim(),
    description: body.description || "",
    icon: body.icon || "ScrollText",
    sigil: body.sigil || "✦",
    color: body.color || "#D4AF37",
    supportsPower: typeof body.supportsPower === "boolean" ? body.supportsPower : undefined,
    supportsVariants: typeof body.supportsVariants === "boolean" ? body.supportsVariants : undefined,
    powerPresetKind: body.powerPresetKind,
    cardStyle: body.cardStyle,
    enabledTabs: body.enabledTabs || [
      "overview",
      "details",
      "relations",
      "timeline",
      "sources",
      "gallery"
    ],
    fieldSchema: body.fieldSchema || []
  });
  return jsonOk({ entryType }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID Loại hồ sơ.");
  const entryType = await updateEntryType(body.id, body);
  if (!entryType) return jsonError("Không tìm thấy Loại hồ sơ.", 404);
  return jsonOk({ entryType });
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID Loại hồ sơ.");
  try {
    await deleteEntryType(id);
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}
