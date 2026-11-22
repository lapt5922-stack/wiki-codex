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
 * Sample RGB terrain color with crisp 315-degree directional hillshading & seasonal snowline.
 */
export function samplePlanetaryTerrainPixel(
  x: number,
  y: number,
  style: TerrainBackdropStyle = "PHYSICAL_RELIEF",
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" = "SPRING",
): TerrainSample {
  const base = computeTerrainHeight(x, y);
  const eps = 0.0020;
  const hx = computeTerrainHeight(Math.min(0.999, x + eps), y).h;
  const hy = computeTerrainHeight(x, Math.min(0.999, y + eps)).h;

  // Sharper directional hillshade from NW (315 deg) for vivid sculpted mountain ridges
  const dx = (hx - base.h) * (base.isLand ? 18 : 4.5);
  const dy = (hy - base.h) * (base.isLand ? 18 : 4.5);
  const shadeRaw = (-dx * 0.68 - dy * 0.68 + 0.72) / Math.sqrt(dx * dx + dy * dy + 0.48);
  const shade = 0.68 + Math.max(0, Math.min(1.42, shadeRaw)) * 0.50;

  let r = 0;
  let g = 0;
  let b = 0;

  if (!base.isLand) {
    // Ocean depth gradient: abyss -> mid-ocean -> turquoise coral shelf
    const shallowT = Math.max(0, Math.min(1, (base.h + 0.85) / 0.83));
    const shelfGlow = Math.pow(shallowT, 3.2);
    if (style === "NIGHT_LIGHTS") {
      r = lerp(3, 12, shallowT) + shelfGlow * 6;
      g = lerp(7, 24, shallowT) + shelfGlow * 14;
      b = lerp(18, 46, shallowT) + shelfGlow * 22;
    } else if (style === "AZURE_ATLAS") {
      r = lerp(8, 22, shallowT) + shelfGlow * 18;
      g = lerp(32, 84, shallowT) + shelfGlow * 42;
      b = lerp(74, 148, shallowT) + shelfGlow * 36;
    } else if (style === "PARCHMENT") {
      r = lerp(28, 68, shallowT);
      g = lerp(46, 88, shallowT);
      b = lerp(64, 100, shallowT);
    } else if (style === "SATELLITE") {
      r = lerp(4, 18, shallowT) + shelfGlow * 14;
      g = lerp(16, 68, shallowT) + shelfGlow * 48;
      b = lerp(36, 108, shallowT) + shelfGlow * 42;
    } else {
      r = lerp(6, 26, shallowT) + shelfGlow * 18;
      g = lerp(22, 102, shallowT) + shelfGlow * 52;
      b = lerp(52, 142, shallowT) + shelfGlow * 40;
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

  // Land hypsometric + regional biome palette with dynamic seasonal snowline
  const absLat = Math.abs(y - 0.5) * 2;
  const elev = base.h;
  const snowLatThreshold = season === "WINTER" ? 0.66 : season === "SUMMER" ? 0.86 : 0.78;
  const snowElevThreshold = season === "WINTER" ? 0.66 : season === "SUMMER" ? 0.82 : 0.74;

  const isPolar =
    base.continent === "ARCTIC_ICE" ||
    base.continent === "ANTARCTIC_ICE" ||
    absLat > snowLatThreshold;
  const isDesert =
    (base.continent === "SOLARA" && y > 0.70) ||
    (base.continent === "AUSTRALIS" && x < 0.78) ||
    (base.continent === "AURELIA" && y > 0.46 && x < 0.68);
  const isVolcanic = base.continent === "AURELIA" && x > 0.64 && y > 0.24 && y < 0.45;
  const isJungle =
    (base.continent === "SOLARA" && y <= 0.70) ||
    (base.continent === "ORIENTIS" && y > 0.42);

  if (isPolar) {
    r = lerp(188, 244, elev);
    g = lerp(214, 250, elev);
    b = lerp(234, 255, elev);
  } else if (elev > snowElevThreshold) {
    // Crisp snow-capped alpine summits
    const t = (elev - snowElevThreshold) / Math.max(0.05, 1 - snowElevThreshold);
    r = lerp(168, 246, t);
    g = lerp(170, 250, t);
    b = lerp(176, 255, t);
  } else if (elev > 0.54) {
    // Sculpted rocky mountain slopes
    const t = (elev - 0.54) / Math.max(0.05, snowElevThreshold - 0.54);
    r = lerp(136, 166, t);
    g = lerp(112, 152, t);
    b = lerp(86, 144, t);
  } else if (isVolcanic) {
    const t = elev / 0.54;
    r = lerp(92, 134, t);
    g = lerp(62, 82, t);
    b = lerp(56, 74, t);
  } else if (isDesert) {
    const t = elev / 0.54;
    r = lerp(196, 166, t);
    g = lerp(162, 126, t);
    b = lerp(102, 82, t);
  } else if (isJungle) {
    const t = elev / 0.54;
    r = lerp(22, 62, t);
    g = lerp(94, 128, t);
    b = lerp(46, 64, t);
  } else {
    // Temperate plains -> autumn amber or lush spring green
    const t = elev / 0.54;
    if (season === "AUTUMN") {
      r = lerp(96, 164, t);
      g = lerp(118, 126, t);
      b = lerp(58, 72, t);
    } else {
      r = lerp(48, 142, t);
      g = lerp(120, 138, t);
      b = lerp(64, 82, t);
    }
  }

  if (style === "NIGHT_LIGHTS") {
    r = r * 0.16 + 8;
    g = g * 0.18 + 12;
    b = b * 0.24 + 22;
  } else if (style === "AZURE_ATLAS") {
    r = lerp(r, 178, 0.22);
    g = lerp(g, 162, 0.18);
    b = lerp(b, 122, 0.16);
  } else if (style === "PARCHMENT") {
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = lerp(lum * 1.12 + 34, r, 0.28);
    g = lerp(lum * 1.01 + 22, g, 0.28);
    b = lerp(lum * 0.78 + 4, b, 0.28);
  } else if (style === "SATELLITE") {
    r *= 0.88;
    g *= 0.94;
    b *= 0.90;
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

/**
 * Bakes high-detail realistic cartographic features onto the offscreen canvas:
 * - Sculpted 3D mountain peaks with sunlit/shadow faces & snow caps
 * - Procedural miniature forest tree canopies in jungle & temperate woodlands
 * - Wind-rippled desert sand dunes & oases
 * - Polar sea-ice floes
 * - Portolan rhumb lines (AZURE_ATLAS) & glowing golden city lights (NIGHT_LIGHTS)
 */
function paintBakedTerrainDetails(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: TerrainBackdropStyle,
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER",
) {
  const scale = width / 1280;
  const isNight = style === "NIGHT_LIGHTS";

  // 1. Azure Atlas Portolan Rhumb Lines (classic nautical gold rays)
  if (style === "AZURE_ATLAS") {
    ctx.save();
    ctx.strokeStyle = "rgba(212, 175, 55, 0.16)";
    ctx.lineWidth = Math.max(0.6, 0.8 * scale);
    const hubs = [
      { x: 0.24 * width, y: 0.48 * height },
      { x: 0.76 * width, y: 0.52 * height },
    ];
    for (const hub of hubs) {
      for (let i = 0; i < 16; i++) {
        const ang = (i * Math.PI) / 8;
        ctx.beginPath();
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(hub.x + Math.cos(ang) * width * 0.6, hub.y + Math.sin(ang) * width * 0.6);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 18 * scale, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Procedural Forest Canopies (miniature layered trees in jungles & temperate forests)
  if (!isNight && width >= 400) {
    ctx.save();
    const stepX = Math.max(8, Math.round(14 * scale));
    const stepY = Math.max(8, Math.round(14 * scale));
    for (let py = stepY; py < height - stepY; py += stepY) {
      for (let px = stepX; px < width - stepX; px += stepX) {
        const jx = (hash2D(px, py) - 0.5) * stepX * 0.75;
        const jy = (hash2D(px + 37, py + 91) - 0.5) * stepY * 0.75;
        const cx = px + jx;
        const cy = py + jy;
        const nx = cx / width;
        const ny = cy / height;
        const hInfo = computeTerrainHeight(nx, ny);
        if (!hInfo.isLand || hInfo.h > 0.52 || hInfo.h < 0.16) continue;
        if (hInfo.continent === "ARCTIC_ICE" || hInfo.continent === "ANTARCTIC_ICE") continue;
        const absLat = Math.abs(ny - 0.5) * 2;
        if (absLat > (season === "WINTER" ? 0.64 : 0.76)) continue;

        const isDesert =
          (hInfo.continent === "SOLARA" && ny > 0.70) ||
          (hInfo.continent === "AUSTRALIS" && nx < 0.78) ||
          (hInfo.continent === "AURELIA" && ny > 0.46 && nx < 0.68);
        const isVolcanic = hInfo.continent === "AURELIA" && nx > 0.64 && ny > 0.24 && ny < 0.45;
        if (isVolcanic) continue;

        if (isDesert) {
          // Wind-rippled desert sand dunes
          if (hash2D(px + 5, py + 11) > 0.68) {
            const dw = 6.5 * scale;
            const dh = 2.2 * scale;
            ctx.strokeStyle = style === "PARCHMENT" ? "rgba(120,88,48,0.28)" : "rgba(255,228,168,0.34)";
            ctx.lineWidth = Math.max(0.7, 1.1 * scale);
            ctx.beginPath();
            ctx.moveTo(cx - dw, cy);
            ctx.quadraticCurveTo(cx, cy - dh, cx + dw, cy + dh * 0.4);
            ctx.stroke();
          }
          continue;
        }

        const isJungle =
          (hInfo.continent === "SOLARA" && ny <= 0.70) ||
          (hInfo.continent === "ORIENTIS" && ny > 0.42);
        const densityThreshold = isJungle ? 0.22 : hInfo.continent === "HESPERIA" ? 0.34 : 0.52;
        if (fbm2D(nx * 24, ny * 18) < densityThreshold) continue;

        // Draw crisp miniature tree canopy (shadow + deep foliage + sunlit top dot)
        const r = (isJungle ? 3.2 : 2.5) * scale * (0.8 + hash2D(px + 3, py + 7) * 0.5);
        ctx.fillStyle = "rgba(8, 28, 16, 0.42)";
        ctx.beginPath();
        ctx.arc(cx + r * 0.35, cy + r * 0.35, r, 0, Math.PI * 2);
        ctx.fill();

        if (style === "PARCHMENT") {
          ctx.fillStyle = isJungle ? "rgba(62, 92, 54, 0.55)" : "rgba(82, 102, 62, 0.48)";
        } else if (season === "AUTUMN" && !isJungle) {
          ctx.fillStyle = hash2D(px, py + 13) > 0.5 ? "rgba(180, 108, 42, 0.72)" : "rgba(92, 128, 56, 0.72)";
        } else {
          ctx.fillStyle = isJungle ? "rgba(18, 110, 58, 0.78)" : "rgba(38, 124, 68, 0.70)";
        }
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isJungle ? "rgba(74, 184, 104, 0.55)" : "rgba(124, 198, 114, 0.45)";
        ctx.beginPath();
        ctx.arc(cx - r * 0.28, cy - r * 0.28, r * 0.52, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 3. Sculpted 3D Mountain Peaks with Sunlit NW Face, Shadow SE Face & Snow Caps
  if (!isNight && width >= 400) {
    ctx.save();
    for (const chain of TOPOGRAPHIC_CHAINS) {
      if (chain.kind !== "MOUNTAIN") continue;
      for (let i = 1; i < chain.points.length; i++) {
        const a = chain.points[i - 1];
        const b = chain.points[i];
        const segLen = Math.hypot((b.x - a.x) * width, (b.y - a.y) * height);
        const steps = Math.max(2, Math.floor(segLen / (13 * scale)));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const jitter = (hash2D(i * 19 + s, Math.round(a.x * 999)) - 0.5) * 6 * scale;
          const mx = (a.x + (b.x - a.x) * t) * width + jitter;
          const my = (a.y + (b.y - a.y) * t) * height + jitter * 0.6;
          const peakH = (7.5 + hash2D(s * 7, i * 31) * 7.5) * scale;
          const halfW = peakH * 0.88;

          // Cast shadow on SE side
          ctx.fillStyle = "rgba(15, 23, 42, 0.34)";
          ctx.beginPath();
          ctx.moveTo(mx, my - peakH);
          ctx.lineTo(mx + halfW * 1.15, my + peakH * 0.32);
          ctx.lineTo(mx, my + peakH * 0.28);
          ctx.closePath();
          ctx.fill();

          // Sunlit NW face
          ctx.fillStyle = style === "PARCHMENT" ? "rgba(182, 158, 124, 0.86)" : "rgba(168, 158, 146, 0.88)";
          ctx.beginPath();
          ctx.moveTo(mx, my - peakH);
          ctx.lineTo(mx - halfW, my + peakH * 0.28);
          ctx.lineTo(mx, my + peakH * 0.28);
          ctx.closePath();
          ctx.fill();

          // Shaded SE face
          ctx.fillStyle = style === "PARCHMENT" ? "rgba(112, 92, 68, 0.86)" : "rgba(86, 90, 102, 0.88)";
          ctx.beginPath();
          ctx.moveTo(mx, my - peakH);
          ctx.lineTo(mx + halfW, my + peakH * 0.28);
          ctx.lineTo(mx, my + peakH * 0.28);
          ctx.closePath();
          ctx.fill();

          // Bright white snow cap on summits
          if (peakH >= 9.2 * scale || season === "WINTER") {
            const snowH = peakH * 0.42;
            const snowW = halfW * 0.42;
            ctx.fillStyle = "rgba(248, 252, 255, 0.94)";
            ctx.beginPath();
            ctx.moveTo(mx, my - peakH);
            ctx.lineTo(mx - snowW, my - peakH + snowH);
            ctx.lineTo(mx, my - peakH + snowH * 0.82);
            ctx.lineTo(mx + snowW, my - peakH + snowH);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }

    // Volcanic cones with subtle ember glow
    for (const v of VOLCANO_FEATURES) {
      const vx = v.x * width;
      const vy = v.y * height;
      const vh = 12 * scale;
      const vw = 10 * scale;
      ctx.fillStyle = "rgba(52, 42, 46, 0.92)";
      ctx.beginPath();
      ctx.moveTo(vx, vy - vh);
      ctx.lineTo(vx - vw, vy + vh * 0.25);
      ctx.lineTo(vx + vw, vy + vh * 0.25);
      ctx.closePath();
      ctx.fill();

      const glow = ctx.createRadialGradient(vx, vy - vh * 0.92, 0, vx, vy - vh * 0.92, 6 * scale);
      glow.addColorStop(0, "rgba(251, 146, 60, 0.95)");
      glow.addColorStop(1, "rgba(239, 68, 68, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(vx, vy - vh * 0.92, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 4. Polar Sea-Ice Floes
  if (!isNight && width >= 400) {
    ctx.save();
    for (let i = 0; i < 65; i++) {
      const fx = hash2D(i * 17, 401) * width;
      const isNorth = i % 2 === 0;
      const fy = (isNorth ? 0.04 + hash2D(i, 12) * 0.10 : 0.87 + hash2D(i, 77) * 0.09) * height;
      const hInfo = computeTerrainHeight(fx / width, fy / height);
      if (hInfo.isLand) continue;
      const rw = (3 + hash2D(i, 99) * 5) * scale;
      const rh = rw * 0.55;
      ctx.fillStyle = "rgba(224, 242, 254, 0.55)";
      ctx.beginPath();
      ctx.ellipse(fx, fy, rw, rh, hash2D(i, 5) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Night Lights Style: Glowing Amber-Gold Urban Clusters & Coastal Beacons
  if (isNight) {
    ctx.save();
    for (let i = 0; i < 240; i++) {
      const nx = 0.04 + hash2D(i * 13, 881) * 0.92;
      const ny = 0.14 + hash2D(i * 29, 313) * 0.72;
      const hInfo = computeTerrainHeight(nx, ny);
      if (!hInfo.isLand || hInfo.continent === "ARCTIC_ICE" || hInfo.continent === "ANTARCTIC_ICE") continue;
      const cx = nx * width;
      const cy = ny * height;
      const rad = (2.5 + hash2D(i, 55) * 6.5) * scale;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      g.addColorStop(0, "rgba(254, 240, 138, 0.95)");
      g.addColorStop(0.35, "rgba(245, 158, 11, 0.55)");
      g.addColorStop(1, "rgba(245, 158, 11, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// Module-level cache of rendered data URLs per style, season & resolution
const terrainUrlCache = new Map<string, string>();

/**
 * Renders a synchronous fast preview (e.g. 420x236) in ~15-25ms.
 */
export function renderTerrainBackdropSync(
  style: TerrainBackdropStyle,
  width = 420,
  height = 236,
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" = "SPRING",
): string | null {
  if (typeof document === "undefined") return null;
  const cacheKey = `${style}:${season}:${width}x${height}`;
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
      const sample = samplePlanetaryTerrainPixel(nx, ny, style, season);
      data[ptr++] = sample.r;
      data[ptr++] = sample.g;
      data[ptr++] = sample.b;
      data[ptr++] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  paintBakedTerrainDetails(ctx, width, height, style, season);
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
  season: "SPRING" | "SUMMER" | "AUTUMN" | "WINTER" = "SPRING",
): () => void {
  if (typeof document === "undefined") return () => {};
  const cacheKey = `${style}:${season}:${width}x${height}`;
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
        const sample = samplePlanetaryTerrainPixel(nx, ny, style, season);
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
      paintBakedTerrainDetails(ctx, width, height, style, season);
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
