import {
  addEditorialNote,
  duplicateEntry,
  getEntryDetail,
  getEntryHoldingsContext,
  loadState,
  permanentDeleteEntry,
  restoreEntry,
  restoreEntryRevision,
  softDeleteEntry,
  updateEntry
} from "@/db/repository";
import { computeBacklinks, findUnlinkedMentions } from "@/lib/wikilinks";
import {
  ConcurrentEditError,
  getRequestUser,
  jsonError,
  jsonOk,
  requireAdmin,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = getRequestUser(request);
  const detail = await getEntryDetail(id, user.role);
  if (!detail) {
    return jsonError("Không tìm thấy hồ sơ hoặc bạn không có quyền xem.", 404);
  }

  const state = await loadState();
  const wsEntries = state.entries.filter((e) => {
    if (e.workspaceId !== detail.entry.workspaceId || e.deletedAt) return false;
    if (user.role === "guest" && (e.visibility !== "public" || e.status !== "published")) {
      return false;
    }
    return true;
  });

  const backlinks = computeBacklinks(detail.entry, wsEntries);
  const unlinkedMentions =
    user.role === "guest" ? [] : findUnlinkedMentions(detail.entry, wsEntries);

  const relations = state.relations
    .filter(
      (r) =>
        r.workspaceId === detail.entry.workspaceId &&
        (r.sourceEntryId === detail.entry.id || r.targetEntryId === detail.entry.id)
    )
    .map((r) => {
      const otherId =
        r.sourceEntryId === detail.entry.id ? r.targetEntryId : r.sourceEntryId;
      const other = wsEntries.find((e) => e.id === otherId);
      return other
        ? {
            ...r,
            direction: r.sourceEntryId === detail.entry.id ? "outgoing" : "incoming",
            otherEntry: {
              id: other.id,
              slug: other.slug,
              title: other.title,
              sigil: other.sigil
            }
          }
        : null;
    })
    .filter(Boolean);

  const timelineEvents = state.timelineEvents
    .filter(
      (t) =>
        t.workspaceId === detail.entry.workspaceId &&
        t.entryIds.includes(detail.entry.id)
    )
    .sort((a, b) => a.sortYear - b.sortYear);

  const linkLookup = wsEntries.map((e) => ({
    id: e.id,
    slug: e.slug,
    title: e.title,
    subtitle: e.subtitle,
    summary: e.summary,
    sigil: e.sigil,
    thumbImage: e.thumbImage || e.coverImage
  }));

  // Smart Related Entries (shared tags or same category)
  const tagSet = new Set(detail.entry.tags);
  const relatedEntries = wsEntries
    .filter((e) => e.id !== detail.entry.id)
    .map((e) => {
      let score = 0;
      if (e.categoryId && e.categoryId === detail.entry.categoryId) score += 2;
      for (const t of e.tags) {
        if (tagSet.has(t)) score += 1;
      }
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ e }) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      subtitle: e.subtitle,
      sigil: e.sigil,
      thumbImage: e.thumbImage || e.coverImage
    }));

  const glossaryTerms = state.glossaryTerms.filter(
    (g) => g.workspaceId === detail.entry.workspaceId
  );

  const holdingsContext = getEntryHoldingsContext(state, detail.entry.id, user.role);

  return jsonOk({
    entry: detail.entry,
    revisions: detail.revisions,
    backlinks,
    unlinkedMentions,
    relations,
    timelineEvents,
    linkLookup,
    relatedEntries,
    glossaryTerms,
    ownedHoldings: holdingsContext.ownedHoldings,
    ownedBy: holdingsContext.ownedBy,
    ownershipChain: holdingsContext.ownershipChain
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();

  if (body.action === "duplicate") {
    const entry = await duplicateEntry(id, user.name);
    if (!entry) return jsonError("Không tìm thấy hồ sơ.", 404);
    return jsonOk({ entry }, 201);
  }

  if (body.action === "restore") {
    const ok = await restoreEntry(id);
    if (!ok) return jsonError("Không tìm thấy hồ sơ.", 404);
    return jsonOk({ restored: true });
  }

  if (body.action === "restore_revision" && body.revisionId) {
    const entry = await restoreEntryRevision(id, body.revisionId, user.name);
    if (!entry) return jsonError("Không tìm thấy phiên bản cần khôi phục.", 404);
    return jsonOk({ entry });
  }

  if (body.action === "add_editorial_note" && body.content?.trim()) {
    const note = await addEditorialNote(id, {
      authorName: user.name,
      authorRole: user.role,
      content: body.content.trim()
    });
    if (!note) return jsonError("Không tìm thấy hồ sơ.", 404);
    return jsonOk({ note }, 201);
  }

  try {
    const entry = await updateEntry(id, body, user.name);
    if (!entry) return jsonError("Không tìm thấy hồ sơ.", 404);
    return jsonOk({ entry });
  } catch (err) {
    if (err instanceof ConcurrentEditError || (err as Error)?.name === "ConcurrentEditError") {
      return jsonError((err as Error).message, 409);
    }
    return jsonError((err as Error).message || "Không thể cập nhật hồ sơ.", 400);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const permanent = searchParams.get("permanent") === "true";

  const denied = permanent ? requireAdmin(user) : requireEditor(user);
  if (denied) return denied;

  const ok = permanent
    ? await permanentDeleteEntry(id)
    : await softDeleteEntry(id);
  if (!ok) return jsonError("Không tìm thấy hồ sơ.", 404);
  return jsonOk({ deleted: true, permanent });
}
