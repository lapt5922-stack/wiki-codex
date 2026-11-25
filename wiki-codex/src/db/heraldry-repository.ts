import fs from "fs";
import path from "path";
import crypto from "crypto";
import type {
  HeraldicMeaningEntry,
  HeraldryCategoryId,
  HeraldryCustomTemplate,
  HeraldryDesignData,
  HeraldryFlagDesign,
  HeraldrySavedDesign,
  HeraldryStyleId,
  HeraldryVersionRecord,
  RoyalRegaliaItem
} from "@/types/heraldry";
import { getPostgresPool, isPostgresConfigured } from "./pool";
import { updateKingdomDossier } from "./kingdom-repository";
import { saveMediaBlob } from "./media-blob-store";
import { renderHeraldryToSvgString } from "@/lib/heraldry/renderer-and-export";

interface HeraldryStore {
  designs: HeraldrySavedDesign[];
  versions: HeraldryVersionRecord[];
  favoriteTemplateIds: string[];
  flags: HeraldryFlagDesign[];
  regalia: RoyalRegaliaItem[];
  meanings: HeraldicMeaningEntry[];
  customTemplates: HeraldryCustomTemplate[];
}

const DEFAULT_MEANINGS: HeraldicMeaningEntry[] = [
  {
    id: "HMEAN-000001",
    workspaceId: "ws-aethelgard",
    entryType: "symbol",
    refId: "sym-lion",
    title: "Sư tử Hoàng gia (Lion)",
    civilization: "Truyền thống Vương triều Cổ điển",
    iconographicMeaning: "Biểu trưng của lòng quả cảm, quyền uy tối thượng và vương quyền chính thống.",
    colorMeaning: "Thường kết hợp Vàng Kim (Or) trên nền Đỏ Son (Gules) hoặc Midnight Navy.",
    culturalContext: "Xuất hiện trên quốc huy các vương quốc lập quốc và gia tộc thượng lưu.",
    politicalMeaning: "Khẳng định chủ quyền quân sự và vai trò bảo hộ thần dân.",
    religiousMeaning: "Gắn với ánh sáng công lý và sức mạnh canh giữ thánh điện.",
    legendAndLore: "Tương truyền Sư tử Vàng là biểu tượng của đội Cấm vệ đầu tiên tại Đại Sảnh Tri Thức.",
    origin: "Huy chương học Trung cổ (Medieval Heraldry)",
    sourceCitation: "Aethel Codex Editorial Standard · Classic Heraldry Reference",
    verificationStatus: "verified_source",
    createdBy: "Archivist System",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "HMEAN-000002",
    workspaceId: "ws-aethelgard",
    entryType: "symbol",
    refId: "sym-double-eagle",
    title: "Đại bàng Hai đầu (Double-Headed Eagle)",
    civilization: "Đế chế Liên lục địa (Byzantine-inspired)",
    iconographicMeaning: "Tầm nhìn bao quát Đông – Tây, biểu trưng cho sự thống nhất quyền lực thế tục và tinh thần.",
    colorMeaning: "Thường đi cùng Đen Tuyền (Sable) hoặc Vàng Cổ (Antique Gold) trên nền Đỏ Tía Hoàng gia.",
    culturalContext: "Chỉ được phép sử dụng bởi Đế chế hoặc Hoàng thất cấp tối cao.",
    politicalMeaning: "Biểu thị liên minh hai vương quốc hoặc quyền cai trị hai miền địa lý.",
    religiousMeaning: "Cầu nối giữa thiên giới và nhân gian trong nghi lễ đăng quang.",
    legendAndLore: "Hải ưng song thủ canh giữ cửa ngõ giữa đại lục cũ và tân thế giới.",
    origin: "Huy hiệu Đế chế Đông La Mã & Thần Thánh La Mã",
    sourceCitation: "Historical Heraldry Reference · Imperial Archives",
    verificationStatus: "verified_source",
    createdBy: "Archivist System",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "HMEAN-000003",
    workspaceId: "ws-aethelgard",
    entryType: "color",
    refId: "or",
    title: "Or · Vàng Kim & Antique Gold (#C6A568)",
    civilization: "Hệ màu Huy hiệu học Truyền thống",
    iconographicMeaning: "Sự cao quý, trí tuệ, hào phóng và uy nghiêm bất diệt.",
    colorMeaning: "Thuộc nhóm Kim loại (Metals) trong Quy tắc Tincture — ưu tiên đặt trên nền màu đậm.",
    culturalContext: "Dùng cho viền khiên, vương miện và biểu tượng trung tâm.",
    politicalMeaning: "Thể hiện sự thịnh vượng tài chính và tính chính danh của triều đại.",
    religiousMeaning: "Ánh sáng chân lý và sự trường tồn.",
    legendAndLore: "Ánh vàng cổ của giấy da và mực dát vàng trong Đại Thư viện.",
    origin: "Rule of Tincture · Classical Heraldry",
    sourceCitation: "Standard Tincture Rules (Or / Argent vs. Colours)",
    verificationStatus: "verified_source",
    createdBy: "Archivist System",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "HMEAN-000004",
    workspaceId: "ws-aethelgard",
    entryType: "symbol",
    refId: "sym-magic-circle",
    title: "Vòng tròn Ma pháp & Thiên cầu (Arcane Circle)",
    civilization: "Các Học viện Ma pháp & Hội đồng Tri thức",
    iconographicMeaning: "Trật tự vũ trụ, kỷ luật học thuật và năng lượng Aether cân bằng.",
    colorMeaning: "Thường phối với Midnight Navy (#101522), Arcane Blue (#657D91) và Ivory (#E9DFC9).",
    culturalContext: "Biểu trưng chuẩn mực của học viện, đài thiên văn và hội đồng lưu trữ.",
    politicalMeaning: "Thể hiện vị thế trung lập học thuật và quyền giám sát cổ thư.",
    religiousMeaning: "Vòng tuần hoàn bất tận của thời gian và các vì sao.",
    legendAndLore: "Cần bổ sung nguồn trích dẫn cụ thể theo từng Học viện trong thế giới Aethel.",
    origin: "Aethel Codex Original Worldbuilding",
    sourceCitation: "Aethel Codex Canon · Arcane Academy Guidelines",
    verificationStatus: "in_world_canon",
    createdBy: "Archivist System",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

function normalizeStore(raw: Partial<HeraldryStore> | null | undefined): HeraldryStore {
  return {
    designs: Array.isArray(raw?.designs) ? raw!.designs : [],
    versions: Array.isArray(raw?.versions) ? raw!.versions : [],
    favoriteTemplateIds: Array.isArray(raw?.favoriteTemplateIds) ? raw!.favoriteTemplateIds : [],
    flags: Array.isArray(raw?.flags) ? raw!.flags : [],
    regalia: Array.isArray(raw?.regalia) ? raw!.regalia : [],
    meanings: Array.isArray(raw?.meanings) && raw!.meanings.length > 0 ? raw!.meanings : structuredClone(DEFAULT_MEANINGS),
    customTemplates: Array.isArray(raw?.customTemplates) ? raw!.customTemplates : []
  };
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
          cached = normalizeStore(res.rows[0].payload as Partial<HeraldryStore>);
          return cached;
        }
      }
    } catch {
      // fall through
    }
  }
  if (fs.existsSync(LOCAL_FILE)) {
    try {
      cached = normalizeStore(JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as Partial<HeraldryStore>);
      return cached;
    } catch {
      // fall through
    }
  }
  cached = normalizeStore(null);
  return cached;
}

export async function saveHeraldryStore(store: HeraldryStore) {
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
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const payload = JSON.stringify(store, null, 2);
  for (let attempt = 0; attempt < 4; attempt++) {
    const tmp = `${LOCAL_FILE}.${process.pid}.${Date.now()}.${attempt}.tmp`;
    try {
      fs.writeFileSync(tmp, payload, "utf8");
      fs.renameSync(tmp, LOCAL_FILE);
      break;
    } catch {
      try {
        if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
      } catch {
        // ignore
      }
    }
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
  approvedBy?: string;
  dynastyId?: string | null;
  dynastyName?: string;
  dynastyRole?: HeraldrySavedDesign["dynastyRole"];
  linkedCharacterId?: string | null;
  linkedEventId?: string | null;
  linkedEventTitle?: string;
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
        approverName: input.approvedBy || existing.approvedBy || "",
        eraLabel: input.eraLabel ?? existing.eraLabel,
        dynastyName: input.dynastyName ?? existing.dynastyName,
        eventTitle: input.linkedEventTitle ?? existing.linkedEventTitle,
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
      if (input.approvedBy !== undefined) existing.approvedBy = input.approvedBy;
      if (input.dynastyId !== undefined) existing.dynastyId = input.dynastyId;
      if (input.dynastyName !== undefined) existing.dynastyName = input.dynastyName;
      if (input.dynastyRole !== undefined) existing.dynastyRole = input.dynastyRole;
      if (input.linkedCharacterId !== undefined) existing.linkedCharacterId = input.linkedCharacterId;
      if (input.linkedEventId !== undefined) existing.linkedEventId = input.linkedEventId;
      if (input.linkedEventTitle !== undefined) existing.linkedEventTitle = input.linkedEventTitle;
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
    approvedBy: input.approvedBy || "",
    dynastyId: input.dynastyId || null,
    dynastyName: input.dynastyName || "",
    dynastyRole: input.dynastyRole,
    linkedCharacterId: input.linkedCharacterId || null,
    linkedEventId: input.linkedEventId || null,
    linkedEventTitle: input.linkedEventTitle || "",
    createdAt: now,
    updatedAt: now
  };

  store.designs.unshift(created);
  store.versions.push({
    id: `hver-${Date.now()}-1`,
    designId: id,
    versionNumber: 1,
    editorName: input.editorName,
    approverName: created.approvedBy || "",
    eraLabel: created.eraLabel,
    dynastyName: created.dynastyName,
    eventTitle: created.linkedEventTitle,
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

// ============================================================
// V2 EXPANSION REPOSITORY — FLAGS, REGALIA, MEANINGS, PACKS
// ============================================================

export async function listFlags(workspaceId: string): Promise<HeraldryFlagDesign[]> {
  const store = await loadHeraldryStore();
  return store.flags.filter((f) => !workspaceId || f.workspaceId === workspaceId);
}

export async function saveFlagDesign(
  input: Omit<HeraldryFlagDesign, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<HeraldryFlagDesign> {
  const store = await loadHeraldryStore();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = store.flags.findIndex((f) => f.id === input.id);
    if (idx >= 0) {
      store.flags[idx] = { ...store.flags[idx], ...input, id: input.id, updatedAt: now };
      await saveHeraldryStore(store);
      return store.flags[idx];
    }
  }
  const created: HeraldryFlagDesign = {
    ...input,
    id: `FLAG-${String(store.flags.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`,
    createdAt: now,
    updatedAt: now
  };
  store.flags.unshift(created);
  await saveHeraldryStore(store);
  return created;
}

export async function deleteFlagDesign(id: string): Promise<boolean> {
  const store = await loadHeraldryStore();
  const prev = store.flags.length;
  store.flags = store.flags.filter((f) => f.id !== id);
  if (store.flags.length === prev) return false;
  await saveHeraldryStore(store);
  return true;
}

export async function listRegalia(workspaceId: string): Promise<RoyalRegaliaItem[]> {
  const store = await loadHeraldryStore();
  return store.regalia.filter((r) => !workspaceId || r.workspaceId === workspaceId);
}

export async function saveRegaliaItem(
  input: Omit<RoyalRegaliaItem, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<RoyalRegaliaItem> {
  const store = await loadHeraldryStore();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = store.regalia.findIndex((r) => r.id === input.id);
    if (idx >= 0) {
      store.regalia[idx] = { ...store.regalia[idx], ...input, id: input.id, updatedAt: now };
      await saveHeraldryStore(store);
      return store.regalia[idx];
    }
  }
  const created: RoyalRegaliaItem = {
    ...input,
    id: `REGA-${String(store.regalia.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`,
    createdAt: now,
    updatedAt: now
  };
  store.regalia.unshift(created);
  await saveHeraldryStore(store);
  return created;
}

export async function deleteRegaliaItem(id: string): Promise<boolean> {
  const store = await loadHeraldryStore();
  const prev = store.regalia.length;
  store.regalia = store.regalia.filter((r) => r.id !== id);
  if (store.regalia.length === prev) return false;
  await saveHeraldryStore(store);
  return true;
}

export async function listHeraldicMeanings(workspaceId: string): Promise<HeraldicMeaningEntry[]> {
  const store = await loadHeraldryStore();
  return store.meanings.filter((m) => !workspaceId || m.workspaceId === workspaceId || m.workspaceId === "ws-aethelgard");
}

export async function saveHeraldicMeaning(
  input: Omit<HeraldicMeaningEntry, "id" | "createdAt" | "updatedAt"> & { id?: string }
): Promise<HeraldicMeaningEntry> {
  const store = await loadHeraldryStore();
  const now = new Date().toISOString();
  // Enforce provenance rule: entries without sourceCitation cannot be marked verified_source
  const verificationStatus: HeraldicMeaningEntry["verificationStatus"] =
    input.verificationStatus === "verified_source" && !input.sourceCitation.trim()
      ? "unverified_draft"
      : input.verificationStatus;

  if (input.id) {
    const idx = store.meanings.findIndex((m) => m.id === input.id);
    if (idx >= 0) {
      store.meanings[idx] = {
        ...store.meanings[idx],
        ...input,
        verificationStatus,
        id: input.id,
        updatedAt: now
      };
      await saveHeraldryStore(store);
      return store.meanings[idx];
    }
  }
  const created: HeraldicMeaningEntry = {
    ...input,
    verificationStatus,
    id: `HMEAN-${String(store.meanings.length + 1).padStart(6, "0")}`,
    createdAt: now,
    updatedAt: now
  };
  store.meanings.unshift(created);
  await saveHeraldryStore(store);
  return created;
}

export async function deleteHeraldicMeaning(id: string): Promise<boolean> {
  const store = await loadHeraldryStore();
  const prev = store.meanings.length;
  store.meanings = store.meanings.filter((m) => m.id !== id);
  if (store.meanings.length === prev) return false;
  await saveHeraldryStore(store);
  return true;
}

export async function listCustomTemplates(workspaceId: string): Promise<HeraldryCustomTemplate[]> {
  const store = await loadHeraldryStore();
  return store.customTemplates.filter((t) => !workspaceId || t.workspaceId === workspaceId);
}

export async function saveCustomTemplate(
  input: Omit<HeraldryCustomTemplate, "id" | "createdAt">
): Promise<HeraldryCustomTemplate> {
  const store = await loadHeraldryStore();
  const created: HeraldryCustomTemplate = {
    ...input,
    id: `CTPL-${String(store.customTemplates.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`,
    createdAt: new Date().toISOString()
  };
  store.customTemplates.unshift(created);
  await saveHeraldryStore(store);
  return created;
}

export async function deleteCustomTemplate(id: string): Promise<boolean> {
  const store = await loadHeraldryStore();
  const prev = store.customTemplates.length;
  store.customTemplates = store.customTemplates.filter((t) => t.id !== id);
  if (store.customTemplates.length === prev) return false;
  await saveHeraldryStore(store);
  return true;
}

export async function importCustomTemplatePack(
  workspaceId: string,
  templates: Array<Omit<HeraldryCustomTemplate, "id" | "createdAt" | "workspaceId" | "createdBy">>,
  editorName: string
): Promise<{ imported: number }> {
  const store = await loadHeraldryStore();
  let imported = 0;
  for (const tpl of templates.slice(0, 100)) {
    if (!tpl.name?.trim() || !tpl.designData) continue;
    store.customTemplates.unshift({
      ...tpl,
      id: `CTPL-${String(store.customTemplates.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`,
      workspaceId,
      createdBy: editorName,
      createdAt: new Date().toISOString()
    });
    imported++;
  }
  await saveHeraldryStore(store);
  return { imported };
}
