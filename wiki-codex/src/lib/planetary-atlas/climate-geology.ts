import type {
  AtlasBiomeId,
  AtlasWikiLens,
  ContinentId,
  DiplomacyStatus,
  PlanetaryChokepoint,
  PlanetaryDiplomacy,
  PlanetaryNation,
  PlanetaryTopoChain,
  PlanetaryVolcano,
  Point2D,
  PolityScaleTier,
} from "./types";

export const PLANET_NAME = "Aethelgard Prime";
export const PLANET_CIRCUMFERENCE_KM = 64000;
export const PLANET_CANVAS_WIDTH = 2400;
export const PLANET_CANVAS_HEIGHT = 1350;

export const BIOME_META: Record<
  AtlasBiomeId,
  { label: string; color: string; baseTempOffsetC: number; baseElevationM: number }
> = {
  TEMPERATE_PLAINS: {
    label: "Đồng bằng Ôn đới",
    color: "#3d8c5c",
    baseTempOffsetC: 0,
    baseElevationM: 220,
  },
  ARID_CANYON: {
    label: "Hẻm núi Khô hạn",
    color: "#b46b3e",
    baseTempOffsetC: 6,
    baseElevationM: 940,
  },
  ASH_VOLCANIC: {
    label: "Cao nguyên Tro & Núi lửa",
    color: "#8f3d38",
    baseTempOffsetC: 8,
    baseElevationM: 1450,
  },
  SAND_DESERT: {
    label: "Sa mạc Cát & Ốc đảo",
    color: "#d1a34b",
    baseTempOffsetC: 11,
    baseElevationM: 480,
  },
  TROPICAL_JUNGLE: {
    label: "Rừng mưa Nhiệt đới",
    color: "#1f7a4c",
    baseTempOffsetC: 7,
    baseElevationM: 180,
  },
  ALPINE_PEAKS: {
    label: "Dãy núi Cao nguyên",
    color: "#6d7f93",
    baseTempOffsetC: -9,
    baseElevationM: 2850,
  },
  GLACIAL_ICE: {
    label: "Băng nguyên Cực địa",
    color: "#76a9cc",
    baseTempOffsetC: -17,
    baseElevationM: 1100,
  },
  CORAL_SEA: {
    label: "Vịnh San hô & Hải cảng",
    color: "#1e7c9c",
    baseTempOffsetC: 3,
    baseElevationM: 35,
  },
  ARCHIPELAGO: {
    label: "Quần đảo Hải dương",
    color: "#2b8a88",
    baseTempOffsetC: 2,
    baseElevationM: 140,
  },
};

export const TIER_META: Record<
  PolityScaleTier,
  { label: string; shortLabel: string; weight: number; lodTier: 0 | 1 | 2 | 3 }
> = {
  IMPERIAL_REALM: {
    label: "Đại Quốc / Liên bang Lục địa",
    shortLabel: "Đại Quốc",
    weight: 0.0022,
    lodTier: 0,
  },
  MAJOR_STATE: {
    label: "Cường quốc Khu vực",
    shortLabel: "Cường quốc",
    weight: 0.00145,
    lodTier: 1,
  },
  REGIONAL_STATE: {
    label: "Quốc gia Khu vực",
    shortLabel: "Quốc gia",
    weight: 0.00095,
    lodTier: 2,
  },
  PRINCIPALITY: {
    label: "Công quốc & Lãnh địa",
    shortLabel: "Công quốc",
    weight: 0.00062,
    lodTier: 3,
  },
  FREE_CITY: {
    label: "Thành bang Tự do",
    shortLabel: "Thành bang",
    weight: 0.00046,
    lodTier: 3,
  },
  SPECIAL_ZONE: {
    label: "Khu Bảo hộ / Đặc khu Học thuật",
    shortLabel: "Đặc khu",
    weight: 0.00052,
    lodTier: 2,
  },
};

export const DIPLOMACY_META: Record<
  DiplomacyStatus,
  { label: string; color: string; shortLabel: string }
> = {
  ALLIANCE: { label: "Đồng minh Hiệp ước", color: "#22c55e", shortLabel: "Đồng minh" },
  FEDERATION: { label: "Liên minh Cộng đồng", color: "#38bdf8", shortLabel: "Liên minh" },
  TRADE_PACT: { label: "Hiệp định Thông thương", color: "#eab308", shortLabel: "Thông thương" },
  NEUTRAL_PACT: { label: "Hiệp ước Trung lập", color: "#94a3b8", shortLabel: "Trung lập" },
  DISPUTED: { label: "Tranh chấp Biên giới", color: "#f97316", shortLabel: "Tranh chấp" },
  RIVALRY: { label: "Đối trọng Địa chính trị", color: "#ef4444", shortLabel: "Đối trọng" },
};

export const CONTINENT_MASKS: Record<Exclude<ContinentId, "OCEANIC">, Point2D[]> = {
  ARCTIC_ICE: [
    { x: 0.14, y: 0.045 },
    { x: 0.28, y: 0.025 },
    { x: 0.49, y: 0.022 },
    { x: 0.72, y: 0.026 },
    { x: 0.87, y: 0.048 },
    { x: 0.85, y: 0.095 },
    { x: 0.72, y: 0.108 },
    { x: 0.54, y: 0.102 },
    { x: 0.36, y: 0.112 },
    { x: 0.19, y: 0.096 },
  ],
  HESPERIA: [
    { x: 0.032, y: 0.165 },
    { x: 0.11, y: 0.132 },
    { x: 0.215, y: 0.148 },
    { x: 0.242, y: 0.245 },
    { x: 0.228, y: 0.385 },
    { x: 0.185, y: 0.485 },
    { x: 0.092, y: 0.498 },
    { x: 0.034, y: 0.425 },
    { x: 0.024, y: 0.285 },
  ],
  OCCIDENTALIS: [
    { x: 0.268, y: 0.162 },
    { x: 0.352, y: 0.138 },
    { x: 0.448, y: 0.168 },
    { x: 0.462, y: 0.295 },
    { x: 0.446, y: 0.442 },
    { x: 0.392, y: 0.525 },
    { x: 0.305, y: 0.515 },
    { x: 0.264, y: 0.415 },
    { x: 0.258, y: 0.265 },
  ],
  AURELIA: [
    { x: 0.482, y: 0.155 },
    { x: 0.592, y: 0.132 },
    { x: 0.718, y: 0.152 },
    { x: 0.758, y: 0.252 },
    { x: 0.752, y: 0.418 },
    { x: 0.715, y: 0.562 },
    { x: 0.618, y: 0.598 },
    { x: 0.518, y: 0.565 },
    { x: 0.478, y: 0.442 },
    { x: 0.474, y: 0.278 },
  ],
  ORIENTIS: [
    { x: 0.778, y: 0.165 },
    { x: 0.878, y: 0.138 },
    { x: 0.962, y: 0.188 },
    { x: 0.976, y: 0.335 },
    { x: 0.962, y: 0.488 },
    { x: 0.892, y: 0.558 },
    { x: 0.805, y: 0.535 },
    { x: 0.772, y: 0.418 },
    { x: 0.772, y: 0.272 },
  ],
  SOLARA: [
    { x: 0.042, y: 0.565 },
    { x: 0.145, y: 0.535 },
    { x: 0.258, y: 0.578 },
    { x: 0.275, y: 0.712 },
    { x: 0.238, y: 0.835 },
    { x: 0.132, y: 0.858 },
    { x: 0.048, y: 0.805 },
    { x: 0.028, y: 0.682 },
  ],
  AUSTRALIS: [
    { x: 0.615, y: 0.642 },
    { x: 0.745, y: 0.618 },
    { x: 0.895, y: 0.638 },
    { x: 0.958, y: 0.728 },
    { x: 0.928, y: 0.842 },
    { x: 0.785, y: 0.865 },
    { x: 0.642, y: 0.838 },
    { x: 0.598, y: 0.735 },
  ],
  ANTARCTIC_ICE: [
    { x: 0.125, y: 0.905 },
    { x: 0.31, y: 0.888 },
    { x: 0.52, y: 0.894 },
    { x: 0.74, y: 0.886 },
    { x: 0.885, y: 0.908 },
    { x: 0.865, y: 0.968 },
    { x: 0.65, y: 0.976 },
    { x: 0.38, y: 0.976 },
    { x: 0.145, y: 0.966 },
  ],
};

export const CONTINENT_LABELS: Array<{
  id: ContinentId;
  name: string;
  subtitle: string;
  x: number;
  y: number;
}> = [
  { id: "ARCTIC_ICE", name: "BẮC CỰC BĂNG NGUYÊN", subtitle: "Vành đai Băng Bắc", x: 0.50, y: 0.068 },
  { id: "HESPERIA", name: "HESPERIA", subtitle: "Tây Bắc Đại Lục", x: 0.132, y: 0.315 },
  { id: "OCCIDENTALIS", name: "OCCIDENTALIS", subtitle: "Lục Địa Phương Tây", x: 0.358, y: 0.332 },
  { id: "AURELIA", name: "AURELIA", subtitle: "Trung Tâm Đại Lục & Tam Biên", x: 0.615, y: 0.355 },
  { id: "ORIENTIS", name: "ORIENTIS", subtitle: "Viễn Đông Cổ Lục", x: 0.874, y: 0.348 },
  { id: "SOLARA", name: "SOLARA", subtitle: "Nam Tây Lục Địa", x: 0.152, y: 0.695 },
  { id: "OCEANIC", name: "HẢI VỰC TRUNG DƯƠNG", subtitle: "Quần đảo & Đảo quốc", x: 0.435, y: 0.715 },
  { id: "AUSTRALIS", name: "AUSTRALIS", subtitle: "Nam Đông Đại Lục", x: 0.778, y: 0.742 },
  { id: "ANTARCTIC_ICE", name: "NAM CỰC LỤC ĐỊA", subtitle: "Vành đai Tuyết Nam", x: 0.50, y: 0.935 },
];

export const TOPOGRAPHIC_CHAINS: PlanetaryTopoChain[] = [
  // Mountain ranges
  {
    id: "mtn-aurelia-spine",
    name: "Dãy Xương Sống Aurelia",
    kind: "MOUNTAIN",
    peakElevationM: 7820,
    points: [
      { x: 0.515, y: 0.195 },
      { x: 0.558, y: 0.255 },
      { x: 0.602, y: 0.315 },
      { x: 0.642, y: 0.398 },
      { x: 0.688, y: 0.495 },
    ],
  },
  {
    id: "mtn-zogkoth-ridge",
    name: "Hoành Sơn Zog-Koth",
    kind: "MOUNTAIN",
    peakElevationM: 6450,
    points: [
      { x: 0.545, y: 0.395 },
      { x: 0.595, y: 0.438 },
      { x: 0.635, y: 0.495 },
      { x: 0.662, y: 0.552 },
    ],
  },
  {
    id: "mtn-occident-crown",
    name: "Dãy Vương Miện Occidentalis",
    kind: "MOUNTAIN",
    peakElevationM: 6910,
    points: [
      { x: 0.295, y: 0.195 },
      { x: 0.342, y: 0.268 },
      { x: 0.388, y: 0.345 },
      { x: 0.422, y: 0.432 },
    ],
  },
  {
    id: "mtn-orient-jade",
    name: "Ngọc Lĩnh Sơn Mạch",
    kind: "MOUNTAIN",
    peakElevationM: 8140,
    points: [
      { x: 0.815, y: 0.185 },
      { x: 0.865, y: 0.248 },
      { x: 0.915, y: 0.335 },
      { x: 0.935, y: 0.445 },
    ],
  },
  {
    id: "mtn-hesperia-wall",
    name: "Trường Thành Hesperia",
    kind: "MOUNTAIN",
    peakElevationM: 6280,
    points: [
      { x: 0.068, y: 0.185 },
      { x: 0.118, y: 0.265 },
      { x: 0.155, y: 0.365 },
      { x: 0.142, y: 0.455 },
    ],
  },
  {
    id: "mtn-solara-andes",
    name: "Dãy Nhật Quang Solara",
    kind: "MOUNTAIN",
    peakElevationM: 7190,
    points: [
      { x: 0.068, y: 0.592 },
      { x: 0.098, y: 0.678 },
      { x: 0.125, y: 0.768 },
      { x: 0.168, y: 0.825 },
    ],
  },
  {
    id: "mtn-australis-crest",
    name: "Dãy Nam Thiên Australis",
    kind: "MOUNTAIN",
    peakElevationM: 6720,
    points: [
      { x: 0.648, y: 0.688 },
      { x: 0.735, y: 0.715 },
      { x: 0.828, y: 0.752 },
      { x: 0.905, y: 0.798 },
    ],
  },
  {
    id: "mtn-polar-trans",
    name: "Sơn Mạch Xuyên Cực Nam",
    kind: "MOUNTAIN",
    peakElevationM: 5480,
    points: [
      { x: 0.24, y: 0.928 },
      { x: 0.46, y: 0.942 },
      { x: 0.71, y: 0.932 },
    ],
  },
  // Major Rivers
  {
    id: "riv-valoria",
    name: "Đại Giang Valoria",
    kind: "RIVER",
    points: [
      { x: 0.545, y: 0.228 },
      { x: 0.575, y: 0.285 },
      { x: 0.598, y: 0.348 },
      { x: 0.582, y: 0.425 },
      { x: 0.548, y: 0.515 },
      { x: 0.518, y: 0.562 },
    ],
  },
  {
    id: "riv-ignisia-ash",
    name: "Sông Hồng Thạch Ignisia",
    kind: "RIVER",
    points: [
      { x: 0.658, y: 0.275 },
      { x: 0.675, y: 0.348 },
      { x: 0.708, y: 0.422 },
      { x: 0.742, y: 0.492 },
    ],
  },
  {
    id: "riv-occident-silver",
    name: "Ngân Hà Occidentalis",
    kind: "RIVER",
    points: [
      { x: 0.345, y: 0.215 },
      { x: 0.362, y: 0.312 },
      { x: 0.352, y: 0.415 },
      { x: 0.325, y: 0.508 },
    ],
  },
  {
    id: "riv-orient-dragon",
    name: "Long Mạch Đại Giang",
    kind: "RIVER",
    points: [
      { x: 0.848, y: 0.225 },
      { x: 0.858, y: 0.325 },
      { x: 0.845, y: 0.435 },
      { x: 0.822, y: 0.528 },
    ],
  },
  {
    id: "riv-hesperia-pine",
    name: "Sông Tùng Bách Hesperia",
    kind: "RIVER",
    points: [
      { x: 0.145, y: 0.185 },
      { x: 0.168, y: 0.285 },
      { x: 0.182, y: 0.388 },
      { x: 0.155, y: 0.478 },
    ],
  },
  {
    id: "riv-solara-emerald",
    name: "Đại Hà Lục Bảo Solara",
    kind: "RIVER",
    points: [
      { x: 0.118, y: 0.625 },
      { x: 0.165, y: 0.668 },
      { x: 0.215, y: 0.718 },
      { x: 0.258, y: 0.768 },
    ],
  },
  {
    id: "riv-australis-opal",
    name: "Sông Opal Australis",
    kind: "RIVER",
    points: [
      { x: 0.785, y: 0.658 },
      { x: 0.745, y: 0.728 },
      { x: 0.695, y: 0.792 },
      { x: 0.648, y: 0.832 },
    ],
  },
  // Ocean currents
  {
    id: "cur-north-gyre",
    name: "Hải lưu Ấm Bắc Trung Dương",
    kind: "CURRENT",
    points: [
      { x: 0.242, y: 0.545 },
      { x: 0.385, y: 0.562 },
      { x: 0.525, y: 0.618 },
      { x: 0.628, y: 0.605 },
    ],
  },
  {
    id: "cur-south-circumpolar",
    name: "Hải lưu Hoàn Cực Nam",
    kind: "CURRENT",
    points: [
      { x: 0.085, y: 0.875 },
      { x: 0.35, y: 0.872 },
      { x: 0.65, y: 0.876 },
      { x: 0.92, y: 0.874 },
    ],
  },
  {
    id: "cur-east-trade",
    name: "Hải lưu Tín Phong Phương Đông",
    kind: "CURRENT",
    points: [
      { x: 0.758, y: 0.585 },
      { x: 0.865, y: 0.592 },
      { x: 0.962, y: 0.605 },
    ],
  },
];

export const VOLCANO_FEATURES: PlanetaryVolcano[] = [
  { id: "vol-ignis", name: "Hỏa Đỉnh Ignis Prime", x: 0.665, y: 0.372, elevationM: 5890 },
  { id: "vol-cinder", name: "Núi lửa Tro Xám Val-Koth", x: 0.612, y: 0.445, elevationM: 4920 },
  { id: "vol-hesperia", name: "Đỉnh Obsidian Bắc", x: 0.085, y: 0.242, elevationM: 4680 },
  { id: "vol-orient", name: "Hỏa Sơn Long Châu", x: 0.935, y: 0.302, elevationM: 5140 },
  { id: "vol-solara", name: "Miệng Lửa Solara", x: 0.095, y: 0.735, elevationM: 5320 },
  { id: "vol-mid-ocean", name: "Đảo Lửa Trung Dương", x: 0.452, y: 0.695, elevationM: 3740 },
];

export const STRATEGIC_CHOKEPOINTS: PlanetaryChokepoint[] = [
  {
    id: "chk-triborder",
    name: "Ngã Ba Tam Biên Valoria–ZogKoth–Ignisia",
    kind: "CROSSING",
    x: 0.608,
    y: 0.378,
    note: "Giao điểm lịch sử nơi ba đại lục địa chính trị của Aurelia hội tụ, đặt Hội đồng Lưu trữ Liên quốc gia.",
  },
  {
    id: "chk-west-strait",
    name: "Eo biển Hesperia–Occidentalis",
    kind: "STRAIT",
    x: 0.252,
    y: 0.312,
    note: "Hành lang hàng hải trọng yếu nối biển Bắc Băng Dương với Hải vực Tây Nam.",
  },
  {
    id: "chk-aurelia-channel",
    name: "Kênh đào Trung Hải Aurelia",
    kind: "CANAL",
    x: 0.468,
    y: 0.345,
    note: "Tuyến hàng hải rút ngắn 4.200 km giao thương giữa Occidentalis và Trung tâm Aurelia.",
  },
  {
    id: "chk-orient-strait",
    name: "Eo biển Ngọc Bích",
    kind: "STRAIT",
    x: 0.764,
    y: 0.355,
    note: "Cửa ngõ nối các thương cảng Viễn Đông Orientis với Aurelia.",
  },
  {
    id: "chk-solara-pass",
    name: "Đèo Nhật Quang",
    kind: "PASS",
    x: 0.145,
    y: 0.675,
    note: "Đèo núi cao xuyên qua dãy Solara nối đồng bằng ven biển với cao nguyên nội địa.",
  },
  {
    id: "chk-austral-gate",
    name: "Eo biển Nam Dương",
    kind: "STRAIT",
    x: 0.585,
    y: 0.635,
    note: "Giao lộ hải hành giữa Quần đảo Trung Dương và lục địa Australis.",
  },
  {
    id: "chk-north-passage",
    name: "Hành lang Băng Bắc Cực",
    kind: "STRAIT",
    x: 0.482,
    y: 0.118,
    note: "Tuyến thám hiểm mùa hè chỉ mở băng khoảng 4 tháng mỗi năm.",
  },
  {
    id: "chk-south-passage",
    name: "Cửa ngõ Nam Cực",
    kind: "STRAIT",
    x: 0.735,
    y: 0.878,
    note: "Trạm trung chuyển các đoàn khảo sát khí hậu tiến vào lục địa Nam Cực.",
  },
];

export function formatLatLon(x: number, y: number): { latLabel: string; lonLabel: string } {
  const latDeg = (0.5 - y) * 180;
  const lonDeg = (x - 0.5) * 360;
  const latDir = latDeg >= 0 ? "B" : "N";
  const lonDir = lonDeg >= 0 ? "Đ" : "T";
  return {
    latLabel: `${Math.abs(latDeg).toFixed(1)}°${latDir}`,
    lonLabel: `${Math.abs(lonDeg).toFixed(1)}°${lonDir}`,
  };
}

export function computeElevationMeters(x: number, y: number, biome: AtlasBiomeId): number {
  const meta = BIOME_META[biome];
  let mountainBonus = 0;
  for (const chain of TOPOGRAPHIC_CHAINS) {
    if (chain.kind !== "MOUNTAIN") continue;
    for (const pt of chain.points) {
      const dist = Math.hypot(x - pt.x, y - pt.y);
      if (dist < 0.055) {
        mountainBonus = Math.max(mountainBonus, (1 - dist / 0.055) * 2100);
      }
    }
  }
  const wave = Math.sin(x * 37.3 + y * 19.7) * 110 + Math.cos(x * 23.1 - y * 41.2) * 85;
  return Math.max(12, Math.round(meta.baseElevationM + mountainBonus + wave));
}

export function computeLatitudeTemperatureC(
  x: number,
  y: number,
  biome: AtlasBiomeId,
  elevationM: number,
): number {
  const latNorm = Math.abs(y - 0.5) * 2; // 0 at equator, 1 at poles
  const solarBaseC = 31 - latNorm * 52;
  const lapseRateC = -(elevationM / 1000) * 6.2;
  const biomeOffset = BIOME_META[biome].baseTempOffsetC * 0.45;
  const coastalMod = Math.sin(x * 14.5 + y * 9.3) * 1.8;
  return Number((solarBaseC + lapseRateC + biomeOffset + coastalMod).toFixed(1));
}

export function resolveNationLensColor(
  nation: PlanetaryNation,
  lens: AtlasWikiLens,
  options?: {
    selectedNationId?: string | null;
    diplomacy?: PlanetaryDiplomacy[];
  },
): string {
  switch (lens) {
    case "POLITICAL":
      return nation.color;
    case "BIOME":
      return BIOME_META[nation.biome].color;
    case "TERRAIN": {
      const el = nation.elevationM;
      if (el < 180) return "#2f7d57";
      if (el < 550) return "#639a52";
      if (el < 1200) return "#b8a056";
      if (el < 2200) return "#9c6d49";
      if (el < 3200) return "#7c726c";
      return "#cbd5e1";
    }
    case "CLIMATE": {
      const t = nation.avgTempC;
      if (t <= -10) return "#3b82f6";
      if (t <= 0) return "#38bdf8";
      if (t <= 10) return "#2dd4bf";
      if (t <= 18) return "#4ade80";
      if (t <= 25) return "#facc15";
      if (t <= 31) return "#fb923c";
      return "#ef4444";
    }
    case "DEMOGRAPHICS": {
      const popM = nation.population / 1_000_000;
      if (popM >= 80) return "#7c3aed";
      if (popM >= 35) return "#9333ea";
      if (popM >= 15) return "#c026d3";
      if (popM >= 5) return "#e879f9";
      if (popM >= 1.5) return "#f0abfc";
      return "#fae8ff";
    }
    case "DIPLOMACY": {
      const selId = options?.selectedNationId;
      if (!selId) {
        if (nation.isTriBorder) return "#f59e0b";
        return nation.color;
      }
      if (nation.id === selId) return "#f8fafc";
      const rel = options?.diplomacy?.find(
        (d) =>
          (d.polityAId === selId && d.polityBId === nation.id) ||
          (d.polityBId === selId && d.polityAId === nation.id),
      );
      if (!rel) return "#334155";
      return DIPLOMACY_META[rel.status].color;
    }
    case "RESOURCES": {
      const map: Record<AtlasBiomeId, string> = {
        TEMPERATE_PLAINS: "#84cc16",
        ARID_CANYON: "#d97706",
        ASH_VOLCANIC: "#dc2626",
        SAND_DESERT: "#eab308",
        TROPICAL_JUNGLE: "#10b981",
        ALPINE_PEAKS: "#64748b",
        GLACIAL_ICE: "#06b6d4",
        CORAL_SEA: "#0284c7",
        ARCHIPELAGO: "#14b8a6",
      };
      return map[nation.biome];
    }
  }
}

export interface ExpeditionTravelReport {
  totalKm: number;
  footDays: number;
  caravanDays: number;
  sailingDays: number;
  airshipHours: number;
  waypointElevationsM: number[];
  avgTempC: number;
}

export function computeExpeditionTravel(
  points: Point2D[],
  circumferenceKm = PLANET_CIRCUMFERENCE_KM,
): ExpeditionTravelReport {
  if (points.length < 2) {
    return {
      totalKm: 0,
      footDays: 0,
      caravanDays: 0,
      sailingDays: 0,
      airshipHours: 0,
      waypointElevationsM: points.map((p) => computeElevationMeters(p.x, p.y, "TEMPERATE_PLAINS")),
      avgTempC: 15,
    };
  }

  let totalKm = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dxKm = (b.x - a.x) * circumferenceKm;
    const dyKm = (b.y - a.y) * (circumferenceKm * 0.5);
    totalKm += Math.hypot(dxKm, dyKm);
  }

  const waypointElevationsM = points.map((p) =>
    computeElevationMeters(p.x, p.y, "TEMPERATE_PLAINS"),
  );
  const avgTempC = Number(
    (
      points.reduce(
        (sum, p, idx) =>
          sum + computeLatitudeTemperatureC(p.x, p.y, "TEMPERATE_PLAINS", waypointElevationsM[idx]),
        0,
      ) / points.length
    ).toFixed(1),
  );

  return {
    totalKm: Math.round(totalKm),
    footDays: Number((totalKm / 30).toFixed(1)),
    caravanDays: Number((totalKm / 65).toFixed(1)),
    sailingDays: Number((totalKm / 180).toFixed(1)),
    airshipHours: Number((totalKm / 145).toFixed(1)),
    waypointElevationsM,
    avgTempC,
  };
}

export interface ElevationProfilePoint {
  distKm: number;
  elevationM: number;
  tempC: number;
  x: number;
  y: number;
}

/**
 * Samples N evenly spaced points along a multi-waypoint route to draw
 * an encyclopedic Elevation Cross-Section Profile chart.
 */
export function sampleRouteElevationProfile(
  points: Point2D[],
  samples = 24,
  circumferenceKm = PLANET_CIRCUMFERENCE_KM,
): ElevationProfilePoint[] {
  if (points.length < 2 || samples < 2) return [];

  const segLengths: number[] = [];
  let totalKm = 0;
  for (let i = 1; i < points.length; i++) {
    const dxKm = (points[i].x - points[i - 1].x) * circumferenceKm;
    const dyKm = (points[i].y - points[i - 1].y) * (circumferenceKm * 0.5);
    const len = Math.hypot(dxKm, dyKm);
    segLengths.push(len);
    totalKm += len;
  }
  if (totalKm <= 0) return [];

  const out: ElevationProfilePoint[] = [];
  for (let s = 0; s < samples; s++) {
    const targetKm = (s / (samples - 1)) * totalKm;
    let acc = 0;
    let segIdx = 0;
    while (segIdx < segLengths.length - 1 && acc + segLengths[segIdx] < targetKm) {
      acc += segLengths[segIdx];
      segIdx++;
    }
    const segLen = Math.max(1e-6, segLengths[segIdx]);
    const t = Math.max(0, Math.min(1, (targetKm - acc) / segLen));
    const a = points[segIdx];
    const b = points[segIdx + 1];
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const elevationM = computeElevationMeters(x, y, "TEMPERATE_PLAINS");
    const tempC = computeLatitudeTemperatureC(x, y, "TEMPERATE_PLAINS", elevationM);
    out.push({
      distKm: Math.round(targetKm),
      elevationM,
      tempC,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
    });
  }
  return out;
}

export interface ShortestNationPathResult {
  nationIds: string[];
  totalKm: number;
  hopCount: number;
}

export function findShortestNationPath(
  nations: PlanetaryNation[],
  startId: string,
  endId: string,
  circumferenceKm = PLANET_CIRCUMFERENCE_KM,
): ShortestNationPathResult | null {
  if (startId === endId) {
    return { nationIds: [startId], totalKm: 0, hopCount: 0 };
  }
  const byId = new Map<string, PlanetaryNation>();
  for (const n of nations) byId.set(n.id, n);
  if (!byId.has(startId) || !byId.has(endId)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  const visited = new Set<string>();

  for (const n of nations) {
    dist.set(n.id, Number.POSITIVE_INFINITY);
    prev.set(n.id, null);
  }
  dist.set(startId, 0);

  while (visited.size < nations.length) {
    let currentId: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    for (const [id, d] of dist.entries()) {
      if (!visited.has(id) && d < best) {
        best = d;
        currentId = id;
      }
    }
    if (!currentId || best === Number.POSITIVE_INFINITY) break;
    if (currentId === endId) break;
    visited.add(currentId);

    const cur = byId.get(currentId)!;
    for (const nbId of cur.neighbors) {
      if (visited.has(nbId)) continue;
      const nb = byId.get(nbId);
      if (!nb) continue;
      const dxKm = (nb.x - cur.x) * circumferenceKm;
      const dyKm = (nb.y - cur.y) * (circumferenceKm * 0.5);
      const edgeKm = Math.hypot(dxKm, dyKm);
      const alt = best + edgeKm;
      if (alt < (dist.get(nbId) ?? Number.POSITIVE_INFINITY)) {
        dist.set(nbId, alt);
        prev.set(nbId, currentId);
      }
    }
  }

  const finalDist = dist.get(endId) ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(finalDist)) return null;

  const path: string[] = [];
  let cursor: string | null = endId;
  while (cursor) {
    path.push(cursor);
    cursor = prev.get(cursor) ?? null;
  }
  path.reverse();
  if (path[0] !== startId) return null;

  return {
    nationIds: path,
    totalKm: Math.round(finalDist),
    hopCount: Math.max(0, path.length - 1),
  };
}
