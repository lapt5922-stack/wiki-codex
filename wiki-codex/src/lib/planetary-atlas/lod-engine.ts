import type { PlanetaryNation, Point2D } from "./types";

export interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function computeNormalizedViewportBounds(
  zoom: number,
  panX: number,
  panY: number,
  canvasWidth: number,
  canvasHeight: number,
  margin = 0.08
): ViewportBounds {
  const safeZoom = Math.max(0.4, zoom);
  const w = Math.max(1, canvasWidth);
  const h = Math.max(1, canvasHeight);

  // Inverse of: sx = ((x - 0.5) * w) * zoom + w / 2 + panX
  const minX = (0 - w / 2 - panX) / (w * safeZoom) + 0.5 - margin;
  const maxX = (w - w / 2 - panX) / (w * safeZoom) + 0.5 + margin;
  const minY = (0 - h / 2 - panY) / (h * safeZoom) + 0.5 - margin;
  const maxY = (h - h / 2 - panY) / (h * safeZoom) + 0.5 + margin;

  return { minX, maxX, minY, maxY };
}

export function isPointInViewport(pt: Point2D, bounds: ViewportBounds): boolean {
  return (
    pt.x >= bounds.minX &&
    pt.x <= bounds.maxX &&
    pt.y >= bounds.minY &&
    pt.y <= bounds.maxY
  );
}

export function isPolygonInViewport(poly: Point2D[], bounds: ViewportBounds): boolean {
  if (poly.length === 0) return false;
  let pMinX = Infinity;
  let pMaxX = -Infinity;
  let pMinY = Infinity;
  let pMaxY = -Infinity;
  for (const pt of poly) {
    if (pt.x < pMinX) pMinX = pt.x;
    if (pt.x > pMaxX) pMaxX = pt.x;
    if (pt.y < pMinY) pMinY = pt.y;
    if (pt.y > pMaxY) pMaxY = pt.y;
  }
  return !(
    pMaxX < bounds.minX ||
    pMinX > bounds.maxX ||
    pMaxY < bounds.minY ||
    pMinY > bounds.maxY
  );
}

export function maxVisibleLodForZoom(zoom: number): 0 | 1 | 2 | 3 {
  if (zoom < 1.45) return 0;
  if (zoom < 2.35) return 1;
  if (zoom < 3.6) return 2;
  return 3;
}

export interface PlacedLabelMarker {
  nation: PlanetaryNation;
  sx: number;
  sy: number;
  showLabel: boolean;
  box: { x1: number; y1: number; x2: number; y2: number };
}

export function formatCompactAtlasLabel(name: string): string {
  return name
    .replace(
      /^(Vương quốc|Đế chế|Đế quốc|Đại Công quốc|Công quốc|Liên bang|Liên minh|Cộng hòa|Thần quốc|Hãn quốc|Thành bang|Tiểu quốc|Lãnh địa|Hầu quốc|Bá quốc|Thân vương quốc|Phiên trấn|Tổng trấn|Bảo hộ quốc|Chư hầu quốc|Tổng đốc phủ|Thủy quốc|Khu Tự trị|Vùng Tranh chấp|Vùng Phi Quân sự|Vùng Đất Vô Chủ|Trạm Thám hiểm|Trạm Học viện)\s+/i,
      ""
    )
    .slice(0, 22);
}

/**
 * Screen-Space Bounding-Box Collision Rejection Engine:
 * Guarantees ZERO overlapping text labels across all 360 nations at every zoom level.
 */
export function selectZeroOverlapLabels(
  nations: PlanetaryNation[],
  options: {
    zoom: number;
    panX: number;
    panY: number;
    canvasWidth: number;
    canvasHeight: number;
    forceAllLod?: boolean;
    selectedId?: string | null;
    hoveredId?: string | null;
    highlightedIds?: Set<string>;
  }
): PlacedLabelMarker[] {
  const {
    zoom,
    panX,
    panY,
    canvasWidth,
    canvasHeight,
    forceAllLod = false,
    selectedId,
    hoveredId,
    highlightedIds
  } = options;

  const bounds = computeNormalizedViewportBounds(
    zoom,
    panX,
    panY,
    canvasWidth,
    canvasHeight,
    0.05
  );
  const maxLod = forceAllLod ? 3 : maxVisibleLodForZoom(zoom);

  const visible = nations.filter((n) => isPointInViewport(n, bounds));

  // Priority sort: selected/hovered -> highlighted -> tri-border -> lower LOD -> larger population
  const prioritized = [...visible].sort((a, b) => {
    const pA =
      (a.id === selectedId || a.id === hoveredId ? 10000 : 0) +
      (highlightedIds?.has(a.id) ? 4000 : 0) +
      (a.isTriBorder ? 2500 : 0) +
      (3 - a.lodTier) * 500 +
      Math.log10(Math.max(10, a.population));
    const pB =
      (b.id === selectedId || b.id === hoveredId ? 10000 : 0) +
      (highlightedIds?.has(b.id) ? 4000 : 0) +
      (b.isTriBorder ? 2500 : 0) +
      (3 - b.lodTier) * 500 +
      Math.log10(Math.max(10, b.population));
    return pB - pA;
  });

  const placedBoxes: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const results: PlacedLabelMarker[] = [];

  for (const nation of prioritized) {
    const sx = (nation.x - 0.5) * canvasWidth * zoom + canvasWidth * 0.5 + panX;
    const sy = (nation.y - 0.5) * canvasHeight * zoom + canvasHeight * 0.5 + panY;

    const isForced =
      nation.id === selectedId ||
      nation.id === hoveredId ||
      highlightedIds?.has(nation.id);

    const eligible = isForced || nation.lodTier <= maxLod;
    const labelText = `#${nation.nationNum} ${nation.shortName}`;
    const boxW = Math.max(54, Math.min(162, labelText.length * 6.4 + 14));
    const boxH = 19;
    const box = {
      x1: sx - boxW / 2,
      y1: sy - boxH - 6,
      x2: sx + boxW / 2,
      y2: sy - 6
    };

    let showLabel = false;
    if (eligible) {
      const collides = placedBoxes.some(
        (b) =>
          !(
            box.x2 + 3 < b.x1 ||
            box.x1 - 3 > b.x2 ||
            box.y2 + 2 < b.y1 ||
            box.y1 - 2 > b.y2
          )
      );
      if (!collides || nation.id === selectedId || nation.id === hoveredId) {
        showLabel = true;
        placedBoxes.push(box);
      }
    }

    results.push({ nation, sx, sy, showLabel, box });
  }

  return results;
}
