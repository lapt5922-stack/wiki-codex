import {
  runContentHealthAudit,
  setHealthIssueResolution,
  type HealthResolutionStatus
} from "@/lib/content-health-engine";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const summary = await runContentHealthAudit(workspaceId);
  return jsonOk({ summary });
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.issueId || !["open", "acknowledged", "resolved"].includes(body.status)) {
    return jsonError("Thiếu issueId hoặc trạng thái xử lý không hợp lệ.");
  }
  setHealthIssueResolution(String(body.issueId), body.status as HealthResolutionStatus);
  return jsonOk({ updated: true });
}
