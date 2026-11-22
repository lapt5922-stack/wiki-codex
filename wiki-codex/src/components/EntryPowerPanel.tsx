"use client";

import React, { useState } from "react";
import {
  Award,
  Copy,
  Gauge,
  Infinity as InfinityIcon,
  Plus,
  Printer,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  X
} from "lucide-react";
import type {
  ConlangLanguage,
  EntityAbility,
  EntityFeat,
  Entry,
  EntryAttribute,
  PowerHistoryPoint
} from "@/types/codex";
import {
  classifyPowerTier,
  computeRadarPolygonPoints,
  createCharacterAttributePreset,
  createKingdomAttributePreset,
  formatUnboundedPower
} from "@/lib/v3-engines";
import { translateVietnameseToConlang } from "@/lib/conlang";

interface EntryPowerPanelProps {
  entry: Entry;
  canEdit: boolean;
  onPatch: (patch: Record<string, unknown>, changeSummary: string) => Promise<void>;
}

export function EntryPowerPanel({
  entry,
  canEdit,
  onPatch
}: EntryPowerPanelProps) {
  const [powerInput, setPowerInput] = useState(
    entry.powerLevel !== undefined ? String(entry.powerLevel) : ""
  );
  const [powerInf, setPowerInf] = useState(Boolean(entry.powerInfinite));
  const [powerSource, setPowerSource] = useState(entry.powerSourceLabel || "");
  const [attrs, setAttrs] = useState<EntryAttribute[]>(entry.attributes || []);

  React.useEffect(() => {
    setPowerInput(entry.powerLevel !== undefined ? String(entry.powerLevel) : "");
    setPowerInf(Boolean(entry.powerInfinite));
    setPowerSource(entry.powerSourceLabel || "");
    setAttrs(entry.attributes || []);
  }, [entry.id, entry.updatedAt, entry.powerLevel, entry.powerInfinite, entry.powerSourceLabel, entry.attributes]);

  // New attribute form
  const [newAttrLabel, setNewAttrLabel] = useState("");
  const [newAttrVal, setNewAttrVal] = useState(100);
  const [newAttrColor, setNewAttrColor] = useState("#D4AF37");
  const [newAttrSigil, setNewAttrSigil] = useState("✦");

  // New power history point
  const [phEra, setPhEra] = useState("");
  const [phYear, setPhYear] = useState("");
  const [phVal, setPhVal] = useState(1000);

  // New ability & feat
  const [abName, setAbName] = useState("");
  const [abCat, setAbCat] = useState("Học thuật");
  const [abRank, setAbRank] = useState("Đại sư");
  const [abDesc, setAbDesc] = useState("");

  const [ftTitle, setFtTitle] = useState("");
  const [ftYear, setFtYear] = useState("");
  const [ftDesc, setFtDesc] = useState("");

  const [saving, setSaving] = useState(false);

  const numericPower = powerInput.trim() === "" ? undefined : Number(powerInput);
  const tier = classifyPowerTier(numericPower, powerInf, entry.powerTierOverride);
  const radar = computeRadarPolygonPoints(attrs, 150, 150, 96);

  async function savePowerAndAttrs(nextAttrs = attrs, nextPower = numericPower, nextInf = powerInf) {
    setSaving(true);
    try {
      await onPatch(
        {
          powerLevel: Number.isFinite(nextPower) ? nextPower : undefined,
          powerInfinite: nextInf,
          powerSourceLabel: powerSource.trim(),
          attributes: nextAttrs
        },
        "Cập nhật Power Level & Bộ Chỉ số thực thể"
      );
    } finally {
      setSaving(false);
    }
  }

  function updateAttrValue(id: string, val: number) {
    const safeVal = Number.isFinite(val) ? val : 0;
    setAttrs((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              value: safeVal,
              sliderMax: Math.max(a.sliderMax, Math.abs(safeVal) > a.sliderMax ? Math.ceil(Math.abs(safeVal) * 1.25) : a.sliderMax)
            }
          : a
      )
    );
  }

  async function addAttribute(e: React.FormEvent) {
    e.preventDefault();
    if (!newAttrLabel.trim()) return;
    const next: EntryAttribute[] = [
      ...attrs,
      {
        id: `attr-${Date.now()}`,
        key: newAttrLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_") || "stat",
        label: newAttrLabel.trim(),
        value: newAttrVal,
        sliderMax: Math.max(100, Math.ceil(Math.abs(newAttrVal) * 1.5)),
        color: newAttrColor,
        sigil: newAttrSigil || "✦"
      }
    ];
    setAttrs(next);
    setNewAttrLabel("");
    await savePowerAndAttrs(next);
  }

  async function removeAttribute(id: string) {
    const next = attrs.filter((a) => a.id !== id);
    setAttrs(next);
    await savePowerAndAttrs(next);
  }

  async function applyPreset(kind: "character" | "kingdom") {
    const next =
      kind === "character"
        ? createCharacterAttributePreset()
        : createKingdomAttributePreset();
    setAttrs(next);
    await savePowerAndAttrs(next);
  }

  async function addPowerHistory(e: React.FormEvent) {
    e.preventDefault();
    if (!phEra.trim()) return;
    const next: PowerHistoryPoint[] = [
      ...(entry.powerHistory || []),
      { id: `ph-${Date.now()}`, eraLabel: phEra.trim(), yearLabel: phYear.trim(), powerLevel: phVal }
    ];
    await onPatch({ powerHistory: next }, `Thêm mốc Power Level: ${phEra}`);
    setPhEra("");
    setPhYear("");
  }

  async function addAbility(e: React.FormEvent) {
    e.preventDefault();
    if (!abName.trim()) return;
    const next: EntityAbility[] = [
      ...(entry.abilities || []),
      { id: `ab-${Date.now()}`, name: abName.trim(), category: abCat, rank: abRank, sigil: "✦", description: abDesc.trim() }
    ];
    await onPatch({ abilities: next }, `Thêm năng lực Lore: ${abName}`);
    setAbName("");
    setAbDesc("");
  }

  async function addFeat(e: React.FormEvent) {
    e.preventDefault();
    if (!ftTitle.trim()) return;
    const next: EntityFeat[] = [
      ...(entry.feats || []),
      { id: `ft-${Date.now()}`, title: ftTitle.trim(), yearLabel: ftYear.trim(), description: ftDesc.trim() }
    ];
    await onPatch({ feats: next }, `Thêm kỳ tích lịch sử: ${ftTitle}`);
    setFtTitle("");
    setFtYear("");
    setFtDesc("");
  }

  return (
    <div className="space-y-6">
      {/* Unbounded Power Level Header Card */}
      <div
        className="rounded-2xl border p-5 space-y-4"
        style={{
          borderColor: `${tier.color}66`,
          background: `radial-gradient(circle at 85% 20%, ${tier.color}22, transparent 60%), var(--bg-base)`
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5" style={{ color: tier.color }} />
              Mức Sức Mạnh & Tầm Ảnh Hưởng (Power Level — Không giới hạn)
            </div>
            <div className="flex flex-wrap items-baseline gap-3 mt-1">
              <span
                className="font-mono text-3xl sm:text-4xl font-extrabold tracking-tight"
                style={{ color: tier.color }}
              >
                {formatUnboundedPower(numericPower, powerInf)}
              </span>
              <span
                className="px-3 py-0.5 rounded-full border text-xs font-bold"
                style={{
                  borderColor: `${tier.color}88`,
                  backgroundColor: `${tier.color}22`,
                  color: tier.color
                }}
              >
                {tier.code} · {tier.label}
              </span>
            </div>
            {powerSource && (
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                Nguồn gốc: <em>{powerSource}</em>
              </div>
            )}
          </div>

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="number"
                step="any"
                disabled={powerInf}
                value={powerInput}
                onChange={(e) => setPowerInput(e.target.value)}
                placeholder="Nhập số vô hạn (VD: 1250000)"
                className="w-44 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono"
              />
              <button
                type="button"
                onClick={() => setPowerInf((v) => !v)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                  powerInf
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
                title="Đặt mức sức mạnh Vô Hạn (∞)"
              >
                <InfinityIcon className="w-3.5 h-3.5" /> ∞
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => savePowerAndAttrs()}
                className="px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer"
              >
                {saving ? "Đang lưu..." : "Lưu chỉ số"}
              </button>
            </div>
          )}
        </div>

        {canEdit && (
          <input
            type="text"
            value={powerSource}
            onChange={(e) => setPowerSource(e.target.value)}
            placeholder="Mô tả nguồn gốc sức mạnh (VD: Minh triết Cổ ngữ, Quốc lực Thương mại...)"
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 px-3 py-1.5 text-xs"
          />
        )}
      </div>

      {/* Unbounded Attribute Sliders + SVG Radar Chart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Unbounded Sliders & Direct Numeric Inputs */}
        <div className="xl:col-span-7 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base text-[var(--accent)]">
              ✦ Bộ Chỉ số Thuộc tính (Thanh trượt + Số Không Giới Hạn)
            </h3>
            {canEdit && (
              <div className="flex gap-1.5 text-[11px]">
                <button type="button" onClick={() => applyPreset("character")} className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer">
                  Nạp mẫu Nhân vật
                </button>
                <button type="button" onClick={() => applyPreset("kingdom")} className="px-2 py-1 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent)] cursor-pointer">
                  Nạp mẫu Vương quốc
                </button>
              </div>
            )}
          </div>

          {attrs.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Chưa có chỉ số nào. Hãy bấm “Nạp mẫu Nhân vật” / “Nạp mẫu Vương quốc” hoặc tự thêm bên dưới.
            </p>
          ) : (
            <div className="space-y-2.5">
              {attrs.map((a) => {
                const effectiveMax = Math.max(a.sliderMax || 100, Math.abs(a.value), 100);
                const pct = Math.min(100, Math.max(2, (Math.max(0, a.value) / effectiveMax) * 100));
                return (
                  <div
                    key={a.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span style={{ color: a.color }}>{a.sigil}</span>
                        <span>{a.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        {canEdit ? (
                          <input
                            type="number"
                            step="any"
                            value={a.value}
                            onChange={(e) => updateAttrValue(a.id, Number(e.target.value))}
                            className="w-28 text-right rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono font-bold text-xs"
                            style={{ color: a.color }}
                          />
                        ) : (
                          <span className="font-mono font-bold text-sm" style={{ color: a.color }}>
                            {formatUnboundedPower(a.value)}
                          </span>
                        )}
                        {canEdit && (
                          <button type="button" onClick={() => removeAttribute(a.id)} className="text-rose-400 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {canEdit ? (
                      <input
                        type="range"
                        min={0}
                        max={effectiveMax}
                        value={Math.max(0, a.value)}
                        onChange={(e) => updateAttrValue(a.id, Number(e.target.value))}
                        className="w-full h-1.5 rounded-lg cursor-pointer"
                        style={{ accentColor: a.color }}
                      />
                    ) : (
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: a.color }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canEdit && (
            <form onSubmit={addAttribute} className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-xs">
              <input type="text" required value={newAttrLabel} onChange={(e) => setNewAttrLabel(e.target.value)} placeholder="Tên chỉ số mới *" className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              <input type="number" step="any" value={newAttrVal} onChange={(e) => setNewAttrVal(Number(e.target.value))} placeholder="Giá trị" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 font-mono" />
              <div className="flex gap-1">
                <input type="text" value={newAttrSigil} onChange={(e) => setNewAttrSigil(e.target.value)} maxLength={2} className="w-10 text-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]" />
                <input type="color" value={newAttrColor} onChange={(e) => setNewAttrColor(e.target.value)} className="flex-1 h-8 rounded-lg bg-transparent cursor-pointer" />
              </div>
              <button type="submit" className="col-span-2 sm:col-span-1 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 cursor-pointer">
                + Chỉ số
              </button>
            </form>
          )}
        </div>

        {/* Right: SVG Attribute Radar Chart */}
        <div className="xl:col-span-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 p-4 flex flex-col items-center">
          <div className="text-xs font-semibold text-[var(--accent)] mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Biểu đồ Radar Thuộc tính
            {radar.usesLogScale && (
              <span className="font-mono text-[10px] text-[var(--text-muted)]">(Thang Logarit)</span>
            )}
          </div>
          {attrs.length >= 3 ? (
            <svg viewBox="0 0 300 300" className="w-full max-w-[290px] h-auto">
              {/* Web rings */}
              {[0.25, 0.5, 0.75, 1].map((r) => (
                <circle
                  key={r}
                  cx={150}
                  cy={150}
                  r={96 * r}
                  fill="none"
                  stroke="rgba(212,175,55,0.18)"
                  strokeDasharray={r < 1 ? "3 3" : undefined}
                />
              ))}
              {/* Axes */}
              {radar.points.map((p, idx) => (
                <line
                  key={idx}
                  x1={150}
                  y1={150}
                  x2={150 + (p.labelX - 150) * 0.8}
                  y2={150 + (p.labelY - 150) * 0.8}
                  stroke="rgba(212,175,55,0.2)"
                />
              ))}
              {/* Filled Radar Polygon */}
              <polygon
                points={radar.polygonString}
                fill={`${tier.color}33`}
                stroke={tier.color}
                strokeWidth={2.5}
              />
              {/* Vertex dots & labels */}
              {radar.points.map((p) => (
                <g key={p.attr.id}>
                  <circle cx={p.x} cy={p.y} r={4} fill={p.attr.color} stroke="#090e1c" strokeWidth={1.5} />
                  <text
                    x={p.labelX}
                    y={p.labelY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="var(--text-secondary)"
                    fontSize="10"
                  >
                    {p.attr.sigil} {p.attr.label.split(" ")[0]}
                  </text>
                </g>
              ))}
            </svg>
          ) : (
            <p className="text-xs text-[var(--text-muted)] py-12 text-center">
              Cần ít nhất 3 chỉ số để vẽ biểu đồ Radar đa giác.
            </p>
          )}
        </div>
      </div>

      {/* Power Progression History */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 space-y-3">
        <div className="text-xs font-semibold text-[var(--accent)] flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" /> Biến thiên Power Level theo Giai đoạn Thời kỳ
        </div>
        {(entry.powerHistory || []).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(entry.powerHistory || []).map((pt) => (
              <div key={pt.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 p-3">
                <div className="text-[11px] font-mono text-[var(--text-muted)]">{pt.yearLabel}</div>
                <div className="text-xs font-semibold">{pt.eraLabel}</div>
                <div className="font-mono text-lg font-bold text-[var(--accent)] mt-0.5">
                  {formatUnboundedPower(pt.powerLevel)}
                </div>
              </div>
            ))}
          </div>
        )}
        {canEdit && (
          <form onSubmit={addPowerHistory} className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <input type="text" required value={phEra} onChange={(e) => setPhEra(e.target.value)} placeholder="Tên giai đoạn *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <input type="text" value={phYear} onChange={(e) => setPhYear(e.target.value)} placeholder="Mốc năm (VD: Năm 350)" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
            <input type="number" step="any" value={phVal} onChange={(e) => setPhVal(Number(e.target.value))} placeholder="Power Level" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 font-mono" />
            <button type="submit" className="rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] font-semibold py-1.5 cursor-pointer">+ Thêm mốc sức mạnh</button>
          </form>
        )}
      </div>

      {/* Abilities & Historical Feats (Lore CRUD) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 space-y-3">
          <h3 className="font-display text-base text-[var(--accent)]">✦ Năng lực & Chuyên môn (Lore)</h3>
          <div className="space-y-2">
            {(entry.abilities || []).map((ab) => (
              <div key={ab.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <strong className="text-[var(--text-primary)]">{ab.sigil} {ab.name}</strong>
                  <span className="px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[10px]">{ab.rank} · {ab.category}</span>
                </div>
                <p className="text-[var(--text-secondary)]">{ab.description}</p>
              </div>
            ))}
          </div>
          {canEdit && (
            <form onSubmit={addAbility} className="space-y-1.5 text-xs pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                <input type="text" required value={abName} onChange={(e) => setAbName(e.target.value)} placeholder="Tên năng lực *" className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <input type="text" value={abRank} onChange={(e) => setAbRank(e.target.value)} placeholder="Cấp bậc" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
              </div>
              <div className="flex gap-1.5">
                <input type="text" value={abCat} onChange={(e) => setAbCat(e.target.value)} placeholder="Phân loại" className="w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
                <input type="text" value={abDesc} onChange={(e) => setAbDesc(e.target.value)} placeholder="Mô tả chi tiết..." className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <button type="submit" className="px-2.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/40 p-4 space-y-3">
          <h3 className="font-display text-base text-[var(--accent)] flex items-center gap-1.5">
            <Award className="w-4 h-4" /> Danh hiệu & Kỳ tích Lịch sử
          </h3>
          <div className="space-y-2">
            {(entry.feats || []).map((ft) => (
              <div key={ft.id} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 p-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <strong>{ft.title}</strong>
                  <span className="font-mono text-[10px] text-[var(--accent)]">{ft.yearLabel}</span>
                </div>
                <p className="text-[var(--text-secondary)]">{ft.description}</p>
              </div>
            ))}
          </div>
          {canEdit && (
            <form onSubmit={addFeat} className="space-y-1.5 text-xs pt-1">
              <div className="grid grid-cols-3 gap-1.5">
                <input type="text" required value={ftTitle} onChange={(e) => setFtTitle(e.target.value)} placeholder="Tên kỳ tích / danh hiệu *" className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <input type="text" value={ftYear} onChange={(e) => setFtYear(e.target.value)} placeholder="Năm" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5" />
              </div>
              <div className="flex gap-1.5">
                <input type="text" value={ftDesc} onChange={(e) => setFtDesc(e.target.value)} placeholder="Ý nghĩa lịch sử..." className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <button type="submit" className="px-2.5 rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold cursor-pointer"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==================== PROFILE SHARE CARD GENERATOR MODAL ==================== */

export function ProfileShareCardModal({
  entry,
  conlang,
  onClose
}: {
  entry: Entry;
  conlang?: ConlangLanguage;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const tier = classifyPowerTier(entry.powerLevel, entry.powerInfinite, entry.powerTierOverride);
  const conlangTitle = translateVietnameseToConlang(entry.title, conlang);
  const radar = computeRadarPolygonPoints(entry.attributes || [], 80, 80, 52);

  function copyCardSummary() {
    const txt = `${entry.sigil} ${entry.title} (${conlangTitle.romanized})\nPower Level: ${formatUnboundedPower(entry.powerLevel, entry.powerInfinite)} [${tier.code} · ${tier.label}]\n${entry.summary}`;
    navigator.clipboard?.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3">
        <div
          className="rounded-3xl border-2 p-6 space-y-4 shadow-2xl relative overflow-hidden"
          style={{
            borderColor: tier.color,
            background: `radial-gradient(circle at 80% 15%, ${tier.color}30, transparent 55%), #090e1c`
          }}
        >
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--accent)]">
            <span>✦ AETHEL CODEX DOSSIER CARD</span>
            <span style={{ color: tier.color }}>{tier.code}</span>
          </div>

          <div className="flex items-center gap-3.5">
            <div
              className="w-16 h-16 rounded-2xl border-2 overflow-hidden flex items-center justify-center text-3xl shrink-0 bg-black/40"
              style={{ borderColor: tier.color, color: tier.color }}
            >
              {entry.thumbImage ? (
                <img src={entry.thumbImage} alt={entry.title} className="w-full h-full object-cover" />
              ) : (
                entry.sigil
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-2xl font-bold text-white truncate">{entry.title}</h3>
              <div className="font-mono text-xs text-[var(--accent)] truncate">
                {conlangTitle.runic} · {conlangTitle.romanized}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Power Level</div>
              <div className="font-mono text-2xl font-extrabold" style={{ color: tier.color }}>
                {formatUnboundedPower(entry.powerLevel, entry.powerInfinite)}
              </div>
              <div className="text-[11px] text-slate-300">{tier.label}</div>
            </div>
            {radar.points.length >= 3 && (
              <svg viewBox="0 0 160 160" className="w-24 h-24 shrink-0">
                <circle cx={80} cy={80} r={52} fill="none" stroke="rgba(255,255,255,0.15)" />
                <polygon points={radar.polygonString} fill={`${tier.color}44`} stroke={tier.color} strokeWidth={2} />
              </svg>
            )}
          </div>

          {entry.epigraph?.quote && (
            <p className="text-xs italic text-slate-300 border-l-2 pl-3" style={{ borderColor: tier.color }}>
              “{entry.epigraph.quote}”
            </p>
          )}
        </div>

        <div className="flex justify-center gap-2 no-print">
          <button type="button" onClick={copyCardSummary} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
            <Copy className="w-3.5 h-3.5" /> {copied ? "Đã sao chép!" : "Chép thông tin thẻ"}
          </button>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-xs cursor-pointer">
            <Printer className="w-3.5 h-3.5" /> In / Lưu PDF
          </button>
          <button type="button" onClick={onClose} className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
