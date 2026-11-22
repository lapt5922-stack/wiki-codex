import type {
  Category,
  Entry,
  EntryCustomProperty,
  EntryRelation,
  TableFieldValue,
} from "@/types/codex";
import { slugifyVietnamese } from "@/lib/vietnamese";
import { BIOME_META, DIPLOMACY_META, TIER_META } from "./climate-geology";
import { buildPlanetaryAtlasBundle } from "./generator";
import { CONTINENT_NAME_VI } from "./nations-data";
import type { ContinentId, PlanetaryNation } from "./types";

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
        disabled: ["power"],
      },
      extraFields,
      lawsAndCustoms: [
        {
          id: `law-1-${nation.nationNum}`,
          title: `Hiến chương Hành chính ${nation.shortName}`,
          category: "law",
          summary: `Quy định phân cấp quản trị theo thể chế ${nation.governmentType.toLowerCase()} và bảo vệ quyền lưu trữ văn thư dân sự tại ${nation.capital}.`,
          enforcement: `Hội đồng Pháp chế & Tòa án Hành chính ${nation.capital}`,
        },
        {
          id: `law-2-${nation.nationNum}`,
          title: `Quy ước Bảo tồn Sinh thái ${biomeLabel}`,
          category: "custom",
          summary: `Điều chỉnh khai thác bền vững tài nguyên bản địa phù hợp điều kiện khí hậu ${nation.avgTempC}°C và cao độ ${nation.elevationM} m.`,
          enforcement: `Sở Địa chất & Giám sát Môi trường khu vực ${nation.regionCode}`,
        },
      ],
      eraSnapshots: [
        {
          id: `era-1-${nation.nationNum}`,
          eraLabel: nation.foundingEra,
          yearLabel: `Mốc ${nation.validFromTick}`,
          summary: `Giai đoạn lập quốc và định hình ngôn ngữ ${nation.primaryLanguage} tại khu vực ${nation.regionName}.`,
          keyChanges: `Thiết lập thủ đô ${nation.capital} và khung hành chính ${nation.governmentType.toLowerCase()}.`,
        },
        {
          id: `era-2-${nation.nationNum}`,
          eraLabel: "Kỷ Nguyên Hiệp Ước & Bách Khoa",
          yearLabel: "Mốc 500–1000",
          summary: `Hội nhập sâu vào mạng lưới giao thương ${nation.bloc} và chuẩn hóa bản đồ trắc địa toàn hành tinh.`,
          keyChanges: `Ký kết các hiệp định biên giới, thông thương và lưu trữ văn thư chuẩn hóa tại Viện Lưu trữ Hành tinh.`,
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
