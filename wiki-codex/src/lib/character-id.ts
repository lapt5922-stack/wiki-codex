import type {
  CharacterAuditIssue,
  CharacterCodexDatabaseState,
  CharacterRelationType
} from "@/types/character-codex";

/**
 * Generates stable, sequential, human-readable immutable IDs:
 * CHAR-000001, SKILL-000001, ITEM-000001, EVENT-000001, ORG-000001, REL-000001...
 */
export function nextSequentialId(prefix: string, existingIds: Iterable<string>): string {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  let maxNum = 0;
  for (const id of existingIds) {
    const m = re.exec(id);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > maxNum) maxNum = n;
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(6, "0")}`;
}

export const REVERSE_RELATION_MAP: Record<CharacterRelationType, CharacterRelationType> = {
  father: "child",
  mother: "child",
  child: "father",
  sibling: "sibling",
  relative: "relative",
  ancestor: "descendant",
  descendant: "ancestor",
  friend: "friend",
  best_friend: "best_friend",
  comrade: "comrade",
  lover: "lover",
  spouse: "spouse",
  mentor: "disciple",
  disciple: "mentor",
  ally: "ally",
  rival: "rival",
  enemy: "enemy",
  master: "subordinate",
  subordinate: "master",
  political_ally: "political_ally",
  partner: "partner",
  special: "special"
};

export const RELATION_LABELS_VI: Record<CharacterRelationType, string> = {
  father: "Cha",
  mother: "Mẹ",
  sibling: "Anh / Chị / Em",
  child: "Con cái",
  relative: "Họ hàng",
  ancestor: "Tổ tiên",
  descendant: "Hậu duệ",
  friend: "Bạn bè",
  best_friend: "Bạn thân",
  comrade: "Đồng đội",
  lover: "Người yêu",
  spouse: "Vợ / Chồng",
  mentor: "Thầy / Sư phụ",
  disciple: "Học trò / Đệ tử",
  ally: "Đồng minh",
  rival: "Đối thủ",
  enemy: "Kẻ thù",
  master: "Chủ nhân",
  subordinate: "Thuộc hạ",
  political_ally: "Đồng minh chính trị",
  partner: "Đối tác",
  special: "Quan hệ đặc biệt"
};

/**
 * Audits Character Codex for duplicate IDs, dangling relationships, timeline paradoxes,
 * unconfirmed power entries, and missing sources (Features #21, #22, #23).
 */
export function auditCharacterCodex(
  state: CharacterCodexDatabaseState,
  workspaceId?: string
): CharacterAuditIssue[] {
  const issues: CharacterAuditIssue[] = [];
  const chars = state.characters.filter(
    (c) => !c.deletedAt && (!workspaceId || c.workspaceId === workspaceId)
  );
  const charMap = new Map<string, (typeof chars)[number]>();

  // 1. Duplicate ID detection
  const seenIds = new Set<string>();
  for (const c of chars) {
    if (seenIds.has(c.id)) {
      issues.push({
        id: `dup-${c.id}`,
        severity: "error",
        kind: "duplicate_id",
        characterId: c.id,
        characterName: c.fullName,
        message: `Phát hiện ID trùng lặp: ${c.id} (${c.fullName}).`
      });
    }
    seenIds.add(c.id);
    charMap.set(c.id, c);

    // 2. Timeline paradox: deathYear < birthYear
    if (
      typeof c.birthYear === "number" &&
      typeof c.deathYear === "number" &&
      c.deathYear < c.birthYear
    ) {
      issues.push({
        id: `paradox-${c.id}`,
        severity: "error",
        kind: "timeline_paradox",
        characterId: c.id,
        characterName: c.fullName,
        message: `Mâu thuẫn niên đại: Năm mất (${c.deathYear}) nhỏ hơn năm sinh (${c.birthYear}).`
      });
    }

    // 3. Missing sources info
    const srcCount = state.sources.filter((s) => s.characterId === c.id).length;
    if (srcCount === 0) {
      issues.push({
        id: `nosrc-${c.id}`,
        severity: "info",
        kind: "empty_sources",
        characterId: c.id,
        characterName: c.fullName,
        message: `Hồ sơ ${c.id} (${c.fullName}) chưa gắn nguồn tham khảo xác thực.`
      });
    }
  }

  // 4. Dangling or broken relationships
  for (const rel of state.relationships) {
    if (workspaceId && rel.workspaceId !== workspaceId) continue;
    if (!charMap.has(rel.characterAId) || !charMap.has(rel.characterBId)) {
      issues.push({
        id: `rel-${rel.id}`,
        severity: "warning",
        kind: "missing_relation_target",
        characterId: rel.characterAId,
        message: `Quan hệ ${rel.id} (${rel.characterAId} → ${rel.characterBId}) tham chiếu tới nhân vật không tồn tại hoặc đã xóa.`
      });
    }
  }

  // 5. Unconfirmed power progression check
  for (const ab of state.abilities) {
    const ch = charMap.get(ab.characterId);
    if (!ch) continue;
    const unconfirmed = ab.progressionHistory.filter((p) => !p.confirmedByEditor);
    if (unconfirmed.length > 0) {
      issues.push({
        id: `unconf-${ch.id}`,
        severity: "warning",
        kind: "unconfirmed_power",
        characterId: ch.id,
        characterName: ch.fullName,
        message: `Có ${unconfirmed.length} mốc thay đổi sức mạnh chưa được biên tập viên xác nhận.`
      });
    }
  }

  return issues;
}

/** Escape CSV field safely */
export function escapeCsvCell(val: unknown): string {
  const str = String(val ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
