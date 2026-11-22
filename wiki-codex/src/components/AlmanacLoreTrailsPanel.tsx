"use client";

import React, { useMemo, useState } from "react";
import { Compass, Globe2, Mountain, Sparkles, TrendingUp, Users } from "lucide-react";
import { buildPlanetaryAtlasBundle } from "@/lib/planetary-atlas/generator";
import { CONTINENT_NAME_VI } from "@/lib/planetary-atlas/nations-data";

interface AlmanacLoreTrailsPanelProps {
  onOpenEntry: (entryId: string) => void;
  onOpenAtlas: () => void;
}

type RankingKind = "population" | "area" | "elevation" | "coldest";

const LORE_TRAILS = [
  {
    id: "trail-triborder",
    title: "Hành trình Liên minh Tam Biên Aurelia",
    subtitle: "Khám phá 3 trụ cột đồng minh Valoria – Zog-Koth – Ignisia và 2 đặc khu lưu trữ trung lập",
    color: "#22c55e",
    steps: [
      { id: "ent-nation-1", label: "#1 Valoria" },
      { id: "ent-nation-2", label: "#2 Zog-Koth" },
      { id: "ent-nation-3", label: "#3 Ignisia" },
      { id: "ent-nation-201", label: "#201 Vùng Đệm Tam Biên" },
      { id: "ent-nation-203", label: "#203 Học Viện Ngã Ba" },
    ],
  },
  {
    id: "trail-great-powers",
    title: "Đại Hải Trình Xuyên 8 Lục Địa",
    subtitle: "Đi qua các đại quốc trung tâm từ phương Tây Occidentalis tới Viễn Đông và Nam Bán Cầu",
    color: "#38bdf8",
    steps: [
      { id: "ent-nation-4", label: "#4 Occidentia" },
      { id: "ent-nation-5", label: "#5 Ngọc Lĩnh" },
      { id: "ent-nation-6", label: "#6 Hesperia" },
      { id: "ent-nation-7", label: "#7 Solara" },
      { id: "ent-nation-8", label: "#8 Australis" },
    ],
  },
  {
    id: "trail-codex-core",
    title: "Kho Tàng Cổ Ngữ & Tháp Tinh Tú",
    subtitle: "Lộ trình nền tảng về lịch sử Aethelgard, Cổ ngữ Aethel'va và Hiệp ước Ánh Sao",
    color: "#d4af37",
    steps: [
      { id: "ent-bang-trieu", label: "Vương quốc Băng Triều" },
      { id: "ent-solaria", label: "Đế chế Solaria" },
      { id: "ent-orakel", label: "Tháp Tinh Tú Orakel'on" },
      { id: "ent-aethelva", label: "Cổ ngữ Aethel'va" },
    ],
  },
];

export function AlmanacLoreTrailsPanel({
  onOpenEntry,
  onOpenAtlas,
}: AlmanacLoreTrailsPanelProps) {
  const bundle = useMemo(() => buildPlanetaryAtlasBundle(), []);
  const [rankKind, setRankKind] = useState<RankingKind>("population");

  // Deterministic "Nation of the Day" based on calendar date
  const featuredNation = useMemo(() => {
    const daySeed = Math.floor(Date.now() / 86_400_000);
    return bundle.nations[daySeed % bundle.nations.length];
  }, [bundle.nations]);

  const topNations = useMemo(() => {
    const copy = [...bundle.nations];
    if (rankKind === "population") copy.sort((a, b) => b.population - a.population);
    else if (rankKind === "area") copy.sort((a, b) => b.areaKm2 - a.areaKm2);
    else if (rankKind === "elevation") copy.sort((a, b) => b.elevationM - a.elevationM);
    else copy.sort((a, b) => a.avgTempC - b.avgTempC);
    return copy.slice(0, 6);
  }, [bundle.nations, rankKind]);

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-codex-fade-up">
      {/* Left: Niên Giám & BXH Địa lý 360 Quốc gia */}
      <div className="lg:col-span-7 codex-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-display text-base font-semibold text-[var(--accent)]">
              Niên Giám & Bảng Xếp Hạng Địa Lý 360 Quốc Gia
            </h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["population", "Đông dân"],
                ["area", "Rộng nhất"],
                ["elevation", "Cao nhất"],
                ["coldest", "Lạnh nhất"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRankKind(k)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium transition cursor-pointer ${
                  rankKind === k
                    ? "bg-[var(--accent)] text-[#090e1c] font-semibold"
                    : "border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Nation of the Day */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-cyan-300">
              <Sparkles className="w-3 h-3" /> Quốc gia Nổi bật Trong ngày
            </div>
            <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
              #{featuredNation.nationNum} {featuredNation.name} ({featuredNation.capital})
            </div>
            <div className="text-[11px] text-[var(--text-muted)] line-clamp-1">
              {CONTINENT_NAME_VI[featuredNation.continent]} • {featuredNation.summary}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenEntry(`ent-nation-${featuredNation.nationNum}`)}
              className="rounded-lg bg-cyan-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 cursor-pointer"
            >
              Đọc hồ sơ
            </button>
            <button
              type="button"
              onClick={onOpenAtlas}
              className="rounded-lg border border-cyan-500/40 px-2.5 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/15 cursor-pointer"
            >
              <Globe2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Top 6 Geographic Ranking */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {topNations.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onOpenEntry(`ent-nation-${n.nationNum}`)}
              className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/50 px-3 py-2 text-left hover:border-[var(--accent)] transition cursor-pointer codex-card-lift"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  <span className="text-[var(--accent)] font-mono mr-1.5">#{idx + 1}</span>
                  {n.shortName}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] truncate">
                  {n.capital} • {CONTINENT_NAME_VI[n.continent]}
                </div>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-semibold text-cyan-300">
                {rankKind === "population"
                  ? `${(n.population / 1_000_000).toFixed(1)}M`
                  : rankKind === "area"
                    ? `${(n.areaKm2 / 1000).toFixed(0)}k km²`
                    : rankKind === "elevation"
                      ? `${n.elevationM.toLocaleString("vi-VN")} m`
                      : `${n.avgTempC}°C`}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Lộ trình Khám phá Chủ đề (Guided Lore Trails) */}
      <div className="lg:col-span-5 codex-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <h3 className="font-display text-base font-semibold text-[var(--accent)]">
            Lộ Trình Đọc Theo Chủ Đề (Lore Trails)
          </h3>
        </div>
        <div className="space-y-2.5">
          {LORE_TRAILS.map((trail) => (
            <div
              key={trail.id}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)]/55 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: trail.color }}
                />
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  {trail.title}
                </div>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {trail.subtitle}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trail.steps.map((step, sIdx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => onOpenEntry(step.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-white/5 px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
                  >
                    <span className="font-mono text-[10px] opacity-60">{sIdx + 1}.</span>
                    <span>{step.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
