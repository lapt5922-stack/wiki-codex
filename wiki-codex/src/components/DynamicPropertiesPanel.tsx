"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";
import type { DynamicPropertyKind, EntryCustomProperty, EntryType } from "@/types/codex";
import { DYNAMIC_PROPERTY_KINDS, QUICK_PROPERTY_PRESETS } from "@/lib/v5-properties";

interface DynamicPropertiesEditorProps {
  fields: EntryCustomProperty[];
  entryType?: EntryType;
  onChange: (next: EntryCustomProperty[]) => void;
}

export function DynamicPropertiesEditor({
  fields,
  entryType,
  onChange
}: DynamicPropertiesEditorProps) {
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState("Thông tin bổ sung");
  const [kind, setKind] = useState<DynamicPropertyKind>("text");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [color, setColor] = useState("#D4AF37");
  const [showInInfobox, setShowInInfobox] = useState(true);

  const matchingPresets = QUICK_PROPERTY_PRESETS.filter(
    (p) => !entryType || p.forTypeSlugs.includes(entryType.slug)
  );
  const presetsToShow = matchingPresets.length > 0 ? matchingPresets : QUICK_PROPERTY_PRESETS.slice(0, 3);

  function handleAdd() {
    if (!label.trim()) return;
    const item: EntryCustomProperty = {
      id: `ef-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label: label.trim(),
      group: group.trim() || "Thông tin bổ sung",
      kind,
      value: value.trim(),
      unit: kind === "number" ? unit.trim() : undefined,
      color: kind === "progress" || kind === "tags" || kind === "rating" ? color : undefined,
      showInInfobox,
      order: fields.length + 1
    };
    onChange([...fields, item]);
    setLabel("");
    setValue("");
    setUnit("");
  }

  function applyPreset(presetFields: Array<Omit<EntryCustomProperty, "id" | "order">>) {
    const existingLabels = new Set(fields.map((f) => f.label.toLowerCase()));
    const appended: EntryCustomProperty[] = [];
    presetFields.forEach((pf, idx) => {
      if (!existingLabels.has(pf.label.toLowerCase())) {
        appended.push({
          ...pf,
          id: `ef-${Date.now()}-${idx}`,
          order: fields.length + appended.length + 1
        });
      }
    });
    if (appended.length > 0) onChange([...fields, ...appended]);
  }

  function updateField(id: string, patch: Partial<EntryCustomProperty>) {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeField(id: string) {
    onChange(fields.filter((f) => f.id !== id));
  }

  function moveField(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= fields.length) return;
    const copy = [...fields];
    const [moved] = copy.splice(idx, 1);
    copy.splice(target, 0, moved);
    onChange(copy.map((f, i) => ({ ...f, order: i + 1 })));
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-base)]/60 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-display text-sm font-bold text-[var(--accent)] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Trường Thuộc Tính Động Cấp Hồ Sơ ({fields.length} trường tùy biến)
          </h4>
          <p className="text-[11px] text-[var(--text-muted)]">
            Tự do thêm, sửa, xóa, sắp xếp bất kỳ trường nào riêng cho hồ sơ này (10 kiểu dữ liệu).
          </p>
        </div>
      </div>

      {/* 1-Click Quick Preset Packs for this Entity Type */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Chèn nhanh cụm trường:</span>
        {presetsToShow.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.fields)}
            className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] hover:border-[var(--accent)] cursor-pointer"
          >
            + {p.title}
          </button>
        ))}
      </div>

      {/* Existing Custom Properties List */}
      {fields.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {fields.map((f, idx) => (
            <div
              key={f.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
            >
              <input
                type="text"
                value={f.label}
                onChange={(e) => updateField(f.id, { label: e.target.value })}
                placeholder="Tên trường"
                className="sm:col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs font-medium"
              />
              <select
                value={f.kind}
                onChange={(e) => updateField(f.id, { kind: e.target.value as DynamicPropertyKind })}
                className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]"
              >
                {DYNAMIC_PROPERTY_KINDS.map((k) => (
                  <option key={k.kind} value={k.kind}>{k.label}</option>
                ))}
              </select>
              <input
                type="text"
                value={f.value}
                onChange={(e) => updateField(f.id, { value: e.target.value })}
                placeholder="Giá trị..."
                className="sm:col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs"
              />
              <input
                type="text"
                value={f.group}
                onChange={(e) => updateField(f.id, { group: e.target.value })}
                placeholder="Nhóm"
                className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]"
              />
              <div className="sm:col-span-2 flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => updateField(f.id, { showInInfobox: !f.showInInfobox })}
                  title={f.showInInfobox ? "Đang hiện trên Infobox" : "Đang ẩn khỏi Infobox"}
                  className={`p-1 rounded border cursor-pointer ${
                    f.showInInfobox
                      ? "border-[var(--accent)] text-[var(--accent)]"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {f.showInInfobox ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => moveField(idx, -1)}
                  className="p-1 rounded border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white cursor-pointer"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveField(idx, 1)}
                  className="p-1 rounded border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-white cursor-pointer"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => removeField(f.id)}
                  className="p-1 rounded border border-rose-500/30 text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Custom Property Row */}
      <div className="pt-2 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Tên trường mới (VD: Màu mắt, Trật tự câu...) *"
          className="sm:col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as DynamicPropertyKind)}
          className="sm:col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 text-xs"
        >
          {DYNAMIC_PROPERTY_KINDS.map((k) => (
            <option key={k.kind} value={k.kind}>{k.label}</option>
          ))}
        </select>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={
            kind === "progress"
              ? "0 – 100"
              : kind === "rating"
              ? "1 – 5"
              : kind === "tags"
              ? "Thẻ 1, Thẻ 2..."
              : "Giá trị trường..."
          }
          className="sm:col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
        />
        {kind === "number" ? (
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="Đơn vị (cm, năm...)"
            className="sm:col-span-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 text-xs"
          />
        ) : (
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder="Nhóm"
            className="sm:col-span-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 text-xs"
          />
        )}
        <div className="sm:col-span-2 flex items-center gap-1.5">
          {(kind === "progress" || kind === "tags" || kind === "rating") && (
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 rounded bg-transparent cursor-pointer shrink-0"
              title="Màu nhấn"
            />
          )}
          <label className="inline-flex items-center gap-1 text-[10px] text-[var(--text-muted)] cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={showInInfobox}
              onChange={(e) => setShowInInfobox(e.target.checked)}
            />
            Infobox
          </label>
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm
          </button>
        </div>
      </div>
    </div>
  );
}

export function RenderDynamicPropertyValue({
  prop,
  onOpenByTitle
}: {
  prop: EntryCustomProperty;
  onOpenByTitle?: (title: string) => void;
}) {
  if (prop.kind === "private_note") {
    return (
      <span className="inline-flex items-center gap-1 text-amber-300 text-xs">
        <Lock className="w-3 h-3 shrink-0" />
        <span>{prop.value}</span>
      </span>
    );
  }
  if (prop.kind === "progress") {
    const pct = Math.min(100, Math.max(0, Number(prop.value) || 0));
    const col = prop.color || "#38BDF8";
    return (
      <div className="w-full space-y-1">
        <div className="flex justify-between font-mono text-[11px]" style={{ color: col }}>
          <span>{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: col }} />
        </div>
      </div>
    );
  }
  if (prop.kind === "rating") {
    const n = Math.min(5, Math.max(1, Math.round(Number(prop.value) || 1)));
    return (
      <span className="font-mono text-sm tracking-wider" style={{ color: prop.color || "#FBBF24" }}>
        {"★".repeat(n)}
        <span className="opacity-30">{"★".repeat(5 - n)}</span>
      </span>
    );
  }
  if (prop.kind === "tags") {
    const items = prop.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((t, i) => (
          <span
            key={i}
            className="text-[10px] px-2 py-0.5 rounded-full border"
            style={{
              borderColor: `${prop.color || "#D4AF37"}55`,
              backgroundColor: `${prop.color || "#D4AF37"}18`,
              color: prop.color || "#F5EFDF"
            }}
          >
            {t}
          </span>
        ))}
      </div>
    );
  }
  if (prop.kind === "number") {
    return (
      <span className="font-mono font-semibold text-[var(--text-primary)]">
        {prop.value} {prop.unit || ""}
      </span>
    );
  }
  if (prop.kind === "entity_ref") {
    return (
      <button
        type="button"
        onClick={() => onOpenByTitle?.(prop.value)}
        className="inline-flex items-center gap-1 text-[var(--accent)] underline decoration-dotted underline-offset-4 cursor-pointer text-xs font-medium"
      >
        <span>✦ {prop.value}</span>
      </button>
    );
  }
  if (prop.kind === "url") {
    return (
      <a
        href={prop.value}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sky-300 underline text-xs"
      >
        <span className="truncate max-w-[200px]">{prop.value}</span>
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    );
  }
  return <span className="text-[var(--text-primary)] whitespace-pre-wrap">{prop.value}</span>;
}
