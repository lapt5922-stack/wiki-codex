import { describe, expect, it } from "vitest";
import {
  matchesVietnameseQuery,
  normalizeVietnamese,
  slugifyVietnamese
} from "@/lib/vietnamese";
import {
  buildCategoryTree,
  collectAutoExpandedIds,
  wouldCreateCategoryCycle
} from "@/lib/category-tree";
import {
  computeBacklinks,
  extractSpoilerBlocks,
  extractWikilinks,
  findUnlinkedMentions,
  linkFirstMention
} from "@/lib/wikilinks";
import {
  DEFAULT_AETHELIAN_LEXICON,
  spellWordInConlang,
  toAncientScript,
  translateVietnameseToConlang
} from "@/lib/conlang";
import {
  analyzeWikiHealth,
  buildKnowledgeGraph,
  buildLineageTree,
  findShortestPath
} from "@/lib/graph";
import {
  buildCodexBookHtml,
  buildComparisonMatrix,
  buildHierarchySvgString,
  computeCodexAnalytics,
  computeHierarchyLayout,
  computeMoonPhase,
  computeRouteDistanceKm,
  computeTravelTimes,
  fromAbsoluteDay,
  generateConlangNames as generateConlangNamesV4,
  toAbsoluteDay
} from "@/lib/v4-engines";
import {
  computeSchemaCompleteness,
  entrySupportsPower,
  entryTypeSupportsPower,
  extractCardHighlights,
  resolveEntryTabs
} from "@/lib/v5-properties";
import {
  canEditContent,
  canPermanentDelete,
  filterEntriesForRole,
  sanitizeEntryForRole
} from "@/lib/rbac";
import {
  exportBundleToHtml,
  exportBundleToZipBuffer,
  exportEntryToMarkdown,
  parseMarkdownImport
} from "@/lib/export-utils";
import { createInitialSeedState } from "@/db/seed-data";
import { getEntryHoldingsContext, queryEntriesFromState } from "@/db/repository";
import {
  buildComparisonMatrixMarkdown,
  calculateRouteDistanceKm,
  computeLineDiff,
  estimateTravelDays,
  exportEntriesToCsv,
  generateConlangNames,
  getMoonPhaseForDay,
  reverseTranslateConlang
} from "@/lib/v2-engines";
import {
  buildCrestSvgString,
  classifyPowerTier,
  computeRadarPolygonPoints,
  convertWorldUnit,
  formatUnboundedPower,
  generateWorldbuildingPrompt,
  runLoreConsistencyAudit
} from "@/lib/v3-engines";
import type { Category, Entry } from "@/types/codex";

describe("1. Tiếng Việt không dấu & Slugify", () => {
  it("chuẩn hóa dấu tiếng Việt và chữ đ/Đ chính xác", () => {
    expect(normalizeVietnamese("Vương quốc Băng Triều — Địa danh")).toBe(
      "vuong quoc bang trieu — dia danh"
    );
    expect(slugifyVietnamese("Đế chế Hoàng Kim Solaria")).toBe(
      "de-che-hoang-kim-solaria"
    );
    expect(
      matchesVietnameseQuery("Tháp Tinh Tú Orakel'on Phương Bắc", "thap tinh tu bac")
    ).toBe(true);
    expect(matchesVietnameseQuery("Rừng Ngọc Sylvaris", "hoang kim")).toBe(false);
  });
});

describe("2. Cây Danh mục Đa cấp (Cha -> Con -> Cháu), Đếm không trùng & Chống vòng lặp", () => {
  const cats: Category[] = [
    {
      id: "root",
      workspaceId: "ws-1",
      parentId: null,
      name: "Vương quốc",
      slug: "vuong-quoc",
      description: "",
      icon: "Castle",
      sigil: "⚜",
      color: "#D4AF37",
      sortOrder: 1,
      deletedAt: null,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "child",
      workspaceId: "ws-1",
      parentId: "root",
      name: "Phương Bắc",
      slug: "phuong-bac",
      description: "",
      icon: "Snowflake",
      sigil: "✧",
      color: "#38BDF8",
      sortOrder: 1,
      deletedAt: null,
      createdAt: "",
      updatedAt: ""
    },
    {
      id: "grandchild",
      workspaceId: "ws-1",
      parentId: "child",
      name: "Hoàng triều Băng Triều",
      slug: "hoang-trieu",
      description: "",
      icon: "Crown",
      sigil: "❖",
      color: "#60A5FA",
      sortOrder: 1,
      deletedAt: null,
      createdAt: "",
      updatedAt: ""
    }
  ];

  it("đếm chính xác không trùng lặp khi cộng dồn từ Cháu -> Con -> Cha", () => {
    const entries = [
      { id: "e1", categoryId: "grandchild" },
      { id: "e2", categoryId: "child" },
      { id: "e3", categoryId: "root" },
      { id: "e1", categoryId: "grandchild" } // duplicate ref must not double count
    ];
    const tree = buildCategoryTree(cats, entries);
    expect(tree).toHaveLength(1);
    expect(tree[0].totalUniqueCount).toBe(3);
    expect(tree[0].children[0].totalUniqueCount).toBe(2);
    expect(tree[0].children[0].children[0].totalUniqueCount).toBe(1);
  });

  it("tìm kiếm không dấu tự động mở các nhánh cha chứa kết quả", () => {
    const tree = buildCategoryTree(cats, [], "bang trieu");
    expect(tree).toHaveLength(1);
    const expanded = collectAutoExpandedIds(tree);
    expect(expanded).toContain("root");
    expect(expanded).toContain("child");
  });

  it("chống vòng lặp khi đổi danh mục cha", () => {
    expect(wouldCreateCategoryCycle(cats, "root", "root")).toBe(true);
    expect(wouldCreateCategoryCycle(cats, "root", "grandchild")).toBe(true);
    expect(wouldCreateCategoryCycle(cats, "child", "grandchild")).toBe(true);
    expect(wouldCreateCategoryCycle(cats, "grandchild", "root")).toBe(false);
    expect(wouldCreateCategoryCycle(cats, "grandchild", null)).toBe(false);
  });
});

describe("3. Wikilinks, Backlinks, Unlinked Mentions & Spoiler", () => {
  const seed = createInitialSeedState();
  const wsEntries = seed.entries.filter((e) => e.workspaceId === "ws-aethelgard");

  it("trích xuất [[Wikilink]] và [[Target|Alias]] chính xác", () => {
    const links = extractWikilinks(
      "Xem [[Vương quốc Băng Triều]] và [[Tháp Tinh Tú Orakel'on|Đại Tháp]]."
    );
    expect(links).toHaveLength(2);
    expect(links[0].targetTitle).toBe("Vương quốc Băng Triều");
    expect(links[1].displayLabel).toBe("Đại Tháp");
  });

  it("tính Backlinks kèm ngữ cảnh trích dẫn", () => {
    const orakel = wsEntries.find((e) => e.id === "ent-orakel")!;
    const backlinks = computeBacklinks(orakel, wsEntries);
    expect(backlinks.length).toBeGreaterThanOrEqual(3);
    expect(backlinks.some((b) => b.sourceEntryId === "ent-bang-trieu")).toBe(true);
  });

  it("phát hiện nhắc tới chưa liên kết (Unlinked Mentions) và chuyển thành [[...]]", () => {
    const sample: Pick<Entry, "id" | "contentMarkdown"> = {
      id: "ent-test",
      contentMarkdown: "Học giả từng ghé thăm Rừng Ngọc Sylvaris để ghi chép."
    };
    const mentions = findUnlinkedMentions(sample, wsEntries);
    expect(mentions.some((m) => m.targetEntryId === "ent-sylvaris")).toBe(true);

    const linked = linkFirstMention(sample.contentMarkdown, "Rừng Ngọc Sylvaris");
    expect(linked).toContain("[[Rừng Ngọc Sylvaris]]");
  });

  it("nhận diện khối :::spoiler", () => {
    const bangTrieu = wsEntries.find((e) => e.id === "ent-bang-trieu")!;
    const spoilers = extractSpoilerBlocks(bangTrieu.contentMarkdown);
    expect(spoilers).toHaveLength(1);
    expect(spoilers[0].label).toContain("Hầm Lưu Trữ");
  });
});

describe("4. Bộ Ngôn ngữ Thế giới (Conlang Aethel'va) & Dịch 1 Ấn", () => {
  it("dịch 1-click Tiếng Việt sang Phiên âm & Văn tự Cổ ngữ nhất quán", () => {
    const res1 = translateVietnameseToConlang(
      "Vương quốc và thư viện của ánh sáng tinh tú",
      { lexicon: DEFAULT_AETHELIAN_LEXICON, scriptStyle: "runic" }
    );
    const res2 = translateVietnameseToConlang(
      "Vương quốc và thư viện của ánh sáng tinh tú",
      { lexicon: DEFAULT_AETHELIAN_LEXICON, scriptStyle: "runic" }
    );
    expect(res1.romanized).toBe(res2.romanized);
    expect(res1.romanized).toContain("Valdoria");
    expect(res1.romanized).toContain("Orakel'on");
    expect(res1.romanized).toContain("Aeloria");
    expect(res1.runic).toBe(toAncientScript(res1.romanized, "runic"));
  });

  it("hỗ trợ chế độ chữ Celestial và từ điển tùy biến", () => {
    const custom = translateVietnameseToConlang("Thành phố pha lê", {
      scriptStyle: "celestial",
      lexicon: [
        {
          id: "cw-1",
          vietnamese: "pha lê",
          romanized: "Crystael",
          runic: toAncientScript("Crystael", "celestial"),
          partOfSpeech: "Danh từ",
          note: ""
        }
      ]
    });
    expect(custom.romanized).toContain("Crystael");
    expect(custom.runic.length).toBeGreaterThan(5);
  });
});

describe("5. Đồ thị Tri thức, BFS Đường nối ngắn nhất, Gia phả & Sức khỏe Wiki", () => {
  const seed = createInitialSeedState();
  const wsEntries = seed.entries.filter(
    (e) => e.workspaceId === "ws-aethelgard" && !e.deletedAt
  );
  const wsRels = seed.relations.filter((r) => r.workspaceId === "ws-aethelgard");
  const wsTypes = seed.entryTypes.filter((t) => t.workspaceId === "ws-aethelgard");

  it("tìm đường nối ngắn nhất (BFS) giữa hai hồ sơ", () => {
    const path = findShortestPath(wsEntries, wsRels, "ent-bang-trieu", "ent-sylvaris");
    expect(path.found).toBe(true);
    expect(path.pathNodeIds[0]).toBe("ent-bang-trieu");
    expect(path.pathNodeIds[path.pathNodeIds.length - 1]).toBe("ent-sylvaris");
  });

  it("xây dựng đồ thị Ego-Graph giới hạn quy mô lớn", () => {
    const graph = buildKnowledgeGraph(wsEntries, wsRels, wsTypes, {
      focusEntryId: "ent-orakel",
      depth: 1,
      maxNodes: 50
    });
    expect(graph.nodes.some((n) => n.id === "ent-orakel")).toBe(true);
    expect(graph.edges.length).toBeGreaterThan(0);
  });

  it("xây dựng cây Gia phả / Phân cấp từ quan hệ", () => {
    const tree = buildLineageTree("ent-lyraen", wsEntries, wsRels, wsTypes);
    expect(tree).not.toBeNull();
    expect(tree!.children.length).toBeGreaterThan(0);
  });

  it("phát hiện Liên kết Đỏ (Broken Links) như [[Thành cổ Mất tích]]", () => {
    const health = analyzeWikiHealth(wsEntries, wsRels);
    expect(
      health.brokenLinks.some((b) => b.missingTitle === "Thành cổ Mất tích")
    ).toBe(true);
  });
});

describe("6. Phân quyền RBAC & Lọc sạch Dữ liệu Riêng tư cho Khách", () => {
  const seed = createInitialSeedState();
  const wsTypes = seed.entryTypes.filter((t) => t.workspaceId === "ws-aethelgard");

  it("kiểm tra quyền cơ bản của Admin / Editor / Guest", () => {
    expect(canEditContent("admin")).toBe(true);
    expect(canEditContent("editor")).toBe(true);
    expect(canEditContent("guest")).toBe(false);
    expect(canPermanentDelete("admin")).toBe(true);
    expect(canPermanentDelete("editor")).toBe(false);
  });

  it("ẩn hoàn toàn hồ sơ private/draft và lọc sạch privateNotes + trường private_note cho Guest", () => {
    const bangTrieu = seed.entries.find((e) => e.id === "ent-bang-trieu")!;
    const kingdomType = wsTypes.find((t) => t.id === "type-kingdom")!;
    const forGuest = sanitizeEntryForRole(bangTrieu, "guest", kingdomType);

    expect(forGuest).not.toBeNull();
    expect(forGuest!.privateNotes).toBe("");
    expect(forGuest!.editorialNotes).toHaveLength(0);
    expect(forGuest!.customFields.private_editorial_plan).toBeUndefined();

    const privateDraft = seed.entries.find((e) => e.id === "ent-private-draft")!;
    expect(sanitizeEntryForRole(privateDraft, "guest")).toBeNull();

    const visibleForGuest = filterEntriesForRole(seed.entries, "guest", seed.entryTypes);
    expect(visibleForGuest.some((e) => e.id === "ent-private-draft")).toBe(false);
  });
});

describe("7. Xuất / Nhập dữ liệu (JSON, Markdown, HTML, ZIP)", () => {
  it("xuất và nhập lại Markdown, HTML và ZIP thành công", async () => {
    const seed = createInitialSeedState();
    const ws = seed.workspaces[0];
    const entry = seed.entries[0];

    const md = exportEntryToMarkdown(entry);
    expect(md).toContain(`title: "${entry.title}"`);

    const parsed = parseMarkdownImport(md);
    expect(parsed.title).toBe(entry.title);
    expect(parsed.tags).toEqual(entry.tags);

    const bundle = {
      format: "wiki-codex-v1" as const,
      exportedAt: new Date().toISOString(),
      workspace: ws,
      categories: seed.categories.filter((c) => c.workspaceId === ws.id),
      entryTypes: seed.entryTypes.filter((t) => t.workspaceId === ws.id),
      entries: [entry],
      relations: [],
      timelineEvents: [],
      atlasMaps: [],
      atlasPins: [],
      conlangs: []
    };

    const html = exportBundleToHtml(bundle);
    expect(html).toContain(entry.title);

    const zipBytes = await exportBundleToZipBuffer(bundle);
    expect(zipBytes.byteLength).toBeGreaterThan(200);
  });
});

describe("8. Benchmark Quy mô lớn (10.000 thẻ nhân vật & vương quốc)", () => {
  it("phân trang nhẹ, tìm kiếm không dấu và đếm cây danh mục trên 10.000 hồ sơ trong thời gian cực nhanh", () => {
    const state = createInitialSeedState();
    const baseEntry = state.entries[0];

    // Synthesize 10,000 cards (nhân vật, vương quốc, địa danh)
    const synthetic: Entry[] = [];
    for (let i = 0; i < 10_000; i++) {
      synthetic.push({
        ...baseEntry,
        id: `ent-bench-${i}`,
        slug: `ho-so-quy-mo-${i}`,
        title:
          i === 7777
            ? "Vương quốc Pha Lê Huyền Ảo Cực Đông"
            : `Nhân vật Truyền kỳ thứ ${i}`,
        categoryId: i % 2 === 0 ? "cat-bang-trieu-chi" : "cat-hoc-gia",
        contentMarkdown: "Tư liệu sử học ngắn gọn phục vụ kiểm thử tải.",
        updatedAt: `2026-11-22T07:00:${String(i % 60).padStart(2, "0")}.000Z`
      });
    }
    state.entries.push(...synthetic);

    const t0 = performance.now();
    const page1 = queryEntriesFromState(state, {
      workspaceId: "ws-aethelgard",
      role: "guest",
      page: 1,
      limit: 24
    });
    const searchHit = queryEntriesFromState(state, {
      workspaceId: "ws-aethelgard",
      role: "guest",
      query: "pha le huyen ao cuc dong",
      page: 1,
      limit: 24
    });
    const tree = buildCategoryTree(
      state.categories.filter((c) => c.workspaceId === "ws-aethelgard"),
      state.entries.filter((e) => e.workspaceId === "ws-aethelgard" && !e.deletedAt)
    );
    const elapsedMs = performance.now() - t0;

    expect(page1.total).toBeGreaterThanOrEqual(10_000);
    expect(page1.items).toHaveLength(24);
    expect(searchHit.items[0]?.title).toContain("Pha Lê Huyền Ảo");
    expect(tree[0].totalUniqueCount).toBeGreaterThanOrEqual(5_000);
    // Must complete well under 1500ms even in JS single-thread test environment
    expect(elapsedMs).toBeLessThan(1500);
  });
});

describe("9. Tính năng Đại Cập Nhật V2.0 Grand Edition", () => {
  it("khởi tạo sẵn 22+ danh mục đa cấp và 10 loại thực thể chuyên sâu", () => {
    const seed = createInitialSeedState();
    expect(seed.categories.length).toBeGreaterThanOrEqual(22);
    expect(seed.entryTypes.length).toBeGreaterThanOrEqual(10);
    const bt = seed.entries.find((e) => e.id === "ent-bang-trieu")!;
    expect(bt.epigraph?.quote.length).toBeGreaterThan(10);
    expect(bt.customSections?.length).toBeGreaterThanOrEqual(2);
    expect(bt.eraSnapshots?.length).toBeGreaterThanOrEqual(2);
    expect(bt.breakdownBars?.length).toBeGreaterThanOrEqual(3);
  });

  it("Visual Revision Diff phát hiện chính xác dòng thêm và dòng xóa", () => {
    const diff = computeLineDiff("Dòng 1\nDòng cũ\nDòng 3", "Dòng 1\nDòng mới\nDòng 3");
    expect(diff.some((d) => d.type === "removed" && d.text === "Dòng cũ")).toBe(true);
    expect(diff.some((d) => d.type === "added" && d.text === "Dòng mới")).toBe(true);
  });

  it("Lịch Pháp Thế Giới tính chu kỳ Mặt trăng chính xác", () => {
    const m0 = getMoonPhaseForDay(0, 28);
    const m14 = getMoonPhaseForDay(14, 28);
    expect(m0.glyph).toBe("🌑");
    expect(m14.glyph).toBe("🌕");
  });

  it("Cổ Ngữ V2 sinh tên thế giới & dịch ngược từ điển gốc", () => {
    const names = generateConlangNames("kingdom", 6, { scriptStyle: "runic" }, 1);
    expect(names).toHaveLength(6);
    expect(names[0].romanized.length).toBeGreaterThan(3);

    const rev = reverseTranslateConlang("Valdoria et Orakel'on", {
      lexicon: DEFAULT_AETHELIAN_LEXICON
    });
    expect(rev.matchedCount).toBeGreaterThanOrEqual(2);
    expect(rev.vietnamese.toLowerCase()).toContain("vương quốc");
  });

  it("Atlas V2 đo khoảng cách tuyến đường & ước tính ngày di chuyển", () => {
    const km = calculateRouteDistanceKm(
      [
        { xPercent: 10, yPercent: 20 },
        { xPercent: 60, yPercent: 20 }
      ],
      2000
    );
    expect(km).toBe(1000);
    const days = estimateTravelDays(km);
    expect(days.onFootDays).toBeGreaterThan(days.sailingShipDays);
  });

  it("Xuất CSV và Ma trận Đối chiếu Nhiều Thực thể", () => {
    const seed = createInitialSeedState();
    const pair = seed.entries.slice(0, 2);
    const csv = exportEntriesToCsv(pair);
    expect(csv).toContain("Tiêu đề");
    expect(csv).toContain(pair[0].title);

    const md = buildComparisonMatrixMarkdown(pair, seed.entryTypes);
    expect(md).toContain("| Thuộc tính |");
    expect(md).toContain(pair[0].title);
  });
});

describe("10. Đại Cập Nhật V3.0 (Power Level ∞, Radar, 6 Ngôn Ngữ + Bảng Chữ Cái, Công cụ Omniverse)", () => {
  it("định dạng Power Level không giới hạn và phân tầng Tier chính xác", () => {
    expect(formatUnboundedPower(420)).toBe("420");
    expect(formatUnboundedPower(12500)).toBe("12.5K");
    expect(formatUnboundedPower(1_250_000)).toBe("1.25M");
    expect(formatUnboundedPower(4_800_000_000)).toBe("4.80B");
    expect(formatUnboundedPower(undefined, true)).toContain("∞");

    expect(classifyPowerTier(50).code).toBe("F");
    expect(classifyPowerTier(18500).code).toBe("A");
    expect(classifyPowerTier(485000).code).toBe("S");
    expect(classifyPowerTier(1_250_000).code).toBe("SS");
    expect(classifyPowerTier(undefined, true).code).toBe("Ω");
  });

  it("Biểu đồ Radar SVG tự động chuyển thang Logarit khi chỉ số chênh lệch cực lớn", () => {
    const radar = computeRadarPolygonPoints([
      { id: "1", key: "a", label: "Trí tuệ", value: 50, sliderMax: 100, color: "#60A5FA", sigil: "✦" },
      { id: "2", key: "b", label: "Năng lượng", value: 1_000_000, sliderMax: 100, color: "#D4AF37", sigil: "⚜" },
      { id: "3", key: "c", label: "Ý chí", value: 5000, sliderMax: 100, color: "#A78BFA", sigil: "⚝" }
    ]);
    expect(radar.usesLogScale).toBe(true);
    expect(radar.points).toHaveLength(3);
    expect(radar.polygonString.length).toBeGreaterThan(10);
  });

  it("khởi tạo 6 ngôn ngữ thế giới + Bảng chữ cái 29 ký tự & Công cụ Đánh vần 1-Click", () => {
    const seed = createInitialSeedState();
    expect(seed.conlangs).toHaveLength(6);
    expect(seed.conlangs[0].alphabet?.length).toBeGreaterThanOrEqual(29);

    const tiles = spellWordInConlang("Aethel", seed.conlangs[0]);
    expect(tiles).toHaveLength(6);
    expect(tiles[0].glyph).toBe("ᚨ");
  });

  it("quy đổi Tiền tệ & Đơn vị Thế giới, sinh Huy hiệu SVG, Gợi ý sáng tạo & Kiểm tra nhất quán", () => {
    const seed = createInitialSeedState();
    const gold = seed.worldUnits.find((u) => u.id === "u-sol-gold")!;
    const silver = seed.worldUnits.find((u) => u.id === "u-bt-silver")!;
    expect(convertWorldUnit(5, gold, silver)).toBe(50);

    const svg = buildCrestSvgString({
      shape: "shield",
      layout: "quartered",
      primaryColor: "#1E3A8A",
      secondaryColor: "#7C2D12",
      sigil: "⚜",
      sigilColor: "#D4AF37",
      motto: "AETHEL"
    });
    expect(svg).toContain("<svg");
    expect(svg).toContain("⚜");

    const prompt = generateWorldbuildingPrompt("kingdom", 0);
    expect(prompt.title.length).toBeGreaterThan(3);

    const audit = runLoreConsistencyAudit(seed.entries);
    expect(audit.missingCoverCount).toBeGreaterThanOrEqual(0);

    // Power Level filter & sorting
    const highPower = queryEntriesFromState(seed, {
      workspaceId: "ws-aethelgard",
      role: "guest",
      minPower: 100_000,
      sortBy: "powerLevel",
      sortDir: "desc"
    });
    expect(highPower.items.length).toBeGreaterThanOrEqual(2);
    expect(highPower.items[0].id).toBe("ent-solaria");
  });
});

describe("11. Đại Cập Nhật V4.0 — Studio Thế Giới, Phả Hệ, Lịch Đa Trăng & Xuất Bản", () => {
  it("khởi tạo đầy đủ dữ liệu V4.0 (Gia phả, Quy luật Vũ trụ, Sinh học, Kinh tế, Biên niên sử, Đa hình thái)", () => {
    const seed = createInitialSeedState();
    expect(seed.hierarchyCharts.length).toBeGreaterThanOrEqual(1);
    expect(seed.systemRules.length).toBeGreaterThanOrEqual(1);
    expect(seed.taxonomyNodes.length).toBeGreaterThanOrEqual(4);
    expect(seed.tradeCommodities.length).toBeGreaterThanOrEqual(4);
    expect(seed.chronicleChapters.length).toBeGreaterThanOrEqual(2);
    const lyraen = seed.entries.find((e) => e.id === "ent-lyraen")!;
    expect(lyraen.variants?.length).toBeGreaterThanOrEqual(2);
    expect(seed.calendars[0].moons?.length).toBe(3);
  });

  it("chuyển đổi ngày tuyệt đối ↔ lịch thế giới đa tháng và tính pha đa mặt trăng chính xác", () => {
    const seed = createInitialSeedState();
    const cal = seed.calendars[0];
    const abs = toAbsoluteDay(cal, 330, 5, 12);
    const back = fromAbsoluteDay(cal, abs);
    expect(back.year).toBe(330);
    expect(back.monthIndex).toBe(5);
    expect(back.day).toBe(12);

    const moon = cal.moons![0];
    expect(computeMoonPhase(moon, 0).glyph).toBe("🌑");
    expect(computeMoonPhase(moon, 14).glyph).toBe("🌕");
  });

  it("tính khoảng cách tuyến đường Atlas và thời gian hành trình đa phương tiện", () => {
    const seed = createInitialSeedState();
    const map = seed.atlasMaps[0];
    const dist = computeRouteDistanceKm(
      { points: [{ xPercent: 10, yPercent: 20 }, { xPercent: 60, yPercent: 20 }] },
      map
    );
    expect(dist).toBeGreaterThan(1000);
    const times = computeTravelTimes(dist);
    expect(times).toHaveLength(4);
    expect(times[0].days).toBeGreaterThan(times[3].days);
  });

  it("dựng tọa độ cây Gia phả SVG không trùng lặp và xuất file SVG hợp lệ", () => {
    const seed = createInitialSeedState();
    const chart = seed.hierarchyCharts[0];
    const layout = computeHierarchyLayout(chart.nodes);
    expect(layout.nodes).toHaveLength(chart.nodes.length);
    expect(layout.edges.length).toBe(chart.nodes.length - 1);
    const svg = buildHierarchySvgString(chart.name, layout);
    expect(svg).toContain("<svg");
    expect(svg).toContain("Lyraen Vaelor");
  });

  it("so sánh đa thực thể, tính thống kê Analytics, sinh tên Conlang V4 và xuất sách HTML in ấn", () => {
    const seed = createInitialSeedState();
    const pair = seed.entries.filter((e) => e.workspaceId === "ws-aethelgard").slice(0, 3);
    const rows = buildComparisonMatrix(pair);
    expect(rows.some((r) => r.key === "__power")).toBe(true);

    const analytics = computeCodexAnalytics(
      seed.entries.filter((e) => e.workspaceId === "ws-aethelgard"),
      seed.relations.filter((r) => r.workspaceId === "ws-aethelgard"),
      seed.entryTypes.filter((t) => t.workspaceId === "ws-aethelgard")
    );
    expect(analytics.totalEntries).toBeGreaterThanOrEqual(8);
    expect(analytics.completenessPercent).toBeGreaterThan(0);

    const names = generateConlangNamesV4(seed.conlangs[0], "city", 5, 1);
    expect(names).toHaveLength(5);
    expect(names[0].script.length).toBeGreaterThan(0);

    const bookHtml = buildCodexBookHtml({
      bookTitle: "Đại Bách Khoa Aethelgard",
      subtitle: "Ấn bản V4.0",
      author: "Admin",
      preface: "Lời tựa thử nghiệm",
      entries: pair,
      includePower: true,
      includeQuotes: true
    });
    expect(bookHtml).toContain("<!DOCTYPE html>");
    expect(bookHtml).toContain("Mục Lục");
  });
});

describe("12. Đại Cập Nhật V5.0 — Chuẩn Hóa Thực Thể, Trường Tùy Biến Động & Thẻ Chuyên Biệt", () => {
  it("tách rạch ròi 14 loại thực thể: Cổ ngữ/Sự kiện/Đô thị/Tôn giáo KHÔNG có mục Chỉ số & Power Level", () => {
    const seed = createInitialSeedState();
    expect(seed.entryTypes.length).toBeGreaterThanOrEqual(14);

    const langType = seed.entryTypes.find((t) => t.id === "type-language")!;
    const eventType = seed.entryTypes.find((t) => t.id === "type-event")!;
    const religionType = seed.entryTypes.find((t) => t.id === "type-religion")!;
    const cityType = seed.entryTypes.find((t) => t.id === "type-city")!;
    const charType = seed.entryTypes.find((t) => t.id === "type-character")!;
    const kingdomType = seed.entryTypes.find((t) => t.id === "type-kingdom")!;

    expect(entryTypeSupportsPower(langType)).toBe(false);
    expect(entryTypeSupportsPower(eventType)).toBe(false);
    expect(entryTypeSupportsPower(religionType)).toBe(false);
    expect(entryTypeSupportsPower(cityType)).toBe(false);
    expect(entryTypeSupportsPower(charType)).toBe(true);
    expect(entryTypeSupportsPower(kingdomType)).toBe(true);

    const aethelva = seed.entries.find((e) => e.id === "ent-aethelva")!;
    expect(aethelva.entryTypeId).toBe("type-language");
    expect(entrySupportsPower(aethelva, langType)).toBe(false);
    expect(resolveEntryTabs(aethelva, langType)).not.toContain("power");
    expect(langType.cardStyle).toBe("language");
    expect(charType.cardStyle).toBe("character");
    expect(kingdomType.cardStyle).toBe("kingdom");
  });

  it("hỗ trợ trường thuộc tính động (extraFields), ẩn private_note với Guest, tìm kiếm xuyên thuộc tính & tính độ hoàn thiện", () => {
    const seed = createInitialSeedState();
    const aethelva = seed.entries.find((e) => e.id === "ent-aethelva")!;
    const langType = seed.entryTypes.find((t) => t.id === "type-language")!;

    // Extract collectible card highlights
    const highlights = extractCardHighlights(aethelva, langType);
    expect(highlights.length).toBeGreaterThanOrEqual(2);

    // Search across extraFields & customFields
    const searchRes = queryEntriesFromState(seed, {
      workspaceId: "ws-aethelgard",
      role: "guest",
      query: "SVO"
    });
    expect(searchRes.items.some((i) => i.id === "ent-aethelva")).toBe(true);
    expect(searchRes.items.find((i) => i.id === "ent-aethelva")?.supportsPower).toBe(false);

    // RBAC strips private_note extraFields for guest
    const withPrivate = {
      ...aethelva,
      extraFields: [
        ...(aethelva.extraFields ?? []),
        { id: "ef-secret", label: "Bí mật tác giả", group: "Nội bộ", kind: "private_note" as const, value: "Chỉ admin thấy", showInInfobox: true, order: 99 }
      ]
    };
    const guestView = sanitizeEntryForRole(withPrivate, "guest", langType)!;
    expect(guestView.extraFields?.some((f) => f.kind === "private_note")).toBe(false);

    // Schema Completeness Meter
    const comp = computeSchemaCompleteness(aethelva, langType);
    expect(comp.percent).toBeGreaterThan(60);
  });
});

describe("13. Đại Cập Nhật V6.0 — Sở Hữu Hai Chiều, Lãnh Địa Trực Thuộc & Hồ Sơ Chuyên Sâu", () => {
  it("đồng bộ 2 chiều giữa Vương quốc và Địa điểm trực thuộc + dựng chuỗi Breadcrumb đa cấp", () => {
    const seed = createInitialSeedState();

    // Chiều xuôi: Vương quốc Băng Triều sở hữu Kinh đô Aurelia, Rừng Ngọc, Gia tộc Vaelor, Pháo đài
    const btCtx = getEntryHoldingsContext(seed, "ent-bang-trieu", "guest");
    expect(btCtx.ownedHoldings.length).toBeGreaterThanOrEqual(4);
    expect(btCtx.ownedHoldings.some((h) => h.targetEntryId === "ent-aurelia")).toBe(true);

    // Chiều ngược: Mở Kinh đô Aurelia thấy ngay Chủ sở hữu là Vương quốc Băng Triều
    const aurCtx = getEntryHoldingsContext(seed, "ent-aurelia", "guest");
    expect(aurCtx.ownedBy.length).toBeGreaterThanOrEqual(1);
    expect(aurCtx.ownedBy[0].ownerEntryId).toBe("ent-bang-trieu");
    expect(aurCtx.ownershipChain[0].id).toBe("ent-bang-trieu");

    // Chuỗi phân cấp 2 cấp: Vương quốc Băng Triều -> Gia tộc Vaelor -> Hải Đồ Vàng Arion
    const arionCtx = getEntryHoldingsContext(seed, "ent-hai-do-arion", "guest");
    expect(arionCtx.ownershipChain.map((c) => c.id)).toEqual([
      "ent-bang-trieu",
      "ent-gia-toc-vaelor"
    ]);
  });

  it("hỗ trợ Roster, Luật pháp, Quân sự, Sản vật và ẩn bí mật gmOnly với Guest", () => {
    const seed = createInitialSeedState();
    const bt = seed.entries.find((e) => e.id === "ent-bang-trieu")!;
    const kingdomType = seed.entryTypes.find((t) => t.id === "type-kingdom")!;

    expect(bt.roster?.length).toBeGreaterThanOrEqual(3);
    expect(bt.lawsAndCustoms?.length).toBeGreaterThanOrEqual(3);
    expect(bt.forceUnits?.length).toBeGreaterThanOrEqual(2);
    expect(bt.resourceItems?.length).toBeGreaterThanOrEqual(3);
    expect(bt.rumorsAndSecrets?.some((r) => r.gmOnly)).toBe(true);

    const guestView = sanitizeEntryForRole(bt, "guest", kingdomType)!;
    expect(guestView.rumorsAndSecrets?.some((r) => r.gmOnly)).toBe(false);
    expect(guestView.rumorsAndSecrets?.length).toBeGreaterThanOrEqual(1);
  });

  it("chuẩn hóa liên kết theo Biệt danh (Aliases), không dấu, lọc Power chính xác & kiểm toán chỉ trên thực thể có Power", () => {
    const seed = createInitialSeedState();
    const wsEntries = seed.entries.filter((e) => e.workspaceId === "ws-aethelgard");
    const wsRels = seed.relations.filter((r) => r.workspaceId === "ws-aethelgard");
    const wsTypes = seed.entryTypes.filter((t) => t.workspaceId === "ws-aethelgard");

    // 1. Unlinked mention conversion works even when text is unaccented
    const mdLinked = linkFirstMention(
      "Chuyen tham hiem Rung Ngoc Sylvaris nam 300.",
      "Rừng Ngọc Sylvaris"
    );
    expect(mdLinked).toContain("[[Rừng Ngọc Sylvaris|Rung Ngoc Sylvaris]]");

    // 2. maxPower filter must NOT include non-power entries like languages or cities
    const maxPowerRes = queryEntriesFromState(seed, {
      workspaceId: "ws-aethelgard",
      role: "guest",
      maxPower: 500_000,
      sortBy: "powerLevel",
      sortDir: "asc"
    });
    expect(maxPowerRes.items.every((i) => i.supportsPower !== false)).toBe(true);
    expect(maxPowerRes.items.some((i) => i.id === "ent-aethelva")).toBe(false);

    // 3. Lore Consistency Audit with entryTypes skips non-power entities from missingPowerEntries
    const audit = runLoreConsistencyAudit(wsEntries, wsTypes);
    expect(audit.missingPowerEntries.some((x) => x.id === "ent-aethelva")).toBe(false);

    // 4. Analytics resolves accent-insensitive & alias wikilinks without false brokenLinks
    const analytics = computeCodexAnalytics(wsEntries, wsRels, wsTypes);
    expect(analytics.byPowerTier.reduce((s, t) => s + t.count, 0)).toBeLessThan(
      analytics.totalEntries
    );
  });
});

import {
  buildPlanetaryAtlasBundle,
} from "@/lib/planetary-atlas/generator";
import {
  computeExpeditionTravel,
  computePolygonAreaKm2,
  computeSeasonalTempC,
  findShortestNationPath,
  getTwoHopNeighbors,
  resolveDensityHeatColor,
  sampleRouteElevationProfile,
} from "@/lib/planetary-atlas/climate-geology";
import { selectZeroOverlapLabels } from "@/lib/planetary-atlas/lod-engine";
import { samplePlanetaryTerrainPixel } from "@/lib/planetary-atlas/terrain-backdrop";
import {
  autoLinkAllUnlinkedMentions,
  computeEntryCompleteness,
  computeLineDiff as computeWikiLineDiff,
  estimateReadingStats,
  extractFootnotes,
  extractMarkdownToc
} from "@/lib/wiki-intelligence";

describe("14. Mega-Planet World Atlas (360 Quốc gia, Voronoi, Zero-Overlap LOD & Dijkstra)", () => {
  it("sinh đủ 360 quốc gia & lãnh thổ trên 8 lục địa + hải vực, đa giác Voronoi hợp lệ và lõi Tam Biên đồng quy", () => {
    const bundle = buildPlanetaryAtlasBundle();
    expect(bundle.nations).toHaveLength(360);
    expect(bundle.circumferenceKm).toBe(64000);
    expect(Object.keys(bundle.continents)).toHaveLength(8);
    expect(bundle.regions.length).toBeGreaterThanOrEqual(24);

    // Every nation has unique nationNum 1..360 and valid polygon >= 3 vertices
    const nums = new Set(bundle.nations.map((n) => n.nationNum));
    expect(nums.size).toBe(360);
    for (const n of bundle.nations) {
      expect(n.polygon.length).toBeGreaterThanOrEqual(3);
      expect(n.areaKm2).toBeGreaterThan(0);
      expect(n.population).toBeGreaterThan(0);
    }

    // Tri-Border (#1 Valoria, #2 Zog-Koth, #3 Ignisia, #201, #203) share exact junction vertex (0.608, 0.378)
    for (const num of [1, 2, 3, 201, 203]) {
      const nation = bundle.nations.find((n) => n.nationNum === num);
      expect(nation).toBeDefined();
      expect(nation?.isTriBorder).toBe(true);
      const hasJunction = nation?.polygon.some(
        (p) => Math.abs(p.x - 0.608) < 1e-4 && Math.abs(p.y - 0.378) < 1e-4
      );
      expect(hasJunction).toBe(true);
    }

    // Tri-Border (#1 Valoria, #2 Zog-Koth, #3 Ignisia) must be 3 mutual ALLIANCE partners in the same bloc
    const triPairs: Array<[string, string]> = [
      ["nation-1", "nation-2"],
      ["nation-1", "nation-3"],
      ["nation-2", "nation-3"]
    ];
    for (const [a, b] of triPairs) {
      const rel = bundle.diplomacy.find(
        (d) =>
          (d.polityAId === a && d.polityBId === b) ||
          (d.polityBId === a && d.polityAId === b)
      );
      expect(rel?.status).toBe("ALLIANCE");
    }

    // Pure wiki data richness
    expect(bundle.diplomacy.length).toBeGreaterThan(300);
    expect(bundle.resourceFlows.length).toBeGreaterThan(150);
    expect(bundle.routes.length).toBeGreaterThan(20);
  });

  it("đảm bảo Zero-Overlap Label Collision Rejection ở nhiều mức zoom khác nhau", () => {
    const bundle = buildPlanetaryAtlasBundle();
    for (const zoom of [1.0, 2.5, 5.0]) {
      const placed = selectZeroOverlapLabels(bundle.nations, {
        zoom,
        panX: 0,
        panY: 0,
        canvasWidth: bundle.canvasWidth,
        canvasHeight: bundle.canvasHeight
      }).filter((m) => m.showLabel);

      expect(placed.length).toBeGreaterThan(0);
      for (let i = 0; i < placed.length; i++) {
        for (let j = i + 1; j < placed.length; j++) {
          const a = placed[i].box;
          const b = placed[j].box;
          const overlaps = !(
            a.x2 + 2 < b.x1 ||
            a.x1 - 2 > b.x2 ||
            a.y2 + 1 < b.y1 ||
            a.y1 - 1 > b.y2
          );
          expect(overlaps).toBe(false);
        }
      }
    }
  });

  it("tìm đường ngắn nhất Dijkstra liên lục địa và tính thước đo trắc địa thuần bách khoa", () => {
    const bundle = buildPlanetaryAtlasBundle();
    const path = findShortestNationPath(
      bundle.nations,
      "nation-1",
      "nation-8",
      bundle.circumferenceKm
    );
    expect(path).not.toBeNull();
    expect(path!.nationIds[0]).toBe("nation-1");
    expect(path!.nationIds[path!.nationIds.length - 1]).toBe("nation-8");
    expect(path!.totalKm).toBeGreaterThan(2000);

    const report = computeExpeditionTravel(
      [
        { x: 0.2, y: 0.3 },
        { x: 0.6, y: 0.3 }
      ],
      bundle.circumferenceKm
    );
    expect(report.totalKm).toBe(25600);
    expect(report.footDays).toBeGreaterThan(report.caravanDays);
    expect(report.caravanDays).toBeGreaterThan(report.sailingDays);
    expect(report.airshipHours).toBeGreaterThan(0);

    // Elevation cross-section profile along route
    const profile = sampleRouteElevationProfile(
      [
        { x: 0.2, y: 0.3 },
        { x: 0.6, y: 0.3 }
      ],
      24,
      bundle.circumferenceKm
    );
    expect(profile).toHaveLength(24);
    expect(profile[0].distKm).toBe(0);
    expect(profile[23].distKm).toBe(25600);
    expect(profile.every((p) => p.elevationM > 0)).toBe(true);

    // Đợt 1 Pro Cartography: Polygon Area (km2), 4-Season Climate, 2-Hop Rings, Density Heatmap
    const area = computePolygonAreaKm2(
      [
        { x: 0.1, y: 0.1 },
        { x: 0.2, y: 0.1 },
        { x: 0.2, y: 0.2 },
        { x: 0.1, y: 0.2 }
      ],
      64000
    );
    expect(area).toBe(20_480_000);

    const valoria = bundle.nations.find((n) => n.nationNum === 1)!;
    const summerT = computeSeasonalTempC(valoria, "SUMMER");
    const winterT = computeSeasonalTempC(valoria, "WINTER");
    expect(summerT).toBeGreaterThan(winterT);

    const rings = getTwoHopNeighbors(bundle.nations, "nation-1");
    expect(rings.hop1.size).toBeGreaterThan(0);
    expect(rings.hop2.size).toBeGreaterThan(0);
    expect(rings.hop2.has("nation-1")).toBe(false);

    expect(resolveDensityHeatColor({ population: 5_000_000, areaKm2: 20_000 })).toBe("#ef4444");
  });

  it("pre-compute svgPath/bbox cho 360 quốc gia và sinh pixel nền địa hình 3D khớp 8 lục địa", () => {
    const bundle = buildPlanetaryAtlasBundle();
    for (const n of bundle.nations) {
      expect(n.svgPath.startsWith("M")).toBe(true);
      expect(n.svgPath.endsWith("Z")).toBe(true);
      expect(n.bbox.maxX).toBeGreaterThanOrEqual(n.bbox.minX);
      expect(n.bbox.maxY).toBeGreaterThanOrEqual(n.bbox.minY);
    }

    // Center of Aurelia must be land; Central Ocean must be ocean; Arctic must be bright polar ice
    const aurelia = samplePlanetaryTerrainPixel(0.6, 0.35, "PHYSICAL_RELIEF");
    expect(aurelia.isLand).toBe(true);
    expect(aurelia.continent).toBe("AURELIA");
    expect(aurelia.elevation).toBeGreaterThan(0);

    const ocean = samplePlanetaryTerrainPixel(0.44, 0.72, "PHYSICAL_RELIEF");
    expect(ocean.isLand).toBe(false);
    expect(ocean.elevation).toBeLessThan(0);

    const arctic = samplePlanetaryTerrainPixel(0.5, 0.06, "PHYSICAL_RELIEF");
    expect(arctic.isLand).toBe(true);
    expect(arctic.continent).toBe("ARCTIC_ICE");
    expect(arctic.b).toBeGreaterThan(150);

    for (const style of ["PHYSICAL_RELIEF", "SATELLITE", "PARCHMENT"] as const) {
      const s = samplePlanetaryTerrainPixel(0.6, 0.35, style);
      expect(s.r).toBeGreaterThanOrEqual(0);
      expect(s.r).toBeLessThanOrEqual(255);
      expect(s.g).toBeGreaterThanOrEqual(0);
      expect(s.g).toBeLessThanOrEqual(255);
      expect(s.b).toBeGreaterThanOrEqual(0);
      expect(s.b).toBeLessThanOrEqual(255);
    }
  });
});

describe("15. Wiki Intelligence 2.0 (TOC, Footnotes, Completeness, Diff, Auto-Wikilink & Scaled Labels)", () => {
  it("trích xuất Mục lục TOC, Footnote [^1], Reading Stats và chấm điểm Hoàn thiện Hồ sơ chính xác", () => {
    const md = [
      "## Lịch sử Liên minh Tam Biên",
      "Liên bang Hoàng gia Valoria ký kết hiệp ước với Đế chế Hỏa Sơn Ignisia và Zog-Koth.",
      "### Hệ thống Lưu trữ",
      "Các học giả tại [[Học Viện Ngã Ba Tam Biên]] lưu giữ biên niên sử[^1] cùng [[Vùng Đệm Lưu Trữ Tam Biên]].",
      "[^1]: Biên niên sử Tam Biên, quyển IV, lưu trữ tại Concordia Spire."
    ].join("\n\n");

    const toc = extractMarkdownToc(md);
    expect(toc).toHaveLength(2);
    expect(toc[0].level).toBe(2);
    expect(toc[1].level).toBe(3);

    const footnotes = extractFootnotes(md);
    expect(footnotes).toHaveLength(1);
    expect(footnotes[0].id).toBe("1");

    const stats = estimateReadingStats(md);
    expect(stats.words).toBeGreaterThan(20);
    expect(stats.wikilinks).toBe(2);
    expect(stats.footnotes).toBe(1);

    const report = computeEntryCompleteness({
      summary: "Hồ sơ bách khoa đầy đủ về Liên minh Tam Biên Aurelia.",
      contentMarkdown: md + " " + "nội dung chi tiết ".repeat(45),
      customFields: { capital: "Aurelion Prime" },
      extraFields: [],
      sourcesMarkdown: "Biên niên sử Aurelia",
      categoryId: "cat-1",
      tags: ["tam-bien"],
      coverImage: ""
    });
    expect(report.score).toBe(100);
    expect(report.tierLabel).toBe("Chuẩn Bách Khoa");
  });

  it("tự động gắn 1-Click Auto-Wikilink, tính Diff dòng chính xác và đảm bảo nhãn lớn vẫn Zero-Overlap", () => {
    const { markdown, linkedTitles } = autoLinkAllUnlinkedMentions(
      "Chuyến khảo sát từ Valoria sang Ignisia đi qua hẻm núi Zog-Koth.",
      [
        { id: "e1", title: "Valoria" },
        { id: "e2", title: "Ignisia" },
        { id: "e3", title: "Zog-Koth" }
      ],
      "e-self"
    );
    expect(linkedTitles).toHaveLength(3);
    expect(markdown).toContain("[[Valoria]]");
    expect(markdown).toContain("[[Ignisia]]");
    expect(markdown).toContain("[[Zog-Koth]]");

    const diff = computeWikiLineDiff("Dòng 1\nDòng cũ\nDòng 3", "Dòng 1\nDòng mới\nDòng 3");
    expect(diff.some((d) => d.type === "remove" && d.line === "Dòng cũ")).toBe(true);
    expect(diff.some((d) => d.type === "add" && d.line === "Dòng mới")).toBe(true);

    // Larger labels (labelScale = 1.45) must still maintain strict zero-overlap
    const bundle = buildPlanetaryAtlasBundle();
    const placedLarge = selectZeroOverlapLabels(bundle.nations, {
      zoom: 2.4,
      panX: 0,
      panY: 0,
      canvasWidth: bundle.canvasWidth,
      canvasHeight: bundle.canvasHeight,
      labelScale: 1.45
    }).filter((m) => m.showLabel);
    expect(placedLarge.length).toBeGreaterThan(0);
    for (let i = 0; i < placedLarge.length; i++) {
      for (let j = i + 1; j < placedLarge.length; j++) {
        const a = placedLarge[i].box;
        const b = placedLarge[j].box;
        const overlaps = !(
          a.x2 + 2 < b.x1 ||
          a.x1 - 2 > b.x2 ||
          a.y2 + 1 < b.y1 ||
          a.y1 - 1 > b.y2
        );
        expect(overlaps).toBe(false);
      }
    }
  });

  it("khởi tạo đầy đủ 360 hồ sơ Wiki chi tiết (ent-nation-1..360), 9 danh mục lục địa và quan hệ Liên minh Tam Biên đúng logic", () => {
    const seed = createInitialSeedState();
    const nationEntries = seed.entries.filter((e) => e.id.startsWith("ent-nation-"));
    expect(nationEntries).toHaveLength(360);

    const contCats = seed.categories.filter((c) => c.id.startsWith("cat-cont-"));
    expect(contCats).toHaveLength(9);

    // Verify Tri-Border #1 Valoria, #2 Zog-Koth, #3 Ignisia + #201, #203, #360 dossiers have full rich Kingdom modules
    for (const num of [1, 2, 3, 201, 203, 360]) {
      const ent = nationEntries.find((e) => e.id === `ent-nation-${num}`);
      expect(ent).toBeDefined();
      expect(ent?.entryTypeId).toBe("type-kingdom");
      expect(ent?.tabOverrides?.disabled).toContain("power");
      expect(ent?.customFields.capital).toBeTruthy();
      expect(ent?.extraFields?.length).toBeGreaterThanOrEqual(6);
      expect(ent?.epigraph?.quote.length).toBeGreaterThan(20);
      expect(ent?.roster).toHaveLength(3);
      expect(ent?.lawsAndCustoms).toHaveLength(3);
      expect(ent?.lawsAndCustoms?.map((l) => l.category)).toEqual(["law", "custom", "taboo"]);
      expect(ent?.resourceItems).toHaveLength(3);
      expect(ent?.rumorsAndSecrets).toHaveLength(2);
      expect(ent?.customSections).toHaveLength(2);
      expect(ent?.eraSnapshots).toHaveLength(3);
      const barTotal = (ent?.breakdownBars ?? []).reduce((s, b) => s + b.percentage, 0);
      expect(barTotal).toBe(100);
      const comp = computeEntryCompleteness(ent!);
      expect(comp.score).toBe(100);
    }

    // Verify gmOnly secret on nation dossier is stripped for Guest role
    const valoria = nationEntries.find((e) => e.id === "ent-nation-1")!;
    const guestValoria = sanitizeEntryForRole(valoria, "guest");
    expect(guestValoria?.rumorsAndSecrets?.some((r) => r.gmOnly)).toBe(false);
    expect(valoria.contentMarkdown).toContain("[[Liên minh Hẻm núi Zog-Koth]]");
    expect(valoria.contentMarkdown).toContain("[[Đế chế Hỏa Sơn Ignisia]]");
    expect(seed.relations.some((r) => r.sourceEntryId === "ent-nation-1" && r.targetEntryId === "ent-nation-2")).toBe(true);
    expect(seed.relations.some((r) => r.sourceEntryId === "ent-nation-1" && r.targetEntryId === "ent-nation-3")).toBe(true);
    expect(seed.relations.some((r) => r.sourceEntryId === "ent-nation-2" && r.targetEntryId === "ent-nation-3")).toBe(true);
  });
});

