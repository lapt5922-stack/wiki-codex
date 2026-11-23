"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight, BookOpen, Filter, Library, Plus, ShieldCheck } from "lucide-react";
import type { EntryCardProjection } from "@/types/codex";
import {
  CODEX_MODULES,
  EDITORIAL_STATUS_META,
  classifyEntryModule,
  normalizeEditorialStatus,
  type CodexModuleDefinition,
  type CodexModuleId,
  type EditorialVerificationStatus
} from "@/lib/codex-modules";
import { DraggableScrollArea } from "./DraggableScrollArea";

interface CodexModulesHubProps {
  entries: EntryCardProjection[];
  canEdit: boolean;
  onOpenEntry: (entryId: string) => void;
  onNavigateSection: (section: string) => void;
  onCreateInModule: (mod: CodexModuleDefinition) => void;
}

const ALL_EDITORIAL_KEYS: EditorialVerificationStatus[] = [
  "canon",
  "verified",
  "unverified",
  "inferred",
  "original_lore",
  "draft"
];

export function CodexModulesHub({
  entries,
  canEdit,
  onOpenEntry,
  onNavigateSection,
  onCreateInModule
}: CodexModulesHubProps) {
  const [selectedModule, setSelectedModule] = useState<CodexModuleId | "all">("all");
  const [statusFilter, setStatusFilter] = useState<EditorialVerificationStatus | "all">("all");

  const moduleCounts = useMemo(() => {
    const counts: Record<CodexModuleId, number> = {
      world: 0,
      kingdom: 0,
      character: 0,
      organization: 0,
      location: 0,
      history: 0,
      event: 0,
      lore: 0,
      power: 0,
      item: 0,
      culture: 0,
      religion: 0,
      technology: 0,
      species: 0
    };
    for (const e of entries) {
      counts[classifyEntryModule(e)] += 1;
    }
    return counts;
  }, [entries]);

  const statusCounts = useMemo(() => {
    const map: Record<EditorialVerificationStatus, number> = {
      canon: 0,
      verified: 0,
      unverified: 0,
      inferred: 0,
      original_lore: 0,
      draft: 0
    };
    for (const e of entries) {
      map[normalizeEditorialStatus(e.canonStatus)] += 1;
    }
    return map;
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (selectedModule !== "all" && classifyEntryModule(e) !== selectedModule) return false;
        if (statusFilter !== "all" && normalizeEditorialStatus(e.canonStatus) !== statusFilter)
          return false;
        return true;
      })
      .slice(0, 36);
  }, [entries, selectedModule, statusFilter]);

  const activeModDef =
    selectedModule === "all" ? null : CODEX_MODULES.find((m) => m.id === selectedModule) || null;

  return (
    <div className="space-y-5 animate-codex-fade-up">
      {/* Fantasy Editorial Header */}
      <div className="codex-card rounded-2xl p-5 sm:p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-widest text-[var(--accent)] font-semibold flex items-center gap-1.5">
              <Library className="w-3.5 h-3.5" /> Aethel Codex — Thư viện Bách khoa 14 Phân hệ
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Hệ thống Tri thức Thế giới Giả tưởng
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-3xl">
              Nền tảng bách khoa toàn thư tương tác — tổ chức toàn bộ tri thức theo 14 phân hệ chuẩn hóa với định danh ổn định, liên kết 2 chiều và 6 cấp độ xác thực sử liệu.
            </p>
          </div>
        </div>

        {/* 6 Editorial Verification States Filter Ribbon */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Bộ lọc 6 Trạng thái Biên soạn &amp; Xác thực Sử liệu:</span>
          </div>
          <DraggableScrollArea ariaLabel="Bộ lọc trạng thái biên soạn" innerClassName="flex gap-1.5">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`shrink-0 min-h-[34px] px-3 py-1 rounded-xl text-xs border cursor-pointer ${
                statusFilter === "all"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold"
                  : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)]"
              }`}
            >
              Tất cả ({entries.length})
            </button>
            {ALL_EDITORIAL_KEYS.map((key) => {
              const meta = EDITORIAL_STATUS_META[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
                  title={meta.description}
                  className={`shrink-0 min-h-[34px] px-3 py-1 rounded-xl text-xs border cursor-pointer ${
                    statusFilter === key
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold"
                      : `${meta.badgeClass} hover:brightness-110`
                  }`}
                >
                  {meta.label} ({statusCounts[key]})
                </button>
              );
            })}
          </DraggableScrollArea>
        </div>
      </div>

      {/* 14 Codex Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {CODEX_MODULES.map((mod) => {
          const isSelected = selectedModule === mod.id;
          const count =
            mod.id === "kingdom"
              ? Math.max(360, moduleCounts[mod.id])
              : moduleCounts[mod.id];
          return (
            <div
              key={mod.id}
              className={`codex-card codex-card-lift rounded-2xl p-4 flex flex-col justify-between gap-3 border transition ${
                isSelected ? "ring-2 ring-[var(--accent)]" : ""
              }`}
              style={{
                borderColor: isSelected ? mod.accentColor : undefined
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg border"
                    style={{
                      backgroundColor: `${mod.accentColor}1c`,
                      borderColor: `${mod.accentColor}55`
                    }}
                  >
                    {mod.sigil}
                  </span>
                  <span
                    className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      color: mod.accentColor,
                      borderColor: `${mod.accentColor}44`,
                      backgroundColor: `${mod.accentColor}12`
                    }}
                  >
                    {mod.idPrefix}-XXXXXX · {count}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-sm font-bold text-[var(--text-primary)]">
                    {mod.titleEn}
                  </h2>
                  <div className="text-[11px] font-medium" style={{ color: mod.accentColor }}>
                    {mod.titleVi}
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {mod.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 pt-2 border-t border-[var(--border-subtle)]">
                {mod.targetSection !== "database" ? (
                  <button
                    type="button"
                    onClick={() => onNavigateSection(mod.targetSection)}
                    className="flex-1 min-h-[34px] px-2.5 py-1 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] hover:brightness-110 text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    Mở Phân hệ <ArrowRight className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedModule(isSelected ? "all" : mod.id)}
                    className={`flex-1 min-h-[34px] px-2.5 py-1 rounded-xl text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--accent)] text-[#090e1c]"
                        : "bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                    }`}
                  >
                    <Filter className="w-3 h-3" /> {isSelected ? "Đang lọc" : "Tra cứu"}
                  </button>
                )}

                {canEdit && mod.targetSection === "database" && (
                  <button
                    type="button"
                    onClick={() => onCreateInModule(mod)}
                    title={`Tạo hồ sơ mới trong ${mod.titleEn}`}
                    className="min-w-[34px] min-h-[34px] p-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered Encyclopedia Shelf */}
      <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)]">
            <BookOpen className="w-4 h-4" />
            <span>
              {activeModDef
                ? `Hồ sơ thuộc ${activeModDef.titleEn} (${activeModDef.titleVi})`
                : "Kệ Hồ sơ Bách khoa Theo Bộ lọc"}
            </span>
          </div>
          {(selectedModule !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSelectedModule("all");
                setStatusFilter("all");
              }}
              className="text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-2">
            <p>Chưa có hồ sơ nào khớp bộ lọc hiện tại.</p>
            {canEdit && activeModDef && (
              <button
                type="button"
                onClick={() => onCreateInModule(activeModDef)}
                className="px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo hồ sơ đầu tiên cho {activeModDef.titleEn}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredEntries.map((entry) => {
              const edStatus = normalizeEditorialStatus(entry.canonStatus);
              const meta = EDITORIAL_STATUS_META[edStatus];
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onOpenEntry(entry.id)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)] p-3 text-left space-y-1.5 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {entry.sigil} {entry.title}
                    </span>
                    <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
                      {meta.shortLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                    {entry.summary || "Hồ sơ bách khoa trong Aethel Codex."}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
