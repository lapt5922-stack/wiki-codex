import { runCharacterAudit } from "@/db/character-repository";
import { getRequestUser, jsonOk, requireEditor } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const issues = await runCharacterAudit(workspaceId);
  return jsonOk({ issues, count: issues.length });
}
