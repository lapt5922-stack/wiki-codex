"use client";

import React, { useEffect, useState } from "react";
import {
  Columns2,
  Download,
  Edit3,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  X
} from "lucide-react";
import type {
  Category,
  Entry,
  EntryCardProjection,
  SessionUser,
  UserRole,
  Workspace
} from "@/types/codex";
import { IconSigilPicker } from "./IconSigilPicker";

/* ==================== 1. SPLIT COMPARE MODAL ==================== */

export function SplitCompareModal({
  idA,
  idB,
  onClose
}: {
  idA: string;
  idB: string;
  onClose: () => void;
}) {
  const [entryA, setEntryA] = useState<Entry | null>(null);
  const [entryB, setEntryB] = useState<Entry | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/entries/${idA}`).then((r) => r.json()),
      fetch(`/api/entries/${idB}`).then((r) => r.json())
    ]).then(([a, b]) => {
      setEntryA(a.entry || null);
      setEntryB(b.entry || null);
    });
  }, [idA, idB]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="font-display text-xl text-[var(--accent)] flex items-center gap-2">
            <Columns2 className="w-5 h-5" />
            So sánh Song song 2 Hồ sơ Codex
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[entryA, entryB].map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/70 p-4 space-y-3"
            >
              {!item ? (
                <div className="text-xs text-[var(--text-muted)]">Đang tải hồ sơ...</div>
              ) : (
                <>
                  <div>
                    <div className="text-xs font-mono text-[var(--accent)]">
                      {item.sigil} · {item.status} · {item.tags.join(", ")}
                    </div>
                    <h3 className="font-display text-xl font-bold mt-1">{item.title}</h3>
                    {item.subtitle && (
                      <p className="text-xs italic text-[var(--text-muted)]">{item.subtitle}</p>
                    )}
                  </div>
                  <p className="text-xs bg-[var(--accent-soft)] p-2.5 rounded-lg">
                    {item.summary}
                  </p>
                  <div className="space-y-1 text-xs border-t border-[var(--border-subtle)] pt-2">
                    {Object.entries(item.customFields || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-[var(--text-muted)] font-mono">{k}:</span>
                        <span className="text-right">
                          {typeof v === "object" ? JSON.stringify(v).slice(0, 60) : String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap border-t border-[var(--border-subtle)] pt-2 max-h-64 overflow-y-auto">
                    {item.contentMarkdown}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==================== 2. IMPORT / EXPORT MODAL ==================== */

export function ImportExportModal({
  workspaceId,
  canEdit,
  onClose,
  onImported
}: {
  workspaceId: string;
  canEdit: boolean;
  onClose: () => void;
  onImported: () => Promise<void>;
}) {
  const [format, setFormat] = useState<"json" | "markdown">("json");
  const [content, setContent] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setBusy(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, format, content })
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(`Lỗi: ${data.error}`);
      } else {
        setStatusMsg(`Đã nhập thành công ${data.importedCount} hồ sơ!`);
        setContent("");
        await onImported();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="font-display text-xl text-[var(--accent)]">
            ✦ Xuất / Nhập Dữ liệu (JSON · Markdown · HTML · ZIP)
          </h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase">
            Xuất trọn bộ Không gian hiện tại
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                ["json", "Tệp JSON"],
                ["markdown", "Markdown (.md)"],
                ["html", "Trang HTML"],
                ["zip", "Gói ZIP"]
              ] as const
            ).map(([fmt, label]) => (
              <a
                key={fmt}
                href={`/api/export?workspaceId=${workspaceId}&format=${fmt}`}
                download
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-medium hover:brightness-110"
              >
                <Download className="w-3.5 h-3.5" />
                {label}
              </a>
            ))}
          </div>
        </div>

        {canEdit && (
          <form onSubmit={handleImport} className="space-y-3 border-t border-[var(--border-subtle)] pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Nhập dữ liệu mới
              </span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as "json" | "markdown")}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1 text-xs"
              >
                <option value="json">Định dạng JSON</option>
                <option value="markdown">Định dạng Markdown</option>
              </select>
            </div>

            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                format === "json"
                  ? 'Dán nội dung JSON backup hoặc mảng [{"title": "...", "contentMarkdown": "..."}]'
                  : "---\ntitle: Hồ sơ mới\n---\n\n# Nội dung bài viết..."
              }
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-xs font-mono"
            />

            {statusMsg && (
              <div className="text-xs text-[var(--accent)]">{statusMsg}</div>
            )}

            <button
              type="submit"
              disabled={busy || !content.trim()}
              className="w-full py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Đang nhập..." : "Thực hiện Nhập dữ liệu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* ==================== 3. TRASH VIEW (SOFT DELETE & RESTORE) ==================== */

export function TrashView({
  workspaceId,
  isAdmin,
  onRestored
}: {
  workspaceId: string;
  isAdmin: boolean;
  onRestored: () => Promise<void>;
}) {
  const [deletedEntries, setDeletedEntries] = useState<EntryCardProjection[]>([]);
  const [deletedCats, setDeletedCats] = useState<Category[]>([]);

  async function loadTrash() {
    const [eRes, cRes] = await Promise.all([
      fetch(`/api/entries?workspaceId=${workspaceId}&includeDeleted=true&limit=100`),
      fetch(`/api/categories?workspaceId=${workspaceId}&includeDeleted=true`)
    ]);
    const eData = await eRes.json();
    const cData = await cRes.json();
    setDeletedEntries(eData.items || []);
    setDeletedCats(cData.deleted || []);
  }

  useEffect(() => {
    loadTrash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function restoreEntryItem(id: string) {
    await fetch(`/api/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore" })
    });
    await loadTrash();
    await onRestored();
  }

  async function purgeEntryItem(id: string) {
    if (!confirm("Xóa vĩnh viễn hồ sơ này? Hành động không thể hoàn tác.")) return;
    await fetch(`/api/entries/${id}?permanent=true`, { method: "DELETE" });
    await loadTrash();
    await onRestored();
  }

  async function restoreCatItem(id: string) {
    await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "restore" })
    });
    await loadTrash();
    await onRestored();
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-5">
        <h2 className="font-display text-xl text-[var(--accent)] flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Thùng rác — Xóa tạm & Khôi phục
        </h2>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Khôi phục hồ sơ hoặc danh mục đã xóa tạm. Xóa vĩnh viễn chỉ dành cho Quản trị viên (Admin).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="codex-card rounded-2xl p-4 space-y-2.5">
          <h3 className="font-display text-base text-[var(--accent)]">
            Hồ sơ đã xóa tạm ({deletedEntries.length})
          </h3>
          {deletedEntries.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Thùng rác hồ sơ đang trống.</p>
          ) : (
            deletedEntries.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 text-xs"
              >
                <span className="truncate font-medium">
                  {e.sigil} {e.title}
                </span>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => restoreEntryItem(e.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Khôi phục
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => purgeEntryItem(e.id)}
                      className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 cursor-pointer"
                    >
                      Xóa vĩnh viễn
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="codex-card rounded-2xl p-4 space-y-2.5">
          <h3 className="font-display text-base text-[var(--accent)]">
            Danh mục đã xóa tạm ({deletedCats.length})
          </h3>
          {deletedCats.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">Thùng rác danh mục đang trống.</p>
          ) : (
            deletedCats.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 text-xs"
              >
                <span className="truncate font-medium">
                  {c.sigil} {c.name}
                </span>
                <button
                  type="button"
                  onClick={() => restoreCatItem(c.id)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Khôi phục
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== 4. WORKSPACE MANAGER MODAL (CRUD) ==================== */

export function WorkspaceManagerModal({
  workspaces,
  isAdmin,
  onClose,
  onSaved
}: {
  workspaces: Workspace[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved: (selectedId?: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Sparkles");
  const [sigil, setSigil] = useState("✦");
  const [accentColor, setAccentColor] = useState("#D4AF37");
  const [isPublic, setIsPublic] = useState(true);

  function loadEdit(w: Workspace) {
    setEditingId(w.id);
    setName(w.name);
    setDescription(w.description);
    setIcon(w.icon);
    setSigil(w.sigil);
    setAccentColor(w.accentColor);
    setIsPublic(w.isPublic);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch("/api/workspaces", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name,
        description,
        icon,
        sigil,
        accentColor,
        isPublic
      })
    });
    const data = await res.json();
    setEditingId(null);
    setName("");
    setDescription("");
    await onSaved(data.workspace?.id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa toàn bộ không gian tri thức này?")) return;
    await fetch(`/api/workspaces?id=${id}`, { method: "DELETE" });
    await onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
          <h2 className="font-display text-xl text-[var(--accent)]">
            ✦ Quản lý Không gian Tri thức (Workspaces CRUD)
          </h2>
          <button type="button" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 space-y-2">
            {workspaces.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">
                    <span style={{ color: w.accentColor }} className="mr-1.5">
                      {w.sigil}
                    </span>
                    {w.name}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    /public/{w.slug}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => loadEdit(w)}
                    className="p-1 text-[var(--accent)] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {isAdmin && workspaces.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id)}
                      className="p-1 text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="md:col-span-7 space-y-3">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên không gian tri thức *"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-sm"
            />
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả nội dung bộ bách khoa..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-2.5 text-xs"
            />
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Cho phép hiển thị trên Cổng Web Công khai (/public)
            </label>
            <IconSigilPicker
              icon={icon}
              sigil={sigil}
              color={accentColor}
              onChange={(n) => {
                setIcon(n.icon);
                setSigil(n.sigil);
                setAccentColor(n.color);
              }}
            />
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {editingId ? "Cập nhật Không gian" : "Tạo Không gian mới"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ==================== 5. AUTH & RBAC MODAL ==================== */

export function AuthModal({
  user,
  onClose,
  onAuthChanged
}: {
  user: SessionUser;
  onClose: () => void;
  onAuthChanged: (u: SessionUser) => Promise<void>;
}) {
  const [email, setEmail] = useState("admin@codex.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Đăng nhập thất bại.");
      else {
        await onAuthChanged(data.user);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  async function switchRole(role: UserRole) {
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_demo_role", role })
      });
      const data = await res.json();
      if (res.ok) {
        await onAuthChanged(data.user);
        onClose();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--accent)] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            Tài khoản & Phân quyền (RBAC)
          </h3>
          <button type="button" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 text-xs">
          <div>
            Đang đăng nhập: <strong>{user.name}</strong>
          </div>
          <div className="font-mono text-[var(--accent)]">
            Vai trò hiện tại: {user.role.toUpperCase()}
          </div>
        </div>

        {/* Quick RBAC Switcher */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
            Chuyển nhanh vai trò kiểm thử RBAC
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(
              [
                ["admin", "Admin", "Toàn quyền"],
                ["editor", "Biên tập", "Sửa & Xem nháp"],
                ["guest", "Khách", "Chỉ đọc công khai"]
              ] as const
            ).map(([r, title, sub]) => (
              <button
                key={r}
                type="button"
                disabled={busy}
                onClick={() => switchRole(r)}
                className={`rounded-xl border p-2.5 text-center transition cursor-pointer ${
                  user.role === r
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "border-[var(--border-subtle)] hover:border-[var(--accent)]"
                }`}
              >
                <div className="font-semibold">{title}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-2.5 border-t border-[var(--border-subtle)] pt-3">
          <div className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">
            Hoặc đăng nhập bằng tài khoản
          </div>
          {error && <div className="text-xs text-rose-400">{error}</div>}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 text-xs"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
          >
            Đăng nhập
          </button>
          <p className="text-[10px] font-mono text-[var(--text-muted)]">
            Demo: admin@codex.local / admin123 · editor@codex.local / editor123
          </p>
        </form>
      </div>
    </div>
  );
}
