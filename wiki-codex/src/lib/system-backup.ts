import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getStorageInfo, loadState, saveState } from "@/db/repository";
import { loadCharacterState, saveCharacterState } from "@/db/character-repository";
import { loadKingdomOverlayStore, saveKingdomOverlayStore } from "@/db/kingdom-repository";
import { loadHeraldryStore, saveHeraldryStore } from "@/db/heraldry-repository";
import { loadUniversalRelationsStore, saveUniversalRelationsStore } from "@/db/universal-relations-repo";
import { loadArchivesStore, saveArchivesStore } from "@/db/archives-repo";
import { loadAiProposals, saveAiProposals } from "@/db/ai-proposals-repo";
import {
  loadHealthResolutionsAsync,
  saveAllHealthResolutions
} from "@/lib/content-health-engine";
import { getPostgresPool, isPostgresConfigured } from "@/db/pool";

export interface SystemBackupPayload {
  codexState: Awaited<ReturnType<typeof loadState>>;
  characterState: Awaited<ReturnType<typeof loadCharacterState>>;
  kingdomOverlay: Awaited<ReturnType<typeof loadKingdomOverlayStore>>;
  heraldryStore: Awaited<ReturnType<typeof loadHeraldryStore>>;
  universalRelations: Awaited<ReturnType<typeof loadUniversalRelationsStore>>;
  archivesStore: Awaited<ReturnType<typeof loadArchivesStore>>;
  aiProposals: Awaited<ReturnType<typeof loadAiProposals>>;
  healthResolutions: Awaited<ReturnType<typeof loadHealthResolutionsAsync>>;
}

export interface SystemBackupEnvelope {
  format: "aethel-codex-full-backup-v9";
  version: "9.0";
  backupId: string;
  createdAt: string;
  createdBy: string;
  note: string;
  storageBackend: "postgresql" | "local-json";
  counts: {
    workspaces: number;
    entries: number;
    characters: number;
    customKingdoms: number;
    heraldryDesigns: number;
    flags: number;
    universalRelations: number;
    archiveDocuments: number;
  };
  checksumSha256: string;
  stores: SystemBackupPayload;
}

export interface BackupMetadataItem {
  backupId: string;
  createdAt: string;
  createdBy: string;
  note: string;
  checksumSha256: string;
  sizeBytes: number;
  counts: SystemBackupEnvelope["counts"];
}

const BACKUP_DIR = path.join(process.cwd(), ".data", "backups");
let pgBackupInit = false;

export function computeStoresChecksum(stores: SystemBackupPayload): string {
  const canonical = JSON.stringify(stores);
  return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
}

async function ensurePgBackupTable() {
  if (pgBackupInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_system_backups (
      backup_id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT NOT NULL,
      note TEXT NOT NULL,
      checksum TEXT NOT NULL,
      payload JSONB NOT NULL
    );
  `);
  pgBackupInit = true;
}

export async function createFullSystemBackup(
  createdBy: string,
  note = "Sao lưu toàn hệ thống Aethel Codex V9.0",
  persistSnapshot = true
): Promise<SystemBackupEnvelope> {
  const [
    codexState,
    characterState,
    kingdomOverlay,
    heraldryStore,
    universalRelations,
    archivesStore,
    aiProposals,
    healthResolutions
  ] = await Promise.all([
    loadState(),
    loadCharacterState(),
    loadKingdomOverlayStore(),
    loadHeraldryStore(),
    loadUniversalRelationsStore(),
    loadArchivesStore(),
    loadAiProposals(),
    loadHealthResolutionsAsync()
  ]);

  const stores: SystemBackupPayload = {
    codexState,
    characterState,
    kingdomOverlay,
    heraldryStore,
    universalRelations,
    archivesStore,
    aiProposals,
    healthResolutions
  };

  const checksumSha256 = computeStoresChecksum(stores);
  const storage = getStorageInfo();
  const now = new Date().toISOString();
  const backupId = `BKP-${now.replace(/[-:.TZ]/g, "").slice(0, 14)}-${crypto
    .randomBytes(2)
    .toString("hex")
    .toUpperCase()}`;

  const envelope: SystemBackupEnvelope = {
    format: "aethel-codex-full-backup-v9",
    version: "9.0",
    backupId,
    createdAt: now,
    createdBy,
    note,
    storageBackend: storage.backend,
    counts: {
      workspaces: codexState.workspaces.length,
      entries: codexState.entries.filter((e) => !e.deletedAt).length,
      characters: characterState.characters.filter((c) => !c.deletedAt).length,
      customKingdoms: Object.keys(kingdomOverlay.customDossiers || {}).length,
      heraldryDesigns: heraldryStore.designs.length,
      flags: heraldryStore.flags.length,
      universalRelations: universalRelations.relations.length,
      archiveDocuments: archivesStore.documents.length
    },
    checksumSha256,
    stores
  };

  if (persistSnapshot) {
    await persistBackupSnapshot(envelope);
  }

  return envelope;
}

async function persistBackupSnapshot(envelope: SystemBackupEnvelope): Promise<void> {
  if (isPostgresConfigured()) {
    try {
      await ensurePgBackupTable();
      const pool = getPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO codex_system_backups (backup_id, created_at, created_by, note, checksum, payload)
           VALUES ($1, $2::timestamptz, $3, $4, $5, $6::jsonb)
           ON CONFLICT (backup_id) DO NOTHING`,
          [
            envelope.backupId,
            envelope.createdAt,
            envelope.createdBy,
            envelope.note,
            envelope.checksumSha256,
            JSON.stringify(envelope)
          ]
        );
        await pool.query(`
          DELETE FROM codex_system_backups
          WHERE backup_id NOT IN (
            SELECT backup_id FROM codex_system_backups ORDER BY created_at DESC LIMIT 12
          )
        `);
      }
    } catch {
      // fall through to local snapshot
    }
  }

  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const target = path.join(BACKUP_DIR, `${envelope.backupId}.json`);
    fs.writeFileSync(target, JSON.stringify(envelope, null, 2), "utf8");
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    for (const old of files.slice(12)) {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, old));
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore fs errors on read-only containers
  }
}

export async function listStoredBackups(): Promise<{
  storage: ReturnType<typeof getStorageInfo> & { localDataBytes: number };
  snapshots: BackupMetadataItem[];
}> {
  const storage = getStorageInfo();
  let localDataBytes = 0;
  const dataDir = path.join(process.cwd(), ".data");
  if (fs.existsSync(dataDir)) {
    try {
      for (const name of fs.readdirSync(dataDir)) {
        const fp = path.join(dataDir, name);
        const st = fs.statSync(fp);
        if (st.isFile()) localDataBytes += st.size;
      }
    } catch {
      // ignore
    }
  }

  if (isPostgresConfigured()) {
    try {
      await ensurePgBackupTable();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query<{
          backup_id: string;
          created_at: string;
          created_by: string;
          note: string;
          checksum: string;
          payload: SystemBackupEnvelope;
        }>(
          `SELECT backup_id, created_at, created_by, note, checksum, payload
           FROM codex_system_backups ORDER BY created_at DESC LIMIT 12`
        );
        if (res.rows.length > 0) {
          return {
            storage: { ...storage, localDataBytes },
            snapshots: res.rows.map((r) => ({
              backupId: r.backup_id,
              createdAt: new Date(r.created_at).toISOString(),
              createdBy: r.created_by,
              note: r.note,
              checksumSha256: r.checksum,
              sizeBytes: Buffer.byteLength(JSON.stringify(r.payload), "utf8"),
              counts: r.payload.counts
            }))
          };
        }
      }
    } catch {
      // fallback
    }
  }

  const snapshots: BackupMetadataItem[] = [];
  if (fs.existsSync(BACKUP_DIR)) {
    try {
      const files = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse()
        .slice(0, 12);
      for (const f of files) {
        const fp = path.join(BACKUP_DIR, f);
        const raw = fs.readFileSync(fp, "utf8");
        const parsed = JSON.parse(raw) as SystemBackupEnvelope;
        snapshots.push({
          backupId: parsed.backupId,
          createdAt: parsed.createdAt,
          createdBy: parsed.createdBy,
          note: parsed.note,
          checksumSha256: parsed.checksumSha256,
          sizeBytes: Buffer.byteLength(raw, "utf8"),
          counts: parsed.counts
        });
      }
    } catch {
      // ignore
    }
  }

  return {
    storage: { ...storage, localDataBytes },
    snapshots
  };
}

export async function loadStoredBackupById(backupId: string): Promise<SystemBackupEnvelope | null> {
  const safeId = backupId.replace(/[^A-Za-z0-9_-]/g, "");
  if (!safeId) return null;

  if (isPostgresConfigured()) {
    try {
      await ensurePgBackupTable();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query<{ payload: SystemBackupEnvelope }>(
          `SELECT payload FROM codex_system_backups WHERE backup_id = $1 LIMIT 1`,
          [safeId]
        );
        if (res.rows[0]?.payload) return res.rows[0].payload;
      }
    } catch {
      // fallback
    }
  }

  const fp = path.join(BACKUP_DIR, `${safeId}.json`);
  if (fs.existsSync(fp)) {
    try {
      return JSON.parse(fs.readFileSync(fp, "utf8")) as SystemBackupEnvelope;
    } catch {
      return null;
    }
  }
  return null;
}

export async function restoreFullSystemBackup(
  envelope: SystemBackupEnvelope,
  actorName: string,
  createSafetyBackupFirst = true
): Promise<{
  restoredBackupId: string;
  preRestoreSafetyBackupId: string | null;
  counts: SystemBackupEnvelope["counts"];
}> {
  if (
    !envelope ||
    envelope.format !== "aethel-codex-full-backup-v9" ||
    !envelope.stores ||
    !Array.isArray(envelope.stores.codexState?.workspaces) ||
    !Array.isArray(envelope.stores.codexState?.entries) ||
    !Array.isArray(envelope.stores.characterState?.characters)
  ) {
    throw new Error("Gói sao lưu không hợp lệ hoặc thiếu cấu trúc bắt buộc.");
  }

  const computed = computeStoresChecksum(envelope.stores);
  if (envelope.checksumSha256 && computed !== envelope.checksumSha256) {
    throw new Error(
      "Mã kiểm tra toàn vẹn SHA-256 không khớp — gói sao lưu có dấu hiệu bị hỏng hoặc bị chỉnh sửa trái phép."
    );
  }

  let preRestoreSafetyBackupId: string | null = null;
  if (createSafetyBackupFirst) {
    const safety = await createFullSystemBackup(
      actorName,
      `Tự động sao lưu an toàn trước khi khôi phục gói ${envelope.backupId}`,
      true
    );
    preRestoreSafetyBackupId = safety.backupId;
  }

  await saveState(envelope.stores.codexState);
  await saveCharacterState(envelope.stores.characterState);
  await saveKingdomOverlayStore(envelope.stores.kingdomOverlay);
  await saveHeraldryStore(envelope.stores.heraldryStore);
  await saveUniversalRelationsStore(envelope.stores.universalRelations);
  await saveArchivesStore(envelope.stores.archivesStore);
  await saveAiProposals(envelope.stores.aiProposals || []);
  await saveAllHealthResolutions(envelope.stores.healthResolutions || {});

  return {
    restoredBackupId: envelope.backupId,
    preRestoreSafetyBackupId,
    counts: envelope.counts
  };
}
