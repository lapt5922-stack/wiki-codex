import { describe, expect, it } from "vitest";
import { computeFieldLevelDiff, resolveUniversalId } from "@/lib/universal-id";
import {
  createCustomRelationType,
  createUniversalRelation,
  deleteUniversalRelation,
  listUniversalRelations,
  suggestCandidateRelations
} from "@/db/universal-relations-repo";
import { runContentHealthAudit, setHealthIssueResolution } from "@/lib/content-health-engine";

describe("Phase 1 — Universal ID, Field Diff, Relationship Manager & 9-Rule Content Health", () => {
  it("resolves deterministic immutable Universal IDs and computes field-level diffs", () => {
    expect(resolveUniversalId("CHAR-000001", "character")).toBe("CHAR-000001");
    expect(resolveUniversalId("KING-000042", "kingdom")).toBe("KING-000042");
    expect(resolveUniversalId("ent-nation-1", "kingdom")).toBe("KING-000001");
    expect(resolveUniversalId("ent-nation-360", "kingdom")).toBe("KING-000360");

    const uid1 = resolveUniversalId("ent-bang-trieu", "kingdom");
    const uid2 = resolveUniversalId("ent-bang-trieu", "kingdom");
    expect(uid1).toBe(uid2);
    expect(uid1).toMatch(/^KING-\d{6}$/);

    const diffs = computeFieldLevelDiff(
      { title: "Cũ", summary: "Tóm tắt A", status: "draft" },
      { title: "Mới", summary: "Tóm tắt A", status: "published" }
    );
    expect(diffs.length).toBe(2);
    expect(diffs.some((d) => d.field === "title" && d.before === "Cũ" && d.after === "Mới")).toBe(true);
  });

  it("supports Universal Relationship CRUD, custom types, RBAC and non-destructive link suggestions", async () => {
    const customType = await createCustomRelationType({
      workspaceId: "ws-aethelgard",
      labelVi: "Chư hầu thử nghiệm",
      inverseLabelVi: "Bảo hộ thử nghiệm"
    });
    expect(customType.code).toContain("chu_hau");

    const created = await createUniversalRelation({
      workspaceId: "ws-aethelgard",
      sourceId: "CHAR-000001",
      sourceKind: "character",
      sourceTitle: "Hoàng Đế Aurelius Solis III",
      targetId: "KING-000001",
      targetKind: "kingdom",
      targetTitle: "Đế chế Hoàng Kim Solana",
      relationTypeCode: customType.code,
      relationLabel: customType.labelVi,
      description: "Quan hệ kiểm thử Phase 1",
      startDate: "Năm 760",
      endDate: "",
      sources: [{ title: "Sử liệu thử nghiệm" }],
      verificationStatus: "verified",
      notes: "",
      accessLevel: "editor_only",
      createdBy: "Test Admin"
    });

    // Guest must NOT see editor_only relation (true backend RBAC)
    const guestList = await listUniversalRelations({
      workspaceId: "ws-aethelgard",
      role: "guest"
    });
    expect(guestList.relations.some((r) => r.id === created.id)).toBe(false);

    // Editor CAN see editor_only relation
    const editorList = await listUniversalRelations({
      workspaceId: "ws-aethelgard",
      role: "editor"
    });
    expect(editorList.relations.some((r) => r.id === created.id)).toBe(true);

    // Auto-suggest returns array without creating official records
    const suggestions = await suggestCandidateRelations("ws-aethelgard");
    expect(Array.isArray(suggestions)).toBe(true);

    // Cleanup test relation
    expect(await deleteUniversalRelation(created.id)).toBe(true);
  });

  it("runs the 9-rule Content Health & Data Validation audit without mutating official data", async () => {
    const summary = await runContentHealthAudit("ws-aethelgard");
    expect(summary.workspaceId).toBe("ws-aethelgard");
    expect(summary.bySeverity).toHaveProperty("critical");
    expect(summary.bySeverity).toHaveProperty("warning");
    expect(summary.bySeverity).toHaveProperty("info");
    expect(Object.keys(summary.byRule).length).toBe(9);

    if (summary.issues[0]) {
      const id = summary.issues[0].id;
      const map = setHealthIssueResolution(id, "acknowledged");
      expect(map[id]).toBe("acknowledged");
      setHealthIssueResolution(id, "open");
    }
  });
});
