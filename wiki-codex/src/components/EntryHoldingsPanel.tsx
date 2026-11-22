"use client";

import React, { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Crown,
  Edit3,
  ExternalLink,
  MapPin,
  Plus,
  Shield,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type {
  Entry,
  HoldingKind,
  HoldingStatus,
  HydratedHolding
} from "@/types/codex";
import type { LinkLookupItem } from "./MarkdownCodexRenderer";

const HOLDING_KIND_META: Record<
  HoldingKind,
  { label: string; group: string; badge: string }
> = {
  city: { label: "Đô thị / Thành phố", group: "location", badge: "❖ Đô thị" },
  territory: { label: "Lãnh thổ / Vùng đất", group: "location", badge: "✧ Lãnh thổ" },
  landmark: { label: "Địa danh / Kỳ quan", group: "location", badge: "◈ Địa danh" },
  fortress: { label: "Pháo đài / Tiền đồn", group: "location", badge: "⛨ Pháo đài" },
  headquarters: { label: "Trụ sở chính", group: "org", badge: "⚜ Trụ sở" },
  branch: { label: "Chi nhánh / Phân viện", group: "org", badge: "❖ Chi nhánh" },
  vassal: { label: "Chư hầu / Gia tộc trực thuộc", group: "vassal", badge: "ᛟ Chư hầu" },
  artifact: { label: "Bảo vật / Tài sản", group: "asset", badge: "❖ Bảo vật" },
  fleet: { label: "Hạm đội / Căn cứ", group: "asset", badge: "⚓ Hạm đội" }
};

const HOLDING_STATUS_META: Record<
  HoldingStatus,
  { label: string; cls: string }
> = {
  active: { label: "Đang sở hữu", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/35" },
  contested: { label: "Đang tranh chấp", cls: "bg-amber-500/15 text-amber-300 border-amber-400/35" },
  former: { label: "Từng sở hữu", cls: "bg-slate-500/20 text-slate-300 border-slate-400/35" },
  ruined: { label: "Đã sụp đổ / Phế tích", cls: "bg-rose-500/15 text-rose-300 border-rose-400/35" }
};

/* ============================================================================
   1. OWNERSHIP BREADCRUMB & OWNER BANNER (Shown at the top of any child entry)
   ============================================================================ */

interface OwnershipHeaderStripProps {
  entry: Entry;
  ownedBy: HydratedHolding[];
  ownershipChain: Array<{ id: string; title: string; sigil: string; roleLabel: string }>;
  allEntries: LinkLookupItem[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onMutated: () => Promise<void>;
}

export function OwnershipHeaderStrip({
  entry,
  ownedBy,
  ownershipChain,
  allEntries,
  canEdit,
  onOpenEntry,
  onMutated
}: OwnershipHeaderStripProps) {
  const [assigning, setAssigning] = useState(false);
  const [ownerId, setOwnerId] = useState("");
  const [roleLabel, setRoleLabel] = useState("Trực thuộc");
  const [holdingKind, setHoldingKind] = useState<HoldingKind>("city");
  const [busy, setBusy] = useState(false);

  async function handleAssignOwner(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: entry.workspaceId,
          ownerEntryId: ownerId,
          targetEntryId: entry.id,
          customName: entry.title,
          holdingKind,
          roleLabel: roleLabel.trim() || "Trực thuộc",
          status: "active",
          summary: entry.summary
        })
      });
      if (res.ok) {
        setAssigning(false);
        setOwnerId("");
        await onMutated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveOwner(holdingId: string) {
    setBusy(true);
    try {
      await fetch(`/api/holdings?id=${encodeURIComponent(holdingId)}`, { method: "DELETE" });
      await onMutated();
    } finally {
      setBusy(false);
    }
  }

  if (ownedBy.length === 0 && !canEdit) return null;

  return (
    <div className="codex-card rounded-2xl p-3.5 space-y-2.5 no-print">
      {/* Ownership Breadcrumb Trail */}
      {ownershipChain.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] mr-1">
            Phân cấp Sở hữu:
          </span>
          {ownershipChain.map((node) => (
            <React.Fragment key={node.id}>
              <button
                type="button"
                onClick={() => onOpenEntry(node.id)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-[var(--border-strong)] bg-[var(--accent-soft)] text-[var(--accent)] font-medium hover:brightness-110 cursor-pointer"
              >
                <span>{node.sigil}</span>
                <span>{node.title}</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </React.Fragment>
          ))}
          <span className="font-semibold text-[var(--text-primary)]">
            {entry.sigil} {entry.title}
          </span>
        </div>
      )}

      {/* Owner Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-[var(--accent)]">
            <Crown className="w-3.5 h-3.5" /> Chủ sở hữu / Đơn vị chủ quản:
          </span>
          {ownedBy.length === 0 ? (
            <span className="text-[11px] text-[var(--text-muted)] italic">
              Độc lập (chưa gắn thuộc vương quốc/tổ chức nào)
            </span>
          ) : (
            ownedBy.map((h) => {
              const st = HOLDING_STATUS_META[h.status];
              return (
                <div
                  key={h.id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/75 px-2.5 py-1"
                >
                  <button
                    type="button"
                    onClick={() => onOpenEntry(h.ownerEntryId)}
                    className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] cursor-pointer flex items-center gap-1"
                  >
                    <span>{h.ownerSigil}</span>
                    <span>{h.ownerTitle}</span>
                  </button>
                  <span className="text-[10px] text-[var(--text-muted)]">· {h.roleLabel}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${st.cls}`}>
                    {st.label}
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRemoveOwner(h.id)}
                      title="Gỡ liên kết chủ sở hữu"
                      className="text-rose-400 hover:text-rose-300 cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => setAssigning((v) => !v)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[var(--border-subtle)] text-[11px] text-[var(--accent)] hover:border-[var(--accent)] cursor-pointer shrink-0"
          >
            <Plus className="w-3 h-3" /> {assigning ? "Đóng" : "Gán Chủ sở hữu"}
          </button>
        )}
      </div>

      {assigning && canEdit && (
        <form
          onSubmit={handleAssignOwner}
          className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs"
        >
          <select
            required
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          >
            <option value="">— Chọn Vương quốc / Tổ chức / Chủ nhân —</option>
            {allEntries
              .filter((x) => x.id !== entry.id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.sigil} {x.title}
                </option>
              ))}
          </select>
          <select
            value={holdingKind}
            onChange={(e) => setHoldingKind(e.target.value as HoldingKind)}
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          >
            {Object.entries(HOLDING_KIND_META).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
            placeholder="Vai trò (VD: Thủ đô, Gia bảo...)"
            className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 px-3 cursor-pointer"
          >
            Lưu Chủ sở hữu
          </button>
        </form>
      )}
    </div>
  );
}

/* ============================================================================
   2. ENTRY HOLDINGS PANEL (Tab "Lãnh địa & Trực thuộc" — Full CRUD + Quick-Create)
   ============================================================================ */

interface EntryHoldingsPanelProps {
  entry: Entry;
  ownedHoldings: HydratedHolding[];
  allEntries: LinkLookupItem[];
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onMutated: () => Promise<void>;
}

export function EntryHoldingsPanel({
  entry,
  ownedHoldings,
  allEntries,
  canEdit,
  onOpenEntry,
  onMutated
}: EntryHoldingsPanelProps) {
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [addMode, setAddMode] = useState<"existing" | "quick_create">("existing");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [targetEntryId, setTargetEntryId] = useState("");
  const [customName, setCustomName] = useState("");
  const [holdingKind, setHoldingKind] = useState<HoldingKind>("city");
  const [roleLabel, setRoleLabel] = useState("Địa điểm trực thuộc");
  const [status, setStatus] = useState<HoldingStatus>("active");
  const [eraNote, setEraNote] = useState("");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    if (groupFilter === "all") return ownedHoldings;
    return ownedHoldings.filter((h) => HOLDING_KIND_META[h.holdingKind]?.group === groupFilter);
  }, [ownedHoldings, groupFilter]);

  function startEdit(h: HydratedHolding) {
    setEditingId(h.id);
    setTargetEntryId(h.targetEntryId || "");
    setCustomName(h.customName || h.targetTitle);
    setHoldingKind(h.holdingKind);
    setRoleLabel(h.roleLabel);
    setStatus(h.status);
    setEraNote(h.eraNote || "");
    setSummary(h.summary || "");
    setAddMode(h.targetEntryId ? "existing" : "quick_create");
  }

  function resetForm() {
    setEditingId(null);
    setTargetEntryId("");
    setCustomName("");
    setHoldingKind("city");
    setRoleLabel("Địa điểm trực thuộc");
    setStatus("active");
    setEraNote("");
    setSummary("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const selectedTarget = allEntries.find((x) => x.id === targetEntryId);
      const payload = {
        id: editingId || undefined,
        workspaceId: entry.workspaceId,
        ownerEntryId: entry.id,
        targetEntryId: addMode === "existing" ? targetEntryId || null : null,
        customName:
          addMode === "existing"
            ? customName.trim() || selectedTarget?.title || ""
            : customName.trim(),
        quickCreateTarget: !editingId && addMode === "quick_create",
        holdingKind,
        roleLabel: roleLabel.trim() || "Trực thuộc",
        status,
        eraNote: eraNote.trim(),
        summary: summary.trim()
      };
      const res = await fetch("/api/holdings", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        resetForm();
        await onMutated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/holdings?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await onMutated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header & Group Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Lãnh Địa, Địa Điểm & Tài Sản Thuộc Quyền ({ownedHoldings.length})
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Mọi địa điểm/tài sản gắn tại đây sẽ tự động hiển thị tên chủ sở hữu{" "}
            <strong className="text-[var(--text-primary)]">{entry.title}</strong> khi mở hồ sơ con.
          </p>
        </div>

        <div className="flex flex-wrap gap-1">
          {[
            { id: "all", label: `Tất cả (${ownedHoldings.length})` },
            { id: "location", label: "Đô thị & Địa điểm" },
            { id: "org", label: "Trụ sở & Chi nhánh" },
            { id: "vassal", label: "Chư hầu / Gia tộc" },
            { id: "asset", label: "Bảo vật & Hạm đội" }
          ].map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setGroupFilter(g.id)}
              className={`px-2.5 py-1 rounded-full border text-[11px] cursor-pointer ${
                groupFilter === g.id
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Holdings Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center text-xs text-[var(--text-muted)]">
          Chưa có địa điểm hoặc đơn vị trực thuộc nào trong nhóm này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((h) => {
            const kMeta = HOLDING_KIND_META[h.holdingKind] || HOLDING_KIND_META.territory;
            const sMeta = HOLDING_STATUS_META[h.status] || HOLDING_STATUS_META.active;
            return (
              <div
                key={h.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/55 p-3.5 flex flex-col gap-2.5 hover:border-[var(--border-strong)] transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {h.targetThumb ? (
                      <img
                        src={h.targetThumb}
                        alt={h.targetTitle}
                        className="w-11 h-11 rounded-xl object-cover border border-[var(--border-strong)] shrink-0"
                      />
                    ) : (
                      <div
                        className="w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0"
                        style={{
                          borderColor: `${h.targetTypeColor}66`,
                          backgroundColor: `${h.targetTypeColor}18`,
                          color: h.targetTypeColor
                        }}
                      >
                        {h.targetSigil}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-display font-bold text-sm sm:text-base text-[var(--text-primary)] truncate">
                        {h.targetTitle}
                      </div>
                      <div className="text-[11px] text-[var(--accent)] font-medium truncate">
                        {h.roleLabel}
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${sMeta.cls}`}>
                    {sMeta.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/8 text-[var(--text-secondary)]">
                    {kMeta.badge}
                  </span>
                  {h.eraNote && (
                    <span className="text-[var(--text-muted)]">· {h.eraNote}</span>
                  )}
                </div>

                {h.summary && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                    {h.summary}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 mt-auto border-t border-[var(--border-subtle)]/60">
                  {h.targetEntryId ? (
                    <button
                      type="button"
                      onClick={() => onOpenEntry(h.targetEntryId!)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Mở hồ sơ địa điểm
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)] italic">
                      Địa điểm ghi nhanh nội bộ
                    </span>
                  )}
                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(h)}
                        className="p-1.5 rounded-lg border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--accent)] cursor-pointer"
                        title="Sửa thông tin sở hữu"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(h.id)}
                        className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Gỡ khỏi quyền sở hữu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CRUD Form: Attach Existing OR Quick-Create New Location */}
      {canEdit && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-base)]/65 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-display text-sm font-bold text-[var(--accent)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {editingId ? "Chỉnh sửa Lãnh địa / Trực thuộc" : "Thêm Địa điểm / Lãnh địa thuộc quyền"}
            </h4>
            {!editingId && (
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAddMode("existing")}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                    addMode === "existing"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  <Shield className="w-3 h-3 inline mr-1" />
                  Gắn hồ sơ có sẵn
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("quick_create")}
                  className={`px-2.5 py-1 rounded-lg border cursor-pointer ${
                    addMode === "quick_create"
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  <Building2 className="w-3 h-3 inline mr-1" />
                  Tạo nhanh địa điểm mới
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            {addMode === "existing" && !editingId ? (
              <select
                required
                value={targetEntryId}
                onChange={(e) => setTargetEntryId(e.target.value)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
              >
                <option value="">— Chọn hồ sơ địa điểm / tài sản * —</option>
                {allEntries
                  .filter((x) => x.id !== entry.id)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.sigil} {x.title}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Tên địa điểm / thành phố mới *"
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
              />
            )}

            <select
              value={holdingKind}
              onChange={(e) => setHoldingKind(e.target.value as HoldingKind)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
            >
              {Object.entries(HOLDING_KIND_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>

            <input
              type="text"
              required
              value={roleLabel}
              onChange={(e) => setRoleLabel(e.target.value)}
              placeholder="Vai trò (VD: Thủ đô, Cảng biển...)"
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
            />

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as HoldingStatus)}
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
            >
              {Object.entries(HOLDING_STATUS_META).map(([k, m]) => (
                <option key={k} value={k}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              value={eraNote}
              onChange={(e) => setEraNote(e.target.value)}
              placeholder="Giai đoạn sở hữu (VD: Từ Năm 120 đến nay)"
              className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
            />
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Mô tả ngắn vai trò của địa điểm này..."
              className="sm:col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs cursor-pointer"
              >
                Hủy sửa
              </button>
            )}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {editingId
                ? "Cập nhật"
                : addMode === "quick_create"
                ? "Tạo hồ sơ địa điểm & Gắn ngay"
                : "Gắn vào quyền sở hữu"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
