"use client";

import React, { useMemo, useRef } from "react";
import { Compass, Download, Landmark, X } from "lucide-react";
import { BIOME_META } from "@/lib/planetary-atlas/climate-geology";
import { CONTINENT_NAME_VI } from "@/lib/planetary-atlas/nations-data";
import type { PlanetaryNation } from "@/lib/planetary-atlas/types";

interface CapitalCityBlueprintModalProps {
  nation: PlanetaryNation;
  onClose: () => void;
}

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function CapitalCityBlueprintModal({
  nation,
  onClose,
}: CapitalCityBlueprintModalProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const seed = nation.nationNum * 31 + 7;

  const isCoastal = nation.biome === "CORAL_SEA" || nation.biome === "ARCHIPELAGO";
  const isVolcanic = nation.biome === "ASH_VOLCANIC";
  const isGlacial = nation.biome === "GLACIAL_ICE";
  const isDesert = nation.biome === "SAND_DESERT" || nation.biome === "ARID_CANYON";

  const theme = useMemo(() => {
    if (isVolcanic) return { bg: "#1c1211", water: "#f97316", wall: "#fca5a5", road: "#fb923c", block: "#3b2321" };
    if (isGlacial) return { bg: "#0c1b2a", water: "#38bdf8", wall: "#bae6fd", road: "#7dd3fc", block: "#1e3a5f" };
    if (isDesert) return { bg: "#221a10", water: "#0ea5e9", wall: "#fcd34d", road: "#f59e0b", block: "#3f301d" };
    if (isCoastal) return { bg: "#081c2c", water: "#0284c7", wall: "#67e8f9", road: "#38bdf8", block: "#163850" };
    return { bg: "#0e1a1c", water: "#0ea5e9", wall: "#94a3b8", road: "#cbd5e1", block: "#1e3336" };
  }, [isVolcanic, isGlacial, isDesert, isCoastal]);

  // Deterministic radial avenues, city wall polygon, and urban blocks
  const geometry = useMemo(() => {
    const cx = 320;
    const cy = 210;
    const wallPts: string[] = [];
    const wallSides = 10 + (nation.nationNum % 4);
    for (let i = 0; i < wallSides; i++) {
      const a = (i / wallSides) * Math.PI * 2;
      const r = 132 + seededRand(seed + i * 3) * 26;
      wallPts.push(`${(cx + Math.cos(a) * r * 1.15).toFixed(1)},${(cy + Math.sin(a) * r * 0.92).toFixed(1)}`);
    }

    const avenues: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const aveCount = 6 + (nation.nationNum % 3);
    for (let i = 0; i < aveCount; i++) {
      const a = (i / aveCount) * Math.PI * 2 + seededRand(seed + i) * 0.25;
      avenues.push({
        x1: cx,
        y1: cy,
        x2: cx + Math.cos(a) * 185,
        y2: cy + Math.sin(a) * 145,
      });
    }

    const blocks: Array<{ x: number; y: number; w: number; h: number; rot: number }> = [];
    for (let i = 0; i < 42; i++) {
      const a = seededRand(seed + i * 11) * Math.PI * 2;
      const dist = 34 + seededRand(seed + i * 17) * 96;
      blocks.push({
        x: cx + Math.cos(a) * dist * 1.12,
        y: cy + Math.sin(a) * dist * 0.88,
        w: 12 + seededRand(seed + i * 23) * 18,
        h: 8 + seededRand(seed + i * 29) * 12,
        rot: Math.round((a * 180) / Math.PI),
      });
    }

    const landmarks = [
      { label: `Quảng trường ${nation.capital}`, x: cx, y: cy, color: "#fbbf24" },
      { label: `Đại Thư viện & Văn khố`, x: cx - 64, y: cy - 38, color: "#38bdf8" },
      { label: `Hội đồng Hành chính`, x: cx + 62, y: cy - 32, color: "#a78bfa" },
      { label: isCoastal ? "Thương cảng Viễn dương" : "Chợ Trung tâm & Bến xe", x: cx + 46, y: cy + 56, color: "#34d399" },
      { label: `Đài Trắc địa ${nation.regionCode}`, x: cx - 58, y: cy + 52, color: "#f472b6" },
    ];

    return { wallPoly: wallPts.join(" "), avenues, blocks, landmarks };
  }, [nation, seed, isCoastal]);

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const raw = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([raw], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blueprint-${nation.capital.toLowerCase().replace(/\s+/g, "-")}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="animate-codex-scale-in w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">
                Sơ đồ Quy hoạch Thủ đô {nation.capital}
              </h3>
              <p className="text-[11px] text-slate-400">
                #{nation.nationNum} {nation.name} • {BIOME_META[nation.biome].label} • Cao độ{" "}
                {nation.elevationM.toLocaleString("vi-VN")} m
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSvg}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-medium text-cyan-200 hover:bg-slate-700 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Tải SVG
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-800">
            <svg
              ref={svgRef}
              viewBox="0 0 640 420"
              className="block w-full h-auto"
              style={{ backgroundColor: theme.bg }}
            >
              {/* Blueprint grid */}
              <g stroke="rgba(148,163,184,0.12)" strokeWidth={0.7}>
                {Array.from({ length: 16 }, (_, i) => i * 40).map((gx) => (
                  <line key={`gx-${gx}`} x1={gx} y1={0} x2={gx} y2={420} />
                ))}
                {Array.from({ length: 11 }, (_, i) => i * 40).map((gy) => (
                  <line key={`gy-${gy}`} x1={0} y1={gy} x2={640} y2={gy} />
                ))}
              </g>

              {/* Waterway / Geothermal Canal / Coastal Bay */}
              {isCoastal ? (
                <path
                  d="M0,310 Q180,275 340,320 T640,295 L640,420 L0,420 Z"
                  fill={theme.water}
                  fillOpacity={0.32}
                  stroke={theme.water}
                  strokeWidth={1.6}
                />
              ) : (
                <path
                  d="M0,120 Q190,175 320,210 T640,315"
                  fill="none"
                  stroke={theme.water}
                  strokeOpacity={isVolcanic ? 0.5 : 0.45}
                  strokeWidth={14}
                  strokeLinecap="round"
                />
              )}

              {/* Outer City Wall & Ring Road */}
              <polygon
                points={geometry.wallPoly}
                fill="rgba(255,255,255,0.03)"
                stroke={theme.wall}
                strokeWidth={2.2}
                strokeDasharray="8 4"
              />
              <ellipse
                cx={320}
                cy={210}
                rx={92}
                ry={74}
                fill="none"
                stroke={theme.road}
                strokeOpacity={0.45}
                strokeWidth={1.4}
              />

              {/* Radial Avenues */}
              <g stroke={theme.road} strokeOpacity={0.55} strokeWidth={1.6}>
                {geometry.avenues.map((av, idx) => (
                  <line key={`av-${idx}`} x1={av.x1} y1={av.y1} x2={av.x2} y2={av.y2} />
                ))}
              </g>

              {/* Urban Blocks */}
              <g>
                {geometry.blocks.map((b, idx) => (
                  <rect
                    key={`blk-${idx}`}
                    x={b.x - b.w / 2}
                    y={b.y - b.h / 2}
                    width={b.w}
                    height={b.h}
                    rx={2}
                    fill={theme.block}
                    stroke={theme.wall}
                    strokeOpacity={0.35}
                    strokeWidth={0.8}
                    transform={`rotate(${b.rot} ${b.x} ${b.y})`}
                  />
                ))}
              </g>

              {/* Key Civic Landmarks */}
              {geometry.landmarks.map((lm, idx) => (
                <g key={`lm-${idx}`} transform={`translate(${lm.x}, ${lm.y})`}>
                  <circle r={6} fill={lm.color} stroke="#0f172a" strokeWidth={1.5} />
                  <rect
                    x={-lm.label.length * 3.2 - 6}
                    y={-22}
                    width={lm.label.length * 6.4 + 12}
                    height={15}
                    rx={4}
                    fill="rgba(15,23,42,0.88)"
                    stroke={lm.color}
                    strokeOpacity={0.6}
                    strokeWidth={0.8}
                  />
                  <text
                    y={-11.5}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize={9.5}
                    fontWeight={600}
                  >
                    {lm.label}
                  </text>
                </g>
              ))}

              {/* Compass & Scale Legend */}
              <g transform="translate(575, 52)">
                <circle r={24} fill="rgba(15,23,42,0.75)" stroke="#64748b" strokeWidth={1} />
                <text y={-11} textAnchor="middle" fill="#38bdf8" fontSize={9} fontWeight={700}>B</text>
                <text y={18} textAnchor="middle" fill="#94a3b8" fontSize={8}>N</text>
                <line x1={0} y1={-8} x2={0} y2={8} stroke="#38bdf8" strokeWidth={1.2} />
                <line x1={-8} y1={0} x2={8} y2={0} stroke="#64748b" strokeWidth={1} />
              </g>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              {CONTINENT_NAME_VI[nation.continent]} • Tọa độ {nation.latLabel}, {nation.lonLabel}
            </span>
            <span>
              {isVolcanic
                ? "Quy hoạch theo mạch địa nhiệt & tường bazan"
                : isCoastal
                  ? "Quy hoạch đô thị hải cảng & vịnh san hô"
                  : "Quy hoạch đô thị hướng tâm kết nối lưu trữ & thương đoàn"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
