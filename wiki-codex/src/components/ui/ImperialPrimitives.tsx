"use client";

import React from "react";
import {
  AlertTriangle,
  Crown,
  LayoutDashboard,
  Library,
  Menu,
  Search,
  Users
} from "lucide-react";
import type { MainSection } from "@/lib/navigation-config";

export function ImperialButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  const sizeCls =
    size === "sm"
      ? "px-2.5 py-1.5 text-xs rounded-lg gap-1.5"
      : size === "lg"
      ? "px-5 py-2.5 text-sm rounded-xl gap-2"
      : "px-3.5 py-2 text-xs rounded-xl gap-1.5";

  const varCls =
    variant === "primary"
      ? "v9-sheen-btn bg-[var(--accent)] text-[#090e1c] font-semibold shadow-sm hover:brightness-105"
      : variant === "danger"
      ? "border border-rose-500/40 bg-rose-500/12 text-rose-300 hover:bg-rose-500/22"
      : variant === "ghost"
      ? "text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-white/5"
      : "v9-sheen-btn border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:border-[var(--border-strong)]";

  return (
    <button
      type={rest.type || "button"}
      className={`inline-flex items-center justify-center transition cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${sizeCls} ${varCls} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ImperialBentoCard({
  children,
  interactive = false,
  className = "",
  onClick
}: {
  children: React.ReactNode;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`v9-bento-card ${
        interactive ? "v9-bento-interactive cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function ImperialSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel
}: {
  options: Array<{ id: T; label: string; icon?: React.ReactNode; badge?: number | string }>;
  value: T;
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/80 p-1 overflow-x-auto max-w-full hide-scrollbar"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              active
                ? "bg-[var(--accent)] text-[#090e1c] font-semibold shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  active ? "bg-black/20 text-[#090e1c]" : "bg-white/10 text-[var(--text-secondary)]"
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ImperialViewSkeleton({ label = "Đang nạp phân hệ tri thức..." }: { label?: string }) {
  return (
    <div className="space-y-4 animate-v9-page-enter" role="status" aria-live="polite">
      <div className="v9-bento-card p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="v9-skeleton h-6 w-52" />
          <span className="text-[11px] font-mono text-[var(--accent)]">{label}</span>
        </div>
        <div className="v9-skeleton h-28 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="v9-skeleton h-24 w-full" />
          <div className="v9-skeleton h-24 w-full" />
          <div className="v9-skeleton h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export function MobileBottomNavDock({
  activeSection,
  hasActiveEntry,
  onNavigate,
  onOpenSearch,
  onOpenMenu
}: {
  activeSection: MainSection;
  hasActiveEntry: boolean;
  onNavigate: (sec: MainSection) => void;
  onOpenSearch: () => void;
  onOpenMenu: () => void;
}) {
  const items: Array<{
    key: string;
    label: string;
    active: boolean;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      key: "home",
      label: "Đại Sảnh",
      active: !hasActiveEntry && activeSection === "home",
      icon: <LayoutDashboard className="w-4 h-4" />,
      onClick: () => onNavigate("home")
    },
    {
      key: "database",
      label: "Kho Hồ Sơ",
      active: !hasActiveEntry && activeSection === "database",
      icon: <Library className="w-4 h-4" />,
      onClick: () => onNavigate("database")
    },
    {
      key: "search",
      label: "Tìm Kiếm",
      active: false,
      icon: <Search className="w-4 h-4" />,
      onClick: onOpenSearch
    },
    {
      key: "characters",
      label: "Nhân Vật",
      active: !hasActiveEntry && activeSection === "characters",
      icon: <Users className="w-4 h-4" />,
      onClick: () => onNavigate("characters")
    },
    {
      key: "kingdoms",
      label: "Quốc Gia",
      active: !hasActiveEntry && activeSection === "kingdoms",
      icon: <Crown className="w-4 h-4" />,
      onClick: () => onNavigate("kingdoms")
    },
    {
      key: "menu",
      label: "Phân Hệ",
      active: false,
      icon: <Menu className="w-4 h-4" />,
      onClick: onOpenMenu
    }
  ];

  return (
    <nav
      aria-label="Điều hướng di động Aethel Codex"
      className="fixed bottom-0 inset-x-0 z-40 lg:hidden v9-glass-header border-t border-[var(--border-subtle)] pb-safe no-print"
    >
      <div className="grid grid-cols-6 gap-0.5 px-1.5 py-1">
        {items.map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={it.onClick}
            className={`codex-touch-target flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition cursor-pointer ${
              it.active
                ? "bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                : "text-[var(--text-muted)] active:bg-white/5"
            }`}
          >
            {it.icon}
            <span className="truncate max-w-full px-0.5">{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function UnsavedChangesPrompt({
  open,
  onStay,
  onDiscard
}: {
  open: boolean;
  onStay: () => void;
  onDiscard: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-amber-500/45 bg-[var(--bg-elevated)] p-5 space-y-3.5 shadow-2xl animate-codex-scale-in">
        <div className="flex items-center gap-2.5 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="font-display text-lg font-bold">Thay đổi chưa được lưu</h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Bạn đang có nội dung chỉnh sửa chưa lưu vào cơ sở dữ liệu. Nếu đóng biểu mẫu ngay bây giờ, các thay đổi trực tiếp trên phiên này sẽ bị hủy.
        </p>
        <div className="flex justify-end gap-2 pt-1">
          <ImperialButton variant="secondary" onClick={onStay}>
            Tiếp tục biên tập
          </ImperialButton>
          <ImperialButton variant="danger" onClick={onDiscard}>
            Hủy thay đổi &amp; Đóng
          </ImperialButton>
        </div>
      </div>
    </div>
  );
}
