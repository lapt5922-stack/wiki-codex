"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";

export interface LightboxImageItem {
  url: string;
  title?: string;
  caption?: string;
  source?: string;
}

interface ImageLightboxModalProps {
  images: LightboxImageItem[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageLightboxModal({
  images,
  initialIndex = 0,
  onClose
}: ImageLightboxModalProps) {
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, images.length - 1)));
  const [zoom, setZoom] = useState(1);

  const current = images[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && images.length > 1) {
        setIndex((i) => (i + 1) % images.length);
        setZoom(1);
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        setIndex((i) => (i - 1 + images.length) % images.length);
        setZoom(1);
      }
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(3.5, +(z + 0.25).toFixed(2)));
      if (e.key === "-") setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-md flex flex-col animate-codex-fade-up"
      onClick={onClose}
    >
      {/* Top Controls */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">
            {current.title || `Ảnh ${index + 1} / ${images.length}`}
          </div>
          {current.caption && (
            <div className="text-xs text-white/70 truncate">{current.caption}</div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-white/80 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3.5, +(z + 0.25).toFixed(2)))}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center"
            title="Về 100%"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <a
            href={current.url}
            download={current.title || "aethel-image"}
            target="_blank"
            rel="noreferrer"
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title="Tải ảnh xuống"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-white cursor-pointer flex items-center justify-center"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div
        className="flex-1 relative overflow-auto flex items-center justify-center p-4 codex-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => (i - 1 + images.length) % images.length);
              setZoom(1);
            }}
            className="fixed left-3 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white flex items-center justify-center cursor-pointer"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <img
          src={current.url}
          alt={current.title || "Preview"}
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          className="max-h-[78vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-transform duration-150 select-none"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => (i + 1) % images.length);
              setZoom(1);
            }}
            className="fixed right-3 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/60 hover:bg-black/85 border border-white/20 text-white flex items-center justify-center cursor-pointer"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Footer Info & Thumbnails */}
      {(current.source || images.length > 1) && (
        <div
          className="px-4 py-2.5 border-t border-white/10 bg-black/70 flex flex-col sm:flex-row items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-[11px] text-white/65">
            {current.source ? `Nguồn: ${current.source}` : `${index + 1} / ${images.length}`}
          </div>
          {images.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 codex-scrollbar">
              {images.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setZoom(1);
                  }}
                  className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer ${
                    i === index ? "border-amber-400" : "border-white/20 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
