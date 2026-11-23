"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Layers,
  Link2,
  Pin,
  Plus,
  Sparkles,
  Trash2
} from "lucide-react";
import type { ContentAccessLevel } from "@/types/character-codex";
import {
  type CustomProfileBlock,
  type CustomProfileFieldItem,
  type EntityProfileLayoutConfig,
  type FreeformFieldKind,
  isCustomFieldMeaningful,
  isMeaningfulValue
} from "@/lib/empty-field-engine";
import { DirectImageUploadField } from "./DirectImageUploadField";

export const FIELD_KIND_LABELS: Record<FreeformFieldKind, string> = {
  text: "Văn bản ngắn (Khóa : Giá trị)",
  markdown: "Đoạn văn / Bài viết chi tiết",
  number: "Con số / Chỉ số (kèm đơn vị)",
  progress_bar: "Thanh tỷ lệ / Trạng thái (%)",
  tag_list: "Danh sách Thẻ / Thuộc tính",
  key_value_group: "Nhóm Cặp Thông số (Key-Value)",
  table: "Bảng dữ liệu đa cột",
  image_card: "Hình ảnh minh họa (kèm Lightbox)",
  entity_links: "Liên kết Hồ sơ Thực thể",
  callout_secret: "Hộp Ghi chú / Bí mật / Spoiler"
};

export const TAB_QUICK_SUGGESTIONS: Record<
  string,
  Array<{ label: string; kind: FreeformFieldKind; pin?: boolean }>
> = {
  identity: [
    { label: "Tên tự / Đạo hiệu", kind: "text", pin: true },
    { label: "Ngày sinh chi tiết", kind: "text", pin: true },
    { label: "Nơi sinh", kind: "text", pin: true },
    { label: "Dòng tộc / Gia문", kind: "text", pin: true },
    { label: "Thế giới khởi nguyên", kind: "text", pin: true },
    { label: "Châm ngôn sống", kind: "markdown" }
  ],
  appearance: [
    { label: "Mô tả tổng quan ngoại hình", kind: "markdown" },
    { label: "Ảnh minh họa ngoại hình", kind: "image_card" },
    { label: "Chiều cao", kind: "text", pin: true },
    { label: "Cân nặng / Thể hình", kind: "text", pin: true },
    { label: "Màu tóc & Kiểu tóc", kind: "text", pin: true },
    { label: "Màu mắt & Ánh nhìn", kind: "text", pin: true },
    { label: "Đặc điểm nhận dạng", kind: "tag_list" },
    { label: "Trang phục đặc trưng", kind: "markdown" },
    { label: "Vết sẹo / Ấn ký", kind: "text" },
    { label: "Khí chất & Giọng nói", kind: "text" }
  ],
  personality: [
    { label: "Tính cách cốt lõi", kind: "markdown" },
    { label: "Đặc điểm nổi bật", kind: "tag_list" },
    { label: "Ưu điểm", kind: "tag_list" },
    { label: "Nhược điểm", kind: "tag_list" },
    { label: "Động cơ & Mục tiêu", kind: "markdown" },
    { label: "Nỗi sợ", kind: "text" },
    { label: "Niềm tin & Quan điểm", kind: "markdown" },
    { label: "Thói quen & Sở thích", kind: "tag_list" },
    { label: "Mâu thuẫn nội tâm", kind: "markdown" },
    { label: "Phản ứng khi nguy hiểm", kind: "text" }
  ],
  biography: [
    { label: "Nguồn gốc & Xuất thân", kind: "markdown" },
    { label: "Thời thơ ấu", kind: "markdown" },
    { label: "Quá trình trưởng thành", kind: "markdown" },
    { label: "Bước ngoặt cuộc đời", kind: "markdown" },
    { label: "Quá khứ bí mật", kind: "callout_secret" }
  ],
  abilities: [
    { label: "Năng lực đặc trưng", kind: "markdown" },
    { label: "Chuyên môn & Sở trường", kind: "tag_list" },
    { label: "Huyết mạch / Thiên phú", kind: "text", pin: true },
    { label: "Kháng tính & Miễn nhiễm", kind: "tag_list" },
    { label: "Giới hạn năng lực", kind: "markdown" },
    { label: "Chỉ số Tùy chỉnh", kind: "progress_bar" }
  ],
  default: [
    { label: "Thông tin ngắn", kind: "text", pin: true },
    { label: "Nội dung chi tiết", kind: "markdown" },
    { label: "Danh sách thuộc tính", kind: "tag_list" },
    { label: "Thanh chỉ số %", kind: "progress_bar" },
    { label: "Bảng thông số", kind: "table" },
    { label: "Hình ảnh minh họa", kind: "image_card" },
    { label: "Hộp Bí mật / Spoiler", kind: "callout_secret" }
  ]
};

/**
 * LEVEL 1: Tab Bar CRUD Manager (Add custom tab, rename any tab, hide/restore built-in tabs, delete custom tab)
 */
export function ProfileTabCrudBar({
  activeTabId,
  activeTabLabel,
  isBuiltIn,
  layout,
  onChangeLayout,
  onSelectTab
}: {
  activeTabId: string;
  activeTabLabel: string;
  isBuiltIn: boolean;
  layout: EntityProfileLayoutConfig;
  onChangeLayout: (next: EntityProfileLayoutConfig) => void;
  onSelectTab: (tabId: string) => void;
}) {
  const [newTabName, setNewTabName] = useState("");
  const [showAddTab, setShowAddTab] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(activeTabLabel);

  const hiddenBuiltIns = layout.hiddenBuiltInTabs || [];

  function handleAddCustomTab() {
    const clean = newTabName.trim();
    if (!clean) return;
    const id = `ctab-${Date.now()}`;
    const customTabs = [...(layout.customTabs || [])];
    customTabs.push({
      id,
      label: clean,
      sigil: "✦",
      order: customTabs.length + 100
    });
    // Also create a clean initial block with 0 forced fields so the user can add whatever they want
    const blocks = [...(layout.blocks || [])];
    blocks.push({
      id: `blk-${Date.now()}`,
      tabId: id,
      title: clean,
      order: 1,
      fields: []
    });
    onChangeLayout({ ...layout, customTabs, blocks });
    setNewTabName("");
    setShowAddTab(false);
    onSelectTab(id);
  }

  function handleRenameCurrentTab() {
    const clean = tempLabel.trim();
    if (!clean) return;
    if (isBuiltIn) {
      onChangeLayout({
        ...layout,
        renamedBuiltInTabs: { ...(layout.renamedBuiltInTabs || {}), [activeTabId]: clean }
      });
    } else {
      onChangeLayout({
        ...layout,
        customTabs: (layout.customTabs || []).map((t) =>
          t.id === activeTabId ? { ...t, label: clean } : t
        )
      });
    }
    setEditingLabel(false);
  }

  function handleRemoveCurrentTab() {
    if (isBuiltIn) {
      if (activeTabId === "identity" || activeTabId === "overview") return;
      const nextHidden = Array.from(new Set([...hiddenBuiltIns, activeTabId]));
      onChangeLayout({ ...layout, hiddenBuiltInTabs: nextHidden });
      onSelectTab("identity");
    } else {
      onChangeLayout({
        ...layout,
        customTabs: (layout.customTabs || []).filter((t) => t.id !== activeTabId),
        blocks: (layout.blocks || []).filter((b) => b.tabId !== activeTabId)
      });
      onSelectTab("identity");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-xl border border-[#C6A568]/25 bg-[#101522]/75 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-[#C6A568] flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Quản lý Thanh Tab:
        </span>

        {editingLabel ? (
          <div className="flex items-center gap-1">
            <input
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              className="rounded-lg border border-[#C6A568] bg-[#1D2636] px-2 py-0.5 text-xs text-[#E9DFC9] w-40"
              placeholder="Tên tab mới..."
            />
            <button
              type="button"
              onClick={handleRenameCurrentTab}
              className="px-2 py-0.5 rounded bg-[#C6A568] text-[#101522] font-bold cursor-pointer"
            >
              Lưu tên
            </button>
            <button
              type="button"
              onClick={() => setEditingLabel(false)}
              className="px-1.5 py-0.5 text-[#AEB7C4] cursor-pointer"
            >
              Hủy
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTempLabel(activeTabLabel);
              setEditingLabel(true);
            }}
            className="px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 hover:border-[#C6A568] text-[#E9DFC9] text-[11px] cursor-pointer"
          >
            ✎ Đổi tên tab “{activeTabLabel}”
          </button>
        )}

        {activeTabId !== "identity" && activeTabId !== "overview" && (
          <button
            type="button"
            onClick={handleRemoveCurrentTab}
            className="px-2 py-0.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-[11px] inline-flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> {isBuiltIn ? "Ẩn tab này" : "Xóa tab này"}
          </button>
        )}

        {hiddenBuiltIns.length > 0 && (
          <button
            type="button"
            onClick={() => onChangeLayout({ ...layout, hiddenBuiltInTabs: [] })}
            className="px-2 py-0.5 rounded-lg border border-amber-500/35 bg-amber-500/10 text-amber-200 text-[11px] cursor-pointer"
          >
            Khôi phục {hiddenBuiltIns.length} tab đã ẩn
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {showAddTab ? (
          <div className="flex items-center gap-1">
            <input
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTab();
                }
              }}
              placeholder="Nhập tên Tab mới (VD: Pháp bảo, Huyết mạch)..."
              className="rounded-lg border border-[#C6A568] bg-[#1D2636] px-2.5 py-1 text-xs text-[#E9DFC9] w-52"
            />
            <button
              type="button"
              onClick={handleAddCustomTab}
              className="px-2.5 py-1 rounded-lg bg-[#C6A568] text-[#101522] font-bold cursor-pointer"
            >
              Tạo Tab
            </button>
            <button
              type="button"
              onClick={() => setShowAddTab(false)}
              className="px-1.5 py-1 text-[#AEB7C4] cursor-pointer"
            >
              Đóng
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddTab(true)}
            className="px-2.5 py-1 rounded-lg bg-[#C6A568]/20 border border-[#C6A568]/50 text-[#C6A568] hover:bg-[#C6A568] hover:text-[#101522] font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Tab Tùy ý
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * LEVEL 2 & 3: Freeform Info Block & Field CRUD Editor inside ANY Tab.
 * Replaces rigid hardcoded 6-8 box forms with 100% customizable blocks & individual fields!
 */
export function FreeformTabBlocksEditor({
  workspaceId,
  tabId,
  tabTitle,
  layout,
  onChangeLayout,
  entityOptions = []
}: {
  workspaceId: string;
  tabId: string;
  tabTitle: string;
  layout: EntityProfileLayoutConfig;
  onChangeLayout: (next: EntityProfileLayoutConfig) => void;
  entityOptions?: Array<{ id: string; title: string; kind?: string }>;
}) {
  const allBlocks = layout.blocks || [];
  const tabBlocks = allBlocks
    .filter((b) => b.tabId === tabId)
    .sort((a, b) => a.order - b.order);

  const suggestions = TAB_QUICK_SUGGESTIONS[tabId] || TAB_QUICK_SUGGESTIONS.default;

  function updateBlocks(updater: (prev: CustomProfileBlock[]) => CustomProfileBlock[]) {
    onChangeLayout({
      ...layout,
      blocks: updater([...allBlocks])
    });
  }

  function addBlock(customTitle?: string, initialField?: Partial<CustomProfileFieldItem>) {
    const newBlk: CustomProfileBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tabId,
      title: customTitle || `${tabTitle} — Nhóm thông tin #${tabBlocks.length + 1}`,
      order: tabBlocks.length + 1,
      accessLevel: "public",
      fields: initialField
        ? [createFieldItem(initialField.label || "Trường thông tin mới", initialField.kind || "text", initialField.pinToInfobox)]
        : []
    };
    updateBlocks((prev) => [...prev, newBlk]);
  }

  function createFieldItem(
    label: string,
    kind: FreeformFieldKind = "text",
    pinToInfobox = false
  ): CustomProfileFieldItem {
    return {
      id: `fld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      kind,
      value: "",
      numberValue: kind === "number" || kind === "progress_bar" ? 50 : null,
      maxValue: kind === "progress_bar" ? 100 : null,
      unit: "",
      barColor: "#C6A568",
      tags: [],
      kvPairs: kind === "key_value_group" ? [{ key: "", val: "" }] : [],
      tableHeaders: kind === "table" ? ["Cột 1", "Cột 2"] : [],
      tableRows: kind === "table" ? [["", ""]] : [],
      entityRefs: [],
      pinToInfobox,
      displayPolicy: "show_when_not_empty",
      accessLevel: "public"
    };
  }

  function addFieldToBlock(
    blockId: string,
    label = "Thông tin mới",
    kind: FreeformFieldKind = "text",
    pin = false
  ) {
    updateBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, fields: [...b.fields, createFieldItem(label, kind, pin)] }
          : b
      )
    );
  }

  function quickAddChip(chip: { label: string; kind: FreeformFieldKind; pin?: boolean }) {
    if (tabBlocks.length === 0) {
      addBlock(tabTitle, { label: chip.label, kind: chip.kind, pinToInfobox: chip.pin });
    } else {
      const targetBlock = tabBlocks[tabBlocks.length - 1];
      addFieldToBlock(targetBlock.id, chip.label, chip.kind, Boolean(chip.pin));
    }
  }

  function updateField(
    blockId: string,
    fieldId: string,
    patch: Partial<CustomProfileFieldItem>
  ) {
    updateBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              fields: b.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f))
            }
          : b
      )
    );
  }

  function moveField(blockId: string, idx: number, dir: -1 | 1) {
    updateBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== blockId) return b;
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= b.fields.length) return b;
        const copy = [...b.fields];
        [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
        return { ...b, fields: copy };
      })
    );
  }

  function removeField(blockId: string, fieldId: string) {
    updateBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId ? { ...b, fields: b.fields.filter((f) => f.id !== fieldId) } : b
      )
    );
  }

  function removeBlock(blockId: string) {
    updateBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:border-[#C6A568] focus:outline-none";

  return (
    <div className="space-y-3 pt-2">
      {/* Header + 1-Touch Quick Suggestion Chips */}
      <div className="rounded-xl border border-[#C6A568]/30 bg-[#101522]/75 p-3 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[#C6A568] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Trình CRUD Thông tin Tự do — {tabTitle}
            </div>
            <p className="text-[11px] text-[#AEB7C4]">
              Tự do thêm/sửa/xóa từng trường thông tin lẻ hoặc nhóm thông tin. Mục bỏ trống sẽ tự động ẩn trên thẻ chi tiết.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                quickAddChip({ label: "Trường thông tin mới", kind: "text", pin: false })
              }
              className="px-2.5 py-1.5 rounded-lg bg-[#C6A568] text-[#101522] font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Trường Lẻ
            </button>
            <button
              type="button"
              onClick={() => addBlock()}
              className="px-2.5 py-1.5 rounded-lg border border-[#C6A568]/50 bg-[#C6A568]/15 text-[#E9DFC9] font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C6A568]" /> Tạo Khối / Nhóm Mới
            </button>
          </div>
        </div>

        {/* 1-Touch Quick-Add Chips (Zero rigid 6-box blocks!) */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
          <span className="text-[10px] font-mono uppercase text-[#AEB7C4] mr-1">
            Chèn nhanh 1 chạm:
          </span>
          {suggestions.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => quickAddChip(chip)}
              className="px-2 py-0.5 rounded-md border border-white/10 bg-[#1D2636]/90 hover:border-[#C6A568] text-[11px] text-[#E9DFC9] cursor-pointer transition"
            >
              + {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blocks List */}
      {tabBlocks.map((blk) => (
        <div
          key={blk.id}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-3.5 space-y-3"
        >
          {/* Block Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-2">
            <input
              value={blk.title}
              onChange={(e) =>
                updateBlocks((prev) =>
                  prev.map((b) => (b.id === blk.id ? { ...b, title: e.target.value } : b))
                )
              }
              placeholder="Tiêu đề nhóm thông tin (có thể xóa chữ nếu không cần tiêu đề nhóm)..."
              className="flex-1 min-w-[180px] bg-transparent font-display font-bold text-sm text-[#C6A568] focus:outline-none border-b border-transparent focus:border-[#C6A568]"
            />
            <div className="flex items-center gap-1.5 text-xs">
              <select
                value={blk.accessLevel || "public"}
                onChange={(e) =>
                  updateBlocks((prev) =>
                    prev.map((b) =>
                      b.id === blk.id
                        ? { ...b, accessLevel: e.target.value as ContentAccessLevel }
                        : b
                    )
                  )
                }
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-[11px]"
              >
                <option value="public">Công khai</option>
                <option value="spoiler">Che Spoiler</option>
                <option value="private_draft">Riêng tư (Editor)</option>
                <option value="admin_only">Chỉ Admin</option>
              </select>
              <button
                type="button"
                onClick={() => addFieldToBlock(blk.id, "Trường mới", "text")}
                className="px-2.5 py-1 rounded-lg bg-[#C6A568]/20 border border-[#C6A568]/45 text-[#C6A568] font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Thêm trường
              </button>
              <button
                type="button"
                onClick={() => removeBlock(blk.id)}
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                title="Xóa toàn bộ nhóm này"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Individual Fields CRUD inside Block */}
          {blk.fields.length === 0 ? (
            <div className="text-center py-3 text-[11px] text-[#AEB7C4]">
              Nhóm này chưa có trường nào. Bấm <strong>+ Thêm trường</strong> hoặc chọn một <strong>Chip gợi ý</strong> phía trên.
            </div>
          ) : (
            <div className="space-y-2.5">
              {blk.fields.map((fld, fIdx) => (
                <div
                  key={fld.id}
                  className="rounded-xl border border-white/10 bg-[#101522]/70 p-2.5 space-y-2"
                >
                  {/* Field Metadata Row: Editable Label + Type Selector + Pin to Infobox + Move + Delete */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <input
                      value={fld.label}
                      onChange={(e) => updateField(blk.id, fld.id, { label: e.target.value })}
                      placeholder="Tên trường (VD: Chiều cao, Đạo tâm, Pháp bảo)..."
                      className="flex-1 min-w-[140px] rounded-lg border border-[var(--border-subtle)] bg-[#1D2636] px-2.5 py-1 text-xs font-semibold text-[#E9DFC9]"
                    />
                    <select
                      value={fld.kind}
                      onChange={(e) =>
                        updateField(blk.id, fld.id, { kind: e.target.value as FreeformFieldKind })
                      }
                      className="rounded-lg border border-[var(--border-subtle)] bg-[#1D2636] px-2 py-1 text-[11px] text-[#C6A568]"
                    >
                      {Object.entries(FIELD_KIND_LABELS).map(([k, lbl]) => (
                        <option key={k} value={k}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(blk.id, fld.id, { pinToInfobox: !fld.pinToInfobox })
                      }
                      title="Ghim dòng này lên Thanh Thông tin nhanh (Infobox) bên phải hồ sơ"
                      className={`px-2 py-1 rounded-lg border text-[10px] inline-flex items-center gap-1 cursor-pointer ${
                        fld.pinToInfobox
                          ? "border-[#C6A568] bg-[#C6A568]/25 text-[#E9DFC9] font-bold"
                          : "border-white/10 text-[#AEB7C4]"
                      }`}
                    >
                      <Pin className="w-3 h-3" /> Infobox
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(blk.id, fIdx, -1)}
                      disabled={fIdx === 0}
                      className="p-1 rounded border border-white/10 disabled:opacity-30 cursor-pointer"
                      title="Chuyển lên"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveField(blk.id, fIdx, 1)}
                      disabled={fIdx === blk.fields.length - 1}
                      className="p-1 rounded border border-white/10 disabled:opacity-30 cursor-pointer"
                      title="Chuyển xuống"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(blk.id, fld.id)}
                      className="p-1 rounded border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      title="Xóa riêng trường này"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Field Value Input by Kind */}
                  {fld.kind === "text" && (
                    <input
                      value={fld.value}
                      onChange={(e) => updateField(blk.id, fld.id, { value: e.target.value })}
                      placeholder={`Nhập nội dung cho "${fld.label}"...`}
                      className={inputCls}
                    />
                  )}

                  {(fld.kind === "markdown" || fld.kind === "callout_secret") && (
                    <div className="space-y-1.5">
                      {fld.kind === "callout_secret" && (
                        <div className="flex items-center gap-2">
                          <select
                            value={fld.accessLevel || "spoiler"}
                            onChange={(e) =>
                              updateField(blk.id, fld.id, {
                                accessLevel: e.target.value as ContentAccessLevel
                              })
                            }
                            className="rounded border border-purple-400/40 bg-purple-950/40 px-2 py-1 text-[11px] text-purple-200"
                          >
                            <option value="spoiler">Che mờ Spoiler (Nhấn để mở)</option>
                            <option value="private_draft">Bí mật Nội bộ (Chỉ Editor/Admin)</option>
                            <option value="admin_only">Tuyệt mật (Chỉ Admin)</option>
                            <option value="public">Ghi chú Công khai</option>
                          </select>
                          <input
                            value={fld.spoilerLabel || ""}
                            onChange={(e) =>
                              updateField(blk.id, fld.id, { spoilerLabel: e.target.value })
                            }
                            placeholder="Cảnh báo Spoiler (tùy chọn)..."
                            className={inputCls}
                          />
                        </div>
                      )}
                      <textarea
                        rows={3}
                        value={fld.value}
                        onChange={(e) => updateField(blk.id, fld.id, { value: e.target.value })}
                        placeholder={`Nhập mô tả chi tiết cho "${fld.label}" (hỗ trợ Markdown)...`}
                        className={inputCls}
                      />
                    </div>
                  )}

                  {fld.kind === "number" && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={fld.numberValue ?? ""}
                        onChange={(e) =>
                          updateField(blk.id, fld.id, {
                            numberValue: e.target.value === "" ? null : Number(e.target.value)
                          })
                        }
                        placeholder="Giá trị số..."
                        className={inputCls}
                      />
                      <input
                        value={fld.unit || ""}
                        onChange={(e) => updateField(blk.id, fld.id, { unit: e.target.value })}
                        placeholder="Đơn vị (VD: cm, tuổi, năm, điểm)..."
                        className={inputCls}
                      />
                    </div>
                  )}

                  {fld.kind === "progress_bar" && (
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <input
                        type="number"
                        value={fld.numberValue ?? 50}
                        onChange={(e) =>
                          updateField(blk.id, fld.id, { numberValue: Number(e.target.value) })
                        }
                        placeholder="Giá trị hiện tại"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        value={fld.maxValue ?? 100}
                        onChange={(e) =>
                          updateField(blk.id, fld.id, { maxValue: Number(e.target.value) || 100 })
                        }
                        placeholder="Tối đa (VD: 100)"
                        className={inputCls}
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={fld.barColor || "#C6A568"}
                          onChange={(e) => updateField(blk.id, fld.id, { barColor: e.target.value })}
                          className="h-8 w-10 rounded cursor-pointer bg-transparent"
                        />
                        <input
                          value={fld.unit || "%"}
                          onChange={(e) => updateField(blk.id, fld.id, { unit: e.target.value })}
                          placeholder="Đơn vị"
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {fld.kind === "tag_list" && (
                    <input
                      value={(fld.tags || []).join(", ")}
                      onChange={(e) =>
                        updateField(blk.id, fld.id, {
                          tags: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        })
                      }
                      placeholder="Nhập các thẻ/thuộc tính cách nhau bằng dấu phẩy..."
                      className={inputCls}
                    />
                  )}

                  {fld.kind === "key_value_group" && (
                    <div className="space-y-1.5">
                      {(fld.kvPairs || []).map((pair, pIdx) => (
                        <div key={pIdx} className="flex items-center gap-1.5">
                          <input
                            value={pair.key}
                            onChange={(e) => {
                              const next = [...(fld.kvPairs || [])];
                              next[pIdx] = { ...next[pIdx], key: e.target.value };
                              updateField(blk.id, fld.id, { kvPairs: next });
                            }}
                            placeholder="Thuộc tính..."
                            className={inputCls}
                          />
                          <input
                            value={pair.val}
                            onChange={(e) => {
                              const next = [...(fld.kvPairs || [])];
                              next[pIdx] = { ...next[pIdx], val: e.target.value };
                              updateField(blk.id, fld.id, { kvPairs: next });
                            }}
                            placeholder="Giá trị..."
                            className={inputCls}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              updateField(blk.id, fld.id, {
                                kvPairs: (fld.kvPairs || []).filter((_, i) => i !== pIdx)
                              })
                            }
                            className="p-1 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() =>
                          updateField(blk.id, fld.id, {
                            kvPairs: [...(fld.kvPairs || []), { key: "", val: "" }]
                          })
                        }
                        className="text-[11px] text-[#C6A568] hover:underline cursor-pointer"
                      >
                        + Thêm dòng thuộc tính
                      </button>
                    </div>
                  )}

                  {fld.kind === "table" && (
                    <div className="space-y-1.5 overflow-x-auto">
                      <div className="flex gap-1.5">
                        {(fld.tableHeaders || ["Cột 1", "Cột 2"]).map((h, cIdx) => (
                          <input
                            key={cIdx}
                            value={h}
                            onChange={(e) => {
                              const next = [...(fld.tableHeaders || ["Cột 1", "Cột 2"])];
                              next[cIdx] = e.target.value;
                              updateField(blk.id, fld.id, { tableHeaders: next });
                            }}
                            className={`${inputCls} font-bold text-[#C6A568]`}
                          />
                        ))}
                      </div>
                      {(fld.tableRows || []).map((row, rIdx) => (
                        <div key={rIdx} className="flex items-center gap-1.5">
                          {row.map((cell, cIdx) => (
                            <input
                              key={cIdx}
                              value={cell}
                              onChange={(e) => {
                                const next = (fld.tableRows || []).map((r) => [...r]);
                                next[rIdx][cIdx] = e.target.value;
                                updateField(blk.id, fld.id, { tableRows: next });
                              }}
                              className={inputCls}
                            />
                          ))}
                          <button
                            type="button"
                            onClick={() =>
                              updateField(blk.id, fld.id, {
                                tableRows: (fld.tableRows || []).filter((_, i) => i !== rIdx)
                              })
                            }
                            className="p-1 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const cols = (fld.tableHeaders || ["Cột 1", "Cột 2"]).length;
                          updateField(blk.id, fld.id, {
                            tableRows: [...(fld.tableRows || []), Array(cols).fill("")]
                          });
                        }}
                        className="text-[11px] text-[#C6A568] hover:underline cursor-pointer"
                      >
                        + Thêm hàng bảng
                      </button>
                    </div>
                  )}

                  {fld.kind === "image_card" && (
                    <div className="space-y-2">
                      <DirectImageUploadField
                        workspaceId={workspaceId}
                        label={`Tải ảnh cho "${fld.label}"`}
                        value={fld.imageUrl || ""}
                        onChange={(url) => updateField(blk.id, fld.id, { imageUrl: url })}
                        preset="free"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={fld.imageCaption || ""}
                          onChange={(e) =>
                            updateField(blk.id, fld.id, { imageCaption: e.target.value })
                          }
                          placeholder="Chú thích ảnh..."
                          className={inputCls}
                        />
                        <input
                          value={fld.imageSource || ""}
                          onChange={(e) =>
                            updateField(blk.id, fld.id, { imageSource: e.target.value })
                          }
                          placeholder="Tác giả / Nguồn ảnh..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  )}

                  {fld.kind === "entity_links" && (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1.5">
                        {(fld.entityRefs || []).map((ref) => (
                          <span
                            key={ref.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#C6A568]/20 border border-[#C6A568]/40 text-xs text-[#E9DFC9]"
                          >
                            {ref.title} ({ref.id})
                            <button
                              type="button"
                              onClick={() =>
                                updateField(blk.id, fld.id, {
                                  entityRefs: (fld.entityRefs || []).filter((x) => x.id !== ref.id)
                                })
                              }
                              className="text-rose-300 ml-1 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      {entityOptions.length > 0 && (
                        <select
                          value=""
                          onChange={(e) => {
                            const found = entityOptions.find((o) => o.id === e.target.value);
                            if (!found) return;
                            const cur = fld.entityRefs || [];
                            if (cur.some((x) => x.id === found.id)) return;
                            updateField(blk.id, fld.id, { entityRefs: [...cur, found] });
                          }}
                          className={inputCls}
                        >
                          <option value="">+ Chọn hồ sơ thực thể để liên kết...</option>
                          {entityOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.id} — {o.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Detail Profile Renderer for Freeform Blocks & Fields in any Tab.
 * Automatically hides any empty field or empty block (Section 6).
 */
export function CustomProfileBlocksRenderer({
  tabId,
  layout,
  canEdit = false,
  onOpenImage,
  onOpenEntity
}: {
  tabId: string;
  layout?: EntityProfileLayoutConfig;
  canEdit?: boolean;
  onOpenImage?: (url: string, title?: string, caption?: string, source?: string) => void;
  onOpenEntity?: (id: string) => void;
}) {
  const [revealedSpoilers, setRevealedSpoilers] = useState<Record<string, boolean>>({});
  if (!layout?.blocks) return null;

  const blocks = layout.blocks
    .filter((b) => b.tabId === tabId)
    .filter((b) => {
      if ((b.accessLevel === "private_draft" || b.accessLevel === "admin_only") && !canEdit) {
        return false;
      }
      return b.fields.some((f) => isCustomFieldMeaningful(f, canEdit));
    })
    .sort((a, b) => a.order - b.order);

  if (blocks.length === 0) return null;

  return (
    <div className="space-y-4">
      {blocks.map((blk) => {
        const meaningfulFields = blk.fields.filter((f) => {
          if ((f.accessLevel === "private_draft" || f.accessLevel === "admin_only") && !canEdit) {
            return false;
          }
          return isCustomFieldMeaningful(f, canEdit);
        });
        if (meaningfulFields.length === 0) return null;

        return (
          <div
            key={blk.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/55 p-4 space-y-3 text-xs"
          >
            {isMeaningfulValue(blk.title) && (
              <h4 className="font-display text-sm sm:text-base font-bold text-[#C6A568] border-b border-[var(--border-subtle)] pb-1.5">
                {blk.title}
              </h4>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {meaningfulFields.map((fld) => {
                const isWide =
                  fld.kind === "markdown" ||
                  fld.kind === "table" ||
                  fld.kind === "image_card" ||
                  fld.kind === "callout_secret";

                if (fld.kind === "callout_secret" && fld.accessLevel === "spoiler" && !revealedSpoilers[fld.id]) {
                  return (
                    <div
                      key={fld.id}
                      className="sm:col-span-2 rounded-xl border border-purple-400/40 bg-purple-500/10 p-3 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-purple-200">✦ {fld.label} (Nội dung Spoiler)</div>
                        {isMeaningfulValue(fld.spoilerLabel) && (
                          <div className="text-[11px] text-purple-300/80">{fld.spoilerLabel}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setRevealedSpoilers((p) => ({ ...p, [fld.id]: true }))}
                        className="px-3 py-1.5 rounded-lg bg-purple-500/30 border border-purple-400/50 text-purple-100 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> Mở xem
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={fld.id}
                    className={`${
                      isWide ? "sm:col-span-2" : ""
                    } rounded-xl border border-[var(--border-subtle)]/70 bg-[var(--bg-surface)]/55 p-3 space-y-1.5`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#C6A568]">{fld.label}</span>
                      {fld.kind === "callout_secret" && fld.accessLevel === "spoiler" && (
                        <button
                          type="button"
                          onClick={() => setRevealedSpoilers((p) => ({ ...p, [fld.id]: false }))}
                          className="text-[10px] text-purple-300 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <EyeOff className="w-3 h-3" /> Ẩn lại
                        </button>
                      )}
                    </div>

                    {fld.kind === "text" && (
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {fld.value}
                      </div>
                    )}

                    {(fld.kind === "markdown" || fld.kind === "callout_secret") && (
                      <div className="codex-prose text-[var(--text-primary)]/90 whitespace-pre-wrap leading-relaxed">
                        {fld.value}
                      </div>
                    )}

                    {fld.kind === "number" && (
                      <div className="font-mono text-base font-bold text-[#E9DFC9]">
                        {fld.numberValue}
                        {fld.unit ? ` ${fld.unit}` : ""}
                      </div>
                    )}

                    {fld.kind === "progress_bar" && (
                      <div className="space-y-1">
                        <div className="flex justify-between font-mono text-xs">
                          <span>
                            {fld.numberValue} / {fld.maxValue || 100}
                            {fld.unit || ""}
                          </span>
                          <span>
                            {Math.min(
                              100,
                              Math.round(((fld.numberValue || 0) / Math.max(1, fld.maxValue || 100)) * 100)
                            )}
                            %
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(((fld.numberValue || 0) / Math.max(1, fld.maxValue || 100)) * 100)
                              )}%`,
                              backgroundColor: fld.barColor || "#C6A568"
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {fld.kind === "tag_list" && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {(fld.tags || [])
                          .filter((t) => isMeaningfulValue(t))
                          .map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-0.5 rounded-full bg-[#C6A568]/15 border border-[#C6A568]/35 text-xs text-[#E9DFC9]"
                            >
                              {t}
                            </span>
                          ))}
                      </div>
                    )}

                    {fld.kind === "key_value_group" && (
                      <div className="space-y-1 pt-0.5">
                        {(fld.kvPairs || [])
                          .filter((p) => isMeaningfulValue(p.key) && isMeaningfulValue(p.val))
                          .map((p, i) => (
                            <div
                              key={i}
                              className="flex justify-between gap-2 border-b border-white/5 pb-1"
                            >
                              <span className="text-[#AEB7C4]">{p.key}</span>
                              <span className="font-semibold text-[#E9DFC9] text-right">{p.val}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    {fld.kind === "table" && (
                      <div className="overflow-x-auto pt-1">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#C6A568]/30 text-[#C6A568]">
                              {(fld.tableHeaders || []).map((h, i) => (
                                <th key={i} className="py-1.5 px-2 font-semibold">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(fld.tableRows || [])
                              .filter((r) => r.some((c) => isMeaningfulValue(c)))
                              .map((row, rIdx) => (
                                <tr key={rIdx} className="border-b border-white/5">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="py-1.5 px-2 text-[#E9DFC9]">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {fld.kind === "image_card" && isMeaningfulValue(fld.imageUrl) && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onOpenImage?.(
                              fld.imageUrl!,
                              fld.label,
                              fld.imageCaption,
                              fld.imageSource
                            )
                          }
                          className="group relative rounded-xl overflow-hidden border border-[#C6A568]/30 bg-black/40 cursor-zoom-in block max-w-md"
                        >
                          <img
                            src={fld.imageUrl}
                            alt={fld.imageCaption || fld.label}
                            className="max-h-64 w-auto object-contain mx-auto group-hover:scale-[1.02] transition"
                            loading="lazy"
                          />
                          {(isMeaningfulValue(fld.imageCaption) ||
                            isMeaningfulValue(fld.imageSource)) && (
                            <div className="px-3 py-1.5 bg-[#101522]/90 text-left text-[11px] text-[#AEB7C4]">
                              {fld.imageCaption}
                              {isMeaningfulValue(fld.imageSource)
                                ? ` · Nguồn: ${fld.imageSource}`
                                : ""}
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {fld.kind === "entity_links" && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {(fld.entityRefs || []).map((ref) => (
                          <button
                            key={ref.id}
                            type="button"
                            onClick={() => onOpenEntity?.(ref.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#C6A568]/40 bg-[#C6A568]/15 text-xs text-[#E9DFC9] hover:bg-[#C6A568]/30 cursor-pointer"
                          >
                            <Link2 className="w-3 h-3 text-[#C6A568]" />
                            <span>{ref.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Collects all non-empty custom fields that were pinned to the Infobox (pinToInfobox === true)
 */
export function getPinnedInfoboxRows(
  layout?: EntityProfileLayoutConfig,
  canEdit = false
): Array<[string, string]> {
  if (!layout?.blocks) return [];
  const rows: Array<[string, string]> = [];
  for (const blk of layout.blocks) {
    if ((blk.accessLevel === "private_draft" || blk.accessLevel === "admin_only") && !canEdit) {
      continue;
    }
    for (const fld of blk.fields) {
      if (!fld.pinToInfobox) continue;
      if (!isCustomFieldMeaningful(fld, canEdit)) continue;
      if (fld.kind === "text" || fld.kind === "markdown") {
        rows.push([fld.label, fld.value]);
      } else if (fld.kind === "number") {
        rows.push([fld.label, `${fld.numberValue}${fld.unit ? ` ${fld.unit}` : ""}`]);
      } else if (fld.kind === "progress_bar") {
        rows.push([fld.label, `${fld.numberValue}/${fld.maxValue || 100}${fld.unit || ""}`]);
      } else if (fld.kind === "tag_list" && fld.tags) {
        rows.push([fld.label, fld.tags.join(", ")]);
      }
    }
  }
  return rows;
}
