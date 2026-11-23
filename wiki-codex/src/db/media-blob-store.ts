import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getPostgresPool, isPostgresConfigured } from "./pool";

export interface StoredMediaBlob {
  id: string;
  workspaceId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: Buffer;
  createdAt: string;
}

const LOCAL_BLOB_DIR = path.join(process.cwd(), ".data", "media-blobs");
let pgMediaBlobInit = false;

async function ensurePgMediaBlobTable() {
  if (pgMediaBlobInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_media_blobs (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data_base64 TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_codex_media_blobs_ws ON codex_media_blobs(workspace_id);
  `);
  pgMediaBlobInit = true;
}

function ensureLocalBlobDir() {
  if (!fs.existsSync(LOCAL_BLOB_DIR)) {
    fs.mkdirSync(LOCAL_BLOB_DIR, { recursive: true });
  }
}

export async function saveMediaBlob(input: {
  workspaceId: string;
  fileName: string;
  mimeType: string;
  data: Buffer;
}): Promise<{ id: string; sizeBytes: number; mimeType: string; createdAt: string }> {
  const id = `mblob-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const createdAt = new Date().toISOString();
  const sizeBytes = input.data.byteLength;

  if (isPostgresConfigured()) {
    try {
      await ensurePgMediaBlobTable();
      const pool = getPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO codex_media_blobs (id, workspace_id, file_name, mime_type, size_bytes, data_base64, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            id,
            input.workspaceId,
            input.fileName,
            input.mimeType,
            sizeBytes,
            input.data.toString("base64"),
            createdAt
          ]
        );
      }
    } catch {
      // Fall back to local disk persistence if DB write temporarily fails
    }
  }

  // Always write to local .data/media-blobs as fast local cache / dev store
  try {
    ensureLocalBlobDir();
    const metaPath = path.join(LOCAL_BLOB_DIR, `${id}.json`);
    const binPath = path.join(LOCAL_BLOB_DIR, `${id}.bin`);
    fs.writeFileSync(binPath, input.data);
    fs.writeFileSync(
      metaPath,
      JSON.stringify({
        id,
        workspaceId: input.workspaceId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes,
        createdAt
      }),
      "utf8"
    );
  } catch {
    // Read-only filesystem fallback when PostgreSQL is primary
  }

  return { id, sizeBytes, mimeType: input.mimeType, createdAt };
}

export async function getMediaBlobById(id: string): Promise<StoredMediaBlob | null> {
  // Sanitize id strictly to prevent path traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) return null;

  // 1. Try fast local cache first
  const metaPath = path.join(LOCAL_BLOB_DIR, `${id}.json`);
  const binPath = path.join(LOCAL_BLOB_DIR, `${id}.bin`);
  if (fs.existsSync(metaPath) && fs.existsSync(binPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Omit<StoredMediaBlob, "data">;
      const data = fs.readFileSync(binPath);
      return { ...meta, data };
    } catch {
      // Fall through to Postgres
    }
  }

  // 2. Fallback to PostgreSQL (persists across Render redeploys!)
  if (isPostgresConfigured()) {
    try {
      await ensurePgMediaBlobTable();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query(
          `SELECT id, workspace_id, file_name, mime_type, size_bytes, data_base64, created_at
           FROM codex_media_blobs WHERE id = $1 LIMIT 1`,
          [id]
        );
        if (res.rows[0]) {
          const r = res.rows[0];
          const data = Buffer.from(String(r.data_base64), "base64");
          return {
            id: String(r.id),
            workspaceId: String(r.workspace_id),
            fileName: String(r.file_name),
            mimeType: String(r.mime_type),
            sizeBytes: Number(r.size_bytes),
            data,
            createdAt: new Date(r.created_at).toISOString()
          };
        }
      }
    } catch {
      return null;
    }
  }

  return null;
}
