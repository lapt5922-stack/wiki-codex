"use client";

import React, { useEffect, useState } from "react";
import { Coins, Plus, Scale, X } from "lucide-react";
import type { Entry, EntryCardProjection } from "@/types/codex";
import { EntityEmblemSVG } from "./EntityVisualWidgets";

export function MultiNationEconomyComparatorModal({
  open,
  onClose,
  initialEntryId,
  allCards
}: {
  open: boolean;
  onClose: () => void;
  initialEntryId?: string | null;
  allCards: EntryCardProjection[];
}) {
  const econCards = React.useMemo(
    () => allCards.filter((c) => !c.deletedAt && c.economySummary),
    [allCards]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadedEntries, setLoadedEntries] = useState<Record<string, Entry>>({});
  const [pickerValue, setPickerValue] = useState("");

  useEffect(() => {
    if (!open) return;
    if (selectedIds.length === 0) {
      const defaults: string[] = [];
      if (initialEntryId && econCards.some((c) => c.id === initialEntryId)) {
        defaults.push(initialEntryId);
      }
      for (const c of econCards) {
        if (defaults.length >= 3) break;
        if (!defaults.includes(c.id)) defaults.push(c.id);
      }
      setSelectedIds(defaults);
    }
  }, [open, initialEntryId, econCards, selectedIds.length]);

  useEffect(() => {
    if (!open) return;
    const missing = selectedIds.filter((id) => !loadedEntries[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(
      missing.map((id) =>
        fetch(`/api/entries/${encodeURIComponent(id)}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => (d?.entry ? ([id, d.entry] as const) : null))
          .catch(() => null)
      )
    ).then((pairs) => {
      if (cancelled) return;
      const next: Record<string, Entry> = {};
      for (const p of pairs) {
        if (p) next[p[0]] = p[1];
      }
      if (Object.keys(next).length > 0) {
        setLoadedEntries((prev) => ({ ...prev, ...next }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, selectedIds, loadedEntries]);

  if (!open) return null;

  const comparedEntries = selectedIds
    .map((id) => loadedEntries[id])
    .filter((e): e is Entry => Boolean(e && e.economyProfile));

  const devMetricLabels =
    comparedEntries[0]?.economyProfile?.developmentMeters.map((m) => ({
      id: m.id,
      label: m.label,
      color: m.color
    })) ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl max-h-[90vh] rounded-2xl border border-codex-gold/40 bg-codex-bg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-codex-border flex flex-wrap items-center justify-between gap-3 bg-codex-panel/60">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-codex-gold" />
            <div>
              <h2 className="text-base font-serif font-bold text-codex-text">
                So sánh Kinh tế & Chỉ số Đa Quốc gia
              </h2>
              <p className="text-xs text-codex-muted">
                Đối chiếu trực tiếp cơ cấu ngành, ngân sách, 6 chỉ số phát triển và cán cân thương mại (tối đa 4 thực thể).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-codex-panel text-codex-muted hover:text-codex-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-codex-border/70 flex flex-wrap items-center gap-2 bg-codex-panel/30">
          {selectedIds.map((id) => {
            const card = econCards.find((c) => c.id === id);
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-codex-gold/15 border border-codex-gold/40 text-xs text-codex-gold"
              >
                <span>{card?.sigil || "✦"}</span>
                <span className="max-w-[160px] truncate font-medium">{card?.title || id}</span>
                {selectedIds.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setSelectedIds((prev) => prev.filter((x) => x !== id))}
                    className="hover:text-rose-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })}

          {selectedIds.length < 4 && (
            <div className="flex items-center gap-1.5 ml-auto">
              <select
                value={pickerValue}
                onChange={(e) => setPickerValue(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-codex-panel border border-codex-border text-xs text-codex-text max-w-[220px]"
              >
                <option value="">+ Chọn thực thể để thêm...</option>
                {econCards
                  .filter((c) => !selectedIds.includes(c.id))
                  .slice(0, 120)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.economySummary?.currencyCode})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!pickerValue}
                onClick={() => {
                  if (!pickerValue) return;
                  setSelectedIds((prev) => [...prev, pickerValue]);
                  setPickerValue("");
                }}
                className="px-2.5 py-1.5 rounded-lg bg-codex-gold text-codex-bg text-xs font-semibold disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </div>
          )}
        </div>

        {/* Comparison Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {comparedEntries.length === 0 ? (
            <div className="text-center py-12 text-sm text-codex-muted">Đang tải dữ liệu kinh tế...</div>
          ) : (
            <>
              {/* Entity Summary Headers */}
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${comparedEntries.length}, minmax(180px, 1fr))` }}
              >
                {comparedEntries.map((ent) => (
                  <div
                    key={ent.id}
                    className="rounded-xl border border-codex-border bg-codex-panel/50 p-3 flex items-center gap-3"
                  >
                    <EntityEmblemSVG config={ent.emblemConfig} sigil={ent.sigil} size={44} />
                    <div className="min-w-0">
                      <div className="text-sm font-serif font-bold text-codex-text truncate">{ent.title}</div>
                      <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        <span>{ent.economyProfile?.currencyCode}</span>
                        <span>·</span>
                        <span>{ent.economyProfile?.tradeBalance.balanceLabel}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 6 Development Meters Side-by-Side */}
              <div className="rounded-xl border border-codex-border/80 bg-codex-panel/40 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-codex-gold">
                  Đối chiếu 6 Chỉ số Phát triển & Hạ tầng (0–100%)
                </h3>
                <div className="space-y-3">
                  {devMetricLabels.map((metric) => {
                    const scores = comparedEntries.map(
                      (e) => e.economyProfile?.developmentMeters.find((m) => m.id === metric.id)?.score ?? 0
                    );
                    const maxScore = Math.max(...scores);
                    return (
                      <div key={metric.id} className="space-y-1.5">
                        <div className="text-xs font-medium text-codex-text">{metric.label}</div>
                        <div className="space-y-1">
                          {comparedEntries.map((ent, idx) => {
                            const s = scores[idx];
                            const isLead = s === maxScore && comparedEntries.length > 1;
                            return (
                              <div key={ent.id} className="flex items-center gap-2 text-xs">
                                <span className="w-36 truncate text-codex-muted">{ent.title}</span>
                                <div className="flex-1 h-2.5 rounded-full bg-codex-bg overflow-hidden">
                                  <div
                                    className="h-full rounded-full economy-bar-fill"
                                    style={{
                                      width: `${s}%`,
                                      backgroundColor: metric.color,
                                      opacity: isLead ? 1 : 0.65
                                    }}
                                  />
                                </div>
                                <span
                                  className={`w-12 text-right font-mono tabular-nums ${
                                    isLead ? "text-codex-gold font-bold" : "text-codex-text"
                                  }`}
                                >
                                  {s}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sector Breakdown Stacked Comparison */}
              <div className="rounded-xl border border-codex-border/80 bg-codex-panel/40 p-4 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-codex-gold">
                  So sánh Cơ cấu Ngành Kinh tế (100%)
                </h3>
                <div className="space-y-3">
                  {comparedEntries.map((ent) => (
                    <div key={ent.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-codex-text">{ent.title}</span>
                        <span className="text-[11px] text-codex-muted">
                          Xuất khẩu {ent.economyProfile?.tradeBalance.exportsShare}% / Nhập khẩu{" "}
                          {ent.economyProfile?.tradeBalance.importsShare}%
                        </span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden border border-codex-border/60">
                        {ent.economyProfile?.sectorBreakdown.map((sec) => (
                          <div
                            key={sec.id}
                            style={{ width: `${sec.percentage}%`, backgroundColor: sec.color }}
                            title={`${sec.label}: ${sec.percentage}%`}
                            className="h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950/90"
                          >
                            {sec.percentage >= 14 ? `${sec.percentage}%` : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-codex-muted">
                    {comparedEntries[0]?.economyProfile?.sectorBreakdown.map((sec) => (
                      <span key={sec.id} className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.color }} />
                        <span>{sec.label}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
