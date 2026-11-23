"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Clock,
  Compass,
  Crown,
  Globe2,
  Hourglass,
  Library,
  Search,
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
import { useDeviceUI } from "@/lib/device-ui";
import { EntityEmblemSVG } from "./EntityVisualWidgets";
import { DraggableScrollArea } from "./DraggableScrollArea";

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
  onOpenSearch?: () => void;
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
  onNavigate,
  onOpenSearch
}: GrandHallViewProps) {
  const { isMobile, isTablet } = useDeviceUI();
  const [featuredKingdoms, setFeaturedKingdoms] = useState<KingdomListProjection[]>([]);
  const [legendaryChars, setLegendaryChars] = useState<CharacterListProjection[]>([]);
  const [historicalEvents, setHistoricalEvents] = useState<TimelineEvent[]>([]);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [visibleSections, setVisibleSections] = useState<Record<string, boolean>>({
    compendium: true,
    world: true,
    kingdoms: true,
    characters: true,
    archives: true
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(`aethel_grandhall_layout_${workspace.id}`);
      if (saved) setVisibleSections((prev) => ({ ...prev, ...JSON.parse(saved) }));
    } catch {
      // ignore
    }
  }, [workspace.id]);

  function toggleSection(key: string) {
    setVisibleSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        window.localStorage.setItem(`aethel_grandhall_layout_${workspace.id}`, JSON.stringify(next));
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
      if (Array.isArray(cData?.items)) setLegendaryChars(cData.items);
      if (Array.isArray(tData?.events)) setHistoricalEvents(tData.events.slice(0, 5));
    });
    return () => {
      alive = false;
    };
  }, [workspace.id]);

  const flagshipKingdom = featuredKingdoms[0];
  const secondaryKingdoms = featuredKingdoms.slice(1, 4);

  const discoveryEntries = entries
    .filter((e) => !e.id.startsWith("ent-nation-"))
    .slice(0, 6);

  const recentEntries = recentIds
    .map((id) => entries.find((e) => e.id === id))
    .filter(Boolean) as EntryCardProjection[];

  const recentlyUpdated = [...entries]
    .filter((e) => !e.id.startsWith("ent-nation-"))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <div className="space-y-8 sm:space-y-10 animate-codex-fade-up">
      {/* =====================================================================
          1. CINEMATIC HERO SECTION — IMPERIAL GRAND LIBRARY (Mobile & Desktop)
          ===================================================================== */}
      <section className="relative rounded-3xl overflow-hidden border border-[#C6A568]/40 shadow-2xl min-h-[360px] sm:min-h-[430px] lg:min-h-[470px] flex items-end">
        <img
          src="/art/grand-hall-hero.svg"
          alt="Aethel Codex Grand Library"
          className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02] transition-transform duration-700"
        />
        {/* Layered Midnight Navy Editorial Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101522] via-[#101522]/75 to-[#101522]/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101522]/90 via-[#101522]/45 to-transparent" />

        <div className="relative z-10 w-full p-5 sm:p-8 lg:p-11 space-y-5 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full royal-seal-badge text-[10px] sm:text-[11px] font-mono uppercase">
            <span>✦</span>
            <span>Imperial Fantasy Archive · {workspace.name}</span>
          </div>

          <div className="space-y-2.5">
            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-wide text-[#E9DFC9] leading-[1.08] drop-shadow-lg">
              AETHEL CODEX
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-[#E9DFC9]/85 max-w-2xl leading-relaxed font-normal">
              {workspace.publicTagline ||
                "Đại Thư Viện Bách Khoa Thế Giới Giả Tưởng — nơi lưu giữ biên niên sử các đế chế, phả hệ hoàng tộc, bản đồ 360 quốc gia và mạng lưới tri thức xuyên kỷ nguyên."}
            </p>
          </div>

          {/* Large Hero Search Trigger */}
          <button
            type="button"
            onClick={() => (onOpenSearch ? onOpenSearch() : onNavigate("database"))}
            className="w-full max-w-2xl min-h-[50px] sm:min-h-[54px] px-4 sm:px-5 rounded-2xl bg-[#101522]/85 hover:bg-[#1D2636]/95 border border-[#C6A568]/45 hover:border-[#C6A568] backdrop-blur-md flex items-center justify-between gap-3 text-left transition shadow-xl cursor-pointer group"
          >
            <span className="flex items-center gap-3 min-w-0">
              <Search className="w-5 h-5 text-[#C6A568] shrink-0" />
              <span className="text-xs sm:text-sm text-[#C8D0DC] group-hover:text-[#E9DFC9] truncate">
                Tra cứu 360 quốc gia, nhân vật (CHAR-ID), tư liệu cổ, bản đồ...
              </span>
            </span>
            <kbd className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg bg-white/5 border border-[#C6A568]/30 text-[11px] font-mono text-[#C6A568] shrink-0">
              Ctrl K
            </kbd>
          </button>

          {/* Primary Action Buttons (Stack smoothly on Mobile, Inline on Desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => onNavigate("atlas")}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#C6A568] hover:bg-[#d6b77b] text-[#101522] font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition shadow-lg cursor-pointer"
            >
              <Globe2 className="w-4 h-4" />
              <span>Khám phá Đại Bản Đồ 360</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("database")}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#1D2636]/90 hover:bg-[#263247] border border-[#C6A568]/45 text-[#E9DFC9] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Library className="w-4 h-4 text-[#C6A568]" />
              <span>Mở Thư viện 14 Phân hệ Codex</span>
            </button>
            <button
              type="button"
              onClick={() => setShowLayoutControls((v) => !v)}
              className="min-h-[46px] px-4 py-2.5 rounded-xl bg-[#101522]/70 hover:bg-[#1D2636] border border-[#AEB7C4]/25 text-[#AEB7C4] hover:text-[#E9DFC9] text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C6A568]" />
              <span>Tùy chỉnh Đại Sảnh</span>
            </button>
          </div>

          {showLayoutControls && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10 text-xs">
              <span className="text-[#AEB7C4]">Hiển thị khu vực:</span>
              {(
                [
                  ["compendium", "Bách khoa Danh mục"],
                  ["world", "Đại Bản Đồ"],
                  ["kingdoms", "Vương quốc Nổi bật"],
                  ["characters", "Nhân vật Huyền thoại"],
                  ["archives", "Biên niên sử & Lưu trữ"]
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleSection(key)}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer transition ${
                    visibleSections[key]
                      ? "border-[#C6A568] bg-[#C6A568]/20 text-[#E9DFC9] font-semibold"
                      : "border-white/15 text-[#AEB7C4]/60 line-through"
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
          1B. COMPENDIUM CATEGORY BANNERS & RECENT ARTICLES RAIL (Ref Image 3)
          ===================================================================== */}
      {visibleSections.compendium && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="editorial-kicker">Compendium · Mục lục Đại Thư Viện</div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9] mt-0.5">
                  Khám phá theo Phân hệ Tri thức
                </h2>
              </div>
              <span className="text-xs text-[#AEB7C4] font-mono">{totalEntries} hồ sơ thực tế</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "kingdoms", title: "Quốc gia & Chính thể", meta: "360 Quốc gia · 8 Lục địa", art: "/art/kingdom-editorial-cover.svg", accent: "from-[#6D3D49]/65" },
                { id: "characters", title: "Nhân vật & Dòng tộc", meta: `${legendaryChars.length || "Hồ sơ"} Nhân vật & Phả hệ`, art: "/art/character-portrait-bg.svg", accent: "from-[#1D2636]/80" },
                { id: "atlas", title: "Địa lý & Đại Bản Đồ", meta: "Atlas 2D/3D · 8 Lớp Bản đồ", art: "/art/featured-world-atlas.svg", accent: "from-[#1B3B6F]/70" },
                { id: "heraldry", title: "Xưởng Huy hiệu & Cờ hiệu", meta: "2.400+ Mẫu · 450+ Quốc kỳ", art: "/art/grand-hall-hero.svg", accent: "from-[#5B2C6F]/60" },
                { id: "archives", title: "Tư liệu Lịch sử & Góc nhìn", meta: "11 Loại Tư liệu · Đa góc nhìn", art: "/art/grand-hall-hero.svg", accent: "from-[#101522]/85" },
                { id: "timeline", title: "Dòng thời gian & Biên niên sử", meta: `${historicalEvents.length || 0}+ Mốc sự kiện lịch sử`, art: "/art/featured-world-atlas.svg", accent: "from-[#141821]/85" },
                { id: "graph", title: "Mạng lưới Tri thức (Graph)", meta: "Quan hệ đa chiều & Xác minh", art: "/art/featured-world-atlas.svg", accent: "from-[#1B6B4A]/55" },
                { id: "database", title: "14 Phân hệ Bách khoa", meta: `${categoryCount} Danh mục · ${entryTypeCount} Loại thực thể`, art: "/art/kingdom-editorial-cover.svg", accent: "from-[#8C6239]/55" }
              ].map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => onNavigate(card.id)}
                  className="group relative h-24 rounded-2xl overflow-hidden border border-[#AEB7C4]/18 hover:border-[#C6A568]/70 text-left transition-all cursor-pointer shadow-md"
                >
                  <img
                    src={card.art}
                    alt={card.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 group-hover:opacity-50 transition-all duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-r ${card.accent} via-[#101522]/80 to-[#101522]/55`} />
                  <div className="relative z-10 h-full px-4 flex flex-col justify-center">
                    <div className="font-semibold text-sm sm:text-base text-[#E9DFC9] group-hover:text-[#C6A568] transition">
                      {card.title}
                    </div>
                    <div className="text-[11px] text-[#AEB7C4] mt-0.5">{card.meta}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Rail: Recent Articles & Quick Tools */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl border border-[#AEB7C4]/18 bg-[#1D2636]/75 p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#C6A568]">
                  Cập nhật Gần đây
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate("database")}
                  className="text-[11px] text-[#657D91] hover:text-[#C6A568] cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="space-y-1.5">
                {recentlyUpdated.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenEntry(item.id)}
                    className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-white/5 text-left transition cursor-pointer"
                  >
                    <span className="text-base shrink-0">{item.sigil || "✦"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-[#E9DFC9] truncate">{item.title}</div>
                      <div className="text-[10px] text-[#AEB7C4] truncate">
                        {item.subtitle || "Hồ sơ Bách khoa"} · {new Date(item.updatedAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#AEB7C4]/18 bg-[#1D2636]/75 p-4 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#C6A568]">
                Lối tắt Nghiên cứu
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button type="button" onClick={() => onNavigate("collections")} className="px-2.5 py-2 rounded-xl border border-white/10 bg-[#101522]/70 text-[#E9DFC9] hover:border-[#C6A568] text-left cursor-pointer">Tuyển tập & Từ điển</button>
                <button type="button" onClick={() => onNavigate("conlang")} className="px-2.5 py-2 rounded-xl border border-white/10 bg-[#101522]/70 text-[#E9DFC9] hover:border-[#C6A568] text-left cursor-pointer">Ngôn ngữ Cổ ngữ</button>
                <button type="button" onClick={() => onNavigate("media")} className="px-2.5 py-2 rounded-xl border border-white/10 bg-[#101522]/70 text-[#E9DFC9] hover:border-[#C6A568] text-left cursor-pointer">Kho Ảnh Media</button>
                <button type="button" onClick={() => onNavigate("health")} className="px-2.5 py-2 rounded-xl border border-white/10 bg-[#101522]/70 text-[#E9DFC9] hover:border-[#C6A568] text-left cursor-pointer">Quản trị & Health</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          2. FEATURED WORLD SHOWCASE — ARCANE ATLAS
          ===================================================================== */}
      {visibleSections.world && (
      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="editorial-kicker">Featured World · Thế giới Trung tâm</div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9] mt-0.5">
              Đại Hành Tinh Aethelgard Prime
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("atlas")}
            className="text-xs text-[#C6A568] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            Mở Atlas 2D/3D <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="editorial-rule" />

        <div
          onClick={() => onNavigate("atlas")}
          className="relative rounded-2xl overflow-hidden border border-[#C6A568]/30 imperial-card-hover cursor-pointer grid grid-cols-1 lg:grid-cols-12 bg-[#1D2636]/90"
        >
          <div className="lg:col-span-7 relative min-h-[210px] sm:min-h-[260px]">
            <img
              src="/art/featured-world-atlas.svg"
              alt="Arcane Atlas of Aethelgard Prime"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#1D2636] via-transparent to-transparent" />
          </div>
          <div className="lg:col-span-5 p-5 sm:p-7 flex flex-col justify-center gap-4">
            <span className="editorial-kicker">8 Lục địa · 360 Quốc gia · 8 Lớp Địa lý</span>
            <h3 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9]">
              Bản đồ Địa chính trị &amp; Biên niên sử Sống động
            </h3>
            <p className="text-xs sm:text-sm text-[#C8D0DC] leading-relaxed">
              Khảo sát ranh giới 360 vương quốc, đế chế và thành bang với địa hình 2D/3D chân thực, khí hậu, tuyến thương mại liên lục địa và lịch sử biến động lãnh thổ.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-[#101522]/80 border border-[#657D91]/40 text-[11px] font-mono text-[#E9DFC9]">
                360 Quốc gia thật
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#101522]/80 border border-[#657D91]/40 text-[11px] font-mono text-[#E9DFC9]">
                6+ Cổ ngữ
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#101522]/80 border border-[#657D91]/40 text-[11px] font-mono text-[#E9DFC9]">
                Lịch Đa Trăng
              </span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* =====================================================================
          3. FEATURED KINGDOMS — ASYMMETRIC EDITORIAL MASONRY GRID
          ===================================================================== */}
      {visibleSections.kingdoms && featuredKingdoms.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="editorial-kicker">Kingdom Codex · 360 Chính thể</div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9] mt-0.5">
                Các Đế chế &amp; Vương quốc Nổi bật
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("kingdoms")}
              className="text-xs text-[#C6A568] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              Xem đủ 360 Quốc gia <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="editorial-rule" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Flagship Large Editorial Card (7 cols on desktop) */}
            {flagshipKingdom && (
              <article
                onClick={() => onNavigate("kingdoms")}
                className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#C6A568]/40 imperial-card-hover cursor-pointer min-h-[290px] sm:min-h-[340px] flex flex-col justify-end p-5 sm:p-7"
              >
                <img
                  src="/art/kingdom-editorial-cover.svg"
                  alt={flagshipKingdom.officialName}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101522] via-[#101522]/70 to-transparent" />
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-3">
                    <EntityEmblemSVG
                      config={flagshipKingdom.emblemConfig}
                      sigil="⚜"
                      size={52}
                    />
                    <div className="min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-[#C6A568]">
                        {flagshipKingdom.id} · {flagshipKingdom.continent}
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9] truncate">
                        {flagshipKingdom.officialName}
                      </h3>
                      <div className="text-xs text-[#C8D0DC]">
                        Thủ đô {flagshipKingdom.capitalName} · {flagshipKingdom.governmentType}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] font-mono text-[#E9DFC9]/85 pt-1">
                    <span>Dân số: {flagshipKingdom.population.toLocaleString("vi-VN")}</span>
                    <span>·</span>
                    <span>Diện tích: {flagshipKingdom.areaKm2.toLocaleString("vi-VN")} km²</span>
                    <span>·</span>
                    <span>Tiền tệ: {flagshipKingdom.currencyCode}</span>
                  </div>
                </div>
              </article>
            )}

            {/* Right Asymmetric Stack (5 cols on desktop) */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              {secondaryKingdoms.map((k) => (
                <article
                  key={k.id}
                  onClick={() => onNavigate("kingdoms")}
                  className="imperial-surface imperial-card-hover rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="shrink-0">
                    <EntityEmblemSVG config={k.emblemConfig} sigil="⚜" size={46} />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-[#C6A568]">{k.id}</span>
                      <span className="text-[10px] text-[#8FA2B3] truncate">{k.continent}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-[#E9DFC9] truncate">
                      {k.officialName}
                    </h3>
                    <div className="text-[11px] text-[#C8D0DC] truncate">
                      Thủ đô {k.capitalName} · {k.governmentType}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================================
          4. LEGENDARY CHARACTERS — 3:4 PORTRAIT GALLERY (Swipeable on Mobile)
          ===================================================================== */}
      {legendaryChars.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <div className="editorial-kicker">Character Codex · 17 Nhóm Hồ sơ</div>
              <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9] mt-0.5">
                Nhân vật Huyền thoại &amp; Sử gia
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("characters")}
              className="text-xs text-[#C6A568] hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
            >
              Mở Character Codex <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="editorial-rule" />

          {isMobile || isTablet ? (
            <DraggableScrollArea ariaLabel="Nhân vật huyền thoại" innerClassName="flex gap-3 pb-1">
              {legendaryChars.map((ch) => (
                <article
                  key={ch.id}
                  onClick={() => onNavigate("characters")}
                  className="relative w-52 aspect-[3/4] shrink-0 rounded-2xl overflow-hidden border border-[#C6A568]/35 imperial-card-hover cursor-pointer flex flex-col justify-end p-4"
                >
                  <img
                    src={ch.portraitUrl || "/art/character-portrait-bg.svg"}
                    alt={ch.fullName}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101522] via-[#101522]/45 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <span className="font-mono text-[10px] text-[#C6A568]">{ch.id}</span>
                    <h3 className="font-display text-base font-bold text-[#E9DFC9] leading-snug">
                      {ch.fullName}
                    </h3>
                    <div className="text-[11px] text-[#C8D0DC] line-clamp-1">
                      {ch.titles[0] || ch.race}
                    </div>
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
                  className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-[#C6A568]/35 imperial-card-hover cursor-pointer flex flex-col justify-end p-4 group"
                >
                  <img
                    src={ch.portraitUrl || "/art/character-portrait-bg.svg"}
                    alt={ch.fullName}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101522] via-[#101522]/50 to-transparent" />
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] text-[#C6A568]">{ch.id}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full royal-seal-badge">
                        {ch.race}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#E9DFC9] leading-snug">
                      {ch.fullName}
                    </h3>
                    <div className="text-xs text-[#C8D0DC] line-clamp-1">
                      {ch.titles.join(" · ") || ch.nationality}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* =====================================================================
          5. HISTORICAL ARCHIVES & EXPLORE THE UNKNOWN (2-Column Editorial)
          ===================================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Historical Timeline Highlights */}
        <div className="lg:col-span-7 imperial-surface rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="editorial-kicker">Living History · Biên niên sử</div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#E9DFC9] flex items-center gap-2 mt-0.5">
                <Hourglass className="w-4 h-4 text-[#C6A568]" /> Dòng chảy Lịch sử &amp; Tư liệu
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("timeline")}
              className="text-xs text-[#C6A568] hover:underline cursor-pointer"
            >
              Xem tất cả →
            </button>
          </div>
          <div className="editorial-rule" />

          {historicalEvents.length === 0 ? (
            <p className="text-xs text-[#8FA2B3]">Chưa có sự kiện nào được ghi nhận.</p>
          ) : (
            <div className="space-y-3">
              {historicalEvents.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => onNavigate("timeline")}
                  className="rounded-xl border border-[#C6A568]/20 bg-[#101522]/65 hover:border-[#C6A568]/60 p-3.5 transition cursor-pointer space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono font-bold text-[#C6A568]">{ev.dateLabel}</span>
                    <span className="text-[#8FA2B3]">{ev.era}</span>
                  </div>
                  <div className="font-display text-sm sm:text-base font-bold text-[#E9DFC9]">
                    {ev.sigil} {ev.title}
                  </div>
                  {ev.summary && (
                    <p className="text-xs text-[#C8D0DC] line-clamp-2 leading-relaxed">
                      {ev.summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explore the Unknown + Recently Updated */}
        <div className="lg:col-span-5 space-y-5">
          <div className="imperial-surface rounded-2xl p-5 space-y-3">
            <div className="editorial-kicker">Explore the Unknown · Khám phá</div>
            <h2 className="font-display text-lg font-bold text-[#E9DFC9] flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#C6A568]" /> Hồ sơ &amp; Bí ẩn Đáng đọc
            </h2>
            <div className="space-y-2">
              {(recentEntries.length > 0 ? recentEntries : discoveryEntries).slice(0, 4).map((ent) => (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => onOpenEntry(ent.id)}
                  className="w-full text-left rounded-xl border border-[#C6A568]/20 bg-[#101522]/60 hover:border-[#C6A568] p-3 transition cursor-pointer"
                >
                  <div className="text-xs sm:text-sm font-semibold text-[#E9DFC9] truncate">
                    {ent.sigil} {ent.title}
                  </div>
                  <div className="text-[11px] text-[#8FA2B3] line-clamp-1 mt-0.5">
                    {ent.summary || ent.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="imperial-surface rounded-2xl p-5 space-y-3">
            <div className="editorial-kicker">Recently Updated · Mới cập nhật</div>
            <div className="space-y-2">
              {recentlyUpdated.slice(0, 4).map((ent) => (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => onOpenEntry(ent.id)}
                  className="w-full flex items-center justify-between gap-2 text-left text-xs py-1.5 border-b border-white/5 last:border-0 hover:text-[#C6A568] cursor-pointer"
                >
                  <span className="truncate font-medium text-[#E9DFC9]">
                    {ent.sigil} {ent.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#8FA2B3] shrink-0 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ent.updatedAt).toLocaleDateString("vi-VN")}
                  </span>
                </button>
              ))}
              {activities.length > 0 && recentlyUpdated.length === 0 && (
                <p className="text-xs text-[#8FA2B3]">{activities[0].targetTitle}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. TYPOGRAPHIC KNOWLEDGE STATISTICS LEDGER (Non-Dashboard Editorial)
          ===================================================================== */}
      <section className="imperial-surface rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-5">
          <div>
            <div className="editorial-kicker">Archival Scale · Quy mô Kho Tri thức</div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#E9DFC9] mt-0.5">
              Niên giám Thống kê Đại Thư Viện
            </h2>
          </div>
          <span className="text-xs text-[#8FA2B3] italic">
            Số liệu thực tế đồng bộ trực tiếp từ hệ thống dữ liệu gốc
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-3 border-t border-[#C6A568]/25">
          {[
            { num: totalEntries.toLocaleString("vi-VN"), label: "Hồ sơ Bách khoa", sub: "14 phân hệ Codex", icon: BookOpen },
            { num: "360", label: "Quốc gia & Đế chế", sub: "Trên 8 lục địa Atlas", icon: Crown },
            { num: String(categoryCount), label: "Danh mục Tri thức", sub: `${entryTypeCount} loại thực thể`, icon: Sparkles },
            { num: String(collections.length), label: "Tuyển tập Biên khảo", sub: `${legendaryChars.length}+ nhân vật chuẩn`, icon: Users }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center gap-2 text-[#C6A568]">
                  <Icon className="w-4 h-4 opacity-80" />
                  <span className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#E9DFC9]">
                    {item.num}
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-semibold text-[#C6A568]">{item.label}</div>
                <div className="text-[11px] text-[#8FA2B3]">{item.sub}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
