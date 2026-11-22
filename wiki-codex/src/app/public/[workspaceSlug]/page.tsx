import Link from "next/link";
import { notFound } from "next/navigation";
import { loadState, queryEntriesFromState } from "@/db/repository";

export const dynamic = "force-dynamic";

export default async function PublicWorkspacePage({
  params,
  searchParams
}: {
  params: Promise<{ workspaceSlug: string }>;
  searchParams: Promise<{ q?: string; page?: string; cat?: string }>;
}) {
  const { workspaceSlug } = await params;
  const sp = await searchParams;
  const state = await loadState();
  const ws = state.workspaces.find((w) => w.slug === workspaceSlug && w.isPublic);
  if (!ws) notFound();

  const page = Number(sp.page || "1");
  const q = sp.q || "";
  const catId = sp.cat || null;

  const paginated = queryEntriesFromState(state, {
    workspaceId: ws.id,
    role: "guest",
    query: q,
    categoryId: catId,
    page,
    limit: 24
  });

  const typeMap = new Map(
    state.entryTypes.filter((t) => t.workspaceId === ws.id).map((t) => [t.id, t])
  );
  const rootCategories = state.categories.filter(
    (c) => c.workspaceId === ws.id && !c.deletedAt && !c.parentId
  );
  const publicCollections = state.collections.filter(
    (c) => c.workspaceId === ws.id && c.isPublic
  );
  const timeline = state.timelineEvents
    .filter((t) => t.workspaceId === ws.id)
    .sort((a, b) => a.sortYear - b.sortYear)
    .slice(0, 6);

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="codex-card arcane-corners rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <Link href="/public" className="text-[var(--accent)] hover:underline">
            ← Tất cả Bộ Bách Khoa Công Khai
          </Link>
          <span className="font-mono text-[var(--text-muted)]">
            {paginated.total.toLocaleString("vi-VN")} hồ sơ công khai · V2.0
          </span>
        </div>
        <div className="flex items-start gap-3">
          <span className="text-4xl" style={{ color: ws.accentColor }}>
            {ws.sigil}
          </span>
          <div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold">
              {ws.name}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {ws.publicTagline || ws.description}
            </p>
          </div>
        </div>

        {/* Public Category Chips */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <Link
            href={`/public/${ws.slug}`}
            className={`px-3 py-1 rounded-full border ${
              !catId
                ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                : "border-[var(--border-subtle)] text-[var(--text-muted)]"
            }`}
          >
            Tất cả danh mục
          </Link>
          {rootCategories.map((c) => (
            <Link
              key={c.id}
              href={`/public/${ws.slug}?cat=${c.id}`}
              className={`px-3 py-1 rounded-full border ${
                catId === c.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent)]"
              }`}
            >
              {c.sigil} {c.name}
            </Link>
          ))}
        </div>

        <form method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Tìm nhanh trong bộ bách khoa (hỗ trợ tiếng Việt không dấu & biệt danh)..."
            className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3.5 py-2 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
          >
            Tìm kiếm
          </button>
        </form>
      </header>

      {/* Public Curated Collections */}
      {publicCollections.length > 0 && !q && !catId && (
        <section className="space-y-2.5">
          <h2 className="font-display text-lg text-[var(--accent)]">✦ Bộ Sưu Tập Đọc Nổi Bật</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {publicCollections.map((col) => (
              <div key={col.id} className="codex-card rounded-2xl p-4 space-y-2">
                <div className="font-display font-bold text-base text-[var(--accent)]">
                  {col.sigil} {col.title}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{col.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {col.entryIds.map((eid) => {
                    const ent = state.entries.find(
                      (x) =>
                        x.id === eid &&
                        !x.deletedAt &&
                        x.visibility === "public" &&
                        x.status === "published"
                    );
                    if (!ent) return null;
                    return (
                      <Link
                        key={eid}
                        href={`/public/${ws.slug}/${ent.slug}`}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] text-[var(--text-primary)]"
                      >
                        {ent.sigil} {ent.title}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Public Entries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.items.map((entry) => {
          const type = typeMap.get(entry.entryTypeId);
          return (
            <Link
              key={entry.id}
              href={`/public/${ws.slug}/${entry.slug}`}
              className="codex-card arcane-corners rounded-2xl overflow-hidden flex flex-col group"
            >
              {entry.thumbImage ? (
                <img
                  src={entry.thumbImage}
                  alt={entry.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-32 object-cover border-b border-[var(--border-subtle)]"
                />
              ) : (
                <div className="h-24 flex items-center justify-center text-3xl text-[var(--accent)]/40 border-b border-[var(--border-subtle)]">
                  {entry.sigil}
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col gap-1.5">
                <div className="text-[11px] font-mono text-[var(--accent)]">
                  {type?.sigil} {type?.name}
                </div>
                <h2 className="font-display text-base font-bold group-hover:text-[var(--accent)]">
                  {entry.title}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                  {entry.summary || entry.subtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Public Chronicle Timeline Preview */}
      {timeline.length > 0 && !q && (
        <section className="codex-card rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-lg text-[var(--accent)]">⧗ Biên Niên Sử Công Khai</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {timeline.map((ev) => (
              <div key={ev.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 text-xs">
                <div className="font-mono text-[var(--accent)]">{ev.dateLabel} · {ev.era}</div>
                <div className="font-display font-semibold text-sm mt-0.5">{ev.sigil} {ev.title}</div>
                <p className="text-[var(--text-secondary)] mt-1">{ev.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {paginated.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs">
          {paginated.page > 1 ? (
            <Link
              href={`/public/${ws.slug}?page=${paginated.page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${catId ? `&cat=${encodeURIComponent(catId)}` : ""}`}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]"
            >
              ← Trang trước
            </Link>
          ) : (
            <span />
          )}
          <span className="font-mono text-[var(--text-muted)]">
            Trang {paginated.page} / {paginated.totalPages}
          </span>
          {paginated.hasMore && (
            <Link
              href={`/public/${ws.slug}?page=${paginated.page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${catId ? `&cat=${encodeURIComponent(catId)}` : ""}`}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]"
            >
              Trang sau →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
