import {
  createEntry,
  deleteHolding,
  listHoldings,
  loadState,
  upsertHolding
} from "@/db/repository";
import { getRequestUser, jsonError, jsonOk, requireEditor } from "@/lib/api-helpers";
import type { HoldingKind, HoldingStatus } from "@/types/codex";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const state = await loadState();
  const wsId = workspaceId || state.workspaces[0]?.id || "";
  const holdings = await listHoldings(wsId);
  return jsonOk({ holdings });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body || !body.workspaceId || !body.ownerEntryId) {
    return jsonError("Thiếu workspaceId hoặc ownerEntryId.");
  }

  let targetEntryId: string | null = body.targetEntryId || null;
  let customName: string = (body.customName || "").trim();

  // Mode 2: Quick-Create a brand new Location / Target Entry & attach it in 1 click!
  if (body.quickCreateTarget && customName) {
    const newEntryTypeId =
      body.newEntryTypeId ||
      (body.holdingKind === "city"
        ? "type-city"
        : body.holdingKind === "artifact"
        ? "type-artifact"
        : body.holdingKind === "vassal"
        ? "type-house"
        : "type-landmark");

    const created = await createEntry(
      {
        workspaceId: body.workspaceId,
        entryTypeId: newEntryTypeId,
        title: customName,
        subtitle: body.roleLabel || "",
        summary: body.summary || `${customName} — trực thuộc quyền quản lý của chủ thể.`,
        sigil: body.holdingKind === "city" ? "❖" : body.holdingKind === "fortress" ? "⛨" : "◈",
        icon: body.holdingKind === "city" ? "Building2" : "Landmark",
        contentMarkdown: `## Tổng quan Địa điểm\n\n${body.summary || customName}`,
        tags: [body.holdingKind || "địa điểm"]
      },
      user.name
    );
    targetEntryId = created.id;
    customName = created.title;
  }

  if (!targetEntryId && !customName) {
    return jsonError("Vui lòng chọn hồ sơ có sẵn hoặc nhập tên địa điểm trực thuộc.");
  }

  try {
    const saved = await upsertHolding(
      {
        id: body.id,
        workspaceId: body.workspaceId,
        ownerEntryId: body.ownerEntryId,
        targetEntryId,
        customName: customName || "Địa điểm trực thuộc",
        holdingKind: (body.holdingKind as HoldingKind) || "territory",
        roleLabel: (body.roleLabel || "Trực thuộc").trim(),
        status: (body.status as HoldingStatus) || "active",
        eraNote: (body.eraNote || "").trim(),
        summary: (body.summary || "").trim()
      },
      user.name
    );

    return jsonOk({ holding: saved }, 201);
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  if (!body || !body.id || !body.workspaceId || !body.ownerEntryId) {
    return jsonError("Thiếu thông tin cập nhật lãnh địa.");
  }

  try {
    const saved = await upsertHolding(
      {
        id: body.id,
        workspaceId: body.workspaceId,
        ownerEntryId: body.ownerEntryId,
        targetEntryId: body.targetEntryId ?? null,
        customName: (body.customName || "").trim(),
        holdingKind: (body.holdingKind as HoldingKind) || "territory",
        roleLabel: (body.roleLabel || "Trực thuộc").trim(),
        status: (body.status as HoldingStatus) || "active",
        eraNote: (body.eraNote || "").trim(),
        summary: (body.summary || "").trim()
      },
      user.name
    );

    return jsonOk({ holding: saved });
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") || "";
  if (!id) return jsonError("Thiếu id cần gỡ.");

  const deleted = await deleteHolding(id);
  return jsonOk({ deleted });
}
