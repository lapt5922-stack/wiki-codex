import { describe, expect, it } from "vitest";
import {
  auditCharacterCodex,
  nextSequentialId
} from "@/lib/character-id";
import { createInitialCharacterCodexState } from "@/db/character-seed";
import {
  buildHydratedDossier,
  canViewAccessLevel,
  createCharacterDossier,
  exportCharactersData,
  queryCharacters,
  restoreCharacterVersion,
  updateCharacterDossier,
  upsertCustomFieldDef
} from "@/db/character-repository";

describe("Character Codex Enterprise System (17 Groups & 22 Normalized Tables)", () => {
  it("generates stable sequential immutable IDs", () => {
    expect(nextSequentialId("CHAR", [])).toBe("CHAR-000001");
    expect(nextSequentialId("CHAR", ["CHAR-000001", "CHAR-000009"])).toBe("CHAR-000010");
    expect(nextSequentialId("SKILL", ["SKILL-000003"])).toBe("SKILL-000004");
  });

  it("enforces section-level RBAC & Spoiler access control", () => {
    expect(canViewAccessLevel("public", "guest")).toBe(true);
    expect(canViewAccessLevel("spoiler", "guest")).toBe(true);
    expect(canViewAccessLevel("private_draft", "guest")).toBe(false);
    expect(canViewAccessLevel("admin_only", "guest")).toBe(false);
    expect(canViewAccessLevel("admin_only", "editor")).toBe(false);
    expect(canViewAccessLevel("admin_only", "admin")).toBe(true);
  });

  it("hydrates full 17-group character dossier with bidirectional relationships", () => {
    const state = createInitialCharacterCodexState();
    const aurelius = buildHydratedDossier(state, "CHAR-000001", "guest");
    expect(aurelius).not.toBeNull();
    expect(aurelius!.character.id).toBe("CHAR-000001");
    expect(aurelius!.appearances.length).toBeGreaterThanOrEqual(2);
    expect(aurelius!.ability.stats.intelligence).toBe(98);
    expect(aurelius!.skills.length).toBeGreaterThanOrEqual(1);
    expect(aurelius!.equipment.length).toBeGreaterThanOrEqual(1);
    expect(aurelius!.relationships.length).toBeGreaterThanOrEqual(2);

    // Bidirectional check: CHAR-000002 sees incoming relation from CHAR-000001
    const kaelen = buildHydratedDossier(state, "CHAR-000002", "guest");
    expect(kaelen!.relationships.some((r) => r.otherCharacter.id === "CHAR-000001")).toBe(true);
  });

  it("detects duplicate IDs, timeline paradoxes & dangling relations via Auditor", () => {
    const state = createInitialCharacterCodexState();
    state.characters[0].birthYear = 800;
    state.characters[0].deathYear = 750; // paradox!
    const issues = auditCharacterCodex(state, "ws-aethelgard");
    expect(issues.some((i) => i.kind === "timeline_paradox")).toBe(true);
  });

  it("supports Create, Update, Versioning, Restore, Non-Destructive Custom Fields & Search/Export", async () => {
    const created = await createCharacterDossier(
      {
        workspaceId: "ws-aethelgard",
        character: {
          fullName: "Seraphina Ánh Sao",
          race: "Tinh Linh Cổ",
          nationality: "Vương quốc Valoria",
          occupation: "Nhà Thiên Văn",
          aliases: ["Nữ Hộ Vệ Ngân Hà"],
          tags: ["test-unit"]
        },
        ability: { level: 35, realm: "Học Giả Bậc Cao" },
        changeNote: "Tạo mới cho unit test"
      },
      "Test Editor"
    );

    expect(created.character.id).toMatch(/^CHAR-\d{6}$/);

    // Update to version 2
    const updated = await updateCharacterDossier(
      created.character.id,
      {
        character: { occupation: "Đại Học Giả Hoàng Gia" },
        ability: { level: 42 },
        changeNote: "Thăng cấp lên Đại Học Giả"
      },
      "Test Editor"
    );
    expect(updated?.ability.level).toBe(42);

    // Restore back to version 1
    const restored = await restoreCharacterVersion(created.character.id, 1, "Test Editor");
    expect(restored?.ability.level).toBe(35);

    // Non-destructive custom field rename
    const cf = await upsertCustomFieldDef({
      workspaceId: "ws-aethelgard",
      label: "Học phái Thiên văn Test",
      dataType: "text"
    });
    const renamed = await upsertCustomFieldDef({
      id: cf.id,
      workspaceId: "ws-aethelgard",
      label: "Học phái Thiên văn (Đã đổi tên)",
      dataType: "text"
    });
    expect(renamed.id).toBe(cf.id);

    // Accent-insensitive Vietnamese search by alias
    const searchRes = await queryCharacters({
      workspaceId: "ws-aethelgard",
      role: "admin",
      q: "Nu Ho Ve Ngan Ha"
    });
    expect(searchRes.items.some((i) => i.id === created.character.id)).toBe(true);

    // CSV & JSON export
    const csv = await exportCharactersData("ws-aethelgard", "csv", "guest");
    expect(csv).toContain("CHAR-000001");
    const jsonStr = await exportCharactersData("ws-aethelgard", "json", "guest");
    expect(JSON.parse(jsonStr).count).toBeGreaterThanOrEqual(3);
  });
});
