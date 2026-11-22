"use client";

import React, { useState } from "react";
import { BookOpen, Download, Printer, X } from "lucide-react";
import type { Category, EntryType } from "@/types/codex";
import { buildCodexEpubBuffer } from "@/lib/epub-exporter";

interface BookPublisherModalProps {
  workspaceId: string;
  workspaceName: string;
  categories: Category[];
  entryTypes: EntryType[];
  onClose: () => void;
}

export function BookPublisherModal({
  workspaceId,
  workspaceName,
  categories,
  entryTypes,
  onClose
}: BookPublisherModalProps) {
  const [title, setTitle] = useState(`Đại Bách Khoa Toàn Thư — ${workspaceName}`);
  const [subtitle, setSubtitle] = useState("Ấn bản Lưu trữ Chính thức · Aethel Codex V4.0");
  const [author, setAuthor] = useState("Ban Biên Tập Aethel Codex");
  const [preface, setPreface] = useState(
    "Tập bách khoa toàn thư tổng hợp toàn bộ hồ sơ, lịch sử, chỉ số sức mạnh và tư liệu lưu trữ của thế giới."
  );
  const [scope, setScope] = useState<"all" | "category" | "entryType">("all");
  const [scopeId, setScopeId] = useState("");
  const [includePower, setIncludePower] = useState(true);
  const [includeQuotes, setIncludeQuotes] = useState(true);
  const [exportingEpub, setExportingEpub] = useState(false);

  async function handleDownloadEpub() {
    setExportingEpub(true);
    try {
      const qs = new URLSearchParams({ workspaceId, limit: "120" });
      if (scope === "category" && scopeId) qs.set("categoryId", scopeId);
      if (scope === "entryType" && scopeId) qs.set("entryTypeId", scopeId);
      const res = await fetch(`/api/entries?${qs.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      const chapters = items.map((e: { id: string; title: string; subtitle?: string; summary?: string }) => ({
        id: e.id,
        title: e.title,
        subtitle: e.subtitle,
        summary: e.summary,
        contentMarkdown: `## Tóm tắt Bách khoa\n\n${e.summary || e.subtitle || e.title}`
      }));
      const bytes = await buildCodexEpubBuffer({
        bookTitle: title,
        author,
        description: preface,
        chapters: chapters.length > 0 ? chapters : [{ id: "ch0", title, contentMarkdown: preface }]
      });
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/epub+zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-codex.epub`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setExportingEpub(false);
    }
  }

  function buildUrl() {
    const params = new URLSearchParams({
      workspaceId,
      kind: "book_html",
      title,
      subtitle,
      author,
      preface,
      scope,
      scopeId,
      includePower: String(includePower),
      includeQuotes: String(includeQuotes)
    });
    return `/api/v4?${params.toString()}`;
  }

  function handleOpenPrint() {
    const win = window.open(buildUrl(), "_blank");
    if (win) {
      win.addEventListener("load", () => {
        setTimeout(() => win.print(), 300);
      });
    }
  }

  async function handleDownloadHtml() {
    const res = await fetch(buildUrl());
    if (!res.ok) return;
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspaceName.toLowerCase().replace(/\s+/g, "-")}-codex-book.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h3 className="font-display text-lg font-bold text-[var(--accent)] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Xuất Bản Sách Bách Khoa In Ấn / PDF
          </h3>
          <button type="button" onClick={onClose} className="p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-[var(--text-muted)] mb-1">Tên sách trên trang bìa</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Phụ đề</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Tác giả / Người biên soạn</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[var(--text-muted)] mb-1">Lời tựa đầu sách</label>
            <textarea
              rows={2}
              value={preface}
              onChange={(e) => setPreface(e.target.value)}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[var(--text-muted)] mb-1">Phạm vi xuất bản</label>
              <select
                value={scope}
                onChange={(e) => {
                  setScope(e.target.value as "all" | "category" | "entryType");
                  setScopeId("");
                }}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
              >
                <option value="all">Toàn bộ Workspace</option>
                <option value="category">Theo Danh mục</option>
                <option value="entryType">Theo Loại thực thể</option>
              </select>
            </div>
            {scope === "category" && (
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Chọn danh mục</label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
                >
                  <option value="">— Chọn —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.sigil} {c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {scope === "entryType" && (
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Chọn loại thực thể</label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
                >
                  <option value="">— Chọn —</option>
                  {entryTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.sigil} {t.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePower}
                onChange={(e) => setIncludePower(e.target.checked)}
              />
              <span>Kèm bảng Power Level & Chỉ số RPG</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeQuotes}
                onChange={(e) => setIncludeQuotes(e.target.checked)}
              />
              <span>Kèm danh ngôn đề từ</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            disabled={exportingEpub}
            onClick={handleDownloadEpub}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/25 cursor-pointer disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5" /> {exportingEpub ? "Đang đóng gói…" : "Tải Sách .EPUB"}
          </button>
          <button
            type="button"
            onClick={handleDownloadHtml}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-strong)] text-[var(--accent)] text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Tải file HTML Offline
          </button>
          <button
            type="button"
            onClick={handleOpenPrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Mở bản In / Lưu PDF
          </button>
        </div>
      </div>
    </div>
  );
}
