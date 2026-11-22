import type {
  AtlasBiomeId,
  ContinentId,
  PlanetaryRegionDef,
  Point2D,
  PolityScaleTier,
} from "./types";

export interface NationSeed {
  nationNum: number;
  name: string;
  shortName: string;
  capital: string;
  tier: PolityScaleTier;
  regionCode: string;
  bloc: string;
  biome: AtlasBiomeId;
  color: string;
  governmentType: string;
  primaryLanguage: string;
  foundingEra: string;
  validFromTick: number;
  validToTick: number;
  isTriBorder?: boolean;
  fixedPos?: Point2D;
  summary: string;
}

export const PLANETARY_REGIONS: PlanetaryRegionDef[] = [
  // AURELIA (7 regions)
  { code: "A1", name: "Tam Biên Trung Tâm Aurelia", continent: "AURELIA", minX: 0.545, maxX: 0.675, minY: 0.305, maxY: 0.445, defaultBiome: "TEMPERATE_PLAINS" },
  { code: "A2", name: "Bắc Đồng Bằng Aurelia", continent: "AURELIA", minX: 0.495, maxX: 0.635, minY: 0.165, maxY: 0.295, defaultBiome: "TEMPERATE_PLAINS" },
  { code: "A3", name: "Cao Nguyên Tây Aurelia", continent: "AURELIA", minX: 0.488, maxX: 0.565, minY: 0.305, maxY: 0.495, defaultBiome: "ALPINE_PEAKS" },
  { code: "A4", name: "Vành Đai Hỏa Sơn Đông Aurelia", continent: "AURELIA", minX: 0.655, maxX: 0.742, minY: 0.215, maxY: 0.445, defaultBiome: "ASH_VOLCANIC" },
  { code: "A5", name: "Bình Nguyên Nam Aurelia", continent: "AURELIA", minX: 0.535, maxX: 0.695, minY: 0.455, maxY: 0.565, defaultBiome: "ARID_CANYON" },
  { code: "A6", name: "Duyên Hải Vịnh San Hô", continent: "AURELIA", minX: 0.642, maxX: 0.732, minY: 0.445, maxY: 0.545, defaultBiome: "CORAL_SEA" },
  { code: "A7", name: "Sơn Cước Đông Bắc Aurelia", continent: "AURELIA", minX: 0.632, maxX: 0.732, minY: 0.162, maxY: 0.245, defaultBiome: "ALPINE_PEAKS" },

  // OCCIDENTALIS (4 regions)
  { code: "B1", name: "Vương Miện Bắc Occidentalis", continent: "OCCIDENTALIS", minX: 0.285, maxX: 0.432, minY: 0.168, maxY: 0.285, defaultBiome: "ALPINE_PEAKS" },
  { code: "B2", name: "Lưu Vực Ngân Hà Tây", continent: "OCCIDENTALIS", minX: 0.278, maxX: 0.438, minY: 0.292, maxY: 0.405, defaultBiome: "TEMPERATE_PLAINS" },
  { code: "B3", name: "Hẻm Núi Tây Nam Occidentalis", continent: "OCCIDENTALIS", minX: 0.282, maxX: 0.378, minY: 0.408, maxY: 0.502, defaultBiome: "ARID_CANYON" },
  { code: "B4", name: "Thương Cảng Đông Nam Occidentalis", continent: "OCCIDENTALIS", minX: 0.375, maxX: 0.442, minY: 0.405, maxY: 0.505, defaultBiome: "CORAL_SEA" },

  // ORIENTIS (3 regions)
  { code: "C1", name: "Ngọc Lĩnh Bắc Orientis", continent: "ORIENTIS", minX: 0.792, maxX: 0.945, minY: 0.168, maxY: 0.298, defaultBiome: "ALPINE_PEAKS" },
  { code: "C2", name: "Long Mạch Trung Châu", continent: "ORIENTIS", minX: 0.788, maxX: 0.955, minY: 0.305, maxY: 0.428, defaultBiome: "TEMPERATE_PLAINS" },
  { code: "C3", name: "Duyên Hải Nam Orientis", continent: "ORIENTIS", minX: 0.795, maxX: 0.935, minY: 0.432, maxY: 0.535, defaultBiome: "TROPICAL_JUNGLE" },

  // POLAR (2 regions)
  { code: "D", name: "Vành Đai Băng Bắc Cực", continent: "ARCTIC_ICE", minX: 0.195, maxX: 0.825, minY: 0.038, maxY: 0.095, defaultBiome: "GLACIAL_ICE" },
  { code: "E", name: "Lục Địa Tuyết Nam Cực", continent: "ANTARCTIC_ICE", minX: 0.185, maxX: 0.835, minY: 0.905, maxY: 0.962, defaultBiome: "GLACIAL_ICE" },

  // OCEANIC (2 regions)
  { code: "F", name: "Quần Đảo Trung Dương", continent: "OCEANIC", minX: 0.312, maxX: 0.568, minY: 0.585, maxY: 0.825, defaultBiome: "ARCHIPELAGO" },
  { code: "J1", name: "Vành Đai Đảo Quốc Ngoại Vi", continent: "OCEANIC", minX: 0.292, maxX: 0.588, minY: 0.558, maxY: 0.862, defaultBiome: "CORAL_SEA" },

  // AUSTRALIS (2 regions)
  { code: "G1", name: "Cao Nguyên Opal Tây Australis", continent: "AUSTRALIS", minX: 0.628, maxX: 0.785, minY: 0.648, maxY: 0.835, defaultBiome: "SAND_DESERT" },
  { code: "G2", name: "Duyên Hải Nam Thiên Australis", continent: "AUSTRALIS", minX: 0.788, maxX: 0.935, minY: 0.652, maxY: 0.838, defaultBiome: "TEMPERATE_PLAINS" },

  // HESPERIA (2 regions)
  { code: "H1", name: "Rừng Tùng Bắc Hesperia", continent: "HESPERIA", minX: 0.048, maxX: 0.215, minY: 0.158, maxY: 0.318, defaultBiome: "ALPINE_PEAKS" },
  { code: "H2", name: "Bình Nguyên Tây Hesperia", continent: "HESPERIA", minX: 0.046, maxX: 0.208, minY: 0.322, maxY: 0.472, defaultBiome: "TEMPERATE_PLAINS" },

  // SOLARA (2 regions)
  { code: "I1", name: "Lưu Vực Lục Bảo Bắc Solara", continent: "SOLARA", minX: 0.052, maxX: 0.248, minY: 0.565, maxY: 0.705, defaultBiome: "TROPICAL_JUNGLE" },
  { code: "I2", name: "Sa Mạc & Ốc Đảo Nam Solara", continent: "SOLARA", minX: 0.055, maxX: 0.238, minY: 0.712, maxY: 0.835, defaultBiome: "SAND_DESERT" },

  // SPECIAL ARCHIVAL & INTERCONTINENTAL ZONES
  { code: "J2", name: "Đặc Khu Lưu Trữ & Học Viện Liên Lục Địa", continent: "OCEANIC", minX: 0.345, maxX: 0.545, minY: 0.605, maxY: 0.795, defaultBiome: "ARCHIPELAGO" },
];

/**
 * Bespoke Tri-Border polygons sharing exact intersection vertex (0.608, 0.378)
 * inside central Aurelia (A1).
 */
export const BESPOKE_TRIBORDER_POLYGONS: Record<number, Point2D[]> = {
  // #1 Valoria (NW of Tri-Border)
  1: [
    { x: 0.556, y: 0.312 },
    { x: 0.618, y: 0.308 },
    { x: 0.632, y: 0.345 },
    { x: 0.608, y: 0.378 },
    { x: 0.576, y: 0.376 },
    { x: 0.552, y: 0.348 },
  ],
  // #2 Zog-Koth (SW of Tri-Border)
  2: [
    { x: 0.552, y: 0.378 },
    { x: 0.576, y: 0.376 },
    { x: 0.608, y: 0.378 },
    { x: 0.616, y: 0.422 },
    { x: 0.585, y: 0.442 },
    { x: 0.548, y: 0.425 },
  ],
  // #3 Ignisia (East of Tri-Border)
  3: [
    { x: 0.632, y: 0.345 },
    { x: 0.672, y: 0.335 },
    { x: 0.684, y: 0.382 },
    { x: 0.665, y: 0.425 },
    { x: 0.616, y: 0.422 },
    { x: 0.608, y: 0.378 },
  ],
  // #201 Vùng Đệm Tam Biên (Neutral Archival Strip north of junction)
  201: [
    { x: 0.598, y: 0.368 },
    { x: 0.616, y: 0.366 },
    { x: 0.618, y: 0.378 },
    { x: 0.608, y: 0.378 },
    { x: 0.596, y: 0.376 },
  ],
  // #203 Học Viện Ngã Ba Tam Biên (South-east micro-enclave at junction)
  203: [
    { x: 0.608, y: 0.378 },
    { x: 0.622, y: 0.378 },
    { x: 0.621, y: 0.391 },
    { x: 0.609, y: 0.391 },
  ],
};

const CORE_HANDCRAFTED_NATIONS: NationSeed[] = [
  {
    nationNum: 1,
    name: "Liên bang Hoàng gia Valoria",
    shortName: "Valoria",
    capital: "Aurelion Prime",
    tier: "IMPERIAL_REALM",
    regionCode: "A1",
    bloc: "Liên minh Tam Biên Aurelia",
    biome: "TEMPERATE_PLAINS",
    color: "#3b82f6",
    governmentType: "Quân chủ Lập hiến Liên bang",
    primaryLanguage: "Tiếng Valorian Cổ",
    foundingEra: "Kỷ Nguyên Khai Sáng (-1240)",
    validFromTick: 0,
    validToTick: 1000,
    isTriBorder: true,
    fixedPos: { x: 0.588, y: 0.344 },
    summary: "Quốc gia trung tâm phía Tây Bắc vùng Tam Biên Aurelia, là một trong ba trụ cột sáng lập Liên minh Tam Biên cùng Zog-Koth và Ignisia, nổi tiếng với mạng lưới thư viện hoàng gia và bộ luật dân sự.",
  },
  {
    nationNum: 2,
    name: "Liên minh Hẻm núi Zog-Koth",
    shortName: "Zog-Koth",
    capital: "Koth-Varr",
    tier: "IMPERIAL_REALM",
    regionCode: "A1",
    bloc: "Liên minh Tam Biên Aurelia",
    biome: "ARID_CANYON",
    color: "#ea580c",
    governmentType: "Hội đồng Bộ lạc & Công xã",
    primaryLanguage: "Tiếng Kothric",
    foundingEra: "Kỷ Nguyên Đá Đỏ (-980)",
    validFromTick: 0,
    validToTick: 1000,
    isTriBorder: true,
    fixedPos: { x: 0.582, y: 0.408 },
    summary: "Cường quốc hẻm núi phía Tây Nam Tam Biên và đồng minh chiến lược của Valoria cùng Ignisia trong Liên minh Tam Biên, nơi kiến trúc đục vào vách đá bazan kết nối các tuyến thương đoàn xuyên cao nguyên.",
  },
  {
    nationNum: 3,
    name: "Đế chế Hỏa Sơn Ignisia",
    shortName: "Ignisia",
    capital: "Cinderhold",
    tier: "IMPERIAL_REALM",
    regionCode: "A1",
    bloc: "Liên minh Tam Biên Aurelia",
    biome: "ASH_VOLCANIC",
    color: "#dc2626",
    governmentType: "Nguyên lão viện Địa nhiệt",
    primaryLanguage: "Tiếng Ignic",
    foundingEra: "Kỷ Nguyên Luyện Kim (-1120)",
    validFromTick: 0,
    validToTick: 1000,
    isTriBorder: true,
    fixedPos: { x: 0.648, y: 0.382 },
    summary: "Đế chế địa nhiệt phía Đông Tam Biên, đồng minh gắn kết với Valoria và Zog-Koth trong Liên minh Tam Biên, tiên phong trong luyện kim thủy tinh núi lửa và kỹ thuật địa nhiệt đô thị.",
  },
  {
    nationNum: 4,
    name: "Cộng hòa Ngân Hà Occidentia",
    shortName: "Occidentia",
    capital: "Argentum",
    tier: "IMPERIAL_REALM",
    regionCode: "B2",
    bloc: "Liên bang Phương Tây",
    biome: "TEMPERATE_PLAINS",
    color: "#6366f1",
    governmentType: "Cộng hòa Nghị viện",
    primaryLanguage: "Tiếng Occident",
    foundingEra: "Kỷ Nguyên Thương Mại (-840)",
    validFromTick: 0,
    validToTick: 1000,
    fixedPos: { x: 0.358, y: 0.342 },
    summary: "Trung tâm tài chính, thiên văn học và hàng hải của lục địa Occidentalis, quản lý các tuyến thương mại xuyên Eo biển Tây.",
  },
  {
    nationNum: 5,
    name: "Thiên Triều Ngọc Lĩnh",
    shortName: "Ngọc Lĩnh",
    capital: "Thiên Đô",
    tier: "IMPERIAL_REALM",
    regionCode: "C2",
    bloc: "Khối Viễn Đông Cổ",
    biome: "TEMPERATE_PLAINS",
    color: "#10b981",
    governmentType: "Đế chế Hành chính Khoa cử",
    primaryLanguage: "Tiếng Đông Hoa Cổ",
    foundingEra: "Kỷ Nguyên Cổ Điển (-1520)",
    validFromTick: 0,
    validToTick: 1000,
    fixedPos: { x: 0.865, y: 0.358 },
    summary: "Nền văn minh lâu đời bậc nhất lục địa Orientis, nổi danh với hệ thống đê điều Long Mạch, nghề gốm men ngọc và sử ký biên niên liên tục hơn 2.500 năm.",
  },
  {
    nationNum: 6,
    name: "Liên bang Tùng Bách Hesperia",
    shortName: "Hesperia",
    capital: "Sylvanreach",
    tier: "IMPERIAL_REALM",
    regionCode: "H2",
    bloc: "Khối Tây Bắc Hải",
    biome: "TEMPERATE_PLAINS",
    color: "#14b8a6",
    governmentType: "Liên bang Tỉnh trị",
    primaryLanguage: "Tiếng Hesperic",
    foundingEra: "Kỷ Nguyên Khai Phá (-620)",
    validFromTick: 120,
    validToTick: 1000,
    fixedPos: { x: 0.132, y: 0.382 },
    summary: "Đại quốc rừng ôn đới và cảng nước sâu tại lục địa Hesperia, nơi đặt các xưởng đóng tàu viễn dương lớn nhất bán cầu Tây.",
  },
  {
    nationNum: 7,
    name: "Vương quốc Lục Bảo Solara",
    shortName: "Solara",
    capital: "Heliopolis",
    tier: "IMPERIAL_REALM",
    regionCode: "I1",
    bloc: "Liên minh Xích Đạo Solara",
    biome: "TROPICAL_JUNGLE",
    color: "#eab308",
    governmentType: "Quân chủ Nghị viện",
    primaryLanguage: "Tiếng Solari",
    foundingEra: "Kỷ Nguyên Mặt Trời (-1050)",
    validFromTick: 0,
    validToTick: 1000,
    fixedPos: { x: 0.155, y: 0.635 },
    summary: "Vương quốc nhiệt đới và nông học hàng đầu Solara, sở hữu các vườn thực vật cổ đại và đài quan sát nhật thực nổi tiếng khắp hành tinh.",
  },
  {
    nationNum: 8,
    name: "Liên bang Nam Thiên Australis",
    shortName: "Australis",
    capital: "Opalia",
    tier: "IMPERIAL_REALM",
    regionCode: "G2",
    bloc: "Khối Nam Bán Cầu",
    biome: "TEMPERATE_PLAINS",
    color: "#8b5cf6",
    governmentType: "Cộng hòa Liên bang",
    primaryLanguage: "Tiếng Austral",
    foundingEra: "Kỷ Nguyên Hải Trình (-410)",
    validFromTick: 180,
    validToTick: 1000,
    fixedPos: { x: 0.855, y: 0.742 },
    summary: "Đại quốc trẻ năng động ở bán cầu Nam, dẫn đầu về địa chất khoáng sản opal, khí tượng học đại dương và hàng hải Nam Cực.",
  },
  {
    nationNum: 9,
    name: "Liên minh Quần đảo Trung Dương",
    shortName: "Trung Dương",
    capital: "Pelagia",
    tier: "MAJOR_STATE",
    regionCode: "F",
    bloc: "Hải Hiệp Trung Dương",
    biome: "ARCHIPELAGO",
    color: "#06b6d4",
    governmentType: "Liên minh Đô thị Hải cảng",
    primaryLanguage: "Tiếng Pelagic",
    foundingEra: "Kỷ Nguyên Hải Trình (-530)",
    validFromTick: 0,
    validToTick: 1000,
    fixedPos: { x: 0.432, y: 0.695 },
    summary: "Liên minh hàng trăm đảo san hô ở giữa đại dương, giữ vai trò trạm trung chuyển hải đồ và bưu chính hàng hải toàn cầu.",
  },
  {
    nationNum: 10,
    name: "Cộng hòa Băng Đảo Borealis",
    shortName: "Borealis",
    capital: "Frosthaven",
    tier: "MAJOR_STATE",
    regionCode: "D",
    bloc: "Hội đồng Bắc Cực",
    biome: "GLACIAL_ICE",
    color: "#38bdf8",
    governmentType: "Hội đồng Dân biểu Băng nguyên",
    primaryLanguage: "Tiếng Boreal",
    foundingEra: "Kỷ Nguyên Cực Quang (-320)",
    validFromTick: 0,
    validToTick: 1000,
    fixedPos: { x: 0.485, y: 0.062 },
    summary: "Quốc gia cực Bắc chuyên nghiên cứu băng hà học, địa từ trường cực quang và bảo tồn hệ sinh thái vùng băng vĩnh cửu.",
  },
  {
    nationNum: 201,
    name: "Vùng Đệm Lưu Trữ Tam Biên",
    shortName: "Đệm Tam Biên",
    capital: "Concordia Spire",
    tier: "SPECIAL_ZONE",
    regionCode: "A1",
    bloc: "Trung lập Liên quốc gia",
    biome: "TEMPERATE_PLAINS",
    color: "#f59e0b",
    governmentType: "Ủy ban Quản trị Ba bên",
    primaryLanguage: "Đa ngữ (Valorian / Kothric / Ignic)",
    foundingEra: "Hiệp ước Tam Biên (Năm 412)",
    validFromTick: 350,
    validToTick: 1000,
    isTriBorder: true,
    fixedPos: { x: 0.608, y: 0.373 },
    summary: "Hành lang ngoại giao trung lập nằm đúng trên ranh giới ba cường quốc Valoria, Zog-Koth và Ignisia, nơi lưu giữ bản gốc các hiệp ước hòa bình.",
  },
  {
    nationNum: 203,
    name: "Học Viện Ngã Ba Tam Biên",
    shortName: "Học Viện Tam Biên",
    capital: "Tri-Nexus Hall",
    tier: "SPECIAL_ZONE",
    regionCode: "A1",
    bloc: "Trung lập Liên quốc gia",
    biome: "TEMPERATE_PLAINS",
    color: "#fbbf24",
    governmentType: "Hội đồng Học giả Tự trị",
    primaryLanguage: "Tiếng Hàn Lâm Chung",
    foundingEra: "Kỷ Nguyên Bách Khoa (Năm 580)",
    validFromTick: 500,
    validToTick: 1000,
    isTriBorder: true,
    fixedPos: { x: 0.614, y: 0.384 },
    summary: "Đặc khu học thuật tự trị rộng chỉ vài chục km² nhưng quy tụ hơn 40.000 sử gia, bản đồ học và nhà ngôn ngữ học từ khắp 360 quốc gia.",
  },
];

interface RegionGeneratorProfile {
  regionCode: string;
  count: number;
  bloc: string;
  biomes: AtlasBiomeId[];
  palette: string[];
  prefixes: string[];
  roots: string[];
  capitals: string[];
  languages: string[];
  governments: string[];
  eras: string[];
}

const REGION_PROFILES: RegionGeneratorProfile[] = [
  {
    regionCode: "A1",
    count: 10,
    bloc: "Khối Hiệp ước Aurelia",
    biomes: ["TEMPERATE_PLAINS", "ARID_CANYON", "ASH_VOLCANIC"],
    palette: ["#60a5fa", "#3b82f6", "#f97316", "#ef4444", "#fb923c", "#38bdf8"],
    prefixes: ["Công quốc", "Thành bang", "Tỉnh tự trị", "Hầu quốc", "Quận liên hiệp"],
    roots: ["Valen", "Kothar", "Pyros", "Aurelan", "Meridia", "Vespera", "Caldria", "Solis", "Drakmor", "Thalor", "Lumina", "Brevia", "Cindrel", "Orvath"],
    capitals: ["Valenport", "Koth-Min", "Pyreia", "Meridion", "Vespertine", "Calder", "Solgate", "Drakspire", "Thalburg", "Lumis", "Brevon", "Cindria", "Orvan", "Nexia"],
    languages: ["Valorian", "Kothric", "Ignic", "Trung Aurelian"],
    governments: ["Hội đồng Dân biểu", "Công quốc Lập hiến", "Thành bang Thương mại", "Quận Tự trị"],
    eras: ["Kỷ Nguyên Khai Sáng (-780)", "Kỷ Nguyên Hiệp Ước (210)", "Kỷ Nguyên Đô Thị (440)"],
  },
  {
    regionCode: "A2",
    count: 20,
    bloc: "Khối Hiệp ước Aurelia",
    biomes: ["TEMPERATE_PLAINS", "ALPINE_PEAKS"],
    palette: ["#2563eb", "#0284c7", "#0ea5e9", "#4f46e5", "#3b82f6", "#1d4ed8"],
    prefixes: ["Vương quốc", "Công quốc", "Cộng hòa", "Lãnh địa", "Liên xã"],
    roots: ["Nordval", "Alder", "Bramble", "Corvus", "Dunmore", "Elden", "Fairholt", "Grevia", "Haldor", "Iverna", "Jorvik", "Kestrel", "Linden", "Morwen", "Norwich", "Oakhaven", "Pembrok", "Quinlan", "Ravens", "Stirling", "Tarn", "Ulster", "Verden", "Wexford"],
    capitals: ["Nordheim", "Alderford", "Bramton", "Corvium", "Dunport", "Eldenkeep", "Fairview", "Greven", "Halstead", "Iver", "Jorstad", "Kestrelia", "Lindholm", "Morport", "Norhaven", "Oakspire", "Pembridge", "Quinhold", "Ravenna", "Stirberg", "Tarnis", "Ulburg", "Verdena", "Wexia"],
    languages: ["Bắc Valorian", "Tiếng Alder", "Tiếng Cổ Aurelia"],
    governments: ["Quân chủ Lập hiến", "Cộng hòa Nghị viện", "Công quốc Lập hiến", "Liên minh Đô thị"],
    eras: ["Kỷ Nguyên Nông Nghiệp (-920)", "Kỷ Nguyên Khai Sáng (-540)", "Kỷ Nguyên Phục Hưng (180)"],
  },
  {
    regionCode: "A3",
    count: 14,
    bloc: "Liên hiệp Cao nguyên Nam",
    biomes: ["ALPINE_PEAKS", "TEMPERATE_PLAINS"],
    palette: ["#64748b", "#475569", "#0f766e", "#3b82f6", "#6366f1"],
    prefixes: ["Bang Cao nguyên", "Công quốc Sơn cước", "Cộng hòa", "Thung lũng tự trị"],
    roots: ["Alpen", "Boulden", "Cragmore", "Dorn", "Eiger", "Felsen", "Granita", "Hohen", "Karst", "Ledge", "Montis", "Nivalis", "Ortel", "Pinnacle", "Quarria", "Riftia"],
    capitals: ["Alpenburg", "Boulderia", "Craghold", "Dornstadt", "Eigerdorf", "Felsheim", "Granit", "Hohenberg", "Karsten", "Ledgemont", "Montclair", "Nivara", "Ortelia", "Pinnis", "Quarr", "Riftport"],
    languages: ["Sơn ngữ Aurelia", "Tiếng Karstic", "Valorian Tây"],
    governments: ["Hội đồng Thung lũng", "Liên bang Bang trị", "Cộng hòa Sơn cước"],
    eras: ["Kỷ Nguyên Đá Đỏ (-860)", "Kỷ Nguyên Khai Khoáng (-310)", "Kỷ Nguyên Hiệp Ước (140)"],
  },
  {
    regionCode: "A4",
    count: 16,
    bloc: "Vành đai Hỏa Sơn Đông",
    biomes: ["ASH_VOLCANIC", "ARID_CANYON"],
    palette: ["#dc2626", "#b91c1c", "#ea580c", "#e11d48", "#c2410c", "#f43f5e"],
    prefixes: ["Chư hầu", "Cộng hòa Địa nhiệt", "Công quốc", "Thành bang Luyện kim"],
    roots: ["Ashen", "Basaltia", "Caldera", "Dross", "Ember", "Fumar", "Geyseria", "Hearth", "Ignar", "Jasper", "Kiln", "Lavat", "Magmia", "Niter", "Obsidia", "Pumic", "Scoria", "Tephra"],
    capitals: ["Ashford", "Basaltis", "Calderon", "Drossen", "Emberfall", "Fumara", "Geyserport", "Hearthhold", "Ignara", "Jaspis", "Kilntown", "Lavaria", "Magmion", "Nitria", "Obsidion", "Pumica", "Scoris", "Tephris"],
    languages: ["Ignic", "Tiếng Basalt", "Đông Aurelian"],
    governments: ["Nguyên lão viện Địa nhiệt", "Hội đồng Thợ luyện kim", "Cộng hòa Công nghiệp"],
    eras: ["Kỷ Nguyên Luyện Kim (-1040)", "Kỷ Nguyên Hơi Nước (320)", "Kỷ Nguyên Bách Khoa (510)"],
  },
  {
    regionCode: "A5",
    count: 16,
    bloc: "Liên hiệp Cao nguyên Nam",
    biomes: ["ARID_CANYON", "SAND_DESERT", "TEMPERATE_PLAINS"],
    palette: ["#d97706", "#ea580c", "#ca8a04", "#b45309", "#f59e0b"],
    prefixes: ["Tiểu vương quốc", "Liên bộ", "Cộng hòa Ốc đảo", "Thành bang"],
    roots: ["Ambar", "Barkan", "Caravan", "Duneva", "Ergon", "Fajr", "Ghadir", "Hamar", "Iram", "Jabal", "Kharif", "Lisan", "Marib", "Nafud", "Oasira", "Qanat", "Rimal", "Sahir"],
    capitals: ["Ambari", "Barkanis", "Caravania", "Dunehaven", "Ergopolis", "Fajria", "Ghadira", "Hamaris", "Iramis", "Jabalon", "Kharifa", "Lisanport", "Maribia", "Nafuda", "Oasis", "Qanatia", "Rimalis", "Sahira"],
    languages: ["Kothric Nam", "Tiếng Qanati", "Tiếng Ốc đảo"],
    governments: ["Hội đồng Ốc đảo", "Tiểu vương quốc Lập hiến", "Liên hiệp Thương đoàn"],
    eras: ["Kỷ Nguyên Đá Đỏ (-910)", "Kỷ Nguyên Thương Đoàn (-420)", "Kỷ Nguyên Kênh Đào (190)"],
  },
  {
    regionCode: "A6",
    count: 10,
    bloc: "Hải Hiệp Trung Dương",
    biomes: ["CORAL_SEA", "TEMPERATE_PLAINS"],
    palette: ["#0891b2", "#0284c7", "#0d9488", "#06b6d4", "#2563eb"],
    prefixes: ["Thương cảng", "Cộng hòa Duyên hải", "Thành bang", "Công quốc Biển"],
    roots: ["Azura", "Bayside", "Corallia", "Delphin", "Estuar", "Faro", "Galeon", "Harboria", "Inlet", "Jetty", "Laguna", "Marina"],
    capitals: ["Azurport", "Bayhaven", "Coralis", "Delphia", "Estuaria", "Farol", "Galeonia", "Harboris", "Inletia", "Jettis", "Lagunaria", "Marinis"],
    languages: ["Pelagic", "Tiếng Duyên hải Aurelia"],
    governments: ["Cộng hòa Hàng hải", "Hội đồng Thương cảng", "Thành bang Tự do"],
    eras: ["Kỷ Nguyên Hải Trình (-480)", "Kỷ Nguyên Hàng Hải (110)"],
  },
  {
    regionCode: "A7",
    count: 10,
    bloc: "Vành đai Hỏa Sơn Đông",
    biomes: ["ALPINE_PEAKS", "ASH_VOLCANIC"],
    palette: ["#7c3aed", "#6d28d9", "#9333ea", "#64748b", "#4f46e5"],
    prefixes: ["Công quốc", "Vùng núi", "Cộng hòa", "Lãnh địa"],
    roots: ["Krag", "Valkyr", "Orest", "Zephia", "Boreon", "Cairn", "Drava", "Elbrus", "Fjell", "Gora"],
    capitals: ["Kragheim", "Valkyria", "Orestia", "Zephir", "Boreonis", "Cairnburg", "Dravaport", "Elbrusia", "Fjellen", "Goragrad"],
    languages: ["Tiếng Sơn Đông", "Ignic Bắc"],
    governments: ["Hội đồng Sơn cước", "Công quốc Lập hiến"],
    eras: ["Kỷ Nguyên Khai Khoáng (-690)", "Kỷ Nguyên Phục Hưng (230)"],
  },
  {
    regionCode: "B1",
    count: 14,
    bloc: "Liên bang Phương Tây",
    biomes: ["ALPINE_PEAKS", "TEMPERATE_PLAINS"],
    palette: ["#4f46e5", "#4338ca", "#6366f1", "#3730a3", "#7c3aed"],
    prefixes: ["Vương quốc", "Công quốc", "Cộng hòa", "Liên bang"],
    roots: ["Avalon", "Bretia", "Caledon", "Danelaw", "Eborac", "Flandra", "Gallia", "Hibern", "Illyra", "Jutland", "Kentia", "Lothar", "Mercia", "Norma", "Ostria", "Picard"],
    capitals: ["Avalonia", "Bretport", "Caledis", "Daneburg", "Ebor", "Flandris", "Gallion", "Hibernia", "Illyris", "Jutport", "Kentis", "Lotharia", "Mercis", "Normadia", "Ostris", "Picardia"],
    languages: ["Occident Bắc", "Tiếng Lotharic", "Tiếng Cổ Tây"],
    governments: ["Quân chủ Lập hiến", "Cộng hòa Nghị viện", "Liên bang Công quốc"],
    eras: ["Kỷ Nguyên Cổ Điển (-1100)", "Kỷ Nguyên Thương Mại (-610)"],
  },
  {
    regionCode: "B2",
    count: 16,
    bloc: "Liên bang Phương Tây",
    biomes: ["TEMPERATE_PLAINS", "CORAL_SEA"],
    palette: ["#3b82f6", "#2563eb", "#6366f1", "#8b5cf6", "#0284c7"],
    prefixes: ["Cộng hòa", "Công quốc", "Thành bang", "Tỉnh tự trị"],
    roots: ["Argent", "Bellona", "Caelum", "Doria", "Etrusca", "Floren", "Genova", "Helvet", "Insubra", "Latium", "Mantua", "Novara", "Padua", "Riven", "Siena", "Tuscany", "Umbria", "Venetia"],
    capitals: ["Argenta", "Bellonis", "Caelia", "Doriaport", "Etrus", "Florencia", "Genovis", "Helvetia", "Insubris", "Latia", "Mantuas", "Novaris", "Paduis", "Rivenia", "Sienis", "Tusca", "Umbris", "Venetis"],
    languages: ["Occident Chuẩn", "Tiếng Ngân Hà"],
    governments: ["Cộng hòa Nghị viện", "Thành bang Học thuật", "Cộng hòa Thương mại"],
    eras: ["Kỷ Nguyên Thương Mại (-740)", "Kỷ Nguyên Phục Hưng (150)"],
  },
  {
    regionCode: "B3",
    count: 12,
    bloc: "Liên bang Phương Tây",
    biomes: ["ARID_CANYON", "SAND_DESERT"],
    palette: ["#d97706", "#b45309", "#c2410c", "#ea580c", "#a16207"],
    prefixes: ["Vương quốc", "Cộng hòa", "Công quốc", "Lãnh địa"],
    roots: ["Algarv", "Baetica", "Castel", "Duero", "Ebro", "Granad", "Huelva", "Iberia", "Jerez", "Leonis", "Murcia", "Navarr", "Oporto", "Sevilla"],
    capitals: ["Algarvia", "Baetis", "Castella", "Dueris", "Ebronia", "Granadis", "Huelvis", "Iberis", "Jereza", "Leonia", "Murcis", "Navarris", "Oportis", "Sevillis"],
    languages: ["Tây Nam Occident", "Tiếng Iberic"],
    governments: ["Quân chủ Lập hiến", "Cộng hòa Liên tỉnh"],
    eras: ["Kỷ Nguyên Đá Đỏ (-790)", "Kỷ Nguyên Hải Trình (-290)"],
  },
  {
    regionCode: "B4",
    count: 10,
    bloc: "Hải Hiệp Trung Dương",
    biomes: ["CORAL_SEA", "TEMPERATE_PLAINS"],
    palette: ["#0ea5e9", "#0284c7", "#06b6d4", "#14b8a6", "#38bdf8"],
    prefixes: ["Thành bang Cảng", "Cộng hòa Biển", "Công quốc", "Đặc khu"],
    roots: ["Cadiz", "Lisboa", "Malaga", "Nantes", "Ostia", "Palma", "Quiberon", "Rhodia", "Syrak", "Tarsus", "Utica", "Vigo"],
    capitals: ["Cadizia", "Lisbonis", "Malagis", "Nantia", "Ostiaport", "Palmis", "Quiberia", "Rhodis", "Syraka", "Tarsia", "Uticis", "Vigoport"],
    languages: ["Pelagic Tây", "Occident Duyên hải"],
    governments: ["Cộng hòa Hàng hải", "Thành bang Tự do"],
    eras: ["Kỷ Nguyên Hải Trình (-520)", "Kỷ Nguyên Thương Mại (90)"],
  },
  {
    regionCode: "C1",
    count: 14,
    bloc: "Khối Viễn Đông Cổ",
    biomes: ["ALPINE_PEAKS", "TEMPERATE_PLAINS"],
    palette: ["#059669", "#047857", "#10b981", "#0d9488", "#15803d"],
    prefixes: ["Vương quốc", "Châu tự trị", "Công quốc", "Cộng hòa"],
    roots: ["Bắc Sơn", "Thanh Lâm", "Huyền Phong", "Bạch Hạc", "Kim Lĩnh", "Tuyết Cốc", "Ngân Khê", "Vân Đỉnh", "Thạch Môn", "Lam Kiều", "Linh Tuyền", "Thái Bình", "Hàn Giang", "Tùng Nguyên", "Đông Lĩnh", "Cửu Phong"],
    capitals: ["Bắc Thành", "Thanh Đô", "Huyền Trấn", "Hạc Kinh", "Kim Thành", "Tuyết Phủ", "Ngân Đô", "Vân Thành", "Thạch Đô", "Lam Phủ", "Linh Thành", "Thái Kinh", "Hàn Đô", "Tùng Phủ", "Đông Kinh", "Cửu Thành"],
    languages: ["Đông Hoa Cổ", "Ngữ hệ Ngọc Lĩnh"],
    governments: ["Chế độ Khoa cử Lập hiến", "Hội đồng Châu phủ", "Vương quốc Hành chính"],
    eras: ["Kỷ Nguyên Cổ Điển (-1420)", "Kỷ Nguyên Văn Hiến (-680)"],
  },
  {
    regionCode: "C2",
    count: 16,
    bloc: "Khối Viễn Đông Cổ",
    biomes: ["TEMPERATE_PLAINS", "TROPICAL_JUNGLE"],
    palette: ["#10b981", "#16a34a", "#22c55e", "#14b8a6", "#059669"],
    prefixes: ["Quốc gia", "Châu phủ", "Cộng hòa", "Vương quốc"],
    roots: ["Long Châu", "Phượng Khê", "Ngọc Hà", "Minh Đạo", "Quang Hòa", "Thuận An", "Khánh Nguyên", "Hưng Thịnh", "Vĩnh Lạc", "Thiên Bảo", "Xuân Thủy", "Hạ Châu", "Thu Giang", "Đông Hải", "Trung Nguyên", "Hòa Bình", "Trường An", "Cẩm Tú"],
    capitals: ["Long Đô", "Phượng Thành", "Ngọc Kinh", "Minh Phủ", "Quang Thành", "Thuận Đô", "Khánh Phủ", "Hưng Thành", "Vĩnh Kinh", "Bảo Thành", "Xuân Đô", "Hạ Phủ", "Thu Thành", "Hải Đô", "Trung Kinh", "Hòa Thành", "Trường Đô", "Cẩm Thành"],
    languages: ["Đông Hoa Chuẩn", "Tiếng Long Mạch"],
    governments: ["Cộng hòa Nghị viện", "Vương quốc Lập hiến", "Liên minh Châu phủ"],
    eras: ["Kỷ Nguyên Cổ Điển (-1380)", "Kỷ Nguyên Đê Điều (-520)"],
  },
  {
    regionCode: "C3",
    count: 12,
    bloc: "Khối Viễn Đông Cổ",
    biomes: ["TROPICAL_JUNGLE", "CORAL_SEA"],
    palette: ["#15803d", "#0f766e", "#16a34a", "#0d9488", "#047857"],
    prefixes: ["Vương quốc", "Cộng hòa", "Thương cảng", "Quần xã"],
    roots: ["Nam Hải", "Trầm Hương", "Lục Thủy", "San Hô", "Bích Vịnh", "Ngọc Đảo", "Quế Lâm", "Trà Sơn", "Dừa Xanh", "Bến Ngọc", "Vân Hải", "Thủy Triều", "Thanh Đảo", "Phù Sa"],
    capitals: ["Nam Cảng", "Hương Đô", "Lục Thành", "San Hô Trấn", "Bích Cảng", "Ngọc Phủ", "Quế Thành", "Trà Đô", "Xanh Cảng", "Bến Đô", "Vân Cảng", "Triều Thành", "Thanh Cảng", "Sa Đô"],
    languages: ["Nam Đông Hoa", "Ngữ hệ Duyên Hải Đông"],
    governments: ["Cộng hòa Thương mại", "Vương quốc Hải cảng", "Liên minh Cảng thị"],
    eras: ["Kỷ Nguyên Hải Trình (-640)", "Kỷ Nguyên Gia Vị (80)"],
  },
  {
    regionCode: "D",
    count: 8,
    bloc: "Hội đồng Bắc Cực",
    biomes: ["GLACIAL_ICE"],
    palette: ["#38bdf8", "#7dd3fc", "#0284c7", "#60a5fa", "#93c5fd"],
    prefixes: ["Cộng hòa Băng", "Trạm tự trị", "Liên xã Bắc Cực", "Lãnh địa"],
    roots: ["Arktika", "Glacia", "Hyperbor", "Kalaallit", "Norseheim", "Polaris", "Svalbard", "Thule", "Vostok-N", "Yukon-B"],
    capitals: ["Arktis", "Glaciaport", "Hyperia", "Kalaal", "Norsebay", "Polarport", "Svalburg", "Thuleia", "Vostok", "Yukonis"],
    languages: ["Boreal", "Tiếng Cực Bắc"],
    governments: ["Hội đồng Dân biểu Băng nguyên", "Khu Bảo tồn Khoa học"],
    eras: ["Kỷ Nguyên Cực Quang (-280)", "Kỷ Nguyên Khảo Sát (420)"],
  },
  {
    regionCode: "E",
    count: 8,
    bloc: "Hiệp ước Nam Cực",
    biomes: ["GLACIAL_ICE", "ALPINE_PEAKS"],
    palette: ["#93c5fd", "#60a5fa", "#38bdf8", "#818cf8", "#a5b4fc"],
    prefixes: ["Khu Nghiên cứu", "Lãnh địa Nam Cực", "Liên xã", "Trạm Tự trị"],
    roots: ["Amundsa", "Bellings", "Erebus", "Filchner", "McMurdo", "Nansen-S", "Palmer", "Rossia", "Shacklet", "Weddell"],
    capitals: ["Amundport", "Bellingsis", "Erebusia", "Filchhaven", "McMurdis", "Nansenis", "Palmeria", "Rossport", "Shacklia", "Weddellis"],
    languages: ["Austral Cực", "Ngữ hệ Khoa học Quốc tế"],
    governments: ["Hội đồng Hiệp ước Khoa học", "Khu Tự trị Khảo sát"],
    eras: ["Kỷ Nguyên Khảo Sát (510)", "Kỷ Nguyên Bách Khoa (680)"],
  },
  {
    regionCode: "F",
    count: 14,
    bloc: "Hải Hiệp Trung Dương",
    biomes: ["ARCHIPELAGO", "CORAL_SEA"],
    palette: ["#06b6d4", "#0891b2", "#14b8a6", "#0d9488", "#22d3ee"],
    prefixes: ["Quần đảo", "Đảo quốc", "Cộng hòa Biển", "Liên đảo"],
    roots: ["Atollia", "Boraia", "Calypso", "Drifta", "Elysia", "Fijora", "Galapa", "Halcyon", "Ionia", "Javanis", "Kiriba", "Lantana", "Maldiva", "Nereid", "Oceana", "Palauis"],
    capitals: ["Atollport", "Borais", "Calypsia", "Driftbay", "Elysium", "Fijor", "Galapis", "Halcyonia", "Ionis", "Javaport", "Kiribis", "Lantanis", "Maldivis", "Nereida", "Oceanis", "Palauport"],
    languages: ["Pelagic", "Ngữ hệ Trung Dương"],
    governments: ["Liên minh Đảo quốc", "Cộng hòa Hàng hải", "Hội đồng Thuyền trưởng"],
    eras: ["Kỷ Nguyên Hải Trình (-580)", "Kỷ Nguyên Bản Đồ (220)"],
  },
  // NEW MEGA-PLANET EXPANSION CONTINENTS (#207..#360)
  {
    regionCode: "G1",
    count: 18,
    bloc: "Khối Nam Bán Cầu",
    biomes: ["SAND_DESERT", "ARID_CANYON"],
    palette: ["#a855f7", "#9333ea", "#c084fc", "#d97706", "#f59e0b"],
    prefixes: ["Bang Sa mạc", "Cộng hòa", "Liên xã Opal", "Công quốc"],
    roots: ["Ayers", "Brokena", "Coober", "Darling", "Eyria", "Flinder", "Gibson", "Hamers", "Iluka", "Jindaby", "Kalgoor", "Lavert", "Murchis", "Nullar", "Oodnad", "Pilbara", "Quilpie", "Redland", "Simpson", "Tanami", "Uluria", "Wiluna"],
    capitals: ["Ayersis", "Brokenport", "Cooberia", "Darlis", "Eyriaport", "Flindis", "Gibsonia", "Hameris", "Ilukaport", "Jindis", "Kalgis", "Laveria", "Murchia", "Nullis", "Oodna", "Pilbaris", "Quilpis", "Redhaven", "Simpsonia", "Tanamis", "Uluris", "Wilunis"],
    languages: ["Austral Tây", "Tiếng Opalic"],
    governments: ["Cộng hòa Liên tỉnh", "Hội đồng Khai khoáng", "Liên bang Ốc đảo"],
    eras: ["Kỷ Nguyên Hải Trình (-350)", "Kỷ Nguyên Địa Chất (310)"],
  },
  {
    regionCode: "G2",
    count: 18,
    bloc: "Khối Nam Bán Cầu",
    biomes: ["TEMPERATE_PLAINS", "CORAL_SEA", "ALPINE_PEAKS"],
    palette: ["#8b5cf6", "#7c3aed", "#6366f1", "#10b981", "#06b6d4"],
    prefixes: ["Cộng hòa", "Liên bang", "Công quốc", "Thành bang"],
    roots: ["Adela", "Brisba", "Cairna", "Darwina", "Echuca", "Fremant", "Geelong", "Hobarta", "Inverel", "Jervis", "Kempsey", "Launces", "Melbour", "Newcast", "Oranga", "Perthia", "Queensl", "Rockham", "Sydneia", "Tasmia", "Victora", "Wollong"],
    capitals: ["Adelais", "Brisport", "Cairnis", "Darwinis", "Echucis", "Fremis", "Geelis", "Hobartis", "Inveris", "Jervisbay", "Kempis", "Launcis", "Melbport", "Newcas", "Orangis", "Perthport", "Queenis", "Rockis", "Sydport", "Tasmis", "Victorport", "Wollis"],
    languages: ["Austral Chuẩn", "Tiếng Nam Dương"],
    governments: ["Cộng hòa Nghị viện", "Liên bang Duyên hải", "Thành bang Hải dương"],
    eras: ["Kỷ Nguyên Hải Trình (-390)", "Kỷ Nguyên Đô Thị (420)"],
  },
  {
    regionCode: "H1",
    count: 16,
    bloc: "Khối Tây Bắc Hải",
    biomes: ["ALPINE_PEAKS", "GLACIAL_ICE", "TEMPERATE_PLAINS"],
    palette: ["#0d9488", "#0f766e", "#14b8a6", "#0284c7", "#38bdf8"],
    prefixes: ["Công quốc", "Cộng hòa Rừng", "Liên bang", "Tỉnh tự trị"],
    roots: ["Alaskia", "Banffia", "Cascad", "Denalia", "Edmont", "Fraser", "Glacier", "Hudsia", "Inuvik", "Jaspern", "Klondik", "Labrad", "Macken", "Nunavik", "Olympia", "Peaceval", "Quesnel", "Rainier", "Sitkia", "Tofino"],
    capitals: ["Alaskport", "Banffis", "Cascadis", "Denalis", "Edmonis", "Frasport", "Glacis", "Hudport", "Inuvis", "Jasport", "Klondis", "Labris", "Mackis", "Nunavis", "Olympis", "Peaceport", "Quesnis", "Rainis", "Sitkaport", "Tofinis"],
    languages: ["Hesperic Bắc", "Tiếng Tùng Bách"],
    governments: ["Liên bang Tỉnh trị", "Hội đồng Lâm nghiệp", "Cộng hòa Nghị viện"],
    eras: ["Kỷ Nguyên Khai Phá (-590)", "Kỷ Nguyên Rừng Xanh (140)"],
  },
  {
    regionCode: "H2",
    count: 16,
    bloc: "Khối Tây Bắc Hải",
    biomes: ["TEMPERATE_PLAINS", "CORAL_SEA"],
    palette: ["#14b8a6", "#10b981", "#059669", "#0891b2", "#22c55e"],
    prefixes: ["Cộng hòa", "Bang Tự do", "Thành bang", "Công quốc"],
    roots: ["Astoria", "Belling", "Calgar", "Dakotia", "Eugenia", "Fargois", "Guelph", "Halifax", "Idahoa", "Juneau", "Kelowna", "Lethbri", "Montan", "Nanaimo", "Oregona", "Portlan", "Regina", "Seattla", "Tacoma", "Vancouv"],
    capitals: ["Astoris", "Bellport", "Calgis", "Dakotis", "Eugenis", "Fargis", "Guelphis", "Halifport", "Idahis", "Juneis", "Kelowis", "Lethis", "Montis", "Nanais", "Oregonis", "Portlis", "Reginis", "Seatport", "Tacomis", "Vancport"],
    languages: ["Hesperic Chuẩn", "Tiếng Cảng Tây"],
    governments: ["Cộng hòa Nghị viện", "Thành bang Hàng hải", "Liên minh Thương mại"],
    eras: ["Kỷ Nguyên Khai Phá (-510)", "Kỷ Nguyên Đô Thị (360)"],
  },
  {
    regionCode: "I1",
    count: 18,
    bloc: "Liên minh Xích Đạo Solara",
    biomes: ["TROPICAL_JUNGLE", "TEMPERATE_PLAINS"],
    palette: ["#eab308", "#ca8a04", "#16a34a", "#15803d", "#f59e0b"],
    prefixes: ["Vương quốc", "Cộng hòa Rừng mưa", "Liên bang", "Thành bang"],
    roots: ["Amazona", "Bahia", "Cuzcoa", "Darien", "Esmeral", "Fortale", "Guayana", "Huascar", "Iquitos", "Juruena", "Kourou", "Leticia", "Manaus", "Napoia", "Orinoco", "Petenia", "Quitois", "Roraima", "Surinam", "Tikalon"],
    capitals: ["Amazonis", "Bahiport", "Cuzcis", "Darienis", "Esmeris", "Fortis", "Guayanis", "Huascis", "Iquitis", "Juruis", "Kouris", "Leticis", "Manauis", "Napois", "Orinocis", "Petenis", "Quitoport", "Roraimis", "Surinis", "Tikalis"],
    languages: ["Solari Bắc", "Ngữ hệ Lục Bảo"],
    governments: ["Quân chủ Nghị viện", "Cộng hòa Sinh thái", "Hội đồng Lưu vực"],
    eras: ["Kỷ Nguyên Mặt Trời (-980)", "Kỷ Nguyên Thực Vật Học (210)"],
  },
  {
    regionCode: "I2",
    count: 18,
    bloc: "Liên minh Xích Đạo Solara",
    biomes: ["SAND_DESERT", "ARID_CANYON", "ALPINE_PEAKS"],
    palette: ["#f59e0b", "#d97706", "#eab308", "#ea580c", "#b45309"],
    prefixes: ["Cộng hòa", "Công quốc Cao nguyên", "Vương quốc", "Liên xã"],
    roots: ["Atacama", "Bolivia", "Cordoba", "Deserta", "Elqui", "Famatia", "Gualegu", "Humahua", "Iquique", "Jujuyia", "Kalahar", "LaPazia", "Mendoza", "Nazcaia", "Oruroia", "Potosia", "Quilmes", "Saltaia", "Tacnaia", "Uyuni"],
    capitals: ["Atacamis", "Bolivis", "Cordobis", "Desertis", "Elquis", "Famatis", "Gualis", "Humahis", "Iquiqis", "Jujuyis", "Kalahis", "LaPazis", "Mendozis", "Nazcais", "Orurois", "Potosis", "Quilmis", "Saltais", "Tacnais", "Uyunis"],
    languages: ["Solari Nam", "Tiếng Cao nguyên Nhật Quang"],
    governments: ["Cộng hòa Cao nguyên", "Liên minh Ốc đảo", "Quân chủ Lập hiến"],
    eras: ["Kỷ Nguyên Mặt Trời (-890)", "Kỷ Nguyên Thiên Văn (160)"],
  },
  {
    regionCode: "J1",
    count: 12,
    bloc: "Hải Hiệp Trung Dương",
    biomes: ["CORAL_SEA", "ARCHIPELAGO"],
    palette: ["#0ea5e9", "#06b6d4", "#14b8a6", "#38bdf8", "#0284c7"],
    prefixes: ["Đảo quốc", "Quần đảo", "Cộng hòa Hải dương", "Trạm Hải đồ"],
    roots: ["Azores", "Bermuda", "Canaria", "Diego", "Eastera", "Faroes", "Guamia", "Hawaiia", "Icelis", "Madeira", "Nauruis", "Pitcair", "Samoaia", "Tahitia"],
    capitals: ["Azorport", "Bermudis", "Canaris", "Diegoport", "Easteris", "Faroport", "Guamport", "Hawaiport", "Icelport", "Madeiris", "Naurport", "Pitport", "Samoaport", "Tahitport"],
    languages: ["Pelagic Ngoại Vi", "Ngữ hệ Hàng hải"],
    governments: ["Cộng hòa Hải đảo", "Hội đồng Hải đăng"],
    eras: ["Kỷ Nguyên Hải Trình (-460)", "Kỷ Nguyên Bản Đồ (380)"],
  },
  {
    regionCode: "J2",
    count: 12,
    bloc: "Trung lập Liên quốc gia",
    biomes: ["ARCHIPELAGO", "CORAL_SEA"],
    palette: ["#f59e0b", "#fbbf24", "#eab308", "#a855f7", "#ec4899"],
    prefixes: ["Đặc khu", "Viện Lưu trữ", "Hải cảng Tự do", "Đài Quan sát"],
    roots: ["Alexandria", "Biblios", "Cartograph", "Chronicle", "Codexia", "Encyclo", "Geodesia", "Histora", "Lexicon", "Meridian", "Observa", "Polyglot", "Scriptor", "Veritas"],
    capitals: ["Alexandris", "Biblion", "Cartoport", "Chronis", "Codexis", "Encyclis", "Geodis", "Historis", "Lexis", "Meridport", "Observis", "Polygis", "Scriptis", "Veritis"],
    languages: ["Tiếng Hàn Lâm Chung", "Đa ngữ Quốc tế"],
    governments: ["Hội đồng Học giả Tự trị", "Ủy ban Lưu trữ Hành tinh"],
    eras: ["Kỷ Nguyên Bách Khoa (540)", "Kỷ Nguyên Liên Hành Tinh (790)"],
  },
];

export function buildAll360NationSeeds(): NationSeed[] {
  const result: NationSeed[] = [...CORE_HANDCRAFTED_NATIONS];
  const usedNums = new Set<number>(result.map((n) => n.nationNum));

  // Allocate remaining nation numbers cleanly from 1..360
  const availableNums: number[] = [];
  for (let num = 1; num <= 360; num++) {
    if (!usedNums.has(num)) availableNums.push(num);
  }

  let cursor = 0;
  for (const profile of REGION_PROFILES) {
    for (let i = 0; i < profile.count; i++) {
      if (cursor >= availableNums.length) break;
      const nationNum = availableNums[cursor++];
      const root = profile.roots[i % profile.roots.length];
      const prefix = profile.prefixes[i % profile.prefixes.length];
      const capital = profile.capitals[i % profile.capitals.length];
      const biome = profile.biomes[i % profile.biomes.length];
      const color = profile.palette[i % profile.palette.length];
      const language = profile.languages[i % profile.languages.length];
      const governmentType = profile.governments[i % profile.governments.length];
      const foundingEra = profile.eras[i % profile.eras.length];

      // Determine realistic encyclopedic tier distribution
      let tier: PolityScaleTier = "REGIONAL_STATE";
      if (profile.regionCode === "J2") {
        tier = "SPECIAL_ZONE";
      } else if (i === 0 && profile.count >= 16) {
        tier = "MAJOR_STATE";
      } else if (i % 5 === 0) {
        tier = "MAJOR_STATE";
      } else if (i % 4 === 1) {
        tier = "REGIONAL_STATE";
      } else if (i % 4 === 2) {
        tier = "PRINCIPALITY";
      } else {
        tier = "FREE_CITY";
      }

      const validFromTick =
        nationNum % 7 === 0 ? 250 : nationNum % 11 === 0 ? 500 : 0;

      result.push({
        nationNum,
        name: `${prefix} ${root}`,
        shortName: root,
        capital,
        tier,
        regionCode: profile.regionCode,
        bloc: profile.bloc,
        biome,
        color,
        governmentType,
        primaryLanguage: language,
        foundingEra,
        validFromTick,
        validToTick: 1000,
        summary: `${prefix} ${root} (thủ đô ${capital}) là một thực thể địa chính trị thuộc khu vực ${profile.regionCode} (${profile.bloc}), sử dụng ${language} và vận hành theo thể chế ${governmentType.toLowerCase()}.`,
      });
    }
  }

  // Sort strictly by nationNum (#1..#360)
  return result.sort((a, b) => a.nationNum - b.nationNum);
}

export const CONTINENT_NAME_VI: Record<ContinentId, string> = {
  AURELIA: "Aurelia (Trung Tâm)",
  OCCIDENTALIS: "Occidentalis (Phương Tây)",
  ORIENTIS: "Orientis (Viễn Đông)",
  AUSTRALIS: "Australis (Nam Đông)",
  HESPERIA: "Hesperia (Tây Bắc)",
  SOLARA: "Solara (Nam Tây)",
  ARCTIC_ICE: "Bắc Cực Băng Nguyên",
  ANTARCTIC_ICE: "Nam Cực Lục Địa",
  OCEANIC: "Hải Vực Trung Dương",
};
