import {
  createOrCloneKingdom,
  exportKingdomsData
} from "@/db/kingdom-repository";
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
  const format = searchParams.get("format") === "csv" ? "csv" : "json";
  const body = await exportKingdomsData(workspaceId, format, user.role);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="kingdom-codex-${workspaceId}.${format}"`
    }
  });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  try {
    const body = await request.json();
    const workspaceId = body.workspaceId || "ws-aethelgard";
    const records = Array.isArray(body.records) ? body.records : [];
    if (records.length === 0) return jsonError("Danh sách quốc gia nhập vào đang trống.", 400);

    const ids: string[] = [];
    for (const r of records) {
      if (!r.officialName?.trim()) continue;
      const created = await createOrCloneKingdom(
        {
          workspaceId,
          officialName: r.officialName.trim(),
          commonName: r.commonName || r.officialName.trim(),
          continent: r.continent,
          governmentType: r.governmentType,
          capitalName: r.capitalName,
          currencyCode: r.currencyCode,
          summary: r.summary
        },
        user.name
      );
      ids.push(created.kingdom.id);
    }
    return jsonOk({ imported: ids.length, ids }, 201);
  } catch (err) {
    return jsonError((err as Error).message || "Lỗi nhập dữ liệu hàng loạt.", 400);
  }
}
