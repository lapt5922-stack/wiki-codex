"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Flag, Save, Search, Trash2 } from "lucide-react";
import type {
  FlagCategoryId,
  FlagGeometryId,
  FlagLayoutId,
  FlagTemplateItem,
  HeraldryFlagDesign
} from "@/types/heraldry";
import {
  FLAG_CATEGORY_LABELS,
  FLAG_GEOMETRY_LABELS,
  FLAG_LAYOUT_LABELS,
  renderFlagToSvgString
} from "@/lib/heraldry/flag-engine";
import { HERALDIC_COLORS } from "@/lib/heraldry/shapes-and-palettes";
import { HERALDIC_SYMBOLS } from "@/lib/heraldry/symbols-and-ornaments";

interface FlagBannerStudioProps {
  workspaceId: string;
  canEdit: boolean;
  defaultKingdomId?: string;
}

export function FlagBannerStudio({
  workspaceId,
  canEdit,
  defaultKingdomId = "KING-000001"
}: FlagBannerStudioProps) {
  const [name, setName] = useState("Quốc kỳ Đế chế Mới");
  const [category, setCategory] = useState<FlagCategoryId>("national_flag");
  const [geometry, setGeometry] = useState<FlagGeometryId>("rect_3_2");
  const [layout, setLayout] = useState<FlagLayoutId>("horizontal_tricolor");
  const [primaryColor, setPrimaryColor] = useState("#101522");
  const [secondaryColor, setSecondaryColor] = useState("#6D3D49");
  const [tertiaryColor, setTertiaryColor] = useState("#C6A568");
  const [symbolId, setSymbolId] = useState("sym-double-eagle");
  const [symbolColor, setSymbolColor] = useState("#E9DFC9");
  const [symbolScale, setSymbolScale] = useState(1.55);
  const [borderTrim, setBorderTrim] = useState(true);
  const [borderColor, setBorderColor] = useState("#C6A568");
  const [mottoText, setMottoText] = useState("AETHEL · VINH QUANG");
  const [linkedKingdomId, setLinkedKingdomId] = useState(defaultKingdomId);
  const [eraLabel, setEraLabel] = useState("Kỷ nguyên Hiện tại");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // 450+ server-paginated templates
  const [templates, setTemplates] = useState<FlagTemplateItem[]>([]);
  const [tplTotal, setTplTotal] = useState(450);
  const [tplPage, setTplPage] = useState(1);
  const [tplTotalPages, setTplTotalPages] = useState(25);
  const [tplQ, setTplQ] = useState("");
  const [tplCat, setTplCat] = useState("");
  const [savedFlags, setSavedFlags] = useState<HeraldryFlagDesign[]>([]);

  const loadTemplates = useCallback(async () => {
    const p = new URLSearchParams({
      mode: "flag_templates",
      page: String(tplPage),
      limit: "12"
    });
    if (tplQ.trim()) p.set("q", tplQ.trim());
    if (tplCat) p.set("category", tplCat);
    const res = await fetch(`/api/heraldry?${p}`);
    const data = await res.json();
    setTemplates(data.items || []);
    setTplTotal(data.total || 450);
    setTplTotalPages(data.totalPages || 1);
  }, [tplPage, tplQ, tplCat]);

  const loadSaved = useCallback(async () => {
    const res = await fetch(`/api/heraldry?mode=flags&workspaceId=${encodeURIComponent(workspaceId)}`);
    const data = await res.json();
    setSavedFlags(data.flags || []);
  }, [workspaceId]);

  useEffect(() => {
    const t = setTimeout(() => void loadTemplates(), 120);
    return () => clearTimeout(t);
  }, [loadTemplates]);

  useEffect(() => {
    void loadSaved();
  }, [loadSaved]);

  const liveSvg = useMemo(
    () =>
      renderFlagToSvgString(
        {
          geometry,
          layout,
          primaryColor,
          secondaryColor,
          tertiaryColor,
          symbolId,
          symbolColor,
          symbolScale,
          borderTrim,
          borderColor,
          mottoText
        },
        "live-flag"
      ),
    [
      geometry,
      layout,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      symbolId,
      symbolColor,
      symbolScale,
      borderTrim,
      borderColor,
      mottoText
    ]
  );

  function applyTemplate(tpl: FlagTemplateItem) {
    setEditingId(undefined);
    setName(tpl.config.name);
    setCategory(tpl.config.category);
    setGeometry(tpl.config.geometry);
    setLayout(tpl.config.layout);
    setPrimaryColor(tpl.config.primaryColor);
    setSecondaryColor(tpl.config.secondaryColor);
    setTertiaryColor(tpl.config.tertiaryColor);
    setSymbolId(tpl.config.symbolId);
    setSymbolColor(tpl.config.symbolColor);
    setSymbolScale(tpl.config.symbolScale);
    setBorderTrim(tpl.config.borderTrim);
    setBorderColor(tpl.config.borderColor);
    setMottoText(tpl.config.mottoText);
    setStatusMsg(`Đã nạp mẫu cờ ${tpl.id} vào xưởng thiết kế.`);
  }

  async function handleSaveFlag() {
    if (!canEdit) return;
    const res = await fetch("/api/heraldry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_flag",
        id: editingId,
        workspaceId,
        name,
        category,
        geometry,
        layout,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        symbolId,
        symbolColor,
        symbolScale,
        borderTrim,
        borderColor,
        mottoText,
        linkedKingdomId: linkedKingdomId || null,
        eraLabel
      })
    });
    const data = await res.json();
    if (res.ok && data.flag) {
      setEditingId(data.flag.id);
      setStatusMsg(`Đã lưu cờ hiệu ${data.flag.id} thành công.`);
      void loadSaved();
    } else {
      setStatusMsg(data.error || "Không thể lưu cờ hiệu.");
    }
  }

  async function handleDeleteFlag(id: string) {
    if (!canEdit) return;
    await fetch(`/api/heraldry?entity=flag&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (editingId === id) setEditingId(undefined);
    void loadSaved();
  }

  function exportFlagSvg() {
    const blob = new Blob([liveSvg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Flag Controls */}
        <div className="lg:col-span-4 rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/75 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-[#E9DFC9] flex items-center gap-2">
              <Flag className="w-4 h-4 text-[#C6A568]" />
              Xưởng Thiết kế Cờ & Biểu ngữ
            </h3>
            <span className="text-[11px] text-[#C6A568]">{tplTotal} mẫu</span>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên Quốc kỳ / Biểu ngữ..."
            className="w-full rounded-lg border border-[#C6A568]/25 bg-[#101522] px-3 py-2 text-xs text-[#E9DFC9]"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-[#C6A568]/80">Loại cờ (9 nhóm)</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FlagCategoryId)}
                className="mt-1 w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2 py-1.5 text-xs text-[#E9DFC9]"
              >
                {Object.entries(FLAG_CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-[#C6A568]/80">Hình thái cờ</label>
              <select
                value={geometry}
                onChange={(e) => setGeometry(e.target.value as FlagGeometryId)}
                className="mt-1 w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2 py-1.5 text-xs text-[#E9DFC9]"
              >
                {Object.entries(FLAG_GEOMETRY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-[#C6A568]/80">Bố cục cờ (12 kiểu)</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as FlagLayoutId)}
                className="mt-1 w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2 py-1.5 text-xs text-[#E9DFC9]"
              >
                {Object.entries(FLAG_LAYOUT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase text-[#C6A568]/80">Biểu tượng ({HERALDIC_SYMBOLS.length})</label>
              <select
                value={symbolId}
                onChange={(e) => setSymbolId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2 py-1.5 text-xs text-[#E9DFC9]"
              >
                <option value="">— Không biểu tượng —</option>
                {HERALDIC_SYMBOLS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Màu 1", val: primaryColor, set: setPrimaryColor },
              { label: "Màu 2", val: secondaryColor, set: setSecondaryColor },
              { label: "Màu 3", val: tertiaryColor, set: setTertiaryColor },
              { label: "Biểu tượng", val: symbolColor, set: setSymbolColor }
            ].map((c) => (
              <label key={c.label} className="block text-[10px] text-[#E9DFC9]/70">
                {c.label}
                <input
                  type="color"
                  value={c.val}
                  onChange={(e) => c.set(e.target.value)}
                  className="mt-1 h-8 w-full cursor-pointer rounded border border-[#C6A568]/25 bg-transparent"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {HERALDIC_COLORS.slice(0, 10).map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                onClick={() => setPrimaryColor(c.hex)}
                className="h-5 w-5 rounded-full border border-white/25"
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase text-[#C6A568]/80">Cỡ biểu tượng ({symbolScale.toFixed(2)}x)</label>
              <input
                type="range"
                min={0.6}
                max={2.6}
                step={0.05}
                value={symbolScale}
                onChange={(e) => setSymbolScale(Number(e.target.value))}
                className="mt-1 w-full accent-[#C6A568]"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#E9DFC9] pt-4">
              <input
                type="checkbox"
                checked={borderTrim}
                onChange={(e) => setBorderTrim(e.target.checked)}
                className="accent-[#C6A568]"
              />
              Viền tua vàng nghi lễ
            </label>
          </div>

          <input
            value={mottoText}
            onChange={(e) => setMottoText(e.target.value)}
            placeholder="Chữ khắc trên cờ (tùy chọn)..."
            className="w-full rounded-lg border border-[#C6A568]/20 bg-[#101522] px-3 py-1.5 text-xs text-[#E9DFC9]"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              value={linkedKingdomId}
              onChange={(e) => setLinkedKingdomId(e.target.value)}
              placeholder="Gắn KING-000001"
              className="rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2.5 py-1.5 text-xs text-[#E9DFC9]"
            />
            <input
              value={eraLabel}
              onChange={(e) => setEraLabel(e.target.value)}
              placeholder="Thời kỳ lịch sử"
              className="rounded-lg border border-[#C6A568]/20 bg-[#101522] px-2.5 py-1.5 text-xs text-[#E9DFC9]"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {canEdit && (
              <button
                type="button"
                onClick={() => void handleSaveFlag()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#C6A568] px-3 py-2 text-xs font-bold text-[#101522] hover:bg-[#d8b97e]"
              >
                <Save className="w-3.5 h-3.5" /> Lưu Cờ hiệu
              </button>
            )}
            <button
              type="button"
              onClick={exportFlagSvg}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#C6A568]/40 bg-[#101522] px-3 py-2 text-xs font-semibold text-[#E9DFC9] hover:bg-[#1D2636]"
            >
              <Download className="w-3.5 h-3.5 text-[#C6A568]" /> Xuất SVG
            </button>
          </div>
          {statusMsg && <p className="text-[11px] text-emerald-300">{statusMsg}</p>}
        </div>

        {/* Right: Live Preview + Saved Flags */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-[#C6A568]/25 bg-[#101522] p-5 flex flex-col items-center justify-center min-h-[340px]">
            <div
              className="max-w-full drop-shadow-[0_14px_30px_rgba(0,0,0,0.6)]"
              style={{ width: geometry === "gonfalon_1_2" ? 210 : 480 }}
              dangerouslySetInnerHTML={{ __html: liveSvg }}
            />
            <div className="mt-3 text-center">
              <div className="font-serif text-sm font-bold text-[#E9DFC9]">{name}</div>
              <div className="text-[11px] text-[#E9DFC9]/60">
                {FLAG_CATEGORY_LABELS[category]} · {FLAG_GEOMETRY_LABELS[geometry]} · {FLAG_LAYOUT_LABELS[layout]}
              </div>
            </div>
          </div>

          {savedFlags.length > 0 && (
            <div className="rounded-2xl border border-[#C6A568]/20 bg-[#1D2636]/60 p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-[#C6A568] mb-2">
                Kho Cờ & Biểu ngữ Đã lưu ({savedFlags.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {savedFlags.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-[#C6A568]/20 bg-[#101522]/80 p-2.5 flex items-center gap-2.5"
                  >
                    <div
                      className="w-16 shrink-0 cursor-pointer"
                      onClick={() => {
                        setEditingId(f.id);
                        setName(f.name);
                        setCategory(f.category);
                        setGeometry(f.geometry);
                        setLayout(f.layout);
                        setPrimaryColor(f.primaryColor);
                        setSecondaryColor(f.secondaryColor);
                        setTertiaryColor(f.tertiaryColor);
                        setSymbolId(f.symbolId);
                        setSymbolColor(f.symbolColor);
                        setSymbolScale(f.symbolScale);
                        setBorderTrim(f.borderTrim);
                        setBorderColor(f.borderColor);
                        setMottoText(f.mottoText);
                        setLinkedKingdomId(f.linkedKingdomId || "");
                        setEraLabel(f.eraLabel);
                      }}
                      dangerouslySetInnerHTML={{ __html: renderFlagToSvgString(f, f.id) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-[#E9DFC9]">{f.name}</div>
                      <div className="text-[10px] text-[#C6A568]/80">{f.id} · {f.linkedKingdomId || "Chung"}</div>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteFlag(f.id)}
                        className="p-1.5 text-rose-300 hover:bg-rose-500/15 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: 450+ Flag Templates Gallery */}
      <div className="rounded-2xl border border-[#C6A568]/25 bg-[#1D2636]/70 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-serif text-sm font-bold text-[#E9DFC9]">
            Thư viện {tplTotal} Mẫu Cờ & Biểu ngữ Chuyên biệt (9 loại cờ)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#C6A568] absolute left-2.5 top-2" />
              <input
                value={tplQ}
                onChange={(e) => {
                  setTplQ(e.target.value);
                  setTplPage(1);
                }}
                placeholder="Tìm mẫu cờ..."
                className="rounded-lg border border-[#C6A568]/25 bg-[#101522] pl-8 pr-3 py-1.5 text-xs text-[#E9DFC9]"
              />
            </div>
            <select
              value={tplCat}
              onChange={(e) => {
                setTplCat(e.target.value);
                setTplPage(1);
              }}
              className="rounded-lg border border-[#C6A568]/25 bg-[#101522] px-2.5 py-1.5 text-xs text-[#E9DFC9]"
            >
              <option value="">Tất cả 9 loại cờ</option>
              {Object.entries(FLAG_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="group rounded-xl border border-[#C6A568]/20 bg-[#101522]/85 p-2.5 text-left hover:border-[#C6A568] transition-all"
            >
              <div className="h-20 flex items-center justify-center overflow-hidden">
                <div
                  className={tpl.geometry === "gonfalon_1_2" ? "w-10" : "w-full"}
                  dangerouslySetInnerHTML={{ __html: renderFlagToSvgString(tpl.config, tpl.id) }}
                />
              </div>
              <div className="mt-2 truncate text-[11px] font-semibold text-[#E9DFC9] group-hover:text-[#C6A568]">
                {tpl.name}
              </div>
              <div className="text-[10px] text-[#E9DFC9]/55 truncate">{tpl.layoutLabel}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-[#E9DFC9]/70">
          <span>Trang {tplPage} / {tplTotalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={tplPage <= 1}
              onClick={() => setTplPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-[#C6A568]/25 px-3 py-1 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={tplPage >= tplTotalPages}
              onClick={() => setTplPage((p) => Math.min(tplTotalPages, p + 1))}
              className="rounded-lg border border-[#C6A568]/25 px-3 py-1 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
