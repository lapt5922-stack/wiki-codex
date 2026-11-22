"use client";

import React, { useEffect, useState } from "react";
import {
  BookMarked,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Copy,
  FilePlus2,
  FolderKanban,
  Keyboard,
  Languages,
  Plus,
  Printer,
  StickyNote,
  Trash2,
  X
} from "lucide-react";
import type {
  ConlangLanguage,
  CuratedCollection,
  EditorialTask,
  Entry,
  EntryCardProjection,
  EntryType,
  GlossaryTerm
} from "@/types/codex";
import { buildComparisonMatrixMarkdown } from "@/lib/v2-engines";
import { MarkdownCodexRenderer } from "./MarkdownCodexRenderer";

/* ==================== 1. COLLECTIONS, GLOSSARY & EDITORIAL KANBAN HUB ==================== */

export function V2KnowledgeHubView({
  workspaceId,
  collections,
  glossaryTerms,
  editorialTasks,
  entries,
  canEdit,
  onOpenEntry,
  onCreateEntryFromTask,
  onRefresh
}: {
  workspaceId: string;
  collections: CuratedCollection[];
  glossaryTerms: GlossaryTerm[];
  editorialTasks: EditorialTask[];
  entries: EntryCardProjection[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onCreateEntryFromTask: (title: string, desc: string) => void;
  onRefresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"collections" | "glossary" | "kanban">("collections");

  // Collection form
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cEntryIds, setCEntryIds] = useState<string[]>([]);

  // Glossary form
  const [gTerm, setGTerm] = useState("");
  const [gDef, setGDef] = useState("");
  const [gCat, setGCat] = useState("Thuật ngữ");

  // Editorial task form
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tPriority, setTPriority] = useState<EditorialTask["priority"]>("medium");

  async function saveCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!cTitle.trim()) return;
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "collection",
        data: { workspaceId, title: cTitle.trim(), description: cDesc.trim(), sigil: "✦", color: "#D4AF37", isPublic: true, entryIds: cEntryIds }
      })
    });
    setCTitle("");
    setCDesc("");
    setCEntryIds([]);
    await onRefresh();
  }

  async function saveGlossary(e: React.FormEvent) {
    e.preventDefault();
    if (!gTerm.trim() || !gDef.trim()) return;
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "glossary",
        data: { workspaceId, term: gTerm.trim(), shortDef: gDef.trim(), category: gCat, sigil: "✧" }
      })
    });
    setGTerm("");
    setGDef("");
    await onRefresh();
  }

  async function saveTask(e: React.FormEvent) {
    e.preventDefault();
    if (!tTitle.trim()) return;
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "task",
        data: { workspaceId, title: tTitle.trim(), description: tDesc.trim(), stage: "idea", priority: tPriority }
      })
    });
    setTTitle("");
    setTDesc("");
    await onRefresh();
  }

  async function moveTask(task: EditorialTask, stage: EditorialTask["stage"]) {
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource: "task", data: { ...task, stage } })
    });
    await onRefresh();
  }

  async function deleteItem(resource: string, id: string) {
    await fetch(`/api/v2?resource=${resource}&id=${id}`, { method: "DELETE" });
    await onRefresh();
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <FolderKanban className="w-5 h-5" />
            Bộ Sưu Tập Chuyên Đề · Auto-Glossary · Kế Hoạch Biên Tập
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Tổ chức lộ trình đọc công khai, quản lý từ điển chú giải tự động trong bài viết và theo dõi tiến độ biên tập.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {(
            [
              ["collections", `Tuyển tập (${collections.length})`],
              ["glossary", `Auto-Glossary (${glossaryTerms.length})`],
              ["kanban", `Kế hoạch Biên tập (${editorialTasks.length})`]
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                tab === id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "collections" && (
        <div className="space-y-4">
          {canEdit && (
            <form onSubmit={saveCollection} className="codex-card rounded-2xl p-4 space-y-2.5 text-xs">
              <div className="font-semibold text-[var(--accent)]">+ Tạo Bộ Sưu Tập / Tuyển Tập Đọc Mới</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" required value={cTitle} onChange={(e) => setCTitle(e.target.value)} placeholder="Tên tuyển tập *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
                <input type="text" value={cDesc} onChange={(e) => setCDesc(e.target.value)} placeholder="Lời dẫn nhập..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {entries.slice(0, 20).map((e) => {
                  const active = cEntryIds.includes(e.id);
                  return (
                    <button key={e.id} type="button" onClick={() => setCEntryIds((p) => (active ? p.filter((x) => x !== e.id) : [...p, e.id]))} className={`px-2 py-1 rounded-lg border cursor-pointer ${active ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>
                      {e.sigil} {e.title}
                    </button>
                  );
                })}
              </div>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">Lưu Tuyển tập</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((c) => (
              <div key={c.id} className="codex-card arcane-corners rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[var(--accent)]">{c.sigil} {c.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{c.description}</p>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={() => deleteItem("collection", c.id)} className="text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <div className="space-y-1.5">
                  {c.entryIds.map((eid, idx) => {
                    const ent = entries.find((x) => x.id === eid);
                    if (!ent) return null;
                    return (
                      <button key={eid} type="button" onClick={() => onOpenEntry(eid)} className="w-full text-left flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-1.5 text-xs hover:border-[var(--accent)] cursor-pointer">
                        <span className="font-mono text-[var(--accent)]">{idx + 1}.</span>
                        <span>{ent.sigil} {ent.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "glossary" && (
        <div className="space-y-4">
          {canEdit && (
            <form onSubmit={saveGlossary} className="codex-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input type="text" required value={gTerm} onChange={(e) => setGTerm(e.target.value)} placeholder="Thuật ngữ *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
              <input type="text" value={gCat} onChange={(e) => setGCat(e.target.value)} placeholder="Nhóm (Địa lý, Lịch pháp...)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
              <input type="text" required value={gDef} onChange={(e) => setGDef(e.target.value)} placeholder="Giải nghĩa ngắn tự hiện khi di chuột *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
              <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 cursor-pointer">+ Thêm Thuật ngữ</button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {glossaryTerms.map((g) => (
              <div key={g.id} className="codex-card rounded-xl p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-base text-sky-300 flex items-center gap-1.5">
                    <BookMarked className="w-4 h-4" /> {g.term}
                  </span>
                  {canEdit && (
                    <button type="button" onClick={() => deleteItem("glossary", g.id)} className="text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
                <div className="text-[10px] font-mono text-[var(--accent)] uppercase">{g.category}</div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{g.shortDef}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "kanban" && (
        <div className="space-y-4">
          {canEdit && (
            <form onSubmit={saveTask} className="codex-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input type="text" required value={tTitle} onChange={(e) => setTTitle(e.target.value)} placeholder="Ý tưởng / Mục cần biên tập *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
              <input type="text" value={tDesc} onChange={(e) => setTDesc(e.target.value)} placeholder="Mô tả chi tiết..." className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5" />
              <select value={tPriority} onChange={(e) => setTPriority(e.target.value as EditorialTask["priority"])} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5">
                <option value="high">Ưu tiên Cao</option>
                <option value="medium">Ưu tiên Trung bình</option>
                <option value="low">Ưu tiên Thấp</option>
              </select>
              <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 cursor-pointer">+ Thêm đầu việc</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {(
              [
                ["idea", "Ý tưởng"],
                ["writing", "Đang viết"],
                ["review", "Cần rà soát"],
                ["done", "Hoàn thành"]
              ] as const
            ).map(([stage, label]) => (
              <div key={stage} className="codex-card rounded-2xl p-3 space-y-2">
                <div className="text-xs font-semibold text-[var(--accent)] uppercase border-b border-[var(--border-subtle)] pb-1.5">
                  {label} ({editorialTasks.filter((t) => t.stage === stage).length})
                </div>
                {editorialTasks
                  .filter((t) => t.stage === stage)
                  .map((t) => (
                    <div key={t.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 space-y-2 text-xs">
                      <div className="font-semibold">{t.title}</div>
                      {t.description && <p className="text-[11px] text-[var(--text-muted)]">{t.description}</p>}
                      {canEdit && (
                        <div className="flex flex-wrap items-center gap-1 pt-1">
                          <select value={t.stage} onChange={(e) => moveTask(t, e.target.value as EditorialTask["stage"])} className="rounded bg-white/5 border border-[var(--border-subtle)] text-[10px] px-1.5 py-0.5">
                            <option value="idea" className="bg-[#090e1c]">Ý tưởng</option>
                            <option value="writing" className="bg-[#090e1c]">Đang viết</option>
                            <option value="review" className="bg-[#090e1c]">Rà soát</option>
                            <option value="done" className="bg-[#090e1c]">Xong</option>
                          </select>
                          <button type="button" onClick={() => onCreateEntryFromTask(t.title, t.description)} className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] cursor-pointer">
                            → Tạo hồ sơ
                          </button>
                          <button type="button" onClick={() => deleteItem("task", t.id)} className="ml-auto text-rose-400 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== 2. CODEX BOOK MODE MODAL ==================== */

export function CodexBookModeModal({
  workspaceId,
  workspaceName,
  categoryId,
  conlang,
  onClose
}: {
  workspaceId: string;
  workspaceName: string;
  categoryId: string | null;
  conlang?: ConlangLanguage;
  onClose: () => void;
}) {
  const [chapters, setChapters] = useState<Entry[]>([]);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [conlangMode, setConlangMode] = useState<"vi" | "bilingual">("vi");

  useEffect(() => {
    const params = new URLSearchParams({ workspaceId, resource: "book" });
    if (categoryId) params.set("categoryId", categoryId);
    fetch(`/api/v2?${params}`)
      .then((r) => r.json())
      .then((data) => setChapters(data.entries || []));
  }, [workspaceId, categoryId]);

  const current = chapters[chapterIdx];

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border-strong)] no-print">
          <div className="flex items-center gap-2 text-sm font-display font-bold text-[var(--accent)]">
            <BookOpenText className="w-5 h-5" />
            <span>Sách Cổ Thư — {workspaceName} ({chapters.length} chương)</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setConlangMode((m) => (m === "vi" ? "bilingual" : "vi"))} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer">
              <Languages className="w-3.5 h-3.5" /> {conlangMode === "vi" ? "Đọc Song ngữ Cổ ngữ" : "Trở về Tiếng Việt"}
            </button>
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs cursor-pointer">
              <Printer className="w-3.5 h-3.5" /> In Sách PDF
            </button>
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
              Đóng Sách
            </button>
          </div>
        </div>

        {chapters.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-muted)] py-12">Đang đóng quyển Cổ thư...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <aside className="md:col-span-4 codex-card rounded-2xl p-4 space-y-1.5 max-h-[70vh] overflow-y-auto no-print">
              <div className="text-xs font-mono uppercase text-[var(--accent)] mb-2">Mục lục Chuyên khảo</div>
              {chapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setChapterIdx(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs truncate cursor-pointer ${
                    idx === chapterIdx
                      ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-white/5"
                  }`}
                >
                  Chương {idx + 1}: {ch.sigil} {ch.title}
                </button>
              ))}
            </aside>

            <article className="md:col-span-8 codex-card arcane-corners rounded-2xl p-6 sm:p-8 space-y-4">
              {current && (
                <>
                  <div className="text-xs font-mono uppercase text-[var(--accent)]">
                    Chương {chapterIdx + 1} / {chapters.length}
                  </div>
                  <h1 className="font-display text-3xl font-bold">
                    {current.sigil} {current.title}
                  </h1>
                  {current.subtitle && <p className="italic text-sm text-[var(--text-muted)]">{current.subtitle}</p>}
                  <div className="codex-divider text-xs">✧ ✦ ✧</div>
                  <MarkdownCodexRenderer
                    markdown={current.contentMarkdown}
                    linkLookup={[]}
                    conlang={conlang}
                    conlangDisplayMode={conlangMode}
                  />
                  <div className="flex justify-between pt-6 border-t border-[var(--border-subtle)] no-print">
                    <button type="button" disabled={chapterIdx === 0} onClick={() => setChapterIdx((i) => i - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs disabled:opacity-40 cursor-pointer">
                      <ChevronLeft className="w-4 h-4" /> Chương trước
                    </button>
                    <button type="button" disabled={chapterIdx >= chapters.length - 1} onClick={() => setChapterIdx((i) => i + 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-xs disabled:opacity-40 cursor-pointer">
                      Chương tiếp <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </article>
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== 3. MULTI-ENTITY COMPARISON MATRIX (2-6 ENTRIES) ==================== */

export function MultiMatrixModal({
  entryIds,
  entryTypes,
  onClose
}: {
  entryIds: string[];
  entryTypes: EntryType[];
  onClose: () => void;
}) {
  const [items, setItems] = useState<Entry[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all(
      entryIds.map((id) => fetch(`/api/entries/${id}`).then((r) => r.json()).then((d) => d.entry))
    ).then((list) => setItems(list.filter(Boolean)));
  }, [entryIds]);

  const fieldKeys = Array.from(
    new Set(
      items.flatMap((e) => {
        const t = entryTypes.find((x) => x.id === e.entryTypeId);
        return (t?.fieldSchema || []).filter((f) => f.type !== "private_note" && f.type !== "table").map((f) => f.key);
      })
    )
  );

  function copyMarkdown() {
    navigator.clipboard?.writeText(buildComparisonMatrixMarkdown(items, entryTypes));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <h2 className="font-display text-xl text-[var(--accent)] flex items-center gap-2">
            <Columns2 className="w-5 h-5" /> Ma Trận Đối Chiếu Thực Thể ({items.length} hồ sơ)
          </h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={copyMarkdown} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer">
              <Copy className="w-3.5 h-3.5" /> {copied ? "Đã chép Markdown!" : "Chép bảng Markdown"}
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-strong)]">
                <th className="p-3 font-mono text-[var(--text-muted)] w-40">Thuộc tính</th>
                {items.map((e) => (
                  <th key={e.id} className="p-3 font-display text-base text-[var(--accent)] min-w-[180px]">
                    {e.sigil} {e.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              <tr>
                <td className="p-3 font-mono text-[var(--text-muted)]">Tóm tắt</td>
                {items.map((e) => <td key={e.id} className="p-3 text-[var(--text-secondary)]">{e.summary || "—"}</td>)}
              </tr>
              <tr>
                <td className="p-3 font-mono text-[var(--text-muted)]">Biệt danh</td>
                {items.map((e) => <td key={e.id} className="p-3">{(e.aliases || []).join(", ") || "—"}</td>)}
              </tr>
              <tr>
                <td className="p-3 font-mono text-[var(--text-muted)]">Xác thực</td>
                {items.map((e) => <td key={e.id} className="p-3 font-mono">{e.canonStatus || "canon"}</td>)}
              </tr>
              {fieldKeys.map((k) => (
                <tr key={k}>
                  <td className="p-3 font-mono text-[var(--text-muted)]">{k}</td>
                  {items.map((e) => {
                    const v = e.customFields?.[k];
                    return <td key={e.id} className="p-3">{v !== undefined && v !== null && v !== "" ? (Array.isArray(v) ? v.join(", ") : String(v)) : "—"}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ==================== 4. QUICK FLOATING SCRATCHPAD & SHORTCUTS MODAL ==================== */

export function QuickScratchpad({
  canEdit,
  onConvertToEntry
}: {
  canEdit: boolean;
  onConvertToEntry: (content: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    setText(localStorage.getItem("wiki_codex_scratchpad") || "");
  }, []);

  function update(val: string) {
    setText(val);
    localStorage.setItem("wiki_codex_scratchpad", val);
  }

  return (
    <div className="fixed bottom-20 lg:bottom-5 right-4 z-40 no-print">
      {open ? (
        <div className="w-80 max-w-[90vw] rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] shadow-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[var(--accent)]">
            <span className="flex items-center gap-1.5"><StickyNote className="w-4 h-4" /> Sổ Tay Nháp Nhanh</span>
            <button type="button" onClick={() => setOpen(false)}><X className="w-4 h-4" /></button>
          </div>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => update(e.target.value)}
            placeholder="Ghi nhanh ý tưởng nhân vật, vương quốc, cổ ngữ... (tự động lưu)"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 text-xs"
          />
          {canEdit && text.trim() && (
            <button
              type="button"
              onClick={() => {
                onConvertToEntry(text);
                setOpen(false);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Chuyển thành Hồ sơ mới
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Mở Sổ Tay Nháp Nổi"
          className="w-11 h-11 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--accent)] shadow-xl flex items-center justify-center hover:scale-105 transition cursor-pointer"
        >
          <StickyNote className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const keys = [
    ["Ctrl + K", "Mở Tìm kiếm Toàn cục không dấu"],
    ["Shift + N", "Tạo Hồ sơ Codex mới"],
    ["Shift + G", "Mở Đồ thị Tri thức & Gia phả"],
    ["Shift + M", "Mở Bản đồ Atlas V2"],
    ["Shift + L", "Mở Phòng Cổ Ngữ 1-Click"],
    ["Shift + B", "Mở Chế độ Đọc Sách Cổ Thư"],
    ["?", "Mở bảng phím tắt này"],
    ["Esc", "Thoát Zen Mode / Đóng hộp thoại"]
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--accent)] flex items-center gap-2">
            <Keyboard className="w-5 h-5" /> Phím tắt Nhanh (Power-User)
          </h3>
          <button type="button" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2 text-xs">
          {keys.map(([k, desc]) => (
            <div key={k} className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="text-[var(--text-secondary)]">{desc}</span>
              <kbd className="font-mono px-2 py-0.5 rounded bg-white/10 text-[var(--accent)]">{k}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
