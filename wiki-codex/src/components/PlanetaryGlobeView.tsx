"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Cloud, Moon, Pause, Play, RotateCcw, Sun } from "lucide-react";
import { samplePlanetaryTerrainPixel, fbm2D } from "@/lib/planetary-atlas/terrain-backdrop";
import type { PlanetaryAtlasBundle, PlanetaryNation, Point2D } from "@/lib/planetary-atlas/types";

interface PlanetaryGlobeViewProps {
  bundle: PlanetaryAtlasBundle;
  selectedNationId: string | null;
  onSelectNation: (nation: PlanetaryNation) => void;
  season?: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER";
}

const DEG2RAD = Math.PI / 180;
const TEX_W = 640;
const TEX_H = 320;
const GLOBE_PX = 420;

interface BakedPlanetTexture {
  day: Uint8ClampedArray;
  isLand: Uint8Array;
  elev: Float32Array;
  clouds: Uint8Array;
}

const bakedTextureCache = new Map<string, BakedPlanetTexture>();

function getOrBakePlanetTexture(season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER"): BakedPlanetTexture {
  const cached = bakedTextureCache.get(season);
  if (cached) return cached;

  const day = new Uint8ClampedArray(TEX_W * TEX_H * 3);
  const isLand = new Uint8Array(TEX_W * TEX_H);
  const elev = new Float32Array(TEX_W * TEX_H);
  const clouds = new Uint8Array(TEX_W * TEX_H);

  for (let py = 0; py < TEX_H; py++) {
    const ny = (py + 0.5) / TEX_H;
    for (let px = 0; px < TEX_W; px++) {
      const nx = (px + 0.5) / TEX_W;
      const idx = py * TEX_W + px;
      const sample = samplePlanetaryTerrainPixel(nx, ny, "PHYSICAL_RELIEF", season);
      day[idx * 3] = sample.r;
      day[idx * 3 + 1] = sample.g;
      day[idx * 3 + 2] = sample.b;
      isLand[idx] = sample.isLand ? 1 : 0;
      elev[idx] = sample.elevation;

      // Soft swirling cloud bands
      const c1 = fbm2D(nx * 10 + Math.sin(ny * Math.PI * 3) * 0.4, ny * 6.5);
      const c2 = fbm2D(nx * 22 + 4.1, ny * 14 + 2.7);
      const rawCloud = c1 * 0.65 + c2 * 0.35;
      clouds[idx] = rawCloud > 0.57 ? Math.min(255, Math.round(((rawCloud - 0.57) / 0.32) * 235)) : 0;
    }
  }

  const built: BakedPlanetTexture = { day, isLand, elev, clouds };
  bakedTextureCache.set(season, built);
  return built;
}

function projectPoint3D(
  pt: Point2D,
  rotLonDeg: number,
  rotLatDeg: number,
  cx: number,
  cy: number,
  radius: number,
): { sx: number; sy: number; visible: boolean; z: number; nx: number; ny: number; nz: number } {
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
    visible: z > 0.04,
    z,
    nx: x,
    ny: y,
    nz: z,
  };
}

export function PlanetaryGlobeView({
  bundle,
  selectedNationId,
  onSelectNation,
  season = "SPRING",
}: PlanetaryGlobeViewProps) {
  const [rotLon, setRotLon] = useState<number>(36);
  const [rotLat, setRotLat] = useState<number>(16);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [showClouds, setShowClouds] = useState<boolean>(true);
  const [showNightLights, setShowNightLights] = useState<boolean>(true);
  const [sunAngleDeg, setSunAngleDeg] = useState<number>(38);
  const [cloudOffset, setCloudOffset] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ active: boolean; x: number; y: number; lon: number; lat: number }>({
    active: false,
    x: 0,
    y: 0,
    lon: 36,
    lat: 16,
  });

  const texture = useMemo(() => getOrBakePlanetTexture(season), [season]);

  // Smooth 60 FPS spin + gentle cloud drift
  useEffect(() => {
    if (!autoSpin && !showClouds) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (autoSpin) {
        setRotLon((prev) => (prev + dt * 10) % 360);
      }
      if (showClouds) {
        setCloudOffset((prev) => (prev + dt * 0.006) % 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoSpin, showClouds]);

  // Precomputed starfield
  const stars = useMemo(
    () =>
      Array.from({ length: 120 }, (_, i) => ({
        x: ((i * 197 + 31) % 900),
        y: ((i * 131 + 17) % 560),
        r: (i % 4 === 0 ? 1.45 : i % 3 === 0 ? 1.0 : 0.6),
        o: 0.25 + ((i * 53) % 70) / 100,
      })),
    [],
  );

  // Sun direction vector in camera space
  const sunVec = useMemo(() => {
    const rad = sunAngleDeg * DEG2RAD;
    const lx = Math.cos(rad) * 0.88;
    const ly = 0.26;
    const lz = Math.sin(rad) * 0.88 + 0.38;
    const len = Math.hypot(lx, ly, lz) || 1;
    return { x: lx / len, y: ly / len, z: lz / len };
  }, [sunAngleDeg]);

  // Render photorealistic 3D shaded sphere onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = ctx.createImageData(GLOBE_PX, GLOBE_PX);
    const out = img.data;

    const half = GLOBE_PX / 2;
    const radPx = half - 4;
    const lam0 = rotLon * DEG2RAD;
    const phi0 = rotLat * DEG2RAD;
    const cosPhi0 = Math.cos(phi0);
    const sinPhi0 = Math.sin(phi0);

    const { day, isLand, elev, clouds } = texture;
    const lx = sunVec.x;
    const ly = sunVec.y;
    const lz = sunVec.z;

    // Half-vector for ocean specular glint (viewer is at (0,0,1))
    const hx = lx;
    const hy = ly;
    const hz = lz + 1;
    const hLen = Math.hypot(hx, hy, hz) || 1;
    const nhx = hx / hLen;
    const nhy = hy / hLen;
    const nhz = hz / hLen;

    for (let py = 0; py < GLOBE_PX; py++) {
      const ny = (half - py) / radPx;
      const ny2 = ny * ny;
      for (let px = 0; px < GLOBE_PX; px++) {
        const nx = (px - half) / radPx;
        const r2 = nx * nx + ny2;
        if (r2 > 1) continue;

        const nz = Math.sqrt(1 - r2);
        const sinLat = Math.max(-1, Math.min(1, ny * cosPhi0 + nz * sinPhi0));
        const lat = Math.asin(sinLat);
        const lon = lam0 + Math.atan2(nx, nz * cosPhi0 - ny * sinPhi0);

        let u = lon / (2 * Math.PI) + 0.5;
        u = u - Math.floor(u);
        const v = 0.5 - lat / Math.PI;

        const tx = Math.min(TEX_W - 1, Math.max(0, Math.floor(u * TEX_W)));
        const ty = Math.min(TEX_H - 1, Math.max(0, Math.floor(v * TEX_H)));
        const tidx = ty * TEX_W + tx;

        let r = day[tidx * 3];
        let g = day[tidx * 3 + 1];
        let b = day[tidx * 3 + 2];
        const land = isLand[tidx] === 1;

        // Directional 3D sun illumination + subtle bump relief for mountains
        const elevBump = land ? elev[tidx] * 0.14 : 0;
        const ndotl = nx * lx + ny * ly + nz * lz + elevBump;
        const dayFactor = Math.max(0.10, Math.min(1.18, ndotl * 1.12 + 0.14));

        // Warm amber-orange Twilight Terminator band where sun grazes horizon
        const twilight = Math.max(0, 1 - Math.abs(ndotl + 0.04) * 5.2);

        r = r * dayFactor + twilight * 42;
        g = g * dayFactor + twilight * 18;
        b = b * dayFactor + twilight * 6;

        // Ocean Specular Sun Glint (realistic sunlight reflection off water)
        if (!land && ndotl > 0.05) {
          const ndoth = Math.max(0, nx * nhx + ny * nhy + nz * nhz);
          const spec = Math.pow(ndoth, 28) * 110;
          r += spec * 1.0;
          g += spec * 0.96;
          b += spec * 0.85;
        }

        // Translucent drifting 3D cloud layer
        if (showClouds) {
          let cu = u + cloudOffset;
          if (cu >= 1) cu -= 1;
          const ctxX = Math.min(TEX_W - 1, Math.floor(cu * TEX_W));
          const cAlpha = clouds[ty * TEX_W + ctxX] / 255;
          if (cAlpha > 0.02) {
            const cLit = Math.max(0.14, Math.min(1.05, ndotl * 1.05 + 0.18));
            const cr = 246 * cLit + twilight * 36;
            const cg = 250 * cLit + twilight * 14;
            const cb = 255 * cLit;
            const mix = cAlpha * 0.72;
            r = r * (1 - mix) + cr * mix;
            g = g * (1 - mix) + cg * mix;
            b = b * (1 - mix) + cb * mix;
          }
        }

        // 3D Fresnel Atmospheric Rim Glow (bright sapphire haze toward sphere limb)
        const rim = Math.pow(1 - nz, 2.6);
        const rimSun = Math.max(0.28, ndotl + 0.45);
        r += rim * 42 * rimSun;
        g += rim * 145 * rimSun;
        b += rim * 245 * rimSun;

        const p = (py * GLOBE_PX + px) * 4;
        out[p] = r > 255 ? 255 : r < 0 ? 0 : r;
        out[p + 1] = g > 255 ? 255 : g < 0 ? 0 : g;
        out[p + 2] = b > 255 ? 255 : b < 0 ? 0 : b;
        out[p + 3] = 255;
      }
    }

    ctx.putImageData(img, 0, 0);
  }, [texture, rotLon, rotLat, sunVec, showClouds, cloudOffset]);

  const W = 900;
  const H = 560;
  const cx = W / 2;
  const cy = H / 2;
  const R = 232;

  const visibleMarkers = useMemo(() => {
    return bundle.nations
      .filter(
        (n) =>
          n.lodTier <= 1 ||
          n.isTriBorder ||
          n.id === selectedNationId ||
          n.nationNum % 5 === 0,
      )
      .map((n) => {
        const proj = projectPoint3D({ x: n.x, y: n.y }, rotLon, rotLat, cx, cy, R);
        const ndotl = proj.nx * sunVec.x + proj.ny * sunVec.y + proj.nz * sunVec.z;
        return { nation: n, proj, isNightSide: ndotl < 0.04 };
      })
      .filter((item) => item.proj.z > 0.08);
  }, [bundle.nations, rotLon, rotLat, selectedNationId, sunVec]);

  return (
    <div
      className="relative flex-1 w-full h-full overflow-hidden bg-[#020612] select-none touch-none cursor-grab active:cursor-grabbing"
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
      {/* Background Starfield & Atmospheric Halo + Interactive SVG Markers */}
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full">
        <defs>
          <radialGradient id="globe-outer-halo" cx="50%" cy="50%" r="55%">
            <stop offset="76%" stopColor="rgba(56,189,248,0)" />
            <stop offset="88%" stopColor="rgba(56,189,248,0.28)" />
            <stop offset="96%" stopColor="rgba(14,165,233,0.12)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0)" />
          </radialGradient>
          <radialGradient id="space-nebula" cx="24%" cy="22%" r="72%">
            <stop offset="0%" stopColor="rgba(30,58,138,0.22)" />
            <stop offset="55%" stopColor="rgba(15,23,42,0.08)" />
            <stop offset="100%" stopColor="rgba(2,6,23,0)" />
          </radialGradient>
          <clipPath id="globe-sphere-clip">
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
        </defs>

        <rect width={W} height={H} fill="url(#space-nebula)" />

        {/* Multi-tier Deep Starfield */}
        <g fill="#f8fafc">
          {stars.map((s, idx) => (
            <circle key={`st-${idx}`} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />
          ))}
        </g>

        {/* Outer Atmospheric Scattering Halo */}
        <circle cx={cx} cy={cy} r={R + 30} fill="url(#globe-outer-halo)" />

        {/* Embedded Photorealistic 3D Shaded Canvas inside SVG coordinate space */}
        <foreignObject
          x={cx - R}
          y={cy - R}
          width={R * 2}
          height={R * 2}
          clipPath="url(#globe-sphere-clip)"
        >
          <canvas
            ref={canvasRef}
            width={GLOBE_PX}
            height={GLOBE_PX}
            className="w-full h-full block rounded-full pointer-events-none"
          />
        </foreignObject>

        {/* Crisp Atmospheric Rim Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke="rgba(125,211,252,0.5)"
          strokeWidth={1.6}
        />

        {/* Clickable Nation Markers + Auto Night City Lights */}
        <g>
          {visibleMarkers.map(({ nation, proj, isNightSide }) => {
            const isSel = nation.id === selectedNationId;
            const glowAmber = showNightLights && isNightSide;
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
                {glowAmber && (
                  <circle
                    r={nation.lodTier === 0 ? 7.5 : 4.5}
                    fill="rgba(251,191,36,0.34)"
                  />
                )}
                <circle
                  r={isSel ? 6.5 : nation.isTriBorder ? 4.8 : glowAmber ? 2.8 : 2.6}
                  fill={
                    isSel
                      ? "#fef08a"
                      : nation.isTriBorder
                      ? "#fbbf24"
                      : glowAmber
                      ? "#fde047"
                      : "#f8fafc"
                  }
                  stroke="#020617"
                  strokeWidth={isSel ? 1.8 : 0.9}
                />
                {(isSel || nation.isTriBorder || nation.lodTier === 0) && (
                  <text
                    y={-9}
                    textAnchor="middle"
                    fontSize={isSel ? 12 : 10}
                    fontWeight={700}
                    fill={isSel ? "#fef08a" : "#f8fafc"}
                    stroke="#020617"
                    strokeWidth={3}
                    paintOrder="stroke"
                  >
                    {nation.shortName}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Photorealistic 3D Globe Control Dock */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-amber-400/35 bg-slate-950/85 px-3 py-2 text-xs text-slate-200 backdrop-blur-md shadow-2xl max-w-[95%]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setAutoSpin((v) => !v)}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-800/90 px-2.5 py-1 hover:bg-slate-700 cursor-pointer"
        >
          {autoSpin ? <Pause className="h-3.5 w-3.5 text-amber-300" /> : <Play className="h-3.5 w-3.5 text-emerald-300" />}
          <span>{autoSpin ? "Dừng xoay" : "Tự xoay"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowClouds((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 border cursor-pointer ${
            showClouds
              ? "border-sky-400/50 bg-sky-500/20 text-sky-200"
              : "border-slate-700 bg-slate-900 text-slate-400"
          }`}
        >
          <Cloud className="h-3.5 w-3.5" />
          <span>Mây 3D</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNightLights((v) => !v)}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 border cursor-pointer ${
            showNightLights
              ? "border-amber-400/50 bg-amber-500/20 text-amber-200"
              : "border-slate-700 bg-slate-900 text-slate-400"
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
          <span>Đèn đêm</span>
        </button>

        <label className="inline-flex items-center gap-1.5 px-2 text-[11px] text-slate-300">
          <Sun className="h-3.5 w-3.5 text-amber-300" />
          <input
            type="range"
            min={-180}
            max={180}
            value={sunAngleDeg}
            onChange={(e) => setSunAngleDeg(Number(e.target.value))}
            className="w-20 accent-amber-400"
            title="Xoay hướng chiếu Mặt trời (Ngày / Hoàng hôn / Đêm)"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setRotLon(36);
            setRotLat(16);
            setSunAngleDeg(38);
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-800/90 px-2 py-1 hover:bg-slate-700 cursor-pointer"
          title="Đưa tâm quả cầu về Liên minh Tam Biên Aurelia"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tam Biên</span>
        </button>
      </div>
    </div>
  );
}
