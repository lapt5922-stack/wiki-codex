import { describe, expect, it } from "vitest";
import {
  filterMeaningfulRows,
  isCustomFieldMeaningful,
  isMeaningfulValue,
  joinMeaningfulParts,
  type EntityProfileLayoutConfig
} from "@/lib/empty-field-engine";
import { getPinnedInfoboxRows } from "@/components/CustomProfileLayoutBuilder";
import {
  createCharacterDossier,
  getCharacterDossier,
  softDeleteCharacter
} from "@/db/character-repository";
import {
  getKingdomDossier,
  updateKingdomDossier
} from "@/db/kingdom-repository";

describe("Universal Entity Detail System & 3-Level Freeform CRUD", () => {
  it("correctly distinguishes empty/placeholder values from valid 0 and false", () => {
    expect(isMeaningfulValue(null)).toBe(false);
    expect(isMeaningfulValue(undefined)).toBe(false);
    expect(isMeaningfulValue("")).toBe(false);
    expect(isMeaningfulValue("   ")).toBe(false);
    expect(isMeaningfulValue("—")).toBe(false);
    expect(isMeaningfulValue("-")).toBe(false);
    expect(isMeaningfulValue("N/A")).toBe(false);
    expect(isMeaningfulValue([])).toBe(false);
    expect(isMeaningfulValue(["", "  ", "—"])).toBe(false);
    expect(isMeaningfulValue({})).toBe(false);

    // Valid falsy primitives that MUST be preserved
    expect(isMeaningfulValue(0)).toBe(true);
    expect(isMeaningfulValue(false)).toBe(true);
    expect(isMeaningfulValue("Nhân tộc")).toBe(true);
    expect(isMeaningfulValue([0])).toBe(true);
  });

  it("filters empty rows and extracts pinned Infobox rows from 3-level freeform layout", () => {
    const rows = filterMeaningfulRows([
      ["Tên", "Lý Thiên Hành"],
      ["Ngày sinh", ""],
      ["Ngày mất", "—"],
      ["Tuổi", "24"],
      ["Số lần thất bại", 0]
    ]);
    expect(rows).toEqual([
      ["Tên", "Lý Thiên Hành"],
      ["Tuổi", "24"],
      ["Số lần thất bại", "0"]
    ]);

    expect(joinMeaningfulParts(["Bắc Lục Địa", "", "—", "Khối Liên Minh"])).toBe(
      "Bắc Lục Địa · Khối Liên Minh"
    );

    const layout: EntityProfileLayoutConfig = {
      hiddenBuiltInTabs: ["combat"],
      renamedBuiltInTabs: { appearance: "Hình thái & Y phục" },
      customTabs: [{ id: "ctab-1", label: "Huyết mạch Cổ đại", sigil: "🜂", order: 1 }],
      blocks: [
        {
          id: "blk-1",
          tabId: "ctab-1",
          title: "Ấn ký Huyết thống",
          order: 1,
          fields: [
            {
              id: "fld-1",
              label: "Cấp độ Huyết mạch",
              kind: "text",
              value: "Thượng Cổ Thần Long",
              pinToInfobox: true
            },
            {
              id: "fld-empty",
              label: "Trường bỏ trống",
              kind: "text",
              value: "   ",
              pinToInfobox: true
            },
            {
              id: "fld-bar",
              label: "Độ tinh khiết",
              kind: "progress_bar",
              value: "",
              numberValue: 92,
              maxValue: 100,
              unit: "%",
              pinToInfobox: true
            }
          ]
        }
      ]
    };

    expect(isCustomFieldMeaningful(layout.blocks![0].fields[0])).toBe(true);
    expect(isCustomFieldMeaningful(layout.blocks![0].fields[1])).toBe(false);

    const pinned = getPinnedInfoboxRows(layout);
    expect(pinned).toEqual([
      ["Cấp độ Huyết mạch", "Thượng Cổ Thần Long"],
      ["Độ tinh khiết", "92/100%"]
    ]);
  });

  it("creates a character with only 4 fields + freeform profileLayout without fabricating unentered data", async () => {
    const customLayout: EntityProfileLayoutConfig = {
      enableRpgStats: false,
      hiddenBuiltInTabs: ["combat", "skills"],
      renamedBuiltInTabs: { personality: "Tâm tính & Đạo tâm" },
      customTabs: [{ id: "ctab-secret", label: "Hồ sơ Mật Viện", sigil: "🗝", order: 1 }],
      blocks: [
        {
          id: "blk-mind",
          tabId: "personality",
          title: "Đạo tâm sơ khởi",
          order: 1,
          fields: [
            {
              id: "f-1",
              label: "Châm ngôn",
              kind: "text",
              value: "Thuận theo tự nhiên",
              pinToInfobox: true
            }
          ]
        }
      ]
    };

    const created = await createCharacterDossier(
      {
        workspaceId: "ws-aethelgard",
        character: {
          workspaceId: "ws-aethelgard",
          fullName: "Tô Mặc Hàn",
          age: "19",
          race: "Nhân tộc",
          birthPlace: "Vân Lam Thành",
          profileLayout: customLayout
        }
      },
      "Tester"
    );

    try {
      expect(created.character.fullName).toBe("Tô Mặc Hàn");
      expect(created.character.age).toBe("19");
      expect(created.character.race).toBe("Nhân tộc");
      expect(created.character.birthPlace).toBe("Vân Lam Thành");
      expect(created.character.profileLayout?.enableRpgStats).toBe(false);

      // Unentered fields must be null or empty string (never meaningful / never "—" or fake values)
      expect(isMeaningfulValue(created.character.birthDay)).toBe(false);
      expect(isMeaningfulValue(created.character.deathDate)).toBe(false);
      expect(isMeaningfulValue(created.character.gender)).toBe(false);
      expect(isMeaningfulValue(created.character.nationality)).toBe(false);

      const fetched = await getCharacterDossier(created.character.id, "admin");
      expect(fetched.dossier?.character.profileLayout?.customTabs).toHaveLength(1);
      expect(fetched.dossier?.character.profileLayout?.customTabs?.[0].label).toBe("Hồ sơ Mật Viện");
      expect(fetched.dossier?.character.profileLayout?.renamedBuiltInTabs?.personality).toBe(
        "Tâm tính & Đạo tâm"
      );
      expect(fetched.dossier?.character.profileLayout?.blocks?.[0].fields[0].value).toBe(
        "Thuận theo tự nhiên"
      );
    } finally {
      await softDeleteCharacter(created.character.id, "Tester");
    }
  });

  it("persists 3-level freeform profileLayout on Kingdom dossiers", async () => {
    const layout: EntityProfileLayoutConfig = {
      hiddenBuiltInTabs: [],
      renamedBuiltInTabs: { politics: "Thể chế & Triều chính" },
      customTabs: [{ id: "ctab-wonder", label: "Kỳ quan Quốc gia", sigil: "🏛", order: 1 }],
      blocks: [
        {
          id: "kblk-1",
          tabId: "ctab-wonder",
          title: "Tháp Tinh Cầu Vaelor",
          order: 1,
          fields: [
            {
              id: "kf-1",
              label: "Năm hoàn thành",
              kind: "text",
              value: "Năm 412 Kỷ Nguyên Hiệp Ước",
              pinToInfobox: true
            }
          ]
        }
      ]
    };

    await updateKingdomDossier(
      "KING-000001",
      {
        kingdom: {
          profileLayout: layout
        } as never,
        changeNote: "Kiểm thử lưu cấu trúc tab tùy biến quốc gia"
      },
      "Tester"
    );

    const res = await getKingdomDossier("KING-000001", "admin");
    expect(res.dossier?.kingdom.profileLayout?.customTabs?.[0].label).toBe("Kỳ quan Quốc gia");
    expect(res.dossier?.kingdom.profileLayout?.blocks?.[0].fields[0].value).toBe(
      "Năm 412 Kỷ Nguyên Hiệp Ước"
    );
  });
});
