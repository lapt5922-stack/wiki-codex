"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Crown, Star, Trash2, Users, X } from "lucide-react";

export interface CodexBookmarkItem {
  id: string;
  kind: "entry" | "character" | "kingdom";
  title: string;
  subtitle?: string;
  sigil?: string;
  savedAt: string;
}

const STORAGE_KEY = "aethel-codex-bookmarks-v1";

export function loadCodexBookmarks(): CodexBookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleCodexBookmark(item: Omit<CodexBookmarkItem, "savedAt">): CodexBookmarkItem[] {
  const list = loadCodexBookmarks();
  const exists = list.some((x) => x.id === item.id && x.kind === item.kind);
  const next = exists
    ? list.filter((x) => !(x.id === item.id && x.kind === item.kind))
    : [{ ...item, savedAt: new Date().toISOString() }, ...list].slice(0, 60);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("aethel-bookmarks-changed"));
    } catch {
      // ignore
    }
  }
  return next;
}

interface BookmarksDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenEntry: (entryId: string) => void;
  onOpenCharacters: () => void;
  onOpenKingdoms: () => void;
}

export function BookmarksDrawer({
  open,
  onClose,
  onOpenEntry,
  onOpenCharacters,
  onOpenKingdoms
}: BookmarksDrawerProps) {
  const [items, setItems] = useState<CodexBookmarkItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(loadCodexBookmarks());
    sync();
    window.addEventListener("aethel-bookmarks-changed", sync);
    return () => window.removeEventListener("aethel-bookmarks-changed", sync);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full bg-[var(--bg-elevated)] border-l border-[var(--border-strong)] shadow-2xl flex flex-col animate-codex-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3.5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-2 font-display font-bold text-sm text-[var(--accent)]">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            Hồ sơ Đã Ghim ({items.length})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] rounded-xl hover:bg-white/10 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 codex-scrollbar">
          {items.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-[var(--text-muted)] space-y-2">
              <Star className="w-8 h-8 mx-auto opacity-30" />
              <p>Chưa có hồ sơ nào được ghim.</p>
              <p>Bấm nút <strong>★ Ghim</strong> khi đang đọc bài viết để lưu vào danh sách truy cập nhanh.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (item.kind === "entry") onOpenEntry(item.id);
                    else if (item.kind === "character") onOpenCharacters();
                    else onOpenKingdoms();
                    onClose();
                  }}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer"
                >
                  <span className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0 text-sm">
                    {item.sigil ||
                      (item.kind === "character" ? (
                        <Users className="w-4 h-4" />
                      ) : item.kind === "kingdom" ? (
                        <Crown className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      ))}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] truncate">
                      {item.subtitle || item.id}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setItems(toggleCodexBookmark(item))}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-400 cursor-pointer"
                  title="Bỏ ghim"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
