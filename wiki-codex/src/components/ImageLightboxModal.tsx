"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ImageOff,
  Maximize2,
  Minimize2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { isMeaningfulValue } from "@/lib/empty-field-engine";

export interface LightboxImageItem {
  url: string;
  title?: string;
  caption?: string;
  author?: string;
  source?: string;
  category?: string;
  license?: string;
  createdAt?: string;
  altText?: string;
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
  const validImages = images.filter((img) => isMeaningfulValue(img?.url));
  const [index, setIndex] = useState(
    Math.max(0, Math.min(initialIndex, Math.max(0, validImages.length - 1)))
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const pinchDistRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = validImages[index];

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImgError(false);
  }

  function goPrev() {
    if (validImages.length <= 1) return;
    setIndex((i) => (i - 1 + validImages.length) % validImages.length);
    resetView();
  }

  function goNext() {
    if (validImages.length <= 1) return;
    setIndex((i) => (i + 1) % validImages.length);
    resetView();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)));
      if (e.key === "-") {
        setZoom((z) => {
          const next = Math.max(0.5, +(z - 0.25).toFixed(2));
          if (next <= 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") resetView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validImages.length, onClose]);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // ignore if browser blocks fullscreen
    }
  }

  if (!current) return null;

  const metaTags = [
    isMeaningfulValue(current.category) ? `Phân loại: ${current.category}` : "",
    isMeaningfulValue(current.author) ? `Tác giả: ${current.author}` : "",
    isMeaningfulValue(current.source) ? `Nguồn: ${current.source}` : "",
    isMeaningfulValue(current.license) ? `Bản quyền: ${current.license}` : "",
    isMeaningfulValue(current.createdAt) ? `Ngày: ${current.createdAt}` : ""
  ].filter(Boolean);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] bg-black/92 backdrop-blur-md flex flex-col animate-codex-fade-up select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10 bg-[#101522]/90"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#E9DFC9] truncate">
            {isMeaningfulValue(current.title)
              ? current.title
              : validImages.length > 1
              ? `Hình ảnh ${index + 1} / ${validImages.length}`
              : "Xem ảnh độ phân giải gốc"}
          </div>
          {isMeaningfulValue(current.caption) && (
            <div className="text-xs text-[#AEB7C4] truncate">{current.caption}</div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {validImages.length > 1 && (
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-xs text-[#C6A568]">
              {index + 1} / {validImages.length}
            </span>
          )}
          <button
            type="button"
            onClick={() =>
              setZoom((z) => {
                const next = Math.max(0.5, +(z - 0.25).toFixed(2));
                if (next <= 1) setPan({ x: 0, y: 0 });
                return next;
              })
            }
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-white/85 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center"
            title="Phóng to (+ hoặc lăn chuột)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer flex items-center justify-center"
            title="Khôi phục 100% (0)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            className="hidden sm:flex min-w-[38px] min-h-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer items-center justify-center"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href={current.url}
            download={current.title || "aethel-codex-image"}
            target="_blank"
            rel="noreferrer"
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            title="Mở / Tải ảnh gốc"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[38px] min-h-[38px] p-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-white cursor-pointer flex items-center justify-center"
            title="Đóng (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Zoom & Pan Canvas */}
      <div
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
        }`}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.2 : -0.2;
          setZoom((z) => {
            const next = Math.max(0.5, Math.min(4, +(z + delta).toFixed(2)));
            if (next <= 1) setPan({ x: 0, y: 0 });
            return next;
          });
        }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          setIsDragging(true);
          dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        }}
        onPointerMove={(e) => {
          if (!isDragging || !dragStartRef.current) return;
          const dx = e.clientX - dragStartRef.current.x;
          const dy = e.clientY - dragStartRef.current.y;
          setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
        }}
        onPointerUp={() => {
          setIsDragging(false);
          dragStartRef.current = null;
        }}
        onPointerLeave={() => {
          setIsDragging(false);
          dragStartRef.current = null;
        }}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchDistRef.current = Math.hypot(dx, dy);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchDistRef.current) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const ratio = dist / pinchDistRef.current;
            pinchDistRef.current = dist;
            setZoom((z) => Math.max(0.6, Math.min(4, +(z * ratio).toFixed(2))));
          }
        }}
        onTouchEnd={() => {
          pinchDistRef.current = null;
        }}
      >
        {validImages.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="fixed left-3 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/65 hover:bg-black/90 border border-[#C6A568]/40 text-[#E9DFC9] flex items-center justify-center cursor-pointer shadow-lg"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {imgError ? (
          <div className="rounded-2xl border border-rose-500/35 bg-[#1D2636]/90 p-8 text-center space-y-2 max-w-md">
            <ImageOff className="w-10 h-10 text-rose-300 mx-auto" />
            <div className="text-sm font-semibold text-[#E9DFC9]">Không thể tải hình ảnh này</div>
            <div className="text-xs text-[#AEB7C4] break-all">{current.url}</div>
          </div>
        ) : (
          <img
            src={current.url}
            alt={current.altText || current.title || current.caption || "Aethel Codex Image"}
            onError={() => setImgError(true)}
            onDoubleClick={() => {
              if (zoom > 1) resetView();
              else setZoom(2);
            }}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center"
            }}
            className="max-h-[78vh] max-w-[92vw] object-contain rounded-xl shadow-2xl transition-transform duration-75"
            draggable={false}
          />
        )}

        {validImages.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="fixed right-3 top-1/2 -translate-y-1/2 z-10 min-w-[44px] min-h-[44px] rounded-full bg-black/65 hover:bg-black/90 border border-[#C6A568]/40 text-[#E9DFC9] flex items-center justify-center cursor-pointer shadow-lg"
            aria-label="Ảnh tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Footer Non-Empty Metadata & Thumbnails */}
      {(metaTags.length > 0 || validImages.length > 1) && (
        <div
          className="px-4 py-2.5 border-t border-white/10 bg-[#101522]/90 flex flex-col sm:flex-row items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {metaTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#AEB7C4]">
              {metaTags.map((m) => (
                <span key={m} className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-[#AEB7C4]">
              Mẹo: Lăn chuột hoặc nhấp đúp để phóng to · Kéo chuột để di chuyển ảnh
            </div>
          )}

          {validImages.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 codex-scrollbar">
              {validImages.map((img, i) => (
                <button
                  key={`${img.url}-${i}`}
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    resetView();
                  }}
                  className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition ${
                    i === index
                      ? "border-[#C6A568] scale-105"
                      : "border-white/20 opacity-60 hover:opacity-100"
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
