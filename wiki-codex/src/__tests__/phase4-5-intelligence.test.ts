import { describe, expect, it } from "vitest";
import { createAiProposal, loadAiProposals, reviewAiProposal } from "@/db/ai-proposals-repo";

describe("Phase 4 & 5 — Governed AI Proposal Queue & Review", () => {
  it("creates pending AI proposals with input sources and requires explicit admin review", async () => {
    const proposal = await createAiProposal({
      workspaceId: "ws-aethelgard",
      mode: "consistency_checker",
      targetEntityId: null,
      targetTitle: "Kiểm thử Nhất quán Phase 5",
      promptNote: "Test governed AI review queue",
      proposedContent: "Báo cáo đề xuất chỉ đọc — không tự sửa dữ liệu gốc.",
      inputSources: ["Content Health Engine"],
      createdBy: "Test Editor"
    });

    expect(proposal.id).toMatch(/^AIP-/);
    expect(proposal.status).toBe("pending");
    expect(proposal.reviewedBy).toBeNull();

    const reviewed = await reviewAiProposal(proposal.id, "approved", "Test Admin");
    expect(reviewed?.status).toBe("approved");
    expect(reviewed?.reviewedBy).toBe("Test Admin");

    const all = await loadAiProposals();
    expect(all.some((p) => p.id === proposal.id && p.status === "approved")).toBe(true);
  });
});
