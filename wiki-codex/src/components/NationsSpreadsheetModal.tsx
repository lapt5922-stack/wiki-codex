"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, BookOpen, Download, Globe2, Search, Table2, X } from "lucide-react";
import { BIOME_META, TIER_META } from "@/lib/planetary-atlas/climate-geology";
import { CONTINENT_NAME_VI } from "@/lib/planetary-atlas/nations-data";
import type { AtlasBiomeId, ContinentId, PlanetaryNation } from "@/lib/planetary-atlas/types";

interface NationsSpreadsheetModalProps {
  nations: PlanetaryNation[];
  onClose: () => void;
  onFocusOnMap: (nation: PlanetaryNation) => void;
  onOpenWikiEntry: (entryId: string) => void;
}

type SortKey =
  | "nationNum"
  | "name"
  | "population"
  | "areaKm2"
  | "density"
  | "elevationM"
  | "avgTempC";

function normalizeText(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

export function NationsSpreadsheetModal({
  nations,
  onClose,
  onFocusOnMap,
  onOpenWikiEntry,
}: NationsSpreadsheetModalProps) {
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState<ContinentId | "ALL">("ALL");
  const [biome, setBiome] = useState<AtlasBiomeId | "ALL">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("nationNum");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());
    const list = nations.filter((n) => {
      if (continent !== "ALL" && n.continent !== continent) return false;
      if (biome !== "ALL" && n.biome !== biome) return false;
      if (!q) return true;
      const hay = normalizeText(
        `#${n.nationNum} ${n.name} ${n.shortName} ${n.capital} ${n.bloc} ${n.governmentType} ${n.primaryLanguage}`,
      );
      return hay.includes(q);
    });

    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name, "vi") * dir;
      if (sortKey === "density") {
        const da = a.population / Math.max(1, a.areaKm2);
        const db = b.population / Math.max(1, b.areaKm2);
        return (da - db) * dir;
      }
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
    return list;
  }, [nations, query, continent, biome, sortKey, sortDir]);

  // #15 Planetary Biome Distribution Summary
  const biomeBreakdown = useMemo(() => {
    const counts = new Map<AtlasBiomeId, number>();
    for (const n of filtered) {
      counts.set(n.biome, (counts.get(n.biome) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([id, count]) => ({
        id,
        label: BIOME_META[id].label,
        color: BIOME_META[id].color,
        count,
        pct: filtered.length > 0 ? Math.round((count / filtered.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "nationNum" || key === "name" ? "asc" : "desc");
    }
  };

  // #42 1-Click CSV Export (UTF-8 BOM so Vietnamese opens cleanly in Excel)
  const handleExportCsv = () => {
    const headers = [
      "Ma_So",
      "Ten_Quoc_Gia",
      "Ten_Ngan",
      "Thu_Do",
      "Luc_Dia",
      "Khu_Vuc",
      "Khoi_Lien_Minh",
      "Quy_Mo",
      "The_Che",
      "Ngon_Ngu_Chinh",
      "He_Sinh_Thai",
      "Dan_So",
      "Dien_Tich_km2",
      "Mat_Do_Nguoi_km2",
      "Cao_Do_m",
      "Nhiet_Do_TB_C",
      "Vi_Do",
      "Kinh_Do",
    ];
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = filtered.map((n) => [
      n.nationNum,
      n.name,
      n.shortName,
      n.capital,
      CONTINENT_NAME_VI[n.continent],
      n.regionCode,
      n.bloc,
      TIER_META[n.tier].shortLabel,
      n.governmentType,
      n.primaryLanguage,
      BIOME_META[n.biome].label,
      n.population,
      n.areaKm2,
      Math.round(n.population / Math.max(1, n.areaKm2)),
      n.elevationM,
      n.avgTempC,
      n.latLabel,
      n.lonLabel,
    ]);

    const csv = "\uFEFF" + [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `danh-ba-360-quoc-gia-aethelgard.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm">
      <div className="animate-codex-scale-in flex h-[88vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-4 py-3">
          <div className="flex items-center gap-2">
            <Table2 className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Bảng Dữ Liệu Bách Khoa 360 Quốc Gia ({filtered.length} / {nations.length})
              </h3>
              <p className="text-[11px] text-slate-400">
                Sắp xếp đa cột, phân tích hệ sinh thái hành tinh và xuất Excel/CSV chuẩn UTF-8.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="codex-press inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Xuất CSV / Excel ({filtered.length})
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar + #15 Planetary Biome Analytics Strip */}
        <div className="border-b border-slate-800 bg-slate-900/60 px-4 py-2.5 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Lọc theo #số, tên quốc gia, thủ đô, khối liên minh, thể chế..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <select
              value={continent}
              onChange={(e) => setContinent(e.target.value as ContinentId | "ALL")}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tất cả 8 Lục địa & Hải vực</option>
              {(Object.keys(CONTINENT_NAME_VI) as ContinentId[]).map((cid) => (
                <option key={cid} value={cid}>
                  {CONTINENT_NAME_VI[cid]}
                </option>
              ))}
            </select>
            <select
              value={biome}
              onChange={(e) => setBiome(e.target.value as AtlasBiomeId | "ALL")}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200"
            >
              <option value="ALL">Tất cả 9 Hệ sinh thái</option>
              {(Object.keys(BIOME_META) as AtlasBiomeId[]).map((bid) => (
                <option key={bid} value={bid}>
                  {BIOME_META[bid].label}
                </option>
              ))}
            </select>
          </div>

          {/* Stacked Biome Bar */}
          {biomeBreakdown.length > 0 && (
            <div className="space-y-1">
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800">
                {biomeBreakdown.map((b) => (
                  <div
                    key={b.id}
                    title={`${b.label}: ${b.count} QG (${b.pct}%)`}
                    style={{ width: `${(b.count / Math.max(1, filtered.length)) * 100}%`, backgroundColor: b.color }}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                {biomeBreakdown.slice(0, 6).map((b) => (
                  <span key={b.id} className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.label}: <b className="text-slate-200">{b.count}</b> ({b.pct}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Virtualized-friendly Scrollable Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-slate-900 text-slate-300 border-b border-slate-800">
              <tr>
                {(
                  [
                    ["nationNum", "#"],
                    ["name", "Quốc gia & Thủ đô"],
                    [null, "Lục địa / Khối"],
                    ["population", "Dân số"],
                    ["areaKm2", "Diện tích"],
                    ["density", "Mật độ"],
                    ["elevationM", "Cao độ"],
                    ["avgTempC", "Nhiệt độ"],
                    [null, "Thao tác"],
                  ] as Array<[SortKey | null, string]>
                ).map(([key, label]) => (
                  <th key={label} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                    {key ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-cyan-300 cursor-pointer"
                      >
                        {label}
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </button>
                    ) : (
                      label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-slate-200">
              {filtered.map((n) => {
                const density = Math.round(n.population / Math.max(1, n.areaKm2));
                return (
                  <tr key={n.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2 font-mono text-cyan-300">#{n.nationNum}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-white flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: n.color }}
                        />
                        <span>{n.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Thủ đô {n.capital} • {n.governmentType}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="text-slate-200">{CONTINENT_NAME_VI[n.continent]}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{n.bloc}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-right whitespace-nowrap">
                      {n.population.toLocaleString("vi-VN")}
                    </td>
                    <td className="px-3 py-2 font-mono text-right whitespace-nowrap">
                      {n.areaKm2.toLocaleString("vi-VN")} km²
                    </td>
                    <td className="px-3 py-2 font-mono text-right whitespace-nowrap text-amber-200">
                      {density}/km²
                    </td>
                    <td className="px-3 py-2 font-mono text-right whitespace-nowrap">
                      {n.elevationM.toLocaleString("vi-VN")} m
                    </td>
                    <td className="px-3 py-2 font-mono text-right whitespace-nowrap text-sky-300">
                      {n.avgTempC}°C
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            onFocusOnMap(n);
                            onClose();
                          }}
                          className="rounded border border-cyan-500/40 bg-cyan-500/15 px-2 py-1 text-[10px] text-cyan-200 hover:bg-cyan-500/25 cursor-pointer"
                          title="Bay tới trên bản đồ"
                        >
                          <Globe2 className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onOpenWikiEntry(`ent-nation-${n.nationNum}`);
                            onClose();
                          }}
                          className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[10px] text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                          title="Mở hồ sơ Wiki"
                        >
                          <BookOpen className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
