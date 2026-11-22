"use client";

import React, { useEffect, useState } from "react";
import { Activity, AlertTriangle, FileWarning, Gauge, Plus, Trash2, Unlink } from "lucide-react";
import type { WikiHealthReport } from "@/types/codex";

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
  const [report, setReport] = useState<WikiHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [stressBusy, setStressBusy] = useState(false);
  const [stressMsg, setStressMsg] = useState("");

  async function loadHealth() {
    setLoading(true);
    try {
      const res = await fetch(`/api/graph?workspaceId=${workspaceId}&mode=health`);
      const data = await res.json();
      setReport(data.health || null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

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

  if (loading || !report) {
    return (
      <div className="codex-card rounded-2xl p-8 text-center text-xs text-[var(--text-muted)]">
        Đang phân tích sức khỏe kho tri thức...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="codex-card rounded-2xl p-5">
        <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Trung tâm Sức khỏe, Thống kê & Kiểm thử Tải Quy mô lớn
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 font-mono">
          {[
            ["Tổng hồ sơ", report.totalEntries.toLocaleString("vi-VN")],
            ["Đã xuất bản", report.publishedEntries.toLocaleString("vi-VN")],
            ["Bản nháp", report.draftEntries],
            ["Tổng số từ", report.totalWords.toLocaleString("vi-VN")],
            ["Liên kết chéo", report.totalLinks],
            ["Hình ảnh", report.totalImages]
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 text-center">
              <div className="text-lg font-bold text-[var(--accent)]">{val}</div>
              <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Scale Stress Simulator */}
      {isAdmin && (
        <div className="codex-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
              <Gauge className="w-4 h-4" /> Công cụ Kiểm thử Tải Thực tế (Scale Stress Simulator — Admin)
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Sinh nhanh hàng nghìn thẻ hồ sơ giả lập để tự kiểm chứng tốc độ phân trang & tìm kiếm không dấu, rồi dọn sạch chỉ với 1 ấn.
            </p>
            {stressMsg && <div className="text-xs text-emerald-300 mt-1">{stressMsg}</div>}
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <button type="button" disabled={stressBusy} onClick={() => runStress("stress_seed", 1000)} className="px-3 py-1.5 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold disabled:opacity-50 cursor-pointer">
              + Sinh 1.000 thẻ
            </button>
            <button type="button" disabled={stressBusy} onClick={() => runStress("stress_seed", 3000)} className="px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-[var(--accent)] disabled:opacity-50 cursor-pointer">
              + Sinh 3.000 thẻ
            </button>
            <button type="button" disabled={stressBusy} onClick={() => runStress("stress_clear")} className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/35 text-rose-300 disabled:opacity-50 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Dọn sạch thẻ test
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="codex-card rounded-2xl p-4 space-y-3">
          <h3 className="font-display text-base text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Liên kết Đỏ ({report.brokenLinks.length})
          </h3>
          {report.brokenLinks.length === 0 ? (
            <p className="text-xs text-emerald-300">Mọi liên kết [[...]] đều hợp lệ!</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {report.brokenLinks.map((b, i) => (
                <div key={i} className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-2.5 text-xs flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-rose-300 truncate">[[{b.missingTitle}]]</div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">Trong: {b.sourceTitle}</div>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={() => onCreateRedLink(b.missingTitle)} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer">
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
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {report.orphanEntries.slice(0, 30).map((o) => (
              <button key={o.id} type="button" onClick={() => onOpenEntry(o.id)} className="w-full text-left rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-xs hover:border-[var(--accent)] cursor-pointer">
                <span className="text-[var(--accent)] mr-1.5">{o.sigil}</span>{o.title}
              </button>
            ))}
          </div>
        </div>

        <div className="codex-card rounded-2xl p-4 space-y-3">
          <h3 className="font-display text-base text-[var(--accent)] flex items-center gap-1.5">
            <FileWarning className="w-4 h-4" /> Bài sơ khai ({report.stubEntries.length})
          </h3>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {report.stubEntries.slice(0, 30).map((s) => (
              <button key={s.id} type="button" onClick={() => onOpenEntry(s.id)} className="w-full flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-xs hover:border-[var(--accent)] cursor-pointer">
                <span className="truncate">{s.title}</span>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">{s.wordCount} từ</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
