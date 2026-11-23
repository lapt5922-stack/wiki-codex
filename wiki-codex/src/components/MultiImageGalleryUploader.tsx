"use client";

import React, { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Upload, ZoomIn } from "lucide-react";
import { uploadImageToVault } from "@/lib/client-image-optimizer";
import { ImageLightboxModal } from "./ImageLightboxModal";

export interface GalleryImageEntry {
  id: string;
  url: string;
  caption: string;
  source?: string;
}

interface MultiImageGalleryUploaderProps {
  workspaceId: string;
  label?: string;
  items: GalleryImageEntry[];
  onChange: (next: GalleryImageEntry[]) => void;
  tags?: string;
}

export function MultiImageGalleryUploader({
  workspaceId,
  label = "Thư viện hình ảnh (Upload nhiều ảnh cùng lúc)",
  items,
  onChange,
  tags = "gallery"
}: MultiImageGalleryUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    setUploadingCount(files.length);
    setError(null);
    const added: GalleryImageEntry[] = [];
    for (const file of files) {
      try {
        const res = await uploadImageToVault({
          file,
          workspaceId,
          preset: "free",
          title: file.name.replace(/\.[^.]+$/, ""),
          tags
        });
        added.push({
          id: `gimg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          url: res.url,
          caption: file.name.replace(/\.[^.]+$/, ""),
          source: "Tải lên trực tiếp"
        });
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploadingCount((c) => Math.max(0, c - 1));
      }
    }
    if (added.length > 0) {
      onChange([...items, ...added]);
    }
  }

  function move(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {label} ({items.length})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={uploadingCount > 0}
            onClick={() => inputRef.current?.click()}
            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer hover:brightness-110 disabled:opacity-50"
          >
            {uploadingCount > 0 ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploadingCount > 0 ? `Đang tải (${uploadingCount})...` : "Chọn nhiều ảnh"}
          </button>
          <button
            type="button"
            onClick={() =>
              onChange([
                ...items,
                {
                  id: `gimg-${Date.now()}`,
                  url: "",
                  caption: "",
                  source: ""
                }
              ])
            }
            className="min-h-[38px] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs inline-flex items-center gap-1 cursor-pointer hover:border-[var(--accent)]"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm URL
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {error && <div className="text-xs text-rose-400">{error}</div>}

      {items.length === 0 ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 p-5 text-center text-xs text-[var(--text-muted)] cursor-pointer hover:border-[var(--accent)]"
        >
          Nhấn để chọn nhiều ảnh từ máy tính / điện thoại cho thư viện này.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 codex-scrollbar">
          {items.map((img, idx) => (
            <div
              key={img.id}
              className="flex items-start gap-2.5 p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
            >
              {img.url ? (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 group cursor-zoom-in border border-[var(--border-subtle)]"
                >
                  <img src={img.url} alt={img.caption} className="w-full h-full object-cover" />
                  <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white">
                    <ZoomIn className="w-4 h-4" />
                  </span>
                </button>
              ) : (
                <div className="w-14 h-14 rounded-lg border border-dashed border-[var(--border-subtle)] shrink-0" />
              )}

              <div className="flex-1 min-w-0 space-y-1.5">
                <input
                  type="text"
                  value={img.url}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...img, url: e.target.value };
                    onChange(next);
                  }}
                  placeholder="URL ảnh..."
                  className="w-full px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] outline-none"
                />
                <input
                  type="text"
                  value={img.caption}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...img, caption: e.target.value };
                    onChange(next);
                  }}
                  placeholder="Chú thích ảnh..."
                  className="w-full px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded border border-[var(--border-subtle)] disabled:opacity-30 cursor-pointer"
                  title="Lên"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  className="p-1 rounded border border-[var(--border-subtle)] disabled:opacity-30 cursor-pointer"
                  title="Xuống"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((x) => x.id !== img.id))}
                  className="p-1 rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && (
        <ImageLightboxModal
          images={items.filter((x) => x.url).map((x) => ({ url: x.url, title: x.caption, source: x.source }))}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
