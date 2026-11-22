"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Download,
  Gauge,
  Grid,
  Languages,
  Plus,
  Presentation,
  Quote,
  Shield,
  Sparkles,
  TableProperties,
  Trash2,
  Wand2,
  X
} from "lucide-react";
import type {
  Category,
  ConlangLanguage,
  EntryCardProjection,
  EntryRelation,
  EntryType,
  WorldUnit
} from "@/types/codex";
import {
  buildCrestSvgString,
  classifyPowerTier,
  computeRadarPolygonPoints,
  convertWorldUnit,
  formatUnboundedPower,
  generateWorldbuildingPrompt,
  type CrestConfig
} from "@/lib/v3-engines";
import { translateVietnameseToConlang } from "@/lib/conlang";

interface V3OmniverseStudioViewProps {
  workspaceId: string;
  entries: EntryCardProjection[];
  entryTypes: EntryType[];
  categories: Category[];
  worldUnits: WorldUnit[];
  activeConlang?: ConlangLanguage;
  canEdit: boolean;
  onOpenEntry: (id: string) => void;
  onCreateEntryFromPrompt: (title: string, summary: string, markdown: string) => void;
  onRefresh: () => Promise<void>;
}

export function V3OmniverseStudioView({
  workspaceId,
  entries,
  entryTypes,
  categories,
  worldUnits,
  activeConlang,
  canEdit,
  onOpenEntry,
  onCreateEntryFromPrompt,
  onRefresh
}: V3OmniverseStudioViewProps) {
  const [tool, setTool] = useState<
    "power" | "heraldry" | "units" | "diplomacy" | "forge" | "quotes" | "batch"
  >("power");

  // 1. Power Index & Radar Overlay
  const [powerTypeFilter, setPowerTypeFilter] = useState("");
  const [radarIds, setRadarIds] = useState<string[]>([]);

  // 2. Heraldry SVG Studio
  const [crest, setCrest] = useState<CrestConfig>({
    shape: "shield",
    layout: "quartered",
    primaryColor: "#1E3A8A",
    secondaryColor: "#7C2D12",
    sigil: "⚜",
    sigilColor: "#D4AF37",
    motto: "VALDORIA ETERNIS"
  });
  const crestSvg = useMemo(() => buildCrestSvgString(crest), [crest]);
  const [crestSavedMsg, setCrestSavedMsg] = useState("");

  // 3. World Units Converter & CRUD
  const [unitCat, setUnitCat] = useState<WorldUnit["category"]>("currency");
  const [unitAmount, setUnitAmount] = useState(10);
  const catUnits = useMemo(
    () => worldUnits.filter((u) => u.category === unitCat),
    [worldUnits, unitCat]
  );
  const [fromUnitId, setFromUnitId] = useState("");
  const [toUnitId, setToUnitId] = useState("");
  const fromUnit = catUnits.find((u) => u.id === fromUnitId) ?? catUnits[0];
  const toUnit = catUnits.find((u) => u.id === toUnitId) ?? catUnits[1] ?? catUnits[0];
  const [uName, setUName] = useState("");
  const [uSymbol, setUSymbol] = useState("");
  const [uRatio, setURatio] = useState(1);

  // 4. Diplomatic Heat-Matrix
  const [relations, setRelations] = useState<EntryRelation[]>([]);
  useEffect(() => {
    if (tool === "diplomacy") {
      fetch(`/api/relations?workspaceId=${workspaceId}`)
        .then((r) => r.json())
        .then((d) => setRelations(d.relations || []));
    }
  }, [tool, workspaceId]);

  // 5. Inspiration Forge
  const [forgeKind, setForgeKind] = useState<"kingdom" | "character" | "artifact">("kingdom");
  const [forgeSeed, setForgeSeed] = useState(0);
  const promptResult = useMemo(
    () => generateWorldbuildingPrompt(forgeKind, forgeSeed),
    [forgeKind, forgeSeed]
  );

  // 6. Quotes Archive
  const [quotes, setQuotes] = useState<
    Array<{ entryId: string; entryTitle: string; sigil: string; quote: string; author: string; source: string; kind: string }>
  >([]);
  const [quoteConlang, setQuoteConlang] = useState(false);
  useEffect(() => {
    if (tool === "quotes") {
      fetch(`/api/v2?workspaceId=${workspaceId}&resource=quotes`)
        .then((r) => r.json())
        .then((d) => setQuotes(d.quotes || []));
    }
  }, [tool, workspaceId]);

  // 7. Batch Entry Creator
  const [batchRows, setBatchRows] = useState<
    Array<{ title: string; entryTypeId: string; categoryId: string; powerLevel: string; summary: string; tags: string }>
  >([
    { title: "", entryTypeId: entryTypes[0]?.id || "", categoryId: "", powerLevel: "5000", summary: "", tags: "" },
    { title: "", entryTypeId: entryTypes[0]?.id || "", categoryId: "", powerLevel: "12000", summary: "", tags: "" },
    { title: "", entryTypeId: entryTypes[0]?.id || "", categoryId: "", powerLevel: "50000", summary: "", tags: "" }
  ]);
  const [batchStatus, setBatchStatus] = useState("");

  // Ranked entries for Power Index (V5.0: strictly excludes non-power types like Languages/Events/Cities)
  const rankedEntries = useMemo(() => {
    return entries
      .filter((e) => e.supportsPower !== false)
      .filter((e) => !powerTypeFilter || e.entryTypeId === powerTypeFilter)
      .sort((a, b) => {
        const pa = a.powerInfinite ? Number.MAX_SAFE_INTEGER : a.powerLevel ?? -1;
        const pb = b.powerInfinite ? Number.MAX_SAFE_INTEGER : b.powerLevel ?? -1;
        return pb - pa;
      });
  }, [entries, powerTypeFilter]);

  function toggleRadarPick(id: string) {
    setRadarIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev.slice(-3), id]
    );
  }

  async function saveCrestToMedia() {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(crestSvg)}`;
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "media",
        data: {
          workspaceId,
          title: `Gia huy ${crest.motto || crest.sigil}`,
          thumbUrl: dataUrl,
          fullUrl: dataUrl,
          tags: ["gia-huy", "heraldry"],
          caption: crest.motto,
          source: "external"
        }
      })
    });
    setCrestSavedMsg("Đã lưu Huy hiệu SVG vào Kho Media Vault!");
    await onRefresh();
  }

  function downloadCrestSvg() {
    const blob = new Blob([crestSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aethel-crest.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function addWorldUnit(e: React.FormEvent) {
    e.preventDefault();
    if (!uName.trim() || !uSymbol.trim()) return;
    await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resource: "world_unit",
        data: { workspaceId, category: unitCat, name: uName.trim(), symbol: uSymbol.trim(), ratioToBase: uRatio, note: "" }
      })
    });
    setUName("");
    setUSymbol("");
    await onRefresh();
  }

  async function deleteUnit(id: string) {
    await fetch(`/api/v2?resource=world_unit&id=${id}`, { method: "DELETE" });
    await onRefresh();
  }

  async function submitBatch(e: React.FormEvent) {
    e.preventDefault();
    const valid = batchRows
      .filter((r) => r.title.trim())
      .map((r) => ({
        title: r.title.trim(),
        entryTypeId: r.entryTypeId || entryTypes[0]?.id,
        categoryId: r.categoryId || null,
        powerLevel: r.powerLevel ? Number(r.powerLevel) : undefined,
        summary: r.summary,
        tags: r.tags.split(",").map((s) => s.trim()).filter(Boolean)
      }));
    if (valid.length === 0) return;
    const res = await fetch("/api/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource: "batch_entries", data: { workspaceId, rows: valid } })
    });
    const data = await res.json();
    setBatchStatus(`Đã tạo hàng loạt thành công ${data.count} hồ sơ mới!`);
    setBatchRows([
      { title: "", entryTypeId: entryTypes[0]?.id || "", categoryId: "", powerLevel: "", summary: "", tags: "" }
    ]);
    await onRefresh();
  }

  const matrixEntities = entries.slice(0, 8);
  const OVERLAY_COLORS = ["#D4AF37", "#38BDF8", "#F472B6", "#34D399"];

  return (
    <div className="space-y-4">
      {/* 1-Click Tool Switcher Header */}
      <div className="codex-card arcane-corners rounded-2xl p-5 space-y-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--accent)] flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Trung Tâm Công Cụ Omniverse V3.0 (Chuyển Đổi 1-Click)
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Xếp hạng Power Level ∞ & Radar Overlay, Thiết kế Huy hiệu SVG, Quy đổi Tiền tệ/Đơn vị, Ma trận Ngoại giao, Lò Gợi ý Sáng tạo, Bảo tàng Danh ngôn & Tạo Hàng loạt.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {(
            [
              ["power", Gauge, "Bảng Xếp Hạng Power"],
              ["heraldry", Shield, "Thiết Kế Huy Hiệu SVG"],
              ["units", Coins, "Tiền Tệ & Đơn Vị"],
              ["diplomacy", Grid, "Ma Trận Ngoại Giao"],
              ["forge", Wand2, "Lò Gợi Ý Sáng Tạo"],
              ["quotes", Quote, "Bảo Tàng Danh Ngôn"],
              ["batch", TableProperties, "Tạo Hồ Sơ Hàng Loạt"]
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTool(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                tool === id
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[#090e1c] font-bold"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Power Tier Leaderboard & Radar Overlay */}
      {tool === "power" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          <div className="xl:col-span-8 codex-card rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-display text-base text-[var(--accent)]">
                ✦ Sảnh Xếp Hạng Power Level Không Giới Hạn
              </span>
              <select
                value={powerTypeFilter}
                onChange={(e) => setPowerTypeFilter(e.target.value)}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1 text-xs"
              >
                <option value="">Tất cả Loại thực thể</option>
                {entryTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.sigil} {t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {rankedEntries.map((e, idx) => {
                const tier = classifyPowerTier(e.powerLevel, e.powerInfinite, e.powerTierOverride);
                const picked = radarIds.includes(e.id);
                return (
                  <div
                    key={e.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3.5 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-xs text-[var(--text-muted)] w-6">#{idx + 1}</span>
                      <span className="text-xl" style={{ color: tier.color }}>{e.sigil}</span>
                      <div className="min-w-0">
                        <button type="button" onClick={() => onOpenEntry(e.id)} className="font-display font-bold text-sm hover:text-[var(--accent)] truncate block cursor-pointer">
                          {e.title}
                        </button>
                        <div className="text-[11px] text-[var(--text-muted)] truncate">{e.subtitle}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-sm font-bold" style={{ color: tier.color }}>
                          {formatUnboundedPower(e.powerLevel, e.powerInfinite)}
                        </div>
                        <div className="text-[10px] font-mono" style={{ color: tier.color }}>
                          {tier.code} · {tier.label}
                        </div>
                      </div>
                      {(e.attributes?.length || 0) >= 3 && (
                        <button
                          type="button"
                          onClick={() => toggleRadarPick(e.id)}
                          className={`px-2 py-1 rounded-lg border text-[10px] cursor-pointer ${
                            picked
                              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold"
                              : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                          }`}
                        >
                          {picked ? "✓ Radar" : "+ Radar"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="xl:col-span-4 codex-card rounded-2xl p-4 space-y-3">
            <div className="text-xs font-semibold text-[var(--accent)]">
              ✦ So sánh Chồng lớp Radar ({radarIds.length}/4 thực thể)
            </div>
            {radarIds.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] py-8 text-center">
                Bấm <strong>+ Radar</strong> ở danh sách bên trái để chồng lớp so sánh biểu đồ thuộc tính!
              </p>
            ) : (
              <>
                <svg viewBox="0 0 300 300" className="w-full max-w-[260px] mx-auto">
                  {[0.25, 0.5, 0.75, 1].map((r) => (
                    <circle key={r} cx={150} cy={150} r={96 * r} fill="none" stroke="rgba(212,175,55,0.2)" />
                  ))}
                  {radarIds.map((rid, idx) => {
                    const ent = entries.find((x) => x.id === rid);
                    if (!ent?.attributes || ent.attributes.length < 3) return null;
                    const poly = computeRadarPolygonPoints(ent.attributes, 150, 150, 96);
                    const color = OVERLAY_COLORS[idx % OVERLAY_COLORS.length];
                    return (
                      <polygon
                        key={rid}
                        points={poly.polygonString}
                        fill={`${color}26`}
                        stroke={color}
                        strokeWidth={2}
                      />
                    );
                  })}
                </svg>
                <div className="space-y-1 text-xs">
                  {radarIds.map((rid, idx) => {
                    const ent = entries.find((x) => x.id === rid);
                    if (!ent) return null;
                    return (
                      <div key={rid} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: OVERLAY_COLORS[idx % OVERLAY_COLORS.length] }} />
                          <span>{ent.title}</span>
                        </span>
                        <span className="font-mono text-[11px]">{formatUnboundedPower(ent.powerLevel, ent.powerInfinite)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. Arcane Crest & Heraldry SVG Studio */}
      {tool === "heraldry" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          <div className="md:col-span-5 codex-card rounded-2xl p-5 flex flex-col items-center space-y-4">
            <div
              className="w-60 h-64 rounded-2xl overflow-hidden shadow-2xl border border-[var(--border-strong)]"
              dangerouslySetInnerHTML={{ __html: crestSvg }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={downloadCrestSvg} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Tải tệp SVG
              </button>
              {canEdit && (
                <button type="button" onClick={saveCrestToMedia} className="px-3.5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-semibold text-xs cursor-pointer">
                  Lưu vào Media Vault
                </button>
              )}
            </div>
            {crestSavedMsg && <div className="text-xs text-emerald-300">{crestSavedMsg}</div>}
          </div>

          <div className="md:col-span-7 codex-card rounded-2xl p-5 space-y-3.5 text-xs">
            <h3 className="font-display text-lg text-[var(--accent)]">Tùy chỉnh Huy hiệu Vương quốc / Gia huy Dòng tộc</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Hình khung</label>
                <select value={crest.shape} onChange={(e) => setCrest({ ...crest, shape: e.target.value as CrestConfig["shape"] })} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2">
                  <option value="shield">Khiên Hoàng Gia</option>
                  <option value="wreath">Vòng Nguyệt Quế Tinh Tú</option>
                  <option value="diamond">Kim Cương Cổ Điển</option>
                  <option value="circle">Ấn Triện Tròn</option>
                </select>
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Bố cục nền</label>
                <select value={crest.layout} onChange={(e) => setCrest({ ...crest, layout: e.target.value as CrestConfig["layout"] })} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2">
                  <option value="quartered">Chia 4 ô (Quartered)</option>
                  <option value="vertical">Chia đôi dọc</option>
                  <option value="horizontal">Chia đôi ngang</option>
                  <option value="solid">Đơn sắc</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Màu nền 1</label>
                <input type="color" value={crest.primaryColor} onChange={(e) => setCrest({ ...crest, primaryColor: e.target.value })} className="w-full h-9 rounded-xl bg-transparent cursor-pointer" />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Màu nền 2</label>
                <input type="color" value={crest.secondaryColor} onChange={(e) => setCrest({ ...crest, secondaryColor: e.target.value })} className="w-full h-9 rounded-xl bg-transparent cursor-pointer" />
              </div>
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Màu Ký hiệu & Viền</label>
                <input type="color" value={crest.sigilColor} onChange={(e) => setCrest({ ...crest, sigilColor: e.target.value })} className="w-full h-9 rounded-xl bg-transparent cursor-pointer" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[var(--text-muted)] mb-1">Ký hiệu trung tâm</label>
                <input type="text" maxLength={2} value={crest.sigil} onChange={(e) => setCrest({ ...crest, sigil: e.target.value })} className="w-full text-center text-xl rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] py-1.5" />
              </div>
              <div className="col-span-2">
                <label className="block text-[var(--text-muted)] mb-1">Khẩu hiệu Gia tộc / Vương quốc</label>
                <input type="text" value={crest.motto} onChange={(e) => setCrest({ ...crest, motto: e.target.value })} className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. World Currency & Units Converter */}
      {tool === "units" && (
        <div className="space-y-4">
          <div className="codex-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap gap-2 text-xs">
              {(
                [
                  ["currency", "Tiền tệ Thế giới"],
                  ["length", "Độ dài & Hải đồ"],
                  ["weight", "Trọng lượng"],
                  ["time", "Đơn vị Thời gian"]
                ] as const
              ).map(([cat, label]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setUnitCat(cat)}
                  className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                    unitCat === cat ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold" : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {fromUnit && toUnit ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center rounded-xl border border-[var(--border-strong)] bg-[var(--accent-soft)] p-4">
                <div className="space-y-1">
                  <input type="number" step="any" value={unitAmount} onChange={(e) => setUnitAmount(Number(e.target.value))} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-2 font-mono text-base" />
                  <select value={fromUnit.id} onChange={(e) => setFromUnitId(e.target.value)} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs">
                    {catUnits.map((u) => <option key={u.id} value={u.id}>{u.symbol} {u.name}</option>)}
                  </select>
                </div>
                <div className="text-center font-mono text-2xl text-[var(--accent)] font-bold">
                  = {convertWorldUnit(unitAmount, fromUnit, toUnit).toLocaleString("vi-VN")} {toUnit.symbol}
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-[var(--text-muted)]">Đơn vị đích:</div>
                  <select value={toUnit.id} onChange={(e) => setToUnitId(e.target.value)} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 text-xs">
                    {catUnits.map((u) => <option key={u.id} value={u.id}>{u.symbol} {u.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">Hãy thêm ít nhất 1 đơn vị cho nhóm này.</p>
            )}

            {canEdit && (
              <form onSubmit={addWorldUnit} className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-[var(--border-subtle)]">
                <input type="text" required value={uName} onChange={(e) => setUName(e.target.value)} placeholder="Tên đơn vị mới *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <input type="text" required value={uSymbol} onChange={(e) => setUSymbol(e.target.value)} placeholder="Ký hiệu (VD: ☀G) *" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <input type="number" step="any" value={uRatio} onChange={(e) => setURatio(Number(e.target.value))} placeholder="Tỷ lệ so với gốc" className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5 font-mono" />
                <button type="submit" className="rounded-lg bg-[var(--accent)] text-[#090e1c] font-semibold py-1.5 cursor-pointer">+ Thêm đơn vị</button>
              </form>
            )}

            <div className="flex flex-wrap gap-2 text-xs">
              {catUnits.map((u) => (
                <div key={u.id} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)]/60 px-3 py-1.5">
                  <strong className="text-[var(--accent)]">{u.symbol}</strong>
                  <span>{u.name}</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">(×{u.ratioToBase})</span>
                  {canEdit && <button type="button" onClick={() => deleteUnit(u.id)} className="text-rose-400 cursor-pointer"><Trash2 className="w-3 h-3" /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Diplomatic Heat-Matrix */}
      {tool === "diplomacy" && (
        <div className="codex-card rounded-2xl p-4 overflow-x-auto space-y-3">
          <div className="text-xs text-[var(--text-muted)]">
            Ma trận trực quan hóa quan hệ giữa các thực thể hàng đầu trong Không gian:
          </div>
          <table className="w-full text-xs border-collapse min-w-[640px]">
            <thead>
              <tr>
                <th className="p-2 border border-[var(--border-subtle)] text-left font-mono text-[var(--accent)]">Thực thể</th>
                {matrixEntities.map((e) => (
                  <th key={e.id} className="p-2 border border-[var(--border-subtle)] text-center max-w-[110px] truncate">
                    {e.sigil} {e.title.split(" ").slice(0, 2).join(" ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixEntities.map((row) => (
                <tr key={row.id}>
                  <td className="p-2 border border-[var(--border-subtle)] font-semibold whitespace-nowrap">
                    <button type="button" onClick={() => onOpenEntry(row.id)} className="hover:text-[var(--accent)] cursor-pointer">
                      {row.sigil} {row.title}
                    </button>
                  </td>
                  {matrixEntities.map((col) => {
                    if (row.id === col.id) {
                      return <td key={col.id} className="p-2 border border-[var(--border-subtle)] bg-white/5 text-center text-[var(--text-muted)]">—</td>;
                    }
                    const rel = relations.find(
                      (r) =>
                        (r.sourceEntryId === row.id && r.targetEntryId === col.id) ||
                        (r.sourceEntryId === col.id && r.targetEntryId === row.id)
                    );
                    return (
                      <td
                        key={col.id}
                        title={rel ? `${rel.relationType}: ${rel.note}` : "Chưa có quan hệ trực tiếp"}
                        className={`p-2 border border-[var(--border-subtle)] text-center text-[10px] ${
                          rel ? "bg-emerald-500/15 text-emerald-300 font-medium" : "text-[var(--text-muted)]/40"
                        }`}
                      >
                        {rel ? rel.relationType : "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Worldbuilding Inspiration Forge */}
      {tool === "forge" && (
        <div className="codex-card arcane-corners rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5 text-xs">
              {(
                [
                  ["kingdom", "⚜ Vương quốc"],
                  ["character", "⚝ Nhân vật"],
                  ["artifact", "❖ Cổ vật Văn hóa"]
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForgeKind(k)}
                  className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                    forgeKind === k ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)] font-semibold" : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setForgeSeed((s) => s + 1)} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer">
              <Wand2 className="w-3.5 h-3.5" /> Sinh ý tưởng khác
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border-strong)] bg-[var(--bg-base)]/60 p-5 space-y-2">
            <h3 className="font-display text-2xl font-bold text-[var(--accent)]">{promptResult.title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{promptResult.summary}</p>
            {canEdit && (
              <button
                type="button"
                onClick={() => onCreateEntryFromPrompt(promptResult.title, promptResult.summary, promptResult.markdown)}
                className="mt-3 px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs cursor-pointer"
              >
                ✦ Tạo Hồ sơ Codex từ gợi ý này
              </button>
            )}
          </div>
        </div>
      )}

      {/* 6. Grand Quotes & Inscriptions Archive */}
      {tool === "quotes" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setQuoteConlang((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-strong)] text-xs text-[var(--accent)] cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5" />
              {quoteConlang ? "Hiển thị Tiếng Việt" : `Dịch 1-Click sang ${activeConlang?.nativeName || "Cổ ngữ"}`}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quotes.map((q, idx) => {
              const tr = quoteConlang ? translateVietnameseToConlang(q.quote, activeConlang) : null;
              return (
                <div key={idx} className="codex-card arcane-corners rounded-2xl p-5 space-y-2">
                  <div className="text-xs font-mono text-[var(--accent)]">
                    {q.sigil} {q.kind === "conlang" ? "Văn bia Cổ ngữ" : "Đề từ Danh ngôn"}
                  </div>
                  {tr ? (
                    <div className="space-y-1">
                      <div className="font-mono text-sm text-[var(--accent)]">{tr.runic}</div>
                      <div className="font-display italic text-base">“{tr.romanized}”</div>
                    </div>
                  ) : (
                    <blockquote className="font-display italic text-base text-[var(--text-primary)]">
                      “{q.quote}”
                    </blockquote>
                  )}
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border-subtle)]">
                    <span>— {q.author}</span>
                    <button type="button" onClick={() => onOpenEntry(q.entryId)} className="text-[var(--accent)] hover:underline cursor-pointer">
                      Xem {q.entryTitle} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Batch Entry Creator */}
      {tool === "batch" && (
        <form onSubmit={submitBatch} className="codex-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base text-[var(--accent)]">
              ✦ Tạo Hồ Sơ Hàng Loạt Dạng Bảng (Batch Creator)
            </h3>
            <button
              type="button"
              onClick={() =>
                setBatchRows((p) => [
                  ...p,
                  { title: "", entryTypeId: entryTypes[0]?.id || "", categoryId: "", powerLevel: "", summary: "", tags: "" }
                ])
              }
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm dòng
            </button>
          </div>

          <div className="space-y-2 overflow-x-auto">
            {batchRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-1.5 min-w-[700px] text-xs">
                <input type="text" value={row.title} onChange={(e) => setBatchRows((p) => p.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)))} placeholder="Tiêu đề hồ sơ *" className="col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
                <select value={row.entryTypeId} onChange={(e) => setBatchRows((p) => p.map((r, i) => (i === idx ? { ...r, entryTypeId: e.target.value } : r)))} className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
                  {entryTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select value={row.categoryId} onChange={(e) => setBatchRows((p) => p.map((r, i) => (i === idx ? { ...r, categoryId: e.target.value } : r)))} className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5">
                  <option value="">Danh mục...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" step="any" value={row.powerLevel} onChange={(e) => setBatchRows((p) => p.map((r, i) => (i === idx ? { ...r, powerLevel: e.target.value } : r)))} placeholder="Power Level" className="col-span-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2 py-1.5 font-mono" />
                <input type="text" value={row.summary} onChange={(e) => setBatchRows((p) => p.map((r, i) => (i === idx ? { ...r, summary: e.target.value } : r)))} placeholder="Tóm tắt..." className="col-span-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] px-2.5 py-1.5" />
              </div>
            ))}
          </div>

          {batchStatus && <div className="text-xs text-emerald-300">{batchStatus}</div>}

          {canEdit ? (
            <button type="submit" className="px-5 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs cursor-pointer">
              ✦ Tạo Hàng Loạt Ngay
            </button>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">Cần quyền Admin hoặc Biên tập viên để tạo hàng loạt.</p>
          )}
        </form>
      )}
    </div>
  );
}

/* ==================== SHOWCASE PRESENTATION DECK MODAL ==================== */

export function ShowcaseDeckModal({
  entries,
  onClose
}: {
  entries: EntryCardProjection[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const current = entries[idx];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => Math.min(entries.length - 1, i + 1));
      if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entries.length, onClose]);

  if (!current) return null;
  const tier = classifyPowerTier(current.powerLevel, current.powerInfinite, current.powerTierOverride);

  return (
    <div className="fixed inset-0 z-50 bg-[#050811] flex flex-col justify-between p-6 sm:p-10">
      <div className="flex items-center justify-between text-xs font-mono text-[var(--accent)]">
        <span className="flex items-center gap-2">
          <Presentation className="w-4 h-4" /> CHẾ ĐỘ TRÌNH CHIẾU CỔ THƯ ({idx + 1} / {entries.length})
        </span>
        <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-xl border border-[var(--border-strong)] cursor-pointer">
          Thoát (Esc)
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full text-center space-y-5">
        {current.thumbImage && (
          <img src={current.thumbImage} alt={current.title} className="w-full max-h-64 object-cover rounded-2xl border border-[var(--border-strong)] mx-auto shadow-2xl" />
        )}
        <div className="text-5xl" style={{ color: tier.color }}>{current.sigil}</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">{current.title}</h1>
        {current.subtitle && <p className="text-lg italic text-slate-300">{current.subtitle}</p>}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono text-sm font-bold" style={{ borderColor: tier.color, color: tier.color, backgroundColor: `${tier.color}1E` }}>
          POWER LEVEL: {formatUnboundedPower(current.powerLevel, current.powerInfinite)} · {tier.code} ({tier.label})
        </div>
        <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">{current.summary}</p>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button type="button" disabled={idx === 0} onClick={() => setIdx((i) => i - 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--border-subtle)] text-xs disabled:opacity-30 cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Slide trước
        </button>
        <button type="button" disabled={idx >= entries.length - 1} onClick={() => setIdx((i) => i + 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[var(--accent)] text-[#090e1c] font-bold text-xs disabled:opacity-30 cursor-pointer">
          Slide tiếp <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
