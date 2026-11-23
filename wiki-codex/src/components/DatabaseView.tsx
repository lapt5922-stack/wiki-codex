"use client";

import React, { useState } from "react";
import {
  BookOpenText,
  CheckSquare,
  Columns2,
  Download,
  EyeOff,
  FilePlus2,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Lock,
  Presentation,
  Search,
  Shuffle,
  Square,
  Table2,
  Tag,
  Trash2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type {
  Category,
  EntryCardProjection,
  EntryStatus,
  EntryType,
  EntryVisibility,
  SavedView
} from "@/types/codex";
import { classifyPowerTier, formatUnboundedPower } from "@/lib/v3-engines";
import { DynamicIcon } from "./DynamicIcon";
import { EntityCodexCard } from "./EntityCodexCard";
import { useDeviceUI } from "@/lib/device-ui";

interface DatabaseViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  entryTypes: EntryType[];
  categories: Category[];
  allTags: string[];
  canEdit: boolean;
  searchQuery: string;
  filterTypeId: string;
  filterStatus: EntryStatus | "all";
  filterVisibility: EntryVisibility | "all";
  filterTag: string;
  minPowerFilter?: number | null;
  maxPowerFilter?: number | null;
  onClearPowerFilter?: () => void;
  sortBy: "updatedAt" | "title" | "status" | "powerLevel";
  savedViews?: SavedView[];
  onApplySavedView?: (v: SavedView) => void;
  onOpenShowcaseDeck?: () => void;
  onSearchChange: (q: string) => void;
  onFilterTypeChange: (id: string) => void;
  onFilterStatusChange: (s: EntryStatus | "all") => void;
  onFilterVisibilityChange: (v: EntryVisibility | "all") => void;
  onFilterTagChange: (t: string) => void;
  onSortByChange: (s: "updatedAt" | "title" | "status" | "powerLevel") => void;
  onPageChange: (page: number) => void;
  onOpenEntry: (id: string) => void;
  onCreateEntry: () => void;
  onBulkAction: (ids: string[], action: Record<string, unknown>) => Promise<void>;
  onCompareMatrix: (ids: string[]) => void;
  onOpenBookMode: () => void;
  onOpenRandom: () => void;
  hideCreateButton?: boolean;
}

const STATUS_BADGE: Record<EntryStatus, { label: string; cls: string }> = {
  published: { label: "Đã xuất bản", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  review: { label: "Đang rà soát", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  draft: { label: "Bản nháp", cls: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
  archived: { label: "Lưu trữ", cls: "bg-purple-500/15 text-purple-300 border-purple-500/30" }
};

export function DatabaseView({
  workspaceId,
  entries,
  total,
  page,
  totalPages,
  loading,
  entryTypes,
  categories,
  allTags,
  canEdit,
  searchQuery,
  filterTypeId,
  filterStatus,
  filterVisibility,
  filterTag,
  minPowerFilter = null,
  maxPowerFilter = null,
  onClearPowerFilter,
  sortBy,
  savedViews = [],
  onApplySavedView,
  onOpenShowcaseDeck,
  onSearchChange,
  onFilterTypeChange,
  onFilterStatusChange,
  onFilterVisibilityChange,
  onFilterTagChange,
  onSortByChange,
  onPageChange,
  onOpenEntry,
  onCreateEntry,
  onBulkAction,
  onCompareMatrix,
  onOpenBookMode,
  onOpenRandom,
  hideCreateButton = false
}: DatabaseViewProps) {
  const { isMobile, isTablet } = useDeviceUI();
  const [viewMode, setViewMode] = useState<"grid" | "magazine" | "list" | "table">("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [econFilter, setEconFilter] = useState<"all" | "has-econ" | "high-literacy" | "trade-surplus">("all");

  const displayedEntries = React.useMemo(() => {
    if (econFilter === "all") return entries;
    if (econFilter === "has-econ") return entries.filter((e) => Boolean(e.economySummary));
    if (econFilter === "high-literacy") return entries.filter((e) => (e.economySummary?.literacyRate ?? 0) >= 80);
    return entries.filter((e) => (e.economySummary?.tradeBalanceRatio ?? 0) > 0);
  }, [entries, econFilter]);

  const econKpis = React.useMemo(() => {
    const withEcon = entries.filter((e) => e.economySummary);
    if (withEcon.length === 0) return null;
    const avgLit = Math.round(withEcon.reduce((s, e) => s + (e.economySummary?.literacyRate ?? 0), 0) / withEcon.length);
    const avgInfra = Math.round(withEcon.reduce((s, e) => s + (e.economySummary?.infrastructureRate ?? 0), 0) / withEcon.length);
    const surplusCount = withEcon.filter((e) => (e.economySummary?.tradeBalanceRatio ?? 0) > 0).length;
    return { count: withEcon.length, avgLit, avgInfra, surplusCount };
  }, [entries]);
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [bulkTag, setBulkTag] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const typeMap = new Map(entryTypes.map((t) => [t.id, t]));
  const catMap = new Map(categories.map((c) => [c.id, c]));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === entries.length && entries.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map((e) => e.id)));
    }
  }

  async function runBulk(action: Record<string, unknown>) {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await onBulkAction(Array.from(selectedIds), action);
      setSelectedIds(new Set());
      setBulkTag("");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm tức thì (hỗ trợ không dấu, cả biệt danh Aliases)..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-0.5">
            {(
              [
                ["grid", LayoutGrid, "Thẻ lưới"],
                ["magazine", ImageIcon, "Tạp chí"],
                ["list", List, "Danh sách"],
                ["table", Table2, "Bảng"]
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                title={label}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === mode
                    ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenBookMode}
            title="Đọc toàn bộ danh mục dạng Sách Cổ Thư (Book Mode)"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer"
          >
            <BookOpenText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sách Cổ Thư</span>
          </button>

          {onOpenShowcaseDeck && (
            <button
              type="button"
              onClick={onOpenShowcaseDeck}
              title="Trình chiếu Slide Huyền ảo (Showcase Deck)"
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] cursor-pointer"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Trình chiếu</span>
            </button>
          )}

          <a
            href={`/api/export?workspaceId=${workspaceId}&format=csv`}
            download
            title="Xuất CSV (Excel / Sheets)"
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">CSV</span>
          </a>

          <button
            type="button"
            onClick={onOpenRandom}
            title="Mở ngẫu nhiên một hồ sơ"
            className="p-2 rounded-xl border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>

          {canEdit && !hideCreateButton && (
            <button
              type="button"
              onClick={onCreateEntry}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs hover:brightness-110 transition cursor-pointer shadow-lg shadow-[var(--accent)]/15"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Tạo Hồ sơ</span>
            </button>
          )}
        </div>

        {/* Facet Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select value={filterTypeId} onChange={(e) => onFilterTypeChange(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-2.5 py-1.5 text-xs">
            <option value="">Tất cả Loại thực thể ({entryTypes.length})</option>
            {entryTypes.map((t) => (
              <option key={t.id} value={t.id}>{t.sigil} {t.name}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={(e) => onFilterStatusChange(e.target.value as EntryStatus | "all")} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-2.5 py-1.5 text-xs">
            <option value="all">Mọi trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="review">Đang rà soát</option>
            <option value="draft">Bản nháp</option>
            <option value="archived">Lưu trữ</option>
          </select>

          {canEdit && (
            <select value={filterVisibility} onChange={(e) => onFilterVisibilityChange(e.target.value as EntryVisibility | "all")} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-2.5 py-1.5 text-xs">
              <option value="all">Mọi phạm vi</option>
              <option value="public">Công khai</option>
              <option value="private">Riêng tư</option>
            </select>
          )}

          <select value={filterTag} onChange={(e) => onFilterTagChange(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-2.5 py-1.5 text-xs">
            <option value="">Tất cả Thẻ (Tags)</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>#{tag}</option>
            ))}
          </select>

          <select value={sortBy} onChange={(e) => onSortByChange(e.target.value as "updatedAt" | "title" | "status" | "powerLevel")} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 px-2.5 py-1.5 text-xs">
            <option value="updatedAt">Mới cập nhật</option>
            <option value="powerLevel">Power Level (Cao → Thấp)</option>
            <option value="title">Tên A → Z</option>
            <option value="status">Trạng thái</option>
          </select>

          <select
            value={econFilter}
            onChange={(e) => setEconFilter(e.target.value as "all" | "has-econ" | "high-literacy" | "trade-surplus")}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 px-2.5 py-1.5 text-xs"
            title="Lọc nhanh theo chỉ số Kinh tế & Học vấn"
          >
            <option value="all" className="bg-[#090e1c]">✦ Mọi chỉ số Kinh tế</option>
            <option value="has-econ" className="bg-[#090e1c]">Ⱥ Có Hồ sơ Kinh tế</option>
            <option value="high-literacy" className="bg-[#090e1c]">★ Học vấn cao (≥ 80%)</option>
            <option value="trade-surplus" className="bg-[#090e1c]">↗ Thặng dư Thương mại</option>
          </select>

          {savedViews.length > 0 && onApplySavedView && (
            <div className="flex flex-wrap gap-1">
              {savedViews.map((sv) => (
                <button
                  key={sv.id}
                  type="button"
                  onClick={() => onApplySavedView(sv)}
                  className="px-2 py-1 rounded-lg border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] hover:brightness-110 cursor-pointer"
                >
                  {sv.sigil} {sv.name}
                </button>
              ))}
            </div>
          )}

          {(minPowerFilter !== null || maxPowerFilter !== null) && onClearPowerFilter && (
            <button
              type="button"
              onClick={onClearPowerFilter}
              className="px-2.5 py-1 rounded-lg border border-amber-400/50 bg-amber-500/15 text-amber-200 text-[11px] font-mono hover:bg-amber-500/25 cursor-pointer"
            >
              ⚡ Power{" "}
              {minPowerFilter !== null ? `≥ ${formatUnboundedPower(minPowerFilter)}` : ""}
              {maxPowerFilter !== null ? ` ≤ ${formatUnboundedPower(maxPowerFilter)}` : ""} ✕
            </button>
          )}

          <span className="ml-auto font-mono text-[11px] text-[var(--text-muted)]">
            {total.toLocaleString("vi-VN")} hồ sơ · Trang {page}/{totalPages}
          </span>
        </div>
      </div>

      {/* Bulk Actions & Multi-Entity Matrix Bar */}
      {selectedIds.size > 0 && (
        <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[var(--accent)]">Đã chọn {selectedIds.size} hồ sơ</span>

          {selectedIds.size >= 2 && selectedIds.size <= 6 && (
            <button
              type="button"
              onClick={() => onCompareMatrix(Array.from(selectedIds))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--accent)] hover:brightness-110 cursor-pointer"
            >
              <Columns2 className="w-3.5 h-3.5" />
              Ma trận Đối chiếu ({selectedIds.size} thực thể)
            </button>
          )}

          {canEdit && (
            <>
              <div className="flex items-center gap-1">
                <select value={bulkCategoryId} onChange={(e) => setBulkCategoryId(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs">
                  <option value="">Đổi danh mục...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.sigil} {c.name}</option>
                  ))}
                </select>
                <button type="button" disabled={bulkBusy || !bulkCategoryId} onClick={() => runBulk({ type: "set_category", categoryId: bulkCategoryId })} className="px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer">
                  Áp dụng
                </button>
              </div>
              <div className="flex items-center gap-1">
                <input type="text" value={bulkTag} onChange={(e) => setBulkTag(e.target.value)} placeholder="Gắn thẻ..." className="w-24 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs" />
                <button type="button" disabled={bulkBusy || !bulkTag.trim()} onClick={() => runBulk({ type: "add_tag", tag: bulkTag })} className="px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] disabled:opacity-40 cursor-pointer">
                  + Thẻ
                </button>
              </div>
              <button type="button" disabled={bulkBusy} onClick={() => runBulk({ type: "set_status", status: "published" })} className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-pointer">
                Xuất bản
              </button>
              <button type="button" disabled={bulkBusy} onClick={() => runBulk({ type: "soft_delete" })} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 cursor-pointer">
                <Trash2 className="w-3 h-3" /> Xóa tạm
              </button>
            </>
          )}

          <button type="button" onClick={() => setSelectedIds(new Set())} className="ml-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
            Bỏ chọn
          </button>
        </div>
      )}

      {/* Feature #18: Live Global Economy KPI Strip */}
      {econKpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-amber-300/80">Hồ sơ có Kinh tế</div>
            <div className="text-base font-mono font-bold text-amber-300">{econKpis.count}</div>
          </div>
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-purple-300/80">Học vấn Trung bình</div>
            <div className="text-base font-mono font-bold text-purple-300">{econKpis.avgLit}%</div>
          </div>
          <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-sky-300/80">Hạ tầng Trung bình</div>
            <div className="text-base font-mono font-bold text-sky-300">{econKpis.avgInfra}%</div>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-emerald-300/80">Thặng dư Thương mại</div>
            <div className="text-base font-mono font-bold text-emerald-300">{econKpis.surplusCount} nước</div>
          </div>
        </div>
      )}

      {/* Entries Content */}
      {loading ? (
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"} gap-4`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="codex-card rounded-2xl h-56 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : displayedEntries.length === 0 ? (
        <div className="codex-card rounded-2xl p-12 text-center space-y-2">
          <div className="text-3xl text-[var(--accent)]">✦</div>
          <p className="font-display text-lg">Chưa có hồ sơ nào khớp bộ lọc</p>
        </div>
      ) : viewMode === "magazine" ? (
        /* Magazine / Visual Showcase Mode */
        <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-5`}>
          {displayedEntries.map((entry) => {
            const type = typeMap.get(entry.entryTypeId);
            const accent = type?.color || "var(--accent)";
            return (
              <div
                key={entry.id}
                onClick={() => onOpenEntry(entry.id)}
                className="codex-card arcane-corners rounded-2xl overflow-hidden cursor-pointer group relative min-h-[240px] flex flex-col justify-end p-5"
              >
                {entry.thumbImage ? (
                  <img src={entry.thumbImage} alt={entry.title} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover opacity-55 group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 75% 25%, ${accent}33, transparent 65%)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/75 to-transparent" />
                <div className="relative z-10 space-y-1.5">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border bg-black/50" style={{ borderColor: `${accent}88`, color: accent }}>
                    {type?.sigil} {type?.name}
                  </span>
                  <h3 className="font-display text-2xl font-bold group-hover:text-[var(--accent)] transition">
                    {entry.sigil} {entry.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{entry.summary || entry.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === "grid" ? (
        <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"} gap-4`}>
          {displayedEntries.map((entry) => (
            <EntityCodexCard
              key={entry.id}
              entry={entry}
              entryType={typeMap.get(entry.entryTypeId)}
              category={entry.categoryId ? catMap.get(entry.categoryId) : undefined}
              canEdit={canEdit}
              selected={selectedIds.has(entry.id)}
              onToggleSelect={toggleSelect}
              onOpen={onOpenEntry}
            />
          ))}
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-2">
          {entries.map((entry) => {
            const type = typeMap.get(entry.entryTypeId);
            const cat = entry.categoryId ? catMap.get(entry.categoryId) : null;
            const badge = STATUS_BADGE[entry.status];
            const isSelected = selectedIds.has(entry.id);
            return (
              <div key={entry.id} onClick={() => onOpenEntry(entry.id)} className="codex-card rounded-xl p-3 flex items-center gap-3 cursor-pointer">
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleSelect(entry.id); }} className="text-[var(--text-muted)] hover:text-[var(--accent)]">
                  {isSelected ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> : <Square className="w-4 h-4" />}
                </button>
                <span className="text-xl w-8 text-center shrink-0" style={{ color: type?.color || "var(--accent)" }}>{entry.sigil || "✦"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-sm truncate">{entry.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate">{entry.summary || entry.subtitle}</p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-xs text-[var(--text-muted)] shrink-0">
                  <span>{cat?.name || "—"}</span>
                  <span className="font-mono">{entry.backlinkCount} backlinks</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="codex-card rounded-2xl overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-subtle)] text-[var(--text-muted)] uppercase font-mono">
              <tr>
                <th className="p-3 w-8">
                  <button type="button" onClick={toggleSelectAll}>
                    {selectedIds.size === entries.length && entries.length > 0 ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="p-3">Hồ sơ Codex</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Danh mục</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Thẻ</th>
                <th className="p-3 text-right">Liên kết / Từ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {entries.map((entry) => {
                const type = typeMap.get(entry.entryTypeId);
                const cat = entry.categoryId ? catMap.get(entry.categoryId) : null;
                const badge = STATUS_BADGE[entry.status];
                const isSelected = selectedIds.has(entry.id);
                return (
                  <tr key={entry.id} onClick={() => onOpenEntry(entry.id)} className="hover:bg-white/5 cursor-pointer">
                    <td className="p-3" onClick={(e) => { e.stopPropagation(); toggleSelect(entry.id); }}>
                      {isSelected ? <CheckSquare className="w-4 h-4 text-[var(--accent)]" /> : <Square className="w-4 h-4 text-[var(--text-muted)]" />}
                    </td>
                    <td className="p-3 font-medium">
                      <span className="mr-1.5" style={{ color: type?.color }}>{entry.sigil}</span>
                      {entry.title}
                    </td>
                    <td className="p-3 text-[var(--text-secondary)]">{type?.name || "—"}</td>
                    <td className="p-3 text-[var(--text-secondary)]">{cat ? `${cat.sigil} ${cat.name}` : "—"}</td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full border ${badge.cls}`}>{badge.label}</span></td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {entry.tags.slice(0, 2).map((t) => (
                          <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5"><Tag className="w-2.5 h-2.5" />{t}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-[var(--text-muted)]">{entry.backlinkCount} / {entry.wordCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs disabled:opacity-40 hover:border-[var(--accent)] cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Trang trước
          </button>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            Trang {page} / {totalPages} ({total.toLocaleString("vi-VN")} mục)
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs disabled:opacity-40 hover:border-[var(--accent)] cursor-pointer">
            Trang sau <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
