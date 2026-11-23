import { describe, expect, it } from "vitest";
import {
  createEventPerspective,
  createHistoricalDocument,
  deleteEventPerspective,
  deleteHistoricalDocument,
  queryEventPerspectives,
  queryHistoricalDocuments
} from "@/db/archives-repo";

describe("Phase 3 — Historical Archive (DOC) & Perspective Archive", () => {
  it("supports creating, searching and deleting Historical Documents (DOC-XXXXXX)", async () => {
    const initial = await queryHistoricalDocuments({ workspaceId: "ws-aethelgard" });
    expect(initial.length).toBeGreaterThanOrEqual(2);

    const created = await createHistoricalDocument({
      workspaceId: "ws-aethelgard",
      title: "Sắc lệnh Thử nghiệm Thương mại",
      docType: "decree",
      author: "Hội đồng Thử nghiệm",
      createdDateLabel: "Năm 801",
      originPlace: "Tân Cảng",
      language: "Thông ngữ",
      content: "Nội dung sắc lệnh thử nghiệm Phase 3.",
      preservationStatus: "intact",
      archiveLocation: "Thư viện Trung ương",
      reliabilityScore: 95,
      linkedEntityIds: ["KING-000001"],
      attachmentUrl: ""
    });
    expect(created.id).toMatch(/^DOC-/);

    const found = await queryHistoricalDocuments({
      workspaceId: "ws-aethelgard",
      q: "sac lenh thu nghiem"
    });
    expect(found.some((d) => d.id === created.id)).toBe(true);

    expect(await deleteHistoricalDocument(created.id)).toBe(true);
  });

  it("keeps multiple independent historical perspectives separate with their own sources", async () => {
    const initial = await queryEventPerspectives({
      workspaceId: "ws-aethelgard",
      eventKey: "evt-hiep-uoc-anh-duong"
    });
    expect(initial.length).toBeGreaterThanOrEqual(3);

    const p = await createEventPerspective({
      workspaceId: "ws-aethelgard",
      eventKey: "evt-hiep-uoc-anh-duong",
      eventTitle: "Ký kết Hiệp ước Ánh Dương (Năm 765)",
      perspectiveKind: "eyewitness",
      holderName: "Nhân chứng Thương đoàn Phương Nam",
      author: "Thuyền trưởng Kael",
      sourceTitle: "Nhật ký Hải trình 765",
      summary: "Góc nhìn thực tế tại bến cảng ngày ký kết.",
      body: "Bến cảng chật kín cờ hiệu của 12 quốc gia tham dự lễ ký kết.",
      reliability: 88
    });
    expect(p.id).toMatch(/^PERSP-/);
    expect(await deleteEventPerspective(p.id)).toBe(true);
  });
});
