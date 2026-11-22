"use client";

import React, { useState } from "react";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import type {
  CustomFieldDef,
  CustomFieldType,
  EntityCardStyle,
  EntryTabKey,
  EntryType
} from "@/types/codex";
import { entryTypeSupportsPower } from "@/lib/v5-properties";
import { IconSigilPicker } from "./IconSigilPicker";

interface EntryTypeManagerModalProps {
  workspaceId: string;
  entryTypes: EntryType[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

const CARD_STYLE_OPTIONS: Array<{ value: EntityCardStyle; label: string }> = [
  { value: "character", label: "Nhân vật (Foil Portrait Card)" },
  { value: "kingdom", label: "Vương quốc / Quốc gia (Royal Charter)" },
  { value: "language", label: "Cổ ngữ / Ngôn ngữ (Runic Tablet)" },
  { value: "artifact", label: "Cổ vật / Bảo vật (Relic Pedestal)" },
  { value: "creature", label: "Sinh vật / Thực vật (Bestiary Guide)" },
  { value: "city", label: "Đô thị / Thành phố (Atlas Postcard)" },
  { value: "landmark", label: "Địa danh / Kỳ quan (Landmark Postcard)" },
  { value: "religion", label: "Tôn giáo / Tín ngưỡng" },
  { value: "system", label: "Quy luật / Hệ thống" },
  { value: "event", label: "Sự kiện / Biên niên sử" },
  { value: "organization", label: "Tổ chức / Học phái" },
  { value: "house", label: "Gia tộc / Dòng họ" },
  { value: "lore", label: "Văn hiến / Hiệp ước / Cổ thư" }
];

const ALL_TABS: Array<{ key: EntryTabKey; label: string }> = [
  { key: "overview", label: "Tổng quan" },
  { key: "holdings", label: "Lãnh địa & Trực thuộc" },
  { key: "roster", label: "Nhân sự & Chức vụ" },
  { key: "power", label: "Chỉ số & Power Level" },
  { key: "details", label: "Thông số & Tỷ lệ" },
  { key: "sections", label: "Chương bổ sung" },
  { key: "eras", label: "Biến chuyển Thời kỳ" },
  { key: "relations", label: "Quan hệ & Liên kết" },
  { key: "timeline", label: "Dòng thời gian" },
  { key: "sources", label: "Nguồn & Ghi chú" },
  { key: "gallery", label: "Thư viện ảnh" }
];

const FIELD_TYPES: Array<{ value: CustomFieldType; label: string }> = [
  { value: "text", label: "Văn bản ngắn" },
  { value: "textarea", label: "Văn bản dài" },
  { value: "number", label: "Số & Đơn vị" },
  { value: "date", label: "Ngày tháng" },
  { value: "select", label: "Danh sách chọn" },
  { value: "multiselect", label: "Chọn nhiều" },
  { value: "entity_ref", label: "Liên kết thực thể" },
  { value: "table", label: "Bảng dữ liệu động" },
  { value: "private_note", label: "Ghi chú riêng tư (Ẩn khách)" }
];

export function EntryTypeManagerModal({
  workspaceId,
  entryTypes,
  onClose,
  onRefresh
}: EntryTypeManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("ScrollText");
  const [sigil, setSigil] = useState("✦");
  const [color, setColor] = useState("#D4AF37");
  const [cardStyle, setCardStyle] = useState<EntityCardStyle>("lore");
  const [supportsPower, setSupportsPower] = useState(true);
  const [supportsVariants, setSupportsVariants] = useState(false);
  const [enabledTabs, setEnabledTabs] = useState<EntryTabKey[]>([
    "overview",
    "power",
    "details",
    "sections",
    "eras",
    "relations",
    "timeline",
    "sources",
    "gallery"
  ]);
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [saving, setSaving] = useState(false);

  function loadForEdit(t: EntryType) {
    setEditingId(t.id);
    setName(t.name);
    setDescription(t.description);
    setIcon(t.icon);
    setSigil(t.sigil);
    setColor(t.color);
    setCardStyle(t.cardStyle || "lore");
    setSupportsPower(entryTypeSupportsPower(t));
    setSupportsVariants(Boolean(t.supportsVariants));
    setEnabledTabs([...t.enabledTabs]);
    setFields(t.fieldSchema.map((f) => ({ ...f })));
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setIcon("ScrollText");
    setSigil("✦");
    setColor("#D4AF37");
    setCardStyle("lore");
    setSupportsPower(true);
    setSupportsVariants(false);
    setEnabledTabs(["overview", "power", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"]);
    setFields([]);
  }

  function addField() {
    setFields((prev) => [
      ...prev,
      { key: `field_${prev.length + 1}`, label: "Trường thông tin mới", type: "text", showInInfobox: true }
    ]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/entry-types", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          workspaceId,
          name,
          description,
          icon,
          sigil,
          color,
          cardStyle,
          supportsPower,
          supportsVariants,
          enabledTabs: supportsPower
            ? enabledTabs.includes("power")
              ? enabledTabs
              : ["overview", "power", ...enabledTabs.filter((t) => t !== "overview")]
            : enabledTabs.filter((t) => t !== "power"),
          fieldSchema: fields
        })
      });
      resetForm();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa Loại thực thể này? Các hồ sơ cũ sẽ chuyển sang loại mặc định.")) return;
    await fetch(`/api/entry-types?id=${id}`, { method: "DELETE" });
    await onRefresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="font-display text-xl text-[var(--accent)]">
            ✦ Quản lý Loại Thực thể & Trường Tùy biến Động (CRUD)
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4 space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase">
                Loại hiện có ({entryTypes.length})
              </span>
              <button type="button" onClick={resetForm} className="text-xs text-[var(--accent)] hover:underline cursor-pointer">
                + Tạo mới
              </button>
            </div>
            {entryTypes.map((t) => (
              <div
                key={t.id}
                className={`rounded-xl border p-3 flex items-center justify-between gap-2 ${
                  editingId === t.id
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-base)]/50"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    <span style={{ color: t.color }} className="mr-1.5">{t.sigil}</span>
                    {t.name}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {t.fieldSchema.length} trường · {t.enabledTabs.length} tab
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => loadForEdit(t)} className="p-1 rounded hover:bg-white/10 text-[var(--accent)] cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                  {entryTypes.length > 1 && (
                    <button type="button" onClick={() => handleDelete(t.id)} className="p-1 rounded hover:bg-white/10 text-rose-400 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSave} className="md:col-span-8 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Tên Loại thực thể *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Vương quốc, Dòng tộc, Sinh vật học..." className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Mô tả ngắn</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm" />
              </div>
            </div>

            <IconSigilPicker
              icon={icon}
              sigil={sigil}
              color={color}
              onChange={(n) => {
                setIcon(n.icon);
                setSigil(n.sigil);
                setColor(n.color);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Kiểu Thẻ Hiển thị (Card Archetype)</label>
                <select
                  value={cardStyle}
                  onChange={(e) => setCardStyle(e.target.value as EntityCardStyle)}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2 text-xs"
                >
                  {CARD_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supportsPower}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setSupportsPower(next);
                    setEnabledTabs((prev) =>
                      next
                        ? prev.includes("power")
                          ? prev
                          : ["overview", "power", ...prev.filter((t) => t !== "overview")]
                        : prev.filter((t) => t !== "power")
                    );
                  }}
                />
                <span>Có Chỉ số & Power Level</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={supportsVariants}
                  onChange={(e) => setSupportsVariants(e.target.checked)}
                />
                <span>Hỗ trợ Đa hình thái (Variants)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1.5">Bật / Tắt các Tab hiển thị</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TABS.map((t) => {
                  const active = enabledTabs.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() =>
                        setEnabledTabs((prev) =>
                          active ? prev.filter((k) => k !== t.key) : [...prev, t.key]
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                        active
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      {active ? "✓ " : "+ "}{t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--accent)]">Trường dữ liệu động ({fields.length})</span>
                <button type="button" onClick={addField} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Thêm trường động
                </button>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {fields.map((f, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-2">
                    <input
                      type="text"
                      value={f.label}
                      onChange={(e) =>
                        setFields((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, label: e.target.value, key: x.key.startsWith("field_") ? e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") || x.key : x.key }
                              : x
                          )
                        )
                      }
                      className="col-span-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, type: e.target.value as CustomFieldType } : x)))}
                      className="col-span-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-1 text-xs"
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>{ft.label}</option>
                      ))}
                    </select>
                    <label className="col-span-3 flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <input type="checkbox" checked={Boolean(f.showInInfobox)} onChange={(e) => setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, showInInfobox: e.target.checked } : x)))} />
                      Infobox
                    </label>
                    <button type="button" onClick={() => setFields((prev) => prev.filter((_, i) => i !== idx))} className="col-span-1 text-rose-400 justify-self-center cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
                {saving ? "Đang lưu..." : editingId ? "Cập nhật Loại thực thể" : "Tạo Loại thực thể mới"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
