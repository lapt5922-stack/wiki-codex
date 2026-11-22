"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { PlanetaryAtlasBundle, PlanetaryNation, Point2D } from "@/lib/planetary-atlas/types";

interface PlanetaryGlobeViewProps {
  bundle: PlanetaryAtlasBundle;
  selectedNationId: string | null;
  onSelectNation: (nation: PlanetaryNation) => void;
}

const DEG2RAD = Math.PI / 180;

/**
 * Orthographic 3D projection of normalized equirectangular (x,y in [0..1])
 * onto a unit sphere rotated by (rotLonDeg, rotLatDeg).
 */
function projectPoint3D(
  pt: Point2D,
  rotLonDeg: number,
  rotLatDeg: number,
  cx: number,
  cy: number,
  radius: number,
): { sx: number; sy: number; visible: boolean; z: number } {
  const lon = (pt.x - 0.5) * 360 * DEG2RAD;
  const lat = (0.5 - pt.y) * 180 * DEG2RAD;
  const lam0 = rotLonDeg * DEG2RAD;
  const phi0 = rotLatDeg * DEG2RAD;

  const dLon = lon - lam0;
  const cosLat = Math.cos(lat);
  const sinLat = Math.sin(lat);
  const cosPhi0 = Math.cos(phi0);
  const sinPhi0 = Math.sin(phi0);

  const z = sinPhi0 * sinLat + cosPhi0 * cosLat * Math.cos(dLon);
  const x = cosLat * Math.sin(dLon);
  const y = cosPhi0 * sinLat - sinPhi0 * cosLat * Math.cos(dLon);

  return {
    sx: cx + x * radius,
    sy: cy - y * radius,
    visible: z > -0.04,
    z,
  };
}

export function PlanetaryGlobeView({
  bundle,
  selectedNationId,
  onSelectNation,
}: PlanetaryGlobeViewProps) {
  const [rotLon, setRotLon] = useState<number>(36); // Start centered on Aurelia Tri-Border
  const [rotLat, setRotLat] = useState<number>(18);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const dragRef = useRef<{ active: boolean; x: number; y: number; lon: number; lat: number }>({
    active: false,
    x: 0,
    y: 0,
    lon: 36,
    lat: 18,
  });

  useEffect(() => {
    if (!autoSpin) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotLon((prev) => (prev + dt * 11) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin]);

  const W = 900;
  const H = 560;
  const cx = W / 2;
  const cy = H / 2;
  const R = 232;

  // Project graticule meridians and parallels
  const graticulePaths = useMemo(() => {
    const paths: string[] = [];
    // Parallels every 30 deg
    for (let latDeg = -60; latDeg <= 60; latDeg += 30) {
      const ny = 0.5 - latDeg / 180;
      let d = "";
      for (let step = 0; step <= 72; step++) {
        const nx = step / 72;
        const p = projectPoint3D({ x: nx, y: ny }, rotLon, rotLat, cx, cy, R);
        if (p.visible) {
          d += `${d === "" || d.endsWith(" ") ? "M" : "L"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
        } else if (d && !d.endsWith(" ")) {
          d += " ";
        }
      }
      if (d) paths.push(d);
    }
    // Meridians every 30 deg
    for (let lonDeg = -180; lonDeg < 180; lonDeg += 30) {
      const nx = lonDeg / 360 + 0.5;
      let d = "";
      for (let step = 0; step <= 36; step++) {
        const ny = step / 36;
        const p = projectPoint3D({ x: nx, y: ny }, rotLon, rotLat, cx, cy, R);
        if (p.visible) {
          d += `${d === "" || d.endsWith(" ") ? "M" : "L"}${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
        } else if (d && !d.endsWith(" ")) {
          d += " ";
        }
      }
      if (d) paths.push(d);
    }
    return paths;
  }, [rotLon, rotLat]);

  // Project 8 continents onto sphere
  const continentPolys = useMemo(() => {
    const colors: Record<string, string> = {
      AURELIA: "#2c7a5b",
      OCCIDENTALIS: "#3a6ea5",
      ORIENTIS: "#2a8567",
      AUSTRALIS: "#7c5ba6",
      HESPERIA: "#2a7c76",
      SOLARA: "#b38a32",
      ARCTIC_ICE: "#cbd5e1",
      ANTARCTIC_ICE: "#cbd5e1",
    };
    return Object.entries(bundle.continents).map(([cid, mask]) => {
      const projected = mask
        .map((pt) => projectPoint3D(pt, rotLon, rotLat, cx, cy, R))
        .filter((p) => p.z > -0.15);
      if (projected.length < 3) return null;
      const pts = projected.map((p) => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(" ");
      return { id: cid, pts, fill: colors[cid] ?? "#3b82f6" };
    });
  }, [bundle.continents, rotLon, rotLat]);

  // Project visible nations (show all Imperial/Major + Tri-Border + selected)
  const visibleMarkers = useMemo(() => {
    return bundle.nations
      .filter(
        (n) =>
          n.lodTier <= 1 ||
          n.isTriBorder ||
          n.id === selectedNationId ||
          n.nationNum % 6 === 0,
      )
      .map((n) => ({
        nation: n,
        proj: projectPoint3D({ x: n.x, y: n.y }, rotLon, rotLat, cx, cy, R),
      }))
      .filter((item) => item.proj.z > 0.08);
  }, [bundle.nations, rotLon, rotLat, selectedNationId]);

  return (
    <div
      className="relative flex-1 w-full h-full overflow-hidden bg-[#030916] select-none touch-none cursor-grab active:cursor-grabbing"
      onPointerDown={(e) => {
        setAutoSpin(false);
        dragRef.current = { active: true, x: e.clientX, y: e.clientY, lon: rotLon, lat: rotLat };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.x;
        const dy = e.clientY - dragRef.current.y;
        setRotLon(dragRef.current.lon - dx * 0.35);
        setRotLat(Math.max(-68, Math.min(68, dragRef.current.lat + dy * 0.3)));
      }}
      onPointerUp={() => {
        dragRef.current.active = false;
      }}
      onPointerLeave={() => {
        dragRef.current.active = false;
      }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full">
        <defs>
          <radialGradient id="globe-ocean" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#12406e" />
            <stop offset="60%" stopColor="#08203e" />
            <stop offset="100%" stopColor="#030b19" />
          </radialGradient>
          <radialGradient id="globe-atmo" cx="50%" cy="50%" r="54%">
            <stop offset="82%" stopColor="rgba(56,189,248,0)" />
            <stop offset="96%" stopColor="rgba(56,189,248,0.28)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
        </defs>

        {/* Subtle Starfield */}
        <g fill="#e2e8f0" opacity={0.4}>
          {Array.from({ length: 48 }, (_, i) => (
            <circle
              key={`st-${i}`}
              cx={((i * 197) % W) + 12}
              cy={((i * 131) % H) + 8}
              r={(i % 3) * 0.55 + 0.5}
            />
          ))}
        </g>

        {/* Atmospheric Halo */}
        <circle cx={cx} cy={cy} r={R + 22} fill="url(#globe-atmo)" />

        {/* Sphere Ocean Body */}
        <circle cx={cx} cy={cy} r={R} fill="url(#globe-ocean)" stroke="#38bdf8" strokeOpacity={0.45} strokeWidth={1.5} />

        {/* Graticule */}
        <g fill="none" stroke="#38bdf8" strokeOpacity={0.18} strokeWidth={0.8}>
          {graticulePaths.map((d, idx) => (
            <path key={`gr-${idx}`} d={d} />
          ))}
        </g>

        {/* 8 Continents projected on 3D Sphere */}
        <g>
          {continentPolys.map((poly) =>
            poly ? (
              <polygon
                key={`gcont-${poly.id}`}
                points={poly.pts}
                fill={poly.fill}
                fillOpacity={0.82}
                stroke="#e2e8f0"
                strokeOpacity={0.35}
                strokeWidth={1.1}
              />
            ) : null,
          )}
        </g>

        {/* Clickable Nation Markers */}
        <g>
          {visibleMarkers.map(({ nation, proj }) => {
            const isSel = nation.id === selectedNationId;
            return (
              <g
                key={`gm-${nation.id}`}
                transform={`translate(${proj.sx.toFixed(1)}, ${proj.sy.toFixed(1)})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNation(nation);
                }}
                className="cursor-pointer"
              >
                <circle
                  r={isSel ? 6 : nation.lodTier === 0 ? 4.4 : 2.6}
                  fill={isSel ? "#ffffff" : nation.isTriBorder ? "#fbbf24" : nation.color}
                  stroke="#0f172a"
                  strokeWidth={1.2}
                />
                {(nation.lodTier === 0 || nation.isTriBorder || isSel) && (
                  <text
                    y={-8}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize={isSel ? 12 : 10.5}
                    fontWeight={700}
                    style={{ textShadow: "0 1px 4px rgba(0,0,0,0.95)" }}
                  >
                    #{nation.nationNum} {nation.shortName}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Globe Controls */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs backdrop-blur">
        <span className="font-semibold text-cyan-300">Quả cầu 3D Aethelgard Prime</span>
        <span className="text-slate-400 hidden sm:inline">• Kéo để xoay 360°</span>
        <button
          type="button"
          onClick={() => setAutoSpin((s) => !s)}
          className="ml-1 inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-200 hover:bg-slate-700 cursor-pointer"
        >
          {autoSpin ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {autoSpin ? "Dừng xoay" : "Tự xoay"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAutoSpin(false);
            setRotLon(36);
            setRotLat(18);
          }}
          className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-500/30 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" /> Tam Biên
        </button>
      </div>
    </div>
  );
}
