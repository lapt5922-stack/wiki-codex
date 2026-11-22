"use client";

import React, { useMemo, useState } from "react";
import {
  ARCANE_SIGILS,
  FANTASY_ICONS,
  GEMSTONE_COLORS
} from "@/lib/icons";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { DynamicIcon } from "./DynamicIcon";

interface IconSigilPickerProps {
  icon: string;
  sigil: string;
  color: string;
  onChange: (next: { icon: string; sigil: string; color: string }) => void;
}

export function IconSigilPicker({
  icon,
  sigil,
  color,
  onChange
}: IconSigilPickerProps) {
  const [tab, setTab] = useState<"sigil" | "icon" | "color">("sigil");
  const [search, setSearch] = useState("");

  const filteredIcons = useMemo(
    () =>
      FANTASY_ICONS.filter(
        (i) => !search || matchesVietnameseQuery(`${i.label} ${i.id}`, search)
      ),
    [search]
  );

  const filteredSigils = useMemo(
    () =>
      ARCANE_SIGILS.filter(
        (s) => !search || matchesVietnameseQuery(`${s.label} ${s.glyph}`, search)
      ),
    [search]
  );

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 p-3 space-y-3">
      {/* Live preview + quick tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center border text-lg shadow-inner"
            style={{
              borderColor: color,
              backgroundColor: `${color}1F`,
              color
            }}
          >
            <span>{sigil || "✦"}</span>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center border"
            style={{
              borderColor: color,
              backgroundColor: `${color}14`,
              color
            }}
          >
            <DynamicIcon name={icon} className="w-5 h-5" />
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            <div className="font-medium text-[var(--text-primary)]">
              Biểu tượng & Ký hiệu Cổ ngữ
            </div>
            <div>Ký hiệu: {sigil} · Icon: {icon}</div>
          </div>
        </div>

        <div className="flex rounded-lg border border-[var(--border-subtle)] overflow-hidden text-xs">
          {(
            [
              ["sigil", "Ký hiệu (40+)"],
              ["icon", "Biểu tượng (60+)"],
              ["color", "Màu đá quý"]
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-2.5 py-1.5 transition cursor-pointer ${
                tab === id
                  ? "bg-[var(--accent-soft)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab !== "color" && (
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm biểu tượng / ký hiệu (không cần dấu)..."
            className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
          {tab === "sigil" && (
            <input
              type="text"
              value={sigil}
              maxLength={4}
              onChange={(e) => onChange({ icon, sigil: e.target.value, color })}
              placeholder="Tự nhập"
              title="Nhập ký hiệu hoặc emoji bất kỳ"
              className="w-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-center text-sm text-[var(--accent)] focus:outline-none focus:border-[var(--accent)]"
            />
          )}
        </div>
      )}

      {tab === "sigil" && (
        <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredSigils.map((s) => (
            <button
              key={s.glyph + s.label}
              type="button"
              title={s.label}
              onClick={() => onChange({ icon, sigil: s.glyph, color })}
              className={`h-8 rounded-md border text-base flex items-center justify-center transition cursor-pointer ${
                sigil === s.glyph
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] scale-105"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]"
              }`}
            >
              {s.glyph}
            </button>
          ))}
        </div>
      )}

      {tab === "icon" && (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 max-h-36 overflow-y-auto pr-1">
          {filteredIcons.map((i) => (
            <button
              key={i.id}
              type="button"
              title={i.label}
              onClick={() => onChange({ icon: i.id, sigil, color })}
              className={`h-9 rounded-md border flex items-center justify-center transition cursor-pointer ${
                icon === i.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-[var(--text-secondary)]"
              }`}
            >
              <DynamicIcon name={i.id} className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}

      {tab === "color" && (
        <div className="space-y-2">
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {GEMSTONE_COLORS.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => onChange({ icon, sigil, color: swatch.hex })}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition cursor-pointer ${
                  color.toLowerCase() === swatch.hex.toLowerCase()
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20"
                  style={{ backgroundColor: swatch.hex }}
                />
                <span className="truncate text-[11px]">{swatch.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>Màu tùy chỉnh:</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange({ icon, sigil, color: e.target.value })}
              className="w-8 h-6 rounded border border-[var(--border-subtle)] bg-transparent cursor-pointer"
            />
            <span className="font-mono">{color}</span>
          </div>
        </div>
      )}
    </div>
  );
}
