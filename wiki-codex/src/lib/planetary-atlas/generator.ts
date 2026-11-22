import {
  BIOME_META,
  CONTINENT_LABELS,
  CONTINENT_MASKS,
  PLANET_CANVAS_HEIGHT,
  PLANET_CANVAS_WIDTH,
  PLANET_CIRCUMFERENCE_KM,
  PLANET_NAME,
  STRATEGIC_CHOKEPOINTS,
  TIER_META,
  TOPOGRAPHIC_CHAINS,
  VOLCANO_FEATURES,
  computeElevationMeters,
  computeLatitudeTemperatureC,
  formatLatLon,
} from "./climate-geology";
import {
  BESPOKE_TRIBORDER_POLYGONS,
  PLANETARY_REGIONS,
  buildAll360NationSeeds,
  type NationSeed,
} from "./nations-data";
import type {
  AtlasBiomeId,
  ContinentId,
  DiplomacyStatus,
  PlanetaryAtlasBundle,
  PlanetaryBorderCrossing,
  PlanetaryDiplomacy,
  PlanetaryEraDef,
  PlanetaryNation,
  PlanetaryRegionDef,
  PlanetaryResourceFlow,
  PlanetaryRoute,
  Point2D,
} from "./types";
import {
  buildIslandPolygon,
  computeContinentVoronoi,
  computePolygonArea,
  pointInPolygon,
} from "./voronoi";

let cachedBundle: PlanetaryAtlasBundle | null = null;

function halton(index: number, base: number): number {
  let f = 1;
  let r = 0;
  let i = index;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}

function polygonToSvgPathFast(poly: Point2D[], width: number, height: number): string {
  if (poly.length === 0) return "";
  let d = `M${(poly[0].x * width).toFixed(1)},${(poly[0].y * height).toFixed(1)}`;
  for (let i = 1; i < poly.length; i++) {
    d += ` L${(poly[i].x * width).toFixed(1)},${(poly[i].y * height).toFixed(1)}`;
  }
  return d + " Z";
}

function computePolygonBbox(poly: Point2D[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, maxX, minY, maxY };
}

function polygonCentroid(poly: Point2D[]): Point2D {
  if (poly.length === 0) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const p of poly) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / poly.length, y: sy / poly.length };
}

function isInsideAnyContinent(pt: Point2D): boolean {
  for (const mask of Object.values(CONTINENT_MASKS)) {
    if (pointInPolygon(pt, mask)) return true;
  }
  return false;
}

function placeSeedPoint(
  seed: NationSeed,
  region: PlanetaryRegionDef,
  indexInRegion: number,
  existingPoints: Point2D[],
): Point2D {
  if (seed.fixedPos) return { ...seed.fixedPos };

  const mask =
    region.continent !== "OCEANIC" ? CONTINENT_MASKS[region.continent] : null;
  const maskCenter = mask ? polygonCentroid(mask) : { x: 0.44, y: 0.71 };

  let bestCandidate: Point2D | null = null;
  let bestMinDist = -1;

  for (let attempt = 0; attempt < 28; attempt++) {
    const hIdx = indexInRegion * 13 + attempt * 7 + seed.nationNum + 5;
    const u = halton(hIdx, 2);
    const v = halton(hIdx, 3);
    let x = region.minX + u * (region.maxX - region.minX);
    let y = region.minY + v * (region.maxY - region.minY);

    if (mask) {
      if (!pointInPolygon({ x, y }, mask)) {
        // Pull gently toward continent center until inside
        for (let step = 1; step <= 6; step++) {
          const t = step / 6;
          const px = x + (maskCenter.x - x) * t;
          const py = y + (maskCenter.y - y) * t;
          if (pointInPolygon({ x: px, y: py }, mask)) {
            x = px;
            y = py;
            break;
          }
        }
      }
      if (!pointInPolygon({ x, y }, mask)) continue;
    } else {
      // Oceanic islands should not overlap continental landmasses
      if (isInsideAnyContinent({ x, y })) continue;
    }

    let minDist = Number.POSITIVE_INFINITY;
    for (const p of existingPoints) {
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < minDist) minDist = d;
    }
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      bestCandidate = { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) };
    }
    if (minDist >= 0.022) break;
  }

  if (bestCandidate) return bestCandidate;

  return {
    x: Number(((region.minX + region.maxX) * 0.5).toFixed(4)),
    y: Number(((region.minY + region.maxY) * 0.5).toFixed(4)),
  };
}

const RESOURCE_BY_BIOME: Record<AtlasBiomeId, string[]> = {
  TEMPERATE_PLAINS: ["Lúa mạch & Ngũ cốc", "Giấy da Lưu trữ", "Len & Vải lanh"],
  ARID_CANYON: ["Đá xây dựng Bazan", "Muối khoáng Cao nguyên", "Đồng thau"],
  ASH_VOLCANIC: ["Thủy tinh Núi lửa", "Quặng Lưu huỳnh", "Hợp kim Địa nhiệt"],
  SAND_DESERT: ["Ốc đảo Chà là", "Thủy tinh Thạch anh", "Gia vị Sa mạc"],
  TROPICAL_JUNGLE: ["Dược liệu Rừng mưa", "Gỗ Quý & Nhựa thơm", "Trà & Ca cao"],
  ALPINE_PEAKS: ["Quặng Bạc & Thiếc", "Đá cẩm thạch", "Nước khoáng Băng tan"],
  GLACIAL_ICE: ["Mẫu lõi Băng cổ", "Dầu hải dương", "Tinh thể Băng thạch"],
  CORAL_SEA: ["Ngọc trai San hô", "Hải đồ & Đóng tàu", "Muối biển tinh"],
  ARCHIPELAGO: ["Hương liệu Đảo quốc", "Hải sản Viễn dương", "Sợi dừa & Cánh buồm"],
};

export const PLANETARY_ERAS: PlanetaryEraDef[] = [
  {
    id: "era-ancient",
    tick: 0,
    label: "Kỷ Nguyên Cổ Đại (-1200)",
    yearRange: "-1500 → -400",
    summary: "Thời kỳ hình thành các nền văn minh đầu tiên tại Tam Biên Aurelia, Lưu vực Ngân Hà và Long Mạch Orientis.",
  },
  {
    id: "era-voyage",
    tick: 250,
    label: "Kỷ Nguyên Hải Trình (Năm 100)",
    yearRange: "-400 → 250",
    summary: "Các tuyến hàng hải vượt đại dương kết nối Hesperia, Solara và Australis vào mạng lưới bản đồ thế giới.",
  },
  {
    id: "era-treaties",
    tick: 500,
    label: "Kỷ Nguyên Hiệp Ước (Năm 450)",
    yearRange: "250 → 550",
    summary: "Hiệp ước Tam Biên được ký kết, thành lập Vùng Đệm Lưu Trữ #201 và các đặc khu ngoại giao trung lập.",
  },
  {
    id: "era-encyclopedia",
    tick: 750,
    label: "Kỷ Nguyên Bách Khoa (Năm 720)",
    yearRange: "550 → 820",
    summary: "Học Viện Ngã Ba Tam Biên (#203) cùng 12 Viện Lưu Trữ Hải Đảo hoàn thiện hệ thống trắc địa toàn hành tinh.",
  },
  {
    id: "era-modern",
    tick: 1000,
    label: "Hiện Đại Hành Tinh (Năm 1000)",
    yearRange: "820 → 1000+",
    summary: "Toàn bộ 360 quốc gia & lãnh thổ trên 8 lục địa cùng mạng lưới giao thương, học thuật và bảo tồn khí hậu.",
  },
];

export function buildPlanetaryAtlasBundle(): PlanetaryAtlasBundle {
  if (cachedBundle) return cachedBundle;

  const regionByCode = new Map<string, PlanetaryRegionDef>();
  for (const r of PLANETARY_REGIONS) regionByCode.set(r.code, r);

  const seeds = buildAll360NationSeeds();
  const regionCounters = new Map<string, number>();
  const placedPoints: Point2D[] = [];

  const positionedSeeds = seeds.map((seed) => {
    const region = regionByCode.get(seed.regionCode) ?? PLANETARY_REGIONS[0];
    const idx = regionCounters.get(region.code) ?? 0;
    regionCounters.set(region.code, idx + 1);

    const pos = placeSeedPoint(seed, region, idx, placedPoints);
    placedPoints.push(pos);
    return { seed, region, pos };
  });

  // Group continental sites for Power-Weighted Clipped Voronoi
  const continentSites = new Map<
    Exclude<ContinentId, "OCEANIC">,
    Array<{ id: string; x: number; y: number; tier: NationSeed["tier"] }>
  >();

  for (const item of positionedSeeds) {
    if (item.region.continent === "OCEANIC") continue;
    const list = continentSites.get(item.region.continent) ?? [];
    list.push({
      id: `nation-${item.seed.nationNum}`,
      x: item.pos.x,
      y: item.pos.y,
      tier: item.seed.tier,
    });
    continentSites.set(item.region.continent, list);
  }

  const voronoiPolygons = new Map<string, Point2D[]>();
  for (const [continent, sites] of continentSites.entries()) {
    const mask = CONTINENT_MASKS[continent];
    const cells = computeContinentVoronoi(sites, mask);
    for (const [id, poly] of cells.entries()) {
      voronoiPolygons.set(id, poly);
    }
  }

  // Total planet surface area scale (~1.3 billion km2 for mega-planet 64,000 km circumference)
  const planetAreaScaleKm2 = 1_150_000_000;

  const nations: PlanetaryNation[] = positionedSeeds.map(({ seed, region, pos }) => {
    const id = `nation-${seed.nationNum}`;
    let polygon: Point2D[];
    if (BESPOKE_TRIBORDER_POLYGONS[seed.nationNum]) {
      polygon = BESPOKE_TRIBORDER_POLYGONS[seed.nationNum].map((p) => ({ ...p }));
    } else if (region.continent === "OCEANIC") {
      const radius =
        seed.tier === "MAJOR_STATE"
          ? 0.0155
          : seed.tier === "SPECIAL_ZONE"
            ? 0.0105
            : 0.0122;
      polygon = buildIslandPolygon(pos.x, pos.y, radius, seed.nationNum * 17.3);
    } else {
      polygon =
        voronoiPolygons.get(id) ??
        buildIslandPolygon(pos.x, pos.y, 0.012, seed.nationNum * 11.7);
    }

    const elevationM = computeElevationMeters(pos.x, pos.y, seed.biome);
    const avgTempC = computeLatitudeTemperatureC(pos.x, pos.y, seed.biome, elevationM);
    const { latLabel, lonLabel } = formatLatLon(pos.x, pos.y);
    const normArea = Math.max(0.00004, computePolygonArea(polygon));
    const areaKm2 = Math.max(480, Math.round(normArea * planetAreaScaleKm2));

    const tierPopMultiplier =
      seed.tier === "IMPERIAL_REALM"
        ? 4.2
        : seed.tier === "MAJOR_STATE"
          ? 2.4
          : seed.tier === "REGIONAL_STATE"
            ? 1.4
            : seed.tier === "PRINCIPALITY"
              ? 0.85
              : seed.tier === "FREE_CITY"
                ? 1.15
                : 0.32;

    const biomeDensity =
      seed.biome === "GLACIAL_ICE"
        ? 4
        : seed.biome === "SAND_DESERT"
          ? 14
          : seed.biome === "TEMPERATE_PLAINS"
            ? 85
            : seed.biome === "CORAL_SEA"
              ? 72
              : 42;

    const deterministicJitter = 0.78 + ((seed.nationNum * 37) % 45) / 100;
    const population = Math.max(
      42_000,
      Math.round(areaKm2 * biomeDensity * 0.42 * tierPopMultiplier * deterministicJitter),
    );

    const lodTier = TIER_META[seed.tier].lodTier;

    return {
      id,
      nationNum: seed.nationNum,
      name: seed.name,
      shortName: seed.shortName,
      capital: seed.capital,
      tier: seed.tier,
      lodTier,
      continent: region.continent,
      regionCode: region.code,
      regionName: region.name,
      bloc: seed.bloc,
      biome: seed.biome,
      biomeColor: BIOME_META[seed.biome].color,
      color: seed.color,
      x: pos.x,
      y: pos.y,
      latLabel,
      lonLabel,
      elevationM,
      avgTempC,
      population,
      areaKm2,
      governmentType: seed.governmentType,
      primaryLanguage: seed.primaryLanguage,
      foundingEra: seed.foundingEra,
      validFromTick: seed.validFromTick,
      validToTick: seed.validToTick,
      isTriBorder: seed.isTriBorder,
      summary: seed.summary,
      polygon,
      svgPath: polygonToSvgPathFast(polygon, PLANET_CANVAS_WIDTH, PLANET_CANVAS_HEIGHT),
      bbox: computePolygonBbox(polygon),
      neighbors: [],
    };
  });

  // Build neighbor graph: K nearest same-continent neighbors + key intercontinental maritime/strait links
  const byId = new Map<string, PlanetaryNation>();
  for (const n of nations) byId.set(n.id, n);

  const neighborSets = new Map<string, Set<string>>();
  for (const n of nations) neighborSets.set(n.id, new Set());

  const linkPair = (aId: string, bId: string) => {
    if (aId === bId) return;
    neighborSets.get(aId)?.add(bId);
    neighborSets.get(bId)?.add(aId);
  };

  for (const a of nations) {
    const candidates: Array<{ id: string; dist: number }> = [];
    for (const b of nations) {
      if (a.id === b.id) continue;
      const sameCont = a.continent === b.continent;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if ((sameCont && dist < 0.14) || (!sameCont && dist < 0.085)) {
        candidates.push({ id: b.id, dist });
      }
    }
    candidates.sort((u, v) => u.dist - v.dist);
    const k = a.continent === "OCEANIC" ? 4 : 5;
    for (let i = 0; i < Math.min(k, candidates.length); i++) {
      linkPair(a.id, candidates[i].id);
    }
  }

  // Ensure major intercontinental sea & strait bridges are connected for planetary Dijkstra
  const majorHubs = [
    ["nation-1", "nation-2"],
    ["nation-1", "nation-3"],
    ["nation-2", "nation-3"],
    ["nation-1", "nation-201"],
    ["nation-2", "nation-201"],
    ["nation-3", "nation-201"],
    ["nation-201", "nation-203"],
    ["nation-1", "nation-4"],
    ["nation-3", "nation-5"],
    ["nation-4", "nation-6"],
    ["nation-6", "nation-7"],
    ["nation-4", "nation-9"],
    ["nation-2", "nation-9"],
    ["nation-7", "nation-9"],
    ["nation-9", "nation-8"],
    ["nation-5", "nation-8"],
    ["nation-1", "nation-10"],
    ["nation-4", "nation-10"],
  ];
  for (const [aId, bId] of majorHubs) {
    if (byId.has(aId) && byId.has(bId)) linkPair(aId, bId);
  }

  // Connect Antarctic nations to nearest Australis / Solara / Oceanic hubs
  const antarcticNations = nations.filter((n) => n.continent === "ANTARCTIC_ICE");
  for (const ant of antarcticNations.slice(0, 3)) {
    linkPair(ant.id, "nation-8");
    linkPair(ant.id, "nation-7");
    linkPair(ant.id, "nation-9");
  }

  for (const n of nations) {
    n.neighbors = Array.from(neighborSets.get(n.id) ?? []);
  }

  // Build 60+ pure-wiki routes (TRADE, MARITIME, SCHOLAR)
  const routes: PlanetaryRoute[] = [];
  const namedHubRoutes: Array<{
    id: string;
    name: string;
    kind: PlanetaryRoute["kind"];
    nationNums: number[];
    description: string;
  }> = [
    {
      id: "rt-silk-aurelia",
      name: "Con đường Tơ lụa & Lưu trữ Aurelia–Orientis",
      kind: "TRADE",
      nationNums: [4, 1, 201, 3, 5],
      description: "Hành lang thương mại cổ nối Ngân Hà Occidentia qua Ngã Ba Tam Biên tới Thiên Triều Ngọc Lĩnh.",
    },
    {
      id: "rt-grand-ocean",
      name: "Đại Hải Trình Trung Dương",
      kind: "MARITIME",
      nationNums: [6, 7, 9, 8, 5],
      description: "Tuyến hàng hải viễn dương xuyên bốn lục địa qua Quần đảo Trung Dương Pelagia.",
    },
    {
      id: "rt-scholar-axis",
      name: "Hành lang Học giả & Trắc địa Hành tinh",
      kind: "SCHOLAR",
      nationNums: [10, 1, 203, 9, 8],
      description: "Tuyến trao đổi học thuật và dữ liệu khí tượng từ Bắc Cực qua Học viện Tam Biên xuống Nam Bán Cầu.",
    },
    {
      id: "rt-solara-trade",
      name: "Tuyến Gia vị & Dược liệu Solara–Occidentia",
      kind: "MARITIME",
      nationNums: [7, 4, 2],
      description: "Hải trình vận chuyển dược liệu rừng mưa và thủy tinh thạch anh lên phía Bắc.",
    },
    {
      id: "rt-hesperia-arctic",
      name: "Tuyến Gỗ Tùng & Băng Hải Bắc",
      kind: "MARITIME",
      nationNums: [6, 10, 5],
      description: "Tuyến tàu mùa hè ven rìa Băng nguyên Bắc Cực nối Hesperia với Viễn Đông.",
    },
  ];

  for (const r of namedHubRoutes) {
    const pts = r.nationNums
      .map((num) => byId.get(`nation-${num}`))
      .filter((n): n is PlanetaryNation => Boolean(n))
      .map((n) => ({ x: n.x, y: n.y }));
    if (pts.length >= 2) {
      routes.push({
        id: r.id,
        name: r.name,
        kind: r.kind,
        color:
          r.kind === "TRADE"
            ? "#f59e0b"
            : r.kind === "MARITIME"
              ? "#38bdf8"
              : "#a855f7",
        dashed: r.kind !== "TRADE",
        points: pts,
        description: r.description,
      });
    }
  }

  // Add regional trade & scholar routes across all 24 regions (~60 routes total)
  const regionGroups = new Map<string, PlanetaryNation[]>();
  for (const n of nations) {
    const list = regionGroups.get(n.regionCode) ?? [];
    list.push(n);
    regionGroups.set(n.regionCode, list);
  }

  let routeIdx = 1;
  for (const [regionCode, list] of regionGroups.entries()) {
    if (list.length < 3) continue;
    const sorted = [...list].sort((a, b) => a.x - b.x);
    const kind: PlanetaryRoute["kind"] =
      sorted[0].continent === "OCEANIC"
        ? "MARITIME"
        : routeIdx % 3 === 0
          ? "SCHOLAR"
          : "TRADE";
    const step = Math.max(1, Math.floor(sorted.length / 4));
    const pts: Point2D[] = [];
    for (let i = 0; i < sorted.length; i += step) {
      pts.push({ x: sorted[i].x, y: sorted[i].y });
    }
    if (pts.length >= 2) {
      routes.push({
        id: `rt-reg-${regionCode}-${routeIdx++}`,
        name:
          kind === "MARITIME"
            ? `Hải trình Khu vực ${regionCode}`
            : kind === "SCHOLAR"
              ? `Tuyến Bưu chính Học thuật ${regionCode}`
              : `Thương lộ Nội vùng ${regionCode}`,
        kind,
        color:
          kind === "TRADE"
            ? "#eab308"
            : kind === "MARITIME"
              ? "#0ea5e9"
              : "#c084fc",
        dashed: kind !== "TRADE",
        points: pts,
        description: `Tuyến kết nối các đô thị và trung tâm hành chính chính của khu vực ${regionCode}.`,
      });
    }
  }

  // Generate 450+ bilateral diplomatic treaties (pure wiki diplomacy)
  const diplomacy: PlanetaryDiplomacy[] = [];
  const seenDipPairs = new Set<string>();

  const pushDip = (
    a: PlanetaryNation,
    b: PlanetaryNation,
    status: DiplomacyStatus,
    treatyTitle: string,
    fromTick: number,
  ) => {
    const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
    if (seenDipPairs.has(key)) return;
    seenDipPairs.add(key);
    diplomacy.push({
      id: `dip-${diplomacy.length + 1}`,
      polityAId: a.id,
      polityBId: b.id,
      status,
      treatyTitle,
      fromTick,
      summary: `${treatyTitle} giữa ${a.shortName} và ${b.shortName}, quy định hợp tác biên giới, lưu trữ văn thư và thông thương.`,
    });
  };

  // Explicit Tri-Border Alliance: Valoria (#1), Zog-Koth (#2), Ignisia (#3) are 3 allied pillars
  const n1 = byId.get("nation-1")!;
  const n2 = byId.get("nation-2")!;
  const n3 = byId.get("nation-3")!;
  const n201 = byId.get("nation-201")!;
  const n203 = byId.get("nation-203")!;
  pushDip(n1, n2, "ALLIANCE", "Hiệp ước Liên minh Tam Biên Valoria–ZogKoth", 0);
  pushDip(n1, n3, "ALLIANCE", "Hiệp ước Liên minh Tam Biên Valoria–Ignisia", 0);
  pushDip(n2, n3, "ALLIANCE", "Hiệp ước Liên minh Tam Biên ZogKoth–Ignisia", 0);
  pushDip(n1, n201, "FEDERATION", "Hiến chương Bảo trợ Vùng Đệm Lưu Trữ", 350);
  pushDip(n2, n201, "FEDERATION", "Hiến chương Bảo trợ Vùng Đệm Lưu Trữ", 350);
  pushDip(n3, n201, "FEDERATION", "Hiến chương Bảo trợ Vùng Đệm Lưu Trữ", 350);
  pushDip(n201, n203, "ALLIANCE", "Liên hiệp Thư viện & Học viện Tam Biên", 500);

  for (const a of nations) {
    let addedForA = 0;
    for (const nbId of a.neighbors) {
      if (addedForA >= 3) break;
      const b = byId.get(nbId);
      if (!b) continue;
      let status: DiplomacyStatus = "TRADE_PACT";
      if (a.bloc === b.bloc) {
        status = (a.nationNum + b.nationNum) % 3 === 0 ? "FEDERATION" : "ALLIANCE";
      } else if (a.tier === "SPECIAL_ZONE" || b.tier === "SPECIAL_ZONE") {
        status = "NEUTRAL_PACT";
      } else if ((a.nationNum * 7 + b.nationNum * 13) % 9 === 0) {
        status = "DISPUTED";
      } else if ((a.nationNum * 5 + b.nationNum * 11) % 13 === 0) {
        status = "RIVALRY";
      } else {
        status = (a.nationNum + b.nationNum) % 2 === 0 ? "TRADE_PACT" : "NEUTRAL_PACT";
      }

      const title =
        status === "ALLIANCE"
          ? `Hiệp ước Hữu nghị ${a.shortName}–${b.shortName}`
          : status === "FEDERATION"
            ? `Công ước Liên kết ${a.bloc}`
            : status === "TRADE_PACT"
              ? `Hiệp định Thương mại ${a.shortName}–${b.shortName}`
              : status === "NEUTRAL_PACT"
                ? `Thỏa thuận Trung lập Biên giới`
                : status === "DISPUTED"
                  ? `Hồ sơ Tranh chấp Địa giới ${a.shortName}–${b.shortName}`
                  : `Tuyên bố Cạnh tranh Ảnh hưởng Khu vực`;

      pushDip(a, b, status, title, Math.max(a.validFromTick, b.validFromTick));
      addedForA++;
    }
  }

  // Generate 160+ encyclopedic resource & cultural exchange flows
  const resourceFlows: PlanetaryResourceFlow[] = [];
  for (let i = 0; i < nations.length; i += 2) {
    const src = nations[i];
    const targetId = src.neighbors[0];
    if (!targetId) continue;
    const pool = RESOURCE_BY_BIOME[src.biome];
    const resourceName = pool[src.nationNum % pool.length];
    const dependencyPct = 18 + ((src.nationNum * 17) % 58);
    resourceFlows.push({
      id: `res-${resourceFlows.length + 1}`,
      sourceNationId: src.id,
      targetNationId: targetId,
      resourceName,
      volumeLabel: `${(12 + ((src.nationNum * 9) % 85)).toLocaleString("vi-VN")} nghìn tấn/năm`,
      dependencyPct,
    });
  }

  // Generate 24 historic border crossings
  const borderCrossings: PlanetaryBorderCrossing[] = [];
  for (const dip of diplomacy) {
    if (borderCrossings.length >= 24) break;
    if (dip.status !== "DISPUTED" && dip.status !== "TRADE_PACT" && dip.status !== "FEDERATION") {
      continue;
    }
    const a = byId.get(dip.polityAId);
    const b = byId.get(dip.polityBId);
    if (!a || !b) continue;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (dist > 0.11) continue;
    borderCrossings.push({
      id: `bc-${borderCrossings.length + 1}`,
      nationAId: a.id,
      nationBId: b.id,
      x: Number(((a.x + b.x) * 0.5).toFixed(4)),
      y: Number(((a.y + b.y) * 0.5).toFixed(4)),
      label: `Cửa khẩu ${a.shortName}–${b.shortName}`,
      status: dip.status,
      significanceScore: dip.status === "FEDERATION" ? 95 : dip.status === "DISPUTED" ? 88 : 76,
    });
  }

  cachedBundle = {
    planetName: PLANET_NAME,
    circumferenceKm: PLANET_CIRCUMFERENCE_KM,
    canvasWidth: PLANET_CANVAS_WIDTH,
    canvasHeight: PLANET_CANVAS_HEIGHT,
    continents: CONTINENT_MASKS,
    continentLabels: CONTINENT_LABELS,
    regions: PLANETARY_REGIONS,
    nations,
    topoChains: TOPOGRAPHIC_CHAINS,
    volcanoes: VOLCANO_FEATURES,
    chokepoints: STRATEGIC_CHOKEPOINTS,
    routes,
    diplomacy,
    resourceFlows,
    borderCrossings,
    eras: PLANETARY_ERAS,
  };

  return cachedBundle;
}
