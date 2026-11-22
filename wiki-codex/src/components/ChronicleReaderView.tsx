"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Edit3,
  ExternalLink,
  Plus,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type { ChronicleChapter, EntryCardProjection } from "@/types/codex";
import { normalizeVietnamese } from "@/lib/vietnamese";
import { classifyPowerTier, formatUnboundedPower } from "@/lib/v3-engines";

interface ChronicleReaderViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onCreateRedLink: (title: string) => void;
}

type ReaderPaper = "dark" | "sepia" | "light";

export function ChronicleReaderView({
  workspaceId,
  entries,
  canEdit,
  onOpenEntry,
  onCreateRedLink
}: ChronicleReaderViewProps) {
  const [chapters, setChapters] = useState<ChronicleChapter[]>([]);
  const [activeId, setActiveId] = useState("");
  const [fontSize, setFontSize] = useState(17);
  const [paper, setPaper] = useState<ReaderPaper>("dark");
  const [popoverEntry, setPopoverEntry] = useState<EntryCardProjection | null>(null);

  // Editor state
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [bookTitle, setBookTitle] = useState("Biên Niên Sử Kỷ Nguyên Ánh Sao");
  const [chapterNum, setChapterNum] = useState(1);
  const [title, setTitle] = useState("");
  const [eraLabel, setEraLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");

  async function loadChapters() {
    const res = await fetch(`/api/v4?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (!res.ok) return;
    const data = await res.json();
    const list: ChronicleChapter[] = data.chronicleChapters || [];
    setChapters(list);
    if (list[0] && !activeId) setActiveId(list[0].id);
  }

  useEffect(() => {
    loadChapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const activeChapter = useMemo(
    () => chapters.find((c) => c.id === activeId) || chapters[0] || null,
    [chapters, activeId]
  );

  const entryLookup = useMemo(() => {
    const map = new Map<string, EntryCardProjection>();
    for (const e of entries) {
      map.set(normalizeVietnamese(e.title), e);
      map.set(e.slug.toLowerCase(), e);
    }
    return map;
  }, [entries]);

  function startNewChapter() {
    setEditId(undefined);
    setBookTitle(activeChapter?.bookTitle || "Biên Niên Sử Thế Giới");
    setChapterNum(chapters.length + 1);
    setTitle("");
    setEraLabel("");
    setSummary("");
    setContent("");
    setEditing(true);
  }

  function startEditChapter(ch: ChronicleChapter) {
    setEditId(ch.id);
    setBookTitle(ch.bookTitle);
    setChapterNum(ch.chapterNumber);
    setTitle(ch.title);
    setEraLabel(ch.eraLabel);
    setSummary(ch.summary);
    setContent(ch.contentMarkdown);
    setEditing(true);
  }

  async function handleSaveChapter(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch("/api/v4", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "chronicle",
        chapter: {
          id: editId,
          workspaceId,
          bookTitle: bookTitle.trim() || "Biên Niên Sử",
          chapterNumber: Number(chapterNum) || 1,
          title: title.trim(),
          eraLabel: eraLabel.trim(),
          summary: summary.trim(),
          contentMarkdown: content,
          published: true
        }
      })
    });
    if (res.ok) {
      const data = await res.json();
      setEditing(false);
      await loadChapters();
      if (data.chapter?.id) setActiveId(data.chapter.id);
    }
  }

  async function handleDeleteChapter(id: string) {
    await fetch(`/api/v4?kind=chronicle&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setActiveId("");
    await loadChapters();
  }

  function renderRichParagraph(text: string, pIdx: number) {
    const trimmed = text.trim();
    if (trimmed.startsWith("> [!")) {
      return (
        <div
          key={pIdx}
          className="my-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm italic"
        >
          {renderInlineLinks(trimmed.replace(/^>\s*\[![A-Z]+\]\s*/i, ""))}
        </div>
      );
    }
    return (
      <p key={pIdx} className="leading-[1.85] mb-4 text-justify">
        {renderInlineLinks(trimmed)}
      </p>
    );
  }

  function renderInlineLinks(text: string): React.ReactNode[] {
    const parts = text.split(/(\[\[[^\]]+\]\])/g);
    return parts.map((part, idx) => {
      if (part.startsWith("[[") && part.endsWith("]]")) {
        const inner = part.slice(2, -2);
        const [rawTarget, rawAlias] = inner.split("|");
        const target = rawTarget.trim();
        const label = (rawAlias || rawTarget).trim();
        const found =
          entryLookup.get(normalizeVietnamese(target)) ??
          entryLookup.get(target.toLowerCase());
        if (found) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setPopoverEntry(found)}
              className="inline-flex items-center gap-0.5 font-semibold underline decoration-dotted underline-offset-4 text-[var(--accent)] hover:brightness-125 cursor-pointer mx-0.5"
            >
              <span>{found.sigil}</span>
              <span>{label}</span>
            </button>
          );
        }
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onCreateRedLink(target)}
            className="text-rose-400 underline decoration-dashed underline-offset-4 cursor-pointer mx-0.5"
            title={`Hồ sơ "${target}" chưa tồn tại — nhấn để tạo`}
          >
            {label}
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  }

  const paperClasses: Record<ReaderPaper, string> = {
    dark: "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-subtle)]",
    sepia: "bg-[#f4ecd8] text-[#2b2114] border-[#c8b288]",
    light: "bg-[#ffffff] text-[#111827] border-[#d1d5db]"
  };

  return (
    <div className="space-y-4">
      <div className="codex-card arcane-corners rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--accent)] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Phòng Đọc Biên Niên Sử & Tiểu Thuyết (Lore Popover)
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Nhấn trực tiếp vào bất kỳ liên kết [[Tên Thực Thể]] nào trong văn bản để xem nhanh hồ sơ mà không rời trang đọc.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-[var(--border-subtle)] overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(14, s - 1))}
              className="px-2.5 py-1.5 hover:bg-white/10 cursor-pointer"
            >
              A-
            </button>
            <span className="px-2 font-mono text-[11px] border-x border-[var(--border-subtle)]">
              {fontSize}px
            </span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(24, s + 1))}
              className="px-2.5 py-1.5 hover:bg-white/10 cursor-pointer"
            >
              A+
            </button>
          </div>

          <div className="flex items-center gap-1">
            {(
              [
                { id: "dark", label: "Mực đêm" },
                { id: "sepia", label: "Giấy cổ" },
                { id: "light", label: "Sáng" }
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaper(p.id)}
                className={`px-2.5 py-1.5 rounded-xl border text-xs cursor-pointer ${
                  paper === p.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                    : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={startNewChapter}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Viết chương mới
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <form onSubmit={handleSaveChapter} className="codex-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg text-[var(--accent)]">
              {editId ? "Chỉnh sửa Chương" : "Biên soạn Chương Biên Niên Sử mới"}
            </h3>
            <button type="button" onClick={() => setEditing(false)} className="p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Tên bộ sách / Biên niên sử"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />
            <input
              type="number"
              min={1}
              value={chapterNum}
              onChange={(e) => setChapterNum(Number(e.target.value))}
              placeholder="Số chương"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs font-mono"
            />
            <input
              type="text"
              value={eraLabel}
              onChange={(e) => setEraLabel(e.target.value)}
              placeholder="Niên đại / Kỷ nguyên"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
            />
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Tiêu đề chương *"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm font-display"
          />
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Tóm tắt ngắn chương..."
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          />
          <textarea
            rows={12}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Viết nội dung chương... Dùng [[Tên Thực Thể]] để gắn thẻ Lore Popover tự động!"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-sm font-sans leading-relaxed"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
            >
              Lưu chương
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Chapter List */}
          <div className="lg:col-span-3 codex-card rounded-2xl p-3 space-y-2">
            <div className="text-[11px] font-mono uppercase text-[var(--accent)] px-1">
              Mục lục Chương ({chapters.length})
            </div>
            {chapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveId(ch.id)}
                className={`w-full text-left rounded-xl p-2.5 border transition cursor-pointer ${
                  activeChapter?.id === ch.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--accent)]/50"
                }`}
              >
                <div className="text-[10px] font-mono text-[var(--accent)]">
                  Chương {ch.chapterNumber} · {ch.eraLabel}
                </div>
                <div className="font-display font-semibold text-sm text-[var(--text-primary)] line-clamp-2">
                  {ch.title}
                </div>
              </button>
            ))}
          </div>

          {/* Reading Canvas */}
          <div className={`lg:col-span-9 rounded-2xl border p-6 sm:p-10 transition-colors ${paperClasses[paper]}`}>
            {activeChapter ? (
              <article className="max-w-[66ch] mx-auto">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b border-current/15">
                  <div>
                    <div className="text-xs font-mono uppercase opacity-70">
                      {activeChapter.bookTitle} · Chương {activeChapter.chapterNumber}
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold mt-1">
                      {activeChapter.title}
                    </h1>
                    {activeChapter.eraLabel && (
                      <div className="text-xs italic opacity-75 mt-1">{activeChapter.eraLabel}</div>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEditChapter(activeChapter)}
                        className="p-2 rounded-lg border border-current/20 hover:bg-current/10 cursor-pointer"
                        title="Chỉnh sửa chương"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(activeChapter.id)}
                        className="p-2 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Xóa chương"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: `${fontSize}px` }}>
                  {activeChapter.contentMarkdown
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((para, idx) => renderRichParagraph(para, idx))}
                </div>
              </article>
            ) : (
              <div className="text-center py-12 text-sm opacity-70">
                Chưa có chương biên niên sử nào. Hãy tạo chương đầu tiên!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Lore Popover Card */}
      {popoverEntry && (
        <div className="fixed bottom-4 right-4 z-50 w-[92vw] max-w-sm rounded-2xl border-2 border-[var(--border-strong)] bg-[var(--bg-elevated)] p-4 shadow-2xl space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] flex items-center justify-center text-xl text-[var(--accent)] shrink-0">
                {popoverEntry.sigil}
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold text-base text-[var(--text-primary)] truncate">
                  {popoverEntry.title}
                </div>
                {popoverEntry.subtitle && (
                  <div className="text-[11px] italic text-[var(--text-muted)] truncate">
                    {popoverEntry.subtitle}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPopoverEntry(null)}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {(popoverEntry.powerLevel !== undefined || popoverEntry.powerInfinite) && (
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/35">
              <Sparkles className="w-3 h-3" />
              ⚡ {formatUnboundedPower(popoverEntry.powerLevel ?? 0, popoverEntry.powerInfinite)} ·{" "}
              {classifyPowerTier(popoverEntry.powerLevel ?? 0, popoverEntry.powerInfinite).label}
            </div>
          )}

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-4">
            {popoverEntry.summary || "Hồ sơ bách khoa toàn thư trong Aethel Codex."}
          </p>

          <button
            type="button"
            onClick={() => {
              const id = popoverEntry.id;
              setPopoverEntry(null);
              onOpenEntry(id);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Mở toàn bộ hồ sơ
          </button>
        </div>
      )}
    </div>
  );
}
