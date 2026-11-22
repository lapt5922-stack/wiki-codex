import type {
  Category,
  EntityCustomSection,
  EntityEpigraph,
  Entry,
  EntryCustomLaw,
  EntryCustomProperty,
  EntryRelation,
  EntryResourceItem,
  EntryRosterMember,
  EntryRumorSecret,
  ProportionalBarItem,
  TableFieldValue,
} from "@/types/codex";
import { slugifyVietnamese } from "@/lib/vietnamese";
import { buildNationEconomyProfile, deriveNationEmblemConfig } from "@/lib/economy-engine";
import { BIOME_META, DIPLOMACY_META, TIER_META } from "./climate-geology";
import { buildPlanetaryAtlasBundle } from "./generator";
import { CONTINENT_NAME_VI } from "./nations-data";
import type { AtlasBiomeId, ContinentId, PlanetaryNation } from "./types";

const CONTINENT_CATEGORY_META: Record<
  ContinentId,
  { id: string; name: string; slug: string; icon: string; sigil: string; color: string; desc: string }
> = {
  AURELIA: {
    id: "cat-cont-aurelia",
    name: "Lục địa Aurelia (Tam Biên)",
    slug: "luc-dia-aurelia",
    icon: "Crown",
    sigil: "⚜",
    color: "#3b82f6",
    desc: "Đại lục địa trung tâm hành tinh, nơi tọa lạc Liên minh Tam Biên Valoria–ZogKoth–Ignisia.",
  },
  OCCIDENTALIS: {
    id: "cat-cont-occidentalis",
    name: "Lục địa Occidentalis",
    slug: "luc-dia-occidentalis",
    icon: "Landmark",
    sigil: "❖",
    color: "#6366f1",
    desc: "Lục địa phương Tây với mạng lưới cộng hòa ngân hàng, thiên văn và thương cảng.",
  },
  ORIENTIS: {
    id: "cat-cont-orientis",
    name: "Lục địa Orientis (Viễn Đông)",
    slug: "luc-dia-orientis",
    icon: "ScrollText",
    sigil: "◈",
    color: "#10b981",
    desc: "Cổ lục Viễn Đông nổi tiếng với nền hành chính khoa cử và lưu vực Long Mạch.",
  },
  AUSTRALIS: {
    id: "cat-cont-australis",
    name: "Lục địa Australis (Nam Đông)",
    slug: "luc-dia-australis",
    icon: "Compass",
    sigil: "✹",
    color: "#8b5cf6",
    desc: "Lục địa bán cầu Nam với cao nguyên khoáng sản opal và duyên hải ôn đới.",
  },
  HESPERIA: {
    id: "cat-cont-hesperia",
    name: "Lục địa Hesperia (Tây Bắc)",
    slug: "luc-dia-hesperia",
    icon: "Trees",
    sigil: "ᛇ",
    color: "#14b8a6",
    desc: "Đại lục rừng tùng bách ôn đới và các xưởng đóng tàu viễn dương Tây Bắc.",
  },
  SOLARA: {
    id: "cat-cont-solara",
    name: "Lục địa Solara (Nam Tây)",
    slug: "luc-dia-solara",
    icon: "Sun",
    sigil: "❂",
    color: "#eab308",
    desc: "Lục địa xích đạo với rừng mưa Lục Bảo ở phía Bắc và cao nguyên sa mạc phía Nam.",
  },
  ARCTIC_ICE: {
    id: "cat-cont-arctic",
    name: "Bắc Cực Băng Nguyên",
    slug: "bac-cuc-bang-nguyen",
    icon: "Snowflake",
    sigil: "✧",
    color: "#38bdf8",
    desc: "Vành đai băng vĩnh cửu phương Bắc và các trạm khảo sát cực quang.",
  },
  ANTARCTIC_ICE: {
    id: "cat-cont-antarctic",
    name: "Nam Cực Lục Địa",
    slug: "nam-cuc-luc-dia",
    icon: "Mountain",
    sigil: "❄",
    color: "#93c5fd",
    desc: "Lục địa tuyết cực Nam vận hành theo Hiệp ước Nghiên cứu Khoa học Quốc tế.",
  },
  OCEANIC: {
    id: "cat-cont-oceanic",
    name: "Hải Vực & Quần đảo Trung Dương",
    slug: "hai-vuc-trung-duong",
    icon: "Waves",
    sigil: "☽",
    color: "#06b6d4",
    desc: "Các đảo quốc san hô, thương cảng tự do và Đặc khu Lưu trữ Học thuật liên lục địa.",
  },
};

const CURRENCY_BY_CONTINENT: Record<ContinentId, string> = {
  AURELIA: "Đồng Hoàng Kim Aurel (AUR)",
  OCCIDENTALIS: "Bạc Ngân Hà Argent (ARG)",
  ORIENTIS: "Ngọc Tệ Đông Châu (NGO)",
  AUSTRALIS: "Đô-la Opal Nam Dương (OPL)",
  HESPERIA: "Đồng Tùng Bách Hesper (HSP)",
  SOLARA: "Kim Nhật Sol (SOL)",
  ARCTIC_ICE: "Tín phiếu Cực Quang (BOR)",
  ANTARCTIC_ICE: "Tín phiếu Nghiên cứu Nam Cực (ANT)",
  OCEANIC: "Hải Tệ Trung Dương (PLG)",
};

function deriveHeadOfStateTitle(nation: PlanetaryNation): string {
  const gov = nation.governmentType.toLowerCase();
  if (gov.includes("quân chủ")) return `Hội đồng Vương thất & Thủ tướng ${nation.shortName}`;
  if (gov.includes("đế chế") || gov.includes("nguyên lão")) return `Chấp chính Nguyên lão viện ${nation.shortName}`;
  if (gov.includes("hội đồng học giả") || gov.includes("lưu trữ")) return `Viện trưởng Hội đồng Học giả ${nation.capital}`;
  if (gov.includes("bộ lạc") || gov.includes("công xã")) return `Đại Hội đồng Công xã ${nation.shortName}`;
  if (gov.includes("cộng hòa")) return `Tổng thống & Nghị viện ${nation.shortName}`;
  return `Hội đồng Hành chính ${nation.shortName}`;
}

function buildProvincesTable(nation: PlanetaryNation): TableFieldValue {
  const biomeLabel = BIOME_META[nation.biome].label;
  return {
    headers: ["Tỉnh / Vùng", "Trung tâm", "Đặc trưng địa lý & văn hóa"],
    rows: [
      [`Đặc khu Thủ đô ${nation.capital}`, nation.capital, `Trung tâm hành chính, thư viện lưu trữ và giao thương của ${nation.shortName}`],
      [`Vùng Nội địa ${nation.shortName}`, `Bắc ${nation.capital}`, `Địa hình ${biomeLabel.toLowerCase()}, cao độ trung bình ${nation.elevationM.toLocaleString("vi-VN")} m`],
      [`Hành lang Biên giới ${nation.regionCode}`, `Nam ${nation.shortName}`, `Trạm kết nối giao thương thuộc khối ${nation.bloc}`],
    ],
  };
}

const EPIGRAPH_BY_BIOME: Record<AtlasBiomeId, (n: PlanetaryNation) => EntityEpigraph> = {
  TEMPERATE_PLAINS: (n) => ({
    quote: `Cánh đồng xanh nuôi dưỡng muôn dân, nhưng bộ luật và thư viện tại ${n.capital} mới giữ bền nền văn hiến ngàn năm.`,
    author: `Hiến chương ${n.shortName}`,
    source: `Khắc trên đại sảnh nghị sự ${n.capital} (${n.foundingEra})`,
  }),
  ARID_CANYON: (n) => ({
    quote: `Đá hẻm núi có thể khô cằn trước nắng gió, nhưng dấu chân thương đoàn qua ${n.shortName} chưa từng một ngày ngưng nghỉ.`,
    author: `Biên niên sử Đá Đỏ`,
    source: `Bia cổng chính ${n.capital}`,
  }),
  ASH_VOLCANIC: (n) => ({
    quote: `Từ lòng đất rực lửa, bàn tay thợ luyện kim ${n.shortName} rèn nên thủy tinh trong suốt và hơi ấm cho mọi mái nhà.`,
    author: `Nguyên lão viện ${n.shortName}`,
    source: `Hồ sơ Địa nhiệt ${n.capital}`,
  }),
  SAND_DESERT: (n) => ({
    quote: `Người đi sa mạc không nhìn đường bằng cát bụi, mà bằng tinh tú trên cao và bản đồ ốc đảo của ${n.capital}.`,
    author: `Sổ tay Dẫn đường ${n.shortName}`,
    source: `Thư viện Ốc đảo ${n.capital}`,
  }),
  TROPICAL_JUNGLE: (n) => ({
    quote: `Mỗi tán lá rừng mưa là một trang sách thuốc; giữ được rừng xanh là giữ trọn sinh khí của ${n.shortName}.`,
    author: `Viện Thực vật học ${n.capital}`,
    source: `Bản khắc Lục Bảo (${n.foundingEra})`,
  }),
  ALPINE_PEAKS: (n) => ({
    quote: `Đỉnh cao không ngăn cách con người, mà nâng tầm mắt của ${n.shortName} vươn xa qua mọi rặng sơn mạch.`,
    author: `Hội đồng Sơn cước ${n.shortName}`,
    source: `Trạm Quan trắc Cao nguyên ${n.capital}`,
  }),
  GLACIAL_ICE: (n) => ({
    quote: `Giữa băng nguyên tĩnh lặng, ánh cực quang và những lõi băng cổ lưu giữ ký ức nguyên sơ của cả hành tinh.`,
    author: `Hội đồng Khảo sát ${n.shortName}`,
    source: `Nhật ký Băng nguyên ${n.capital}`,
  }),
  CORAL_SEA: (n) => ({
    quote: `Nơi hải lưu gặp bờ san hô là nơi cánh buồm muôn phương hội tụ về thương cảng ${n.capital}.`,
    author: `Công ước Hải cảng ${n.shortName}`,
    source: `Hải đăng Cổ ${n.capital}`,
  }),
  ARCHIPELAGO: (n) => ({
    quote: `Đại dương không chia cắt quần đảo ${n.shortName}, mà là con đường rộng mở nối liền mọi hải đảo.`,
    author: `Hội đồng Thuyền trưởng ${n.shortName}`,
    source: `Tàng thư Hải đồ ${n.capital}`,
  }),
};

function buildNationEpigraph(nation: PlanetaryNation): EntityEpigraph {
  if (nation.nationNum === 1) {
    return {
      quote: "Tri thức là đường biên giới vững bền nhất; cùng Zog-Koth và Ignisia, chúng ta giữ cho ngọn đèn Tam Biên không bao giờ tắt.",
      author: "Hiến chương Liên minh Tam Biên",
      source: "Khắc tại Thư viện Hoàng gia Aurelion Prime",
    };
  }
  if (nation.nationNum === 2) {
    return {
      quote: "Mỗi vách đá Koth-Varr là một nhịp cầu; liên minh cùng Valoria và Ignisia biến hẻm núi thành đại lộ của hòa bình.",
      author: "Đại Hội đồng Công xã Zog-Koth",
      source: "Cổng Bazan Koth-Varr",
    };
  }
  if (nation.nationNum === 3) {
    return {
      quote: "Lửa địa nhiệt không phải để thiêu đốt, mà để thắp sáng lò luyện kim và sưởi ấm tình đồng minh Tam Biên.",
      author: "Nguyên lão viện Cinderhold",
      source: "Bia Thủy tinh Núi lửa Ignisia",
    };
  }
  return EPIGRAPH_BY_BIOME[nation.biome](nation);
}

function buildNationRoster(nation: PlanetaryNation, ruler: string): EntryRosterMember[] {
  const isMaritime = nation.biome === "CORAL_SEA" || nation.biome === "ARCHIPELAGO";
  const thirdDept = isMaritime
    ? "Hàng hải & Thương cảng"
    : nation.biome === "ASH_VOLCANIC" || nation.biome === "ALPINE_PEAKS"
      ? "Địa chất & Công trình"
      : "Giao thương & Dân sinh";
  const thirdTitle = isMaritime
    ? `Tổng quản Hải cảng & Hải đồ ${nation.capital}`
    : nation.biome === "ASH_VOLCANIC" || nation.biome === "ALPINE_PEAKS"
      ? `Chánh Kỹ sư Địa chất & Khoáng sản ${nation.shortName}`
      : `Tổng quản Thương đoàn & Nông chính ${nation.shortName}`;

  return [
    {
      id: `ros-${nation.nationNum}-1`,
      name: ruler,
      roleTitle: "Cơ quan Lập pháp & Hành pháp Tối cao",
      department: "Quốc chính",
      rankOrder: 1,
      tenure: `${nation.foundingEra} – Hiện tại`,
      status: "active",
      note: `Điều hành bộ máy ${nation.governmentType.toLowerCase()} tại thủ đô ${nation.capital}.`,
    },
    {
      id: `ros-${nation.nationNum}-2`,
      name: `Viện Lưu trữ & Sử học ${nation.capital}`,
      roleTitle: "Cơ quan Bảo tồn Văn hiến & Ngoại giao",
      department: "Học thuật & Lưu trữ",
      rankOrder: 2,
      tenure: "Thường trực",
      status: "active",
      note: `Biên soạn niên giám bằng ${nation.primaryLanguage} và quản lý văn bản hiệp ước trong khối ${nation.bloc}.`,
    },
    {
      id: `ros-${nation.nationNum}-3`,
      name: `Hội đồng ${thirdDept} ${nation.shortName}`,
      roleTitle: thirdTitle,
      department: thirdDept,
      rankOrder: 3,
      tenure: "Thường trực",
      status: "active",
      note: `Điều phối hạ tầng giao thương nội vùng ${nation.regionCode} và kết nối các quốc gia láng giềng.`,
    },
  ];
}

function buildNationLaws(nation: PlanetaryNation): EntryCustomLaw[] {
  const biomeLabel = BIOME_META[nation.biome].label;
  return [
    {
      id: `law-1-${nation.nationNum}`,
      title: `Hiến chương Hành chính ${nation.shortName}`,
      category: "law",
      summary: `Quy định phân cấp quản trị theo thể chế ${nation.governmentType.toLowerCase()} và bảo vệ quyền lưu trữ văn thư dân sự tại ${nation.capital}.`,
      enforcement: `Hội đồng Pháp chế & Tòa án Hành chính ${nation.capital}`,
    },
    {
      id: `law-2-${nation.nationNum}`,
      title: `Lễ hội Mùa & Giao lưu Văn hiến ${nation.shortName}`,
      category: "custom",
      summary: `Mỗi năm cư dân ${nation.capital} và các tỉnh tổ chức tuần lễ trao đổi sử liệu, sản vật ${biomeLabel.toLowerCase()} và đón tiếp đoàn học giả từ khối ${nation.bloc}.`,
      enforcement: "Phong tục cộng đồng được bảo trợ",
    },
    {
      id: `law-3-${nation.nationNum}`,
      title: `Điều Cấm kỵ Xâm hại Hệ sinh thái & Thư viện`,
      category: "taboo",
      summary: `Nghiêm cấm hủy hoại bản đồ trắc địa, thư tịch cổ hoặc khai thác quá mức tài nguyên đặc hữu vùng ${biomeLabel.toLowerCase()}.`,
      enforcement: `Tước quyền thương mại & trục xuất khỏi phân khu ${nation.regionCode}`,
    },
  ];
}

const LOCAL_STAPLE_BY_BIOME: Record<AtlasBiomeId, { local: string; importNeed: string }> = {
  TEMPERATE_PLAINS: { local: "Ngũ cốc & Hệ thống Kênh tưới Ôn đới", importNeed: "Khoáng sản đặc thù & Gia vị nhiệt đới" },
  ARID_CANYON: { local: "Đá Bazan Kiến trúc & Mạch nước ngầm", importNeed: "Gỗ xây dựng & Lương thực đồng bằng" },
  ASH_VOLCANIC: { local: "Năng lượng Địa nhiệt & Thủy tinh Núi lửa", importNeed: "Nông sản ôn đới & Vải sợi tự nhiên" },
  SAND_DESERT: { local: "Ốc đảo Chà là & Cát Thạch anh tinh khiết", importNeed: "Nước ngọt dự trữ & Gỗ đóng xe" },
  TROPICAL_JUNGLE: { local: "Dược thảo Rừng mưa & Gỗ Quý bền vững", importNeed: "Quặng kim loại & Dụng cụ quang học" },
  ALPINE_PEAKS: { local: "Quặng Bạc, Đá Cẩm thạch & Thủy điện cao nguyên", importNeed: "Ngũ cốc đồng bằng & Muối biển" },
  GLACIAL_ICE: { local: "Lõi Băng khảo cổ & Hải sản vùng lạnh", importNeed: "Nhiên liệu sưởi, Lương thực & Vải len" },
  CORAL_SEA: { local: "Ngọc trai San hô & Xưởng Đóng tàu Hải cảng", importNeed: "Quặng sắt & Gỗ tùng nội địa" },
  ARCHIPELAGO: { local: "Hương liệu Hải đảo & Hải đồ Viễn dương", importNeed: "Đá xây dựng & Kim loại luyện sẵn" },
};

function buildNationResources(
  nation: PlanetaryNation,
  exportName: string | null,
  importName: string | null,
): EntryResourceItem[] {
  const fallback = LOCAL_STAPLE_BY_BIOME[nation.biome];
  return [
    {
      id: `res-${nation.nationNum}-1`,
      name: exportName || fallback.local,
      abundance: nation.tier === "IMPERIAL_REALM" ? "Độc quyền" : "Dồi dào",
      tradeRole: "Xuất khẩu chủ lực",
      note: `Mặt hàng xuất khẩu tiêu biểu của ${nation.shortName} phân phối qua mạng lưới giao thương ${nation.bloc}.`,
    },
    {
      id: `res-${nation.nationNum}-2`,
      name: fallback.local,
      abundance: "Ổn định",
      tradeRole: "Nội địa",
      note: `Nguồn lực nền tảng bảo đảm đời sống dân cư (${nation.population.toLocaleString("vi-VN")} người) tại ${nation.regionName}.`,
    },
    {
      id: `res-${nation.nationNum}-3`,
      name: importName || fallback.importNeed,
      abundance: "Khan hiếm",
      tradeRole: "Nhập khẩu",
      note: `Nhập khẩu định kỳ qua các hiệp định thông thương liên lục địa nhằm cân bằng cơ cấu kinh tế.`,
    },
  ];
}

function buildNationRumors(nation: PlanetaryNation): EntryRumorSecret[] {
  const truth = 45 + ((nation.nationNum * 19) % 45);
  return [
    {
      id: `rum-${nation.nationNum}-1`,
      title: `Dấu tích Địa tầng Cổ dưới nền ${nation.capital}`,
      tier: "rumor",
      truthPercent: truth,
      content: `Các nhà khảo cổ địa phương tại ${nation.capital} ghi nhận những mảng đá khắc ký tự trắc địa có niên đại sớm hơn cả ${nation.foundingEra}, được cho là cột mốc đo đạc của nền văn minh tiền sử.`,
      sourceLabel: `Truyền thuyết học giới ${nation.shortName}`,
    },
    {
      id: `rum-${nation.nationNum}-2`,
      title: `Bản đồ Dự phòng & Kho Lưu trữ Mật ${nation.regionCode}`,
      tier: "secret",
      truthPercent: 100,
      content: `Viện Lưu trữ ${nation.capital} cất giữ một bản sao đầy đủ toàn bộ mật ước biên giới và dữ liệu khí hậu 500 năm của khối ${nation.bloc} trong hầm chống ẩm dưới lòng đất.`,
      sourceLabel: `Hồ sơ mật Văn khố ${nation.capital}`,
      gmOnly: true,
    },
  ];
}

function buildNationCustomSections(nation: PlanetaryNation): EntityCustomSection[] {
  const biomeLabel = BIOME_META[nation.biome].label;
  return [
    {
      id: `sec-${nation.nationNum}-1`,
      title: `Kiến trúc & Quy hoạch Đô thị ${nation.capital}`,
      sigil: "◈",
      content: `Được xây dựng ở cao độ trung bình ${nation.elevationM.toLocaleString("vi-VN")} m với nền nhiệt ${nation.avgTempC} °C, các đô thị tại ${nation.shortName} áp dụng vật liệu bản địa của vùng ${biomeLabel.toLowerCase()}, tối ưu thông gió tự nhiên, thoát nước và bảo quản thư tịch khỏi biến động khí hậu.`,
    },
    {
      id: `sec-${nation.nationNum}-2`,
      title: `Văn hóa, Ngôn ngữ & Đời sống Học thuật`,
      sigil: "✦",
      content: `Tiếng ${nation.primaryLanguage} là sợi dây gắn kết văn học, lịch sử và hành chính của ${nation.shortName}. Hệ thống thư viện công cộng và trường trắc địa tại ${nation.capital} thường xuyên trao đổi học giả với các quốc gia thuộc ${nation.bloc}.`,
    },
  ];
}

function buildNationBreakdownBars(nation: PlanetaryNation): ProportionalBarItem[] {
  const primaryPct = 56 + ((nation.nationNum * 7) % 24); // 56..79%
  const blocPct = Math.min(34, 14 + ((nation.nationNum * 5) % 18)); // 14..31%
  const scholarPct = Math.max(4, 100 - primaryPct - blocPct);
  const adjustedPrimary = 100 - blocPct - scholarPct;
  return [
    {
      id: `bar-${nation.nationNum}-1`,
      groupTitle: "Cơ cấu Ngôn ngữ & Giao tiếp Hành chính",
      label: nation.primaryLanguage,
      percentage: adjustedPrimary,
      color: nation.color,
    },
    {
      id: `bar-${nation.nationNum}-2`,
      groupTitle: "Cơ cấu Ngôn ngữ & Giao tiếp Hành chính",
      label: `Ngôn ngữ khối ${nation.bloc}`,
      percentage: blocPct,
      color: "#38bdf8",
    },
    {
      id: `bar-${nation.nationNum}-3`,
      groupTitle: "Cơ cấu Ngôn ngữ & Giao tiếp Hành chính",
      label: "Tiếng Hàn lâm Chung & Thương ngữ",
      percentage: scholarPct,
      color: "#fbbf24",
    },
  ];
}

export function buildPlanetaryContinentCategories(
  workspaceId: string,
  now: string,
): Category[] {
  const order: ContinentId[] = [
    "AURELIA",
    "OCCIDENTALIS",
    "ORIENTIS",
    "AUSTRALIS",
    "HESPERIA",
    "SOLARA",
    "ARCTIC_ICE",
    "ANTARCTIC_ICE",
    "OCEANIC",
  ];
  return order.map((cid, idx) => {
    const m = CONTINENT_CATEGORY_META[cid];
    return {
      id: m.id,
      workspaceId,
      parentId: "cat-vuong-quoc",
      name: m.name,
      slug: m.slug,
      description: m.desc,
      icon: m.icon,
      sigil: m.sigil,
      color: m.color,
      sortOrder: 10 + idx,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  });
}

let cached360Entries: Entry[] | null = null;
let cached360Relations: EntryRelation[] | null = null;

export function buildAll360NationEntries(
  workspaceId = "ws-aethelgard",
  now = "2026-11-22T07:00:00.000Z",
): Entry[] {
  if (cached360Entries && workspaceId === "ws-aethelgard") {
    return cached360Entries;
  }

  const bundle = buildPlanetaryAtlasBundle();
  const byId = new Map<string, PlanetaryNation>();
  for (const n of bundle.nations) byId.set(n.id, n);

  // Pre-index diplomacy and resource flows by nationId for O(1) lookup
  const dipByNation = new Map<string, typeof bundle.diplomacy>();
  for (const d of bundle.diplomacy) {
    const aList = dipByNation.get(d.polityAId) ?? [];
    aList.push(d);
    dipByNation.set(d.polityAId, aList);
    const bList = dipByNation.get(d.polityBId) ?? [];
    bList.push(d);
    dipByNation.set(d.polityBId, bList);
  }

  const resByNation = new Map<string, typeof bundle.resourceFlows>();
  for (const r of bundle.resourceFlows) {
    const sList = resByNation.get(r.sourceNationId) ?? [];
    sList.push(r);
    resByNation.set(r.sourceNationId, sList);
    const tList = resByNation.get(r.targetNationId) ?? [];
    tList.push(r);
    resByNation.set(r.targetNationId, tList);
  }

  const entries: Entry[] = bundle.nations.map((nation) => {
    const contMeta = CONTINENT_CATEGORY_META[nation.continent];
    const biomeLabel = BIOME_META[nation.biome].label;
    const tierLabel = TIER_META[nation.tier].label;
    const density = Math.max(1, Math.round(nation.population / Math.max(1, nation.areaKm2)));
    const currency = CURRENCY_BY_CONTINENT[nation.continent];
    const ruler = deriveHeadOfStateTitle(nation);

    const neighbors = nation.neighbors
      .map((id) => byId.get(id))
      .filter((n): n is PlanetaryNation => Boolean(n));
    const treaties = (dipByNation.get(nation.id) ?? []).slice(0, 6);
    const flows = (resByNation.get(nation.id) ?? []).slice(0, 5);

    const neighborLinks = neighbors
      .slice(0, 5)
      .map((nb) => `[[${nb.name}]]`)
      .join(", ");

    const treatyBullets = treaties.map((d) => {
      const otherId = d.polityAId === nation.id ? d.polityBId : d.polityAId;
      const other = byId.get(otherId);
      const statusLabel = DIPLOMACY_META[d.status].label;
      return `- **${statusLabel}** với ${other ? `[[${other.name}]]` : otherId}: *${d.treatyTitle}* (hiệu lực từ mốc ${d.fromTick}).`;
    });

    const resourceBullets = flows.map((r) => {
      const isExport = r.sourceNationId === nation.id;
      const other = byId.get(isExport ? r.targetNationId : r.sourceNationId);
      return `- ${isExport ? "Xuất khẩu" : "Nhập khẩu"} **${r.resourceName}** (sản lượng ${r.volumeLabel}, mức phụ thuộc ${r.dependencyPct}%) ${isExport ? "tới" : "từ"} ${other ? `[[${other.name}]]` : "đối tác khu vực"}.`;
    });

    const triBorderNote = nation.isTriBorder
      ? `\n\n> **Trụ cột Liên minh Tam Biên Aurelia**: ${nation.name} nằm tại giao điểm lịch sử Ngã Ba Tam Biên (${nation.latLabel}, ${nation.lonLabel}), liên kết đồng minh chặt chẽ giữa [[Liên bang Hoàng gia Valoria]], [[Liên minh Hẻm núi Zog-Koth]] và [[Đế chế Hỏa Sơn Ignisia]] cùng sự bảo trợ chung đối với [[Vùng Đệm Lưu Trữ Tam Biên]] và [[Học Viện Ngã Ba Tam Biên]].`
      : "";

    const contentMarkdown = [
      `## Tổng quan Địa chính trị`,
      "",
      `${nation.summary} Với quy mô **${tierLabel}**, quốc gia mang mã lưu trữ hành tinh **#${nation.nationNum}**, đặt thủ đô tại **${nation.capital}** và là thành viên tích cực của khối **${nation.bloc}** thuộc **${CONTINENT_NAME_VI[nation.continent]}**[^1].${triBorderNote}`,
      "",
      `## Địa lý, Khí hậu & Hệ sinh thái`,
      "",
      `- **Vị trí trắc địa**: Tọa độ trung tâm **${nation.latLabel}, ${nation.lonLabel}** trong phân khu **${nation.regionName} (${nation.regionCode})**.`,
      `- **Diện tích & Dân cư**: Lãnh thổ rộng **${nation.areaKm2.toLocaleString("vi-VN")} km²** với dân số ước tính **${nation.population.toLocaleString("vi-VN")} người** (mật độ trung bình **${density.toLocaleString("vi-VN")} người/km²**).`,
      `- **Địa hình & Khí hậu**: Hệ sinh thái chủ đạo là **${biomeLabel}**, độ cao trung bình **${nation.elevationM.toLocaleString("vi-VN")} m** so với mực nước biển hành tinh và nền nhiệt trung bình năm đạt **${nation.avgTempC} °C**.`,
      neighborLinks
        ? `- **Tiếp giáp & Kết nối trực tiếp**: ${neighborLinks}.`
        : `- **Tiếp giáp**: Kết nối qua các tuyến hải trình và trạm bưu chính viễn dương.`,
      "",
      `## Thể chế, Hành chính & Văn hóa`,
      "",
      `${nation.name} hình thành từ **${nation.foundingEra}**, hiện vận hành theo mô hình **${nation.governmentType}** dưới sự điều phối của **${ruler}**. Ngôn ngữ hành chính và giáo dục chính thức là **${nation.primaryLanguage}**, lưu hành đơn vị tiền tệ **${currency}**. Toàn bộ văn thư dân sự, địa bạ và bản đồ trắc địa được chuẩn hóa theo quy chuẩn của Viện Lưu trữ Hành tinh ${bundle.planetName}.`,
      "",
      `## Ngoại giao & Hiệp ước`,
      "",
      ...(treatyBullets.length > 0
        ? treatyBullets
        : [`- Duy trì quan hệ trung lập hữu nghị và trao đổi văn thư học thuật trong khuôn khổ **${nation.bloc}**.`]),
      "",
      `## Kinh tế, Tài nguyên & Giao thương`,
      "",
      ...(resourceBullets.length > 0
        ? resourceBullets
        : [
            `- Kinh tế dựa trên nông nghiệp – thủ công nghiệp thích nghi với vùng **${biomeLabel.toLowerCase()}** và giao thương nội vùng **${nation.regionCode}**.`,
          ]),
      "",
      `[^1]: Hồ sơ Địa chính trị #${nation.nationNum} (${nation.shortName}), Niên giám Bách khoa Hành tinh ${bundle.planetName} — Phân khu ${nation.regionName}.`,
    ].join("\n");

    const extraFields: EntryCustomProperty[] = [
      {
        id: `ef-num-${nation.nationNum}`,
        label: "Mã Quốc gia",
        group: "Định danh Hành tinh",
        kind: "text",
        value: `#${nation.nationNum} (${nation.shortName})`,
        showInInfobox: true,
        order: 1,
      },
      {
        id: `ef-cont-${nation.nationNum}`,
        label: "Lục địa & Khu vực",
        group: "Địa lý Trắc địa",
        kind: "text",
        value: `${CONTINENT_NAME_VI[nation.continent]} — ${nation.regionCode}`,
        showInInfobox: true,
        order: 2,
      },
      {
        id: `ef-bloc-${nation.nationNum}`,
        label: "Khối Liên minh",
        group: "Định danh Hành tinh",
        kind: "text",
        value: nation.bloc,
        color: nation.color,
        showInInfobox: true,
        order: 3,
      },
      {
        id: `ef-coord-${nation.nationNum}`,
        label: "Tọa độ Trắc địa",
        group: "Địa lý Trắc địa",
        kind: "text",
        value: `${nation.latLabel}, ${nation.lonLabel}`,
        showInInfobox: true,
        order: 4,
      },
      {
        id: `ef-area-${nation.nationNum}`,
        label: "Diện tích",
        group: "Địa lý Trắc địa",
        kind: "number",
        value: nation.areaKm2.toLocaleString("vi-VN"),
        unit: "km²",
        showInInfobox: true,
        order: 5,
      },
      {
        id: `ef-climate-${nation.nationNum}`,
        label: "Cao độ & Nhiệt độ",
        group: "Địa lý Trắc địa",
        kind: "text",
        value: `${nation.elevationM.toLocaleString("vi-VN")} m • ${nation.avgTempC} °C (${biomeLabel})`,
        showInInfobox: true,
        order: 6,
      },
    ];

    const firstExport = flows.find((f) => f.sourceNationId === nation.id)?.resourceName ?? null;
    const firstImport = flows.find((f) => f.targetNationId === nation.id)?.resourceName ?? null;
    const popEarly = Math.max(12_000, Math.round(nation.population * 0.22));
    const popMid = Math.max(25_000, Math.round(nation.population * 0.61));

    const slug = slugifyVietnamese(`quoc-gia-${nation.nationNum}-${nation.shortName}`);

    return {
      id: `ent-nation-${nation.nationNum}`,
      workspaceId,
      entryTypeId: "type-kingdom",
      categoryId: contMeta.id,
      slug,
      title: nation.name,
      subtitle: `Quốc gia #${nation.nationNum} • Thủ đô ${nation.capital} • ${CONTINENT_NAME_VI[nation.continent]}`,
      summary: nation.summary,
      icon: nation.isTriBorder ? "Crown" : contMeta.icon,
      sigil: nation.isTriBorder ? "⚜" : contMeta.sigil,
      coverImage: "",
      thumbImage: "",
      status: "published",
      visibility: "public",
      canonStatus: "canon",
      aliases: [
        nation.shortName,
        `#${nation.nationNum}`,
        nation.capital,
      ],
      epigraph: buildNationEpigraph(nation),
      featured: nation.nationNum <= 10 || Boolean(nation.isTriBorder),
      spoilerGate: false,
      spoilerLabel: "",
      tags: [
        `quoc-gia-${nation.nationNum}`,
        slugifyVietnamese(nation.continent),
        slugifyVietnamese(nation.regionCode),
        slugifyVietnamese(nation.bloc),
        slugifyVietnamese(biomeLabel),
        ...(nation.isTriBorder ? ["lien-minh-tam-bien"] : []),
      ],
      tabOverrides: {
        enabled: ["economy"],
        disabled: ["power"],
      },
      extraFields,
      economyProfile: buildNationEconomyProfile(nation),
      emblemConfig: deriveNationEmblemConfig(nation),
      roster: buildNationRoster(nation, ruler),
      lawsAndCustoms: buildNationLaws(nation),
      resourceItems: buildNationResources(nation, firstExport, firstImport),
      rumorsAndSecrets: buildNationRumors(nation),
      customSections: buildNationCustomSections(nation),
      breakdownBars: buildNationBreakdownBars(nation),
      eraSnapshots: [
        {
          id: `era-1-${nation.nationNum}`,
          eraLabel: nation.foundingEra,
          yearLabel: `Mốc ${nation.validFromTick}`,
          summary: `Giai đoạn lập quốc và định hình ngôn ngữ ${nation.primaryLanguage} tại khu vực ${nation.regionName}.`,
          keyChanges: `Dân số ước tính ~${popEarly.toLocaleString("vi-VN")} người · Thiết lập thủ đô ${nation.capital}`,
        },
        {
          id: `era-2-${nation.nationNum}`,
          eraLabel: "Kỷ Nguyên Hiệp Ước & Giao thương",
          yearLabel: "Mốc 400–750",
          summary: `Mở rộng mạng lưới thương lộ, ký kết các hiệp định biên giới và gia nhập khối ${nation.bloc}.`,
          keyChanges: `Dân số ước tính ~${popMid.toLocaleString("vi-VN")} người · Chuẩn hóa văn khố & tiền tệ ${currency}`,
        },
        {
          id: `era-3-${nation.nationNum}`,
          eraLabel: "Hiện Đại Hành Tinh (Aethelgard Prime)",
          yearLabel: "Mốc 750–1000+",
          summary: `Hoàn thiện hạ tầng giáo dục, trắc địa và liên kết học thuật xuyên 8 lục địa.`,
          keyChanges: `Dân số ${nation.population.toLocaleString("vi-VN")} người · Thể chế ${nation.governmentType}`,
        },
      ],
      contentMarkdown,
      customFields: {
        capital: nation.capital,
        founded_era: nation.foundingEra,
        governance: nation.governmentType,
        ruler,
        population: nation.population,
        currency,
        official_languages: [nation.primaryLanguage],
        provinces_table: buildProvincesTable(nation),
      },
      sourcesMarkdown: `- Niên giám Địa chính trị **${bundle.planetName}** — Hồ sơ #${nation.nationNum} (${nation.regionName}).\n- Văn khố Hiệp ước **${nation.bloc}** lưu tại [[Học Viện Ngã Ba Tam Biên]].`,
      privateNotes: "",
      gallery: [],
      editorialNotes: [],
      createdBy: "Đại Học Giả (Admin)",
      updatedBy: "Đại Học Giả (Admin)",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
  });

  if (workspaceId === "ws-aethelgard") {
    cached360Entries = entries;
  }
  return entries;
}

export function buildTriBorderAndMajorRelations(
  workspaceId = "ws-aethelgard",
  now = "2026-11-22T07:00:00.000Z",
): EntryRelation[] {
  if (cached360Relations && workspaceId === "ws-aethelgard") {
    return cached360Relations;
  }

  const pairs: Array<[number, number, string, string]> = [
    [1, 2, "Đồng minh Liên minh Tam Biên", "Hiệp ước Liên minh Tam Biên Valoria–ZogKoth"],
    [1, 3, "Đồng minh Liên minh Tam Biên", "Hiệp ước Liên minh Tam Biên Valoria–Ignisia"],
    [2, 3, "Đồng minh Liên minh Tam Biên", "Hiệp ước Liên minh Tam Biên ZogKoth–Ignisia"],
    [1, 201, "Đồng bảo trợ", "Hiến chương Bảo trợ Vùng Đệm Lưu Trữ Tam Biên"],
    [2, 201, "Đồng bảo trợ", "Hiến chương Bảo trợ Vùng Đệm Lưu Trữ Tam Biên"],
    [3, 201, "Đồng bảo trợ", "Hiến chương Bảo trợ Vùng Đệm Lưu Trữ Tam Biên"],
    [201, 203, "Liên hiệp Học thuật", "Liên hiệp Thư viện & Học viện Tam Biên"],
    [1, 4, "Đối tác Thông thương", "Hành lang Tơ lụa Aurelia–Occidentalis"],
    [3, 5, "Đối tác Thông thương", "Hành lang Thương mại Aurelia–Orientis"],
    [4, 6, "Liên kết Hàng hải", "Tuyến thương cảng Eo biển Tây"],
    [6, 7, "Hiệp định Giao thương", "Tuyến hàng hải Tây Bán Cầu"],
    [9, 8, "Liên kết Hải dương", "Đại Hải Trình Trung Dương–Australis"],
    [1, 10, "Hợp tác Khảo sát", "Hành lang Học giả & Trắc địa Bắc Cực"],
  ];

  const rels: EntryRelation[] = pairs.map(([a, b, relationType, note], idx) => ({
    id: `rel-planet-${idx + 1}`,
    workspaceId,
    sourceEntryId: `ent-nation-${a}`,
    targetEntryId: `ent-nation-${b}`,
    relationType,
    note,
    createdAt: now,
  }));

  if (workspaceId === "ws-aethelgard") {
    cached360Relations = rels;
  }
  return rels;
}
