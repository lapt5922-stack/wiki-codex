"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Check,
  GitFork,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import type {
  RelationTypeDef,
  SuggestedRelationCandidate,
  UniversalRelationRecord
} from "@/db/universal-relations-repo";
import {
  EDITORIAL_STATUS_META,
  type EditorialVerificationStatus
} from "@/lib/codex-modules";
import type { UniversalEntityKind } from "@/lib/universal-id";

interface RelationshipManagerViewProps {
  workspaceId: string;
  canEdit: boolean;
  onOpenEntry?: (id: string) => void;
}

export function RelationshipManagerView({
  workspaceId,
  canEdit,
  onOpenEntry
}: RelationshipManagerViewProps) {
  const [relations, setRelations] = useState<UniversalRelationRecord[]>([]);
  const [types, setTypes] = useState<RelationTypeDef[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedRelationCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRel, setSelectedRel] = useState<UniversalRelationRecord | null>(null);

  // Create Relation Modal
  const [showCreate, setShowCreate] = useState(false);
  const [sourceId, setSourceId] = useState("CHAR-000001");
  const [sourceKind, setSourceKind] = useState<UniversalEntityKind>("character");
  const [sourceTitle, setSourceTitle] = useState("");
  const [targetId, setTargetId] = useState("KING-000001");
  const [targetKind, setTargetKind] = useState<UniversalEntityKind>("kingdom");
  const [targetTitle, setTargetTitle] = useState("");
  const [relTypeCode, setRelTypeCode] = useState("belongs_to");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [verificationStatus, setVerificationStatus] =
    useState<EditorialVerificationStatus>("verified");

  // Create Custom Type Modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [newTypeInverse, setNewTypeInverse] = useState("");

  const loadRelations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ workspaceId });
      if (q.trim()) params.set("q", q.trim());
      if (typeFilter) params.set("relationTypeCode", typeFilter);
      if (statusFilter) params.set("verificationStatus", statusFilter);
      const res = await fetch(`/api/universal-relations?${params}`);
      const data = await res.json();
      setRelations(data.relations || []);
      setTypes(data.relationTypes || []);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, q, typeFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      void loadRelations();
    }, 150);
    return () => clearTimeout(t);
  }, [loadRelations]);

  async function loadSuggestions() {
    setLoadingSuggest(true);
    try {
      const res = await fetch(
        `/api/universal-relations?workspaceId=${encodeURIComponent(workspaceId)}&mode=suggest`
      );
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function handleCreateRelation(e: React.FormEvent) {
    e.preventDefault();
    const typeObj = types.find((t) => t.code === relTypeCode);
    await fetch("/api/universal-relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        sourceId,
        sourceKind,
        sourceTitle: sourceTitle.trim() || sourceId,
        targetId,
        targetKind,
        targetTitle: targetTitle.trim() || targetId,
        relationTypeCode: relTypeCode,
        relationLabel: typeObj?.labelVi || relTypeCode,
        description,
        startDate,
        endDate,
        sources: sourceRef.trim() ? [{ title: sourceRef.trim() }] : [],
        verificationStatus
      })
    });
    setShowCreate(false);
    setDescription("");
    setSourceRef("");
    await loadRelations();
  }

  async function handleConfirmSuggestion(s: SuggestedRelationCandidate) {
    await fetch("/api/universal-relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId,
        sourceId: s.sourceId,
        sourceKind: s.sourceKind,
        sourceTitle: s.sourceTitle,
        targetId: s.targetId,
        targetKind: s.targetKind,
        targetTitle: s.targetTitle,
        relationTypeCode: s.suggestedTypeCode,
        relationLabel: s.suggestedLabel,
        description: s.reason,
        verificationStatus: "inferred"
      })
    });
    setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    await loadRelations();
  }

  async function handleCreateType(e: React.FormEvent) {
    e.preventDefault();
    if (!newTypeLabel.trim()) return;
    await fetch("/api/universal-relations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "relation_type",
        workspaceId,
        labelVi: newTypeLabel.trim(),
        inverseLabelVi: newTypeInverse.trim() || newTypeLabel.trim()
      })
    });
    setNewTypeLabel("");
    setNewTypeInverse("");
    setShowTypeModal(false);
    await loadRelations();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Xóa quan hệ tri thức này?")) return;
    await fetch(`/api/universal-relations?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (selectedRel?.id === id) setSelectedRel(null);
    await loadRelations();
  }

  return (
    <div className="space-y-4 text-xs">
      {/* Toolbar */}
      <div className="codex-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
              <GitFork className="w-4 h-4" /> Quản lý Quan hệ Tri thức Tập trung ({relations.length})
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Liên kết 2 chiều giữa mọi loại thực thể (CHAR-ID, KING-ID, Tổ chức, Địa điểm, Sự kiện) kèm thời gian hiệu lực &amp; nguồn chứng minh.
            </p>
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => void loadSuggestions()}
                disabled={loadingSuggest}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loadingSuggest ? "Đang quét..." : "Đề xuất liên kết"}
              </button>
              <button
                type="button"
                onClick={() => setShowTypeModal(true)}
                className="min-h-[36px] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)] inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Loại quan hệ mới
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tạo Quan hệ
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo ID, tên thực thể, mô tả..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] text-xs outline-none focus:border-[var(--accent)]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
          >
            <option value="">Tất cả loại quan hệ ({types.length})</option>
            {types.map((t) => (
              <option key={t.id} value={t.code}>
                {t.labelVi} ({t.code})
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs"
          >
            <option value="">Mọi trạng thái xác minh</option>
            {Object.entries(EDITORIAL_STATUS_META).map(([k, m]) => (
              <option key={k} value={k}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Auto-Suggested Links Panel (Requires Explicit Confirmation) */}
      {suggestions.length > 0 && (
        <div className="codex-card rounded-2xl p-4 border-cyan-500/40 bg-cyan-500/5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Đề xuất liên kết tự động ({suggestions.length}) — Cần xác nhận trước khi lưu
            </span>
            <button
              type="button"
              onClick={() => setSuggestions([])}
              className="text-[11px] text-[var(--text-muted)] hover:text-white cursor-pointer"
            >
              Đóng
            </button>
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto codex-scrollbar pr-1">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-500/25 bg-[var(--bg-base)]/70 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {s.sourceTitle} <span className="text-cyan-300 mx-1">→ {s.suggestedLabel} →</span> {s.targetTitle}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">{s.reason}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleConfirmSuggestion(s)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 text-[#090e1c] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Xác nhận lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestions((prev) => prev.filter((x) => x.id !== s.id))}
                    className="px-2 py-1 rounded-lg border border-white/15 text-[var(--text-muted)] cursor-pointer"
                  >
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Relations List */}
      <div className="codex-card rounded-2xl p-4 space-y-2">
        {loading ? (
          <div className="py-8 text-center text-[var(--text-muted)]">Đang tải mạng lưới quan hệ...</div>
        ) : relations.length === 0 ? (
          <div className="py-8 text-center text-[var(--text-muted)]">Chưa có quan hệ nào khớp bộ lọc.</div>
        ) : (
          <div className="space-y-2">
            {relations.map((r) => {
              const meta = EDITORIAL_STATUS_META[r.verificationStatus] || EDITORIAL_STATUS_META.unverified;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRel(r)}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 hover:border-[var(--accent)] p-3 flex flex-wrap items-center justify-between gap-2 cursor-pointer transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{r.sourceId}</span>
                      <strong className="text-[var(--text-primary)]">{r.sourceTitle}</strong>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold text-[10px]">
                        → {r.relationLabel} →
                      </span>
                      <strong className="text-[var(--text-primary)]">{r.targetTitle}</strong>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{r.targetId}</span>
                    </div>
                    {r.description && (
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1">{r.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-muted)]">
                      <span className={`px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>{meta.shortLabel}</span>
                      {(r.startDate || r.endDate) && (
                        <span>⏳ {r.startDate || "?"} — {r.endDate || "Hiện tại"}</span>
                      )}
                      {r.sources.length > 0 && <span>📚 {r.sources.length} nguồn</span>}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(r.id);
                      }}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                      title="Xóa quan hệ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Relationship Details Modal */}
      {selectedRel && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRel(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-[var(--accent)]">{selectedRel.id}</span>
              <button type="button" onClick={() => setSelectedRel(null)} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {selectedRel.sourceTitle} ({selectedRel.sourceId}) →{" "}
              <span className="text-[var(--accent)]">{selectedRel.relationLabel}</span> →{" "}
              {selectedRel.targetTitle} ({selectedRel.targetId})
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {selectedRel.description || "Không có mô tả chi tiết."}
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] rounded-xl bg-[var(--bg-base)] p-3 border border-[var(--border-subtle)]">
              <div><span className="text-[var(--text-muted)]">Bắt đầu:</span> <strong>{selectedRel.startDate || "—"}</strong></div>
              <div><span className="text-[var(--text-muted)]">Kết thúc:</span> <strong>{selectedRel.endDate || "—"}</strong></div>
              <div><span className="text-[var(--text-muted)]">Xác minh:</span> <strong>{EDITORIAL_STATUS_META[selectedRel.verificationStatus]?.label}</strong></div>
              <div><span className="text-[var(--text-muted)]">Người tạo:</span> <strong>{selectedRel.createdBy}</strong></div>
            </div>
            {selectedRel.sources.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-semibold text-[var(--accent)]">Nguồn chứng minh ({selectedRel.sources.length}):</div>
                {selectedRel.sources.map((src, i) => (
                  <div key={i} className="text-[11px] rounded-lg bg-white/5 px-2.5 py-1.5">
                    • <strong>{src.title}</strong> {src.note ? `— ${src.note}` : ""}
                  </div>
                ))}
              </div>
            )}
            {onOpenEntry && selectedRel.sourceId.startsWith("ent-") && (
              <button
                type="button"
                onClick={() => {
                  onOpenEntry(selectedRel.sourceId);
                  setSelectedRel(null);
                }}
                className="text-[11px] text-cyan-300 hover:underline cursor-pointer"
              >
                Mở hồ sơ nguồn →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Create Relation Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateRelation}
            className="w-full max-w-xl rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-display text-base font-bold text-[var(--accent)]">Tạo Quan hệ Tri thức Mới</h4>
              <button type="button" onClick={() => setShowCreate(false)}><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input required value={sourceId} onChange={(e) => setSourceId(e.target.value)} placeholder="ID nguồn (VD: CHAR-000001)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <input value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="Tên thực thể nguồn" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <select value={sourceKind} onChange={(e) => setSourceKind(e.target.value as UniversalEntityKind)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5">
                <option value="character">Nhân vật</option>
                <option value="kingdom">Vương quốc</option>
                <option value="organization">Tổ chức</option>
                <option value="location">Địa điểm</option>
                <option value="event">Sự kiện</option>
                <option value="item">Cổ vật</option>
                <option value="lore">Hồ sơ Wiki</option>
              </select>
              <select value={relTypeCode} onChange={(e) => setRelTypeCode(e.target.value)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5">
                {types.map((t) => <option key={t.id} value={t.code}>{t.labelVi}</option>)}
              </select>
              <input required value={targetId} onChange={(e) => setTargetId(e.target.value)} placeholder="ID đích (VD: KING-000001)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <input value={targetTitle} onChange={(e) => setTargetTitle(e.target.value)} placeholder="Tên thực thể đích" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <select value={targetKind} onChange={(e) => setTargetKind(e.target.value as UniversalEntityKind)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5">
                <option value="kingdom">Vương quốc</option>
                <option value="character">Nhân vật</option>
                <option value="organization">Tổ chức</option>
                <option value="location">Địa điểm</option>
                <option value="event">Sự kiện</option>
                <option value="item">Cổ vật</option>
                <option value="lore">Hồ sơ Wiki</option>
              </select>
              <select value={verificationStatus} onChange={(e) => setVerificationStatus(e.target.value as EditorialVerificationStatus)} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5">
                {Object.entries(EDITORIAL_STATUS_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
              </select>
              <input value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="Thời điểm bắt đầu (VD: Năm 412)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <input value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="Thời điểm kết thúc" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            </div>
            <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="Nguồn tham khảo chứng minh..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả chi tiết mối quan hệ..." className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer">Lưu Quan hệ</button>
            </div>
          </form>
        </div>
      )}

      {/* Create Custom Relation Type Modal */}
      {showTypeModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowTypeModal(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateType}
            className="w-full max-w-md rounded-2xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] p-5 space-y-3 shadow-2xl"
          >
            <h4 className="font-display text-base font-bold text-[var(--accent)]">Tạo Loại Quan hệ Mở rộng</h4>
            <input required value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} placeholder="Tên loại quan hệ (VD: Chư hầu của)" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <input value={newTypeInverse} onChange={(e) => setNewTypeInverse(e.target.value)} placeholder="Nhãn nghịch đảo (VD: Bảo hộ cho)" className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowTypeModal(false)} className="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] cursor-pointer">Hủy</button>
              <button type="submit" className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer">Tạo loại</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
