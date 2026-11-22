import Link from "next/link";
import { loadState } from "@/db/repository";

export const dynamic = "force-dynamic";

export default async function PublicPortalIndexPage() {
  const state = await loadState();
  const publicWorkspaces = state.workspaces.filter((w) => w.isPublic);

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 py-10 space-y-8">
      <header className="text-center space-y-3">
        <div className="text-4xl text-[var(--accent)]">✦</div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
          Cổng Bách Khoa Tri Thức Công Khai
        </h1>
        <p className="text-sm text-[var(--text-muted)] max-w-xl mx-auto">
          Thư viện mở được xuất bản từ hệ thống Aethel Codex — ai cũng có thể truy cập tra cứu miễn phí các vương quốc, nhân vật, địa danh và cổ thư công khai.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] hover:bg-[var(--accent-soft)]"
          >
            ← Quay lại Không gian Quản trị & Biên tập
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {publicWorkspaces.map((ws) => {
          const count = state.entries.filter(
            (e) =>
              e.workspaceId === ws.id &&
              !e.deletedAt &&
              e.visibility === "public" &&
              e.status === "published"
          ).length;

          return (
            <Link
              key={ws.id}
              href={`/public/${ws.slug}`}
              className="codex-card arcane-corners rounded-2xl p-6 space-y-3 block group"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl" style={{ color: ws.accentColor }}>
                  {ws.sigil}
                </span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  {count} hồ sơ công khai
                </span>
              </div>
              <h2 className="font-display text-xl font-bold group-hover:text-[var(--accent)] transition">
                {ws.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {ws.description}
              </p>
              <div className="text-xs font-medium text-[var(--accent)] pt-1">
                Khám phá bộ bách khoa →
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
