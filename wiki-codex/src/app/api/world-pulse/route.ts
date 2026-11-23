import { loadState } from "@/db/repository";
import { loadCharacterState } from "@/db/character-repository";
import { queryKingdoms } from "@/db/kingdom-repository";
import { loadUniversalRelationsStore } from "@/db/universal-relations-repo";
import { loadArchivesStore } from "@/db/archives-repo";
import {
  classifyEntryModule,
  normalizeEditorialStatus,
  type EditorialVerificationStatus
} from "@/lib/codex-modules";
import { getRequestUser, jsonOk } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const isPrivileged = user.role === "admin" || user.role === "editor";

  const [wikiState, charState, kingRes, relStore, archives] = await Promise.all([
    loadState(),
    loadCharacterState(),
    queryKingdoms({ workspaceId, role: user.role, page: 1, limit: 500 }),
    loadUniversalRelationsStore(),
    loadArchivesStore()
  ]);

  const wsEntries = wikiState.entries.filter(
    (e) =>
      e.workspaceId === workspaceId &&
      !e.deletedAt &&
      (isPrivileged || (e.visibility === "public" && e.status === "published"))
  );
  const wsChars = charState.characters.filter(
    (c) =>
      c.workspaceId === workspaceId &&
      !c.deletedAt &&
      (isPrivileged || c.accessLevel === "public")
  );
  const wsEvents = wikiState.timelineEvents
    .filter((ev) => ev.workspaceId === workspaceId)
    .sort((a, b) => b.sortYear - a.sortYear);
  const wsDocs = archives.documents.filter((d) => d.workspaceId === workspaceId);
  const wsPerspectives = archives.perspectives.filter((p) => p.workspaceId === workspaceId);
  const wsRelations = relStore.relations.filter(
    (r) =>
      r.workspaceId === workspaceId &&
      (isPrivileged || r.accessLevel === "public")
  );

  // Module counts (100% real data, zero hardcoding)
  const moduleCounts: Record<string, number> = {};
  const editorialCounts: Record<EditorialVerificationStatus, number> = {
    canon: 0,
    verified: 0,
    unverified: 0,
    inferred: 0,
    original_lore: 0,
    draft: 0
  };
  for (const e of wsEntries) {
    const mod = classifyEntryModule({
      id: e.id,
      workspaceId: e.workspaceId,
      entryTypeId: e.entryTypeId,
      categoryId: e.categoryId,
      slug: e.slug,
      title: e.title,
      subtitle: e.subtitle,
      summary: e.summary,
      icon: e.icon,
      sigil: e.sigil,
      thumbImage: e.thumbImage || e.coverImage,
      status: e.status,
      visibility: e.visibility,
      canonStatus: e.canonStatus,
      spoilerGate: e.spoilerGate,
      tags: e.tags,
      updatedAt: e.updatedAt,
      deletedAt: e.deletedAt,
      backlinkCount: 0,
      wordCount: 0
    });
    moduleCounts[mod] = (moduleCounts[mod] || 0) + 1;
    editorialCounts[normalizeEditorialStatus(e.canonStatus)] += 1;
  }

  // Era counts from Living History
  const eraCounts: Record<string, number> = {};
  for (const ev of wsEvents) {
    const era = ev.era || "Chưa phân thời đại";
    eraCounts[era] = (eraCounts[era] || 0) + 1;
  }

  // World Pulse Stream (derived live from existing modules — zero duplicate records)
  const pulseItems = [
    ...wsEvents.slice(0, 8).map((ev) => ({
      id: `pulse-ev-${ev.id}`,
      kind: "event" as const,
      title: ev.title,
      subtitle: `${ev.dateLabel} · ${ev.era}`,
      summary: ev.summary,
      timestamp: ev.createdAt,
      refId: ev.id
    })),
    ...wsDocs.slice(0, 5).map((d) => ({
      id: `pulse-doc-${d.id}`,
      kind: "document" as const,
      title: d.title,
      subtitle: `${d.id} · ${d.author}`,
      summary: d.content.slice(0, 140),
      timestamp: d.createdAt,
      refId: d.id
    })),
    ...wsRelations.slice(0, 6).map((r) => ({
      id: `pulse-rel-${r.id}`,
      kind: "relation" as const,
      title: `${r.sourceTitle} → ${r.relationLabel} → ${r.targetTitle}`,
      subtitle: `${r.id} · ${r.startDate || "Quan hệ tri thức"}`,
      summary: r.description,
      timestamp: r.updatedAt,
      refId: r.id
    })),
    ...wsEntries
      .filter((e) => !e.id.startsWith("ent-nation-"))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 8)
      .map((e) => ({
        id: `pulse-ent-${e.id}`,
        kind: "entry" as const,
        title: `${e.sigil} ${e.title}`,
        subtitle: `Cập nhật hồ sơ · ${e.status}`,
        summary: e.summary,
        timestamp: e.updatedAt,
        refId: e.id
      }))
  ].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Secret & Discovery Archive (strict backend RBAC separation!)
  const secretArchive = {
    role: user.role,
    canViewPrivate: isPrivileged,
    privateEntries: isPrivileged
      ? wsEntries
          .filter((e) => e.visibility === "private" || e.status === "draft")
          .slice(0, 30)
          .map((e) => ({ id: e.id, title: e.title, status: e.status, visibility: e.visibility, canonStatus: e.canonStatus }))
      : [],
    spoilerEntries: wsEntries
      .filter((e) => e.spoilerGate)
      .slice(0, 30)
      .map((e) => ({ id: e.id, title: e.title, spoilerLabel: e.spoilerLabel || "Nội dung tiết lộ quan trọng" })),
    unverifiedEntries: wsEntries
      .filter((e) => normalizeEditorialStatus(e.canonStatus) === "unverified")
      .slice(0, 30)
      .map((e) => ({ id: e.id, title: e.title, summary: e.summary }))
  };

  return jsonOk({
    statistics: {
      worlds: wikiState.workspaces.length,
      kingdoms: kingRes.total,
      characters: wsChars.length,
      organizations: moduleCounts.organization || 0,
      locations: moduleCounts.location || 0,
      events: wsEvents.length,
      species: moduleCounts.species || 0,
      artifacts: moduleCounts.item || 0,
      documents: wsDocs.length,
      perspectives: wsPerspectives.length,
      relations: wsRelations.length,
      totalEntries: wsEntries.length,
      mediaAssets: wikiState.mediaAssets.filter((m) => m.workspaceId === workspaceId).length,
      editorialCounts,
      eraCounts
    },
    pulseItems: pulseItems.slice(0, 30),
    secretArchive
  });
}
