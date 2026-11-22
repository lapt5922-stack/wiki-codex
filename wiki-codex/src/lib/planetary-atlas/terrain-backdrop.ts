import {
  CONTINENT_MASKS,
  TOPOGRAPHIC_CHAINS,
  VOLCANO_FEATURES,
} from "./climate-geology";
import type { ContinentId, Point2D, TerrainBackdropStyle } from "./types";
import { pointInPolygon } from "./voronoi";

interface ContinentEntry {
  id: Exclude<ContinentId, "OCEANIC">;
  mask: Point2D[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

const CONTINENT_ENTRIES: ContinentEntry[] = (
  Object.entries(CONTINENT_MASKS) as Array<[Exclude<ContinentId, "OCEANIC">, Point2D[]]>
).map(([id, mask]) => {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of mask) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { id, mask, minX, maxX, minY, maxY };
});

interface Segment {
  ax: number;
  ay: number;
  bx: number;
  by: number;
}

const MOUNTAIN_SEGMENTS: Segment[] = [];
for (const chain of TOPOGRAPHIC_CHAINS) {
  if (chain.kind !== "MOUNTAIN") continue;
  for (let i = 1; i < chain.points.length; i++) {
    MOUNTAIN_SEGMENTS.push({
      ax: chain.points[i - 1].x,
      ay: chain.points[i - 1].y,
      bx: chain.points[i].x,
      by: chain.points[i].y,
    });
  }
}

function hash2D(ix: number, iy: number): number {
  let n = (ix * 374761393 + iy * 668265263) | 0;
  n = ((n ^ (n >>> 13)) * 1274126177) | 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function valueNoise2D(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2D(ix, iy);
  const b = hash2D(ix + 1, iy);
  const c = hash2D(ix, iy + 1);
  const d = hash2D(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

export function fbm2D(x: number, y: number): number {
  let val = 0;
  let amp = 0.55;
  let freq = 1;
  for (let o = 0; o < 3; o++) {
    val += amp * valueNoise2D(x * freq, y * freq);
    freq *= 2.05;
    amp *= 0.48;
  }
  return val; // ~ [0, 1]
}

function distToSegmentSq(px: number, py: number, s: Segment): number {
  const dx = s.bx - s.ax;
  const dy = s.by - s.ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-9) return (px - s.ax) ** 2 + (py - s.ay) ** 2;
  let t = ((px - s.ax) * dx + (py - s.ay) * dy) / lenSq;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const cx = s.ax + t * dx;
  const cy = s.ay + t * dy;
  return (px - cx) ** 2 + (py - cy) ** 2;
}

function findContainingContinent(x: number, y: number): Exclude<ContinentId, "OCEANIC"> | null {
  for (const c of CONTINENT_ENTRIES) {
    if (x < c.minX || x > c.maxX || y < c.minY || y > c.maxY) continue;
    if (pointInPolygon({ x, y }, c.mask)) return c.id;
  }
  return null;
}

function nearestContinentEdgeDist(x: number, y: number): number {
  let minSq = 0.04;
  for (const c of CONTINENT_ENTRIES) {
    // Quick bbox margin check
    if (
      x < c.minX - 0.06 ||
      x > c.maxX + 0.06 ||
      y < c.minY - 0.06 ||
      y > c.maxY + 0.06
    ) {
      continue;
    }
    const poly = c.mask;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const dSq = distToSegmentSq(x, y, { ax: a.x, ay: a.y, bx: b.x, by: b.y });
      if (dSq < minSq) minSq = dSq;
    }
  }
  return Math.sqrt(minSq);
}

export interface TerrainSample {
  isLand: boolean;
  continent: Exclude<ContinentId, "OCEANIC"> | null;
  elevation: number; // [-1..1] ocean negative, land positive
  r: number;
  g: number;
  b: number;
}

function computeTerrainHeight(
  x: number,
  y: number,
): { isLand: boolean; continent: Exclude<ContinentId, "OCEANIC"> | null; h: number } {
  // Subtle organic coastal warp so continent shores look geological
  const warpX = (valueNoise2D(x * 26 + 3.1, y * 26 + 7.4) - 0.5) * 0.008;
  const warpY = (valueNoise2D(x * 26 + 11.7, y * 26 + 2.3) - 0.5) * 0.008;
  const wx = x + warpX;
  const wy = y + warpY;

  const continent = findContainingContinent(wx, wy);
  const n = fbm2D(x * 16, y * 10);

  if (!continent) {
    // Ocean bathymetry: shallow coastal shelf fading to abyssal ocean floor
    const edgeDist = nearestContinentEdgeDist(wx, wy);
    const shelf = Math.max(0, 1 - edgeDist / 0.045);
    const ridge = (n - 0.5) * 0.25;
    const h = -0.85 + shelf * 0.72 + ridge;
    return { isLand: false, continent: null, h: Math.min(-0.02, h) };
  }

  // Land elevation: base relief + mountain chains + volcanic cones
  let mtn = 0;
  for (const seg of MOUNTAIN_SEGMENTS) {
    const dSq = distToSegmentSq(x, y, seg);
    if (dSq < 0.0036) {
      const d = Math.sqrt(dSq);
      const val = (1 - d / 0.06) ** 1.65;
      if (val > mtn) mtn = val;
    }
  }

  let vol = 0;
  for (const v of VOLCANO_FEATURES) {
    const dSq = (x - v.x) ** 2 + (y - v.y) ** 2;
    if (dSq < 0.0009) {
      const val = (1 - Math.sqrt(dSq) / 0.03) ** 1.8 * 0.9;
      if (val > vol) vol = val;
    }
  }

  const h = Math.min(1, 0.14 + n * 0.34 + mtn * 0.58 + vol * 0.45);
  return { isLand: true, continent, h };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

/**
 * Sample RGB terrain color with 315-degree directional hillshading.
 */
export function samplePlanetaryTerrainPixel(
  x: number,
  y: number,
  style: TerrainBackdropStyle = "PHYSICAL_RELIEF",
): TerrainSample {
  const base = computeTerrainHeight(x, y);
  const eps = 0.0022;
  const hx = computeTerrainHeight(Math.min(0.999, x + eps), y).h;
  const hy = computeTerrainHeight(x, Math.min(0.999, y + eps)).h;

  // Directional hillshade from NW (315 deg)
  const dx = (hx - base.h) * (base.isLand ? 14 : 4);
  const dy = (hy - base.h) * (base.isLand ? 14 : 4);
  const shadeRaw = (-dx * 0.65 - dy * 0.65 + 0.72) / Math.sqrt(dx * dx + dy * dy + 0.52);
  const shade = 0.72 + Math.max(0, Math.min(1.35, shadeRaw)) * 0.46;

  let r = 0;
  let g = 0;
  let b = 0;

  if (!base.isLand) {
    // Ocean depth gradient: abyss -> mid-ocean -> turquoise shelf
    const shallowT = Math.max(0, Math.min(1, (base.h + 0.85) / 0.83));
    if (style === "PARCHMENT") {
      r = lerp(28, 66, shallowT);
      g = lerp(46, 86, shallowT);
      b = lerp(64, 98, shallowT);
    } else if (style === "SATELLITE") {
      r = lerp(5, 18, shallowT);
      g = lerp(18, 64, shallowT);
      b = lerp(38, 98, shallowT);
    } else {
      r = lerp(7, 26, shallowT);
      g = lerp(24, 96, shallowT);
      b = lerp(52, 134, shallowT);
    }
    return {
      isLand: false,
      continent: null,
      elevation: base.h,
      r: clampByte(r * (0.9 + shade * 0.12)),
      g: clampByte(g * (0.9 + shade * 0.12)),
      b: clampByte(b * (0.9 + shade * 0.12)),
    };
  }

  // Land hypsometric + regional biome palette
  const absLat = Math.abs(y - 0.5) * 2;
  const elev = base.h;

  const isPolar =
    base.continent === "ARCTIC_ICE" ||
    base.continent === "ANTARCTIC_ICE" ||
    absLat > 0.82;
  const isDesert =
    (base.continent === "SOLARA" && y > 0.70) ||
    (base.continent === "AUSTRALIS" && x < 0.78) ||
    (base.continent === "AURELIA" && y > 0.46 && x < 0.68);
  const isVolcanic = base.continent === "AURELIA" && x > 0.64 && y > 0.24 && y < 0.45;
  const isJungle =
    (base.continent === "SOLARA" && y <= 0.70) ||
    (base.continent === "ORIENTIS" && y > 0.42);

  if (isPolar) {
    r = lerp(175, 236, elev);
    g = lerp(206, 246, elev);
    b = lerp(228, 255, elev);
  } else if (elev > 0.78) {
    // Snow-capped alpine summits
    const t = (elev - 0.78) / 0.22;
    r = lerp(158, 238, t);
    g = lerp(156, 242, t);
    b = lerp(154, 248, t);
  } else if (elev > 0.56) {
    // High rocky mountains
    const t = (elev - 0.56) / 0.22;
    r = lerp(142, 162, t);
    g = lerp(116, 152, t);
    b = lerp(88, 146, t);
  } else if (isVolcanic) {
    const t = elev / 0.56;
    r = lerp(96, 134, t);
    g = lerp(64, 84, t);
    b = lerp(58, 76, t);
  } else if (isDesert) {
    const t = elev / 0.56;
    r = lerp(186, 156, t);
    g = lerp(154, 118, t);
    b = lerp(96, 78, t);
  } else if (isJungle) {
    const t = elev / 0.56;
    r = lerp(28, 74, t);
    g = lerp(98, 128, t);
    b = lerp(54, 68, t);
  } else {
    // Temperate plains -> golden uplands
    const t = elev / 0.56;
    r = lerp(54, 148, t);
    g = lerp(118, 136, t);
    b = lerp(68, 84, t);
  }

  if (style === "PARCHMENT") {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = lerp(lum * 1.12 + 34, r, 0.28);
    g = lerp(lum * 1.01 + 22, g, 0.28);
    b = lerp(lum * 0.78 + 4, b, 0.28);
  } else if (style === "SATELLITE") {
    r *= 0.86;
    g *= 0.92;
    b *= 0.88;
  }

  return {
    isLand: true,
    continent: base.continent,
    elevation: elev,
    r: clampByte(r * shade),
    g: clampByte(g * shade),
    b: clampByte(b * shade),
  };
}

// Module-level cache of rendered data URLs per style & resolution
const terrainUrlCache = new Map<string, string>();

/**
 * Renders a synchronous fast preview (e.g. 420x236) in ~15-25ms.
 */
export function renderTerrainBackdropSync(
  style: TerrainBackdropStyle,
  width = 420,
  height = 236,
): string | null {
  if (typeof document === "undefined") return null;
  const cacheKey = `${style}:${width}x${height}`;
  const cached = terrainUrlCache.get(cacheKey);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const img = ctx.createImageData(width, height);
  const data = img.data;
  let ptr = 0;

  for (let py = 0; py < height; py++) {
    const ny = (py + 0.5) / height;
    for (let px = 0; px < width; px++) {
      const nx = (px + 0.5) / width;
      const sample = samplePlanetaryTerrainPixel(nx, ny, style);
      data[ptr++] = sample.r;
      data[ptr++] = sample.g;
      data[ptr++] = sample.b;
      data[ptr++] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  const url = canvas.toDataURL("image/webp", 0.9);
  terrainUrlCache.set(cacheKey, url);
  return url;
}

/**
 * Progressive non-blocking high-res renderer (e.g. 1280x720) in row slices
 * so the main thread stays at 60 FPS while upgrading the terrain background.
 */
export function renderTerrainBackdropProgressive(
  style: TerrainBackdropStyle,
  onReady: (url: string) => void,
  width = 1280,
  height = 720,
): () => void {
  if (typeof document === "undefined") return () => {};
  const cacheKey = `${style}:${width}x${height}`;
  const cached = terrainUrlCache.get(cacheKey);
  if (cached) {
    onReady(cached);
    return () => {};
  }

  let cancelled = false;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  const img = ctx.createImageData(width, height);
  const data = img.data;
  const rowsPerChunk = 24;
  let currentRow = 0;

  const processChunk = () => {
    if (cancelled) return;
    const endRow = Math.min(height, currentRow + rowsPerChunk);
    let ptr = currentRow * width * 4;

    for (let py = currentRow; py < endRow; py++) {
      const ny = (py + 0.5) / height;
      for (let px = 0; px < width; px++) {
        const nx = (px + 0.5) / width;
        const sample = samplePlanetaryTerrainPixel(nx, ny, style);
        data[ptr++] = sample.r;
        data[ptr++] = sample.g;
        data[ptr++] = sample.b;
        data[ptr++] = 255;
      }
    }

    currentRow = endRow;
    if (currentRow < height) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(
          processChunk,
        );
      } else {
        setTimeout(processChunk, 8);
      }
    } else if (!cancelled) {
      ctx.putImageData(img, 0, 0);
      const url = canvas.toDataURL("image/webp", 0.92);
      terrainUrlCache.set(cacheKey, url);
      onReady(url);
    }
  };

  setTimeout(processChunk, 16);
  return () => {
    cancelled = true;
  };
}
