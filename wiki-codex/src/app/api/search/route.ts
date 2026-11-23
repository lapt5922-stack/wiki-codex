import { loadState } from "@/db/repository";
import { queryCharacters } from "@/db/character-repository";
import { queryKingdoms } from "@/db/kingdom-repository";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { filterEntriesForRole } from "@/lib/rbac";
import { getRequestUser, jsonOk } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "";
  const q = (searchParams.get("q") || "").trim();

  const state = await loadState();
  const wsId = workspaceId || state.workspaces[0]?.id || "";
  const wsTypes = state.entryTypes.filter((t) => t.workspaceId === wsId);
  const visibleEntries = filterEntriesForRole(
    state.entries.filter((e) => e.workspaceId === wsId && !e.deletedAt),
    user.role,
    wsTypes
  );

  const visibleIdSet = new Set(visibleEntries.map((e) => e.id));

  const entries = visibleEntries
    .filter((e) => {
      if (!q) return true;
      const extraText = (e.extraFields ?? [])
        .filter((f) => user.role !== "guest" || f.kind !== "private_note")
        .map((f) => `${f.label} ${f.value}`)
        .join(" ");
      const customText = Object.values(e.customFields ?? {})
        .filter((v) => typeof v === "string" || typeof v === "number")
        .join(" ");
      const haystack = `${e.title} ${e.subtitle} ${(e.aliases || []).join(" ")} ${e.summary} ${e.tags.join(" ")} ${extraText} ${customText}`;
      return matchesVietnameseQuery(haystack, q);
    })
    .slice(0, 15)
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      subtitle: e.subtitle,
      sigil: e.sigil,
      status: e.status,
      tags: e.tags.slice(0, 3)
    }));

  const categories = state.categories
    .filter(
      (c) =>
        c.workspaceId === wsId &&
        !c.deletedAt &&
        (!q || matchesVietnameseQuery(`${c.name} ${c.description}`, q))
    )
    .slice(0, 8)
    .map((c) => ({
      id: c.id,
      name: c.name,
      sigil: c.sigil,
      color: c.color
    }));

  const timelineEvents = state.timelineEvents
    .filter(
      (t) =>
        t.workspaceId === wsId &&
        (!q || matchesVietnameseQuery(`${t.title} ${t.dateLabel} ${t.era} ${t.summary}`, q))
    )
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dateLabel: t.dateLabel,
      sigil: t.sigil
    }));

  const atlasPins = state.atlasPins
    .filter(
      (p) =>
        p.workspaceId === wsId &&
        (!p.entryId || visibleIdSet.has(p.entryId)) &&
        (!q || matchesVietnameseQuery(`${p.label} ${p.description}`, q))
    )
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      label: p.label,
      entryId: p.entryId,
      sigil: p.sigil
    }));

  const [charRes, kingRes] = await Promise.all([
    queryCharacters({ workspaceId: wsId, role: user.role, q, page: 1, limit: 6 }).catch(() => ({ items: [] })),
    queryKingdoms({ workspaceId: wsId, role: user.role, q, page: 1, limit: 6 }).catch(() => ({ items: [] }))
  ]);

  const characters = charRes.items.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    race: c.race,
    symbol: c.symbol || "✦",
    titles: c.titles.slice(0, 2)
  }));

  const kingdoms = kingRes.items.map((k) => ({
    id: k.id,
    officialName: k.officialName,
    continent: k.continent,
    governmentType: k.governmentType,
    capitalName: k.capitalName
  }));

  return jsonOk({ entries, categories, timelineEvents, atlasPins, characters, kingdoms });
}
