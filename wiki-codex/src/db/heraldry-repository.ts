import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  HeraldryCategoryId,
  HeraldryDesignData,
  HeraldrySavedDesign,
  HeraldryStyleId,
  HeraldryVersionRecord
} from "@/types/heraldry";
import { getPostgresPool, isPostgresConfigured } from "./pool";
import { updateKingdomDossier } from "./kingdom-repository";
import { saveMediaBlob } from "./media-blob-store";
import { renderHeraldryToSvgString } from "@/lib/heraldry/renderer-and-export";

interface HeraldryStore {
  designs: HeraldrySavedDesign[];
  versions: HeraldryVersionRecord[];
  favoriteTemplateIds: string[];
}

const LOCAL_FILE = path.join(process.cwd(), ".data", "heraldry-studio.json");
let cached: HeraldryStore | null = null;
let pgInit = false;

async function ensurePg() {
  if (pgInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_heraldry_blob (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgInit = true;
}

export async function loadHeraldryStore(): Promise<HeraldryStore> {
  if (cached) return cached;
  if (isPostgresConfigured()) {
    try {
      await ensurePg();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query(`SELECT payload FROM codex_heraldry_blob WHERE id = 'primary' LIMIT 1`);
        if (res.rows[0]?.payload) {
          cached = res.rows[0].payload as HeraldryStore;
          return cached;
        }
      }
    } catch {
      // fall through
    }
  }
  if (fs.existsSync(LOCAL_FILE)) {
    try {
      cached = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as HeraldryStore;
      return cached;
    } catch {
      // fall through
    }
  }
  cached = { designs: [], versions: [], favoriteTemplateIds: [] };
  return cached;
}

async function saveHeraldryStore(store: HeraldryStore) {
  cached = store;
  if (isPostgresConfigured()) {
    try {
      await ensurePg();
      const pool = getPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO codex_heraldry_blob (id, payload, updated_at)
           VALUES ('primary', $1::jsonb, NOW())
           ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
          [JSON.stringify(store)]
        );
      }
    } catch {
      // ignore
    }
  }
  try {
    const dir = path.dirname(LOCAL_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // ignore
  }
}

export async function listSavedHeraldryDesigns(opts: {
  workspaceId: string;
  linkedKingdomId?: string;
}) {
  const store = await loadHeraldryStore();
  const designs = store.designs.filter((d) => {
    if (opts.workspaceId && d.workspaceId !== opts.workspaceId) return false;
    if (opts.linkedKingdomId && d.linkedKingdomId !== opts.linkedKingdomId) return false;
    return true;
  });
  return {
    designs,
    favoriteTemplateIds: store.favoriteTemplateIds
  };
}

export async function saveHeraldryDesign(input: {
  id?: string;
  workspaceId: string;
  name: string;
  description?: string;
  category?: HeraldryCategoryId;
  style?: HeraldryStyleId;
  mode?: "template" | "custom" | "upload";
  designData: HeraldryDesignData;
  status?: HeraldrySavedDesign["status"];
  linkedKingdomId?: string | null;
  linkedEntityId?: string | null;
  eraLabel?: string;
  startDate?: string;
  endDate?: string;
  changeReason?: string;
  editorName: string;
}): Promise<HeraldrySavedDesign> {
  const store = await loadHeraldryStore();
  const now = new Date().toISOString();

  if (input.id) {
    const existing = store.designs.find((d) => d.id === input.id);
    if (existing) {
      // Official Emblem Protection: editing an official emblem automatically saves a version snapshot first!
      const nextVer = existing.version + 1;
      store.versions.push({
        id: `hver-${Date.now()}-${nextVer}`,
        designId: existing.id,
        versionNumber: nextVer,
        editorName: input.editorName,
        changeNote: input.changeReason || `Cập nhật thiết kế v${nextVer}`,
        designData: structuredClone(input.designData),
        createdAt: now
      });
      existing.name = input.name.trim();
      existing.description = (input.description ?? existing.description).trim();
      if (input.category) existing.category = input.category;
      if (input.style) existing.style = input.style;
      existing.designData = structuredClone(input.designData);
      if (input.eraLabel !== undefined) existing.eraLabel = input.eraLabel;
      if (input.startDate !== undefined) existing.startDate = input.startDate;
      if (input.endDate !== undefined) existing.endDate = input.endDate;
      if (input.changeReason !== undefined) existing.changeReason = input.changeReason;
      existing.version = nextVer;
      existing.updatedAt = now;
      await saveHeraldryStore(store);
      return existing;
    }
  }

  const id = `HRLD-${String(store.designs.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`;
  const created: HeraldrySavedDesign = {
    id,
    workspaceId: input.workspaceId,
    name: input.name.trim(),
    description: (input.description || "").trim(),
    category: input.category || "kingdom_emblem",
    style: input.style || "imperial",
    mode: input.mode || "template",
    designData: structuredClone(input.designData),
    status: input.status || "draft",
    isOfficial: false,
    linkedKingdomId: input.linkedKingdomId || null,
    linkedEntityId: input.linkedEntityId || null,
    eraLabel: input.eraLabel || "Thời đại Hiện tại",
    startDate: input.startDate || "",
    endDate: input.endDate || "",
    changeReason: input.changeReason || "Khởi tạo thiết kế mới",
    version: 1,
    createdBy: input.editorName,
    createdAt: now,
    updatedAt: now
  };

  store.designs.unshift(created);
  store.versions.push({
    id: `hver-${Date.now()}-1`,
    designId: id,
    versionNumber: 1,
    editorName: input.editorName,
    changeNote: created.changeReason,
    designData: structuredClone(input.designData),
    createdAt: now
  });

  await saveHeraldryStore(store);
  return created;
}

/**
 * Applies a saved Heraldry design as the Official Coat of Arms of a Kingdom (KING-XXXXXX).
 * Requires explicit confirmation (confirmReplaceOfficial: true), marks previous official version
 * as historical, persists SVG asset to persistent media blob store, and updates Kingdom Codex!
 */
export async function applyOfficialEmblemToKingdom(opts: {
  designId: string;
  kingdomId: string;
  confirmReplaceOfficial: boolean;
  changeReason: string;
  editorName: string;
}): Promise<{ design: HeraldrySavedDesign; coatOfArmsUrl: string } | { error: string }> {
  if (!opts.confirmReplaceOfficial) {
    return { error: "Cần xác nhận bảo vệ trước khi thay thế Quốc huy chính thức của Vương quốc." };
  }
  const store = await loadHeraldryStore();
  const design = store.designs.find((d) => d.id === opts.designId);
  if (!design) return { error: "Không tìm thấy thiết kế huy hiệu." };

  // Demote previous official emblem for this kingdom to historical (preserving history!)
  for (const d of store.designs) {
    if (d.linkedKingdomId === opts.kingdomId && d.isOfficial && d.id !== design.id) {
      d.isOfficial = false;
      d.status = "historical";
    }
  }

  design.linkedKingdomId = opts.kingdomId;
  design.isOfficial = true;
  design.status = "official";
  design.changeReason = opts.changeReason || "Đặt làm Quốc huy chính thức";
  design.updatedAt = new Date().toISOString();

  // Persist rendered SVG to dual-storage media blob store so it loads reliably on localhost & Render
  const svgStr = renderHeraldryToSvgString(design.designData, { uid: design.id });
  const blob = await saveMediaBlob({
    workspaceId: design.workspaceId,
    fileName: `${opts.kingdomId.toLowerCase()}-coat-of-arms.svg`,
    mimeType: "image/svg+xml",
    data: Buffer.from(svgStr, "utf8")
  });
  const coatOfArmsUrl = `/api/media/file/${blob.id}`;

  await saveHeraldryStore(store);

  // Sync cleanly with Kingdom Codex
  await updateKingdomDossier(
    opts.kingdomId,
    {
      symbols: {
        kingdomId: opts.kingdomId,
        coatOfArmsUrl
      } as never,
      changeNote: `Cập nhật Quốc huy chính thức từ Royal Heraldry Studio (${design.id}): ${design.changeReason}`
    },
    opts.editorName
  );

  return { design, coatOfArmsUrl };
}

export async function toggleFavoriteHeraldryTemplate(templateId: string): Promise<string[]> {
  const store = await loadHeraldryStore();
  if (store.favoriteTemplateIds.includes(templateId)) {
    store.favoriteTemplateIds = store.favoriteTemplateIds.filter((id) => id !== templateId);
  } else {
    store.favoriteTemplateIds.unshift(templateId);
  }
  await saveHeraldryStore(store);
  return store.favoriteTemplateIds;
}

export async function getHeraldryVersions(designId: string): Promise<HeraldryVersionRecord[]> {
  const store = await loadHeraldryStore();
  return store.versions
    .filter((v) => v.designId === designId)
    .sort((a, b) => b.versionNumber - a.versionNumber);
}

export async function restoreHeraldryVersion(
  designId: string,
  versionNumber: number,
  editorName: string
): Promise<HeraldrySavedDesign | null> {
  const store = await loadHeraldryStore();
  const ver = store.versions.find(
    (v) => v.designId === designId && v.versionNumber === versionNumber
  );
  const design = store.designs.find((d) => d.id === designId);
  if (!ver || !design) return null;
  return saveHeraldryDesign({
    id: design.id,
    workspaceId: design.workspaceId,
    name: design.name,
    designData: ver.designData,
    changeReason: `Khôi phục về phiên bản v${versionNumber}`,
    editorName
  });
}

export async function deleteHeraldryDesign(id: string): Promise<boolean> {
  const store = await loadHeraldryStore();
  const target = store.designs.find((d) => d.id === id);
  if (!target || target.isOfficial) return false; // Official Emblem Protection!
  store.designs = store.designs.filter((d) => d.id !== id);
  await saveHeraldryStore(store);
  return true;
}
