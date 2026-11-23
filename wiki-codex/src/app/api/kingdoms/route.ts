import {
  createOrCloneKingdom,
  queryKingdoms
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

  const result = await queryKingdoms({
    workspaceId,
    role: user.role,
    q: searchParams.get("q") || undefined,
    continent: searchParams.get("continent") || undefined,
    polityType: searchParams.get("polityType") || undefined,
    governmentType: searchParams.get("governmentType") || undefined,
    developmentLevel: searchParams.get("developmentLevel") || undefined,
    workflowStatus: searchParams.get("workflowStatus") || undefined,
    sortBy: (searchParams.get("sortBy") as "updatedAt" | "name" | "population" | "area" | "gdp") || "name",
    page: Number(searchParams.get("page") || "1"),
    limit: Number(searchParams.get("limit") || "24")
  });
  return jsonOk(result);
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.officialName?.trim()) {
      return jsonError("Vui lòng nhập Tên chính thức của quốc gia.", 400);
    }
    const dossier = await createOrCloneKingdom(
      {
        workspaceId: body.workspaceId || "ws-aethelgard",
        cloneFromId: body.cloneFromId || undefined,
        officialName: body.officialName.trim(),
        commonName: body.commonName,
        continent: body.continent,
        polityType: body.polityType,
        governmentType: body.governmentType,
        capitalName: body.capitalName,
        currencyCode: body.currencyCode,
        summary: body.summary
      },
      user.name
    );
    return jsonOk({ dossier }, 201);
  } catch (err) {
    return jsonError((err as Error).message || "Không thể tạo quốc gia mới.", 400);
  }
}
