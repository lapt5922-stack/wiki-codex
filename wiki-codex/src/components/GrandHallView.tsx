"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Bookmark,
  BookOpen,
  Clock,
  Compass,
  Crown,
  Globe2,
  Hourglass,
  Layers,
  Library,
  Search,
  Shield,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Users
} from "lucide-react";
import type {
  ActivityLogItem,
  CuratedCollection,
  EntryCardProjection,
  TimelineEvent,
  Workspace
} from "@/types/codex";
import type { CharacterListProjection } from "@/types/character-codex";
import type { KingdomListProjection } from "@/types/kingdom-codex";
import { CODEX_MODULES, classifyEntryModule } from "@/lib/codex-modules";
import { useDeviceUI } from "@/lib/device-ui";
import { EntityEmblemSVG } from "./EntityVisualWidgets";
import { DraggableScrollArea } from "./DraggableScrollArea";
import { ImperialBentoCard, ImperialButton } from "./ui/ImperialPrimitives";

interface GrandHallViewProps {
  workspace: Workspace;
  entries: EntryCardProjection[];
  totalEntries: number;
  categoryCount: number;
  entryTypeCount: number;
  collections: CuratedCollection[];
  activities: ActivityLogItem[];
  recentIds: string[];
  bookmarkedIds?: string[];
  onOpenEntry: (id: string) => void;
  onNavigate: (section: string) => void;
  onOpenSearch?: () => void;
  onOpenRandom?: () => void;
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
  bookmarkedIds = [],
  onOpenEntry,
  onNavigate,
  onOpenSearch,
  onOpenRandom
}: GrandHallViewProps) {
  const { isMobile, isTablet } = useDeviceUI();
  const [featuredKingdoms, setFeaturedKingdoms] = useState<KingdomListProjection[]>([]);
  const [totalKingdoms, setTotalKingdoms] = useState<number>(360);
  const [legendaryChars, setLegendaryChars] = useState<CharacterListProjection[]>([]);
  const [totalChars, setTotalChars] = useState<number>(0);
  const [historicalEvents, setHistoricalEvents] = useState<TimelineEvent[]>([]);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    telemetry: true,
    continueReading: true,
    compendium: true,
    world: true,
    kingdoms: true,
    characters: true,
    archives: true
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`aethel_grandhall_v9_${workspace.id}`);
      if (saved) setVisibleSections((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {
      // ignore storage errors
    }
  }, [workspace.id]);

  function toggleSection(key: string) {
    setVisibleSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(`aethel_grandhall_v9_${workspace.id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/kingdoms?workspaceId=${encodeURIComponent(workspace.id)}&sortBy=population&limit=4`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/characters?workspaceId=${encodeURIComponent(workspace.id)}&limit=6`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`/api/timeline?workspaceId=${encodeURIComponent(workspace.id)}`)
        .then((r) => r.json())
        .catch(() => null)
    ]).then(([kData, cData, tData]) => {
      if (!alive) return;
      if (Array.isArray(kData?.items)) setFeaturedKingdoms(kData.items);
      if (typeof kData?.total === "number") setTotalKingdoms(kData.total);
      if (Array.isArray(cData?.items)) setLegendaryChars(cData.items);
      if (typeof cData?.total === "number") setTotalChars(cData.total);
      if (Array.isArray(tData?.events)) setHistoricalEvents(tData.events.slice(0, 5));
    });
    return () => {
      alive = false;
    };
  }, [workspace.id]);

  const flagshipKingdom = featuredKingdoms[0];
  const secondaryKingdoms = featuredKingdoms.slice(1, 4);

  const nonNationEntries = React.useMemo(
    () => entries.filter((e) => !e.id.startsWith("ent-nation-")),
    [entries]
  );

  const recentEntries = React.useMemo(
    () =>
      recentIds
        .map((id) => entries.find((e) => e.id === id))
        .filter(Boolean) as EntryCardProjection[],
    [recentIds, entries]
  );

  const bookmarkedEntries = React.useMemo(
    () =>
      bookmarkedIds
        .map((id) => entries.find((e) => e.id === id))
        .filter(Boolean) as EntryCardProjection[],
    [bookmarkedIds, entries]
  );

  const recentlyUpdated = React.useMemo(
    () =>
      [...nonNationEntries]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [nonNationEntries]
  );

  const moduleCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      const mod = classifyEntryModule(e);
      map[mod] = (map[mod] || 0) + 1;
    }
    return map;
  }, [entries]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-v9-page-enter">
      {/* =====================================================================
          1. V9.0 ASTRAL SANCTUM HERO & OMNI-SEARCH COMMAND CENTER
          ===================================================================== */}
      <section className="relative rounded-3xl overflow-hidden border border-[var(--border-strong)] shadow-2xl min-h-[340px] sm:min-h-[410px] flex flex-col justify-between">
        <img
          src={workspace.publicBannerUrl || "/art/grand-hall-hero.svg"}
          alt={workspace.name}
          className="absolute inset-0 w-full h-full object-cover object-center opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(125deg, rgba(10,14,25,0.94) 0%, rgba(16,22,38,0.82) 55%, rgba(10,14,25,0.72) 100%)"
          }}
        />

        {/* Top Bar inside Hero */}
        <div className="relative z-10 px-5 sm:px-8 pt-5 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full royal-seal-badge text-[10px] sm:text-[11px] font-mono uppercase">
            <span>{workspace.sigil || "✦"}</span>
            <span>Aethel Codex V9.0 · {workspace.name}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowLayoutControls((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/45 hover:bg-black/65 border border-white/15 text-[11px] text-[#EFE6D5] transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#CDAA6A]" />
            <span>Bố cục Đại Sảnh</span>
          </button>
        </div>

        {/* Center / Bottom Hero Content */}
        <div className="relative z-10 px-5 sm:px-8 lg:px-10 pb-6 sm:pb-8 pt-6 space-y-5 max-w-4xl">
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-wide text-[#EFE6D5] leading-[1.08]">
              {workspace.name.toUpperCase()}
            </h1>
            <p className="text-xs sm:text-base text-[#CBD4E1] max-w-2xl leading-relaxed">
              {workspace.publicTagline ||
                workspace.description ||
                "Đại Thư Viện Bách Khoa Đa Thế Giới — lưu trữ chính sử 360 quốc gia, phả hệ nhân vật 17 nhóm, xưởng huy hiệu hoàng gia và mạng lưới tri thức liên kết hai chiều."}
            </p>
          </div>

          {/* Prominent Uiverse-Inspired Omni-Search Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl">
            <button
              type="button"
              onClick={() => (onOpenSearch ? onOpenSearch() : onNavigate("database"))}
              className="v9-sheen-btn flex-1 min-h-[50px] px-4 sm:px-5 rounded-2xl bg-[#0b101b]/90 hover:bg-[#141d2e] border border-[#CDAA6A]/50 hover:border-[#CDAA6A] flex items-center justify-between gap-3 text-left shadow-xl cursor-pointer group"
            >
              <span className="flex items-center gap-3 min-w-0">
                <Search className="w-5 h-5 text-[#CDAA6A] shrink-0" />
                <span className="text-xs sm:text-sm text-[#CBD4E1] group-hover:text-white truncate">
                  Tìm nhanh thực thể, mã CHAR / KING / DOC, sự kiện, cổ ngữ...
                </span>
              </span>
              <kbd className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-white/10 border border-[#CDAA6A]/35 text-[11px] font-mono text-[#CDAA6A] shrink-0">
                Ctrl K
              </kbd>
            </button>

            {onOpenRandom && (
              <button
                type="button"
                onClick={onOpenRandom}
                title="Khám phá ngẫu nhiên một hồ sơ tri thức"
                className="v9-sheen-btn min-h-[50px] px-4 rounded-2xl bg-[#1A2334]/90 hover:bg-[#233047] border border-[#CDAA6A]/40 text-[#EFE6D5] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Shuffle className="w-4 h-4 text-[#CDAA6A]" />
                <span>Ngẫu nhiên</span>
              </button>
            )}
          </div>

          {/* Quick Studio Portals */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <ImperialButton size="lg" onClick={() => onNavigate("atlas")}>
              <Globe2 className="w-4 h-4" />
              <span>Đại Bản Đồ 360</span>
              <ArrowRight className="w-4 h-4" />
            </ImperialButton>
            <button
              type="button"
              onClick={() => onNavigate("database")}
              className="v9-sheen-btn min-h-[42px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#EFE6D5] text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
            >
              <Library className="w-4 h-4 text-[#CDAA6A]" />
              <span>Database Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("heraldry")}
              className="v9-sheen-btn min-h-[42px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#EFE6D5] text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#CDAA6A]" />
              <span>Heraldry &amp; Flag Studio</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate("v4studio")}
              className="v9-sheen-btn min-h-[42px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#EFE6D5] text-xs sm:text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#CDAA6A]" />
              <span>Địa Cầu 3D &amp; Phả Hệ</span>
            </button>
          </div>

          {showLayoutControls && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/15 text-xs">
              <span className="text-[#CBD4E1] mr-1">Khu vực hiển thị:</span>
              {(
                [
                  ["telemetry", "Chỉ số Kho dữ liệu"],
                  ["continueReading", "Tiếp tục đọc & Đã ghim"],
                  ["compendium", "14 Cổng Phân hệ"],
                  ["world", "Bản đồ Hành tinh"],
                  ["kingdoms", "Đế chế & Vương quốc"],
                  ["characters", "Nhân vật"],
                  ["archives", "Biên niên sử & Nhật ký"]
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer transition ${
                    visibleSections[key]
                      ? "border-[#CDAA6A] bg-[#CDAA6A]/25 text-white font-semibold"
                      : "border-white/15 text-white/55 line-through"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================================
          2. LIVE DATABASE TELEMETRY BENTO STRIP (100% Real DB Metrics)
          ===================================================================== */}
      {visibleSections.telemetry && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              label: "Hồ sơ Bách khoa",
              value: totalEntries.toLocaleString("vi-VN"),
              sub: `${entryTypeCount} loại thực thể`,
              icon: BookOpen,
              target: "database"
            },
            {
              label: "Chính thể Quốc gia",
              value: totalKingdoms.toLocaleString("vi-VN"),
              sub: "8 Lục địa Aethelgard",
              icon: Crown,
              target: "kingdoms"
            },
            {
              label: "Hồ sơ Nhân vật",
              value: (totalChars || legendaryChars.length).toLocaleString("vi-VN"),
              sub: "Chuẩn 17 nhóm dữ liệu",
              icon: Users,
              target: "characters"
            },
            {
              label: "Danh mục Phân cấp",
              value: categoryCount.toLocaleString("vi-VN"),
              sub: "14 phân hệ Codex",
              icon: Layers,
              target: "modules"
            },
            {
              label: "Mốc Biên niên sử",
              value: `${historicalEvents.length}+`,
              sub: "Đối chiếu đa kỷ nguyên",
              icon: Hourglass,
              target: "timeline"
            },
            {
              label: "Tuyển tập Chủ đề",
              value: collections.length.toLocaleString("vi-VN"),
              sub: "Lưu trữ & Từ điển",
              icon: Compass,
              target: "collections"
            }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <ImperialBentoCard
                key={stat.label}
                interactive
                onClick={() => onNavigate(stat.target)}
                className="p-3.5 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center justify-between text-[var(--accent)]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] truncate">
                    {stat.label}
                  </span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-none">
                  {stat.value}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] truncate">{stat.sub}</div>
              </ImperialBentoCard>
            );
          })}
        </section>
      )}

      {/* =====================================================================
          3. CONTINUE READING & BOOKMARKS RIBBON (Personal Knowledge Flow)
          ===================================================================== */}
      {visibleSections.continueReading && (recentEntries.length > 0 || bookmarkedEntries.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {recentEntries.length > 0 && (
            <ImperialBentoCard className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Tiếp tục Đọc Gần Đây
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {recentEntries.length} hồ sơ
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentEntries.slice(0, 4).map((ent) => (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => onOpenEntry(ent.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/55 px-3 py-2 text-left hover:border-[var(--border-strong)] transition cursor-pointer"
                  >
                    <span className="text-base text-[var(--accent)] shrink-0">{ent.sigil || "✦"}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {ent.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {ent.subtitle || "Nhấn để mở lại"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ImperialBentoCard>
          )}

          {bookmarkedEntries.length > 0 && (
            <ImperialBentoCard className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" /> Hồ Sơ Đã Đánh Dấu
                </span>
                <span className="text-[10px] font-mono text-[var(--text-muted)]">
                  {bookmarkedEntries.length} mục đã ghim
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {bookmarkedEntries.slice(0, 4).map((ent) => (
                  <button
                    key={ent.id}
                    type="button"
                    onClick={() => onOpenEntry(ent.id)}
                    className="flex items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/55 px-3 py-2 text-left hover:border-[var(--border-strong)] transition cursor-pointer"
                  >
                    <span className="text-base text-[var(--accent)] shrink-0">{ent.sigil || "★"}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {ent.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {ent.summary || ent.subtitle || "Hồ sơ yêu thích"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ImperialBentoCard>
          )}
        </section>
      )}

      {/* =====================================================================
          4. 14 CODEX COMPENDIUM PORTALS & RECENTLY UPDATED RAIL
          ===================================================================== */}
      {visibleSections.compendium && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="editorial-kicker">14 Codex Domains · Hệ Sinh Thái Tri Thức</div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                  Cổng Phân Hệ Bách Khoa Toàn Thư
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("modules")}
                className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Mở không gian 14 phân hệ <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {CODEX_MODULES.map((mod) => {
                const count =
                  mod.id === "kingdom"
                    ? totalKingdoms
                    : mod.id === "character"
                    ? totalChars || moduleCounts[mod.id] || 0
                    : moduleCounts[mod.id] || 0;
                return (
                  <ImperialBentoCard
                    key={mod.id}
                    interactive
                    onClick={() => onNavigate(mod.targetSection)}
                    className="p-3.5 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base border"
                        style={{
                          borderColor: `${mod.accentColor}55`,
                          backgroundColor: `${mod.accentColor}18`
                        }}
                      >
                        {mod.sigil}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] text-[var(--text-muted)]">
                        {mod.idPrefix} · {count}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-xs sm:text-sm text-[var(--text-primary)] leading-snug">
                        {mod.titleVi}
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-0.5 leading-relaxed">
                        {mod.description}
                      </p>
                    </div>
                  </ImperialBentoCard>
                );
              })}
            </div>
          </div>

          {/* Right Rail: Recently Updated & Studio Shortcuts */}
          <div className="lg:col-span-4 space-y-3.5">
            <ImperialBentoCard className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Hồ Sơ Vừa Cập Nhật
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate("database")}
                  className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
                >
                  Xem tất cả →
                </button>
              </div>
              <div className="space-y-1">
                {recentlyUpdated.slice(0, 6).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenEntry(item.id)}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-white/5 text-left transition cursor-pointer"
                  >
                    <span className="text-base text-[var(--accent)] shrink-0">{item.sigil || "✦"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {item.subtitle || "Hồ sơ Codex"} · {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ImperialBentoCard>

            <ImperialBentoCard className="p-4 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Phòng Chức Năng Chuyên Biệt
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: "graph", label: "Đồ thị Graph Pro" },
                  { id: "archives", label: "Văn khố Lịch sử" },
                  { id: "conlang", label: "Xưởng Cổ ngữ" },
                  { id: "calendar", label: "Lịch Đa Trăng" },
                  { id: "media", label: "Kho Ảnh Media" },
                  { id: "health", label: "Kiểm toán & AI" }
                ].map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onNavigate(tool.id)}
                    className="v9-sheen-btn px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-primary)] hover:border-[var(--border-strong)] text-left font-medium cursor-pointer"
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            </ImperialBentoCard>
          </div>
        </section>
      )}

      {/* =====================================================================
          5. FEATURED PLANETARY ATLAS SHOWCASE
          ===================================================================== */}
      {visibleSections.world && (
        <ImperialBentoCard
          interactive
          onClick={() => onNavigate("atlas")}
          className="overflow-hidden grid grid-cols-1 lg:grid-cols-12"
        >
          <div className="lg:col-span-7 relative min-h-[200px] sm:min-h-[250px]">
            <img
              src="/art/featured-world-atlas.svg"
              alt="Arcane Atlas of Aethelgard Prime"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/75 via-transparent to-transparent" />
          </div>
          <div className="lg:col-span-5 p-5 sm:p-7 flex flex-col justify-center gap-3.5">
            <span className="editorial-kicker">Planetary Atlas · 8 Lục Địa · 360 Chính Thể</span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Đại Bản Đồ Hành Tinh Aethelgard Prime
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Khảo sát ranh giới Voronoi 360 quốc gia, địa hình sinh thái, tuyến hải trình, đo khoảng cách di chuyển và thanh trượt biến động lịch sử qua từng thời đại.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--accent)]">
                Atlas 2D + Địa Cầu 3D
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)]/75 border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]">
                Nhấn để mở bản đồ →
              </span>
            </div>
          </div>
        </ImperialBentoCard>
      )}

      {/* =====================================================================
          6. FEATURED KINGDOMS — BENTO SHOWCASE
          ===================================================================== */}
      {visibleSections.kingdoms && featuredKingdoms.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="editorial-kicker">Kingdom Codex · 18 Nhóm Địa Chính Trị</div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                Đế Chế &amp; Vương Quốc Tiêu Biểu
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("kingdoms")}
              className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              Xem toàn bộ {totalKingdoms} quốc gia <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {flagshipKingdom && (
              <article
                onClick={() => onNavigate("kingdoms")}
                className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[var(--border-strong)] v9-bento-interactive cursor-pointer min-h-[260px] sm:min-h-[310px] flex flex-col justify-end p-5 sm:p-7"
              >
                <img
                  src="/art/kingdom-editorial-cover.svg"
                  alt={flagshipKingdom.officialName}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b101b] via-[#0b101b]/70 to-transparent" />
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <EntityEmblemSVG config={flagshipKingdom.emblemConfig} sigil="⚜" size={50} />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[#CDAA6A]">
                        {flagshipKingdom.id} · {flagshipKingdom.continent}
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-[#EFE6D5] truncate">
                        {flagshipKingdom.officialName}
                      </h3>
                      <div className="text-xs text-[#CBD4E1]">
                        Thủ đô {flagshipKingdom.capitalName} · {flagshipKingdom.governmentType}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-[#EFE6D5]/90 pt-1">
                    <span>Dân số: {flagshipKingdom.population.toLocaleString("vi-VN")}</span>
                    <span>·</span>
                    <span>Diện tích: {flagshipKingdom.areaKm2.toLocaleString("vi-VN")} km²</span>
                    <span>·</span>
                    <span>Tiền tệ: {flagshipKingdom.currencyCode}</span>
                  </div>
                </div>
              </article>
            )}

            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {secondaryKingdoms.map((k) => (
                <ImperialBentoCard
                  key={k.id}
                  interactive
                  onClick={() => onNavigate("kingdoms")}
                  className="p-4 flex items-center gap-3.5"
                >
                  <EntityEmblemSVG config={k.emblemConfig} sigil="⚜" size={44} />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-[var(--accent)]">{k.id}</span>
                      <span className="text-[10px] text-[var(--text-muted)] truncate">{k.continent}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[var(--text-primary)] truncate">
                      {k.officialName}
                    </h3>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      Thủ đô {k.capitalName} · {k.governmentType}
                    </div>
                  </div>
                </ImperialBentoCard>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          7. LEGENDARY CHARACTERS — PORTRAIT SHOWCASE
          ===================================================================== */}
      {visibleSections.characters && legendaryChars.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="editorial-kicker">Character Codex · 17 Nhóm Hồ Sơ Nhân Vật</div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                Nhân Vật Lịch Sử &amp; Huyền Thoại
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("characters")}
              className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              Mở Character Codex <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isMobile || isTablet ? (
            <DraggableScrollArea ariaLabel="Nhân vật huyền thoại" innerClassName="flex gap-3 pb-1">
              {legendaryChars.map((ch) => (
                <article
                  key={ch.id}
                  onClick={() => onNavigate("characters")}
                  className="relative w-52 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden border border-[var(--border-strong)] v9-bento-interactive cursor-pointer flex flex-col justify-end p-4"
                >
                  <img
                    src={ch.portraitUrl || "/art/character-portrait-bg.svg"}
                    alt={ch.fullName}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b101b] via-[#0b101b]/45 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <span className="font-mono text-[10px] text-[#CDAA6A]">{ch.id}</span>
                    <h3 className="font-display text-base font-bold text-[#EFE6D5] leading-snug">
                      {ch.fullName}
                    </h3>
                    {(ch.titles[0] || ch.race) && (
                      <div className="text-[11px] text-[#CBD4E1] line-clamp-1">
                        {ch.titles[0] || ch.race}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </DraggableScrollArea>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {legendaryChars.slice(0, 4).map((ch) => (
                <article
                  key={ch.id}
                  onClick={() => onNavigate("characters")}
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[var(--border-strong)] v9-bento-interactive cursor-pointer flex flex-col justify-end p-4 group"
                >
                  <img
                    src={ch.portraitUrl || "/art/character-portrait-bg.svg"}
                    alt={ch.fullName}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b101b] via-[#0b101b]/50 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-[#CDAA6A]">{ch.id}</span>
                      {ch.race && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full royal-seal-badge">
                          {ch.race}
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#EFE6D5] leading-snug">
                      {ch.fullName}
                    </h3>
                    {(ch.titles.length > 0 || ch.nationality) && (
                      <div className="text-xs text-[#CBD4E1] line-clamp-1">
                        {ch.titles.join(" · ") || ch.nationality}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          8. LIVING TIMELINE & EDITORIAL ACTIVITY STREAM
          ===================================================================== */}
      {visibleSections.archives && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <ImperialBentoCard className="lg:col-span-7 p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="editorial-kicker">Living Chronicle · Dòng Thời Gian</div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mt-0.5">
                  <Hourglass className="w-4 h-4 text-[var(--accent)]" /> Sự Kiện Lịch Sử Trọng Đại
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("timeline")}
                className="text-xs text-[var(--accent)] hover:underline cursor-pointer"
              >
                Mở Timeline →
              </button>
            </div>
            <div className="editorial-rule" />

            {historicalEvents.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">Chưa có sự kiện nào được ghi nhận.</p>
            ) : (
              <div className="space-y-2.5">
                {historicalEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => onNavigate("timeline")}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/55 hover:border-[var(--border-strong)] p-3.5 transition cursor-pointer space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="font-mono font-bold text-[var(--accent)]">{ev.dateLabel}</span>
                      <span className="text-[var(--text-muted)]">{ev.era}</span>
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-[var(--text-primary)]">
                      {ev.sigil} {ev.title}
                    </div>
                    {ev.summary && (
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {ev.summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ImperialBentoCard>

          <ImperialBentoCard className="lg:col-span-5 p-5 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="editorial-kicker">Archival Ledger · Nhật Ký Biên Tập</div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-[var(--text-primary)] flex items-center gap-2 mt-0.5">
                  <Activity className="w-4 h-4 text-[var(--accent)]" /> Hoạt Động Gần Nhất
                </h2>
              </div>
            </div>
            <div className="editorial-rule" />

            {activities.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                Chưa có lịch sử chỉnh sửa mới trong phiên này.
              </p>
            ) : (
              <div className="space-y-2.5">
                {activities.slice(0, 6).map((act) => (
                  <div
                    key={act.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3.5 py-2.5 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {act.targetTitle}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                        {new Date(act.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {act.actor} · <span className="text-[var(--accent)]">{act.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ImperialBentoCard>
        </section>
      )}
    </div>
  );
}
