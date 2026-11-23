import {
  bulkImportCharacters,
  exportCharactersData
} from "@/db/character-repository";
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

  const body = await exportCharactersData(workspaceId, format, user.role);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="character-codex-${workspaceId}.${format}"`
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
    if (records.length === 0) {
      return jsonError("Danh sách nhân vật nhập vào đang trống.", 400);
    }
    const result = await bulkImportCharacters(workspaceId, records, user.name);
    return jsonOk(result, 201);
  } catch (err) {
    return jsonError((err as Error).message || "Lỗi nhập dữ liệu hàng loạt.", 400);
  }
}
