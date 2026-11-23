"use client";

import React from "react";
import { BookOpen, Crown, Library, Plus, Users } from "lucide-react";
import { CODEX_MODULES, type CodexModuleDefinition, type CodexModuleId } from "@/lib/codex-modules";
import { DraggableScrollArea } from "./DraggableScrollArea";

export type UnifiedCodexTab = "all" | CodexModuleId;

interface UnifiedCodexWorkspaceProps {
  activeTab: UnifiedCodexTab;
  onChangeTab: (tab: UnifiedCodexTab) => void;
  totalEntries: number;
  canEdit: boolean;
  onOpenUnifiedCreate: () => void;
  onCreateInModule: (mod: CodexModuleDefinition) => void;
  /** Rendered body for "all" and the 12 standard encyclopedia modules */
  renderDatabaseView: (activeModule: CodexModuleDefinition | null) => React.ReactNode;
  /** Rendered body for Character Codex */
  renderCharacterHub: () => React.ReactNode;
  /** Rendered body for Kingdom Codex (360) */
  renderKingdomHub: () => React.ReactNode;
}

/**
 * Unified Dossier & Codex Workspace:
 * Consolidates Kho Hồ sơ, Thư viện 14 Codex, Character Codex, and Kingdom Codex (360)
 * into a single seamless encyclopedia hub with 1-click "+ Tạo Hồ sơ Mới" & draggable 14-module ribbon.
 */
export function UnifiedCodexWorkspace({
  activeTab,
  onChangeTab,
  totalEntries,
  canEdit,
  onOpenUnifiedCreate,
  onCreateInModule,
  renderDatabaseView,
  renderCharacterHub,
  renderKingdomHub
}: UnifiedCodexWorkspaceProps) {
  const activeMod =
    activeTab === "all" ? null : CODEX_MODULES.find((m) => m.id === activeTab) || null;

  return (
    <div className="space-y-4 animate-codex-fade-up">
      {/* Unified Header & 14-Module Draggable Ribbon */}
      <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest text-[var(--accent)] font-semibold flex items-center gap-1.5">
              <Library className="w-3.5 h-3.5" /> Aethel Codex — Trung tâm Hồ sơ &amp; Bách khoa Thống nhất
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5 truncate">
              {activeMod ? `${activeMod.sigil} ${activeMod.titleEn} — ${activeMod.titleVi}` : "Tất cả Hồ sơ & 14 Phân hệ Codex"}
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {activeMod
                ? activeMod.description
                : "Tra cứu, chỉnh sửa, tải ảnh trực tiếp và liên kết chéo toàn bộ hồ sơ thế giới tại một nơi duy nhất."}
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 shrink-0">
              {activeMod && activeMod.id !== "character" && activeMod.id !== "kingdom" && (
                <button
                  type="button"
                  onClick={() => onCreateInModule(activeMod)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:brightness-110"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo {activeMod.idPrefix}
                </button>
              )}
              <button
                type="button"
                onClick={onOpenUnifiedCreate}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:brightness-110 shadow-md"
              >
                <Plus className="w-4 h-4" /> Tạo Hồ sơ Mới
              </button>
            </div>
          )}
        </div>

        {/* Draggable 14-Module Switcher Ribbon */}
        <DraggableScrollArea ariaLabel="Chuyển đổi 14 phân hệ Codex" innerClassName="flex items-center gap-1.5 px-0.5">
          <button
            type="button"
            onClick={() => onChangeTab("all")}
            className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === "all"
                ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold shadow"
                : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)] hover:border-[var(--accent)]"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tất cả Hồ sơ</span>
            <span className="text-[10px] font-mono opacity-80">({totalEntries})</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab("kingdom")}
            className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === "kingdom"
                ? "border-amber-400 bg-amber-400 text-[#090e1c] font-bold shadow"
                : "border-amber-500/35 bg-amber-500/10 text-amber-200 hover:border-amber-400"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>Kingdom Codex (360)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeTab("character")}
            className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border cursor-pointer transition ${
              activeTab === "character"
                ? "border-cyan-400 bg-cyan-400 text-[#090e1c] font-bold shadow"
                : "border-cyan-500/35 bg-cyan-500/10 text-cyan-200 hover:border-cyan-400"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Character Codex</span>
          </button>

          {CODEX_MODULES.filter((m) => m.id !== "kingdom" && m.id !== "character").map((mod) => {
            const selected = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => onChangeTab(mod.id)}
                className={`shrink-0 min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 border cursor-pointer transition ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold shadow"
                    : "border-[var(--border-subtle)] bg-[var(--bg-base)]/60 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>{mod.sigil}</span>
                <span>{mod.titleVi}</span>
              </button>
            );
          })}
        </DraggableScrollArea>
      </div>

      {/* Unified Active Module Body */}
      {activeTab === "character"
        ? renderCharacterHub()
        : activeTab === "kingdom"
        ? renderKingdomHub()
        : renderDatabaseView(activeMod)}
    </div>
  );
}
