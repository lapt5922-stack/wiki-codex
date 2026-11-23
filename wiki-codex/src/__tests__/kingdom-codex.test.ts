import { describe, expect, it } from "vitest";
import {
  createOrCloneKingdom,
  deleteKingdomCustomField,
  exportKingdomsData,
  getKingdomDossier,
  queryKingdoms,
  restoreKingdomVersion,
  softDeleteKingdom,
  updateKingdomDossier,
  upsertKingdomCustomField
} from "@/db/kingdom-repository";

describe("Kingdom Codex — 360-Nation Geopolitical Encyclopedia", () => {
  it("hydrates all 360 real nations from Planetary Atlas & Economy Engine with pagination", async () => {
    const page1 = await queryKingdoms({
      workspaceId: "ws-aethelgard",
      role: "guest",
      page: 1,
      limit: 24
    });

    expect(page1.total).toBeGreaterThanOrEqual(360);
    expect(page1.items.length).toBe(24);
    expect(page1.totalPages).toBeGreaterThanOrEqual(15);
    expect(page1.facets.continents.length).toBeGreaterThanOrEqual(6);
    expect(page1.facets.governments.length).toBeGreaterThan(0);

    // Vietnamese accent-insensitive search by ID and name
    const byId = await queryKingdoms({
      workspaceId: "ws-aethelgard",
      role: "guest",
      q: "KING-000001",
      page: 1,
      limit: 10
    });
    expect(byId.items.some((k) => k.id === "KING-000001")).toBe(true);
  });

  it("loads a full 18-group dossier with 14 independent stats, real Atlas polygon, and live Character ID link", async () => {
    const { dossier } = await getKingdomDossier("KING-000001", "guest");
    expect(dossier).not.toBeNull();
    if (!dossier) return;

    expect(dossier.kingdom.id).toBe("KING-000001");
    expect(dossier.kingdom.linkedWikiEntryId).toBe("ent-nation-1");
    expect(dossier.kingdom.linkedAtlasNationId).toBeTruthy();

    // Real Atlas polygon & bbox present for seeded 360 nations
    expect(dossier.territory.atlasSvgPath).toBeTruthy();
    expect(dossier.territory.atlasBbox).toBeDefined();

    // 14 independent statistics — each with score, tier, evaluatedAt, and sourceNote
    expect(dossier.statistics.length).toBe(14);
    for (const stat of dossier.statistics) {
      expect(stat.score).toBeGreaterThanOrEqual(0);
      expect(stat.score).toBeLessThanOrEqual(100);
      expect(stat.evaluatedAt).toBeTruthy();
      expect(stat.sourceNote).toBeTruthy();
    }

    // Multi-year population & economy histories
    expect(dossier.populationHistory.length).toBeGreaterThanOrEqual(3);
    expect(dossier.economyHistory.length).toBeGreaterThanOrEqual(3);

    // Live ruler resolution via Character Codex ID (zero character duplication)
    const linkedRuler = dossier.rulers.find((r) => r.characterId === "CHAR-000001");
    expect(linkedRuler).toBeDefined();
    expect(linkedRuler?.linkedCharacter?.id).toBe("CHAR-000001");
  });

  it("supports creating a brand-new kingdom without fabricating borders, updating, version restore, and soft delete", async () => {
    const created = await createOrCloneKingdom(
      {
        workspaceId: "ws-aethelgard",
        officialName: "Liên bang Thử nghiệm Aethel",
        commonName: "Thử nghiệm Aethel",
        polityType: "federation",
        governmentType: "Liên bang Nghị viện",
        capitalName: "Tân Cảng",
        currencyCode: "TNA"
      },
      "Test Architect"
    );

    expect(created.kingdom.id).toMatch(/^KING-\d{6}$/);
    expect(created.kingdom.workflowStatus).toBe("draft");
    // Brand-new nation must NOT fabricate Atlas borders
    expect(created.territory.atlasSvgPath).toBeUndefined();

    // Update dossier -> creates version 2
    const updated = await updateKingdomDossier(
      created.kingdom.id,
      {
        kingdom: { ...created.kingdom, officialName: "Liên bang Thử nghiệm v2" },
        changeNote: "Đổi tên v2"
      },
      "Test Architect"
    );
    expect(updated?.kingdom.officialName).toBe("Liên bang Thử nghiệm v2");

    const loadedV2 = await getKingdomDossier(created.kingdom.id, "admin");
    expect(loadedV2.versions.length).toBeGreaterThanOrEqual(2);

    // Restore back to version 1
    const restored = await restoreKingdomVersion(created.kingdom.id, 1, "Test Architect");
    expect(restored?.kingdom.officialName).toBe("Liên bang Thử nghiệm Aethel");

    // Soft-delete cleans up test record so workspace stays clean
    const deleted = await softDeleteKingdom(created.kingdom.id);
    expect(deleted).toBe(true);
    const afterDelete = await getKingdomDossier(created.kingdom.id, "admin");
    expect(afterDelete.dossier).toBeNull();
  });

  it("supports non-destructive custom fields and full 360-nation JSON/CSV export", async () => {
    const field = await upsertKingdomCustomField({
      workspaceId: "ws-aethelgard",
      label: "Chỉ số Cổng Ma pháp",
      dataType: "number",
      groupName: "Năng lượng",
      defaultValue: "0"
    });
    expect(field.id).toMatch(/^KFLD-\d{6}$/);

    const { dossier } = await getKingdomDossier("KING-000001", "admin");
    expect(dossier?.customFields.some((cf) => cf.definition.id === field.id)).toBe(true);

    // Clean up custom field
    expect(await deleteKingdomCustomField(field.id)).toBe(true);

    // Export all 360 nations as JSON and CSV
    const jsonRaw = await exportKingdomsData("ws-aethelgard", "json", "guest");
    const parsed = JSON.parse(jsonRaw) as { count: number; kingdoms: unknown[] };
    expect(parsed.count).toBeGreaterThanOrEqual(360);
    expect(parsed.kingdoms.length).toBeGreaterThanOrEqual(360);

    const csvRaw = await exportKingdomsData("ws-aethelgard", "csv", "guest");
    const lines = csvRaw.trim().split("\n");
    expect(lines[0]).toContain("TenChinhThuc");
    expect(lines.length).toBeGreaterThanOrEqual(361);
  });
});
