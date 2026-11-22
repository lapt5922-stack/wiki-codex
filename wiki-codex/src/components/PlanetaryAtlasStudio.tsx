"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  CheckSquare,
  Compass,
  Download,
  Filter,
  Globe2,
  History,
  Layers,
  Maximize2,
  Minimize2,
  Mountain,
  Navigation,
  Pause,
  Play,
  Plus,
  Route as RouteIcon,
  Ruler,
  Scale,
  Search,
  Sun,
  Table2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { buildPlanetaryAtlasBundle } from "@/lib/planetary-atlas/generator";
import {
  BIOME_META,
  DIPLOMACY_META,
  SEASON_META,
  TIER_META,
  computeExpeditionTravel,
  computePolygonAreaKm2,
  findShortestNationPath,
  getTwoHopNeighbors,
  resolveNationLensColor,
  sampleRouteElevationProfile,
  type SeasonId,
} from "@/lib/planetary-atlas/climate-geology";
import { CapitalCityBlueprintModal } from "./CapitalCityBlueprintModal";
import { NationsSpreadsheetModal } from "./NationsSpreadsheetModal";
import { PlanetaryGlobeView } from "./PlanetaryGlobeView";
import { WorldAnalyticsHubModal } from "./WorldAnalyticsHubModal";
import { CONTINENT_NAME_VI } from "@/lib/planetary-atlas/nations-data";
import {
  computeNormalizedViewportBounds,
  selectZeroOverlapLabels,
} from "@/lib/planetary-atlas/lod-engine";
import {
  renderTerrainBackdropProgressive,
  renderTerrainBackdropSync,
} from "@/lib/planetary-atlas/terrain-backdrop";
import type {
  AtlasBiomeId,
  AtlasDisplayMode,
  AtlasWikiLens,
  ContinentId,
  PlanetaryDiplomacy,
  PlanetaryNation,
  Point2D,
  PolityScaleTier,
  TerrainBackdropStyle,
} from "@/lib/planetary-atlas/types";
import type { EntryCardProjection } from "@/types/codex";

interface PlanetaryAtlasStudioProps {
  entries: EntryCardProjection[];
  canEdit: boolean;
  initialFocusNationId?: string | null;
  onOpenEntry: (entryId: string) => void;
  onCreateEntryFromAtlas?: (title: string, summary: string, markdown: string) => void;
  onCreateTaskForNation?: (title: string, description: string) => void;
}

const LENS_OPTIONS: Array<{ id: AtlasWikiLens; label: string }> = [
  { id: "POLITICAL", label: "Chính trị" },
  { id: "TERRAIN", label: "Địa hình" },
  { id: "CLIMATE", label: "Khí hậu" },
  { id: "BIOME", label: "Hệ sinh thái" },
  { id: "DEMOGRAPHICS", label: "Dân số" },
  { id: "DIPLOMACY", label: "Ngoại giao" },
  { id: "RESOURCES", label: "Tài nguyên" },
];

const MODE_OPTIONS: Array<{ id: AtlasDisplayMode; label: string; desc: string }> = [
  { id: "CLEAN_LOD", label: "Gọn theo Zoom", desc: "Tự động lọc nhãn 4 tầng không đè chữ" },
  { id: "COLOR_MOSAIC", label: "Khảm Màu", desc: "Nổi bật ranh giới & sắc thái 360 quốc gia" },
  { id: "ISOLATED_FOCUS", label: "Tập trung Đơn lẻ", desc: "Chỉ làm nổi quốc gia đang chọn & láng giềng" },
];

function normalizeSearchText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

function buildNationWikiMarkdown(
  nation: PlanetaryNation,
  neighborNames: string[],
  treatyLines: string[],
  resourceLines: string[],
): string {
  return [
    `# ${nation.name} (#${nation.nationNum})`,
    "",
    `> ${nation.summary}`,
    "",
    "## Hồ sơ Địa lý & Hành chính",
    "",
    "| Thuộc tính | Thông tin |",
    "| --- | --- |",
    `| Mã Quốc gia | #${nation.nationNum} (${nation.shortName}) |`,
    `| Thủ đô | ${nation.capital} |`,
    `| Lục địa / Khu vực | ${CONTINENT_NAME_VI[nation.continent]} — ${nation.regionName} (${nation.regionCode}) |`,
    `| Khối Địa chính trị | ${nation.bloc} |`,
    `| Quy mô Thể chế | ${TIER_META[nation.tier].label} |`,
    `| Hình thức Chính quyền | ${nation.governmentType} |`,
    `| Ngôn ngữ Chính | ${nation.primaryLanguage} |`,
    `| Niên đại Thành lập | ${nation.foundingEra} |`,
    `| Tọa độ Trắc địa | ${nation.latLabel}, ${nation.lonLabel} |`,
    `| Hệ sinh thái | ${BIOME_META[nation.biome].label} |`,
    `| Độ cao Trung bình | ${nation.elevationM.toLocaleString("vi-VN")} m |`,
    `| Nhiệt độ Trung bình | ${nation.avgTempC} °C |`,
    `| Diện tích | ${nation.areaKm2.toLocaleString("vi-VN")} km² |`,
    `| Dân số Ước tính | ${nation.population.toLocaleString("vi-VN")} người |`,
    "",
    "## Quan hệ Ngoại giao & Láng giềng",
    "",
    neighborNames.length > 0
      ? `- **Các quốc gia láng giềng / kết nối trực tiếp**: ${neighborNames.join(", ")}`
      : "- **Láng giềng**: Đang cập nhật.",
    ...(treatyLines.length > 0 ? ["", "### Các Hiệp ước Ghi nhận", ...treatyLines] : []),
    "",
    "## Tài nguyên & Trao đổi Văn hóa – Kinh tế",
    "",
    ...(resourceLines.length > 0
      ? resourceLines
      : ["- Đang bổ sung dữ liệu lưu thông tài nguyên từ Viện Lưu trữ Hành tinh."]),
    "",
    "## Ghi chú Sử học",
    "",
    `Hồ sơ này được khởi tạo từ **Bản đồ Hành tinh Aethelgard Prime** (${nation.regionName}). Biên tập viên có thể bổ sung biên niên sử, nhân vật lịch sử và trích dẫn nguồn bên dưới.`,
  ].join("\n");
}

const TERRAIN_STYLE_OPTIONS: Array<{ id: TerrainBackdropStyle; label: string }> = [
  { id: "PHYSICAL_RELIEF", label: "Địa hình 3D" },
  { id: "SATELLITE", label: "Vệ tinh" },
  { id: "PARCHMENT", label: "Giấy da Cổ" },
];

interface NationPolygonsLayerProps {
  nations: PlanetaryNation[];
  lens: AtlasWikiLens;
  displayMode: AtlasDisplayMode;
  selectedNationId: string | null;
  hoveredNationId: string | null;
  highlightedPathSet: Set<string>;
  isolatedNeighborSet: Set<string>;
  twoHopRings: { hop1: Set<string>; hop2: Set<string> } | null;
  diplomacy: PlanetaryDiplomacy[];
  season: SeasonId;
  densityHeatmap: boolean;
  overlayOpacity: number;
  showTerrainBackdrop: boolean;
  strokeScale: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string, e: React.MouseEvent<SVGPathElement>) => void;
}

const NationPolygonsLayer = React.memo(function NationPolygonsLayer({
  nations,
  lens,
  displayMode,
  selectedNationId,
  hoveredNationId,
  highlightedPathSet,
  isolatedNeighborSet,
  twoHopRings,
  diplomacy,
  season,
  densityHeatmap,
  overlayOpacity,
  showTerrainBackdrop,
  strokeScale,
  onHover,
  onSelect,
}: NationPolygonsLayerProps) {
  const hasSelected = Boolean(selectedNationId);
  const baseFillOpacity = showTerrainBackdrop ? overlayOpacity : 0.76;

  return (
    <g>
      {nations.map((nation) => {
        const isSelected = nation.id === selectedNationId;
        const isHovered = nation.id === hoveredNationId;
        const inPath = highlightedPathSet.has(nation.id);
        const isHop1 = Boolean(twoHopRings?.hop1.has(nation.id));
        const isHop2 = Boolean(twoHopRings?.hop2.has(nation.id));
        const isDimmed =
          displayMode === "ISOLATED_FOCUS" &&
          hasSelected &&
          !isolatedNeighborSet.has(nation.id);

        const fillColor = resolveNationLensColor(nation, lens, {
          selectedNationId,
          diplomacy,
          season,
          densityHeatmap,
        });

        const fillOpacity = isDimmed
          ? 0.08
          : displayMode === "COLOR_MOSAIC"
            ? Math.min(0.9, baseFillOpacity + 0.28)
            : isSelected || isHovered || inPath || isHop1
              ? Math.min(0.88, baseFillOpacity + 0.32)
              : isHop2
                ? Math.min(0.78, baseFillOpacity + 0.16)
                : baseFillOpacity;

        const strokeColor = isSelected
          ? "#ffffff"
          : inPath
            ? "#a855f7"
            : isHop1
              ? "#22d3ee"
              : isHop2
                ? "#c084fc"
                : isHovered
                  ? "#fde047"
                  : nation.isTriBorder
                    ? "#fbbf24"
                    : showTerrainBackdrop
                      ? "rgba(15, 23, 42, 0.72)"
                      : "#0f172a";

        const strokeWidth =
          (isSelected ? 2.8 : inPath || isHop1 ? 2.3 : isHop2 || isHovered ? 1.8 : 0.85) * strokeScale;

        return (
          <path
            key={nation.id}
            d={nation.svgPath}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            onMouseEnter={() => onHover(nation.id)}
            onMouseLeave={() => onHover(null)}
            onClick={(e) => onSelect(nation.id, e)}
          />
        );
      })}
    </g>
  );
});

function polygonToSvgPath(poly: Point2D[], width: number, height: number): string {
  if (poly.length === 0) return "";
  return (
    poly
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${(p.x * width).toFixed(1)},${(p.y * height).toFixed(1)}`)
      .join(" ") + " Z"
  );
}

function polylineToSvgPoints(pts: Point2D[], width: number, height: number): string {
  return pts.map((p) => `${(p.x * width).toFixed(1)},${(p.y * height).toFixed(1)}`).join(" ");
}

export function PlanetaryAtlasStudio({
  entries,
  canEdit,
  initialFocusNationId,
  onOpenEntry,
  onCreateEntryFromAtlas,
  onCreateTaskForNation,
}: PlanetaryAtlasStudioProps) {
  const bundle = useMemo(() => buildPlanetaryAtlasBundle(), []);
  const W = bundle.canvasWidth;
  const H = bundle.canvasHeight;

  // Viewport transform state (deep zoom 0.8x -> 8.0x to stay well within GPU 16k texture limit)
  const MAX_ZOOM = 8.0;
  const MIN_ZOOM = 0.85;
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const clampPan = useCallback(
    (px: number, py: number, z: number) => {
      const maxX = W * 0.48 * z;
      const maxY = H * 0.48 * z;
      return {
        x: Math.max(-maxX, Math.min(maxX, px)),
        y: Math.max(-maxY, Math.min(maxY, py)),
      };
    },
    [W, H],
  );

  // Display & Wiki Lens state
  const [displayMode, setDisplayMode] = useState<AtlasDisplayMode>("CLEAN_LOD");
  const [lens, setLens] = useState<AtlasWikiLens>("POLITICAL");
  const [eraTick, setEraTick] = useState<number>(1000);

  // 3D Terrain Relief Background state (progressive 2-stage raster)
  const [showTerrainBackdrop, setShowTerrainBackdrop] = useState<boolean>(true);
  const [terrainStyle, setTerrainStyle] = useState<TerrainBackdropStyle>("PHYSICAL_RELIEF");
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0.48);
  const [terrainBackdropUrl, setTerrainBackdropUrl] = useState<string | null>(null);
  const [terrainHdReady, setTerrainHdReady] = useState<boolean>(false);

  useEffect(() => {
    if (!showTerrainBackdrop) return;
    setTerrainHdReady(false);
    // Stage 1: Instant preview (<25ms)
    const preview = renderTerrainBackdropSync(terrainStyle, 420, 236);
    if (preview) setTerrainBackdropUrl(preview);

    // Stage 2: Non-blocking HD upgrade (1280x720) in background chunks
    const cancel = renderTerrainBackdropProgressive(
      terrainStyle,
      (hdUrl) => {
        setTerrainBackdropUrl(hdUrl);
        setTerrainHdReady(true);
      },
      1280,
      720,
    );
    return cancel;
  }, [showTerrainBackdrop, terrainStyle]);

  // Pre-compute static SVG paths once for 60fps panning
  const continentShelfPaths = useMemo(
    () =>
      Object.entries(bundle.continents).map(([cid, mask]) => ({
        id: cid,
        d: polygonToSvgPath(mask, W, H),
      })),
    [bundle.continents, W, H],
  );

  const topoChainSvgPoints = useMemo(
    () =>
      bundle.topoChains.map((c) => ({
        chain: c,
        pts: polylineToSvgPoints(c.points, W, H),
      })),
    [bundle.topoChains, W, H],
  );

  const routeSvgPoints = useMemo(
    () =>
      bundle.routes.map((r) => ({
        route: r,
        pts: polylineToSvgPoints(r.points, W, H),
      })),
    [bundle.routes, W, H],
  );

  // Layer toggles (7 layers including Alliance Arcs)
  const [layers, setLayers] = useState({
    topography: true,
    graticule: true,
    routes: true,
    alliances: true,
    chokepoints: true,
    resources: false,
    labels: true,
  });

  // Animated Era Playback
  const [isPlayingEra, setIsPlayingEra] = useState(false);
  useEffect(() => {
    if (!isPlayingEra) return;
    const timer = window.setInterval(() => {
      setEraTick((prev) => (prev >= 1000 ? 0 : prev + 250));
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlayingEra]);

  // Personal encyclopedic pins on the 360-nation planet (persisted in localStorage)
  const [pinMode, setPinMode] = useState(false);
  const [personalPins, setPersonalPins] = useState<
    Array<{ id: string; label: string; x: number; y: number }>
  >([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("codex_planetary_personal_pins_v1");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setPersonalPins(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const savePersonalPins = useCallback(
    (next: Array<{ id: string; label: string; x: number; y: number }>) => {
      setPersonalPins(next);
      try {
        window.localStorage.setItem("codex_planetary_personal_pins_v1", JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
    },
    [],
  );

  // SVG ref for high-res snapshot export & multi-touch pinch tracking
  const svgRef = useRef<SVGSVGElement | null>(null);
  const touchPinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  // Selection, hover, filter, comparison, ruler & pathfinder
  // Start with drawers collapsed so the full panoramic 360-nation planet is immediately visible
  const [selectedNationId, setSelectedNationId] = useState<string | null>(null);
  const [hoveredNationId, setHoveredNationId] = useState<string | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterContinent, setFilterContinent] = useState<ContinentId | "ALL">("ALL");
  const [filterTier, setFilterTier] = useState<PolityScaleTier | "ALL">("ALL");
  const [filterBiome, setFilterBiome] = useState<AtlasBiomeId | "ALL">("ALL");

  const [compareIds, setCompareIds] = useState<string[]>(["nation-1", "nation-2", "nation-3"]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);
  const [showSpreadsheetModal, setShowSpreadsheetModal] = useState<boolean>(false);
  const [showWorldHubModal, setShowWorldHubModal] = useState<boolean>(false);
  const [globe3DMode, setGlobe3DMode] = useState<boolean>(false);
  const [blueprintNation, setBlueprintNation] = useState<PlanetaryNation | null>(null);

  // Đợt 1 Pro Cartography state (#2 Day/Night, #3 Density Heatmap, #4 Season, #6 Area Tool, #7 Bookmarks, #10 2-Hop)
  const [showDayNight, setShowDayNight] = useState<boolean>(false);
  const [planetHour, setPlanetHour] = useState<number>(12);
  const [densityHeatmap, setDensityHeatmap] = useState<boolean>(false);
  const [season, setSeason] = useState<SeasonId>("SPRING");
  const [showTwoHop, setShowTwoHop] = useState<boolean>(false);
  const [areaMode, setAreaMode] = useState<boolean>(false);
  const [areaPoints, setAreaPoints] = useState<Point2D[]>([]);

  const PRESET_BOOKMARKS = useMemo(
    () => [
      { id: "bm-tri", name: "Ngã Ba Tam Biên", x: 0.608, y: 0.378, zoom: 4.4 },
      { id: "bm-occ", name: "Occidentalis & Ngân Hà", x: 0.358, y: 0.34, zoom: 2.6 },
      { id: "bm-ori", name: "Viễn Đông Orientis", x: 0.865, y: 0.355, zoom: 2.6 },
      { id: "bm-oce", name: "Quần đảo Trung Dương", x: 0.435, y: 0.70, zoom: 2.5 },
      { id: "bm-sol", name: "Lục địa Solara", x: 0.155, y: 0.68, zoom: 2.5 },
      { id: "bm-aus", name: "Lục địa Australis", x: 0.785, y: 0.74, zoom: 2.5 },
    ],
    [],
  );

  const areaKm2 = useMemo(
    () => computePolygonAreaKm2(areaPoints, bundle.circumferenceKm),
    [areaPoints, bundle.circumferenceKm],
  );

  const twoHopRings = useMemo(() => {
    if (!showTwoHop || !selectedNationId) return null;
    return getTwoHopNeighbors(bundle.nations, selectedNationId);
  }, [showTwoHop, selectedNationId, bundle.nations]);

  const continentStats = useMemo(() => {
    const entryTitlesNorm = entries.map((e) => normalizeSearchText(e.title));
    const map = new Map<
      ContinentId,
      { id: ContinentId; count: number; pop: number; area: number; wikiCount: number }
    >();
    for (const n of bundle.nations) {
      const cur = map.get(n.continent) ?? {
        id: n.continent,
        count: 0,
        pop: 0,
        area: 0,
        wikiCount: 0,
      };
      cur.count += 1;
      cur.pop += n.population;
      cur.area += n.areaKm2;
      // All 360 nations have full canonical Wiki dossiers (ent-nation-1..360)
      cur.wikiCount += 1;
      map.set(n.continent, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bundle.nations]);

  // Geographic Ruler & Dijkstra Pathfinder
  const [rulerMode, setRulerMode] = useState<boolean>(false);
  const [rulerPoints, setRulerPoints] = useState<Point2D[]>([]);
  const [showPathfinder, setShowPathfinder] = useState<boolean>(false);
  const [pathStartId, setPathStartId] = useState<string>("nation-1");
  const [pathEndId, setPathEndId] = useState<string>("nation-8");

  // Pointer drag state with rAF throttling
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPanRef = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragRef = useRef<{ active: boolean; startX: number; startY: number; origPanX: number; origPanY: number; moved: boolean }>({
    active: false,
    startX: 0,
    startY: 0,
    origPanX: 0,
    origPanY: 0,
    moved: false,
  });

  const nationsById = useMemo(() => {
    const map = new Map<string, PlanetaryNation>();
    for (const n of bundle.nations) map.set(n.id, n);
    return map;
  }, [bundle.nations]);

  const activeEra = useMemo(() => {
    let best = bundle.eras[0];
    for (const e of bundle.eras) {
      if (e.tick <= eraTick) best = e;
    }
    return best;
  }, [bundle.eras, eraTick]);

  // Era-filtered nations
  const eraNations = useMemo(
    () => bundle.nations.filter((n) => n.validFromTick <= eraTick && n.validToTick >= eraTick),
    [bundle.nations, eraTick],
  );

  // Filtered nation list for drawer
  const filteredNations = useMemo(() => {
    const q = normalizeSearchText(searchQuery);
    return eraNations.filter((n) => {
      if (filterContinent !== "ALL" && n.continent !== filterContinent) return false;
      if (filterTier !== "ALL" && n.tier !== filterTier) return false;
      if (filterBiome !== "ALL" && n.biome !== filterBiome) return false;
      if (!q) return true;
      const hay = normalizeSearchText(
        `#${n.nationNum} ${n.name} ${n.shortName} ${n.capital} ${n.bloc} ${n.regionName} ${n.primaryLanguage}`,
      );
      return hay.includes(q);
    });
  }, [eraNations, filterContinent, filterTier, filterBiome, searchQuery]);

  const selectedNation = selectedNationId ? nationsById.get(selectedNationId) ?? null : null;
  const hoveredNation = hoveredNationId ? nationsById.get(hoveredNationId) ?? null : null;

  // Dijkstra shortest path between two nations
  const shortestPath = useMemo(() => {
    if (!showPathfinder || !pathStartId || !pathEndId) return null;
    return findShortestNationPath(eraNations, pathStartId, pathEndId, bundle.circumferenceKm);
  }, [showPathfinder, pathStartId, pathEndId, eraNations, bundle.circumferenceKm]);

  const highlightedPathSet = useMemo(() => {
    return new Set(shortestPath?.nationIds ?? []);
  }, [shortestPath]);

  const isolatedNeighborSet = useMemo(() => {
    if (!selectedNation) return new Set<string>();
    return new Set([selectedNation.id, ...selectedNation.neighbors]);
  }, [selectedNation]);

  // Fast bbox viewport culling for labels
  const viewportBounds = useMemo(
    () => computeNormalizedViewportBounds(zoom, pan.x, pan.y, W, H, 0.1),
    [zoom, pan.x, pan.y, W, H],
  );

  const visibleNationsForLabels = useMemo(
    () =>
      eraNations.filter(
        (n) =>
          !(
            n.bbox.maxX < viewportBounds.minX ||
            n.bbox.minX > viewportBounds.maxX ||
            n.bbox.maxY < viewportBounds.minY ||
            n.bbox.minY > viewportBounds.maxY
          ),
      ),
    [eraNations, viewportBounds],
  );

  // Label size selector (larger, clearer default "md") & smooth camera animation ref
  const [labelSize, setLabelSize] = useState<"sm" | "md" | "lg">("md");
  const labelScale = labelSize === "lg" ? 1.45 : labelSize === "md" ? 1.24 : 1.0;
  const flyAnimRef = useRef<number | null>(null);
  const zoomRef = useRef<number>(zoom);
  const panRef = useRef<{ x: number; y: number }>(pan);
  zoomRef.current = zoom;
  panRef.current = pan;

  // Zero-overlap labels in screen-space virtual coordinates (paused during fast drag for 60fps)
  const placedLabels = useMemo(() => {
    if (!layers.labels || isDragging) return [];
    const highlighted = new Set<string>(highlightedPathSet);
    if (displayMode === "ISOLATED_FOCUS" && selectedNation) {
      for (const id of isolatedNeighborSet) highlighted.add(id);
    }
    return selectZeroOverlapLabels(visibleNationsForLabels, {
      zoom,
      panX: pan.x,
      panY: pan.y,
      canvasWidth: W,
      canvasHeight: H,
      forceAllLod: displayMode === "COLOR_MOSAIC" && zoom >= 2.2,
      selectedId: selectedNationId,
      hoveredId: hoveredNationId,
      highlightedIds: highlighted,
      labelScale,
    });
  }, [
    layers.labels,
    isDragging,
    visibleNationsForLabels,
    zoom,
    pan.x,
    pan.y,
    W,
    H,
    displayMode,
    selectedNation,
    isolatedNeighborSet,
    selectedNationId,
    hoveredNationId,
    highlightedPathSet,
    labelScale,
  ]);

  const rulerReport = useMemo(
    () => computeExpeditionTravel(rulerPoints, bundle.circumferenceKm),
    [rulerPoints, bundle.circumferenceKm],
  );

  const elevationProfile = useMemo(
    () => sampleRouteElevationProfile(rulerPoints, 24, bundle.circumferenceKm),
    [rulerPoints, bundle.circumferenceKm],
  );

  // Smooth Animated Fly-To (cubic ease-out ~380ms)
  const flyToPoint = useCallback(
    (nx: number, ny: number, targetZoom = 3.2) => {
      if (flyAnimRef.current !== null) {
        cancelAnimationFrame(flyAnimRef.current);
        flyAnimRef.current = null;
      }
      const clampedZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, targetZoom));
      const targetPan = clampPan(
        -(nx - 0.5) * W * clampedZoom,
        -(ny - 0.5) * H * clampedZoom,
        clampedZoom,
      );
      const startZoom = zoomRef.current;
      const startPan = panRef.current;
      const startTime = performance.now();
      const durationMs = 380;

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / durationMs);
        const ease = 1 - Math.pow(1 - t, 3);
        const curZ = startZoom + (clampedZoom - startZoom) * ease;
        const curX = startPan.x + (targetPan.x - startPan.x) * ease;
        const curY = startPan.y + (targetPan.y - startPan.y) * ease;
        setZoom(Number(curZ.toFixed(3)));
        setPan({ x: curX, y: curY });
        if (t < 1) {
          flyAnimRef.current = requestAnimationFrame(step);
        } else {
          flyAnimRef.current = null;
        }
      };
      flyAnimRef.current = requestAnimationFrame(step);
    },
    [W, H, MAX_ZOOM, MIN_ZOOM, clampPan],
  );

  const flyToNation = useCallback(
    (nation: PlanetaryNation, targetZoom?: number) => {
      setSelectedNationId(nation.id);
      const z =
        targetZoom ??
        (nation.tier === "IMPERIAL_REALM"
          ? 2.6
          : nation.tier === "MAJOR_STATE"
            ? 3.4
            : 4.5);
      flyToPoint(nation.x, nation.y, z);
    },
    [flyToPoint],
  );

  const resetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  const focusTriBorder = useCallback(() => {
    setSelectedNationId("nation-1");
    flyToPoint(0.608, 0.378, 4.4);
  }, [flyToPoint]);

  // Non-passive wheel listener so mouse-wheel zooming never scrolls the page or shoots off-canvas
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const factor = e.deltaY < 0 ? 1.14 : 0.88;
      setZoom((curZoom) => {
        const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((curZoom * factor).toFixed(3))));
        if (nextZoom === curZoom) return curZoom;

        const cursorNormX = (e.clientX - rect.left) / rect.width - 0.5;
        const cursorNormY = (e.clientY - rect.top) / rect.height - 0.5;
        const vx = cursorNormX * W;
        const vy = cursorNormY * H;
        const scaleRatio = nextZoom / curZoom;

        setPan((prev) =>
          clampPan(
            vx - (vx - prev.x) * scaleRatio,
            vy - (vy - prev.y) * scaleRatio,
            nextZoom,
          ),
        );
        return nextZoom;
      });
    };
    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => el.removeEventListener("wheel", onNativeWheel);
  }, [W, H, MAX_ZOOM, MIN_ZOOM, clampPan]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origPanX: pan.x,
      origPanY: pan.y,
      moved: false,
    };
  }, [pan.x, pan.y]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current.active) return;
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dxScreen = e.clientX - dragRef.current.startX;
      const dyScreen = e.clientY - dragRef.current.startY;
      if (!dragRef.current.moved && Math.hypot(dxScreen, dyScreen) > 4) {
        dragRef.current.moved = true;
        setIsDragging(true);
      }
      const dxVirtual = (dxScreen / rect.width) * W;
      const dyVirtual = (dyScreen / rect.height) * H;
      pendingPanRef.current = clampPan(
        dragRef.current.origPanX + dxVirtual,
        dragRef.current.origPanY + dyVirtual,
        zoom,
      );
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          if (pendingPanRef.current) {
            setPan(pendingPanRef.current);
          }
        });
      }
    },
    [W, H, zoom, clampPan],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (pendingPanRef.current) {
      setPan(pendingPanRef.current);
      pendingPanRef.current = null;
    }
  }, []);

  const handleNationHover = useCallback((id: string | null) => {
    setHoveredNationId(id);
  }, []);

  // Jump to nation when invoked from Ctrl+K Command Palette
  useEffect(() => {
    if (!initialFocusNationId) return;
    const target = nationsById.get(initialFocusNationId);
    if (target) {
      flyToNation(target);
    }
  }, [initialFocusNationId, nationsById, flyToNation]);

  // Pre-compute Alliance Arcs (highlights Tri-Border Alliance #1-#2-#3 + major alliances)
  const allianceArcs = useMemo(() => {
    const arcs: Array<{ id: string; d: string; isTriBorder: boolean }> = [];
    for (const dip of bundle.diplomacy) {
      if (dip.status !== "ALLIANCE" || dip.fromTick > eraTick) continue;
      const a = nationsById.get(dip.polityAId);
      const b = nationsById.get(dip.polityBId);
      if (!a || !b) continue;
      const isTri = Boolean(a.isTriBorder && b.isTriBorder);
      if (!isTri && arcs.length >= 42) continue;
      const ax = a.x * W;
      const ay = a.y * H;
      const bx = b.x * W;
      const by = b.y * H;
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5 - Math.min(48, Math.hypot(bx - ax, by - ay) * 0.22);
      arcs.push({
        id: dip.id,
        d: `M${ax.toFixed(1)},${ay.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`,
        isTriBorder: isTri,
      });
    }
    return arcs;
  }, [bundle.diplomacy, eraTick, nationsById, W, H]);

  // Multi-touch 2-finger pinch-to-zoom handlers for Mobile/Tablet
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchPinchRef.current = { dist: Math.hypot(dx, dy), zoom };
        dragRef.current.active = false;
      }
    },
    [zoom],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (e.touches.length === 2 && touchPinchRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.hypot(dx, dy);
        if (touchPinchRef.current.dist > 10) {
          const ratio = newDist / touchPinchRef.current.dist;
          const nextZoom = Math.min(
            MAX_ZOOM,
            Math.max(MIN_ZOOM, Number((touchPinchRef.current.zoom * ratio).toFixed(2))),
          );
          setZoom(nextZoom);
          setPan((p) => clampPan(p.x, p.y, nextZoom));
        }
      }
    },
    [MAX_ZOOM, MIN_ZOOM, clampPan],
  );

  const handleTouchEnd = useCallback(() => {
    touchPinchRef.current = null;
  }, []);

  const handleExportSvgSnapshot = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const raw = serializer.serializeToString(svgEl);
    const blob = new Blob([raw], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aethelgard-atlas-360-${lens.toLowerCase()}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [lens]);

  const handleExportPng2K = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const raw = new XMLSerializer().serializeToString(svgEl);
    const svgBlob = new Blob([raw], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2400;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#061326";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((pngBlob) => {
          if (!pngBlob) return;
          const pngUrl = URL.createObjectURL(pngBlob);
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `aethelgard-atlas-2k-${lens.toLowerCase()}.png`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(pngUrl), 1000);
        }, "image/png");
      }
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  }, [lens]);

  const handleNationSelect = useCallback(
    (id: string, e: React.MouseEvent<SVGPathElement>) => {
      if (rulerMode || pinMode || areaMode || dragRef.current.moved) return;
      e.stopPropagation();
      setSelectedNationId(id);
    },
    [rulerMode, pinMode, areaMode],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (dragRef.current.moved) return;
      if (!rulerMode && !pinMode && !areaMode) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const vx = ((e.clientX - rect.left) / rect.width) * W;
      const vy = ((e.clientY - rect.top) / rect.height) * H;
      const nx = (vx - W * 0.5 - pan.x) / (W * zoom) + 0.5;
      const ny = (vy - H * 0.5 - pan.y) / (H * zoom) + 0.5;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;

      if (rulerMode) {
        setRulerPoints((prev) => [...prev, { x: Number(nx.toFixed(4)), y: Number(ny.toFixed(4)) }]);
      } else if (areaMode) {
        setAreaPoints((prev) => [...prev, { x: Number(nx.toFixed(4)), y: Number(ny.toFixed(4)) }]);
      } else if (pinMode) {
        const label = window.prompt("Nhập tên ghi chú / địa điểm cá nhân trên hành tinh:", "Địa điểm nghiên cứu");
        if (label && label.trim()) {
          savePersonalPins([
            ...personalPins,
            {
              id: `ppin-${Date.now()}`,
              label: label.trim(),
              x: Number(nx.toFixed(4)),
              y: Number(ny.toFixed(4)),
            },
          ]);
        }
        setPinMode(false);
      }
    },
    [rulerMode, pinMode, areaMode, W, H, pan.x, pan.y, zoom, personalPins, savePersonalPins],
  );

  const toggleCompare = useCallback((nationId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(nationId)) return prev.filter((id) => id !== nationId);
      if (prev.length >= 6) return prev;
      return [...prev, nationId];
    });
  }, []);

  // Matching existing wiki entry for selected nation
  const matchingWikiEntry = useMemo(() => {
    if (!selectedNation) return null;
    const q1 = normalizeSearchText(selectedNation.name);
    const q2 = normalizeSearchText(selectedNation.shortName);
    return (
      entries.find((e) => {
        const t = normalizeSearchText(e.title);
        return t === q1 || t.includes(q1) || (q2.length >= 4 && t.includes(q2));
      }) ?? null
    );
  }, [entries, selectedNation]);

  const selectedDiplomacy = useMemo(() => {
    if (!selectedNation) return [];
    return bundle.diplomacy
      .filter(
        (d) =>
          d.fromTick <= eraTick &&
          (d.polityAId === selectedNation.id || d.polityBId === selectedNation.id),
      )
      .slice(0, 8);
  }, [bundle.diplomacy, selectedNation, eraTick]);

  const selectedResourceFlows = useMemo(() => {
    if (!selectedNation) return [];
    return bundle.resourceFlows.filter(
      (r) => r.sourceNationId === selectedNation.id || r.targetNationId === selectedNation.id,
    );
  }, [bundle.resourceFlows, selectedNation]);

  const handleCreateWikiForNation = useCallback(() => {
    if (!selectedNation || !onCreateEntryFromAtlas) return;
    const neighborNames = selectedNation.neighbors
      .map((id) => nationsById.get(id))
      .filter((n): n is PlanetaryNation => Boolean(n))
      .map((n) => `${n.name} (#${n.nationNum})`);
    const treatyLines = selectedDiplomacy.map((d) => {
      const otherId = d.polityAId === selectedNation.id ? d.polityBId : d.polityAId;
      const other = nationsById.get(otherId);
      return `- **${DIPLOMACY_META[d.status].label}** với ${other?.name ?? otherId}: ${d.treatyTitle}`;
    });
    const resourceLines = selectedResourceFlows.map((r) => {
      const isExport = r.sourceNationId === selectedNation.id;
      const other = nationsById.get(isExport ? r.targetNationId : r.sourceNationId);
      return `- ${isExport ? "Xuất khẩu" : "Nhập khẩu"} **${r.resourceName}** (${r.volumeLabel}) ${isExport ? "sang" : "từ"} ${other?.shortName ?? "đối tác"}`;
    });

    const md = buildNationWikiMarkdown(
      selectedNation,
      neighborNames,
      treatyLines,
      resourceLines,
    );
    onCreateEntryFromAtlas(selectedNation.name, selectedNation.summary, md);
  }, [selectedNation, onCreateEntryFromAtlas, nationsById, selectedDiplomacy, selectedResourceFlows]);

  // Mini-map viewport box (normalized 0..1)
  const miniBox = useMemo(() => {
    const b = computeNormalizedViewportBounds(zoom, pan.x, pan.y, W, H, 0);
    const x = Math.max(0, Math.min(1, b.minX));
    const y = Math.max(0, Math.min(1, b.minY));
    const w = Math.max(0.03, Math.min(1 - x, b.maxX - x));
    const h = Math.max(0.03, Math.min(1 - y, b.maxY - y));
    return { x, y, w, h };
  }, [zoom, pan.x, pan.y, W, H]);

  const svgTransform = `translate(${(W * 0.5 + pan.x).toFixed(1)}, ${(H * 0.5 + pan.y).toFixed(1)}) scale(${zoom.toFixed(3)}) translate(${(-W * 0.5).toFixed(1)}, ${(-H * 0.5).toFixed(1)})`;

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100"
          : "flex flex-col rounded-xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-2xl"
      }
    >
      {/* Top Encyclopedic Atlas Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-3 py-2">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-cyan-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100">
                Bản đồ Đại Hành Tinh {bundle.planetName}
              </span>
              <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[11px] font-medium text-cyan-300 border border-cyan-500/30">
                {eraNations.length} / {bundle.nations.length} Quốc gia
              </span>
              <span className="hidden md:inline text-[11px] text-slate-400">
                Chu vi {bundle.circumferenceKm.toLocaleString("vi-VN")} km • 8 Lục địa
              </span>
            </div>
          </div>
        </div>

        {/* Display Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.desc}
                onClick={() => setDisplayMode(m.id)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                  displayMode === m.id
                    ? "bg-cyan-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowFilterDrawer((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              showFilterDrawer
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Tra cứu ({filteredNations.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setRulerMode((v) => !v);
              if (rulerMode) setRulerPoints([]);
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              rulerMode
                ? "border-amber-500/60 bg-amber-500/20 text-amber-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Ruler className="h-3.5 w-3.5" />
            Thước Địa lý
          </button>

          <button
            type="button"
            onClick={() => setShowPathfinder((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              showPathfinder
                ? "border-violet-500/60 bg-violet-500/20 text-violet-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <RouteIcon className="h-3.5 w-3.5" />
            Lộ trình
          </button>

          <button
            type="button"
            onClick={() => {
              setPinMode((v) => !v);
              setRulerMode(false);
            }}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
              pinMode
                ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
            title="Nhấp lên bản đồ để cắm ghim ghi chú cá nhân"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Ghim ({personalPins.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setAreaMode((v) => !v);
              setRulerMode(false);
              setPinMode(false);
              if (areaMode) setAreaPoints([]);
            }}
            className={`codex-press inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              areaMode
                ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
            title="Chấm 3+ điểm để đo diện tích vùng địa lý (km²)"
          >
            Đo Diện tích
          </button>

          <button
            type="button"
            onClick={() => setShowWorldHubModal(true)}
            className="codex-press inline-flex items-center gap-1 rounded-lg border border-indigo-500/40 bg-indigo-500/15 px-2.5 py-1 text-xs font-medium text-indigo-200 hover:bg-indigo-500/25 cursor-pointer"
            title="Mở Trung tâm Phân tích: 450+ Hiệp ước Ngoại giao, Ma trận Giao thương, Biên niên sử Đa làn & Từ nguyên học 360 QG"
          >
            Phân tích Thế giới
          </button>

          <button
            type="button"
            onClick={() => setShowSpreadsheetModal(true)}
            className="codex-press inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
            title="Mở Bảng Dữ Liệu 360 Quốc Gia & Xuất CSV/Excel"
          >
            <Table2 className="h-3.5 w-3.5" />
            Bảng 360 & CSV
          </button>

          <button
            type="button"
            onClick={handleExportPng2K}
            className="codex-press inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
            title="Xuất ảnh PNG độ phân giải 2K (2400×1350)"
          >
            <Download className="h-3.5 w-3.5 text-amber-300" />
            PNG 2K
          </button>

          <button
            type="button"
            onClick={handleExportSvgSnapshot}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
            title="Xuất ảnh bản đồ hiện tại dưới dạng SVG sắc nét"
          >
            <Download className="h-3.5 w-3.5" />
            Xuất SVG
          </button>

          <button
            type="button"
            onClick={() => setGlobe3DMode((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
              globe3DMode
                ? "border-sky-400 bg-sky-500/20 text-sky-200 shadow"
                : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}
            title="Chuyển đổi giữa Bản đồ Phẳng 2D và Quả cầu 3D xoay 360°"
          >
            <Globe2 className="h-3.5 w-3.5 text-sky-400" />
            {globe3DMode ? "Bản đồ 2D" : "Quả cầu 3D"}
          </button>

          <button
            type="button"
            onClick={() => setShowAnalyticsModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
            title="Thống kê 8 Lục địa & Độ phủ Hồ sơ Wiki"
          >
            <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
            Thống kê
          </button>

          <button
            type="button"
            onClick={() => setShowCompareModal(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            <Scale className="h-3.5 w-3.5" />
            So sánh ({compareIds.length})
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
            title={isFullscreen ? "Thu nhỏ" : "Mở toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          </button>
        </div>
      </div>

      {/* Second Bar: 7 Pure-Wiki Lenses + 6 Layers */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-900/70 px-3 py-1.5 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Thấu kính Wiki:
          </span>
          {LENS_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLens(opt.id)}
              className={`rounded-md px-2 py-0.5 text-xs transition ${
                lens === opt.id
                  ? "bg-indigo-600 text-white font-medium"
                  : "bg-slate-800/70 text-slate-300 hover:bg-slate-800"
              }`}
            >
              {opt.label}
            </button>
          ))}
          {lens === "CLIMATE" && (
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as SeasonId)}
              className="ml-1 rounded-md border border-sky-500/50 bg-slate-900 px-1.5 py-0.5 text-[11px] text-sky-200"
              title="Mô phỏng biến thiên nhiệt độ theo 4 mùa hành tinh"
            >
              {(Object.keys(SEASON_META) as SeasonId[]).map((sid) => (
                <option key={sid} value={sid}>
                  {SEASON_META[sid].label}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setDensityHeatmap((v) => !v)}
            className={`ml-1 rounded-md px-2 py-0.5 text-[11px] border transition cursor-pointer ${
              densityHeatmap
                ? "border-rose-400 bg-rose-500/20 text-rose-200 font-semibold"
                : "border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800"
            }`}
            title="Bật Bản đồ Nhiệt Mật độ Dân số (người/km²)"
          >
            Mật độ
          </button>
          <button
            type="button"
            onClick={() => setShowTwoHop((v) => !v)}
            className={`rounded-md px-2 py-0.5 text-[11px] border transition cursor-pointer ${
              showTwoHop
                ? "border-violet-400 bg-violet-500/20 text-violet-200 font-semibold"
                : "border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800"
            }`}
            title="Tô sáng láng giềng Bậc 1 (xanh) và Bậc 2 (tím) quanh quốc gia đang chọn"
          >
            Vành đai 2 bậc
          </button>
          <button
            type="button"
            onClick={() => setShowDayNight((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] border transition cursor-pointer ${
              showDayNight
                ? "border-amber-400 bg-amber-500/20 text-amber-200 font-semibold"
                : "border-slate-700 bg-slate-800/70 text-slate-300 hover:bg-slate-800"
            }`}
            title="Bật Vành đai Ngày/Đêm & Múi giờ hành tinh"
          >
            <Sun className="h-3 w-3" /> Ngày/Đêm
          </button>
          {showDayNight && (
            <div className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-slate-900 px-1.5 py-0.5 text-[10px] text-amber-200">
              <span className="font-mono">{String(planetHour).padStart(2, "0")}:00</span>
              <input
                type="range"
                min={0}
                max={23}
                value={planetHour}
                onChange={(e) => setPlanetHour(Number(e.target.value))}
                className="w-16 accent-amber-400"
              />
            </div>
          )}
          <select
            defaultValue=""
            onChange={(e) => {
              const bm = PRESET_BOOKMARKS.find((b) => b.id === e.target.value);
              if (bm) flyToPoint(bm.x, bm.y, bm.zoom);
              e.target.value = "";
            }}
            className="rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-200"
            title="Bay nhanh tới các Góc nhìn Địa lý nổi bật"
          >
            <option value="" disabled>Góc nhìn nhanh…</option>
            {PRESET_BOOKMARKS.map((bm) => (
              <option key={bm.id} value={bm.id}>
                ✦ {bm.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
          {/* 3D Terrain Backdrop Controls */}
          <div className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-950/35 px-2 py-0.5">
            <label className="inline-flex cursor-pointer items-center gap-1 select-none text-emerald-200 font-medium">
              <input
                type="checkbox"
                checked={showTerrainBackdrop}
                onChange={(e) => setShowTerrainBackdrop(e.target.checked)}
                className="h-3 w-3 rounded border-emerald-600 bg-slate-800 accent-emerald-400"
              />
              <Mountain className="h-3 w-3" />
              <span>Nền Địa hình</span>
            </label>
            {showTerrainBackdrop && (
              <>
                <select
                  value={terrainStyle}
                  onChange={(e) => setTerrainStyle(e.target.value as TerrainBackdropStyle)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-slate-200"
                  title="Phong cách ảnh nền địa hình"
                >
                  {TERRAIN_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400" title="Độ phủ màu quốc gia trên nền địa hình">
                  Phủ {Math.round(overlayOpacity * 100)}%
                </span>
                <input
                  type="range"
                  min={15}
                  max={88}
                  step={5}
                  value={Math.round(overlayOpacity * 100)}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                  className="w-14 accent-emerald-400"
                  title="Chỉnh độ trong suốt màu quốc gia để thấy rõ núi non địa hình 3D"
                />
                {!terrainHdReady && (
                  <span className="text-[9px] text-emerald-300/80 animate-pulse">HD…</span>
                )}
              </>
            )}
          </div>

          <Layers className="h-3.5 w-3.5 text-slate-400" />
          {(
            [
              ["topography", "Địa hình"],
              ["graticule", "Kinh Vĩ độ"],
              ["routes", "Thương lộ"],
              ["alliances", "Liên minh"],
              ["chokepoints", "Cửa khẩu"],
              ["resources", "Tài nguyên"],
              ["labels", "Nhãn Quốc gia"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex cursor-pointer items-center gap-1 select-none">
              <input
                type="checkbox"
                checked={layers[key]}
                onChange={(e) =>
                  setLayers((prev) => ({ ...prev, [key]: e.target.checked }))
                }
                className="h-3 w-3 rounded border-slate-600 bg-slate-800 accent-cyan-500"
              />
              <span>{label}</span>
            </label>
          ))}
          {layers.labels && (
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as "sm" | "md" | "lg")}
              className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[10px] text-cyan-200"
              title="Cỡ chữ nhãn tên quốc gia trên bản đồ"
            >
              <option value="sm">Nhãn Nhỏ</option>
              <option value="md">Nhãn Vừa (Rõ)</option>
              <option value="lg">Nhãn Lớn</option>
            </select>
          )}
        </div>
      </div>

      {/* Main Workspace: Full-Bleed Mega-Planet SVG Viewport + Floating Overlay Drawers */}
      <div className={`relative flex flex-1 min-h-0 ${isFullscreen ? "h-[calc(100vh-140px)]" : "h-[68vh] min-h-[540px]"}`}>
        {/* Left Filter & Search Drawer (floating overlay so map stays panoramic) */}
        {showFilterDrawer && (
          <aside className="absolute left-0 top-0 bottom-0 z-20 flex w-72 flex-col border-r border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur">
            <div className="border-b border-slate-800 p-2.5 space-y-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm #số, quốc gia, thủ đô..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-8 pr-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <select
                  value={filterContinent}
                  onChange={(e) => setFilterContinent(e.target.value as ContinentId | "ALL")}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-[11px] text-slate-200"
                >
                  <option value="ALL">Tất cả 8 Lục địa & Hải vực</option>
                  {(Object.keys(CONTINENT_NAME_VI) as ContinentId[]).map((cid) => (
                    <option key={cid} value={cid}>
                      {CONTINENT_NAME_VI[cid]}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value as PolityScaleTier | "ALL")}
                    className="rounded-md border border-slate-700 bg-slate-950 px-1.5 py-1 text-[11px] text-slate-200"
                  >
                    <option value="ALL">Mọi Quy mô</option>
                    {(Object.keys(TIER_META) as PolityScaleTier[]).map((t) => (
                      <option key={t} value={t}>
                        {TIER_META[t].shortLabel}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filterBiome}
                    onChange={(e) => setFilterBiome(e.target.value as AtlasBiomeId | "ALL")}
                    className="rounded-md border border-slate-700 bg-slate-950 px-1.5 py-1 text-[11px] text-slate-200"
                  >
                    <option value="ALL">Mọi Sinh thái</option>
                    {(Object.keys(BIOME_META) as AtlasBiomeId[]).map((b) => (
                      <option key={b} value={b}>
                        {BIOME_META[b].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {filteredNations.map((n) => {
                const isSelected = n.id === selectedNationId;
                const inCompare = compareIds.includes(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => flyToNation(n)}
                    className={`group flex cursor-pointer items-center justify-between gap-2 px-2.5 py-2 text-xs transition ${
                      isSelected ? "bg-cyan-500/15 text-white" : "hover:bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/30"
                          style={{ backgroundColor: n.color }}
                        />
                        <span className="truncate font-medium">
                          #{n.nationNum} {n.shortName}
                        </span>
                        {n.isTriBorder && (
                          <span className="rounded bg-amber-500/20 px-1 text-[9px] text-amber-300">
                            Tam Biên
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 truncate text-[10px] text-slate-400">
                        {n.capital} • {n.regionCode} • {TIER_META[n.tier].shortLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompare(n.id);
                      }}
                      title={inCompare ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
                      className={`rounded px-1.5 py-0.5 text-[10px] border transition ${
                        inCompare
                          ? "border-amber-500/60 bg-amber-500/20 text-amber-200"
                          : "border-slate-700 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white"
                      }`}
                    >
                      {inCompare ? "✓" : "+SS"}
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center Interactive Mega-Planet Viewport (2D Map or 3D Orthographic Globe) */}
        {globe3DMode ? (
          <PlanetaryGlobeView
            bundle={bundle}
            selectedNationId={selectedNationId}
            onSelectNation={(n) => setSelectedNationId(n.id)}
          />
        ) : (
        <div
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 w-full h-full overflow-hidden bg-[#061326] select-none touch-none ${
            rulerMode || pinMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
          }`}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid slice"
            onClick={handleCanvasClick}
            className="block h-full w-full"
          >
            <defs>
              <radialGradient id="ocean-depth" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="#0d2a4a" />
                <stop offset="65%" stopColor="#081c34" />
                <stop offset="100%" stopColor="#040d1a" />
              </radialGradient>
            </defs>

            {/* Ocean backdrop */}
            <rect x={0} y={0} width={W} height={H} fill="url(#ocean-depth)" />

            <g transform={svgTransform}>
              {/* Layer 0: 3D Physical Terrain & Bathymetry World Map Background Image */}
              {showTerrainBackdrop && terrainBackdropUrl && (
                <image
                  href={terrainBackdropUrl}
                  x={0}
                  y={0}
                  width={W}
                  height={H}
                  preserveAspectRatio="none"
                  style={{ imageRendering: "auto" }}
                />
              )}

              {/* Layer 1: Graticule (30-degree Lat/Lon Grid) */}
              {layers.graticule && (
                <g opacity={showTerrainBackdrop ? 0.18 : 0.22} stroke="#38bdf8" strokeWidth={0.8 / Math.sqrt(zoom)}>
                  {Array.from({ length: 11 }, (_, i) => ((i + 1) / 12) * W).map((gx, idx) => (
                    <line key={`lon-${idx}`} x1={gx} y1={0} x2={gx} y2={H} strokeDasharray="6 6" />
                  ))}
                  {Array.from({ length: 5 }, (_, i) => ((i + 1) / 6) * H).map((gy, idx) => (
                    <line
                      key={`lat-${idx}`}
                      x1={0}
                      y1={gy}
                      x2={W}
                      y2={gy}
                      strokeDasharray={idx === 2 ? undefined : "6 6"}
                      stroke={idx === 2 ? "#f59e0b" : "#38bdf8"}
                    />
                  ))}
                </g>
              )}

              {/* Continent Base Shelf Glow (subtle coastline outline when 3D terrain is active) */}
              <g pointerEvents="none">
                {continentShelfPaths.map((shelf) => (
                  <path
                    key={`shelf-${shelf.id}`}
                    d={shelf.d}
                    fill={showTerrainBackdrop ? "none" : "#0f2942"}
                    stroke={showTerrainBackdrop ? "rgba(56, 189, 248, 0.32)" : "#1e4976"}
                    strokeWidth={(showTerrainBackdrop ? 1.8 : 3.5) / Math.sqrt(zoom)}
                  />
                ))}
              </g>

              {/* 360 Nation Voronoi / Island Polygons (React.memo, pre-computed svgPath) */}
              <NationPolygonsLayer
                nations={eraNations}
                lens={lens}
                displayMode={displayMode}
                selectedNationId={selectedNationId}
                hoveredNationId={hoveredNationId}
                highlightedPathSet={highlightedPathSet}
                isolatedNeighborSet={isolatedNeighborSet}
                twoHopRings={twoHopRings}
                diplomacy={bundle.diplomacy}
                season={season}
                densityHeatmap={densityHeatmap}
                overlayOpacity={overlayOpacity}
                showTerrainBackdrop={showTerrainBackdrop}
                strokeScale={1 / Math.sqrt(zoom)}
                onHover={handleNationHover}
                onSelect={handleNationSelect}
              />

              {/* #2 Planetary Solar Terminator (Day/Night Shadow Band) */}
              {showDayNight && (() => {
                const nightCenterX = (((planetHour + 12) % 24) / 24) * W;
                const halfW = W * 0.25;
                const startX = nightCenterX - halfW;
                return (
                  <g pointerEvents="none">
                    <rect
                      x={startX}
                      y={0}
                      width={halfW * 2}
                      height={H}
                      fill="rgba(2, 6, 23, 0.46)"
                    />
                    {startX < 0 && (
                      <rect
                        x={startX + W}
                        y={0}
                        width={-startX}
                        height={H}
                        fill="rgba(2, 6, 23, 0.46)"
                      />
                    )}
                    {startX + halfW * 2 > W && (
                      <rect
                        x={0}
                        y={0}
                        width={startX + halfW * 2 - W}
                        height={H}
                        fill="rgba(2, 6, 23, 0.46)"
                      />
                    )}
                  </g>
                );
              })()}

              {/* #6 Polygon Area Measurement Overlay */}
              {areaPoints.length > 0 && (
                <g pointerEvents="none">
                  {areaPoints.length >= 3 && (
                    <polygon
                      points={polylineToSvgPoints(areaPoints, W, H)}
                      fill="rgba(34, 211, 238, 0.22)"
                      stroke="#22d3ee"
                      strokeWidth={2.5 / Math.sqrt(zoom)}
                      strokeDasharray="6 4"
                    />
                  )}
                  {areaPoints.map((pt, idx) => (
                    <circle
                      key={`ap-${idx}`}
                      cx={pt.x * W}
                      cy={pt.y * H}
                      r={4.8 / Math.sqrt(zoom)}
                      fill="#22d3ee"
                      stroke="#0f172a"
                      strokeWidth={1.4 / Math.sqrt(zoom)}
                    />
                  ))}
                </g>
              )}

              {/* Layer 2: Topography (Mountain Ranges, Rivers, Ocean Currents, Volcanoes) */}
              {layers.topography && (
                <g pointerEvents="none">
                  {topoChainSvgPoints.map(({ chain, pts }) => (
                    <polyline
                      key={chain.id}
                      points={pts}
                      fill="none"
                      stroke={
                        chain.kind === "MOUNTAIN"
                          ? "#e2e8f0"
                          : chain.kind === "RIVER"
                            ? "#38bdf8"
                            : "#22d3ee"
                      }
                      strokeOpacity={chain.kind === "CURRENT" ? 0.35 : 0.65}
                      strokeWidth={
                        (chain.kind === "MOUNTAIN" ? 2.4 : chain.kind === "RIVER" ? 1.8 : 2.2) /
                        Math.sqrt(zoom)
                      }
                      strokeDasharray={
                        chain.kind === "MOUNTAIN"
                          ? "3 4"
                          : chain.kind === "CURRENT"
                            ? "10 8"
                            : undefined
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                  {bundle.volcanoes.map((v) => (
                    <g key={v.id} transform={`translate(${v.x * W}, ${v.y * H})`}>
                      <polygon
                        points={`0,${-6 / Math.sqrt(zoom)} ${5 / Math.sqrt(zoom)},${4 / Math.sqrt(zoom)} ${-5 / Math.sqrt(zoom)},${4 / Math.sqrt(zoom)}`}
                        fill="#f97316"
                        stroke="#7c2d12"
                        strokeWidth={1 / Math.sqrt(zoom)}
                      />
                    </g>
                  ))}
                </g>
              )}

              {/* Layer 3: Trade, Maritime & Scholar Routes */}
              {layers.routes && (
                <g pointerEvents="none" opacity={0.78}>
                  {routeSvgPoints.map(({ route: rt, pts }) => (
                    <polyline
                      key={rt.id}
                      points={pts}
                      fill="none"
                      stroke={rt.color}
                      strokeWidth={1.6 / Math.sqrt(zoom)}
                      strokeDasharray={rt.dashed ? `${6 / Math.sqrt(zoom)} ${5 / Math.sqrt(zoom)}` : undefined}
                    />
                  ))}
                </g>
              )}

              {/* Layer 3b: Alliance Arcs Overlay (highlights Tri-Border Alliance #1-#2-#3) */}
              {layers.alliances && (
                <g pointerEvents="none">
                  {allianceArcs.map((arc) => (
                    <path
                      key={arc.id}
                      d={arc.d}
                      fill="none"
                      stroke={arc.isTriBorder ? "#22c55e" : "#4ade80"}
                      strokeOpacity={arc.isTriBorder ? 0.92 : 0.42}
                      strokeWidth={(arc.isTriBorder ? 3.2 : 1.4) / Math.sqrt(zoom)}
                      strokeDasharray={arc.isTriBorder ? undefined : `${5 / Math.sqrt(zoom)} ${4 / Math.sqrt(zoom)}`}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              )}

              {/* Personal Encyclopedic Pins */}
              {personalPins.length > 0 && (
                <g>
                  {personalPins.map((pin) => (
                    <g
                      key={pin.id}
                      transform={`translate(${pin.x * W}, ${pin.y * H})`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Xóa ghim cá nhân "${pin.label}"?`)) {
                          savePersonalPins(personalPins.filter((p) => p.id !== pin.id));
                        }
                      }}
                    >
                      <circle
                        r={6.5 / Math.sqrt(zoom)}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={1.6 / Math.sqrt(zoom)}
                      />
                      <text
                        y={-9 / Math.sqrt(zoom)}
                        textAnchor="middle"
                        fill="#a7f3d0"
                        fontSize={11 / Math.sqrt(zoom)}
                        fontWeight={700}
                        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}
                      >
                        ★ {pin.label}
                      </text>
                    </g>
                  ))}
                </g>
              )}

              {/* Layer 4: Resource Exchange Flows */}
              {layers.resources && (
                <g pointerEvents="none" opacity={0.68}>
                  {bundle.resourceFlows.slice(0, 80).map((flow) => {
                    const src = nationsById.get(flow.sourceNationId);
                    const tgt = nationsById.get(flow.targetNationId);
                    if (!src || !tgt) return null;
                    return (
                      <line
                        key={flow.id}
                        x1={src.x * W}
                        y1={src.y * H}
                        x2={tgt.x * W}
                        y2={tgt.y * H}
                        stroke="#34d399"
                        strokeWidth={1.1 / Math.sqrt(zoom)}
                        strokeDasharray="4 4"
                      />
                    );
                  })}
                </g>
              )}

              {/* Layer 5: Chokepoints & Border Crossings */}
              {layers.chokepoints && (
                <g pointerEvents="none">
                  {bundle.chokepoints.map((chk) => (
                    <g key={chk.id} transform={`translate(${chk.x * W}, ${chk.y * H})`}>
                      <circle
                        r={4.8 / Math.sqrt(zoom)}
                        fill="#f59e0b"
                        stroke="#0f172a"
                        strokeWidth={1.2 / Math.sqrt(zoom)}
                      />
                    </g>
                  ))}
                </g>
              )}

              {/* Dijkstra Shortest Path Overlay */}
              {shortestPath && shortestPath.nationIds.length >= 2 && (
                <g pointerEvents="none">
                  <polyline
                    points={polylineToSvgPoints(
                      shortestPath.nationIds
                        .map((id) => nationsById.get(id))
                        .filter((n): n is PlanetaryNation => Boolean(n))
                        .map((n) => ({ x: n.x, y: n.y })),
                      W,
                      H,
                    )}
                    fill="none"
                    stroke="#e879f9"
                    strokeWidth={3.6 / Math.sqrt(zoom)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </g>
              )}

              {/* Geographic Ruler Overlay */}
              {rulerPoints.length > 0 && (
                <g pointerEvents="none">
                  {rulerPoints.length >= 2 && (
                    <polyline
                      points={polylineToSvgPoints(rulerPoints, W, H)}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth={3 / Math.sqrt(zoom)}
                      strokeDasharray="8 5"
                    />
                  )}
                  {rulerPoints.map((pt, idx) => (
                    <circle
                      key={`rp-${idx}`}
                      cx={pt.x * W}
                      cy={pt.y * H}
                      r={5 / Math.sqrt(zoom)}
                      fill="#fbbf24"
                      stroke="#0f172a"
                      strokeWidth={1.5 / Math.sqrt(zoom)}
                    />
                  ))}
                </g>
              )}

              {/* Continent Watermark Labels (visible at macro zoom) */}
              {zoom < 2.4 && (
                <g pointerEvents="none" opacity={Math.max(0.15, 0.72 - (zoom - 1) * 0.35)}>
                  {bundle.continentLabels.map((cl) => (
                    <g key={cl.id} transform={`translate(${cl.x * W}, ${cl.y * H})`}>
                      <text
                        textAnchor="middle"
                        fill="#e2e8f0"
                        fontSize={22 / Math.sqrt(zoom)}
                        fontWeight={800}
                        letterSpacing="0.16em"
                        style={{ textShadow: "0 2px 6px rgba(0,0,0,0.85)" }}
                      >
                        {cl.name}
                      </text>
                    </g>
                  ))}
                </g>
              )}
            </g>

            {/* Screen-Space Zero-Overlap Nation Labels (crisp, larger & adjustable) */}
            {layers.labels && (
              <g pointerEvents="none">
                {placedLabels.map((m) => {
                  const bw = m.box.x2 - m.box.x1;
                  const bh = m.box.y2 - m.box.y1;
                  const tierBoost = m.nation.lodTier === 0 ? 1.12 : 1.0;
                  const fontSize = Number((11.5 * labelScale * tierBoost).toFixed(1));
                  return (
                    <g key={`lbl-${m.nation.id}`}>
                      <circle
                        cx={m.sx}
                        cy={m.sy}
                        r={m.nation.id === selectedNationId ? 5.2 : m.nation.lodTier === 0 ? 4.2 : 2.5}
                        fill={m.nation.id === selectedNationId ? "#ffffff" : "#f8fafc"}
                        stroke="#0f172a"
                        strokeWidth={1.4}
                      />
                      {m.showLabel && (
                        <g transform={`translate(${m.sx}, ${m.sy - 9})`}>
                          <rect
                            x={-bw / 2}
                            y={-bh + 3}
                            width={bw}
                            height={bh}
                            rx={6}
                            fill={
                              m.nation.id === selectedNationId
                                ? "rgba(8, 145, 178, 0.96)"
                                : m.nation.isTriBorder
                                  ? "rgba(180, 83, 9, 0.92)"
                                  : "rgba(10, 17, 34, 0.88)"
                            }
                            stroke={
                              m.nation.id === selectedNationId
                                ? "#67e8f9"
                                : m.nation.isTriBorder
                                  ? "#fcd34d"
                                  : "rgba(148, 163, 184, 0.48)"
                            }
                            strokeWidth={1.1}
                          />
                          <text
                            textAnchor="middle"
                            y={-bh * 0.28 + 3}
                            fill="#ffffff"
                            fontSize={fontSize}
                            fontWeight={m.nation.lodTier === 0 ? 700 : 600}
                            style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
                          >
                            #{m.nation.nationNum} {m.nation.shortName}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* Top-Left Zoom & Quick Navigation Controls */}
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
            <div className="flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur">
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => {
                    const next = Math.min(MAX_ZOOM, Number((z * 1.28).toFixed(2)));
                    setPan((p) => clampPan(p.x, p.y, next));
                    return next;
                  })
                }
                className="rounded p-1.5 text-slate-200 hover:bg-slate-800"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="min-w-[44px] text-center font-mono text-xs text-cyan-300">
                {zoom.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoom((z) => {
                    const next = Math.max(MIN_ZOOM, Number((z * 0.78).toFixed(2)));
                    setPan((p) => clampPan(p.x, p.y, next));
                    return next;
                  })
                }
                className="rounded p-1.5 text-slate-200 hover:bg-slate-800"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={resetView}
                className="rounded px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
                title="Toàn hành tinh"
              >
                Toàn cầu
              </button>
              <button
                type="button"
                onClick={focusTriBorder}
                className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/30"
                title="Bay tới Ngã Ba Tam Biên Aurelia"
              >
                <Compass className="h-3.5 w-3.5" />
                Tam Biên
              </button>
            </div>

            {/* Hover Pure-Wiki Tooltip */}
            {hoveredNation && (
              <div className="max-w-xs rounded-lg border border-slate-700 bg-slate-950/92 px-3 py-2 text-xs shadow-xl backdrop-blur">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: hoveredNation.color }}
                  />
                  #{hoveredNation.nationNum} {hoveredNation.name}
                </div>
                <div className="mt-1 text-[11px] text-slate-300">
                  Thủ đô: <span className="text-cyan-300">{hoveredNation.capital}</span> •{" "}
                  {BIOME_META[hoveredNation.biome].label}
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {hoveredNation.latLabel}, {hoveredNation.lonLabel} • Cao độ{" "}
                  {hoveredNation.elevationM.toLocaleString("vi-VN")} m • {hoveredNation.avgTempC}°C
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  Dân số: {hoveredNation.population.toLocaleString("vi-VN")} • Diện tích:{" "}
                  {hoveredNation.areaKm2.toLocaleString("vi-VN")} km²
                </div>
              </div>
            )}
          </div>

          {/* #6 Polygon Area Measurement Floating Panel */}
          {areaMode && (
            <div className="absolute bottom-3 left-3 z-20 w-76 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300">
                  Đo Diện Tích Vùng ({areaPoints.length} đỉnh)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAreaPoints([])}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700 cursor-pointer"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAreaMode(false);
                      setAreaPoints([]);
                    }}
                    className="rounded p-0.5 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Nhấp tối thiểu 3 điểm trên bản đồ để khép kín vùng cần đo diện tích.
              </p>
              {areaPoints.length >= 3 && (
                <div className="mt-2 rounded-lg bg-slate-900 p-2 text-center">
                  <div className="text-[10px] text-slate-400">Diện tích vùng đã chọn</div>
                  <div className="font-mono text-base font-bold text-cyan-300">
                    {areaKm2.toLocaleString("vi-VN")} km²
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Geographic Ruler Floating Panel */}
          {rulerMode && (
            <div className="absolute bottom-3 left-3 z-20 w-80 rounded-xl border border-amber-500/40 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-300">
                  <Ruler className="h-4 w-4" />
                  Thước Đo Địa lý ({rulerPoints.length} điểm)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setRulerPoints([])}
                    className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300 hover:bg-slate-700"
                  >
                    Xóa điểm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRulerMode(false);
                      setRulerPoints([]);
                    }}
                    className="rounded p-0.5 text-slate-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Nhấp lên bản đồ để đặt các mốc lộ trình trắc địa.
              </p>
              {rulerPoints.length >= 2 && (
                <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-900 p-2 text-[11px]">
                  <div>
                    <div className="text-slate-400">Tổng quãng đường</div>
                    <div className="font-semibold text-amber-200">
                      {rulerReport.totalKm.toLocaleString("vi-VN")} km
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Nhiệt độ TB tuyến</div>
                    <div className="font-semibold text-cyan-200">{rulerReport.avgTempC} °C</div>
                  </div>
                  <div>Lữ hành bộ: <b>{rulerReport.footDays} ngày</b></div>
                  <div>Thương đoàn: <b>{rulerReport.caravanDays} ngày</b></div>
                  <div>Thuyền buồm: <b>{rulerReport.sailingDays} ngày</b></div>
                  <div>Khinh khí cầu: <b>{rulerReport.airshipHours} giờ</b></div>
                </div>
              )}
              {elevationProfile.length >= 2 && (() => {
                const maxEl = Math.max(1000, ...elevationProfile.map((p) => p.elevationM));
                const pts = elevationProfile
                  .map((p, i) => {
                    const px = (i / (elevationProfile.length - 1)) * 280;
                    const py = 58 - (p.elevationM / maxEl) * 50;
                    return `${px.toFixed(1)},${py.toFixed(1)}`;
                  })
                  .join(" ");
                const areaPts = `0,60 ${pts} 280,60`;
                return (
                  <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/90 p-2">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Mặt cắt Địa hình dọc tuyến</span>
                      <span className="font-mono text-emerald-300">
                        Đỉnh {Math.max(...elevationProfile.map((p) => p.elevationM)).toLocaleString("vi-VN")} m
                      </span>
                    </div>
                    <svg viewBox="0 0 280 62" className="w-full h-14 block">
                      <polygon points={areaPts} fill="rgba(16, 185, 129, 0.22)" />
                      <polyline points={pts} fill="none" stroke="#34d399" strokeWidth={1.8} />
                    </svg>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Dijkstra Pathfinder Floating Panel */}
          {showPathfinder && (
            <div className="absolute bottom-3 left-3 z-20 w-84 rounded-xl border border-violet-500/40 bg-slate-950/95 p-3 text-xs shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 font-semibold text-violet-300">
                  <Navigation className="h-4 w-4" />
                  Tìm Lộ trình Liên Quốc gia (Dijkstra)
                </span>
                <button
                  type="button"
                  onClick={() => setShowPathfinder(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={pathStartId}
                  onChange={(e) => setPathStartId(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
                >
                  {eraNations.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.nationNum} {n.shortName}
                    </option>
                  ))}
                </select>
                <select
                  value={pathEndId}
                  onChange={(e) => setPathEndId(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
                >
                  {eraNations.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.nationNum} {n.shortName}
                    </option>
                  ))}
                </select>
              </div>
              {shortestPath ? (
                <div className="mt-2 rounded-lg bg-slate-900 p-2 text-[11px] space-y-1">
                  <div className="flex justify-between text-violet-200 font-medium">
                    <span>Quãng đường: {shortestPath.totalKm.toLocaleString("vi-VN")} km</span>
                    <span>{shortestPath.hopCount} chặng</span>
                  </div>
                  <div className="text-slate-300 leading-relaxed">
                    {shortestPath.nationIds
                      .map((id) => nationsById.get(id)?.shortName ?? id)
                      .join(" → ")}
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-[11px] text-slate-400">
                  Chưa tìm thấy đường nối trực tiếp giữa hai quốc gia này.
                </div>
              )}
            </div>
          )}

          {/* Bottom-Right Live Mini-Map Radar */}
          <div className="absolute bottom-3 right-3 z-10 hidden sm:block overflow-hidden rounded-lg border border-slate-700/90 bg-slate-950/90 shadow-xl">
            <svg
              width={184}
              height={104}
              viewBox="0 0 184 104"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const nx = (e.clientX - rect.left) / rect.width;
                const ny = (e.clientY - rect.top) / rect.height;
                flyToPoint(nx, ny, Math.max(zoom, 1.8));
              }}
              className="cursor-pointer block"
            >
              <rect x={0} y={0} width={184} height={104} fill="#05101f" />
              {Object.entries(bundle.continents).map(([cid, mask]) => (
                <path
                  key={`mini-${cid}`}
                  d={polygonToSvgPath(mask, 184, 104)}
                  fill="#1e3a5f"
                  stroke="#38bdf8"
                  strokeOpacity={0.35}
                  strokeWidth={0.6}
                />
              ))}
              {selectedNation && (
                <circle
                  cx={selectedNation.x * 184}
                  cy={selectedNation.y * 104}
                  r={2.8}
                  fill="#fbbf24"
                />
              )}
              <rect
                x={miniBox.x * 184}
                y={miniBox.y * 104}
                width={miniBox.w * 184}
                height={miniBox.h * 104}
                fill="rgba(34, 211, 238, 0.14)"
                stroke="#22d3ee"
                strokeWidth={1.2}
              />
            </svg>
          </div>
        </div>
        )}

        {/* Right Nation Encyclopedic Inspector (Mobile Bottom Sheet / Desktop Right Drawer) */}
        {selectedNation && (
          <aside className="fixed md:absolute inset-x-0 bottom-0 md:inset-x-auto md:right-0 md:top-0 md:bottom-0 z-30 md:z-20 flex max-h-[62vh] md:max-h-none md:w-80 flex-col rounded-t-2xl md:rounded-none border-t md:border-t-0 md:border-l border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur overflow-y-auto">
            <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-slate-600 md:hidden" />
            <div className="border-b border-slate-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full border border-white/40"
                      style={{ backgroundColor: selectedNation.color }}
                    />
                    <span className="text-[11px] font-mono text-cyan-300">
                      QUỐC GIA #{selectedNation.nationNum}
                    </span>
                    {selectedNation.isTriBorder && (
                      <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
                        Lõi Tam Biên
                      </span>
                    )}
                  </div>
                  <h3 className="mt-1 text-base font-bold text-white leading-snug">
                    {selectedNation.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Thủ đô: <span className="text-slate-200">{selectedNation.capital}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNationId(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 1-Click Wiki Integration (Direct link to canonical ent-nation-# dossier) */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    onOpenEntry(matchingWikiEntry?.id ?? `ent-nation-${selectedNation.nationNum}`)
                  }
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Mở Hồ sơ Wiki đầy đủ
                </button>

                <button
                  type="button"
                  onClick={() => setBlueprintNation(selectedNation)}
                  className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/50 bg-cyan-500/15 px-2.5 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/25 cursor-pointer"
                  title="Sinh sơ đồ quy hoạch vector của thủ đô"
                >
                  <Compass className="h-3.5 w-3.5" />
                  Sơ đồ Thủ đô
                </button>

                <button
                  type="button"
                  onClick={() => toggleCompare(selectedNation.id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                    compareIds.includes(selectedNation.id)
                      ? "border-amber-500/60 bg-amber-500/20 text-amber-200"
                      : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                >
                  {compareIds.includes(selectedNation.id) ? "Đã chọn SS" : "+ So sánh"}
                </button>

                {canEdit && onCreateTaskForNation && (
                  <button
                    type="button"
                    onClick={() =>
                      onCreateTaskForNation(
                        `Biên soạn hồ sơ #${selectedNation.nationNum} ${selectedNation.shortName}`,
                        `Hoàn thiện địa lý, biên niên sử và quan hệ ngoại giao cho ${selectedNation.name} (Thủ đô ${selectedNation.capital}, khu vực ${selectedNation.regionCode}).`,
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-500/50 bg-indigo-500/15 px-2.5 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-500/25"
                    title="Tạo tác vụ biên tập cho quốc gia này"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                    + Tác vụ
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 p-3 text-xs">
              <p className="rounded-lg border border-slate-800 bg-slate-950/70 p-2.5 leading-relaxed text-slate-300">
                {selectedNation.summary}
              </p>

              {/* Encyclopedic Fact Grid */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Lục địa</div>
                  <div className="font-medium text-slate-100">
                    {CONTINENT_NAME_VI[selectedNation.continent]}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Khu vực</div>
                  <div className="font-medium text-slate-100">
                    {selectedNation.regionCode}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Dân số Ước tính</div>
                  <div className="font-semibold text-cyan-300">
                    {selectedNation.population.toLocaleString("vi-VN")}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Diện tích</div>
                  <div className="font-semibold text-slate-100">
                    {selectedNation.areaKm2.toLocaleString("vi-VN")} km²
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Cao độ & Khí hậu</div>
                  <div className="font-medium text-slate-100">
                    {selectedNation.elevationM.toLocaleString("vi-VN")} m • {selectedNation.avgTempC}°C
                  </div>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                  <div className="text-[10px] text-slate-400">Tọa độ Trắc địa</div>
                  <div className="font-mono text-[11px] text-slate-200">
                    {selectedNation.latLabel}, {selectedNation.lonLabel}
                  </div>
                </div>
              </div>

              {/* Governance & Culture */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Khối Địa chính trị:</span>
                  <span className="text-right font-medium text-slate-100">{selectedNation.bloc}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Thể chế:</span>
                  <span className="text-right font-medium text-slate-100">
                    {selectedNation.governmentType}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Ngôn ngữ chính:</span>
                  <span className="text-right font-medium text-slate-100">
                    {selectedNation.primaryLanguage}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Hệ sinh thái:</span>
                  <span className="text-right font-medium text-emerald-300">
                    {BIOME_META[selectedNation.biome].label}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-slate-400">Thành lập:</span>
                  <span className="text-right font-medium text-amber-200">
                    {selectedNation.foundingEra}
                  </span>
                </div>
              </div>

              {/* Diplomacy Treaties */}
              {selectedDiplomacy.length > 0 && (
                <div>
                  <h4 className="mb-1.5 font-semibold text-slate-200">
                    Hiệp ước & Quan hệ Ngoại giao ({selectedDiplomacy.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedDiplomacy.map((d) => {
                      const otherId =
                        d.polityAId === selectedNation.id ? d.polityBId : d.polityAId;
                      const other = nationsById.get(otherId);
                      const meta = DIPLOMACY_META[d.status];
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => other && flyToNation(other)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-left hover:border-slate-600"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium text-slate-100 truncate">
                              {other ? `#${other.nationNum} ${other.shortName}` : otherId}
                            </span>
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: `${meta.color}25`,
                                color: meta.color,
                              }}
                            >
                              {meta.shortLabel}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400 truncate">
                            {d.treatyTitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Resource Flows */}
              {selectedResourceFlows.length > 0 && (
                <div>
                  <h4 className="mb-1.5 font-semibold text-slate-200">
                    Tài nguyên & Giao thương ({selectedResourceFlows.length})
                  </h4>
                  <div className="space-y-1">
                    {selectedResourceFlows.map((r) => {
                      const isExport = r.sourceNationId === selectedNation.id;
                      const other = nationsById.get(
                        isExport ? r.targetNationId : r.sourceNationId,
                      );
                      return (
                        <div
                          key={r.id}
                          className="rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-[11px]"
                        >
                          <span className={isExport ? "text-emerald-300" : "text-sky-300"}>
                            {isExport ? "Xuất khẩu" : "Nhập khẩu"}
                          </span>{" "}
                          <b>{r.resourceName}</b> ({r.volumeLabel}){" "}
                          {other ? `• ${other.shortName}` : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Historical Era Playback Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 bg-slate-900/95 px-3 py-2 text-xs">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-amber-200">{activeEra.label}</span>
          <span className="hidden md:inline text-slate-400">— {activeEra.summary}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlayingEra((p) => !p)}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
              isPlayingEra
                ? "border-amber-500 bg-amber-500/20 text-amber-200"
                : "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
            title={isPlayingEra ? "Tạm dừng dòng thời gian" : "Phát tự động biên niên sử"}
          >
            {isPlayingEra ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            {isPlayingEra ? "Dừng" : "Phát"}
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            step={250}
            value={eraTick}
            onChange={(e) => {
              setIsPlayingEra(false);
              setEraTick(Number(e.target.value));
            }}
            className="w-36 sm:w-40 accent-amber-400"
          />
          <span className="font-mono text-[11px] text-slate-300">{activeEra.yearRange}</span>
        </div>
      </div>

      {/* Đợt 3: World Analytics Hub (Diplomacy 450+, Trade Matrix, Multi-Lane Timeline, Toponymy 360) */}
      {showWorldHubModal && (
        <WorldAnalyticsHubModal
          bundle={bundle}
          onClose={() => setShowWorldHubModal(false)}
          onFocusNation={(n) => {
            setGlobe3DMode(false);
            flyToNation(n);
          }}
          onOpenWikiEntry={onOpenEntry}
        />
      )}

      {/* #38 & #42 Spreadsheet Table View + CSV Export Modal */}
      {showSpreadsheetModal && (
        <NationsSpreadsheetModal
          nations={bundle.nations}
          onClose={() => setShowSpreadsheetModal(false)}
          onFocusOnMap={(n) => {
            setGlobe3DMode(false);
            flyToNation(n);
          }}
          onOpenWikiEntry={onOpenEntry}
        />
      )}

      {/* Procedural Capital City Blueprint Modal */}
      {blueprintNation && (
        <CapitalCityBlueprintModal
          nation={blueprintNation}
          onClose={() => setBlueprintNation(null)}
        />
      )}

      {/* Continent & Wiki Coverage Analytics Modal */}
      {showAnalyticsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="animate-codex-scale-in max-h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">
                  Thống kê 8 Lục địa & Độ phủ Hồ sơ Wiki (360 Quốc gia)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAnalyticsModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {continentStats.map((st) => {
                const pct = st.count > 0 ? Math.round((st.wikiCount / st.count) * 100) : 0;
                return (
                  <div
                    key={st.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2 codex-card-lift"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">
                        {CONTINENT_NAME_VI[st.id]}
                      </span>
                      <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-[11px] font-mono text-cyan-300">
                        {st.count} QG
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <div>Dân số: <b className="text-slate-200">{st.pop.toLocaleString("vi-VN")}</b></div>
                      <div>Diện tích: <b className="text-slate-200">{st.area.toLocaleString("vi-VN")} km²</b></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Độ phủ bài Wiki</span>
                        <span className="text-emerald-300 font-mono">
                          {st.wikiCount}/{st.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                          style={{ width: `${Math.max(pct, st.wikiCount > 0 ? 4 : 0)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterContinent(st.id);
                        setShowFilterDrawer(true);
                        setShowAnalyticsModal(false);
                      }}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 py-1 text-[11px] font-medium text-cyan-200 hover:bg-slate-800"
                    >
                      Lọc danh sách quốc gia →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Nation Encyclopedic Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">
                  Bảng So sánh Bách khoa ({compareIds.length}/6 Quốc gia)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto p-4">
              {compareIds.length === 0 ? (
                <p className="text-sm text-slate-400">
                  Hãy chọn từ 2 đến 6 quốc gia từ danh sách hoặc bản đồ để so sánh.
                </p>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-300">
                      <th className="py-2 pr-3">Tiêu chí Bách khoa</th>
                      {compareIds.map((id) => {
                        const n = nationsById.get(id);
                        if (!n) return null;
                        return (
                          <th key={id} className="px-3 py-2 font-semibold text-white">
                            <div className="flex items-center justify-between gap-2">
                              <span>
                                #{n.nationNum} {n.shortName}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleCompare(id)}
                                className="text-slate-500 hover:text-rose-400"
                              >
                                ×
                              </button>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-200">
                    {(
                      [
                        ["Tên đầy đủ", (n: PlanetaryNation) => n.name],
                        ["Thủ đô", (n: PlanetaryNation) => n.capital],
                        ["Lục địa", (n: PlanetaryNation) => CONTINENT_NAME_VI[n.continent]],
                        ["Quy mô", (n: PlanetaryNation) => TIER_META[n.tier].shortLabel],
                        ["Thể chế", (n: PlanetaryNation) => n.governmentType],
                        ["Ngôn ngữ", (n: PlanetaryNation) => n.primaryLanguage],
                        ["Hệ sinh thái", (n: PlanetaryNation) => BIOME_META[n.biome].label],
                        ["Dân số", (n: PlanetaryNation) => n.population.toLocaleString("vi-VN")],
                        ["Diện tích", (n: PlanetaryNation) => `${n.areaKm2.toLocaleString("vi-VN")} km²`],
                        ["Cao độ TB", (n: PlanetaryNation) => `${n.elevationM.toLocaleString("vi-VN")} m`],
                        ["Nhiệt độ TB", (n: PlanetaryNation) => `${n.avgTempC} °C`],
                        ["Thành lập", (n: PlanetaryNation) => n.foundingEra],
                      ] as Array<[string, (n: PlanetaryNation) => string]>
                    ).map(([label, getter]) => (
                      <tr key={label}>
                        <td className="py-2 pr-3 font-medium text-slate-400">{label}</td>
                        {compareIds.map((id) => {
                          const n = nationsById.get(id);
                          return (
                            <td key={id} className="px-3 py-2">
                              {n ? getter(n) : "—"}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
