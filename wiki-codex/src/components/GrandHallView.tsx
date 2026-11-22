"use client";

import React from "react";
import {
  Activity,
  BookOpen,
  Calendar,
  FolderKanban,
  Hourglass,
  Image as ImageIcon,
  Languages,
  Layers,
  LayoutDashboard,
  Map as MapIcon,
  Network,
  Sparkles,
  StickyNote
} from "lucide-react";
import type {
  ActivityLogItem,
  CuratedCollection,
  EntryCardProjection,
  Workspace
} from "@/types/codex";

interface GrandHallViewProps {
  workspace: Workspace;
  entries: EntryCardProjection[];
  totalEntries: number;
  categoryCount: number;
  entryTypeCount: number;
  collections: CuratedCollection[];
  activities: ActivityLogItem[];
  recentIds: string[];
  onOpenEntry: (id: string) => void;
  onNavigate: (section: string) => void;
}

export function GrandHallView({
  workspace,
  entries,
  totalEntries,
  categoryCount,
  entryTypeCount,
  collections,
  activities,
  recentIds,
  onOpenEntry,
  onNavigate
}: GrandHallViewProps) {
  const featured = entries.find((e) => e.featured) ?? entries[0];
  const recentEntries = recentIds
    .map((id) => entries.find((e) => e.id === id))
    .filter(Boolean) as EntryCardProjection[];

  const shortcuts = [
    { id: "database", label: "Kho Hồ sơ", desc: "Danh sách, Thẻ lưới, Tạp chí & Bảng", icon: BookOpen, color: "#D4AF37" },
    { id: "loreboard", label: "Loreboard Canvas", desc: "Bảng ghim ý tưởng kéo-thả", icon: StickyNote, color: "#C084FC" },
    { id: "calendar", label: "Lịch Pháp Thế Giới", desc: "Tháng, Kỷ nguyên & Pha Mặt trăng", icon: Calendar, color: "#38BDF8" },
    { id: "atlas", label: "Bản đồ Atlas V2", desc: "Lớp bản đồ, Tuyến đường & Thước đo", icon: MapIcon, color: "#34D399" },
    { id: "conlang", label: "Cổ Ngữ V2 (1-Click)", desc: "Dịch xuôi/ngược & Sinh tên thế giới", icon: Languages, color: "#F472B6" },
    { id: "media", label: "Kho Ảnh Media Vault", desc: "Tải ảnh kéo-thả & CDN quy mô lớn", icon: ImageIcon, color: "#F59E0B" },
    { id: "graph", label: "Đồ thị & Gia phả", desc: "BFS tìm đường nối & Cây kế thừa", icon: Network, color: "#60A5FA" },
    { id: "collections", label: "Tuyển tập & Glossary", desc: "Bộ sưu tập đọc, Thuật ngữ & Kanban", icon: FolderKanban, color: "#10B981" }
  ];

  return (
    <div className="space-y-5">
      {/* Grand Hall Hero */}
      <div className="codex-card arcane-corners rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 80% 20%, ${workspace.accentColor}, transparent 60%)`
          }}
        />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[var(--accent)]">
            <LayoutDashboard className="w-4 h-4" />
            <span>ĐẠI SẢNH CỔ THƯ · AETHEL CODEX V2.0 GRAND EDITION</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-4xl leading-none" style={{ color: workspace.accentColor }}>
              {workspace.sigil}
            </span>
            <div>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-[var(--text-primary)]">
                {workspace.name}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-2xl leading-relaxed">
                {workspace.publicTagline || workspace.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono">
            {[
              ["Hồ sơ Codex", totalEntries.toLocaleString("vi-VN"), BookOpen],
              ["Danh mục đa cấp", categoryCount, Layers],
              ["Loại Thực thể", entryTypeCount, Sparkles],
              ["Bộ Sưu Tập", collections.length, Hourglass]
            ].map(([label, val, Icon]) => {
              const Ico = Icon as React.ComponentType<{ className?: string }>;
              return (
                <div
                  key={String(label)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-center gap-3"
                >
                  <Ico className="w-5 h-5 text-[var(--accent)] shrink-0" />
                  <div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{String(val)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{String(label)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Shortcuts Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {shortcuts.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onNavigate(s.id)}
              className="codex-card rounded-2xl p-3.5 text-left space-y-1.5 group cursor-pointer"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                style={{ borderColor: `${s.color}55`, backgroundColor: `${s.color}1A`, color: s.color }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="font-display font-semibold text-sm group-hover:text-[var(--accent)] transition">
                {s.label}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] line-clamp-2">{s.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Featured Entry + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Featured Codex Entry */}
        <div className="lg:col-span-7 space-y-4">
          {featured && (
            <div
              onClick={() => onOpenEntry(featured.id)}
              className="codex-card arcane-corners rounded-2xl overflow-hidden cursor-pointer group"
            >
              {featured.thumbImage && (
                <div className="h-44 overflow-hidden relative border-b border-[var(--border-subtle)]">
                  <img
                    src={featured.thumbImage}
                    alt={featured.title}
                    className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-[#090e1c] font-bold">
                    ✦ HỒ SƠ NỔI BẬT
                  </span>
                </div>
              )}
              <div className="p-5 space-y-2">
                <h2 className="font-display text-2xl font-bold group-hover:text-[var(--accent)] transition">
                  {featured.sigil} {featured.title}
                </h2>
                {featured.subtitle && (
                  <p className="text-xs italic text-[var(--text-muted)]">{featured.subtitle}</p>
                )}
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {featured.summary}
                </p>
                <div className="pt-2 text-xs font-medium text-[var(--accent)]">
                  Mở đọc hồ sơ chi tiết →
                </div>
              </div>
            </div>
          )}

          {recentEntries.length > 0 && (
            <div className="codex-card rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-semibold text-[var(--accent)] uppercase">
                ✦ Tiếp tục đọc gần đây
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentEntries.slice(0, 4).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onOpenEntry(r.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5 text-left hover:border-[var(--accent)] cursor-pointer"
                  >
                    <span className="text-lg text-[var(--accent)]">{r.sigil}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">{r.title}</div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">{r.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Global Activity Feed */}
        <div className="lg:col-span-5 codex-card rounded-2xl p-4 space-y-3">
          <div className="text-xs font-semibold text-[var(--accent)] uppercase flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Nhật ký Hoạt động Tri thức
          </div>
          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Chưa có hoạt động gần đây.</p>
            ) : (
              activities.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                    <strong className="text-[var(--accent)]">{a.actor}</strong>
                    <span className="font-mono">
                      {new Date(a.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[var(--text-secondary)]">
                    {a.action}: <strong className="text-[var(--text-primary)]">{a.targetTitle}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
