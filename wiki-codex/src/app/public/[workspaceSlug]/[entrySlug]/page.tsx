import Link from "next/link";
import { notFound } from "next/navigation";
import { loadState } from "@/db/repository";
import { sanitizeEntryForRole } from "@/lib/rbac";
import { PublicEntryArticleClient } from "@/components/PublicEntryArticleClient";

export const dynamic = "force-dynamic";

export default async function PublicEntryPage({
  params
}: {
  params: Promise<{ workspaceSlug: string; entrySlug: string }>;
}) {
  const { workspaceSlug, entrySlug } = await params;
  const state = await loadState();
  const ws = state.workspaces.find((w) => w.slug === workspaceSlug && w.isPublic);
  if (!ws) notFound();

  const rawEntry = state.entries.find(
    (e) => e.workspaceId === ws.id && e.slug === entrySlug
  );
  if (!rawEntry) notFound();

  const entryType = state.entryTypes.find((t) => t.id === rawEntry.entryTypeId);
  const entry = sanitizeEntryForRole(rawEntry, "guest", entryType);
  if (!entry) notFound();

  const publicLookup = state.entries
    .filter(
      (e) =>
        e.workspaceId === ws.id &&
        !e.deletedAt &&
        e.visibility === "public" &&
        e.status === "published"
    )
    .map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      subtitle: e.subtitle,
      summary: e.summary,
      sigil: e.sigil,
      thumbImage: e.thumbImage || e.coverImage
    }));

  const conlang = state.conlangs.find((c) => c.workspaceId === ws.id);

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between text-xs">
        <Link
          href={`/public/${ws.slug}`}
          className="text-[var(--accent)] hover:underline"
        >
          ← {ws.sigil} {ws.name}
        </Link>
        <span className="font-mono text-[var(--text-muted)]">
          Chế độ đọc công khai
        </span>
      </div>

      <PublicEntryArticleClient
        workspaceSlug={ws.slug}
        entry={entry}
        entryType={entryType}
        linkLookup={publicLookup}
        conlang={conlang}
      />
    </div>
  );
}
