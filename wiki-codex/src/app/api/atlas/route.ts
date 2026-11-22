import {
  createAtlasMap,
  createAtlasPin,
  createAtlasRoute,
  deleteAtlasMap,
  deleteAtlasPin,
  deleteAtlasRoute,
  loadState,
  updateAtlasMap,
  updateAtlasPin
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
  const maps = state.atlasMaps.filter(
    (m) => !workspaceId || m.workspaceId === workspaceId
  );
  const pins = state.atlasPins.filter(
    (p) => !workspaceId || p.workspaceId === workspaceId
  );
  const routes = state.atlasRoutes.filter(
    (r) => !workspaceId || r.workspaceId === workspaceId
  );
  return jsonOk({ maps, pins, routes });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (body.kind === "map") {
    if (!body.workspaceId || !body.name?.trim()) {
      return jsonError("Thiếu tên bản đồ.");
    }
    const map = await createAtlasMap({
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      description: (body.description || "").trim(),
      imageUrl: (body.imageUrl || "").trim(),
      themePreset: body.imageUrl ? "custom" : body.themePreset || "aethelgard",
      scaleKmPerWidth: Number(body.scaleKmPerWidth || 2400),
      width: Number(body.width || 1200),
      height: Number(body.height || 700)
    });
    return jsonOk({ map }, 201);
  }

  if (body.kind === "route") {
    if (!body.mapId || !body.workspaceId || !body.name?.trim() || !Array.isArray(body.points)) {
      return jsonError("Thiếu thông tin tuyến đường.");
    }
    const route = await createAtlasRoute({
      mapId: body.mapId,
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      description: (body.description || "").trim(),
      color: body.color || "#D4AF37",
      dashed: Boolean(body.dashed),
      points: body.points
    });
    return jsonOk({ route }, 201);
  }

  if (!body.mapId || !body.workspaceId || !body.label?.trim()) {
    return jsonError("Thiếu thông tin ghim địa điểm.");
  }
  const pin = await createAtlasPin({
    mapId: body.mapId,
    workspaceId: body.workspaceId,
    label: body.label.trim(),
    description: (body.description || "").trim(),
    xPercent: Number(body.xPercent ?? 50),
    yPercent: Number(body.yPercent ?? 50),
    color: body.color || "#D4AF37",
    icon: body.icon || "MapPin",
    sigil: body.sigil || "✦",
    layer: (body.layer || "Vương quốc").trim(),
    entryId: body.entryId || null
  });
  return jsonOk({ pin }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id) return jsonError("Thiếu ID.");

  if (body.kind === "map") {
    const map = await updateAtlasMap(body.id, body);
    if (!map) return jsonError("Không tìm thấy bản đồ.", 404);
    return jsonOk({ map });
  }

  const pin = await updateAtlasPin(body.id, body);
  if (!pin) return jsonError("Không tìm thấy ghim.", 404);
  return jsonOk({ pin });
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const kind = searchParams.get("kind") || "pin";
  if (!id) return jsonError("Thiếu ID.");

  if (kind === "map") {
    await deleteAtlasMap(id);
  } else if (kind === "route") {
    await deleteAtlasRoute(id);
  } else {
    await deleteAtlasPin(id);
  }
  return jsonOk({ deleted: true });
}
