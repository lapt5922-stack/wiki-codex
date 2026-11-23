"use client";

import React, { useRef, useState } from "react";
import {
  Check,
  ClipboardPaste,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  ZoomIn
} from "lucide-react";
import {
  type ImageAspectPreset,
  uploadImageToVault
} from "@/lib/client-image-optimizer";
import { ImageLightboxModal } from "./ImageLightboxModal";

interface DirectImageUploadFieldProps {
  workspaceId: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  preset?: ImageAspectPreset;
  tags?: string;
  placeholder?: string;
  compact?: boolean;
}

export function DirectImageUploadField({
  workspaceId,
  label,
  value,
  onChange,
  preset = "free",
  tags = "direct-upload",
  placeholder = "https://... hoặc kéo thả / tải ảnh trực tiếp",
  compact = false
}: DirectImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusOk, setStatusOk] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  async function processFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG).");
      return;
    }
    setUploading(true);
    setError(null);
    setStatusOk(null);
    try {
      const res = await uploadImageToVault({
        file,
        workspaceId,
        preset,
        title: `${label} - ${file.name.replace(/\.[^.]+$/, "")}`,
        tags
      });
      onChange(res.url);
      const kb = res.sizeBytes ? `${Math.max(1, Math.round(res.sizeBytes / 1024))} KB` : "";
      setStatusOk(kb ? `Đã tải lên (${kb})` : "Đã tải lên thành công");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          void processFile(file);
          return;
        }
      }
    }
  }

  return (
    <div className="space-y-1.5" onPaste={handlePaste}>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </label>
        {statusOk && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <Check className="w-3 h-3" /> {statusOk}
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`rounded-xl border transition-all p-2.5 ${
          dragActive
            ? "border-[var(--accent)] bg-[var(--accent)]/15 ring-2 ring-[var(--accent)]/30"
            : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
        }`}
      >
        <div className={`flex ${compact ? "items-center gap-2.5" : "flex-col sm:flex-row items-start sm:items-center gap-3"}`}>
          {/* Thumbnail Preview */}
          <div className="relative shrink-0">
            {value ? (
              <div className="relative group">
                <img
                  src={value}
                  alt={label}
                  onClick={() => setLightboxOpen(true)}
                  className={`${
                    compact ? "w-12 h-12" : "w-16 h-16"
                  } rounded-xl object-cover border border-[var(--border-subtle)] cursor-zoom-in bg-black/20`}
                />
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity cursor-pointer"
                  title="Phóng to xem ảnh"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                className={`${
                  compact ? "w-12 h-12" : "w-16 h-16"
                } rounded-xl border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-surface)]`}
              >
                <ImageIcon className="w-5 h-5 opacity-60" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex-1 min-w-0 w-full space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[var(--accent)] text-black font-semibold text-xs inline-flex items-center gap-1.5 cursor-pointer hover:brightness-110 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {uploading ? "Đang tối ưu & tải..." : "Tải ảnh từ máy"}
              </button>

              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] px-1.5">
                <ClipboardPaste className="w-3 h-3" /> Kéo thả hoặc dán Ctrl+V
              </span>

              {value && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setStatusOk(null);
                  }}
                  className="ml-auto min-h-[34px] px-2 py-1 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/15 text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  title="Xóa ảnh hiện tại"
                >
                  <Trash2 className="w-3 h-3" /> Xóa
                </button>
              )}
            </div>

            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void processFile(f);
            e.target.value = "";
          }}
        />
      </div>

      {error && <div className="text-[11px] text-rose-400">{error}</div>}

      {lightboxOpen && value && (
        <ImageLightboxModal
          images={[{ url: value, title: label }]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}
