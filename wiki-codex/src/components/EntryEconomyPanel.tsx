"use client";

import React, { useState } from "react";
import {
  ArrowLeftRight,
  BarChart3,
  Check,
  ChevronDown,
  ChevronUp,
  Coins,
  Copy,
  Download,
  Edit3,
  Plus,
  RefreshCw,
  Save,
  Scale,
  Sparkles,
  Trash2,
  TrendingUp,
  Users
} from "lucide-react";
import type {
  CustomMetricBarItem,
  EntryEconomyProfile
} from "@/types/codex";
import {
  WORLD_CURRENCIES,
  convertWorldCurrency,
  createDefaultEconomyProfile,
  generateEconomicSummaryProse,
  normalizeBarsTo100
} from "@/lib/economy-engine";
import { useDeviceUI } from "@/lib/device-ui";

function tierBadgeForScore(score: number): { label: string; cls: string } {
  if (score >= 85) return { label: "Xuất sắc", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40" };
  if (score >= 70) return { label: "Cao · Ổn định", cls: "bg-sky-500/15 text-sky-300 border-sky-500/40" };
  if (score >= 55) return { label: "Trung bình khá", cls: "bg-amber-500/15 text-amber-300 border-amber-500/40" };
  return { label: "Đang phát triển", cls: "bg-rose-500/15 text-rose-300 border-rose-500/40" };
}

/* ==================== COMPACT MINI CARD FOR OVERVIEW TAB ==================== */
export function EconomyOverviewMiniCard({
  profile,
  onOpenEconomyTab,
  onCompare
}: {
  profile: EntryEconomyProfile;
  onOpenEconomyTab: () => void;
  onCompare?: () => void;
}) {
  const literacy = profile.developmentMeters.find((m) => m.id === "dev-literacy")?.score ?? 0;
  const infra = profile.developmentMeters.find((m) => m.id === "dev-infra")?.score ?? 0;
  const stability = profile.developmentMeters.find((m) => m.id === "dev-currency")?.score ?? 0;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-codex-panel/60 to-codex-bg/70 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">
            Tóm lược Kinh tế & Hạ tầng · {profile.currencyCode}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {profile.tradeBalance.balanceLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCompare && (
            <button
              type="button"
              onClick={onCompare}
              className="text-[11px] px-2 py-1 rounded-md border border-codex-border hover:border-codex-gold/60 text-codex-muted hover:text-codex-gold transition-colors flex items-center gap-1"
            >
              <Scale className="w-3 h-3" />
              <span>So sánh</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenEconomyTab}
            className="text-[11px] font-semibold text-codex-gold hover:underline"
          >
            Xem 5 cụm thanh dữ liệu →
          </button>
        </div>
      </div>

      {/* Stacked Sector Bar */}
      <div className="mb-2.5">
        <div className="flex h-3 rounded-full overflow-hidden border border-codex-border/60 bg-codex-bg">
          {profile.sectorBreakdown.map((sec) => (
            <div
              key={sec.id}
              style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
              title={`${sec.label}: ${sec.percentage}%`}
              className="h-full economy-bar-fill"
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[11px] text-codex-muted">
          {profile.sectorBreakdown.map((sec) => (
            <span key={sec.id} className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sec.color }} />
              <span>{sec.label}:</span>
              <strong className="text-codex-text tabular-nums">{sec.percentage}%</strong>
            </span>
          ))}
        </div>
      </div>

      {/* 3 Compact KPI Meters */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-codex-border/50">
        {[
          { label: "Học vấn", val: literacy, color: "#A78BFA" },
          { label: "Hạ tầng", val: infra, color: "#38BDF8" },
          { label: "Ổn định tiền tệ", val: stability, color: "#D4AF37" }
        ].map((k) => (
          <div key={k.label} className="text-xs">
            <div className="flex justify-between text-[11px] mb-0.5">
              <span className="text-codex-muted truncate">{k.label}</span>
              <span className="font-mono font-semibold text-codex-text">{k.val}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-codex-border/50 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${k.val}%`, backgroundColor: k.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== FULL ECONOMY DOSSIER PANEL ==================== */
export function EntryEconomyPanel({
  entryTitle,
  profile,
  canEdit,
  onSaveEconomy,
  onOpenComparator
}: {
  entryTitle: string;
  profile?: EntryEconomyProfile;
  canEdit: boolean;
  onSaveEconomy: (next: EntryEconomyProfile) => Promise<void>;
  onOpenComparator?: () => void;
}) {
  const { isMobile, isTablet } = useDeviceUI();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<EntryEconomyProfile>(() =>
    profile ? structuredClone(profile) : createDefaultEconomyProfile(entryTitle)
  );
  const [proseCopied, setProseCopied] = useState(false);
  const [generatedProse, setGeneratedProse] = useState<string | null>(null);

  // Currency converter widget state (Feature #2)
  const [convAmount, setConvAmount] = useState<number>(100);
  const [convFrom, setConvFrom] = useState<string>(profile?.currencyCode || "AUR");
  const [convTo, setConvTo] = useState<string>(profile?.currencyCode === "AUR" ? "ARG" : "AUR");

  // Mobile Accordion State (open first 2 clusters by default on Mobile)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    sectors: true,
    budget: true,
    development: !isMobile,
    trade: !isMobile,
    demographics: !isMobile
  });

  // New custom metric bar form
  const [newMetricLabel, setNewMetricLabel] = useState("");
  const [newMetricGroup, setNewMetricGroup] = useState("Chỉ số Bổ sung");
  const [newMetricValue, setNewMetricValue] = useState(75);
  const [newMetricColor, setNewMetricColor] = useState("#38BDF8");

  const activeData = editing ? draft : profile;

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const startEdit = () => {
    setDraft(profile ? structuredClone(profile) : createDefaultEconomyProfile(entryTitle));
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const normalized: EntryEconomyProfile = {
        ...draft,
        sectorBreakdown: normalizeBarsTo100(draft.sectorBreakdown),
        budgetAllocation: normalizeBarsTo100(draft.budgetAllocation),
        demographicsBars: normalizeBarsTo100(draft.demographicsBars),
        tradeBalance: {
          ...draft.tradeBalance,
          importsShare: Math.max(0, 100 - draft.tradeBalance.exportsShare)
        }
      };
      await onSaveEconomy(normalized);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleExportInfographicPNG = () => {
    if (!activeData) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 680;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 1200, 680);
    grad.addColorStop(0, "#0b1120");
    grad.addColorStop(1, "#162038");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1200, 680);

    // Border frame
    ctx.strokeStyle = "#d4af37";
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, 1160, 640);

    // Header
    ctx.fillStyle = "#d4af37";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("AETHEL CODEX · HỒ SƠ KINH TẾ & HẠ TẦNG BÁCH KHOA", 48, 62);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 36px Georgia, serif";
    ctx.fillText(entryTitle, 48, 108);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "18px sans-serif";
    ctx.fillText(
      `${activeData.economicTierLabel} · Tiền tệ: ${activeData.currencyName} (${activeData.currencyCode}) · ${activeData.tradeBalance.balanceLabel}`,
      48,
      140
    );

    // Left Column: Sector Breakdown
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("CƠ CẤU NGÀNH KINH TẾ (100%)", 48, 194);
    activeData.sectorBreakdown.forEach((sec, i) => {
      const y = 216 + i * 52;
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "15px sans-serif";
      ctx.fillText(sec.label, 48, y + 14);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 15px monospace";
      ctx.fillText(`${sec.percentage}%`, 510, y + 14);

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(48, y + 22, 500, 14);
      ctx.fillStyle = sec.color;
      ctx.fillRect(48, y + 22, (500 * sec.percentage) / 100, 14);
    });

    // Left Bottom: Budget Allocation
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("PHÂN BỔ NGÂN SÁCH CÔNG (100%)", 48, 456);
    activeData.budgetAllocation.forEach((b, i) => {
      const y = 476 + i * 40;
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "14px sans-serif";
      ctx.fillText(b.label, 48, y + 12);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 14px monospace";
      ctx.fillText(`${b.percentage}%`, 510, y + 12);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(48, y + 18, 500, 10);
      ctx.fillStyle = b.color;
      ctx.fillRect(48, y + 18, (500 * b.percentage) / 100, 10);
    });

    // Right Column: 6 Development Meters
    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 18px sans-serif";
    ctx.fillText("6 CHỈ SỐ PHÁT TRIỂN & HẠ TẦNG", 620, 194);
    activeData.developmentMeters.forEach((m, i) => {
      const y = 216 + i * 56;
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "15px sans-serif";
      ctx.fillText(m.label, 620, y + 14);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 15px monospace";
      ctx.fillText(`${m.score}%`, 1105, y + 14);

      ctx.fillStyle = "#1e293b";
      ctx.fillRect(620, y + 22, 520, 14);
      ctx.fillStyle = m.color;
      ctx.fillRect(620, y + 22, (520 * m.score) / 100, 14);
    });

    // Trade balance summary at bottom right
    ctx.fillStyle = "#34d399";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(
      `CÁN CÂN THƯƠNG MẠI: Xuất khẩu ${activeData.tradeBalance.exportsShare}% · Nhập khẩu ${activeData.tradeBalance.importsShare}%`,
      620,
      588
    );
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px sans-serif";
    ctx.fillText(
      `Xuất khẩu chủ lực: ${activeData.tradeBalance.majorExports.join(", ")}`,
      620,
      616
    );

    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `economy-${entryTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
    a.click();
  };

  if (!activeData) {
    return (
      <div className="rounded-xl border border-dashed border-codex-border p-8 text-center">
        <Coins className="w-10 h-10 text-codex-gold/60 mx-auto mb-3" />
        <h3 className="text-base font-serif font-semibold text-codex-text mb-1">
          Chưa khởi tạo Hồ sơ Kinh tế & Hạ tầng
        </h3>
        <p className="text-xs text-codex-muted max-w-md mx-auto mb-4">
          Bổ sung 5 cụm thanh dữ liệu bách khoa: Cơ cấu ngành, Ngân sách công, 6 Chỉ số Phát triển, Cán cân Xuất–Nhập khẩu và Thanh dữ liệu tùy biến.
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={startEdit}
            className="px-4 py-2 rounded-lg bg-codex-gold text-codex-bg font-semibold text-xs hover:brightness-110 transition-all inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Khởi tạo Hồ sơ Kinh tế Đa Thanh</span>
          </button>
        )}
      </div>
    );
  }

  const convertedVal = convertWorldCurrency(convAmount, convFrom, convTo);

  const renderSectionHeader = (
    key: string,
    title: string,
    icon: React.ReactNode,
    badge?: string
  ) => {
    const isOpen = !isMobile || openGroups[key];
    return (
      <button
        type="button"
        onClick={() => isMobile && toggleGroup(key)}
        className={`w-full flex items-center justify-between gap-2 text-left ${
          isMobile ? "py-1 cursor-pointer" : "cursor-default"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-codex-gold shrink-0">{icon}</span>
          <h4 className="text-sm font-serif font-semibold text-codex-text truncate">{title}</h4>
          {badge && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-codex-gold/15 text-codex-gold font-mono shrink-0">
              {badge}
            </span>
          )}
        </div>
        {isMobile && (
          <span className="text-codex-muted shrink-0">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        )}
      </button>
    );
  };

  const gridColsClass = isMobile
    ? "grid-cols-1"
    : isTablet
    ? "grid-cols-1 md:grid-cols-2"
    : "grid-cols-1 xl:grid-cols-2";

  return (
    <div className="space-y-4">
      {/* Top Action & Executive Summary Banner */}
      <div className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 via-codex-panel/80 to-codex-bg p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Coins className="w-4 h-4" />
                <span>{activeData.economicTierLabel}</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/15 text-amber-300 font-mono">
                {activeData.currencyName} ({activeData.currencyCode})
              </span>
              <span className="text-[11px] text-codex-muted font-mono">
                1 AUR = {activeData.exchangeRateToAurel} {activeData.currencyCode}
              </span>
            </div>
            {activeData.economicOverviewNote && (
              <p className="text-xs text-codex-muted leading-relaxed max-w-3xl">
                {activeData.economicOverviewNote}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onOpenComparator && (
              <button
                type="button"
                onClick={onOpenComparator}
                className="px-2.5 py-1.5 rounded-lg border border-codex-border bg-codex-bg/70 hover:border-codex-gold/60 text-xs text-codex-text flex items-center gap-1.5 transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-codex-gold" />
                <span>So sánh Đa Quốc gia</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const text = generateEconomicSummaryProse(entryTitle, activeData);
                setGeneratedProse(text);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-codex-border bg-codex-bg/70 hover:border-codex-gold/60 text-xs text-codex-text flex items-center gap-1.5 transition-colors"
              title="Tự động tổng hợp đoạn văn bách khoa từ các thanh dữ liệu kinh tế"
            >
              <Sparkles className="w-3.5 h-3.5 text-codex-gold" />
              <span>Sinh tóm tắt</span>
            </button>
            <button
              type="button"
              onClick={handleExportInfographicPNG}
              className="px-2.5 py-1.5 rounded-lg border border-codex-border bg-codex-bg/70 hover:border-codex-gold/60 text-xs text-codex-text flex items-center gap-1.5 transition-colors"
              title="Tải thẻ Infographic Kinh tế độ phân giải cao (PNG)"
            >
              <Download className="w-3.5 h-3.5 text-codex-gold" />
              <span>Xuất PNG</span>
            </button>
            {canEdit && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="px-2.5 py-1.5 rounded-lg bg-codex-gold/15 border border-codex-gold/50 text-codex-gold hover:bg-codex-gold/25 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sửa thanh dữ liệu</span>
              </button>
            )}
            {editing && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-2.5 py-1.5 rounded-lg border border-codex-border text-xs text-codex-muted hover:text-codex-text"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-3 py-1.5 rounded-lg bg-codex-gold text-codex-bg font-semibold text-xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Auto-Generated Economic Summary Prose Box (Feature #10) */}
        {generatedProse && (
          <div className="mt-3 p-3 rounded-lg bg-codex-bg/80 border border-codex-gold/40 text-xs text-codex-text leading-relaxed">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-codex-gold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đoạn tóm tắt Kinh tế Bách khoa (Tự động sinh)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedProse);
                  setProseCopied(true);
                  setTimeout(() => setProseCopied(false), 1800);
                }}
                className="px-2 py-0.5 rounded bg-codex-gold/15 text-codex-gold hover:bg-codex-gold/25 flex items-center gap-1"
              >
                {proseCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{proseCopied ? "Đã chép" : "Sao chép Markdown"}</span>
              </button>
            </div>
            <p>{generatedProse.replace(/\*\*/g, "")}</p>
          </div>
        )}
      </div>

      {/* Main Responsive Multi-Bar Grid */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {/* CLUSTER 1: Sector Breakdown (100%) */}
        <div className="rounded-xl border border-codex-border/80 bg-codex-panel/50 p-4 space-y-3">
          {renderSectionHeader("sectors", "1. Cơ cấu Ngành Kinh tế", <BarChart3 className="w-4 h-4" />, "100%")}
          {(!isMobile || openGroups.sectors) && (
            <>
              <div className="flex h-3.5 rounded-full overflow-hidden border border-codex-border/60 bg-codex-bg">
                {activeData.sectorBreakdown.map((sec) => (
                  <div
                    key={sec.id}
                    style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
                    className="h-full economy-bar-fill"
                    title={`${sec.label}: ${sec.percentage}%`}
                  />
                ))}
              </div>
              <div className="space-y-2.5">
                {activeData.sectorBreakdown.map((sec, idx) => (
                  <div key={sec.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-codex-text flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                        <span>{sec.label}</span>
                      </span>
                      <span className="font-mono font-bold text-codex-text tabular-nums">{sec.percentage}%</span>
                    </div>
                    {editing ? (
                      <input
                        type="range"
                        min={1}
                        max={85}
                        value={sec.percentage}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setDraft((d) => ({
                            ...d,
                            sectorBreakdown: d.sectorBreakdown.map((item, i) =>
                              i === idx ? { ...item, percentage: v } : item
                            )
                          }));
                        }}
                        className="w-full accent-amber-400"
                      />
                    ) : (
                      <div className="h-2 rounded-full bg-codex-bg/80 overflow-hidden">
                        <div
                          className="h-full rounded-full economy-bar-fill"
                          style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
                        />
                      </div>
                    )}
                    {sec.note && <div className="text-[11px] text-codex-muted">{sec.note}</div>}
                  </div>
                ))}
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, sectorBreakdown: normalizeBarsTo100(d.sectorBreakdown) }))
                  }
                  className="text-[11px] px-2.5 py-1 rounded-md border border-codex-gold/40 text-codex-gold hover:bg-codex-gold/10 inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tự cân bằng tổng về 100%</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* CLUSTER 2: Budget Allocation (100%) */}
        <div className="rounded-xl border border-codex-border/80 bg-codex-panel/50 p-4 space-y-3">
          {renderSectionHeader("budget", "2. Phân bổ Ngân sách Công", <Scale className="w-4 h-4" />, "100%")}
          {(!isMobile || openGroups.budget) && (
            <>
              <div className="flex h-3.5 rounded-full overflow-hidden border border-codex-border/60 bg-codex-bg">
                {activeData.budgetAllocation.map((b) => (
                  <div
                    key={b.id}
                    style={{ width: `${b.percentage}%`, backgroundColor: b.color }}
                    className="h-full economy-bar-fill"
                    title={`${b.label}: ${b.percentage}%`}
                  />
                ))}
              </div>
              <div className="space-y-2.5">
                {activeData.budgetAllocation.map((b, idx) => (
                  <div key={b.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-codex-text flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span>{b.label}</span>
                      </span>
                      <span className="font-mono font-bold text-codex-text tabular-nums">{b.percentage}%</span>
                    </div>
                    {editing ? (
                      <input
                        type="range"
                        min={1}
                        max={85}
                        value={b.percentage}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setDraft((d) => ({
                            ...d,
                            budgetAllocation: d.budgetAllocation.map((item, i) =>
                              i === idx ? { ...item, percentage: v } : item
                            )
                          }));
                        }}
                        className="w-full accent-sky-400"
                      />
                    ) : (
                      <div className="h-2 rounded-full bg-codex-bg/80 overflow-hidden">
                        <div
                          className="h-full rounded-full economy-bar-fill"
                          style={{ width: `${b.percentage}%`, backgroundColor: b.color }}
                        />
                      </div>
                    )}
                    {b.note && <div className="text-[11px] text-codex-muted">{b.note}</div>}
                  </div>
                ))}
              </div>
              {editing && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, budgetAllocation: normalizeBarsTo100(d.budgetAllocation) }))
                  }
                  className="text-[11px] px-2.5 py-1 rounded-md border border-codex-gold/40 text-codex-gold hover:bg-codex-gold/10 inline-flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Tự cân bằng tổng về 100%</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* CLUSTER 3: 6 Development & Infrastructure Meters */}
      <div className="rounded-xl border border-codex-border/80 bg-codex-panel/50 p-4 space-y-3">
        {renderSectionHeader(
          "development",
          "3. Bộ 6 Thanh Chỉ số Phát triển & Hạ tầng Dân sinh",
          <TrendingUp className="w-4 h-4" />,
          "0–100%"
        )}
        {(!isMobile || openGroups.development) && (
          <div className={`grid ${isMobile ? "grid-cols-1" : isTablet ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"} gap-3`}>
            {activeData.developmentMeters.map((m, idx) => {
              const tier = tierBadgeForScore(m.score);
              return (
                <div
                  key={m.id}
                  className="rounded-lg border border-codex-border/70 bg-codex-bg/60 p-3 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-codex-text leading-snug">{m.label}</span>
                    <span className="text-sm font-mono font-bold tabular-nums" style={{ color: m.color }}>
                      {m.score}
                      {m.unit || "%"}
                    </span>
                  </div>
                  {editing ? (
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={m.score}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setDraft((d) => ({
                          ...d,
                          developmentMeters: d.developmentMeters.map((item, i) =>
                            i === idx ? { ...item, score: v } : item
                          )
                        }));
                      }}
                      className="w-full accent-purple-400"
                    />
                  ) : (
                    <div className="h-2.5 rounded-full bg-codex-border/50 overflow-hidden">
                      <div
                        className="h-full rounded-full economy-bar-fill"
                        style={{ width: `${m.score}%`, backgroundColor: m.color }}
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${tier.cls}`}>
                      {tier.label}
                    </span>
                    {m.note && (
                      <span className="text-[10px] text-codex-muted truncate max-w-[160px]" title={m.note}>
                        {m.note}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CLUSTER 4 + 5: Trade Balance + Currency Converter & Demographics + Custom Bars */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {/* CLUSTER 4: Trade Balance + World Currency Converter */}
        <div className="rounded-xl border border-codex-border/80 bg-codex-panel/50 p-4 space-y-3.5">
          {renderSectionHeader(
            "trade",
            "4. Cán cân Xuất – Nhập khẩu & Quy đổi Tiền tệ",
            <ArrowLeftRight className="w-4 h-4" />,
            activeData.tradeBalance.balanceLabel
          )}
          {(!isMobile || openGroups.trade) && (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-semibold">
                    Xuất khẩu: {activeData.tradeBalance.exportsShare}%
                  </span>
                  <span className="text-sky-400 font-semibold">
                    Nhập khẩu: {100 - activeData.tradeBalance.exportsShare}%
                  </span>
                </div>
                {editing ? (
                  <input
                    type="range"
                    min={15}
                    max={85}
                    value={activeData.tradeBalance.exportsShare}
                    onChange={(e) => {
                      const ex = Number(e.target.value);
                      const im = 100 - ex;
                      setDraft((d) => ({
                        ...d,
                        tradeBalance: {
                          ...d.tradeBalance,
                          exportsShare: ex,
                          importsShare: im,
                          balanceLabel:
                            ex >= 54 ? "Thặng dư thương mại" : ex <= 46 ? "Nhập siêu đầu tư hạ tầng" : "Cân bằng ổn định"
                        }
                      }));
                    }}
                    className="w-full accent-emerald-400"
                  />
                ) : (
                  <div className="flex h-3.5 rounded-full overflow-hidden border border-codex-border/60">
                    <div
                      className="bg-emerald-500 h-full economy-bar-fill"
                      style={{ width: `${activeData.tradeBalance.exportsShare}%` }}
                    />
                    <div
                      className="bg-sky-500 h-full economy-bar-fill"
                      style={{ width: `${100 - activeData.tradeBalance.exportsShare}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/25 p-2.5">
                  <div className="text-[11px] font-semibold text-emerald-300 mb-1">Xuất khẩu chủ lực</div>
                  <div className="flex flex-wrap gap-1">
                    {activeData.tradeBalance.majorExports.map((item) => (
                      <span key={item} className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-codex-text">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg bg-sky-500/5 border border-sky-500/25 p-2.5">
                  <div className="text-[11px] font-semibold text-sky-300 mb-1">Nhập khẩu thiết yếu</div>
                  <div className="flex flex-wrap gap-1">
                    {activeData.tradeBalance.majorImports.map((item) => (
                      <span key={item} className="text-[11px] px-2 py-0.5 rounded bg-sky-500/15 text-codex-text">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature #2: Embedded World Currency Converter */}
              <div className="rounded-lg border border-codex-gold/30 bg-codex-bg/70 p-3 space-y-2">
                <div className="text-[11px] font-semibold text-codex-gold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Bộ Quy đổi Tiền tệ Hành tinh (9 Châu lục)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    value={convAmount}
                    onChange={(e) => setConvAmount(Math.max(0, Number(e.target.value)))}
                    className="px-2.5 py-1.5 rounded-lg bg-codex-panel border border-codex-border text-xs font-mono text-codex-text"
                  />
                  <select
                    value={convFrom}
                    onChange={(e) => setConvFrom(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-codex-panel border border-codex-border text-xs text-codex-text"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={convTo}
                    onChange={(e) => setConvTo(e.target.value)}
                    className="px-2 py-1.5 rounded-lg bg-codex-panel border border-codex-border text-xs text-codex-text"
                  >
                    {WORLD_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-codex-muted">Kết quả quy đổi:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {convAmount.toLocaleString("vi-VN")} {convFrom} = {convertedVal.toLocaleString("vi-VN")} {convTo}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* CLUSTER 5: Demographics & Urbanization + Unlimited Custom Metric Bars */}
        <div className="rounded-xl border border-codex-border/80 bg-codex-panel/50 p-4 space-y-3.5">
          {renderSectionHeader(
            "demographics",
            "5. Cơ cấu Xã hội, Đô thị hóa & Thanh Tùy biến",
            <Users className="w-4 h-4" />,
            `${(activeData.customMetricBars?.length ?? 0) + activeData.demographicsBars.length} thanh`
          )}
          {(!isMobile || openGroups.demographics) && (
            <>
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-codex-muted">
                  Phân bố Cư dân & Đô thị hóa (100%)
                </div>
                <div className="flex h-3 rounded-full overflow-hidden border border-codex-border/60 bg-codex-bg">
                  {activeData.demographicsBars.map((d) => (
                    <div
                      key={d.id}
                      style={{ width: `${d.percentage}%`, backgroundColor: d.color }}
                      className="h-full economy-bar-fill"
                    />
                  ))}
                </div>
                <div className="space-y-1.5">
                  {activeData.demographicsBars.map((d, idx) => (
                    <div key={d.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-codex-text">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span>{d.label}</span>
                        </span>
                        <span className="font-mono font-semibold tabular-nums">{d.percentage}%</span>
                      </div>
                      {editing && (
                        <input
                          type="range"
                          min={5}
                          max={85}
                          value={d.percentage}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setDraft((prev) => ({
                              ...prev,
                              demographicsBars: prev.demographicsBars.map((item, i) =>
                                i === idx ? { ...item, percentage: v } : item
                              )
                            }));
                          }}
                          className="w-full accent-blue-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Unlimited Custom Metric Bars */}
              <div className="pt-3 border-t border-codex-border/60 space-y-2.5">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-codex-muted">
                  Thanh Dữ liệu Tùy biến ({activeData.customMetricBars?.length ?? 0})
                </div>
                {(activeData.customMetricBars ?? []).length === 0 && (
                  <p className="text-xs text-codex-muted italic">
                    Chưa có thanh tùy biến. Bấm &quot;Sửa thanh dữ liệu&quot; để thêm thanh bất kỳ.
                  </p>
                )}
                {(activeData.customMetricBars ?? []).map((cm) => (
                  <div key={cm.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <span className="text-[10px] text-codex-gold mr-1.5">[{cm.group}]</span>
                        <span className="font-medium text-codex-text">{cm.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-bold tabular-nums" style={{ color: cm.color }}>
                          {cm.value}
                          {cm.unit || "%"}
                        </span>
                        {editing && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                customMetricBars: (d.customMetricBars ?? []).filter((x) => x.id !== cm.id)
                              }))
                            }
                            className="text-rose-400 hover:text-rose-300"
                            title="Xóa thanh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-codex-bg/80 overflow-hidden">
                      <div
                        className="h-full rounded-full economy-bar-fill"
                        style={{ width: `${Math.min(100, Math.max(0, cm.value))}%`, backgroundColor: cm.color }}
                      />
                    </div>
                    {cm.note && <div className="text-[10px] text-codex-muted">{cm.note}</div>}
                  </div>
                ))}

                {editing && (
                  <div className="rounded-lg border border-dashed border-codex-gold/40 bg-codex-bg/50 p-2.5 space-y-2">
                    <div className="text-[11px] font-semibold text-codex-gold">+ Thêm Thanh Dữ liệu Mới</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Tên thanh (VD: Tỷ lệ bảo tồn cổ thư)"
                        value={newMetricLabel}
                        onChange={(e) => setNewMetricLabel(e.target.value)}
                        className="px-2.5 py-1.5 rounded bg-codex-panel border border-codex-border text-xs text-codex-text"
                      />
                      <input
                        type="text"
                        placeholder="Nhóm (VD: Văn hóa, Hạ tầng)"
                        value={newMetricGroup}
                        onChange={(e) => setNewMetricGroup(e.target.value)}
                        className="px-2.5 py-1.5 rounded bg-codex-panel border border-codex-border text-xs text-codex-text"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={newMetricValue}
                        onChange={(e) => setNewMetricValue(Number(e.target.value))}
                        className="flex-1 accent-amber-400"
                      />
                      <span className="text-xs font-mono w-10 text-right">{newMetricValue}%</span>
                      <input
                        type="color"
                        value={newMetricColor}
                        onChange={(e) => setNewMetricColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newMetricLabel.trim()) return;
                          const item: CustomMetricBarItem = {
                            id: `cm-${Date.now()}`,
                            group: newMetricGroup.trim() || "Bổ sung",
                            label: newMetricLabel.trim(),
                            value: newMetricValue,
                            unit: "%",
                            color: newMetricColor
                          };
                          setDraft((d) => ({
                            ...d,
                            customMetricBars: [...(d.customMetricBars ?? []), item]
                          }));
                          setNewMetricLabel("");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-codex-gold/20 text-codex-gold hover:bg-codex-gold/30 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
