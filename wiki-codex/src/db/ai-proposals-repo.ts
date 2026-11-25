import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPostgresPool, isPostgresConfigured } from "./pool";

export type AiAssistantMode =
  | "lore_assistant"
  | "consistency_checker"
  | "timeline_consistency"
  | "missing_data_suggestions"
  | "relationship_finder"
  | "historian"
  | "article_generator"
  | "research_assistant";

export interface AiProposalRecord {
  id: string;
  workspaceId: string;
  mode: AiAssistantMode;
  targetEntityId: string | null;
  targetTitle: string;
  promptNote: string;
  proposedContent: string;
  inputSources: string[];
  provenanceBreakdown?: Record<string, number>;
  status: "pending" | "approved" | "rejected";
  createdBy: string;
  reviewedBy: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const LOCAL_FILE = path.join(process.cwd(), ".data", "ai-proposals.json");
let cached: AiProposalRecord[] | null = null;
let pgInit = false;

async function ensurePg() {
  if (pgInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_ai_proposals_blob (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgInit = true;
}

export async function loadAiProposals(): Promise<AiProposalRecord[]> {
  if (cached) return cached;
  if (isPostgresConfigured()) {
    try {
      await ensurePg();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query(`SELECT payload FROM codex_ai_proposals_blob WHERE id = 'primary' LIMIT 1`);
        if (Array.isArray(res.rows[0]?.payload)) {
          cached = res.rows[0].payload as AiProposalRecord[];
          return cached;
        }
      }
    } catch {
      // fall through
    }
  }
  if (fs.existsSync(LOCAL_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8"));
      if (Array.isArray(parsed)) {
        cached = parsed as AiProposalRecord[];
        return cached;
      }
    } catch {
      // fall through
    }
  }
  cached = [];
  return cached;
}

export async function saveAiProposals(list: AiProposalRecord[]) {
  cached = list;
  if (isPostgresConfigured()) {
    try {
      await ensurePg();
      const pool = getPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO codex_ai_proposals_blob (id, payload, updated_at)
           VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(list)]
        );
      }
    } catch {
      // ignore
    }
  }
  try {
    const dir = path.dirname(LOCAL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(list, null, 2), "utf8");
  } catch {
    // ignore
  }
}

export async function createAiProposal(
  input: Omit<AiProposalRecord, "id" | "status" | "reviewedBy" | "createdAt" | "reviewedAt">
): Promise<AiProposalRecord> {
  const list = await loadAiProposals();
  const rec: AiProposalRecord = {
    ...input,
    id: `AIP-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`,
    status: "pending",
    reviewedBy: null,
    createdAt: new Date().toISOString(),
    reviewedAt: null
  };
  list.unshift(rec);
  await saveAiProposals(list.slice(0, 120));
  return rec;
}

export async function reviewAiProposal(
  id: string,
  decision: "approved" | "rejected",
  reviewerName: string
): Promise<AiProposalRecord | null> {
  const list = await loadAiProposals();
  const found = list.find((p) => p.id === id);
  if (!found) return null;
  found.status = decision;
  found.reviewedBy = reviewerName;
  found.reviewedAt = new Date().toISOString();
  await saveAiProposals(list);
  return found;
}
