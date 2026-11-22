"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Edit3,
  FolderPlus,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import type { Category, CategoryTreeNode } from "@/types/codex";
import {
  collectAllParentIds,
  collectAutoExpandedIds
} from "@/lib/category-tree";
import { DynamicIcon } from "./DynamicIcon";
import { IconSigilPicker } from "./IconSigilPicker";

interface SidebarTreeProps {
  workspaceId: string;
  categories: Category[];
  tree: CategoryTreeNode[];
  selectedCategoryId: string | null;
  canEdit: boolean;
  totalVisibleEntries: number;
  onSelectCategory: (categoryId: string | null) => void;
  onRefresh: () => Promise<void>;
  onFilterChange: (q: string) => void;
  filterQuery: string;
}

export function SidebarTree({
  workspaceId,
  categories,
  tree,
  selectedCategoryId,
  canEdit,
  totalVisibleEntries,
  onSelectCategory,
  onRefresh,
  onFilterChange,
  filterQuery
}: SidebarTreeProps) {
  // Default collapsed child branches
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [icon, setIcon] = useState("FolderTree");
  const [sigil, setSigil] = useState("❖");
  const [color, setColor] = useState("#D4AF37");
  const [sortOrder, setSortOrder] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Safe delete options
  const [moveEntriesTo, setMoveEntriesTo] = useState<string>("");
  const [childStrategy, setChildStrategy] = useState<
    "reparent_to_parent" | "cascade_soft_delete"
  >("reparent_to_parent");

  // Auto-expand matching branches when searching
  useEffect(() => {
    if (filterQuery.trim()) {
      const autoIds = collectAutoExpandedIds(tree);
      setExpandedIds(new Set(autoIds));
    }
  }, [filterQuery, tree]);

  const allParentIds = useMemo(() => collectAllParentIds(tree), [tree]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openCreate(defaultParentId: string | null = null) {
    setModalMode("create");
    setEditingCat(null);
    setName("");
    setDescription("");
    setParentId(defaultParentId || "");
    setIcon("FolderTree");
    setSigil("❖");
    setColor("#D4AF37");
    setSortOrder(0);
    setErrorMsg("");
  }

  function openEdit(cat: Category) {
    setModalMode("edit");
    setEditingCat(cat);
    setName(cat.name);
    setDescription(cat.description);
    setParentId(cat.parentId || "");
    setIcon(cat.icon);
    setSigil(cat.sigil || "❖");
    setColor(cat.color || "#D4AF37");
    setSortOrder(cat.sortOrder);
    setErrorMsg("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên danh mục.");
      return;
    }
    setSaving(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/categories", {
        method: modalMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          modalMode === "create"
            ? {
                workspaceId,
                parentId: parentId || null,
                name,
                description,
                icon,
                sigil,
                color,
                sortOrder
              }
            : {
                id: editingCat?.id,
                parentId: parentId || null,
                name,
                description,
                icon,
                sigil,
                color,
                sortOrder
              }
        )
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Không thể lưu danh mục.");
      } else {
        setModalMode(null);
        await onRefresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await fetch("/api/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: deleteTarget.id,
          moveEntriesToCategoryId: moveEntriesTo || null,
          childStrategy
        })
      });
      if (selectedCategoryId === deleteTarget.id) {
        onSelectCategory(null);
      }
      setDeleteTarget(null);
      await onRefresh();
    } finally {
      setSaving(false);
    }
  }

  function renderNode(node: CategoryTreeNode) {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedCategoryId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition cursor-pointer ${
            isSelected
              ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)]"
              : "text-[var(--text-secondary)] hover:bg-white/5 border border-transparent"
          }`}
          style={{ paddingLeft: `${node.depth * 14 + 8}px` }}
          onClick={() => onSelectCategory(node.id)}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
            className={`w-4 h-4 flex items-center justify-center shrink-0 rounded hover:bg-white/10 ${
              hasChildren ? "opacity-80" : "opacity-0 pointer-events-none"
            }`}
            aria-label="Mở hoặc thu gọn nhánh"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>

          <span
            className="text-sm shrink-0"
            style={{ color: node.color || "var(--accent)" }}
          >
            {node.sigil || "❖"}
          </span>

          <span className="truncate flex-1 font-medium">{node.name}</span>

          <span
            className="font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-white/5 text-[var(--text-muted)] shrink-0"
            title={`Tổng ${node.totalUniqueCount} hồ sơ duy nhất (không đếm trùng)`}
          >
            {node.totalUniqueCount}
          </span>

          {canEdit && (
            <div
              className="hidden group-hover:flex items-center gap-0.5 ml-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Thêm danh mục con"
                onClick={() => openCreate(node.id)}
                className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--accent)]"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                title="Chỉnh sửa danh mục"
                onClick={() => openEdit(node)}
                className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                type="button"
                title="Xóa an toàn danh mục"
                onClick={() => {
                  setDeleteTarget(node);
                  setMoveEntriesTo(node.parentId || "");
                  setChildStrategy("reparent_to_parent");
                }}
                className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--danger)]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <span>✦</span> Danh mục Tri thức
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Mở rộng tất cả nhánh"
            onClick={() => setExpandedIds(new Set(allParentIds))}
            className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Thu gọn tất cả nhánh"
            onClick={() => setExpandedIds(new Set())}
            className="p-1 rounded hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
          </button>
          {canEdit && (
            <button
              type="button"
              title="Thêm danh mục gốc mới"
              onClick={() => openCreate(null)}
              className="p-1 rounded bg-[var(--accent-soft)] text-[var(--accent)] hover:brightness-110 cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Accent-insensitive quick filter */}
      <div className="relative mb-2.5">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={filterQuery}
          onChange={(e) => onFilterChange(e.target.value)}
          placeholder="Lọc danh mục (không cần dấu)..."
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 pl-8 pr-7 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
        />
        {filterQuery && (
          <button
            type="button"
            onClick={() => onFilterChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* All entries root button */}
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-sm mb-1.5 transition cursor-pointer ${
          selectedCategoryId === null
            ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--border-strong)] font-medium"
            : "text-[var(--text-secondary)] hover:bg-white/5 border border-transparent"
        }`}
      >
        <span className="flex items-center gap-2">
          <DynamicIcon name="Library" className="w-4 h-4" />
          <span>Tất cả hồ sơ</span>
        </span>
        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-white/5">
          {totalVisibleEntries}
        </span>
      </button>

      {/* Tree nodes */}
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1">
        {tree.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] text-center py-6">
            Không tìm thấy danh mục phù hợp.
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      {/* Create / Edit Category Modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-[var(--accent)]">
                {modalMode === "create"
                  ? "✦ Thêm Danh mục mới"
                  : "✦ Chỉnh sửa Danh mục"}
              </h3>
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ví dụ: Vương quốc Phương Bắc"
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Danh mục cha (chống vòng lặp)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                >
                  <option value="">— Danh mục gốc (Cấp 1) —</option>
                  {categories
                    .filter((c) => c.id !== editingCat?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.sigil} {c.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả phạm vi tri thức của danh mục..."
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <IconSigilPicker
              icon={icon}
              sigil={sigil}
              color={color}
              onChange={(next) => {
                setIcon(next.icon);
                setSigil(next.sigil);
                setColor(next.color);
              }}
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-sm hover:bg-white/5 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-sm hover:brightness-110 disabled:opacity-60 cursor-pointer"
              >
                {saving ? "Đang lưu..." : "Lưu danh mục"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Safe Delete Category Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/40 bg-[var(--bg-elevated)] p-5 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-semibold text-rose-300">
              Xóa an toàn danh mục “{deleteTarget.name}”
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Danh mục sẽ được chuyển vào Thùng rác (có thể khôi phục sau). Chọn cách xử lý hồ sơ và nhánh con:
            </p>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Chuyển các hồ sơ đang thuộc danh mục này sang:
              </label>
              <select
                value={moveEntriesTo}
                onChange={(e) => setMoveEntriesTo(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
              >
                <option value="">— Không phân loại (Để trống) —</option>
                {categories
                  .filter((c) => c.id !== deleteTarget.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.sigil} {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">
                Xử lý các danh mục con (nếu có):
              </label>
              <select
                value={childStrategy}
                onChange={(e) =>
                  setChildStrategy(
                    e.target.value as "reparent_to_parent" | "cascade_soft_delete"
                  )
                }
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
              >
                <option value="reparent_to_parent">
                  Đẩy nhánh con lên danh mục cha (Giữ nguyên nhánh con)
                </option>
                <option value="cascade_soft_delete">
                  Xóa tạm luôn toàn bộ nhánh con
                </option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[var(--border-subtle)] text-sm cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white font-medium text-sm hover:bg-rose-600 cursor-pointer"
              >
                {saving ? "Đang xử lý..." : "Xác nhận xóa tạm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
