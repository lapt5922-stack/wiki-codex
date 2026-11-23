import { describe, expect, it } from "vitest";
import { CATEGORY_LABELS, queryHeraldryTemplates } from "@/lib/heraldry/template-catalog";
import {
  FIELD_DIVISIONS,
  SHIELD_SHAPES,
  computeContrastRatio,
  sanitizeSvgContent
} from "@/lib/heraldry/shapes-and-palettes";
import {
  EXTERNAL_ORNAMENTS,
  HERALDIC_SYMBOLS
} from "@/lib/heraldry/symbols-and-ornaments";
import {
  analyzeHeraldryComposition,
  computeHeraldrySimilarity,
  generateHeraldryAiConcept,
  renderHeraldryToSvgString
} from "@/lib/heraldry/renderer-and-export";
import {
  queryFlagTemplates,
  renderFlagToSvgString
} from "@/lib/heraldry/flag-engine";
import {
  applyOfficialEmblemToKingdom,
  deleteCustomTemplate,
  deleteFlagDesign,
  deleteHeraldicMeaning,
  deleteHeraldryDesign,
  deleteRegaliaItem,
  restoreHeraldryVersion,
  saveCustomTemplate,
  saveFlagDesign,
  saveHeraldicMeaning,
  saveHeraldryDesign,
  saveRegaliaItem
} from "@/db/heraldry-repository";

describe("Royal Heraldry Studio — Templates, Security, Vector Export, Official Protection & AI", () => {
  it("provides 1,200+ parametric curated templates with fast pagination and filtering", () => {
    const page1 = queryHeraldryTemplates({ page: 1, limit: 24 });
    expect(page1.total).toBeGreaterThanOrEqual(1200);
    expect(page1.items.length).toBe(24);
    expect(page1.totalPages).toBeGreaterThanOrEqual(50);

    const imperial = queryHeraldryTemplates({ style: "imperial", page: 1, limit: 24 });
    expect(imperial.total).toBeGreaterThan(50);
    expect(imperial.items.every((t) => t.style === "imperial")).toBe(true);
  });

  it("sanitizes dangerous SVG payloads and computes contrast ratios accurately", () => {
    const dirty = `<svg onload="alert(1)"><script>evil()</script><a href="javascript:steal()"><rect/></a></svg>`;
    const clean = sanitizeSvgContent(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("onload=");
    expect(clean).not.toContain("javascript:");

    expect(computeContrastRatio("#101522", "#E9DFC9")).toBeGreaterThan(10);
  });

  it("renders valid standalone SVG with Vietnamese Unicode motto and generates 6 AI variations", () => {
    const concept = generateHeraldryAiConcept(
      "Thiết kế quốc huy vương quốc cổ đại, sư tử bạc, nền đỏ thẫm, vương miện vàng"
    );
    expect(concept.variations.length).toBe(6);
    const svg = renderHeraldryToSvgString(concept.variations[0].designData, { uid: "test" });
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("VINH QUANG");
  });

  it("enforces Official Emblem Protection, versioning, and safe restore", async () => {
    const tpl = queryHeraldryTemplates({ page: 1, limit: 1 }).items[0];
    const saved = await saveHeraldryDesign({
      workspaceId: "ws-aethelgard",
      name: "Quốc huy Thử nghiệm v1",
      designData: tpl.designData,
      linkedKingdomId: "KING-000001",
      editorName: "Test Herald"
    });
    expect(saved.id).toMatch(/^HRLD-/);
    expect(saved.version).toBe(1);

    // Must reject applying official without explicit confirmation
    const denied = await applyOfficialEmblemToKingdom({
      designId: saved.id,
      kingdomId: "KING-000001",
      confirmReplaceOfficial: false,
      changeReason: "Should fail",
      editorName: "Test Herald"
    });
    expect("error" in denied).toBe(true);

    // Update to v2 and restore back to v1
    const v2 = await saveHeraldryDesign({
      id: saved.id,
      workspaceId: "ws-aethelgard",
      name: "Quốc huy Thử nghiệm v2",
      designData: tpl.designData,
      changeReason: "Cải tiến v2",
      editorName: "Test Herald"
    });
    expect(v2.version).toBe(2);

    const restored = await restoreHeraldryVersion(saved.id, 1, "Test Herald");
    expect(restored?.version).toBe(3);

    // Clean up non-official draft
    expect(await deleteHeraldryDesign(saved.id)).toBe(true);
  });

  it("provides 2,400+ category-tailored heraldry templates, 18 shapes, 18 divisions, 65+ symbols, and 14 ornaments", () => {
    expect(SHIELD_SHAPES.length).toBeGreaterThanOrEqual(18);
    expect(FIELD_DIVISIONS.length).toBeGreaterThanOrEqual(18);
    expect(HERALDIC_SYMBOLS.length).toBeGreaterThanOrEqual(65);
    expect(EXTERNAL_ORNAMENTS.length).toBeGreaterThanOrEqual(14);

    const all = queryHeraldryTemplates({ page: 1, limit: 24 });
    expect(all.total).toBeGreaterThanOrEqual(2400);

    for (const cat of Object.keys(CATEGORY_LABELS)) {
      const res = queryHeraldryTemplates({ category: cat, page: 1, limit: 12 });
      expect(res.total).toBeGreaterThanOrEqual(240);
    }
  });

  it("provides 450+ Flag & Banner templates and renders valid SVG for all 4 geometries", () => {
    const flags = queryFlagTemplates({ page: 1, limit: 18 });
    expect(flags.total).toBeGreaterThanOrEqual(450);

    const geometries = ["rect_3_2", "rect_2_1", "swallowtail", "gonfalon_1_2"] as const;
    for (const geo of geometries) {
      const svg = renderFlagToSvgString({ ...flags.items[0].config, geometry: geo }, `t-${geo}`);
      expect(svg).toContain("<svg");
      expect(svg).toContain("</svg>");
    }
  });

  it("analyzes heraldry composition and computes emblem similarity accurately", () => {
    const tpl1 = queryHeraldryTemplates({ page: 1, limit: 2 }).items[0];
    const analysis = analyzeHeraldryComposition(tpl1.designData);
    expect(analysis.overallScore).toBeGreaterThanOrEqual(70);

    const selfSim = computeHeraldrySimilarity(tpl1.designData, tpl1.designData);
    expect(selfSim.score).toBe(100);
  });

  it("persists V2 Flags, Royal Regalia, Provenance-Enforced Meanings, and Custom Templates cleanly", async () => {
    const flag = await saveFlagDesign({
      workspaceId: "ws-aethelgard",
      name: "Quốc kỳ Thử nghiệm",
      category: "national_flag",
      geometry: "rect_3_2",
      layout: "nordic_cross",
      primaryColor: "#101522",
      secondaryColor: "#6D3D49",
      tertiaryColor: "#C6A568",
      symbolId: "sym-lion",
      symbolColor: "#E9DFC9",
      symbolScale: 1.5,
      borderTrim: true,
      borderColor: "#C6A568",
      mottoText: "TEST",
      linkedKingdomId: "KING-000001",
      linkedEntityId: null,
      eraLabel: "Test Era",
      description: "",
      createdBy: "Test Herald"
    });
    expect(flag.id).toMatch(/^FLAG-/);
    expect(await deleteFlagDesign(flag.id)).toBe(true);

    const reg = await saveRegaliaItem({
      workspaceId: "ws-aethelgard",
      name: "Vương miện Thử nghiệm",
      category: "crown",
      imageUrl: "",
      origin: "Kỷ nguyên Cổ",
      history: "Lưu trữ kiểm thử",
      materials: "Vàng Cổ",
      currentStatus: "active",
      linkedKingdomId: "KING-000001",
      linkedKingdomName: "Aethel",
      linkedCharacterId: null,
      linkedCharacterName: "",
      dynastyName: "Vương triều Aethel",
      eraLabel: "Cổ đại",
      sourceCitation: "Biên niên sử",
      createdBy: "Test Herald"
    });
    expect(reg.id).toMatch(/^REGA-/);
    expect(await deleteRegaliaItem(reg.id)).toBe(true);

    // Must downgrade verified_source -> unverified_draft if sourceCitation is empty
    const meaning = await saveHeraldicMeaning({
      workspaceId: "ws-aethelgard",
      entryType: "symbol",
      refId: "sym-bear",
      title: "Gấu Bắc Địa",
      civilization: "Phương Bắc",
      iconographicMeaning: "Sức mạnh",
      colorMeaning: "",
      culturalContext: "",
      politicalMeaning: "",
      religiousMeaning: "",
      legendAndLore: "",
      origin: "",
      sourceCitation: "",
      verificationStatus: "verified_source",
      createdBy: "Test Herald"
    });
    expect(meaning.verificationStatus).toBe("unverified_draft");
    expect(await deleteHeraldicMeaning(meaning.id)).toBe(true);

    const tpl = queryHeraldryTemplates({ page: 1, limit: 1 }).items[0];
    const ctpl = await saveCustomTemplate({
      workspaceId: "ws-aethelgard",
      name: "Mẫu Tùy chỉnh Test",
      collectionName: "Test Collection",
      category: "kingdom_emblem",
      style: "imperial",
      license: "Internal",
      description: "",
      designData: tpl.designData,
      createdBy: "Test Herald"
    });
    expect(ctpl.id).toMatch(/^CTPL-/);
    expect(await deleteCustomTemplate(ctpl.id)).toBe(true);
  });
});
