import {
  createAiProposal,
  loadAiProposals,
  reviewAiProposal,
  type AiAssistantMode
} from "@/db/ai-proposals-repo";
import { loadState } from "@/db/repository";
import { loadCharacterState } from "@/db/character-repository";
import { suggestCandidateRelations } from "@/db/universal-relations-repo";
import { runContentHealthAudit } from "@/lib/content-health-engine";
import { loadArchivesStore } from "@/db/archives-repo";
import {
  getRequestUser,
  jsonError,
  jsonOk,
  requireEditor
} from "@/lib/api-helpers";

export async function GET(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || "ws-aethelgard";
  const all = await loadAiProposals();
  const proposals = all.filter((p) => p.workspaceId === workspaceId);
  return jsonOk({ proposals });
}

export async function POST(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  const workspaceId = body.workspaceId || "ws-aethelgard";
  const mode = (body.mode || "lore_assistant") as AiAssistantMode;
  const targetTitle = String(body.targetTitle || "Toàn bộ Thế giới").trim();
  const promptNote = String(body.promptNote || "").trim();

  // Strictly evidence-grounded analysis — NEVER invents facts or auto-mutates official data!
  let proposedContent = "";
  const inputSources: string[] = [];
  let provenanceBreakdown: Record<string, number> | undefined;

  if (mode === "consistency_checker") {
    const audit = await runContentHealthAudit(workspaceId);
    inputSources.push(`Content Health Engine (${audit.totalIssues} cảnh báo thực tế)`);
    const top = audit.issues.slice(0, 8);
    proposedContent = [
      `## Báo cáo Kiểm tra Nhất quán Lore (${audit.totalIssues} vấn đề)`,
      `- Nghiêm trọng: ${audit.bySeverity.critical} · Cảnh báo: ${audit.bySeverity.warning} · Gợi ý: ${audit.bySeverity.info}`,
      ...top.map((i) => `- [${i.ruleLabel}] ${i.entityTitle}: ${i.description} → ${i.suggestion}`)
    ].join("\n");
  } else if (mode === "timeline_consistency") {
    const [state, charState] = await Promise.all([loadState(), loadCharacterState()]);
    const wsChars = charState.characters.filter((c) => c.workspaceId === workspaceId);
    const wsEvents = state.timelineEvents
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => a.sortYear - b.sortYear);

    const anomalies: string[] = [];
    for (const ch of wsChars) {
      if (
        typeof ch.birthYear === "number" &&
        typeof ch.deathYear === "number" &&
        ch.deathYear < ch.birthYear
      ) {
        anomalies.push(
          `- **${ch.fullName} (${ch.id})**: Năm mất (${ch.deathYear}) nhỏ hơn năm sinh (${ch.birthYear}).`
        );
      }
      if (
        ch.lifeStatus === "alive" &&
        (typeof ch.deathYear === "number" || (ch.deathDate && ch.deathDate.trim().length > 0))
      ) {
        anomalies.push(
          `- **${ch.fullName} (${ch.id})**: Trạng thái sinh tồn đang là \`alive\` nhưng đã có dữ liệu ngày/năm mất (${ch.deathDate || ch.deathYear}).`
        );
      }
      if (
        ch.lifeStatus === "deceased" &&
        typeof ch.deathYear !== "number" &&
        (!ch.deathDate || !ch.deathDate.trim())
      ) {
        anomalies.push(
          `- **${ch.fullName} (${ch.id})**: Đánh dấu \`deceased\` (Đã khuất) nhưng chưa ghi nhận mốc thời gian qua đời.`
        );
      }
    }

    for (const ev of wsEvents) {
      if (!ev.era || !ev.era.trim()) {
        anomalies.push(`- **Sự kiện ${ev.title} (${ev.dateLabel})**: Chưa gắn Kỷ nguyên lịch sử (\`era\`).`);
      }
    }

    inputSources.push(
      `Character Codex (${wsChars.length} nhân vật)`,
      `Living Timeline (${wsEvents.length} sự kiện)`
    );
    proposedContent = [
      `## Kiểm toán Nhất quán Dòng thời gian & Sinh tử (V9.0)`,
      `- Đã đối chiếu **${wsChars.length}** hồ sơ nhân vật và **${wsEvents.length}** mốc biên niên sử.`,
      anomalies.length === 0
        ? `- Kết quả: Không phát hiện mâu thuẫn niên đại (năm sinh/năm mất/kỷ nguyên) trong dữ liệu hiện tại.`
        : `- Phát hiện **${anomalies.length}** điểm cần biên tập viên rà soát:`,
      ...anomalies.slice(0, 12)
    ].join("\n");
  } else if (mode === "missing_data_suggestions") {
    const [state, charState] = await Promise.all([loadState(), loadCharacterState()]);
    const wsEntries = state.entries.filter((e) => e.workspaceId === workspaceId && !e.deletedAt);
    const wsChars = charState.characters.filter((c) => c.workspaceId === workspaceId);

    provenanceBreakdown = {
      canon: 0,
      verified: 0,
      unverified: 0,
      inferred: 0,
      original_lore: 0,
      draft: 0
    };

    const missingHints: string[] = [];
    for (const e of wsEntries) {
      const st = e.canonStatus || "draft";
      provenanceBreakdown[st] = (provenanceBreakdown[st] || 0) + 1;

      if (!e.summary || e.summary.trim().length < 20) {
        missingHints.push(
          `- **${e.title} (${e.id})** [${st}]: Thiếu tóm tắt bách khoa chuẩn (dưới 20 ký tự).`
        );
      }
      if ((st === "canon" || st === "verified") && (!e.sourcesMarkdown || !e.sourcesMarkdown.trim())) {
        missingHints.push(
          `- **${e.title} (${e.id})** [${st}]: Đang gắn nhãn Chính sử/Đã xác minh nhưng chưa đính kèm nguồn tham khảo.`
        );
      }
    }

    for (const c of wsChars) {
      if (!c.portraitUrl || !c.portraitUrl.trim()) {
        missingHints.push(
          `- **${c.fullName} (${c.id})**: Chưa có ảnh chân dung đại diện (\`portraitUrl\`).`
        );
      }
    }

    inputSources.push(
      `Codex Entries (${wsEntries.length} hồ sơ)`,
      `Character Codex (${wsChars.length} nhân vật)`
    );
    proposedContent = [
      `## Gợi ý Bổ sung Trường Dữ liệu & Phân loại Nguồn gốc Tri thức`,
      `- Phân bố trạng thái xác thực: Canon (${provenanceBreakdown.canon}) · Verified (${provenanceBreakdown.verified}) · Original Lore (${provenanceBreakdown.original_lore}) · Inferred (${provenanceBreakdown.inferred}) · Unverified (${provenanceBreakdown.unverified}) · Draft (${provenanceBreakdown.draft}).`,
      missingHints.length === 0
        ? `- Tất cả hồ sơ hiện tại đã có đầy đủ tóm tắt, nguồn tham khảo và chân dung chuẩn.`
        : `- Danh sách ưu tiên bổ sung (${missingHints.length} hạng mục — chỉ đề xuất, không tự ý ghi đè):`,
      ...missingHints.slice(0, 12)
    ].join("\n");
  } else if (mode === "relationship_finder") {
    const suggestions = await suggestCandidateRelations(workspaceId);
    inputSources.push(`Universal Relations Scanner (${suggestions.length} đề xuất)`);
    proposedContent =
      suggestions.length === 0
        ? "Không phát hiện cặp thực thể chưa liên kết mới nào từ dữ liệu hiện có."
        : [
            `## Đề xuất Liên kết Tri thức (${suggestions.length} ứng viên)`,
            ...suggestions
              .slice(0, 8)
              .map(
                (s) =>
                  `- ${s.sourceTitle} (${s.sourceId}) → ${s.suggestedLabel} → ${s.targetTitle} (${s.targetId}) — Lý do: ${s.reason}`
              )
          ].join("\n");
  } else if (mode === "historian") {
    const [state, archives] = await Promise.all([loadState(), loadArchivesStore()]);
    const events = state.timelineEvents
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => a.sortYear - b.sortYear)
      .slice(0, 8);
    inputSources.push(
      `Living History (${events.length} sự kiện)`,
      `Historical Archive (${archives.documents.length} tư liệu)`
    );
    proposedContent = [
      `## Tổng hợp Sử liệu Thế giới (${events.length} mốc sự kiện đã ghi nhận)`,
      ...events.map((e) => `- **${e.dateLabel}** (${e.era}): ${e.title} — ${e.summary || "Chưa có tóm tắt"}`),
      "",
      `Tư liệu gốc đối chiếu: ${archives.documents.map((d) => `${d.id} (${d.title})`).join("; ") || "Chưa có"}`
    ].join("\n");
  } else if (mode === "research_assistant") {
    const state = await loadState();
    const wsEntries = state.entries.filter((e) => e.workspaceId === workspaceId && !e.deletedAt);
    const unverified = wsEntries.filter(
      (e) => !e.canonStatus || e.canonStatus === "unverified" || e.canonStatus === "draft"
    );
    const inferred = wsEntries.filter(
      (e) => e.canonStatus === "inferred" || e.canonStatus === "hypothesis"
    );
    inputSources.push(`Wiki Entries (${wsEntries.length} hồ sơ)`);
    proposedContent = [
      `## Trợ lý Nghiên cứu & Phân tách Nguồn`,
      `- Tổng hồ sơ đang kiểm tra: ${wsEntries.length}`,
      `- Hồ sơ Chưa xác minh / Bản nháp cần bổ sung nguồn: ${unverified.length}`,
      `- Hồ sơ dạng Suy luận học thuật (Inferred): ${inferred.length}`,
      `- Gợi ý biên tập: Ưu tiên rà soát các hồ sơ chưa gắn nguồn trước khi chuyển sang trạng thái Verified/Canon.`
    ].join("\n");
  } else if (mode === "article_generator") {
    inputSources.push(`Cấu trúc chuẩn Aethel Codex (${targetTitle})`);
    proposedContent = [
      `## Khung Bản nháp Chuẩn Bách khoa: ${targetTitle}`,
      `> Lưu ý: Bản nháp cấu trúc chỉ dựng mục lục chuẩn, không tự bịa sự kiện.`,
      ``,
      `### 1. Tổng quan & Định danh`,
      `- Tên chính thức: ${targetTitle}`,
      `- Ghi chú yêu cầu: ${promptNote || "(Chưa bổ sung)"}`,
      ``,
      `### 2. Bối cảnh Lịch sử & Địa lý`,
      `- [Cần điền từ sử liệu đã xác minh]`,
      ``,
      `### 3. Liên kết & Nguồn tham khảo`,
      `- [Gắn [[Wikilink]] và mã DOC-XXXXXX / CHAR-XXXXXX / KING-XXXXXX]`
    ].join("\n");
  } else {
    inputSources.push(`Aethel Editorial Guidelines (${targetTitle})`);
    proposedContent = [
      `## Đề xuất Chuẩn hóa Biên tập cho: ${targetTitle}`,
      `- Đảm bảo phân tách rõ trạng thái xác thực (Canon / Verified / Unverified / Inferred / Original Lore / Draft).`,
      `- Bổ sung ít nhất 1 nguồn tham khảo (DOC-XXXXXX) và 2 liên kết chéo sang hồ sơ liên quan.`,
      promptNote ? `- Ghi chú người biên tập: ${promptNote}` : ""
    ]
      .filter(Boolean)
      .join("\n");
  }

  const proposal = await createAiProposal({
    workspaceId,
    mode,
    targetEntityId: body.targetEntityId || null,
    targetTitle,
    promptNote,
    proposedContent,
    inputSources,
    provenanceBreakdown,
    createdBy: user.name || user.role
  });

  return jsonOk({ proposal }, 201);
}

export async function PATCH(request: Request) {
  const user = getRequestUser(request);
  const denied = requireEditor(user);
  if (denied) return denied;

  const body = await request.json();
  if (!body.id || !["approved", "rejected"].includes(body.decision)) {
    return jsonError("Thiếu ID đề xuất hoặc quyết định duyệt không hợp lệ.");
  }
  const updated = await reviewAiProposal(
    String(body.id),
    body.decision,
    user.name || user.role
  );
  if (!updated) return jsonError("Không tìm thấy đề xuất AI.", 404);
  return jsonOk({ proposal: updated });
}
