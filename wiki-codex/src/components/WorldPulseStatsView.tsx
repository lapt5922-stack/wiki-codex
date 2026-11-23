"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Check,
  EyeOff,
  Lock,
  Sparkles,
  X
} from "lucide-react";
import type { AiAssistantMode, AiProposalRecord } from "@/db/ai-proposals-repo";
import { EDITORIAL_STATUS_META, type EditorialVerificationStatus } from "@/lib/codex-modules";

interface WorldPulseStatsViewProps {
  workspaceId: string;
  canEdit: boolean;
  onOpenEntry: (entryId: string) => void;
}

interface PulsePayload {
  statistics: {
    worlds: number;
    kingdoms: number;
    characters: number;
    organizations: number;
    locations: number;
    events: number;
    species: number;
    artifacts: number;
    documents: number;
    perspectives: number;
    relations: number;
    totalEntries: number;
    mediaAssets: number;
    editorialCounts: Record<EditorialVerificationStatus, number>;
    eraCounts: Record<string, number>;
  };
  pulseItems: Array<{
    id: string;
    kind: "event" | "document" | "relation" | "entry";
    title: string;
    subtitle: string;
    summary: string;
    timestamp: string;
    refId: string;
  }>;
  secretArchive: {
    role: string;
    canViewPrivate: boolean;
    privateEntries: Array<{ id: string; title: string; status: string; visibility: string }>;
    spoilerEntries: Array<{ id: string; title: string; spoilerLabel: string }>;
    unverifiedEntries: Array<{ id: string; title: string; summary: string }>;
  };
}

const AI_MODES: Array<{ id: AiAssistantMode; label: string; desc: string }> = [
  { id: "consistency_checker", label: "2. Kiểm tra Nhất quán Lore", desc: "Quét mâu thuẫn niên đại, liên kết & dữ liệu thật" },
  { id: "relationship_finder", label: "3. Đề xuất Quan hệ Tri thức", desc: "Phát hiện cặp thực thể liên quan chưa gắn kết" },
  { id: "historian", label: "4. AI Sử gia (Historian)", desc: "Tổng hợp mạch lịch sử từ các sự kiện & tư liệu đã có" },
  { id: "research_assistant", label: "6. Trợ lý Nghiên cứu Nguồn", desc: "Phân tách nội dung đã xác minh với bản nháp/suy luận" },
  { id: "article_generator", label: "5. Sinh Khung Bản nháp", desc: "Tạo dàn ý bách khoa chuẩn (không bịa dữ kiện)" },
  { id: "lore_assistant", label: "1. AI Biên tập Lore", desc: "Gợi ý chuẩn hóa cấu trúc bài viết" }
];

export function WorldPulseStatsView({
  workspaceId,
  canEdit,
  onOpenEntry
}: WorldPulseStatsViewProps) {
  const [subTab, setSubTab] = useState<"pulse" | "stats" | "secret" | "ai">("pulse");
  const [data, setData] = useState<PulsePayload | null>(null);
  const [pulseKind, setPulseKind] = useState<string>("all");
  const [proposals, setProposals] = useState<AiProposalRecord[]>([]);
  const [aiMode, setAiMode] = useState<AiAssistantMode>("consistency_checker");
  const [aiTarget, setAiTarget] = useState("");
  const [aiNote, setAiNote] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const loadPulse = useCallback(async () => {
    const res = await fetch(`/api/world-pulse?workspaceId=${encodeURIComponent(workspaceId)}`);
    const json = await res.json();
    setData(json);
  }, [workspaceId]);

  const loadProposals = useCallback(async () => {
    if (!canEdit) return;
    const res = await fetch(`/api/ai-assistant?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok) {
      const json = await res.json();
      setProposals(json.proposals || []);
    }
  }, [workspaceId, canEdit]);

  useEffect(() => {
    void loadPulse();
    void loadProposals();
  }, [loadPulse, loadProposals]);

  async function runAiProposal(e: React.FormEvent) {
    e.preventDefault();
    setAiBusy(true);
    try {
      await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          mode: aiMode,
          targetTitle: aiTarget.trim() || "Toàn bộ Thế giới",
          promptNote: aiNote.trim()
        })
      });
      setAiNote("");
      await loadProposals();
    } finally {
      setAiBusy(false);
    }
  }

  async function handleReviewProposal(id: string, decision: "approved" | "rejected") {
    await fetch("/api/ai-assistant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, decision })
    });
    await loadProposals();
  }

  if (!data) {
    return (
      <div className="codex-card rounded-2xl p-8 text-center text-xs text-[var(--text-muted)]">
        Đang tổng hợp World Pulse &amp; Thống kê Bách khoa từ dữ liệu thật...
      </div>
    );
  }

  const st = data.statistics;
  const maxEditorial = Math.max(1, ...Object.values(st.editorialCounts));

  return (
    <div className="space-y-4 text-xs animate-codex-fade-up">
      {/* Sub-Tab Bar */}
      <div className="codex-card rounded-2xl p-3 flex flex-wrap items-center gap-1.5">
        {(
          [
            ["pulse", Activity, `World Pulse (${data.pulseItems.length})`],
            ["stats", BarChart3, "Thống kê Bách khoa (Số liệu thật)"],
            ["secret", Lock, "Secret & Discovery Archive"],
            ...(canEdit ? ([["ai", Bot, `AI Lore & Research Studio (${proposals.filter((p) => p.status === "pending").length})`]] as const) : [])
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
            className={`min-h-[36px] px-3 py-1.5 rounded-xl border font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              subTab === id
                ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c]"
                : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* TAB 1: WORLD PULSE */}
      {subTab === "pulse" && (
        <div className="codex-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-[var(--accent)]">
                World Pulse — Nhịp đập &amp; Diễn biến Thế giới
              </h2>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tổng hợp động trực tiếp từ Sự kiện, Tư liệu, Quan hệ &amp; Hồ sơ vừa cập nhật (không tạo bản ghi trùng).
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "Tất cả"],
                  ["event", "Sự kiện"],
                  ["document", "Tư liệu"],
                  ["relation", "Quan hệ"],
                  ["entry", "Hồ sơ"]
                ] as const
              ).map(([k, lbl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPulseKind(k)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] cursor-pointer ${
                    pulseKind === k
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-bold"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto codex-scrollbar pr-1">
            {data.pulseItems
              .filter((p) => pulseKind === "all" || p.kind === pulseKind)
              .map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.kind === "entry") onOpenEntry(item.refId);
                  }}
                  className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 flex items-start justify-between gap-2 ${
                    item.kind === "entry" ? "hover:border-[var(--accent)] cursor-pointer" : ""
                  }`}
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white/10 text-[var(--accent)]">
                        {item.kind}
                      </span>
                      <strong className="text-[var(--text-primary)] truncate">{item.title}</strong>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">{item.subtitle}</div>
                    {item.summary && (
                      <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2">{item.summary}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 2: WORLD ENCYCLOPEDIA STATISTICS (100% Real Data) */}
      {subTab === "stats" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              ["Thế giới", st.worlds],
              ["Quốc gia", st.kingdoms],
              ["Nhân vật", st.characters],
              ["Tổ chức", st.organizations],
              ["Địa điểm", st.locations],
              ["Sự kiện", st.events],
              ["Chủng loài", st.species],
              ["Cổ vật", st.artifacts],
              ["Tư liệu DOC", st.documents],
              ["Góc nhìn", st.perspectives],
              ["Quan hệ", st.relations],
              ["Ảnh Media", st.mediaAssets]
            ].map(([label, val]) => (
              <div key={String(label)} className="codex-card rounded-xl p-3 text-center">
                <div className="font-display text-xl font-bold text-[var(--accent)]">
                  {Number(val).toLocaleString("vi-VN")}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 6 Editorial Verification States Chart */}
            <div className="codex-card rounded-2xl p-4 space-y-2.5">
              <div className="font-display text-sm font-bold text-[var(--accent)]">
                Phân bổ theo 6 Trạng thái Biên soạn (Số liệu thực tế)
              </div>
              {(Object.keys(EDITORIAL_STATUS_META) as EditorialVerificationStatus[]).map((k) => {
                const count = st.editorialCounts[k] || 0;
                const pct = Math.round((count / maxEditorial) * 100);
                return (
                  <div key={k} className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>{EDITORIAL_STATUS_META[k].label}</span>
                      <strong className="font-mono">{count}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-cyan-400"
                        style={{ width: `${Math.max(count > 0 ? 4 : 0, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Era Distribution */}
            <div className="codex-card rounded-2xl p-4 space-y-2.5">
              <div className="font-display text-sm font-bold text-[var(--accent)]">
                Phân bổ Sự kiện theo Thời đại (Living History)
              </div>
              {Object.entries(st.eraCounts).length === 0 ? (
                <p className="text-[var(--text-muted)]">Chưa có sự kiện nào được gắn thời đại.</p>
              ) : (
                Object.entries(st.eraCounts).map(([era, count]) => (
                  <div key={era} className="flex items-center justify-between rounded-xl bg-[var(--bg-base)]/60 border border-[var(--border-subtle)] px-3 py-2">
                    <span className="font-medium text-[var(--text-primary)]">{era}</span>
                    <span className="font-mono font-bold text-cyan-300">{count} sự kiện</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECRET & DISCOVERY ARCHIVE (True Backend RBAC) */}
      {subTab === "secret" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="codex-card rounded-2xl p-4 space-y-2.5">
            <div className="font-display text-sm font-bold text-rose-300 flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Hồ sơ Riêng tư &amp; Bản nháp (Backend RBAC)
            </div>
            {!data.secretArchive.canViewPrivate ? (
              <p className="text-[11px] text-[var(--text-muted)]">
                Tài khoản hiện tại ({data.secretArchive.role}) không có quyền xem dữ liệu riêng tư — máy chủ đã lọc bỏ hoàn toàn trước khi trả phản hồi.
              </p>
            ) : data.secretArchive.privateEntries.length === 0 ? (
              <p className="text-[11px] text-emerald-300">Không có hồ sơ riêng tư / bản nháp nào đang ẩn.</p>
            ) : (
              data.secretArchive.privateEntries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEntry(e.id)}
                  className="w-full text-left rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 hover:border-rose-400 cursor-pointer"
                >
                  <div className="font-semibold text-[var(--text-primary)]">{e.title}</div>
                  <div className="text-[10px] text-rose-300 font-mono">
                    {e.visibility} · {e.status}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="codex-card rounded-2xl p-4 space-y-2.5">
            <div className="font-display text-sm font-bold text-purple-300 flex items-center gap-1.5">
              <EyeOff className="w-4 h-4" /> Hồ sơ có Che Spoiler ({data.secretArchive.spoilerEntries.length})
            </div>
            {data.secretArchive.spoilerEntries.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)]">Chưa có hồ sơ nào gắn cờ Spoiler.</p>
            ) : (
              data.secretArchive.spoilerEntries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEntry(e.id)}
                  className="w-full text-left rounded-xl border border-purple-500/30 bg-purple-500/5 px-3 py-2 hover:border-purple-400 cursor-pointer"
                >
                  <div className="font-semibold text-[var(--text-primary)]">{e.title}</div>
                  <div className="text-[10px] text-purple-200">{e.spoilerLabel}</div>
                </button>
              ))
            )}
          </div>

          <div className="codex-card rounded-2xl p-4 space-y-2.5">
            <div className="font-display text-sm font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Đang Nghiên cứu / Chưa Xác minh ({data.secretArchive.unverifiedEntries.length})
            </div>
            {data.secretArchive.unverifiedEntries.length === 0 ? (
              <p className="text-[11px] text-emerald-300">Tất cả hồ sơ đã được xác minh hoặc phân loại rõ!</p>
            ) : (
              data.secretArchive.unverifiedEntries.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onOpenEntry(e.id)}
                  className="w-full text-left rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 hover:border-amber-400 cursor-pointer"
                >
                  <div className="font-semibold text-[var(--text-primary)]">{e.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] line-clamp-1">{e.summary}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GOVERNED AI LORE & RESEARCH STUDIO */}
      {subTab === "ai" && canEdit && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <form onSubmit={runAiProposal} className="lg:col-span-5 codex-card rounded-2xl p-4 space-y-3">
            <div className="font-display text-base font-bold text-[var(--accent)] flex items-center gap-2">
              <Bot className="w-4 h-4" /> AI Lore &amp; Research Studio (6 Trợ lý)
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Mọi đề xuất AI đều dựa trên dữ liệu thực tế, ghi rõ nguồn đầu vào, **không tự sửa dữ liệu gốc** và **bắt buộc qua bước duyệt của quản trị viên**.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] text-[var(--text-muted)]">Chọn trợ lý AI:</label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as AiAssistantMode)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2"
              >
                {AI_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.desc}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={aiTarget}
              onChange={(e) => setAiTarget(e.target.value)}
              placeholder="Tên hồ sơ / chủ đề mục tiêu (tùy chọn)"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2"
            />
            <textarea
              rows={3}
              value={aiNote}
              onChange={(e) => setAiNote(e.target.value)}
              placeholder="Yêu cầu cụ thể hoặc phạm vi kiểm tra..."
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2"
            />
            <button
              type="submit"
              disabled={aiBusy}
              className="w-full min-h-[40px] rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold cursor-pointer disabled:opacity-50"
            >
              {aiBusy ? "Đang phân tích dữ liệu..." : "Tạo Đề xuất AI (Chờ duyệt)"}
            </button>
          </form>

          <div className="lg:col-span-7 codex-card rounded-2xl p-4 space-y-2.5">
            <div className="font-display text-sm font-bold text-[var(--accent)]">
              Lịch sử &amp; Hàng đợi Duyệt Đề xuất AI ({proposals.length})
            </div>
            {proposals.length === 0 ? (
              <p className="text-[11px] text-[var(--text-muted)] py-6 text-center">
                Chưa có đề xuất AI nào. Chọn một trợ lý bên trái để bắt đầu phân tích.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto codex-scrollbar pr-1">
                {proposals.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-3 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-[var(--text-primary)]">
                        {p.targetTitle} <span className="font-mono text-[10px] text-[var(--text-muted)]">({p.mode})</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : p.status === "rejected"
                            ? "bg-rose-500/20 text-rose-300"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {p.status === "approved" ? "Đã duyệt" : p.status === "rejected" ? "Từ chối" : "Chờ duyệt"}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-[11px] text-[var(--text-secondary)] bg-black/25 rounded-lg p-2.5 border border-white/5">
                      {p.proposedContent}
                    </pre>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-muted)]">
                      <span>Nguồn đầu vào: {p.inputSources.join(" · ")}</span>
                      {p.status === "pending" && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleReviewProposal(p.id, "approved")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-[#090e1c] font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" /> Duyệt
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleReviewProposal(p.id, "rejected")}
                            className="px-2 py-1 rounded-lg border border-rose-500/40 text-rose-300 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
