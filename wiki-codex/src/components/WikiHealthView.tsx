"use client";

import React, { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Gauge,
  GitFork,
  Plus,
  ShieldCheck,
  Trash2,
  Unlink
} from "lucide-react";
import type { WikiHealthReport } from "@/types/codex";
import type {
  ContentHealthSummary,
  HealthResolutionStatus
} from "@/lib/content-health-engine";
import { RelationshipManagerView } from "./RelationshipManagerView";

interface WikiHealthViewProps {
  workspaceId: string;
  canEdit: boolean;
  isAdmin?: boolean;
  onOpenEntry: (id: string) => void;
  onCreateRedLink: (missingTitle: string) => void;
  onMutated?: () => Promise<void>;
}

export function WikiHealthView({
  workspaceId,
  canEdit,
  isAdmin = false,
  onOpenEntry,
  onCreateRedLink,
  onMutated
}: WikiHealthViewProps) {
  const [activeTab, setActiveTab] = useState<"validation" | "relations">("validation");
  const [report, setReport] = useState<WikiHealthReport | null>(null);
  const [validation, setValidation] = useState<ContentHealthSummary | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [stressBusy, setStressBusy] = useState(false);
  const [stressMsg, setStressMsg] = useState("");

  async function loadHealth() {
    setLoading(true);
    try {
      const [gRes, vRes] = await Promise.all([
        fetch(`/api/graph?workspaceId=${workspaceId}&mode=health`).then((r) => r.json()),
        fetch(`/api/health/validate?workspaceId=${workspaceId}`).then((r) => r.json())
      ]);
      setReport(gRes.health || null);
      setValidation(vRes.summary || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function updateIssueStatus(issueId: string, status: HealthResolutionStatus) {
    await fetch("/api/health/validate", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueId, status })
    });
    setValidation((prev) =>
      prev
        ? {
            ...prev,
            issues: prev.issues.map((i) => (i.id === issueId ? { ...i, status } : i))
          }
        : prev
    );
  }

  async function runStress(action: "stress_seed" | "stress_clear", count = 1000) {
    setStressBusy(true);
    setStressMsg("");
    const t0 = performance.now();
    try {
      const res = await fetch("/api/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resource: action,
          data: { workspaceId, count }
        })
      });
      const data = await res.json();
      const ms = Math.round(performance.now() - t0);
      if (action === "stress_seed") {
        setStressMsg(`Đã sinh thành công ${data.count} thẻ hồ sơ kiểm thử tải trong ${ms}ms!`);
      } else {
        setStressMsg(`Đã dọn sạch ${data.removed} thẻ kiểm thử tải!`);
      }
      await loadHealth();
      if (onMutated) await onMutated();
    } finally {
      setStressBusy(false);
    }
  }

  const visibleIssues = (validation?.issues || []).filter(
    (iss) => severityFilter === "all" || iss.severity === severityFilter
  );

  return (
    <div className="space-y-4">
      {/* Control Center Header + Sub-Tabs */}
      <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg sm:text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Trung tâm Kiểm toán Tri thức, Sức khỏe Dữ liệu &amp; Quan hệ
          </h2>
          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("validation")}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl border font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "validation"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Kiểm toán 9 Quy tắc ({validation?.totalIssues ?? 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("relations")}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl border font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
                activeTab === "relations"
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              <GitFork className="w-3.5 h-3.5" /> Relationship Manager
            </button>
          </div>
        </div>

        {report && activeTab === "validation" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
            {[
              ["Tổng hồ sơ", report.totalEntries.toLocaleString("vi-VN")],
              ["Đã xuất bản", report.publishedEntries.toLocaleString("vi-VN")],
              ["Bản nháp", report.draftEntries],
              ["Tổng số từ", report.totalWords.toLocaleString("vi-VN")],
              ["Liên kết chéo", report.totalLinks],
              ["Hình ảnh", report.totalImages]
            ].map(([label, val]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-2.5 text-center"
              >
                <div className="text-base font-bold text-[var(--accent)]">{val}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === "relations" ? (
        <RelationshipManagerView
          workspaceId={workspaceId}
          canEdit={canEdit}
          onOpenEntry={onOpenEntry}
        />
      ) : loading || !report ? (
        <div className="codex-card rounded-2xl p-8 text-center text-xs text-[var(--text-muted)]">
          Đang phân tích sức khỏe kho tri thức theo 9 quy tắc kiểm toán...
        </div>
      ) : (
        <>
          {/* 9-Rule Content Health & Data Validation Report */}
          {validation && (
            <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Báo cáo Kiểm toán Dữ liệu (9 Quy tắc Chuẩn)
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Chỉ cảnh báo và đề xuất khắc phục — không bao giờ tự ý sửa nội dung chính thức.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ["all", `Tất cả (${validation.totalIssues})`],
                      ["critical", `Nghiêm trọng (${validation.bySeverity.critical})`],
                      ["warning", `Cảnh báo (${validation.bySeverity.warning})`],
                      ["info", `Gợi ý (${validation.bySeverity.info})`]
                    ] as const
                  ).map(([sev, lbl]) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                        severityFilter === sev
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                          : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {visibleIssues.length === 0 ? (
                <div className="py-6 text-center text-emerald-300 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Không phát hiện cảnh báo nào ở mức độ này!
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto codex-scrollbar pr-1">
                  {visibleIssues.slice(0, 60).map((iss) => (
                    <div
                      key={iss.id}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex flex-wrap items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              iss.severity === "critical"
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                                : iss.severity === "warning"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                : "bg-sky-500/15 text-sky-300 border-sky-500/40"
                            }`}
                          >
                            {iss.ruleLabel}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (iss.entityKind === "entry") onOpenEntry(iss.entityId);
                            }}
                            className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] cursor-pointer"
                          >
                            {iss.entityTitle} ({iss.entityId})
                          </button>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">{iss.description}</p>
                        <p className="text-[11px] text-cyan-300/85">→ Gợi ý: {iss.suggestion}</p>
                      </div>

                      {canEdit && (
                        <select
                          value={iss.status}
                          onChange={(e) =>
                            void updateIssueStatus(iss.id, e.target.value as HealthResolutionStatus)
                          }
                          className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] shrink-0"
                        >
                          <option value="open">Chưa xử lý</option>
                          <option value="acknowledged">Đã ghi nhận</option>
                          <option value="resolved">Đã khắc phục</option>
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin Scale Stress Simulator */}
          {isAdmin && (
            <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
                  <Gauge className="w-4 h-4" /> Công cụ Kiểm thử Tải Thực tế (Scale Stress Simulator — Admin)
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Sinh nhanh hàng nghìn thẻ hồ sơ giả lập để tự kiểm chứng tốc độ phân trang &amp; tìm kiếm không dấu, rồi dọn sạch chỉ với 1 ấn.
                </p>
                {stressMsg && <div className="text-xs text-emerald-300 mt-1">{stressMsg}</div>}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  disabled={stressBusy}
                  onClick={() => runStress("stress_seed", 1000)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold disabled:opacity-50 cursor-pointer"
                >
                  + Sinh 1.000 thẻ
                </button>
                <button
                  type="button"
                  disabled={stressBusy}
                  onClick={() => runStress("stress_seed", 3000)}
                  className="px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-[var(--accent)] disabled:opacity-50 cursor-pointer"
                >
                  + Sinh 3.000 thẻ
                </button>
                <button
                  type="button"
                  disabled={stressBusy}
                  onClick={() => runStress("stress_clear")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/35 text-rose-300 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Dọn sạch thẻ test
                </button>
              </div>
            </div>
          )}

          {/* Red Links, Orphans & Stubs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="codex-card rounded-2xl p-4 space-y-3">
              <h3 className="font-display text-base text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Liên kết Đỏ ({report.brokenLinks.length})
              </h3>
              {report.brokenLinks.length === 0 ? (
                <p className="text-xs text-emerald-300">Mọi liên kết [[...]] đều hợp lệ!</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto codex-scrollbar">
                  {report.brokenLinks.map((b, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-2.5 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-rose-300 truncate">[[{b.missingTitle}]]</div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">
                          Trong: {b.sourceTitle}
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onCreateRedLink(b.missingTitle)}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Tạo
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="codex-card rounded-2xl p-4 space-y-3">
              <h3 className="font-display text-base text-amber-300 flex items-center gap-1.5">
                <Unlink className="w-4 h-4" /> Hồ sơ Mồ côi ({report.orphanEntries.length})
              </h3>
              <div className="space-y-1.5 max-h-72 overflow-y-auto codex-scrollbar">
                {report.orphanEntries.slice(0, 30).map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onOpenEntry(o.id)}
                    className="w-full text-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-xs hover:border-[var(--accent)] cursor-pointer"
                  >
                    <span className="text-[var(--accent)] mr-1.5">{o.sigil}</span>
                    {o.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="codex-card rounded-2xl p-4 space-y-3">
              <h3 className="font-display text-base text-[var(--accent)] flex items-center gap-1.5">
                <FileWarning className="w-4 h-4" /> Bài sơ khai ({report.stubEntries.length})
              </h3>
              <div className="space-y-1.5 max-h-72 overflow-y-auto codex-scrollbar">
                {report.stubEntries.slice(0, 30).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onOpenEntry(s.id)}
                    className="w-full flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-xs hover:border-[var(--accent)] cursor-pointer"
                  >
                    <span className="truncate">{s.title}</span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {s.wordCount} từ
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
