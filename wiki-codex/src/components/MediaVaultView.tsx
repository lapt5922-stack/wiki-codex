"use client";

import React, { useMemo, useState } from "react";
import { Copy, Image as ImageIcon, Plus, Search, Trash2, UploadCloud } from "lucide-react";
import type { MediaAsset } from "@/types/codex";
import { matchesVietnameseQuery } from "@/lib/vietnamese";

interface MediaVaultViewProps {
  workspaceId: string;
  mediaAssets: MediaAsset[];
  canEdit: boolean;
  onRefresh: () => Promise<void>;
}

export function MediaVaultView({
  workspaceId,
  mediaAssets,
  canEdit,
  onRefresh
}: MediaVaultViewProps) {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // External URL form
  const [extTitle, setExtTitle] = useState("");
  const [extUrl, setExtUrl] = useState("");
  const [extTags, setExtTags] = useState("");

  const filtered = useMemo(
    () =>
      mediaAssets.filter(
        (m) =>
          !search ||
          matchesVietnameseQuery(`${m.title} ${m.caption} ${m.tags.join(" ")}`, search)
      ),
    [mediaAssets, search]
  );

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || !canEdit) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("workspaceId", workspaceId);
        fd.append("title", file.name.replace(/\.[^.]+$/, ""));
        await fetch("/api/media/upload", { method: "POST", body: fd });
      }
      await onRefresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleAddExternal(e: React.FormEvent) {
    e.preventDefault();
    if (!extTitle.trim() || !extUrl.trim()) return;
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "media",
        data: {
          workspaceId,
          title: extTitle.trim(),
          thumbUrl: extUrl.trim(),
          fullUrl: extUrl.trim(),
          tags: extTags.split(",").map((s) => s.trim()).filter(Boolean),
          caption: extTitle.trim(),
          source: "external"
        }
      })
    });
    setExtTitle("");
    setExtUrl("");
    setExtTags("");
    await onRefresh();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/v2?resource=media&id=${id}`, { method: "DELETE" });
    await onRefresh();
  }

  function copyUrl(asset: MediaAsset) {
    navigator.clipboard?.writeText(asset.fullUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Kho Ảnh Trung Tâm (Global Media Vault — {mediaAssets.length} ảnh)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Tải ảnh kéo-thả trực tiếp từ máy tính hoặc gắn URL CDN quy mô lớn — tái sử dụng ngay trong Hồ sơ & Bản đồ Atlas.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm ảnh không dấu..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
        </div>

        {canEdit && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-1">
            {/* Drag & Drop File Upload Zone */}
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              className="rounded-xl border-2 border-dashed border-[var(--border-strong)] bg-[var(--accent-soft)] p-4 flex flex-col items-center justify-center text-center gap-1.5 cursor-pointer hover:brightness-110 transition"
            >
              <UploadCloud className="w-6 h-6 text-[var(--accent)]" />
              <div className="text-xs font-semibold text-[var(--accent)]">
                {uploading ? "Đang tải ảnh lên..." : "Kéo-thả hoặc bấm chọn nhiều ảnh từ máy tính"}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">PNG, JPG, WEBP, SVG, GIF (tối đa 10MB/ảnh)</div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </label>

            {/* Add External CDN URL */}
            <form onSubmit={handleAddExternal} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-[var(--text-secondary)]">Hoặc gắn liên kết ảnh CDN ngoài</div>
              <input type="text" required value={extTitle} onChange={(e) => setExtTitle(e.target.value)} placeholder="Tên ảnh / mô tả *" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <div className="flex gap-2">
                <input type="url" required value={extUrl} onChange={(e) => setExtUrl(e.target.value)} placeholder="https://..." className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <input type="text" value={extTags} onChange={(e) => setExtTags(e.target.value)} placeholder="Thẻ..." className="w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filtered.map((m) => (
          <div key={m.id} className="codex-card rounded-2xl overflow-hidden flex flex-col">
            <div className="aspect-[16/10] bg-[var(--bg-base)] overflow-hidden border-b border-[var(--border-subtle)]">
              <img src={m.thumbUrl} alt={m.title} loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
            <div className="p-3 space-y-1.5 flex-1 flex flex-col">
              <div className="text-xs font-semibold truncate">{m.title}</div>
              <div className="flex flex-wrap gap-1">
                {m.tags.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[var(--text-muted)]">#{t}</span>
                ))}
              </div>
              <div className="pt-2 mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] text-[11px]">
                <button type="button" onClick={() => copyUrl(m)} className="flex items-center gap-1 text-[var(--accent)] hover:underline cursor-pointer">
                  <Copy className="w-3 h-3" /> {copiedId === m.id ? "Đã chép!" : "Chép URL"}
                </button>
                {canEdit && (
                  <button type="button" onClick={() => handleDelete(m.id)} className="text-rose-400 cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
