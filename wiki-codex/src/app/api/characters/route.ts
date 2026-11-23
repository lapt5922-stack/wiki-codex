import {
  createCharacterDossier,
  queryCharacters
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

  const minLevelRaw = searchParams.get("minLevel");
  const maxLevelRaw = searchParams.get("maxLevel");

  const result = await queryCharacters({
    workspaceId,
    role: user.role,
    q: searchParams.get("q") || undefined,
    nationality: searchParams.get("nationality") || undefined,
    race: searchParams.get("race") || undefined,
    organization: searchParams.get("organization") || undefined,
    lifeStatus: searchParams.get("lifeStatus") || undefined,
    roleFilter: searchParams.get("role") || undefined,
    rarity: searchParams.get("rarity") || undefined,
    minLevel: minLevelRaw ? Number(minLevelRaw) : undefined,
    maxLevel: maxLevelRaw ? Number(maxLevelRaw) : undefined,
    pinnedOnly: searchParams.get("pinnedOnly") === "true",
    sortBy: (searchParams.get("sortBy") as "updatedAt" | "name" | "level" | "statScore") || "updatedAt",
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
    const workspaceId = body.workspaceId || "ws-aethelgard";
    const dossier = await createCharacterDossier(
      {
        ...body,
        workspaceId
      },
      user.name
    );
    return jsonOk({ dossier }, 201);
  } catch (err) {
    return jsonError((err as Error).message || "Không thể tạo nhân vật mới.", 400);
  }
}
