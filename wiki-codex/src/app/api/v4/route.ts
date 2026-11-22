import {
  deleteChronicleChapter,
  deleteHierarchyChart,
  deletePropertyBlueprint,
  deleteSystemRule,
  deleteTaxonomyNode,
  deleteTradeCommodity,
  getV4Bundle,
  getWorkspaceAnalytics,
  loadState,
  updateWorldCalendarV4,
  upsertChronicleChapter,
  upsertHierarchyChart,
  upsertPropertyBlueprint,
  upsertSystemRule,
  upsertTaxonomyNode,
  upsertTradeCommodity
} from "@/db/repository";
import { getRequestUser, jsonError, jsonOk, requireEditor } from "@/lib/api-helpers";
import { getDescendantCategoryIds } from "@/lib/category-tree";
import { filterEntriesForRole } from "@/lib/rbac";
import { buildCodexBookHtml } from "@/lib/v4-engines";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const kind = searchParams.get("kind") || "bundle";

  const state = await loadState();
  const wsId = workspaceId || state.workspaces[0]?.id || "";

  if (kind === "analytics") {
    const analytics = await getWorkspaceAnalytics(wsId, user.role);
    return jsonOk({ analytics });
  }

  if (kind === "book_html") {
    const scope = searchParams.get("scope") || "all";
    const scopeId = searchParams.get("scopeId") || "";
    const includePower = searchParams.get("includePower") !== "false";
    const includeQuotes = searchParams.get("includeQuotes") !== "false";
    const ws = state.workspaces.find((w) => w.id === wsId);
    const wsTypes = state.entryTypes.filter((t) => t.workspaceId === wsId);
    let entries = filterEntriesForRole(
      state.entries.filter((e) => e.workspaceId === wsId && !e.deletedAt),
      user.role,
      wsTypes
    );
    if (scope === "category" && scopeId) {
      const wsCats = state.categories.filter((c) => c.workspaceId === wsId);
      const allowedCats = getDescendantCategoryIds(wsCats, scopeId);
      entries = entries.filter((e) => e.categoryId && allowedCats.has(e.categoryId));
    } else if (scope === "entryType" && scopeId) {
      entries = entries.filter((e) => e.entryTypeId === scopeId);
    } else if (scope === "collection" && scopeId) {
      const col = state.collections.find((c) => c.id === scopeId);
      const set = new Set(col?.entryIds ?? []);
      entries = entries.filter((e) => set.has(e.id));
    }

    const html = buildCodexBookHtml({
      bookTitle: searchParams.get("title") || ws?.name || "Aethel Codex",
      subtitle: searchParams.get("subtitle") || ws?.description || "Bách Khoa Toàn Thư Thế Giới",
      author: searchParams.get("author") || user.name,
      preface: searchParams.get("preface") || "",
      entries,
      includePower,
      includeQuotes
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }

  const bundle = await getV4Bundle(wsId);
  return jsonOk(bundle);
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const forbidden = requireEditor(user);
  if (forbidden) return forbidden;

  const body = await request.json().catch(() => null);
  if (!body || !body.kind) {
    return jsonError("Thiếu trường kind trong yêu cầu V4.");
  }

  try {
    switch (body.kind) {
      case "calendar": {
        const saved = await updateWorldCalendarV4(body.calendar, user.name);
        return jsonOk({ calendar: saved });
      }
      case "hierarchy": {
        const saved = await upsertHierarchyChart(body.chart, user.name);
        return jsonOk({ chart: saved });
      }
      case "system_rule": {
        const saved = await upsertSystemRule(body.rule, user.name);
        return jsonOk({ rule: saved });
      }
      case "taxonomy": {
        const saved = await upsertTaxonomyNode(body.node, user.name);
        return jsonOk({ node: saved });
      }
      case "commodity": {
        const saved = await upsertTradeCommodity(body.commodity, user.name);
        return jsonOk({ commodity: saved });
      }
      case "chronicle": {
        const saved = await upsertChronicleChapter(body.chapter, user.name);
        return jsonOk({ chapter: saved });
      }
      case "blueprint": {
        const saved = await upsertPropertyBlueprint(body.blueprint, user.name);
        return jsonOk({ blueprint: saved });
      }
      default:
        return jsonError(`Loại tài nguyên V4 không hợp lệ: ${body.kind}`);
    }
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Lỗi xử lý dữ liệu V4.", 500);
  }
}

export async function DELETE(request: Request) {
  const user = getRequestUser(request);
  const forbidden = requireEditor(user);
  if (forbidden) return forbidden;

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind") || "";
  const id = searchParams.get("id") || "";
  if (!kind || !id) {
    return jsonError("Thiếu kind hoặc id cần xóa.");
  }

  switch (kind) {
    case "hierarchy":
      return jsonOk({ deleted: await deleteHierarchyChart(id) });
    case "system_rule":
      return jsonOk({ deleted: await deleteSystemRule(id) });
    case "taxonomy":
      return jsonOk({ deleted: await deleteTaxonomyNode(id) });
    case "commodity":
      return jsonOk({ deleted: await deleteTradeCommodity(id) });
    case "chronicle":
      return jsonOk({ deleted: await deleteChronicleChapter(id) });
    case "blueprint":
      return jsonOk({ deleted: await deletePropertyBlueprint(id) });
    default:
      return jsonError(`Loại tài nguyên V4 không hợp lệ: ${kind}`);
  }
}
