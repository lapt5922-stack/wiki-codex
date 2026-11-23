import { runCharacterAudit } from "@/db/character-repository";
import { jsonOk } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const issues = await runCharacterAudit(workspaceId);
  return jsonOk({ issues, count: issues.length });
}
