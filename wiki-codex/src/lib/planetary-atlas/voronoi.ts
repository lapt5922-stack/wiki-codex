import type { Point2D, PolityScaleTier } from "./types";

/**
 * Power-Weighted Clipped Voronoi Tessellation (Laguerre Diagram)
 * via Sutherland-Hodgman half-plane clipping inside continent masks.
 */

export const TIER_VORONOI_WEIGHT: Record<PolityScaleTier, number> = {
  IMPERIAL_REALM: 0.0022,
  MAJOR_STATE: 0.0012,
  REGIONAL_STATE: 0.00035,
  PRINCIPALITY: -0.00025,
  FREE_CITY: -0.00075,
  SPECIAL_ZONE: -0.0008
};

/**
 * Clip a convex or simple polygon against half-plane: a*x + b*y <= c
 */
export function clipPolygonByHalfPlane(
  polygon: Point2D[],
  a: number,
  b: number,
  c: number
): Point2D[] {
  if (polygon.length < 3) return [];
  const out: Point2D[] = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const curr = polygon[i];
    const next = polygon[(i + 1) % n];
    const currVal = a * curr.x + b * curr.y - c;
    const nextVal = a * next.x + b * next.y - c;
    const currIn = currVal <= 1e-9;
    const nextIn = nextVal <= 1e-9;

    if (currIn && nextIn) {
      out.push(next);
    } else if (currIn && !nextIn) {
      const denom = currVal - nextVal;
      if (Math.abs(denom) > 1e-12) {
        const t = currVal / denom;
        out.push({
          x: curr.x + t * (next.x - curr.x),
          y: curr.y + t * (next.y - curr.y)
        });
      }
    } else if (!currIn && nextIn) {
      const denom = currVal - nextVal;
      if (Math.abs(denom) > 1e-12) {
        const t = currVal / denom;
        out.push({
          x: curr.x + t * (next.x - curr.x),
          y: curr.y + t * (next.y - curr.y)
        });
      }
      out.push(next);
    }
  }

  return out;
}

export function pointInPolygon(pt: Point2D, poly: Point2D[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y &&
      pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function computePolygonArea(poly: Point2D[]): number {
  if (poly.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) * 0.5;
}

export function dedupeCloseVertices(poly: Point2D[], minDist = 0.0012): Point2D[] {
  if (poly.length < 3) return poly;
  const out: Point2D[] = [];
  for (const pt of poly) {
    const prev = out[out.length - 1];
    if (!prev || Math.hypot(pt.x - prev.x, pt.y - prev.y) >= minDist) {
      out.push({
        x: Number(pt.x.toFixed(4)),
        y: Number(pt.y.toFixed(4))
      });
    }
  }
  if (out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < minDist) {
      out.pop();
    }
  }
  return out;
}

function edgeHash(ax: number, ay: number, bx: number, by: number): number {
  const k1 = Math.round(ax * 10000) * 73856093 ^ Math.round(ay * 10000) * 19349663;
  const k2 = Math.round(bx * 10000) * 73856093 ^ Math.round(by * 10000) * 19349663;
  const lo = Math.min(k1, k2);
  const hi = Math.max(k1, k2);
  let h = (lo * 374761393 + hi * 668265263) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * Deterministically adds organic midpoint jitter on longer shared borders
 * using a symmetric edge hash so two adjacent Voronoi cells fit seamlessly.
 */
export function fractalizeSharedBorders(
  poly: Point2D[],
  amplitude = 0.0022
): Point2D[] {
  if (poly.length < 3) return poly;
  const out: Point2D[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    out.push(a);
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len > 0.022) {
      // Canonical direction so shared edge A->B and B->A perturb to the EXACT same point
      const forward = a.x < b.x || (a.x === b.x && a.y < b.y);
      const p1 = forward ? a : b;
      const p2 = forward ? b : a;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const nx = -dy / len;
      const ny = dx / len;
      const rand = edgeHash(p1.x, p1.y, p2.x, p2.y) * 2 - 1;
      const offset = rand * Math.min(amplitude, len * 0.14);
      out.push({
        x: Number(((a.x + b.x) * 0.5 + nx * offset).toFixed(4)),
        y: Number(((a.y + b.y) * 0.5 + ny * offset).toFixed(4))
      });
    }
  }
  return dedupeCloseVertices(out, 0.0008);
}

/**
 * Generate a compact organic island polygon for oceanic / archipelago polities.
 */
export function buildIslandPolygon(
  cx: number,
  cy: number,
  radius: number,
  seed: number
): Point2D[] {
  const sides = 8;
  const pts: Point2D[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2;
    const wobble =
      0.78 +
      0.34 * Math.abs(Math.sin(seed * 12.9898 + i * 78.233));
    const rx = radius * wobble * 1.15;
    const ry = radius * wobble * 0.92;
    pts.push({
      x: Number((cx + Math.cos(angle) * rx).toFixed(4)),
      y: Number((cy + Math.sin(angle) * ry).toFixed(4))
    });
  }
  return pts;
}

export interface VoronoiSeedSite {
  id: string;
  x: number;
  y: number;
  tier: PolityScaleTier;
}

/**
 * Compute Power-Weighted Clipped Voronoi polygons for a set of sites within a continent polygon.
 * Also limits each cell to a reasonable local radius so coastal/small nations don't stretch across empty seas.
 */
export function computeContinentVoronoi(
  sites: VoronoiSeedSite[],
  continentMask: Point2D[]
): Map<string, Point2D[]> {
  const result = new Map<string, Point2D[]>();
  if (sites.length === 0) return result;

  for (const site of sites) {
    let cell = continentMask.map((p) => ({ ...p }));
    const wi = TIER_VORONOI_WEIGHT[site.tier] ?? 0;

    // Sort candidate clipping sites by ascending distance so cell shrinks fast
    const others: Array<{ other: VoronoiSeedSite; distSq: number }> = [];
    for (const other of sites) {
      if (other.id === site.id) continue;
      const dx = other.x - site.x;
      const dy = other.y - site.y;
      others.push({ other, distSq: dx * dx + dy * dy });
    }
    others.sort((u, v) => u.distSq - v.distSq);

    // Track current cell max radius from site for exact early-reject
    let maxVertDist = 2;
    const recomputeMaxRadius = () => {
      let maxSq = 0;
      for (const v of cell) {
        const dx = v.x - site.x;
        const dy = v.y - site.y;
        const sq = dx * dx + dy * dy;
        if (sq > maxSq) maxSq = sq;
      }
      maxVertDist = Math.sqrt(maxSq);
    };

    for (let idx = 0; idx < others.length; idx++) {
      const { other, distSq } = others[idx];
      const wj = TIER_VORONOI_WEIGHT[other.tier] ?? 0;

      // Early reject when bisecting half-plane is guaranteed outside current cell
      if (idx >= 6) {
        const dist = Math.sqrt(distSq);
        const weightDiff = Math.abs(wi - wj);
        const halfPlaneMinDist = (distSq - weightDiff) / (2 * Math.max(1e-6, dist));
        if (halfPlaneMinDist > maxVertDist + 0.002) {
          continue;
        }
      }

      const a = 2 * (other.x - site.x);
      const b = 2 * (other.y - site.y);
      const c =
        other.x * other.x +
        other.y * other.y -
        wj -
        (site.x * site.x + site.y * site.y - wi);
      const prevLen = cell.length;
      cell = clipPolygonByHalfPlane(cell, a, b, c);
      if (cell.length < 3) break;
      if (idx === 5 || cell.length !== prevLen) {
        recomputeMaxRadius();
      }
    }

    if (cell.length < 3) {
      // Fallback small organic polygon around seed if heavily clipped
      cell = buildIslandPolygon(site.x, site.y, 0.011, site.x * 997 + site.y * 571);
    } else {
      cell = fractalizeSharedBorders(dedupeCloseVertices(cell, 0.001));
    }

    result.set(site.id, cell);
  }

  return result;
}
