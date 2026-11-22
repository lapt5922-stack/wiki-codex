import {
  batchCreateEntries,
  clearStressEntries,
  createAtlasRoute,
  deleteAtlasRoute,
  deleteCollection,
  deleteEditorialTask,
  deleteGlossaryTerm,
  deleteLoreboard,
  deleteMediaAsset,
  deleteSavedView,
  deleteTemplate,
  deleteWorldUnit,
  loadState,
  seedStressEntries,
  upsertCalendar,
  upsertCollection,
  upsertEditorialTask,
  upsertGlossaryTerm,
  upsertLoreboard,
  upsertMediaAsset,
  upsertSavedView,
  upsertTemplate,
  upsertWorldUnit
} from "@/db/repository";
import { getDescendantCategoryIds } from "@/lib/category-tree";
import { filterEntriesForRole } from "@/lib/rbac";
import { runLoreConsistencyAudit } from "@/lib/v3-engines";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireAdmin,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const resource = searchParams.get("resource") || "all";

  const state = await loadState();
  const wsId = workspaceId || state.workspaces[0]?.id || "";
  const wsTypes = state.entryTypes.filter((t) => t.workspaceId === wsId);
  const visibleEntries = filterEntriesForRole(
    state.entries.filter((e) => e.workspaceId === wsId && !e.deletedAt),
    user.role,
    wsTypes
  );

  if (resource === "book") {
    const categoryId = searchParams.get("categoryId");
    let entries = [...visibleEntries];
    if (categoryId) {
      const wsCats = state.categories.filter((c) => c.workspaceId === wsId);
      const allowed = getDescendantCategoryIds(wsCats, categoryId);
      entries = entries.filter((e) => e.categoryId && allowed.has(e.categoryId));
    }
    entries.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    return jsonOk({ entries: entries.slice(0, 60) });
  }

  if (resource === "quotes") {
    const quotes: Array<{
      entryId: string;
      entryTitle: string;
      sigil: string;
      quote: string;
      author: string;
      source: string;
      kind: "epigraph" | "conlang";
    }> = [];
    for (const e of visibleEntries) {
      if (e.epigraph?.quote) {
        quotes.push({
          entryId: e.id,
          entryTitle: e.title,
          sigil: e.sigil,
          quote: e.epigraph.quote,
          author: e.epigraph.author,
          source: e.epigraph.source || "",
          kind: "epigraph"
        });
      }
      const re = /:::conlang\r?\n([\s\S]*?):::/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(e.contentMarkdown)) !== null) {
        quotes.push({
          entryId: e.id,
          entryTitle: e.title,
          sigil: e.sigil,
          quote: m[1].trim(),
          author: e.title,
          source: "Văn bia Cổ ngữ",
          kind: "conlang"
        });
      }
    }
    return jsonOk({ quotes });
  }

  if (resource === "audit") {
    return jsonOk({ audit: runLoreConsistencyAudit(visibleEntries, wsTypes) });
  }

  return jsonOk({
    templates: state.templates.filter((t) => t.workspaceId === wsId),
    loreboards: state.loreboards.filter((l) => l.workspaceId === wsId),
    calendars: state.calendars.filter((c) => c.workspaceId === wsId),
    mediaAssets: state.mediaAssets.filter((m) => m.workspaceId === wsId),
    glossaryTerms: state.glossaryTerms.filter((g) => g.workspaceId === wsId),
    collections: state.collections.filter(
      (c) => c.workspaceId === wsId && (user.role !== "guest" || c.isPublic)
    ),
    editorialTasks:
      user.role === "guest"
        ? []
        : state.editorialTasks.filter((t) => t.workspaceId === wsId),
    activityLog: state.activityLog
      .filter((a) => a.workspaceId === wsId)
      .slice(0, 30),
    atlasRoutes: state.atlasRoutes.filter((r) => r.workspaceId === wsId),
    worldUnits: state.worldUnits.filter((u) => u.workspaceId === wsId),
    savedViews: state.savedViews.filter((v) => v.workspaceId === wsId)
  });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const body = await request.json();
  const { resource, data } = body as { resource: string; data: Record<string, unknown> };

  if (resource === "stress_seed" || resource === "stress_clear") {
    const denied = requireAdmin(user);
    if (denied) return denied;
    const wsId = String(data?.workspaceId || "");
    if (!wsId) return jsonError("Thiếu workspaceId.");
    if (resource === "stress_seed") {
      const count = await seedStressEntries(wsId, Number(data?.count || 1000), user.name);
      return jsonOk({ count }, 201);
    }
    const removed = await clearStressEntries(wsId, user.name);
    return jsonOk({ removed });
  }

  const denied = requireEditor(user);
  if (denied) return denied;

  switch (resource) {
    case "template":
      return jsonOk({ item: await upsertTemplate(data as never) }, 201);
    case "loreboard":
      return jsonOk({ item: await upsertLoreboard(data as never) }, 201);
    case "calendar":
      return jsonOk({ item: await upsertCalendar(data as never) }, 201);
    case "media":
      return jsonOk({ item: await upsertMediaAsset(data as never) }, 201);
    case "glossary":
      return jsonOk({ item: await upsertGlossaryTerm(data as never) }, 201);
    case "collection":
      return jsonOk({ item: await upsertCollection(data as never) }, 201);
    case "task":
      return jsonOk({ item: await upsertEditorialTask(data as never) }, 201);
    case "route":
      return jsonOk({ item: await createAtlasRoute(data as never) }, 201);
    case "world_unit":
      return jsonOk({ item: await upsertWorldUnit(data as never) }, 201);
    case "saved_view":
      return jsonOk({ item: await upsertSavedView(data as never) }, 201);
    case "batch_entries": {
      const wsId = String(data?.workspaceId || "");
      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const items = await batchCreateEntries(wsId, rows as never, user.name);
      return jsonOk({ count: items.length, items }, 201);
    }
    default:
      return jsonError("Loại tài nguyên không hợp lệ.");
  }
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || "";
  const id = searchParams.get("id") || "";
  if (!id) return jsonError("Thiếu ID cần xóa.");

  switch (resource) {
    case "template":
      await deleteTemplate(id);
      break;
    case "loreboard":
      await deleteLoreboard(id);
      break;
    case "media":
      await deleteMediaAsset(id);
      break;
    case "glossary":
      await deleteGlossaryTerm(id);
      break;
    case "collection":
      await deleteCollection(id);
      break;
    case "task":
      await deleteEditorialTask(id);
      break;
    case "route":
      await deleteAtlasRoute(id);
      break;
    case "world_unit":
      await deleteWorldUnit(id);
      break;
    case "saved_view":
      await deleteSavedView(id);
      break;
    default:
      return jsonError("Loại tài nguyên không hợp lệ.");
  }

  return jsonOk({ deleted: true });
}
