import { revalidatePath } from "next/cache";
import {
  deletePublishTarget,
  executeOneClickPublish,
  getPublishPreviewStats,
  loadState,
  upsertPublishTarget
} from "@/db/repository";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requirePublisher
} from "@/lib/api-helpers";

import { canPublishPublic } from "@/lib/rbac";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const isPublisher = canPublishPublic(user.role);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");
  const state = await loadState();
  const snapshots = state.publishSnapshots
    .filter((s) => !workspaceId || s.workspaceId === workspaceId)
    .slice(0, 20);
  const stats = workspaceId ? await getPublishPreviewStats(workspaceId) : null;
  const safeTargets = isPublisher
    ? state.publishTargets
    : state.publishTargets.map((t) => ({ ...t, webhookUrl: "" }));
  return jsonOk({
    targets: safeTargets,
    snapshots,
    stats
  });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requirePublisher(user);
  if (denied) return denied;

  const body = await request.json();

  if (body.action === "save_target") {
    if (!body.name?.trim()) {
      return jsonError("Vui lòng nhập tên đích xuất bản.");
    }
    const target = await upsertPublishTarget({
      id: body.id,
      name: body.name.trim(),
      provider: body.provider || "vercel",
      webhookUrl: (body.webhookUrl || "").trim(),
      publicBaseUrl: (body.publicBaseUrl || "").trim(),
      enabled: body.enabled !== false
    });
    return jsonOk({ target }, 201);
  }

  if (!body.workspaceId) {
    return jsonError("Thiếu ID không gian cần xuất bản.");
  }

  try {
    const snapshot = await executeOneClickPublish({
      workspaceId: body.workspaceId,
      publishedBy: user.name,
      note: body.note,
      targetId: body.targetId,
      autoPromoteDrafts: body.autoPromoteDrafts !== false,
      includePrivate: Boolean(body.includePrivate),
      publishAllCollections: body.publishAllCollections !== false
    });

    // Revalidate public SEO portal, sitemap & home immediately so public readers see latest changes
    try {
      revalidatePath("/", "layout");
      revalidatePath("/public", "layout");
      revalidatePath(`/public/${snapshot.workspaceSlug}`, "layout");
      revalidatePath("/sitemap.xml");
    } catch {
      // Safe fallback in test environment outside Next request lifecycle
    }

    return jsonOk({ snapshot }, 201);
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requirePublisher(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return jsonError("Thiếu ID đích xuất bản.");
  await deletePublishTarget(id);
  return jsonOk({ deleted: true });
}
