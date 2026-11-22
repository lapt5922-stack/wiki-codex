"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Monitor, Smartphone, Sparkles, Tablet } from "lucide-react";
import type { DeviceUIMode, ResolvedDeviceUI } from "@/types/codex";

const STORAGE_KEY = "wiki-codex-device-ui";
const DENSITY_KEY = "wiki-codex-ui-density";

export type UIDensity = "comfortable" | "compact";

interface DeviceUIContextValue {
  mode: DeviceUIMode;
  resolved: ResolvedDeviceUI;
  setMode: (mode: DeviceUIMode) => void;
  density: UIDensity;
  setDensity: (d: UIDensity) => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isManualOverride: boolean;
  viewportWidth: number;
}

const DeviceUIContext = createContext<DeviceUIContextValue>({
  mode: "auto",
  resolved: "desktop",
  setMode: () => {},
  density: "comfortable",
  setDensity: () => {},
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isManualOverride: false,
  viewportWidth: 1440
});

function detectDeviceFromWidth(w: number): ResolvedDeviceUI {
  if (w < 768) return "mobile";
  if (w < 1180) return "tablet";
  return "desktop";
}

export function DeviceUIProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<DeviceUIMode>("auto");
  const [density, setDensityState] = useState<UIDensity>("comfortable");
  const [viewportWidth, setViewportWidth] = useState<number>(1440);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as DeviceUIMode | null;
      if (saved === "auto" || saved === "mobile" || saved === "tablet" || saved === "desktop") {
        setModeState(saved);
      }
      const savedDensity = localStorage.getItem(DENSITY_KEY) as UIDensity | null;
      if (savedDensity === "comfortable" || savedDensity === "compact") {
        setDensityState(savedDensity);
      }
    } catch {
      // ignore storage errors
    }

    const updateWidth = () => setViewportWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth, { passive: true });
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const resolved: ResolvedDeviceUI = useMemo(() => {
    if (mode === "auto") return detectDeviceFromWidth(viewportWidth);
    return mode;
  }, [mode, viewportWidth]);

  useEffect(() => {
    document.documentElement.setAttribute("data-device-ui", resolved);
    document.documentElement.setAttribute("data-device-mode", mode);
    document.documentElement.setAttribute("data-ui-density", density);
  }, [resolved, mode, density]);

  const setMode = (next: DeviceUIMode) => {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  };

  const setDensity = (next: UIDensity) => {
    setDensityState(next);
    try {
      localStorage.setItem(DENSITY_KEY, next);
    } catch {
      // ignore
    }
  };

  const value = useMemo<DeviceUIContextValue>(
    () => ({
      mode,
      resolved,
      setMode,
      density,
      setDensity,
      isMobile: resolved === "mobile",
      isTablet: resolved === "tablet",
      isDesktop: resolved === "desktop",
      isManualOverride: mode !== "auto",
      viewportWidth
    }),
    [mode, resolved, density, viewportWidth]
  );

  return <DeviceUIContext.Provider value={value}>{children}</DeviceUIContext.Provider>;
}

export function useDeviceUI(): DeviceUIContextValue {
  return useContext(DeviceUIContext);
}

export const DEVICE_UI_OPTIONS: Array<{
  id: DeviceUIMode;
  label: string;
  shortLabel: string;
  desc: string;
}> = [
  { id: "auto", label: "Tự động theo máy", shortLabel: "Tự động", desc: "Tự khớp màn hình thực tế" },
  { id: "mobile", label: "Điện thoại", shortLabel: "Mobile", desc: "1 cột · Thanh đáy 5 nút · Accordion gọn" },
  { id: "tablet", label: "Máy tính bảng", shortLabel: "Tablet", desc: "2 cột cân bằng · Slim Rail cảm ứng" },
  { id: "desktop", label: "Desktop Pro", shortLabel: "Desktop", desc: "Đa cột · Split-View · Sticky TOC · Phím tắt" }
];

export function DeviceUISwitcher({ compact = false }: { compact?: boolean }) {
  const { mode, resolved, setMode, density, setDensity, isDesktop } = useDeviceUI();
  const [open, setOpen] = useState(false);

  const renderIcon = (id: DeviceUIMode | ResolvedDeviceUI, cls = "w-3.5 h-3.5") => {
    if (id === "mobile") return <Smartphone className={cls} />;
    if (id === "tablet") return <Tablet className={cls} />;
    if (id === "desktop") return <Monitor className={cls} />;
    return <Sparkles className={cls} />;
  };

  const currentLabel =
    mode === "auto"
      ? `Tự động (${resolved === "mobile" ? "Mobile" : resolved === "tablet" ? "Tablet" : "Desktop"})`
      : mode === "mobile"
      ? "Điện thoại"
      : mode === "tablet"
      ? "Tablet"
      : "Desktop";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-codex-border/80 bg-codex-panel/80 hover:border-codex-gold/60 text-xs text-codex-text transition-colors"
        title="Chuyển đổi giao diện tối ưu cho Điện thoại / Máy tính bảng / Desktop"
      >
        <span className="text-codex-gold">{renderIcon(resolved)}</span>
        {!compact && <span className="font-medium whitespace-nowrap">{currentLabel}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 rounded-xl border border-codex-border bg-codex-bg/98 shadow-2xl p-2.5 z-50 backdrop-blur-md">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-codex-gold flex items-center justify-between">
              <span>Chế độ Giao diện Thiết bị</span>
              <span className="text-[10px] font-normal text-codex-muted normal-case">
                Đang dùng: {resolved.toUpperCase()}
              </span>
            </div>

            <div className="mt-1.5 space-y-1">
              {DEVICE_UI_OPTIONS.map((opt) => {
                const active = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setMode(opt.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      active
                        ? "bg-codex-gold/15 border border-codex-gold/50 text-codex-gold"
                        : "hover:bg-codex-panel border border-transparent text-codex-text"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">{renderIcon(opt.id, "w-4 h-4")}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <span>{opt.label}</span>
                        {active && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-codex-gold/20 text-codex-gold">
                            Đang chọn
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-codex-muted leading-snug">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {isDesktop && (
              <div className="mt-2 pt-2 border-t border-codex-border/70 px-1.5">
                <div className="text-[10px] uppercase tracking-wider text-codex-muted mb-1.5">
                  Mật độ hiển thị Desktop
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDensity("comfortable")}
                    className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                      density === "comfortable"
                        ? "bg-codex-gold/15 border-codex-gold/50 text-codex-gold font-semibold"
                        : "border-codex-border text-codex-muted hover:text-codex-text"
                    }`}
                  >
                    Thoáng (Đọc sách)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDensity("compact")}
                    className={`px-2 py-1.5 rounded-lg text-xs border transition-colors ${
                      density === "compact"
                        ? "bg-codex-gold/15 border-codex-gold/50 text-codex-gold font-semibold"
                        : "border-codex-border text-codex-muted hover:text-codex-text"
                    }`}
                  >
                    Gọn (Tra cứu nhanh)
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
