"use client";

import React from "react";
import { Crown, Plus, Sparkles, Users, X } from "lucide-react";
import { CODEX_MODULES, type CodexModuleDefinition } from "@/lib/codex-modules";

interface UnifiedCreateDossierModalProps {
  open: boolean;
  onClose: () => void;
  onCreateCharacter: () => void;
  onCreateKingdom: () => void;
  onCreateStandardEntry: (mod: CodexModuleDefinition) => void;
}

/**
 * Unified 14-Module Creation Launcher:
 * One single "+ Tạo Hồ sơ Mới" entry point for the entire Aethel Codex platform.
 * Routes to Character Editor (17 groups), Kingdom Creator (18 groups), or pre-templated Entry Editor
 * — all supporting Direct Image Upload (device / drag-drop / Ctrl+V).
 */
export function UnifiedCreateDossierModal({
  open,
  onClose,
  onCreateCharacter,
  onCreateKingdom,
  onCreateStandardEntry
}: UnifiedCreateDossierModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl flex flex-col overflow-hidden animate-codex-fade-up"
      >
        <div className="px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base sm:text-lg font-bold text-[var(--accent)] flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Tạo Hồ sơ Bách khoa Mới (14 Phân hệ Codex)
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Chọn phân hệ muốn biên soạn — mọi trình soạn thảo đều hỗ trợ tải ảnh trực tiếp, kéo-thả &amp; tự lưu bản nháp.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] rounded-xl hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 codex-scrollbar">
          {/* Primary Specialist Codexes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateCharacter();
              }}
              className="rounded-2xl border border-cyan-500/45 bg-cyan-500/10 hover:bg-cyan-500/20 p-4 text-left flex items-start gap-3 transition cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-cyan-200 flex items-center gap-1.5">
                  Character Codex (CHAR-XXXXXX) <Plus className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Hồ sơ nhân vật chuyên sâu 17 nhóm dữ liệu, upload ảnh chân dung/bìa/thư viện, quan hệ 2 chiều &amp; dòng thời gian.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateKingdom();
              }}
              className="rounded-2xl border border-amber-500/45 bg-amber-500/10 hover:bg-amber-500/20 p-4 text-left flex items-start gap-3 transition cursor-pointer"
            >
              <span className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-amber-200 flex items-center gap-1.5">
                  Kingdom Codex (KING-XXXXXX) <Plus className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Hồ sơ vương quốc / đế chế 18 nhóm địa chính trị, upload quốc kỳ/quốc huy/thủ đô, 14 chỉ số độc lập &amp; liên kết nguyên thủ.
                </p>
              </div>
            </button>
          </div>

          {/* Remaining 12 Encyclopedia Codex Modules */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
              12 Phân hệ Bách khoa Thế giới (Mẫu chuẩn + Upload ảnh trực tiếp)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CODEX_MODULES.filter((m) => m.id !== "character" && m.id !== "kingdom").map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateStandardEntry(mod);
                  }}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)] p-3 text-left space-y-1.5 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base">{mod.sigil}</span>
                    <span
                      className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border"
                      style={{
                        color: mod.accentColor,
                        borderColor: `${mod.accentColor}44`,
                        backgroundColor: `${mod.accentColor}12`
                      }}
                    >
                      {mod.idPrefix}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{mod.titleEn}</div>
                  <div className="text-[11px] text-[var(--text-muted)] line-clamp-2">
                    {mod.titleVi} — {mod.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
