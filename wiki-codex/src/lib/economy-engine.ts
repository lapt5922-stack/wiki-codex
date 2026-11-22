import type {
  EconomyBarItem,
  EntityEmblemConfig,
  Entry,
  EntryCardProjection,
  EntryEconomyProfile
} from "@/types/codex";
import type { AtlasBiomeId, ContinentId, PlanetaryNation } from "@/lib/planetary-atlas/types";

export interface WorldCurrencyDef {
  code: string;
  name: string;
  symbol: string;
  continent: ContinentId;
  /** How many units of this currency equal 1.00 Aurel (AUR) */
  ratePerAurel: number;
  regionLabel: string;
  color: string;
}

export const WORLD_CURRENCIES: WorldCurrencyDef[] = [
  { code: "AUR", name: "Đồng Hoàng Kim Aurel", symbol: "Ⱥ", continent: "AURELIA", ratePerAurel: 1.0, regionLabel: "Lục địa Aurelia (Chuẩn trung tâm)", color: "#D4AF37" },
  { code: "ARG", name: "Bạc Ngân Hà Argent", symbol: "₳", continent: "OCCIDENTALIS", ratePerAurel: 1.18, regionLabel: "Lục địa Occidentalis", color: "#6366F1" },
  { code: "NGO", name: "Ngọc Tệ Đông Châu", symbol: "₦", continent: "ORIENTIS", ratePerAurel: 2.45, regionLabel: "Lục địa Orientis (Viễn Đông)", color: "#10B981" },
  { code: "OPL", name: "Đô-la Opal Nam Dương", symbol: "Ø", continent: "AUSTRALIS", ratePerAurel: 1.62, regionLabel: "Lục địa Australis", color: "#8B5CF6" },
  { code: "HSP", name: "Đồng Tùng Bách Hesper", symbol: "Ħ", continent: "HESPERIA", ratePerAurel: 1.34, regionLabel: "Lục địa Hesperia", color: "#14B8A6" },
  { code: "SOL", name: "Kim Nhật Sol", symbol: "☼", continent: "SOLARA", ratePerAurel: 1.85, regionLabel: "Lục địa Solara", color: "#EAB308" },
  { code: "BOR", name: "Tín phiếu Cực Quang", symbol: "✦", continent: "ARCTIC_ICE", ratePerAurel: 0.92, regionLabel: "Bắc Cực Băng Nguyên", color: "#38BDF8" },
  { code: "ANT", name: "Tín phiếu Nghiên cứu Nam Cực", symbol: "❄", continent: "ANTARCTIC_ICE", ratePerAurel: 0.96, regionLabel: "Nam Cực Lục Địa", color: "#93C5FD" },
  { code: "PLG", name: "Hải Tệ Trung Dương", symbol: "♆", continent: "OCEANIC", ratePerAurel: 1.48, regionLabel: "Hải Vực & Quần đảo Trung Dương", color: "#06B6D4" }
];

export const CURRENCY_BY_CONTINENT_DEF: Record<ContinentId, WorldCurrencyDef> = Object.fromEntries(
  WORLD_CURRENCIES.map((c) => [c.continent, c])
) as Record<ContinentId, WorldCurrencyDef>;

export function convertWorldCurrency(amount: number, fromCode: string, toCode: string): number {
  if (!Number.isFinite(amount)) return 0;
  const from = WORLD_CURRENCIES.find((c) => c.code === fromCode) ?? WORLD_CURRENCIES[0];
  const to = WORLD_CURRENCIES.find((c) => c.code === toCode) ?? WORLD_CURRENCIES[0];
  const inAurel = amount / from.ratePerAurel;
  return Number((inAurel * to.ratePerAurel).toFixed(2));
}

export function normalizeBarsTo100<T extends { percentage: number }>(bars: T[]): T[] {
  if (bars.length === 0) return bars;
  const clamped = bars.map((b) => ({ ...b, percentage: Math.max(0, Math.round(b.percentage)) }));
  const total = clamped.reduce((s, b) => s + b.percentage, 0);
  if (total === 100) return clamped;
  if (total <= 0) {
    const even = Math.floor(100 / clamped.length);
    const rem = 100 - even * clamped.length;
    return clamped.map((b, i) => ({ ...b, percentage: even + (i === 0 ? rem : 0) }));
  }
  const scaled = clamped.map((b) => ({
    ...b,
    percentage: Math.max(1, Math.round((b.percentage / total) * 100))
  }));
  const diff = 100 - scaled.reduce((s, b) => s + b.percentage, 0);
  if (diff !== 0) {
    let maxIdx = 0;
    for (let i = 1; i < scaled.length; i++) {
      if (scaled[i].percentage > scaled[maxIdx].percentage) maxIdx = i;
    }
    scaled[maxIdx] = { ...scaled[maxIdx], percentage: Math.max(1, scaled[maxIdx].percentage + diff) };
  }
  return scaled;
}

function deterministicHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const EXPORTS_BY_BIOME: Record<AtlasBiomeId, string[]> = {
  TEMPERATE_PLAINS: ["Ngũ cốc thượng hạng", "Giấy lưu trữ cổ thư", "Rượu vang đồng bằng"],
  ARID_CANYON: ["Quặng đồng & sắt đỏ", "Đá chạm khắc", "Da thuộc thương đoàn"],
  ASH_VOLCANIC: ["Thủy tinh địa nhiệt", "Thép rèn tinh luyện", "Đá bazan xây dựng"],
  SAND_DESERT: ["Hương liệu & nhựa thơm", "Thấu kính cát tinh", "Thảm dệt ốc đảo"],
  TROPICAL_JUNGLE: ["Dược thảo quý hiếm", "Gỗ hương & trầm", "Gia vị nhiệt đới"],
  ALPINE_PEAKS: ["Pha lê sơn mạch", "Len cao nguyên", "Dụng cụ đo trắc địa"],
  GLACIAL_ICE: ["Tư liệu khảo sát cực quang", "Hải sản vùng lạnh", "Khoáng tinh băng nguyên"],
  CORAL_SEA: ["Ngọc trai san hô", "Hải đồ hàng hải", "Muối biển tinh khiết"],
  ARCHIPELAGO: ["Thuyền buồm viễn dương", "Hương liệu hải đảo", "Hải sản sấy khô"]
};

const IMPORTS_BY_BIOME: Record<AtlasBiomeId, string[]> = {
  TEMPERATE_PLAINS: ["Khoáng sản quý hiếm", "Thủy tinh địa nhiệt", "Hương liệu nhiệt đới"],
  ARID_CANYON: ["Lương thực đồng bằng", "Gỗ đóng tàu", "Giấy lưu trữ cao cấp"],
  ASH_VOLCANIC: ["Ngũ cốc & thực phẩm tươi", "Vải lụa phương Đông", "Dược thảo rừng mưa"],
  SAND_DESERT: ["Nước lọc & thiết bị thủy lợi", "Gỗ xây dựng", "Vật tư đóng sách"],
  TROPICAL_JUNGLE: ["Thép luyện kim chuẩn", "Dụng cụ thiên văn đồng", "Đá cẩm thạch xây dựng"],
  ALPINE_PEAKS: ["Hải sản muối & muối biển", "Vải dệt ôn đới", "Ngũ cốc vụ đông"],
  GLACIAL_ICE: ["Lương thực bảo quản", "Nhiên liệu sưởi ấm", "Vật liệu cách nhiệt"],
  CORAL_SEA: ["Khoáng sản luyện kim", "Gỗ rừng ôn đới", "Ngũ cốc nội địa"],
  ARCHIPELAGO: ["Thép luyện kim", "Ngũ cốc đồng bằng", "Sách lưu trữ học thuật"]
};

export function buildNationEconomyProfile(nation: PlanetaryNation): EntryEconomyProfile {
  const h = deterministicHash(`${nation.id}-${nation.shortName}`);
  const cur = CURRENCY_BY_CONTINENT_DEF[nation.continent] ?? WORLD_CURRENCIES[0];

  // Base sector weights by biome (Agri, Craft/Metallurgy, Trade/Maritime, Scholarship/Services)
  let agri = 28;
  let craft = 26;
  let trade = 26;
  let scholar = 20;

  switch (nation.biome) {
    case "TEMPERATE_PLAINS":
      agri = 38; craft = 22; trade = 22; scholar = 18;
      break;
    case "ARID_CANYON":
      agri = 14; craft = 36; trade = 34; scholar = 16;
      break;
    case "ASH_VOLCANIC":
      agri = 12; craft = 46; trade = 24; scholar = 18;
      break;
    case "SAND_DESERT":
      agri = 16; craft = 22; trade = 42; scholar = 20;
      break;
    case "TROPICAL_JUNGLE":
      agri = 42; craft = 18; trade = 22; scholar = 18;
      break;
    case "ALPINE_PEAKS":
      agri = 18; craft = 34; trade = 22; scholar = 26;
      break;
    case "GLACIAL_ICE":
      agri = 10; craft = 22; trade = 24; scholar = 44;
      break;
    case "CORAL_SEA":
    case "ARCHIPELAGO":
      agri = 22; craft = 18; trade = 42; scholar = 18;
      break;
  }

  // Subtle deterministic variation per nation
  agri += (h % 9) - 4;
  craft += ((h >> 3) % 9) - 4;
  trade += ((h >> 6) % 9) - 4;
  scholar += ((h >> 9) % 9) - 4;

  // Higher tier nations tend to have more trade & scholarship
  if (nation.tier === "IMPERIAL_REALM") {
    trade += 4;
    scholar += 5;
  } else if (nation.tier === "MAJOR_STATE" || nation.tier === "SPECIAL_ZONE") {
    trade += 2;
    scholar += 4;
  }

  const sectorBreakdown = normalizeBarsTo100<EconomyBarItem>([
    { id: "sec-agri", label: "Nông – Lâm – Ngư nghiệp", percentage: agri, color: "#10B981", note: "Cung ứng lương thực & nông sản bản địa" },
    { id: "sec-craft", label: "Thủ công & Luyện kim", percentage: craft, color: "#F59E0B", note: "Chế tác, khoáng sản & công nghệ vật liệu" },
    { id: "sec-trade", label: "Thương mại & Hàng hải", percentage: trade, color: "#38BDF8", note: "Giao thương liên lục địa, hải cảng & vận tải" },
    { id: "sec-scholar", label: "Học thuật, Lưu trữ & Dịch vụ", percentage: scholar, color: "#A78BFA", note: "Giáo dục, thư viện, tài chính & hành chính" }
  ]);

  // Budget Allocation (total 100%)
  const infraBudget = 28 + ((h >> 2) % 9) - 4;
  const eduBudget = 26 + ((h >> 5) % 9) - 4 + (nation.biome === "GLACIAL_ICE" ? 8 : 0);
  const welfareBudget = 24 + ((h >> 8) % 9) - 4;
  const ecoBudget = 22 + ((h >> 11) % 7) - 3;

  const budgetAllocation = normalizeBarsTo100<EconomyBarItem>([
    { id: "bud-infra", label: "Hạ tầng & Giao thông", percentage: infraBudget, color: "#38BDF8", note: "Đường bộ, cầu cảng, trạm thông tin & thủy lợi" },
    { id: "bud-edu", label: "Giáo dục & Thư viện", percentage: eduBudget, color: "#A78BFA", note: "Học viện, kho lưu trữ cổ thư & nghiên cứu" },
    { id: "bud-welfare", label: "Y tế & Dân sinh", percentage: welfareBudget, color: "#F472B6", note: "Chăm sóc cộng đồng, cứu tế & an sinh đô thị" },
    { id: "bud-eco", label: "Bảo tồn Sinh thái & Dự trữ", percentage: ecoBudget, color: "#34D399", note: "Dự trữ lương thực, bảo vệ rừng & tài nguyên" }
  ]);

  // Development Index Meters (0-100)
  const tierBonus =
    nation.tier === "IMPERIAL_REALM"
      ? 14
      : nation.tier === "MAJOR_STATE" || nation.tier === "SPECIAL_ZONE"
      ? 10
      : nation.tier === "REGIONAL_STATE" || nation.tier === "FREE_CITY"
      ? 5
      : 0;
  const clamp = (v: number) => Math.max(38, Math.min(98, Math.round(v)));

  const literacy = clamp(66 + tierBonus + (h % 17));
  const infrastructure = clamp(60 + tierBonus + ((h >> 4) % 20));
  const foodSelfSufficiency = clamp(
    (nation.biome === "TEMPERATE_PLAINS" || nation.biome === "TROPICAL_JUNGLE" ? 78 : nation.biome === "GLACIAL_ICE" ? 42 : 58) +
      ((h >> 7) % 18)
  );
  const currencyStability = clamp(64 + tierBonus + ((h >> 10) % 16));
  const externalTrade = clamp(
    (nation.biome === "CORAL_SEA" || nation.biome === "SAND_DESERT" ? 74 : 60) +
      tierBonus +
      ((h >> 12) % 16)
  );
  const urbanLiving = clamp(58 + tierBonus + ((h >> 14) % 20));

  const developmentMeters = [
    { id: "dev-literacy", label: "Chỉ số Học vấn (Literacy)", score: literacy, color: "#A78BFA", unit: "%", note: "Tỷ lệ cư dân biết đọc viết và tiếp cận thư viện" },
    { id: "dev-infra", label: "Độ phủ Hạ tầng Giao thông", score: infrastructure, color: "#38BDF8", unit: "%", note: "Mạng lưới đường liên tỉnh, hải cảng & trạm dịch" },
    { id: "dev-food", label: "Tự chủ Lương thực", score: foodSelfSufficiency, color: "#10B981", unit: "%", note: "Khả năng đáp ứng nhu cầu thực phẩm nội địa" },
    { id: "dev-currency", label: "Ổn định Tiền tệ", score: currencyStability, color: "#D4AF37", unit: "%", note: "Độ tin cậy của đồng tiền trên thị trường liên lục địa" },
    { id: "dev-trade", label: "Kết nối Ngoại thương", score: externalTrade, color: "#F59E0B", unit: "%", note: "Mức độ hội nhập với các tuyến thương mại hành tinh" },
    { id: "dev-living", label: "Mức sống & An sinh Đô thị", score: urbanLiving, color: "#F472B6", unit: "%", note: "Chất lượng dịch vụ công cộng tại các đô thị trung tâm" }
  ];

  // Trade Balance
  const exportsShare = Math.max(36, Math.min(68, 46 + Math.round(tierBonus / 2) + ((h >> 6) % 15) - 5));
  const importsShare = 100 - exportsShare;
  const balanceLabel =
    exportsShare >= 54
      ? "Thặng dư thương mại"
      : exportsShare <= 46
      ? "Nhập siêu đầu tư hạ tầng"
      : "Cân bằng ổn định";

  // Demographics & Urbanization (total 100%)
  const urbanPct = Math.max(22, Math.min(78, 36 + tierBonus + ((h >> 3) % 22)));
  const coastalPct = nation.biome === "CORAL_SEA" ? 32 : 12 + ((h >> 9) % 14);
  const ruralPct = Math.max(10, 100 - urbanPct - coastalPct);
  const demographicsBars = normalizeBarsTo100<EconomyBarItem>([
    { id: "demo-urban", label: "Cư dân Đô thị & Thủ phủ", percentage: urbanPct, color: "#60A5FA" },
    { id: "demo-rural", label: "Cư dân Nông thôn & Nội địa", percentage: ruralPct, color: "#34D399" },
    { id: "demo-coastal", label: "Cư dân Hải cảng & Vùng biên", percentage: coastalPct, color: "#FBBF24" }
  ]);

  const economicTierLabel =
    nation.tier === "IMPERIAL_REALM"
      ? "Trung tâm Kinh tế Siêu lục địa"
      : nation.tier === "MAJOR_STATE"
      ? "Nền kinh tế Trọng điểm Khu vực"
      : nation.tier === "SPECIAL_ZONE"
      ? "Đặc khu Lưu trữ & Học thuật Liên lục địa"
      : nation.tier === "FREE_CITY"
      ? "Thương cảng Tự do & Tài chính"
      : nation.tier === "REGIONAL_STATE"
      ? "Kinh tế Chuyên canh & Giao thương"
      : "Kinh tế Bản địa & Chuyên biệt";

  return {
    economicTierLabel,
    currencyName: cur.name,
    currencyCode: cur.code,
    exchangeRateToAurel: cur.ratePerAurel,
    sectorBreakdown,
    budgetAllocation,
    developmentMeters,
    tradeBalance: {
      exportsShare,
      importsShare,
      balanceLabel,
      majorExports: EXPORTS_BY_BIOME[nation.biome] ?? ["Nông sản bản địa", "Đồ thủ công", "Tài liệu lưu trữ"],
      majorImports: IMPORTS_BY_BIOME[nation.biome] ?? ["Lương thực", "Vật liệu xây dựng", "Sách lưu trữ"]
    },
    demographicsBars,
    customMetricBars: [
      {
        id: "cm-archive",
        group: "Tri thức & Di sản",
        label: "Mức độ Số hóa Lưu trữ Thư viện",
        value: clamp(55 + tierBonus + ((h >> 5) % 25)),
        unit: "%",
        color: "#C084FC",
        note: `Hệ thống thư mục tại ${nation.capital}`
      },
      {
        id: "cm-craft-std",
        group: "Tri thức & Di sản",
        label: "Chuẩn hóa Nghề thủ công Truyền thống",
        value: clamp(60 + ((h >> 11) % 28)),
        unit: "%",
        color: "#F59E0B",
        note: `Hội nghệ nhân khu vực ${nation.regionCode}`
      }
    ],
    economicOverviewNote: `${nation.shortName} vận hành nền kinh tế theo định hướng ${economicTierLabel.toLowerCase()}, sử dụng ${cur.name} (${cur.code}) với tỷ giá chuẩn ${cur.ratePerAurel} ${cur.code} = 1 AUR.`
  };
}

export function deriveNationEmblemConfig(nation: PlanetaryNation): EntityEmblemConfig {
  const motifByBiome: Record<AtlasBiomeId, EntityEmblemConfig["motif"]> = {
    TEMPERATE_PLAINS: "crown",
    ARID_CANYON: "sun",
    ASH_VOLCANIC: "mountain",
    SAND_DESERT: "compass",
    TROPICAL_JUNGLE: "tree",
    ALPINE_PEAKS: "mountain",
    GLACIAL_ICE: "star",
    CORAL_SEA: "waves",
    ARCHIPELAGO: "waves"
  };
  const shapeByTier: Record<PlanetaryNation["tier"], EntityEmblemConfig["shape"]> = {
    IMPERIAL_REALM: "crest",
    MAJOR_STATE: "shield",
    REGIONAL_STATE: "banner",
    PRINCIPALITY: "shield",
    FREE_CITY: "seal",
    SPECIAL_ZONE: "seal"
  };
  return {
    primaryColor: nation.color,
    secondaryColor: "#D4AF37",
    shape: shapeByTier[nation.tier] ?? "shield",
    motif: motifByBiome[nation.biome] ?? "star"
  };
}

export function createDefaultEconomyProfile(title = "Thực thể"): EntryEconomyProfile {
  return {
    economicTierLabel: "Kinh tế Bản địa & Giao thương",
    currencyName: "Đồng Hoàng Kim Aurel",
    currencyCode: "AUR",
    exchangeRateToAurel: 1.0,
    sectorBreakdown: [
      { id: "sec-agri", label: "Nông – Lâm – Ngư nghiệp", percentage: 30, color: "#10B981" },
      { id: "sec-craft", label: "Thủ công & Luyện kim", percentage: 25, color: "#F59E0B" },
      { id: "sec-trade", label: "Thương mại & Hàng hải", percentage: 25, color: "#38BDF8" },
      { id: "sec-scholar", label: "Học thuật, Lưu trữ & Dịch vụ", percentage: 20, color: "#A78BFA" }
    ],
    budgetAllocation: [
      { id: "bud-infra", label: "Hạ tầng & Giao thông", percentage: 30, color: "#38BDF8" },
      { id: "bud-edu", label: "Giáo dục & Thư viện", percentage: 25, color: "#A78BFA" },
      { id: "bud-welfare", label: "Y tế & Dân sinh", percentage: 25, color: "#F472B6" },
      { id: "bud-eco", label: "Bảo tồn Sinh thái & Dự trữ", percentage: 20, color: "#34D399" }
    ],
    developmentMeters: [
      { id: "dev-literacy", label: "Chỉ số Học vấn (Literacy)", score: 75, color: "#A78BFA", unit: "%" },
      { id: "dev-infra", label: "Độ phủ Hạ tầng Giao thông", score: 70, color: "#38BDF8", unit: "%" },
      { id: "dev-food", label: "Tự chủ Lương thực", score: 72, color: "#10B981", unit: "%" },
      { id: "dev-currency", label: "Ổn định Tiền tệ", score: 78, color: "#D4AF37", unit: "%" },
      { id: "dev-trade", label: "Kết nối Ngoại thương", score: 68, color: "#F59E0B", unit: "%" },
      { id: "dev-living", label: "Mức sống & An sinh Đô thị", score: 74, color: "#F472B6", unit: "%" }
    ],
    tradeBalance: {
      exportsShare: 52,
      importsShare: 48,
      balanceLabel: "Cân bằng ổn định",
      majorExports: ["Nông sản địa phương", "Đồ thủ công mỹ nghệ"],
      majorImports: ["Khoáng sản chế tác", "Tài liệu học thuật"]
    },
    demographicsBars: [
      { id: "demo-urban", label: "Cư dân Đô thị & Thủ phủ", percentage: 45, color: "#60A5FA" },
      { id: "demo-rural", label: "Cư dân Nông thôn & Nội địa", percentage: 40, color: "#34D399" },
      { id: "demo-coastal", label: "Cư dân Hải cảng & Vùng biên", percentage: 15, color: "#FBBF24" }
    ],
    customMetricBars: [],
    economicOverviewNote: `Hồ sơ kinh tế bách khoa của ${title}, theo dõi cơ cấu ngành, ngân sách công và chỉ số phát triển dân sinh.`
  };
}

/** Feature #10: Auto-generate Vietnamese encyclopedic economic summary paragraph */
export function generateEconomicSummaryProse(title: string, profile: EntryEconomyProfile): string {
  const topSector = [...profile.sectorBreakdown].sort((a, b) => b.percentage - a.percentage)[0];
  const topBudget = [...profile.budgetAllocation].sort((a, b) => b.percentage - a.percentage)[0];
  const literacy = profile.developmentMeters.find((m) => m.id === "dev-literacy")?.score ?? 70;
  const infra = profile.developmentMeters.find((m) => m.id === "dev-infra")?.score ?? 70;
  const exportsText = profile.tradeBalance.majorExports.length
    ? profile.tradeBalance.majorExports.join(", ")
    : "các mặt hàng bản địa";

  return (
    `**${title}** thuộc nhóm *${profile.economicTierLabel}*, lưu hành chính thức đồng **${profile.currencyName} (${profile.currencyCode})** ` +
    `(tỷ giá quy chiếu ${profile.exchangeRateToAurel} ${profile.currencyCode} = 1 AUR). ` +
    `Trong cơ cấu kinh tế, **${topSector?.label ?? "thương mại"}** giữ vai trò trụ cột với tỷ trọng **${topSector?.percentage ?? 0}%**, ` +
    `còn ngân sách công ưu tiên lớn nhất cho **${topBudget?.label ?? "hạ tầng"}** (${topBudget?.percentage ?? 0}%). ` +
    `Chỉ số học vấn đạt **${literacy}%**, độ phủ hạ tầng giao thông đạt **${infra}%** và cán cân ngoại thương ở trạng thái **${profile.tradeBalance.balanceLabel.toLowerCase()}** ` +
    `(xuất khẩu chiếm ${profile.tradeBalance.exportsShare}% tổng kim ngạch), nổi bật với các mặt hàng xuất khẩu chủ lực gồm ${exportsText}.`
  );
}

export function extractEconomySummary(entry: Entry): EntryCardProjection["economySummary"] | undefined {
  const ep = entry.economyProfile;
  if (!ep) return undefined;
  const topSector = [...ep.sectorBreakdown].sort((a, b) => b.percentage - a.percentage)[0];
  const literacy = ep.developmentMeters.find((m) => m.id === "dev-literacy")?.score ?? 0;
  const infra = ep.developmentMeters.find((m) => m.id === "dev-infra")?.score ?? 0;
  const urban = ep.demographicsBars.find((d) => d.id === "demo-urban")?.percentage ?? 0;
  return {
    primarySector: topSector?.label ?? "Đa ngành",
    literacyRate: literacy,
    infrastructureRate: infra,
    tradeBalanceRatio: ep.tradeBalance.exportsShare - ep.tradeBalance.importsShare,
    currencyCode: ep.currencyCode,
    urbanizationRate: urban
  };
}

export interface EconomyAuditIssue {
  entryId: string;
  entryTitle: string;
  severity: "warning" | "info";
  kind: "missing-economy" | "sector-sum" | "budget-sum" | "demo-sum";
  message: string;
}

/** Feature #20: Economy Consistency Auditor */
export function auditEconomyConsistency(entries: Entry[]): EconomyAuditIssue[] {
  const issues: EconomyAuditIssue[] = [];
  for (const e of entries) {
    if (e.deletedAt) continue;
    const isNation = e.entryTypeId === "type-kingdom" || e.id.startsWith("ent-nation-");
    if (!e.economyProfile) {
      if (isNation) {
        issues.push({
          entryId: e.id,
          entryTitle: e.title,
          severity: "info",
          kind: "missing-economy",
          message: "Hồ sơ quốc gia/chính thể chưa có dữ liệu Kinh tế & Hạ tầng."
        });
      }
      continue;
    }
    const secSum = e.economyProfile.sectorBreakdown.reduce((s, b) => s + b.percentage, 0);
    if (secSum !== 100) {
      issues.push({
        entryId: e.id,
        entryTitle: e.title,
        severity: "warning",
        kind: "sector-sum",
        message: `Tổng cơ cấu ngành hiện là ${secSum}% (cần chuẩn hóa về 100%).`
      });
    }
    const budSum = e.economyProfile.budgetAllocation.reduce((s, b) => s + b.percentage, 0);
    if (budSum !== 100) {
      issues.push({
        entryId: e.id,
        entryTitle: e.title,
        severity: "warning",
        kind: "budget-sum",
        message: `Tổng phân bổ ngân sách hiện là ${budSum}% (cần chuẩn hóa về 100%).`
      });
    }
    const demoSum = e.economyProfile.demographicsBars.reduce((s, b) => s + b.percentage, 0);
    if (demoSum !== 100) {
      issues.push({
        entryId: e.id,
        entryTitle: e.title,
        severity: "warning",
        kind: "demo-sum",
        message: `Tổng cơ cấu dân cư hiện là ${demoSum}% (cần chuẩn hóa về 100%).`
      });
    }
  }
  return issues;
}
