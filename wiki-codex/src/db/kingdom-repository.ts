import fs from "fs";
import path from "path";
import type { UserRole } from "@/types/codex";
import type {
  KingdomCustomFieldDef,
  KingdomCustomFieldValue,
  KingdomEconomyYear,
  KingdomHydratedDossier,
  KingdomListProjection,
  KingdomPolityType,
  KingdomPopulationYear,
  KingdomRelationKind,
  KingdomRelationRecord,
  KingdomStatisticItem,
  KingdomVersionRecord
} from "@/types/kingdom-codex";
import { buildPlanetaryAtlasBundle } from "@/lib/planetary-atlas/generator";
import { BIOME_META } from "@/lib/planetary-atlas/climate-geology";
import { CONTINENT_NAME_VI } from "@/lib/planetary-atlas/nations-data";
import type { DiplomacyStatus, PlanetaryNation } from "@/lib/planetary-atlas/types";
import {
  buildNationEconomyProfile,
  deriveNationEmblemConfig
} from "@/lib/economy-engine";
import { matchesVietnameseQuery, normalizeVietnamese } from "@/lib/vietnamese";
import { escapeCsvCell, nextSequentialId } from "@/lib/character-id";
import { canViewAccessLevel, loadCharacterState } from "./character-repository";
import { getPostgresPool, isPostgresConfigured } from "./pool";

const LOCAL_DATA_DIR = path.join(process.cwd(), ".data");
const LOCAL_KINGDOM_FILE = path.join(LOCAL_DATA_DIR, "kingdom-codex.json");

interface KingdomOverlayStore {
  /** Overrides for KING-000001..000360 AND newly created KING-000361+ */
  customDossiers: Record<string, KingdomHydratedDossier>;
  deletedIds: string[];
  versions: KingdomVersionRecord[];
  customFieldDefs: KingdomCustomFieldDef[];
  customFieldValues: KingdomCustomFieldValue[];
}

let cachedOverlay: KingdomOverlayStore | null = null;
let cachedBase360: Map<string, KingdomHydratedDossier> | null = null;
let pgKingdomInit = false;

function kingIdForNum(num: number): string {
  return `KING-${String(num).padStart(6, "0")}`;
}

function mapPolityType(gov: string, tier: PlanetaryNation["tier"]): KingdomPolityType {
  const g = gov.toLowerCase();
  if (tier === "SPECIAL_ZONE") return "special_zone";
  if (tier === "FREE_CITY") return "city_state";
  if (tier === "PRINCIPALITY") return "principality";
  if (g.includes("đế chế")) return "empire";
  if (g.includes("liên bang")) return "federation";
  if (g.includes("cộng hòa")) return "republic";
  if (g.includes("thần quyền")) return "theocracy";
  return "kingdom";
}

function mapDevLevel(tier: PlanetaryNation["tier"]): KingdomHydratedDossier["kingdom"]["developmentLevel"] {
  if (tier === "IMPERIAL_REALM") return "superpower";
  if (tier === "MAJOR_STATE" || tier === "SPECIAL_ZONE") return "developed";
  if (tier === "REGIONAL_STATE" || tier === "FREE_CITY") return "developing";
  if (tier === "PRINCIPALITY") return "emerging";
  return "frontier";
}

function mapDiplomacyKind(st: DiplomacyStatus): KingdomRelationKind {
  switch (st) {
    case "ALLIANCE":
      return "alliance";
    case "FEDERATION":
      return "strategic_partner";
    case "TRADE_PACT":
      return "trade_partner";
    case "DISPUTED":
      return "territorial_dispute";
    case "RIVALRY":
      return "rival";
    default:
      return "neutral";
  }
}

function tierForScore(score: number): string {
  if (score >= 88) return "Hạng S (Đỉnh cao)";
  if (score >= 76) return "Hạng A (Vững mạnh)";
  if (score >= 62) return "Hạng B (Ổn định)";
  if (score >= 48) return "Hạng C (Đang phát triển)";
  return "Hạng D (Sơ khai)";
}

/** Lazily builds all 360 real kingdoms from Aethelgard Prime Atlas + Economy Engine */
function getBase360Kingdoms(): Map<string, KingdomHydratedDossier> {
  if (cachedBase360) return cachedBase360;

  const bundle = buildPlanetaryAtlasBundle();
  const byAtlasId = new Map(bundle.nations.map((n) => [n.id, n]));
  const map = new Map<string, KingdomHydratedDossier>();
  const now = "2026-11-23T08:00:00.000Z";

  // Known Character Codex rulers linked strictly by Character ID (zero duplication)
  const knownCharRulerByNum: Record<number, { charId: string; roleTitle: string; dynasty: string }> = {
    1: { charId: "CHAR-000001", roleTitle: "Đại Học Giả & Cố vấn Tối cao Vương thất", dynasty: "Hội đồng Vaelor" },
    2: { charId: "CHAR-000003", roleTitle: "Đại Hộ Vệ & Thống lĩnh Thương lộ", dynasty: "Hội đồng Đá Đỏ" },
    3: { charId: "CHAR-000002", roleTitle: "Nguyên Lão Trưởng Kỹ Nghệ", dynasty: "Nguyên Lão Viện Ignisia" }
  };

  for (const n of bundle.nations) {
    const id = kingIdForNum(n.nationNum);
    const ep = buildNationEconomyProfile(n);
    const emblem = deriveNationEmblemConfig(n);
    const biomeLabel = BIOME_META[n.biome].label;
    const continentName = CONTINENT_NAME_VI[n.continent] || n.continent;

    const lit = ep.developmentMeters.find((m) => m.id === "dev-literacy")?.score ?? 70;
    const inf = ep.developmentMeters.find((m) => m.id === "dev-infra")?.score ?? 68;
    const food = ep.developmentMeters.find((m) => m.id === "dev-food")?.score ?? 70;
    const curStab = ep.developmentMeters.find((m) => m.id === "dev-currency")?.score ?? 72;
    const tradeConn = ep.developmentMeters.find((m) => m.id === "dev-trade")?.score ?? 68;
    const living = ep.developmentMeters.find((m) => m.id === "dev-living")?.score ?? 70;

    const urbanPct = ep.demographicsBars.find((d) => d.id === "demo-urban")?.percentage ?? 45;
    const agriPct = ep.sectorBreakdown.find((s) => s.id === "sec-agri")?.percentage ?? 25;
    const indPct = ep.sectorBreakdown.find((s) => s.id === "sec-craft")?.percentage ?? 25;
    const tradePct = ep.sectorBreakdown.find((s) => s.id === "sec-trade")?.percentage ?? 25;
    const servPct = ep.sectorBreakdown.find((s) => s.id === "sec-scholar")?.percentage ?? 25;

    const gdpBase = Math.max(120, Math.round((n.population / 1000) * (0.45 + living / 120)));
    const density = n.areaKm2 > 0 ? Number((n.population / n.areaKm2).toFixed(1)) : 12;

    const popHistory: KingdomPopulationYear[] = [
      {
        id: `pop-${n.nationNum}-600`,
        kingdomId: id,
        year: 600,
        totalPopulation: Math.round(n.population * 0.56),
        densityPerKm2: Number((density * 0.56).toFixed(1)),
        races: [{ name: `Cư dân bản địa ${n.shortName}`, pct: 74 }, { name: "Cư dân giao thương liên lục địa", pct: 26 }],
        ethnicGroups: [n.primaryLanguage],
        avgLifespan: 64,
        ageStructure: "Trẻ hóa ổn định",
        socialClasses: ["Học giả", "Thương nhân", "Nghệ nhân", "Nông – Ngư dân"],
        urbanizationPct: Math.max(15, urbanPct - 14),
        ruralPct: Math.min(85, 100 - Math.max(15, urbanPct - 14)),
        languages: [n.primaryLanguage],
        religions: [`Tín ngưỡng Tinh tú ${continentName}`],
        customs: [`Lễ hội Giao mùa ${n.capital}`],
        traditions: ["Lưu trữ gia phả và văn khố địa phương"],
        festivals: ["Đại lễ Khai xuân", "Ngày Hội Thương đoàn"],
        educationSummary: `Hệ thống trường học sơ khai quanh ${n.capital}.`,
        healthcareSummary: "Y học thảo mộc truyền thống.",
        socialWelfare: "Quỹ cứu tế cộng đồng địa phương.",
        qualityOfLife: "Trung bình khá",
        socialIssues: ["Chênh lệch hạ tầng nội địa và thủ đô"]
      },
      {
        id: `pop-${n.nationNum}-750`,
        kingdomId: id,
        year: 750,
        totalPopulation: Math.round(n.population * 0.82),
        densityPerKm2: Number((density * 0.82).toFixed(1)),
        races: [{ name: `Cư dân bản địa ${n.shortName}`, pct: 70 }, { name: "Cư dân giao thương liên lục địa", pct: 30 }],
        ethnicGroups: [n.primaryLanguage],
        avgLifespan: 71,
        ageStructure: "Cơ cấu dân số vàng",
        socialClasses: ["Học giả", "Thương nhân", "Nghệ nhân", "Nông – Ngư dân"],
        urbanizationPct: Math.max(20, urbanPct - 6),
        ruralPct: Math.min(80, 100 - Math.max(20, urbanPct - 6)),
        languages: [n.primaryLanguage, "Cổ ngữ Aethel'va"],
        religions: [`Tín ngưỡng Tinh tú ${continentName}`],
        customs: [`Lễ hội Giao mùa ${n.capital}`],
        traditions: ["Chuẩn hóa đo lường & thư viện công cộng"],
        festivals: ["Đại lễ Hiệp ước", "Lễ hội Học thuật"],
        educationSummary: `Mở rộng thư viện công cộng tại ${n.regionName}.`,
        healthcareSummary: "Mạng lưới y viện đô thị và vùng biên.",
        socialWelfare: "Quỹ bảo trợ học bổng và dự trữ lương thực.",
        qualityOfLife: "Khá cao",
        socialIssues: ["Tốc độ đô thị hóa nhanh"]
      },
      {
        id: `pop-${n.nationNum}-800`,
        kingdomId: id,
        year: 800,
        totalPopulation: n.population,
        densityPerKm2: density,
        races: [{ name: `Cư dân bản địa ${n.shortName}`, pct: 68 }, { name: "Cư dân giao thương liên lục địa", pct: 32 }],
        ethnicGroups: [n.primaryLanguage],
        avgLifespan: 76,
        ageStructure: "Ổn định, tỷ lệ lao động tri thức cao",
        socialClasses: ["Học giả & Kỹ sư", "Thương nhân", "Nghệ nhân", "Cư dân nông nghiệp"],
        urbanizationPct: urbanPct,
        ruralPct: 100 - urbanPct,
        languages: [n.primaryLanguage, "Cổ ngữ Aethel'va"],
        religions: [`Tín ngưỡng Tinh tú ${continentName}`],
        customs: [`Hiến chương Cộng đồng ${n.shortName}`],
        traditions: ["Hội nghị Học giả & Thương đoàn thường niên"],
        festivals: ["Ngày Quốc khánh", "Lễ hội Ánh sao"],
        educationSummary: `Chỉ số học vấn đạt ${lit}%, phủ rộng thư viện khắp ${n.regionName}.`,
        healthcareSummary: "Hệ thống y viện công lập hiện đại.",
        socialWelfare: "An sinh đô thị và quỹ cứu trợ thiên tai.",
        qualityOfLife: living >= 80 ? "Cao" : "Ổn định",
        socialIssues: ["Cân bằng phát triển đô thị và bảo tồn sinh thái"]
      }
    ];

    const econHistory: KingdomEconomyYear[] = [600, 750, 800].map((yr, idx) => {
      const mult = idx === 0 ? 0.48 : idx === 1 ? 0.78 : 1;
      const gdpVal = Math.round(gdpBase * mult);
      return {
        id: `eco-${n.nationNum}-${yr}`,
        kingdomId: id,
        year: yr,
        gdpValue: gdpVal,
        gdpLabel: `${gdpVal.toLocaleString("vi-VN")} triệu ${ep.currencyCode}`,
        gdpPerCapitaLabel: `${Math.round((gdpVal * 1_000_000) / Math.max(1, n.population * (idx === 0 ? 0.56 : idx === 1 ? 0.82 : 1))).toLocaleString("vi-VN")} ${ep.currencyCode}`,
        totalBudget: `${Math.round(gdpVal * 0.24).toLocaleString("vi-VN")} triệu ${ep.currencyCode}`,
        budgetRevenue: `${Math.round(gdpVal * 0.25).toLocaleString("vi-VN")} triệu ${ep.currencyCode}`,
        budgetExpenditure: `${Math.round(gdpVal * 0.23).toLocaleString("vi-VN")} triệu ${ep.currencyCode}`,
        publicDebt: `${Math.round(18 + (n.nationNum % 22))}% GDP`,
        inflationPct: Number((1.4 + (n.nationNum % 24) * 0.1).toFixed(1)),
        unemploymentPct: Number((2.8 + (n.nationNum % 18) * 0.15).toFixed(1)),
        tradeBalanceLabel: ep.tradeBalance.balanceLabel,
        exportsShare: ep.tradeBalance.exportsShare,
        importsShare: ep.tradeBalance.importsShare,
        majorExports: ep.tradeBalance.majorExports,
        majorImports: ep.tradeBalance.majorImports,
        taxSystem: "Thuế thương mại công bằng & thuế tài nguyên theo bậc",
        currencyCode: ep.currencyCode,
        currencyValueNote: `1 AUR = ${ep.exchangeRateToAurel} ${ep.currencyCode}`,
        centralBank: `Ngân Khố Trung Ương ${n.capital}`,
        bankingSystem: `Hệ thống tín dụng liên lục địa khối ${n.bloc}`,
        financialMarket: `Sàn Giao dịch Thương phẩm ${n.capital}`,
        agriculturePct: agriPct,
        industryPct: indPct,
        tradePct: tradePct,
        servicesPct: servPct,
        miningNote: `Khai thác có kiểm soát tại địa hình ${biomeLabel.toLowerCase()}.`,
        energyNote: "Kết hợp thủy năng, gió và năng lượng bản địa.",
        tourismNote: `Điểm đến học thuật và di sản tại ${n.capital}.`,
        majorCorporations: [`Hiệp hội Thương thuyền ${n.shortName}`, `Phường hội Chế tác ${n.capital}`],
        merchantFamilies: [`Gia tộc Thương mại ${n.shortName}`],
        wealthLevel: ep.economicTierLabel,
        economicSelfSufficiency: food
      };
    });

    // Real relations from bundle.diplomacy
    const relations: KingdomRelationRecord[] = bundle.diplomacy
      .filter((d) => d.polityAId === n.id || d.polityBId === n.id)
      .slice(0, 12)
      .map((d, idx) => {
        const otherId = d.polityAId === n.id ? d.polityBId : d.polityAId;
        const other = byAtlasId.get(otherId);
        const relType = mapDiplomacyKind(d.status);
        const intensity =
          relType === "alliance"
            ? 90
            : relType === "strategic_partner"
            ? 78
            : relType === "trade_partner"
            ? 65
            : relType === "territorial_dispute"
            ? -45
            : relType === "rival"
            ? -60
            : 15;
        return {
          id: `KREL-${String(n.nationNum).padStart(3, "0")}-${String(idx + 1).padStart(2, "0")}`,
          workspaceId: "ws-aethelgard",
          kingdomAId: id,
          kingdomBId: other ? kingIdForNum(other.nationNum) : otherId,
          kingdomBName: other ? other.name : otherId,
          relationType: relType,
          intensity,
          startDate: `Mốc ${d.fromTick}`,
          endDate: "",
          originCause: d.treatyTitle,
          historyChanges: [{ period: `Mốc ${d.fromTick}`, note: `Thiết lập ${d.treatyTitle}` }],
          relatedEventId: null,
          currentStatus: "active",
          accessLevel: "public",
          verificationStatus: "official"
        };
      });

    // 14 Independent Statistics with timestamps & sources
    const statistics: KingdomStatisticItem[] = [
      { key: "territory_scale", label: "Quy mô Lãnh thổ", score: Math.min(99, Math.max(20, Math.round(Math.log10(Math.max(100, n.areaKm2)) * 14))), tierLabel: tierForScore(Math.min(99, Math.round(Math.log10(Math.max(100, n.areaKm2)) * 14))), rawValue: `${n.areaKm2.toLocaleString("vi-VN")} km²`, evaluatedAt: "Năm 800", sourceNote: "Trắc địa Đại Bản Đồ 360" },
      { key: "population_scale", label: "Quy mô Dân số", score: Math.min(99, Math.max(18, Math.round(Math.log10(Math.max(1000, n.population)) * 12))), tierLabel: tierForScore(Math.min(99, Math.round(Math.log10(Math.max(1000, n.population)) * 12))), rawValue: `${n.population.toLocaleString("vi-VN")} người`, evaluatedAt: "Năm 800", sourceNote: "Tổng điều tra Dân số 8 Lục địa" },
      { key: "economic_power", label: "Sức mạnh Kinh tế", score: Math.round((tradeConn + curStab) / 2), tierLabel: tierForScore(Math.round((tradeConn + curStab) / 2)), rawValue: `${gdpBase.toLocaleString("vi-VN")}M ${ep.currencyCode}`, evaluatedAt: "Năm 800", sourceNote: "Niên giám Kinh tế Aethelgard" },
      { key: "political_stability", label: "Ổn định Chính trị", score: curStab, tierLabel: tierForScore(curStab), evaluatedAt: "Năm 800", sourceNote: "Hội đồng Hòa giải Concordia" },
      { key: "governance_capacity", label: "Năng lực Quản trị", score: Math.round((lit + curStab) / 2), tierLabel: tierForScore(Math.round((lit + curStab) / 2)), evaluatedAt: "Năm 800", sourceNote: "Báo cáo Hành chính Liên lục địa" },
      { key: "tech_level", label: "Trình độ Công nghệ", score: Math.round((inf + indPct + 25) / 2), tierLabel: tierForScore(Math.round((inf + indPct + 25) / 2)), evaluatedAt: "Năm 800", sourceNote: "Viện Kỹ nghệ Aethelgard" },
      { key: "scientific_capacity", label: "Năng lực Khoa học", score: lit, tierLabel: tierForScore(lit), evaluatedAt: "Năm 800", sourceNote: "Học Viện Ngã Ba Tam Biên" },
      { key: "diplomatic_influence", label: "Ảnh hưởng Ngoại giao", score: tradeConn, tierLabel: tierForScore(tradeConn), rawValue: `${relations.length} quan hệ chính thức`, evaluatedAt: "Năm 800", sourceNote: "Văn khố Hiệp ước Concordia" },
      { key: "defense_capability", label: "Năng lực Quốc phòng", score: Math.min(96, Math.max(45, Math.round((inf + curStab) / 2))), tierLabel: tierForScore(Math.round((inf + curStab) / 2)), evaluatedAt: "Năm 800", sourceNote: "Đánh giá An ninh Khu vực" },
      { key: "infrastructure_dev", label: "Phát triển Hạ tầng", score: inf, tierLabel: tierForScore(inf), evaluatedAt: "Năm 800", sourceNote: "Cục Giao thông & Hải cảng" },
      { key: "education_quality", label: "Chất lượng Giáo dục", score: lit, tierLabel: tierForScore(lit), rawValue: `Biết chữ ${lit}%`, evaluatedAt: "Năm 800", sourceNote: "Hội đồng Thư viện 360" },
      { key: "living_standard", label: "Chất lượng Đời sống", score: living, tierLabel: tierForScore(living), evaluatedAt: "Năm 800", sourceNote: "Báo cáo Dân sinh Đô thị" },
      { key: "cultural_strength", label: "Sức mạnh Văn hóa", score: Math.min(97, Math.round((lit + living) / 2)), tierLabel: tierForScore(Math.round((lit + living) / 2)), evaluatedAt: "Năm 800", sourceNote: "Viện Di sản 8 Lục địa" },
      { key: "magic_potential", label: "Tiềm lực Ma pháp / Siêu nhiên", score: Math.min(95, 45 + ((n.nationNum * 17) % 48)), tierLabel: tierForScore(45 + ((n.nationNum * 17) % 48)), evaluatedAt: "Năm 800", sourceNote: "Khảo sát Năng lượng Cổ đại" }
    ];

    const knownRuler = knownCharRulerByNum[n.nationNum];

    const dossier: KingdomHydratedDossier = {
      kingdom: {
        id,
        workspaceId: "ws-aethelgard",
        officialName: n.name,
        commonName: n.shortName,
        ancientName: `Cổ quốc ${n.shortName}`,
        nativeName: n.shortName,
        abbreviation: n.regionCode,
        historicalAliases: [n.shortName, `Xứ ${n.capital}`],
        polityType: mapPolityType(n.governmentType, n.tier),
        governmentType: n.governmentType,
        currentStatus: "sovereign",
        developmentLevel: mapDevLevel(n.tier),
        foundedDate: n.foundingEra,
        ageYears: Math.max(100, 1000 - n.validFromTick),
        officialLanguages: [n.primaryLanguage],
        currencyCode: ep.currencyCode,
        currencyName: ep.currencyName,
        timezone: `AET${n.x >= 0.5 ? "+" : "-"}${Math.round(Math.abs(n.x - 0.5) * 24)}`,
        countryCode: `${n.regionCode}-${n.nationNum}`,
        continent: continentName,
        bloc: n.bloc,
        tags: [n.regionCode.toLowerCase(), n.continent.toLowerCase(), ...(n.isTriBorder ? ["lien-minh-tam-bien"] : [])],
        categories: [continentName, n.bloc],
        summary: n.summary,
        motto: `Tri thức bền vững, thịnh vượng cùng ${n.capital}.`,
        workflowStatus: "published",
        accessLevel: "public",
        spoilerLabel: "",
        verificationStatus: "official",
        linkedWikiEntryId: `ent-nation-${n.nationNum}`,
        linkedAtlasNationId: n.id,
        nationNum: n.nationNum,
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: now,
        updatedAt: now,
        deletedAt: null
      },
      symbols: {
        kingdomId: id,
        flagUrl: "",
        coatOfArmsUrl: "",
        emblemConfig: emblem,
        anthemTitle: `Khúc Ca ${n.shortName}`,
        anthemLyrics: `Vang danh ${n.capital} dưới bầu trời tinh tú Aethelgard Prime...`,
        nationalSeal: `Quốc ấn ${n.shortName}`,
        royalSymbol: `Huy hiệu ${n.bloc}`,
        nationalMascot: n.biome === "CORAL_SEA" ? "Hải âu Bạch kim" : n.biome === "ALPINE_PEAKS" ? "Đại bàng Sơn mạch" : "Sư tử Tinh tú",
        representativeColors: [n.color, "#D4AF37"],
        capitalImageUrl: "",
        coverImageUrl: "",
        thumbImageUrl: "",
        mapImageUrl: ""
      },
      territory: {
        kingdomId: id,
        geoLocation: `${n.latLabel}, ${n.lonLabel} (${continentName})`,
        areaKm2: n.areaKm2,
        borderDescription: `Giáp ranh ${n.neighbors.length} quốc gia thuộc khu vực ${n.regionName}.`,
        neighborKingdomIds: n.neighbors
          .map((nid) => byAtlasId.get(nid))
          .filter((x): x is PlanetaryNation => Boolean(x))
          .map((x) => kingIdForNum(x.nationNum)),
        capitalCityId: `CITY-${String(n.nationNum).padStart(6, "0")}`,
        capitalName: n.capital,
        terrainSummary: `${biomeLabel}, cao độ trung bình ${n.elevationM.toLocaleString("vi-VN")} m.`,
        mountainsRiversSeas: `Hệ thống sông núi tự nhiên vùng ${n.regionName}.`,
        climateSummary: `Nhiệt độ trung bình ${n.avgTempC}°C (${biomeLabel}).`,
        avgTempC: n.avgTempC,
        elevationM: n.elevationM,
        naturalResources: ep.tradeBalance.majorExports,
        strategicZones: [`Hành lang Thủ đô ${n.capital}`],
        disputedRegions: [],
        overseasTerritories: [],
        autonomousRegions: [],
        specialZones: n.isTriBorder ? ["Hành lang Liên minh Tam Biên"] : [],
        atlasSvgPath: n.svgPath,
        atlasBbox: n.bbox
      },
      regions: [
        {
          id: `CITY-${String(n.nationNum).padStart(6, "0")}`,
          kingdomId: id,
          kind: "capital",
          name: n.capital,
          population: Math.round(n.population * 0.18),
          description: `Thủ đô hành chính, văn hóa và trung tâm thư viện của ${n.shortName}.`,
          linkedWikiEntryId: `ent-nation-${n.nationNum}`
        },
        {
          id: `REG-${String(n.nationNum).padStart(6, "0")}`,
          kingdomId: id,
          kind: "province",
          name: `Nội địa ${n.regionName}`,
          population: Math.round(n.population * 0.82),
          description: `Vùng lãnh thổ chính địa hình ${biomeLabel.toLowerCase()}.`
        }
      ],
      populationHistory: popHistory,
      government: {
        kingdomId: id,
        politicalSystem: n.governmentType,
        stateStructure: "Thống nhất có phân cấp tự quản địa phương",
        constitution: `Hiến chương ${n.shortName}`,
        lawSystem: `Bộ Luật Dân sự & Thương mại ${n.shortName}`,
        legislature: `Nghị viện / Hội đồng Lập pháp ${n.shortName}`,
        executive: `Nội các Hành chính ${n.capital}`,
        judiciary: `Tòa án Tối cao ${n.capital}`,
        administrativeSystem: "Chia theo Đặc khu Thủ đô, Tỉnh nội địa và Hành lang biên giới",
        successionMechanism: n.governmentType.toLowerCase().includes("quân chủ") ? "Kế vị theo Hiến pháp Vương thất" : "Bầu cử định kỳ theo nhiệm kỳ",
        electionMechanism: "Đại hội Cử tri & Hội đồng Học giả giám sát",
        centralPower: `Đặt tại ${n.capital}`,
        localPower: "Hội đồng Tỉnh và Đô thị",
        nationalPolicies: ["Mở rộng giáo dục & thư viện", "Thông thương hòa bình liên lục địa"],
        bureaucracySystem: "Tuyển chọn qua khảo hạch hành chính minh bạch",
        politicalFactions: ["Phái Cải cách Thông thương", "Phái Bảo tồn Truyền thống"],
        politicalParties: [],
        governanceApparatus: "Chính quyền điện tử & văn khố lưu trữ tập trung",
        politicalStability: curStab >= 75 ? "Rất ổn định" : "Ổn định"
      },
      rulers: knownRuler
        ? [
            {
              id: `rul-${n.nationNum}-1`,
              kingdomId: id,
              characterId: knownRuler.charId,
              fallbackName: "",
              roleTitle: knownRuler.roleTitle,
              dynasty: knownRuler.dynasty,
              reignStart: "Năm 780",
              reignEnd: "Hiện tại",
              predecessorName: `Hội đồng Tiền nhiệm ${n.shortName}`,
              successorName: "Đang đương nhiệm",
              isCurrent: true,
              note: "Liên kết trực tiếp từ Character Codex qua Character ID."
            }
          ]
        : [
            {
              id: `rul-${n.nationNum}-1`,
              kingdomId: id,
              characterId: null,
              fallbackName: `Hội đồng Lãnh đạo ${n.shortName}`,
              roleTitle: "Nguyên thủ / Cơ quan Đứng đầu",
              dynasty: `Thể chế ${n.governmentType}`,
              reignStart: "Năm 785",
              reignEnd: "Hiện tại",
              predecessorName: "Tiền nhiệm",
              successorName: "Đang đương nhiệm",
              isCurrent: true,
              note: "Có thể gắn Character ID (CHAR-XXXXXX) bất kỳ lúc nào trong trình Chỉnh sửa."
            }
          ],
      economyHistory: econHistory,
      military: {
        kingdomId: id,
        totalForceScale: `Lực lượng phòng vệ thường trực ~${Math.max(5000, Math.round(n.population * 0.004)).toLocaleString("vi-VN")} quân nhân`,
        armyOverview: "Đội vệ binh lục địa bảo vệ biên giới và tuyến thương lộ.",
        navyOverview: n.biome === "CORAL_SEA" || n.biome === "ARCHIPELAGO" ? "Hạm đội tuần tra hải dương và hộ tống thương thuyền." : "Đội tuần tra sông hồ nội địa.",
        airForceOverview: "Đội khinh khí cầu trinh sát khí tượng và truyền tin.",
        specialForces: "Đội cứu hộ & bảo vệ di sản văn khố.",
        royalGuard: `Vệ binh Nghi lễ ${n.capital}`,
        defenseForce: "Lực lượng dân phòng ứng phó thiên tai.",
        intelligenceAgency: `Cục Thông tin Ngoại giao ${n.capital}`,
        securityAgency: "An ninh trật tự đô thị.",
        highCommand: `Bộ Tổng Tham mưu Phòng vệ ${n.shortName}`,
        rankSystem: "Chuẩn cấp bậc 6 tầng khối liên lục địa.",
        militaryAcademies: [`Học viện Chỉ huy & Chiến lược ${n.capital}`],
        defenseDoctrine: "Phòng thủ hòa bình, bảo vệ thương lộ và liên minh khu vực.",
        defenseCapability: "Ổn định, ưu tiên phòng ngự địa hình.",
        militaryTech: "Công nghệ phòng thủ quang học và thông tin tầm xa.",
        iconicEquipment: ["Hệ thống hải đăng báo hiệu", "Tàu hộ tống thương đoàn"],
        commanderCharacterIds: knownRuler ? [knownRuler.charId] : [],
        organizationHistory: `Thành lập cùng thời kỳ lập quốc (${n.foundingEra}).`,
        historicalConflicts: ["Tham gia bảo vệ tuyến thương mại trước hải tặc cổ đại."]
      },
      technology: {
        kingdomId: id,
        civilizationLevel: n.tier === "IMPERIAL_REALM" ? "Văn minh Học thuật – Kỹ nghệ Bậc Cao" : "Văn minh Đô thị Phát triển",
        techLevel: `Độ phủ hạ tầng kỹ thuật ${inf}%`,
        naturalSciences: "Thiên văn học, trắc địa và thực vật học.",
        engineering: "Kỹ thuật cầu đường, thủy lợi và kiến trúc đá.",
        medicine: "Kết hợp dược thảo bản địa và y học chuẩn hóa.",
        transportationTech: "Thương thuyền viễn dương, xe lửa hơi nước nhẹ và mạng đường đá.",
        energyTech: n.biome === "ASH_VOLCANIC" ? "Địa nhiệt lõi đất sạch" : "Thủy năng, gió và quang năng.",
        informationTech: "Hệ thống thư mục lưu trữ và trạm tín hiệu quang học.",
        manufacturingTech: "Phường hội cơ khí chính xác và chế tác vật liệu.",
        defenseTech: "Lá chắn địa hình và tháp quan trắc biên giới.",
        magicSystem: "Quang năng học thuật & cổ ngữ ứng dụng (mức cân bằng).",
        supernaturalEnergy: "Năng lượng tinh tú thiên nhiên.",
        magicAcademies: [`Phân viện Nghiên cứu Cổ ngữ ${n.capital}`],
        researchProjects: ["Chuẩn hóa khí hậu 4 mùa", "Số hóa văn khố 360 quốc gia"],
        notableInventions: [`Kỹ thuật đặc trưng vùng ${n.regionName}`],
        exclusiveTech: ep.tradeBalance.majorExports.slice(0, 2),
        ancientTechLegacy: `Di tích trắc địa cổ tại ${n.regionName}.`
      },
      culture: {
        kingdomId: id,
        culturalIdentity: `Bản sắc ${biomeLabel} kết hợp tinh thần cởi mở của khối ${n.bloc}.`,
        royalCulture: "Nghi lễ trang trọng gắn với âm nhạc và văn hiến.",
        folkCulture: "Đậm đà lễ hội mùa vụ và nghề thủ công truyền thống.",
        arts: "Điêu khắc, vẽ bản đồ nghệ thuật và gốm sứ.",
        music: "Nhạc cụ dây và hòa tấu cung đình.",
        literature: `Biên niên sử và thi ca bằng ngôn ngữ ${n.primaryLanguage}.`,
        architecture: `Kiến trúc thích ứng địa hình ${biomeLabel.toLowerCase()}.`,
        cuisine: "Ẩm thực phong phú từ nông sản và sản vật bản địa.",
        traditionalDress: "Trang phục dệt thủ công theo màu sắc đại diện quốc gia.",
        martialTraditions: "Võ đạo nghi lễ đề cao kỷ luật và tự vệ.",
        educationSystem: `Giáo dục phổ cập với tỷ lệ biết chữ ${lit}%.`,
        universitiesAndAcademies: [`Đại học Quốc gia ${n.capital}`],
        religions: [`Tín ngưỡng Tinh tú ${continentName}`],
        mythology: `Truyền thuyết lập quốc ${n.shortName}.`,
        historicalMonuments: [`Quảng trường Hiến chương ${n.capital}`],
        culturalHeritage: [`Kho Cổ thư ${n.capital}`],
        nationalHolidays: ["Ngày Lập quốc", "Lễ hội Mùa gặt"]
      },
      infrastructure: {
        kingdomId: id,
        transportSystem: `Mạng lưới kết nối liên tỉnh với độ phủ ${inf}%.`,
        roads: `Quốc lộ lát đá nối ${n.capital} với ${n.neighbors.length} cửa khẩu láng giềng.`,
        railways: "Tuyến vận tải hàng hóa nối vùng nguyên liệu về thủ đô.",
        seaports: n.biome === "CORAL_SEA" || n.biome === "ARCHIPELAGO" ? `Cảng viễn dương ${n.capital}` : "Cảng sông nội địa",
        airports: "Bãi đáp khí cầu quan trắc và bưu chính.",
        energyGrid: "Mạng lưới chiếu sáng công cộng và sưởi ấm đô thị.",
        waterSupply: "Hệ thống dẫn nước sạch và thủy lợi.",
        telecom: "Tháp tín hiệu quang học liên tỉnh.",
        hospitalsAndSchools: "Phủ đều khắp quận thủ đô và các tỉnh.",
        industrialZones: `Khu chế tác thủ công và luyện kim ngoại ô ${n.capital}.`,
        tradeCenters: `Chợ Lớn Liên lục địa ${n.capital}`,
        publicWorks: "Thư viện công cộng, công viên và đê điều.",
        iconicLandmarks: [`Đại Sảnh ${n.capital}`, `Tháp Quan Trắc ${n.shortName}`],
        developmentScore: inf
      },
      resources: ep.tradeBalance.majorExports.map((resName, idx) => ({
        id: `KAST-${n.nationNum}-${idx + 1}`,
        kingdomId: id,
        kind: idx === 0 ? "natural" : "mineral",
        name: resName,
        regionName: n.regionName,
        description: `Nguồn tài nguyên xuất khẩu trọng điểm của ${n.shortName}.`,
        verificationStatus: "official"
      })),
      statistics,
      relations,
      treaties: relations.slice(0, 3).map((r, idx) => ({
        id: `TRT-${n.nationNum}-${idx + 1}`,
        kingdomId: id,
        title: r.originCause,
        signedDate: r.startDate,
        partnerNames: [r.kingdomBName],
        termsSummary: `Hiệp định ${r.relationType} giữa ${n.shortName} và ${r.kingdomBName}.`,
        status: "active"
      })),
      events: [
        {
          id: `EVT-${n.nationNum}-1`,
          kingdomId: id,
          category: "founding",
          title: `Thành lập ${n.name}`,
          year: n.validFromTick,
          era: n.foundingEra,
          location: n.capital,
          participantCharacterIds: [],
          cause: "Hợp nhất các cộng đồng cư dân đầu tiên tại khu vực.",
          summary: `Định hình thể chế ${n.governmentType} và đặt kinh đô tại ${n.capital}.`,
          outcome: `Ra đời quốc gia ${n.shortName}.`,
          longTermImpact: "Đặt nền móng văn hóa và ngôn ngữ bản địa.",
          accessLevel: "public",
          verificationStatus: "official"
        },
        {
          id: `EVT-${n.nationNum}-2`,
          kingdomId: id,
          category: "peace_treaty",
          title: `Gia nhập Khối ${n.bloc}`,
          year: 780,
          era: "Kỷ Nguyên Hiệp Ước",
          location: n.capital,
          participantCharacterIds: knownRuler ? [knownRuler.charId] : [],
          cause: "Mở rộng giao thương và hợp tác học thuật liên lục địa.",
          summary: `Ký kết các hiệp định thương mại và chuẩn hóa tiền tệ ${ep.currencyCode}.`,
          outcome: "Tăng trưởng ngoại thương ổn định.",
          longTermImpact: "Hội nhập sâu vào mạng lưới 360 quốc gia.",
          accessLevel: "public",
          verificationStatus: "official"
        }
      ],
      achievements: [
        {
          id: `KACH-${n.nationNum}-1`,
          kingdomId: id,
          category: "cultural",
          title: `Chuẩn hóa Văn khố & Giáo dục ${n.shortName}`,
          dateLabel: "Năm 790",
          description: `Đưa chỉ số học vấn quốc gia đạt ${lit}% và kết nối thư viện toàn hành tinh.`,
          verificationStatus: "official"
        }
      ],
      images: [],
      sources: [
        {
          id: `KSRC-${n.nationNum}-1`,
          kingdomId: id,
          title: `Niên giám Địa chính trị Aethelgard Prime — Hồ sơ #${n.nationNum}`,
          author: "Học Viện Ngã Ba Tam Biên",
          url: "",
          updatedAt: now,
          editorName: "Đại Học Giả (Admin)",
          verificationStatus: "official",
          editorialNote: "Đồng bộ tự động từ dữ liệu Bản đồ Đại Hành Tinh 360 Quốc gia."
        }
      ],
      customFields: []
    };

    map.set(id, dossier);
  }

  cachedBase360 = map;
  return map;
}

async function loadOverlayStore(): Promise<KingdomOverlayStore> {
  if (cachedOverlay) return cachedOverlay;

  const defaultStore: KingdomOverlayStore = {
    customDossiers: {},
    deletedIds: [],
    versions: [],
    customFieldDefs: [
      {
        id: "KFLD-000001",
        workspaceId: "ws-aethelgard",
        key: "signature_wonder",
        label: "Kỳ quan Kiến trúc Biểu tượng",
        dataType: "text",
        groupName: "Mở rộng Thế giới quan",
        required: false,
        defaultValue: "",
        options: [],
        visibleTo: ["admin", "editor", "guest"],
        editableBy: ["admin", "editor"],
        sortOrder: 1,
        createdAt: "2026-11-23T08:00:00.000Z",
        updatedAt: "2026-11-23T08:00:00.000Z"
      }
    ],
    customFieldValues: []
  };

  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    if (pool) {
      try {
        if (!pgKingdomInit) {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS kingdom_codex_store (
              id TEXT PRIMARY KEY,
              payload JSONB NOT NULL,
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `);
          pgKingdomInit = true;
        }
        const res = await pool.query(`SELECT payload FROM kingdom_codex_store WHERE id = 'primary' LIMIT 1`);
        if (res.rows[0]?.payload) {
          cachedOverlay = { ...defaultStore, ...(res.rows[0].payload as Partial<KingdomOverlayStore>) };
          return cachedOverlay;
        }
      } catch {
        // fallback to local JSON
      }
    }
  }

  try {
    if (fs.existsSync(LOCAL_KINGDOM_FILE)) {
      const raw = JSON.parse(fs.readFileSync(LOCAL_KINGDOM_FILE, "utf-8"));
      cachedOverlay = { ...defaultStore, ...raw };
      return cachedOverlay!;
    }
  } catch {
    // ignore
  }

  cachedOverlay = defaultStore;
  return cachedOverlay;
}

async function saveOverlayStore(store: KingdomOverlayStore): Promise<void> {
  cachedOverlay = store;
  if (isPostgresConfigured()) {
    const pool = getPostgresPool();
    if (pool) {
      try {
        await pool.query(
          `INSERT INTO kingdom_codex_store (id, payload, updated_at) VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(store)]
        );
        return;
      } catch {
        // fallback to local
      }
    }
  }
  if (!fs.existsSync(LOCAL_DATA_DIR)) fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
  const json = JSON.stringify(store, null, 2);
  for (let attempt = 0; attempt < 4; attempt++) {
    const tmp = `${LOCAL_KINGDOM_FILE}.${process.pid}.${Date.now()}.${attempt}.tmp`;
    try {
      fs.writeFileSync(tmp, json, "utf-8");
      fs.renameSync(tmp, LOCAL_KINGDOM_FILE);
      return;
    } catch {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        // ignore
      }
      try {
        fs.writeFileSync(LOCAL_KINGDOM_FILE, json, "utf-8");
        return;
      } catch {
        await new Promise((r) => setTimeout(r, 25 * (attempt + 1)));
      }
    }
  }
}

function getAllActiveKingdomDossiers(store: KingdomOverlayStore, workspaceId: string): KingdomHydratedDossier[] {
  const deleted = new Set(store.deletedIds);
  const result: KingdomHydratedDossier[] = [];
  const seen = new Set<string>();

  if (workspaceId === "ws-aethelgard") {
    for (const [id, base] of getBase360Kingdoms().entries()) {
      if (deleted.has(id)) continue;
      seen.add(id);
      result.push(store.customDossiers[id] ?? base);
    }
  }

  for (const [id, custom] of Object.entries(store.customDossiers)) {
    if (seen.has(id) || deleted.has(id)) continue;
    if (custom.kingdom.workspaceId === workspaceId && !custom.kingdom.deletedAt) {
      result.push(custom);
    }
  }

  return result;
}

export interface KingdomQueryOptions {
  workspaceId: string;
  role: UserRole;
  q?: string;
  continent?: string;
  polityType?: string;
  governmentType?: string;
  developmentLevel?: string;
  workflowStatus?: string;
  sortBy?: "updatedAt" | "name" | "population" | "area" | "gdp";
  page?: number;
  limit?: number;
}

export async function queryKingdoms(opts: KingdomQueryOptions): Promise<{
  items: KingdomListProjection[];
  total: number;
  page: number;
  totalPages: number;
  facets: { continents: string[]; governments: string[] };
}> {
  const store = await loadOverlayStore();
  const all = getAllActiveKingdomDossiers(store, opts.workspaceId).filter((d) => {
    if (!canViewAccessLevel(d.kingdom.accessLevel, opts.role)) return false;
    if (opts.role === "guest" && d.kingdom.workflowStatus !== "published") return false;
    return true;
  });

  const continentsSet = new Set<string>();
  const govsSet = new Set<string>();

  const projections: KingdomListProjection[] = all.map((d) => {
    const latestPop = d.populationHistory[d.populationHistory.length - 1];
    const latestEcon = d.economyHistory[d.economyHistory.length - 1];
    if (d.kingdom.continent) continentsSet.add(d.kingdom.continent);
    if (d.kingdom.governmentType) govsSet.add(d.kingdom.governmentType);

    return {
      id: d.kingdom.id,
      workspaceId: d.kingdom.workspaceId,
      officialName: d.kingdom.officialName,
      commonName: d.kingdom.commonName,
      ancientName: d.kingdom.ancientName,
      countryCode: d.kingdom.countryCode,
      continent: d.kingdom.continent,
      bloc: d.kingdom.bloc,
      polityType: d.kingdom.polityType,
      governmentType: d.kingdom.governmentType,
      currentStatus: d.kingdom.currentStatus,
      developmentLevel: d.kingdom.developmentLevel,
      workflowStatus: d.kingdom.workflowStatus,
      capitalName: d.territory.capitalName,
      population: latestPop?.totalPopulation ?? 0,
      areaKm2: d.territory.areaKm2,
      gdpValue: latestEcon?.gdpValue ?? 0,
      currencyCode: d.kingdom.currencyCode,
      emblemConfig: d.symbols.emblemConfig,
      accentColor: d.symbols.representativeColors[0] || "#D4AF37",
      tags: d.kingdom.tags,
      linkedWikiEntryId: d.kingdom.linkedWikiEntryId,
      linkedAtlasNationId: d.kingdom.linkedAtlasNationId,
      updatedAt: d.kingdom.updatedAt
    };
  });

  const filtered = projections.filter((p) => {
    if (opts.continent && p.continent !== opts.continent) return false;
    if (opts.polityType && p.polityType !== opts.polityType) return false;
    if (opts.governmentType && p.governmentType !== opts.governmentType) return false;
    if (opts.developmentLevel && p.developmentLevel !== opts.developmentLevel) return false;
    if (opts.workflowStatus && p.workflowStatus !== opts.workflowStatus) return false;
    if (opts.q && opts.q.trim()) {
      const hay = [
        p.id,
        p.officialName,
        p.commonName,
        p.ancientName,
        p.countryCode,
        p.capitalName,
        p.continent,
        p.bloc,
        p.governmentType,
        p.currencyCode,
        ...p.tags
      ].join(" ");
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });

  const sortBy = opts.sortBy || "name";
  filtered.sort((a, b) => {
    if (sortBy === "population") return b.population - a.population;
    if (sortBy === "area") return b.areaKm2 - a.areaKm2;
    if (sortBy === "gdp") return b.gdpValue - a.gdpValue;
    if (sortBy === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
    return normalizeVietnamese(a.commonName).localeCompare(normalizeVietnamese(b.commonName));
  });

  const page = Math.max(1, opts.page || 1);
  const limit = Math.max(1, Math.min(500, opts.limit || 24));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total,
    page,
    totalPages,
    facets: {
      continents: Array.from(continentsSet).sort(),
      governments: Array.from(govsSet).sort()
    }
  };
}

export async function getKingdomDossier(
  id: string,
  role: UserRole
): Promise<{
  dossier: KingdomHydratedDossier | null;
  versions: Array<{ id: string; versionNumber: number; editorName: string; changeNote: string; createdAt: string }>;
}> {
  const store = await loadOverlayStore();
  if (store.deletedIds.includes(id)) return { dossier: null, versions: [] };

  const raw = store.customDossiers[id] ?? getBase360Kingdoms().get(id) ?? null;
  if (!raw) return { dossier: null, versions: [] };
  if (!canViewAccessLevel(raw.kingdom.accessLevel, role)) return { dossier: null, versions: [] };
  if (role === "guest" && raw.kingdom.workflowStatus !== "published") return { dossier: null, versions: [] };

  // Live Character Codex resolution for Rulers (zero character duplication!)
  const charState = await loadCharacterState();
  const charMap = new Map(charState.characters.filter((c) => !c.deletedAt).map((c) => [c.id, c]));

  const wsDefs = store.customFieldDefs
    .filter((d) => d.workspaceId === raw.kingdom.workspaceId && d.visibleTo.includes(role))
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const valMap = new Map(
    store.customFieldValues.filter((v) => v.kingdomId === id).map((v) => [v.fieldId, v.value])
  );

  const hydrated: KingdomHydratedDossier = {
    ...structuredClone(raw),
    rulers: raw.rulers.map((r) => {
      const ch = r.characterId ? charMap.get(r.characterId) : null;
      return {
        ...r,
        linkedCharacter: ch
          ? { id: ch.id, fullName: ch.fullName, symbol: ch.symbol, portraitUrl: ch.portraitUrl, titles: ch.titles }
          : null
      };
    }),
    relations: raw.relations.filter((rel) => canViewAccessLevel(rel.accessLevel, role)),
    events: raw.events.filter((ev) => canViewAccessLevel(ev.accessLevel, role)),
    customFields: wsDefs.map((definition) => ({
      definition,
      value: valMap.has(definition.id) ? valMap.get(definition.id) : definition.defaultValue
    }))
  };

  const versions = store.versions
    .filter((v) => v.kingdomId === id)
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .map((v) => ({
      id: v.id,
      versionNumber: v.versionNumber,
      editorName: v.editorName,
      changeNote: v.changeNote,
      createdAt: v.createdAt
    }));

  return { dossier: hydrated, versions };
}

export async function createOrCloneKingdom(
  input: {
    workspaceId: string;
    cloneFromId?: string;
    officialName: string;
    commonName?: string;
    continent?: string;
    polityType?: KingdomPolityType;
    governmentType?: string;
    capitalName?: string;
    currencyCode?: string;
    summary?: string;
  },
  editorName: string
): Promise<KingdomHydratedDossier> {
  const store = await loadOverlayStore();
  const allIds = [...getBase360Kingdoms().keys(), ...Object.keys(store.customDossiers)];
  const newId = nextSequentialId("KING", allIds);
  const now = new Date().toISOString();

  const templateSource = input.cloneFromId
    ? store.customDossiers[input.cloneFromId] ?? getBase360Kingdoms().get(input.cloneFromId)
    : getBase360Kingdoms().get("KING-000001");

  const base = structuredClone(templateSource!);
  base.kingdom = {
    ...base.kingdom,
    id: newId,
    workspaceId: input.workspaceId,
    officialName: input.officialName.trim(),
    commonName: (input.commonName || input.officialName).trim(),
    continent: input.continent || base.kingdom.continent,
    polityType: input.polityType || base.kingdom.polityType,
    governmentType: input.governmentType || base.kingdom.governmentType,
    currencyCode: input.currencyCode || base.kingdom.currencyCode,
    summary: input.summary ?? base.kingdom.summary,
    workflowStatus: "draft",
    linkedWikiEntryId: null,
    linkedAtlasNationId: null,
    nationNum: null,
    createdBy: editorName,
    updatedBy: editorName,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };
  base.symbols.kingdomId = newId;
  base.territory.kingdomId = newId;
  if (input.capitalName) base.territory.capitalName = input.capitalName.trim();
  if (!input.cloneFromId) {
    // Do not copy Atlas polygon from template for brand-new nations (never fabricate borders!)
    base.territory.atlasSvgPath = undefined;
    base.territory.atlasBbox = undefined;
    base.relations = [];
    base.rulers = [];
  }

  store.customDossiers[newId] = base;
  store.versions.push({
    id: `kver-${Date.now()}`,
    kingdomId: newId,
    versionNumber: 1,
    editorName,
    changeNote: input.cloneFromId ? `Nhân bản từ mẫu ${input.cloneFromId}` : "Khởi tạo hồ sơ quốc gia mới",
    createdAt: now,
    snapshot: structuredClone(base)
  });

  await saveOverlayStore(store);
  return base;
}

export async function loadKingdomOverlayStore(): Promise<KingdomOverlayStore> {
  return loadOverlayStore();
}

export async function saveKingdomOverlayStore(store: KingdomOverlayStore): Promise<void> {
  return saveOverlayStore(store);
}

export async function updateKingdomDossier(
  id: string,
  patch: Partial<KingdomHydratedDossier> & {
    customFieldValues?: Record<string, unknown>;
    changeNote?: string;
    expectedUpdatedAt?: string;
  },
  editorName: string
): Promise<KingdomHydratedDossier | null> {
  const store = await loadOverlayStore();
  const current = store.customDossiers[id] ?? getBase360Kingdoms().get(id);
  if (!current || store.deletedIds.includes(id)) return null;

  if (patch.expectedUpdatedAt && patch.expectedUpdatedAt !== current.kingdom.updatedAt) {
    const { ConcurrentEditError } = await import("@/lib/api-helpers");
    throw new ConcurrentEditError(current.kingdom.updatedAt, `Quốc gia "${current.kingdom.officialName}"`);
  }

  const now = new Date().toISOString();
  const next: KingdomHydratedDossier = structuredClone(current);

  if (patch.kingdom) {
    const { id: _i, createdAt: _c, createdBy: _cb, ...rest } = patch.kingdom;
    Object.assign(next.kingdom, rest, { updatedBy: editorName, updatedAt: now });
  } else {
    next.kingdom.updatedBy = editorName;
    next.kingdom.updatedAt = now;
  }

  if (patch.symbols) Object.assign(next.symbols, patch.symbols, { kingdomId: id });
  if (patch.territory) Object.assign(next.territory, patch.territory, { kingdomId: id });
  if (patch.regions) next.regions = patch.regions;
  if (patch.populationHistory) next.populationHistory = patch.populationHistory;
  if (patch.government) Object.assign(next.government, patch.government, { kingdomId: id });
  if (patch.rulers) next.rulers = patch.rulers;
  if (patch.economyHistory) next.economyHistory = patch.economyHistory;
  if (patch.military) Object.assign(next.military, patch.military, { kingdomId: id });
  if (patch.technology) Object.assign(next.technology, patch.technology, { kingdomId: id });
  if (patch.culture) Object.assign(next.culture, patch.culture, { kingdomId: id });
  if (patch.infrastructure) Object.assign(next.infrastructure, patch.infrastructure, { kingdomId: id });
  if (patch.resources) next.resources = patch.resources;
  if (patch.statistics) next.statistics = patch.statistics;
  if (patch.relations) next.relations = patch.relations;
  if (patch.treaties) next.treaties = patch.treaties;
  if (patch.events) next.events = patch.events;
  if (patch.achievements) next.achievements = patch.achievements;
  if (patch.images) next.images = patch.images;
  if (patch.sources) next.sources = patch.sources;

  if (patch.customFieldValues) {
    for (const [fieldId, value] of Object.entries(patch.customFieldValues)) {
      const ex = store.customFieldValues.find((v) => v.kingdomId === id && v.fieldId === fieldId);
      if (ex) {
        ex.value = value;
        ex.updatedAt = now;
      } else {
        store.customFieldValues.push({
          id: `kfv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          kingdomId: id,
          fieldId,
          value,
          updatedAt: now
        });
      }
    }
  }

  store.customDossiers[id] = next;
  const existingVers = store.versions.filter((v) => v.kingdomId === id);
  const nextVer = existingVers.reduce((m, v) => Math.max(m, v.versionNumber), 0) + 1;
  store.versions.push({
    id: `kver-${Date.now()}-${nextVer}`,
    kingdomId: id,
    versionNumber: nextVer,
    editorName,
    changeNote: patch.changeNote || `Cập nhật hồ sơ quốc gia v${nextVer}`,
    createdAt: now,
    snapshot: structuredClone(next)
  });

  await saveOverlayStore(store);
  return next;
}

export async function softDeleteKingdom(id: string): Promise<boolean> {
  const store = await loadOverlayStore();
  if (!store.deletedIds.includes(id)) {
    store.deletedIds.push(id);
    await saveOverlayStore(store);
  }
  return true;
}

export async function restoreKingdomVersion(
  id: string,
  versionNumber: number,
  editorName: string
): Promise<KingdomHydratedDossier | null> {
  const store = await loadOverlayStore();
  const ver = store.versions.find((v) => v.kingdomId === id && v.versionNumber === versionNumber);
  if (!ver) return null;
  return updateKingdomDossier(
    id,
    { ...ver.snapshot, changeNote: `Khôi phục về phiên bản v${versionNumber}` },
    editorName
  );
}

export async function listKingdomCustomFields(workspaceId: string): Promise<KingdomCustomFieldDef[]> {
  const store = await loadOverlayStore();
  return store.customFieldDefs
    .filter((d) => d.workspaceId === workspaceId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertKingdomCustomField(
  input: Partial<KingdomCustomFieldDef> & { workspaceId: string; label: string }
): Promise<KingdomCustomFieldDef> {
  const store = await loadOverlayStore();
  const now = new Date().toISOString();
  if (input.id) {
    const ex = store.customFieldDefs.find((d) => d.id === input.id);
    if (ex) {
      Object.assign(ex, input, { updatedAt: now });
      await saveOverlayStore(store);
      return ex;
    }
  }
  const def: KingdomCustomFieldDef = {
    id: nextSequentialId("KFLD", store.customFieldDefs.map((d) => d.id)),
    workspaceId: input.workspaceId,
    key:
      input.key?.trim() ||
      normalizeVietnamese(input.label).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
    label: input.label.trim(),
    dataType: input.dataType || "text",
    groupName: input.groupName || "Mở rộng",
    required: Boolean(input.required),
    defaultValue: input.defaultValue || "",
    options: input.options || [],
    visibleTo: input.visibleTo || ["admin", "editor", "guest"],
    editableBy: input.editableBy || ["admin", "editor"],
    sortOrder: input.sortOrder ?? store.customFieldDefs.length + 1,
    createdAt: now,
    updatedAt: now
  };
  store.customFieldDefs.push(def);
  await saveOverlayStore(store);
  return def;
}

export async function deleteKingdomCustomField(id: string): Promise<boolean> {
  const store = await loadOverlayStore();
  const before = store.customFieldDefs.length;
  store.customFieldDefs = store.customFieldDefs.filter((d) => d.id !== id);
  if (store.customFieldDefs.length === before) return false;
  await saveOverlayStore(store);
  return true;
}

export async function exportKingdomsData(workspaceId: string, format: "json" | "csv", role: UserRole) {
  const res = await queryKingdoms({ workspaceId, role, page: 1, limit: 1000 });
  if (format === "json") {
    return JSON.stringify({ exportedAt: new Date().toISOString(), count: res.items.length, kingdoms: res.items }, null, 2);
  }
  const headers = ["ID", "TenChinhThuc", "TenThongDung", "ThuDo", "LucDia", "TheChe", "DanSo", "DienTichKm2", "GDP", "TienTe", "TrangThai"];
  const rows = res.items.map((k) =>
    [k.id, k.officialName, k.commonName, k.capitalName, k.continent, k.governmentType, k.population, k.areaKm2, k.gdpValue, k.currencyCode, k.workflowStatus]
      .map(escapeCsvCell)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}
