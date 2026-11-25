import { describe, expect, it } from "vitest";
import {
  SESSION_COOKIE_NAME,
  checkLoginRateLimit,
  getAuthSecret,
  recordLoginFailure,
  resetAllLoginRateLimits,
  signSessionToken,
  verifySessionToken
} from "@/lib/auth";
import { loadState } from "@/db/repository";
import { GET as getPublishRoute } from "@/app/api/publish/route";
import { GET as getCharAuditRoute } from "@/app/api/characters/audit/route";
import { GET as getHealthValidateRoute } from "@/app/api/health/validate/route";
import { GET as getBackupRoute } from "@/app/api/backup/route";
import { PATCH as patchEntryRoute } from "@/app/api/entries/[id]/route";
import { PATCH as patchCharRoute } from "@/app/api/characters/[id]/route";
import { PATCH as patchKingdomRoute } from "@/app/api/kingdoms/[id]/route";
import { GET as getSearchRoute } from "@/app/api/search/route";
import { scoreSearchMatch } from "@/lib/vietnamese";
import { GET as getGraphRoute } from "@/app/api/graph/route";
import { POST as postAiRoute } from "@/app/api/ai-assistant/route";
import { loadAiProposals, saveAiProposals } from "@/db/ai-proposals-repo";
import {
  createFullSystemBackup,
  restoreFullSystemBackup
} from "@/lib/system-backup";

function makeAuthedHeaders(role: "admin" | "editor" | "guest"): Record<string, string> {
  if (role === "guest") return {};
  const token = signSessionToken({
    id: `v9-test-${role}`,
    email: `${role}@aethel.test`,
    name: `V9 Test ${role}`,
    role
  });
  return {
    cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "content-type": "application/json"
  };
}

describe("Aethel Codex V9.0 — Security, Concurrency, Backup & Advanced Wiki Intelligence", () => {
  it("resolves SESSION_SECRET fallback and enforces brute-force login rate limiting", () => {
    const prevAuth = process.env.AUTH_SECRET;
    const prevSession = process.env.SESSION_SECRET;
    try {
      delete process.env.AUTH_SECRET;
      process.env.SESSION_SECRET = "render-session-secret-v9-test";
      expect(getAuthSecret()).toBe("render-session-secret-v9-test");

      const token = signSessionToken({
        id: "u-admin",
        email: "admin@aethel.test",
        name: "Admin",
        role: "admin"
      });
      const verified = verifySessionToken(token);
      expect(verified?.role).toBe("admin");
    } finally {
      if (prevAuth === undefined) delete process.env.AUTH_SECRET;
      else process.env.AUTH_SECRET = prevAuth;
      if (prevSession === undefined) delete process.env.SESSION_SECRET;
      else process.env.SESSION_SECRET = prevSession;
    }

    resetAllLoginRateLimits();
    const key = "attacker@example.com";
    for (let i = 0; i < 8; i++) {
      expect(checkLoginRateLimit(key).allowed).toBe(true);
      recordLoginFailure(key);
    }
    const blocked = checkLoginRateLimit(key);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    resetAllLoginRateLimits();
  });

  it("enforces strict RBAC on publish webhook redaction, audit endpoints, and admin backup", async () => {
    const guestPubRes = await getPublishRoute(
      new Request("http://localhost/api/publish?workspaceId=ws-aethelgard")
    );
    expect(guestPubRes.status).toBe(200);
    const guestPubJson = await guestPubRes.json();
    expect(Array.isArray(guestPubJson.targets)).toBe(true);
    for (const t of guestPubJson.targets) {
      expect(t.webhookUrl).toBe("");
    }

    const guestCharAudit = await getCharAuditRoute(
      new Request("http://localhost/api/characters/audit?workspaceId=ws-aethelgard")
    );
    expect(guestCharAudit.status).toBe(403);

    const editorCharAudit = await getCharAuditRoute(
      new Request("http://localhost/api/characters/audit?workspaceId=ws-aethelgard", {
        headers: makeAuthedHeaders("editor")
      })
    );
    expect(editorCharAudit.status).toBe(200);

    const guestHealth = await getHealthValidateRoute(
      new Request("http://localhost/api/health/validate?workspaceId=ws-aethelgard")
    );
    expect(guestHealth.status).toBe(403);

    const editorBackup = await getBackupRoute(
      new Request("http://localhost/api/backup", {
        headers: makeAuthedHeaders("editor")
      })
    );
    expect(editorBackup.status).toBe(403);

    const adminBackup = await getBackupRoute(
      new Request("http://localhost/api/backup", {
        headers: makeAuthedHeaders("admin")
      })
    );
    expect(adminBackup.status).toBe(200);
  });

  it("returns HTTP 409 Conflict when expectedUpdatedAt is stale across Entries, Characters & Kingdoms", async () => {
    const state = await loadState();
    const sampleEntry = state.entries.find((e) => !e.deletedAt)!;

    const entryConflict = await patchEntryRoute(
      new Request(`http://localhost/api/entries/${sampleEntry.id}`, {
        method: "PATCH",
        headers: makeAuthedHeaders("editor"),
        body: JSON.stringify({
          subtitle: "Cập nhật xung đột",
          expectedUpdatedAt: "1999-01-01T00:00:00.000Z"
        })
      }),
      { params: Promise.resolve({ id: sampleEntry.id }) }
    );
    expect(entryConflict.status).toBe(409);

    const charConflict = await patchCharRoute(
      new Request("http://localhost/api/characters/CHAR-000001", {
        method: "PATCH",
        headers: makeAuthedHeaders("editor"),
        body: JSON.stringify({
          character: { occupation: "Xung đột" },
          expectedUpdatedAt: "1999-01-01T00:00:00.000Z"
        })
      }),
      { params: Promise.resolve({ id: "CHAR-000001" }) }
    );
    expect(charConflict.status).toBe(409);

    const kingConflict = await patchKingdomRoute(
      new Request("http://localhost/api/kingdoms/KING-000001", {
        method: "PATCH",
        headers: makeAuthedHeaders("editor"),
        body: JSON.stringify({
          dossier: { motto: "Xung đột" },
          expectedUpdatedAt: "1999-01-01T00:00:00.000Z"
        })
      }),
      { params: Promise.resolve({ id: "KING-000001" }) }
    );
    expect(kingConflict.status).toBe(409);
  });

  it("creates SHA-256 verified full-system backups, blocks tampered payloads, and restores cleanly", async () => {
    const snapshot = await createFullSystemBackup(
      "V9 QA Suite",
      "Kiểm thử sao lưu không ghi đĩa phụ",
      false
    );
    expect(snapshot.format).toBe("aethel-codex-full-backup-v9");
    expect(snapshot.counts.entries).toBeGreaterThan(0);
    expect(snapshot.counts.characters).toBeGreaterThan(0);
    expect(snapshot.checksumSha256).toMatch(/^[a-f0-9]{64}$/);

    // Tamper test: mutate payload without updating SHA-256 checksum
    const tampered = structuredClone(snapshot);
    tampered.stores.codexState.workspaces[0].name = "Tampered Workspace Name";
    await expect(
      restoreFullSystemBackup(tampered, "V9 QA Suite", false)
    ).rejects.toThrow(/SHA-256/);

    // Valid restore succeeds cleanly
    const restored = await restoreFullSystemBackup(snapshot, "V9 QA Suite", false);
    expect(restored.restoredBackupId).toBe(snapshot.backupId);
  });

  it("ranks Omni-Search matches, merges Cross-Domain Knowledge Graph Pro, and generates non-destructive AI proposals", async () => {
    expect(
      scoreSearchMatch("Solana", {
        id: "KING-000001",
        primaryTitle: "Solana",
        subtitleOrMeta: "Đế chế"
      })
    ).toBeGreaterThan(
      scoreSearchMatch("Solana", {
        id: "ENT-99",
        primaryTitle: "Biên niên sử cổ đại",
        bodyText: "Có nhắc tới Solana ở chương cuối"
      })
    );

    const searchRes = await getSearchRoute(
      new Request(
        "http://localhost/api/search?workspaceId=ws-aethelgard&q=Solana&crossWorkspace=true",
        { headers: makeAuthedHeaders("editor") }
      )
    );
    expect(searchRes.status).toBe(200);
    const searchJson = await searchRes.json();
    expect(searchJson.crossWorkspace).toBe(true);
    expect(Array.isArray(searchJson.suggestions)).toBe(true);

    const graphRes = await getGraphRoute(
      new Request(
        "http://localhost/api/graph?workspaceId=ws-aethelgard&mode=graph&crossDomain=true",
        { headers: makeAuthedHeaders("editor") }
      )
    );
    expect(graphRes.status).toBe(200);
    const graphJson = await graphRes.json();
    expect(graphJson.proInsights.crossDomain).toBe(true);
    expect(graphJson.graph.nodes.some((n: { id: string }) => n.id.startsWith("CHAR-"))).toBe(true);
    expect(graphJson.graph.nodes.some((n: { id: string }) => n.id.startsWith("KING-"))).toBe(true);

    const beforeProposals = [...(await loadAiProposals())];
    try {
      const timelineAiRes = await postAiRoute(
        new Request("http://localhost/api/ai-assistant", {
          method: "POST",
          headers: makeAuthedHeaders("editor"),
          body: JSON.stringify({
            workspaceId: "ws-aethelgard",
            mode: "timeline_consistency"
          })
        })
      );
      expect(timelineAiRes.status).toBe(201);
      const timelineAiJson = await timelineAiRes.json();
      expect(timelineAiJson.proposal.status).toBe("pending");

      const missingAiRes = await postAiRoute(
        new Request("http://localhost/api/ai-assistant", {
          method: "POST",
          headers: makeAuthedHeaders("editor"),
          body: JSON.stringify({
            workspaceId: "ws-aethelgard",
            mode: "missing_data_suggestions"
          })
        })
      );
      expect(missingAiRes.status).toBe(201);
      const missingAiJson = await missingAiRes.json();
      expect(missingAiJson.proposal.provenanceBreakdown).toBeDefined();
    } finally {
      await saveAiProposals(beforeProposals);
    }
  });
});
