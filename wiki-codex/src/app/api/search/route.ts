import { loadState } from "@/db/repository";
import { queryCharacters } from "@/db/character-repository";
import { queryKingdoms } from "@/db/kingdom-repository";
import {
  matchesVietnameseQuery,
  normalizeVietnamese,
  scoreSearchMatch
} from "@/lib/vietnamese";
import { resolveUniversalId } from "@/lib/universal-id";
import { filterEntriesForRole } from "@/lib/rbac";
import { getRequestUser, jsonOk } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const q = (searchParams.get("q") || "").trim();
  const crossWorkspace = searchParams.get("crossWorkspace") === "true";

  const state = await loadState();
  const defaultWsId = workspaceId || state.workspaces[0]?.id || "";

  const accessibleWorkspaces = state.workspaces.filter(
    (w) => w.isPublic || user.role !== "guest"
  );
  const targetWorkspaces = crossWorkspace
    ? accessibleWorkspaces
    : accessibleWorkspaces.filter((w) => w.id === defaultWsId);

  const wsNameMap = new Map(state.workspaces.map((w) => [w.id, w.name]));
  const targetWsIds = new Set(
    targetWorkspaces.length > 0 ? targetWorkspaces.map((w) => w.id) : [defaultWsId]
  );

  // Collect RBAC-filtered entries across target workspaces
  const visibleEntries = Array.from(targetWsIds).flatMap((wsId) => {
    const wsTypes = state.entryTypes.filter((t) => t.workspaceId === wsId);
    return filterEntriesForRole(
      state.entries.filter((e) => e.workspaceId === wsId && !e.deletedAt),
      user.role,
      wsTypes
    );
  });

  const visibleIdSet = new Set(visibleEntries.map((e) => e.id));

  const entries = visibleEntries
    .map((e) => {
      const extraText = (e.extraFields ?? [])
        .filter((f) => user.role !== "guest" || f.kind !== "private_note")
        .map((f) => `${f.label} ${f.value}`)
        .join(" ");
      const customText = Object.values(e.customFields ?? {})
        .filter((v) => typeof v === "string" || typeof v === "number")
        .join(" ");
      const uid = resolveUniversalId(e.id, "lore");
      const haystack = `${uid} ${e.id} ${e.title} ${e.subtitle} ${(e.aliases || []).join(" ")} ${e.summary} ${e.tags.join(" ")} ${extraText} ${customText}`;
      const matched = !q || matchesVietnameseQuery(haystack, q);
      if (!matched) return null;
      const relevance = scoreSearchMatch(q, {
        id: `${uid} ${e.id}`,
        primaryTitle: e.title,
        aliases: e.aliases,
        subtitleOrMeta: `${e.subtitle} ${e.tags.join(" ")}`,
        bodyText: `${e.summary} ${extraText} ${customText}`
      });
      return {
        id: e.id,
        slug: e.slug,
        title: e.title,
        subtitle: e.subtitle,
        sigil: e.sigil,
        status: e.status,
        tags: e.tags.slice(0, 3),
        workspaceId: e.workspaceId,
        workspaceName: wsNameMap.get(e.workspaceId) || e.workspaceId,
        relevance
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 15);

  const categories = state.categories
    .filter(
      (c) =>
        targetWsIds.has(c.workspaceId) &&
        !c.deletedAt &&
        (!q || matchesVietnameseQuery(`${c.name} ${c.description}`, q))
    )
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      name: c.name,
      sigil: c.sigil,
      color: c.color,
      workspaceId: c.workspaceId,
      workspaceName: wsNameMap.get(c.workspaceId) || c.workspaceId
    }));

  const timelineEvents = state.timelineEvents
    .filter(
      (t) =>
        targetWsIds.has(t.workspaceId) &&
        (!q || matchesVietnameseQuery(`${t.title} ${t.dateLabel} ${t.era} ${t.summary}`, q))
    )
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dateLabel: t.dateLabel,
      sigil: t.sigil,
      workspaceId: t.workspaceId,
      workspaceName: wsNameMap.get(t.workspaceId) || t.workspaceId
    }));

  const atlasPins = state.atlasPins
    .filter(
      (p) =>
        targetWsIds.has(p.workspaceId) &&
        (!p.entryId || visibleIdSet.has(p.entryId)) &&
        (!q || matchesVietnameseQuery(`${p.label} ${p.description}`, q))
    )
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      label: p.label,
      entryId: p.entryId,
      sigil: p.sigil,
      workspaceId: p.workspaceId,
      workspaceName: wsNameMap.get(p.workspaceId) || p.workspaceId
    }));

  const wsIdArray = Array.from(targetWsIds);
  const [charArrays, kingArrays] = await Promise.all([
    Promise.all(
      wsIdArray.map((wsId) =>
        queryCharacters({ workspaceId: wsId, role: user.role, q, page: 1, limit: 6 })
          .then((r) => r.items.map((item) => ({ item, wsId })))
          .catch(() => [])
      )
    ),
    Promise.all(
      wsIdArray.map((wsId) =>
        queryKingdoms({ workspaceId: wsId, role: user.role, q, page: 1, limit: 6 })
          .then((r) => r.items.map((item) => ({ item, wsId })))
          .catch(() => [])
      )
    )
  ]);

  const characters = charArrays
    .flat()
    .map(({ item: c, wsId }) => ({
      id: c.id,
      fullName: c.fullName,
      race: c.race,
      symbol: c.symbol || "✦",
      titles: c.titles.slice(0, 2),
      workspaceId: wsId,
      workspaceName: wsNameMap.get(wsId) || wsId,
      relevance: scoreSearchMatch(q, {
        id: c.id,
        primaryTitle: c.fullName,
        aliases: c.titles,
        subtitleOrMeta: c.race
      })
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8);

  const kingdoms = kingArrays
    .flat()
    .map(({ item: k, wsId }) => ({
      id: k.id,
      officialName: k.officialName,
      continent: k.continent,
      governmentType: k.governmentType,
      capitalName: k.capitalName,
      workspaceId: wsId,
      workspaceName: wsNameMap.get(wsId) || wsId,
      relevance: scoreSearchMatch(q, {
        id: k.id,
        primaryTitle: k.officialName,
        subtitleOrMeta: `${k.capitalName} ${k.continent} ${k.governmentType}`
      })
    }))
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 8);

  // Build smart query suggestions from tags & featured entity titles
  const suggestionPool = new Set<string>();
  for (const e of visibleEntries.slice(0, 40)) {
    for (const tag of e.tags) {
      if (tag && (!q || matchesVietnameseQuery(tag, q))) suggestionPool.add(tag);
    }
    if (q && e.title && matchesVietnameseQuery(e.title, q)) {
      suggestionPool.add(e.title);
    }
  }
  const suggestions = Array.from(suggestionPool)
    .filter((s) => normalizeVietnamese(s) !== normalizeVietnamese(q))
    .slice(0, 6);

  return jsonOk({
    entries,
    categories,
    timelineEvents,
    atlasPins,
    characters,
    kingdoms,
    suggestions,
    crossWorkspace
  });
}
