import { describe, expect, it } from "vitest";
import { queryHeraldryTemplates } from "@/lib/heraldry/template-catalog";
import {
  computeContrastRatio,
  sanitizeSvgContent
} from "@/lib/heraldry/shapes-and-palettes";
import {
  generateHeraldryAiConcept,
  renderHeraldryToSvgString
} from "@/lib/heraldry/renderer-and-export";
import {
  applyOfficialEmblemToKingdom,
  deleteHeraldryDesign,
  restoreHeraldryVersion,
  saveHeraldryDesign
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
});
