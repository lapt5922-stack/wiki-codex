import fs from "fs";
import path from "path";
import crypto from "crypto";
import { matchesVietnameseQuery } from "@/lib/vietnamese";
import { getPostgresPool, isPostgresConfigured } from "./pool";

export type HistoricalDocType =
  | "chronicle"
  | "charter"
  | "decree"
  | "treaty"
  | "letter"
  | "diary"
  | "ancient_map"
  | "manuscript"
  | "report"
  | "archaeology"
  | "historical_work";

export interface HistoricalDocumentRecord {
  id: string;
  workspaceId: string;
  title: string;
  docType: HistoricalDocType;
  author: string;
  createdDateLabel: string;
  originPlace: string;
  language: string;
  content: string;
  preservationStatus: "intact" | "fragmented" | "restored" | "copy_only" | "lost_original";
  archiveLocation: string;
  reliabilityScore: number; // 0-100
  linkedEntityIds: string[];
  attachmentUrl: string;
  createdAt: string;
}

export type PerspectiveKind =
  | "nation_a"
  | "nation_b"
  | "eyewitness"
  | "scholar"
  | "official"
  | "disputed";

export interface EventPerspectiveRecord {
  id: string;
  workspaceId: string;
  eventKey: string;
  eventTitle: string;
  perspectiveKind: PerspectiveKind;
  holderName: string;
  author: string;
  sourceTitle: string;
  summary: string;
  body: string;
  reliability: number; // 0-100
  createdAt: string;
}

interface ArchivesStore {
  documents: HistoricalDocumentRecord[];
  perspectives: EventPerspectiveRecord[];
}

const LOCAL_FILE = path.join(process.cwd(), ".data", "historical-archives.json");
let cached: ArchivesStore | null = null;
let pgInit = false;

function buildDefaultStore(): ArchivesStore {
  const now = new Date().toISOString();
  return {
    documents: [
      {
        id: "DOC-000001",
        workspaceId: "ws-aethelgard",
        title: "Hiệp ước Ánh Dương (Bản gốc Khắc Đá)",
        docType: "treaty",
        author: "Hội đồng Hòa giải Concordia & Hoàng Đế Aurelius Solis III",
        createdDateLabel: "Năm 765 — Kỷ Nguyên Ánh Sao",
        originPlace: "Thủ đô Solis Prime",
        language: "Cổ ngữ Aethel'va & Thông ngữ",
        content:
          "Văn kiện xác lập hành lang thương mại tự do xuyên 8 lục địa, quy định chuẩn quy đổi Đồng Hoàng Kim Aurel (AUR) và cam kết không xâm phạm vùng biển trung lập.",
        preservationStatus: "intact",
        archiveLocation: "Thư viện Hoàng gia Tháp Tinh Tú — Tầng 3",
        reliabilityScore: 98,
        linkedEntityIds: ["KING-000001", "CHAR-000001"],
        attachmentUrl: "",
        createdAt: now
      },
      {
        id: "DOC-000002",
        workspaceId: "ws-aethelgard",
        title: "Nhật ký Hải trình Băng Triều của Lyraen Vaelor",
        docType: "diary",
        author: "Lyraen Vaelor (CHAR-000002)",
        createdDateLabel: "Năm 341 — Kỷ Nguyên Ánh Sao",
        originPlace: "Thương cảng Cực Quang",
        language: "Cổ ngữ Aethel'va",
        content:
          "Ghi chép thực địa về các tuyến hải lưu phương Bắc, cấu trúc ngôn ngữ bản địa và dấu tích thành cổ bị băng hà chôn vùi.",
        preservationStatus: "restored",
        archiveLocation: "Viện Lưu trữ Băng Triều",
        reliabilityScore: 91,
        linkedEntityIds: ["CHAR-000002", "KING-000002"],
        attachmentUrl: "",
        createdAt: now
      }
    ],
    perspectives: [
      {
        id: "PERSP-000001",
        workspaceId: "ws-aethelgard",
        eventKey: "evt-hiep-uoc-anh-duong",
        eventTitle: "Ký kết Hiệp ước Ánh Dương (Năm 765)",
        perspectiveKind: "official",
        holderName: "Triều đình Đế chế Hoàng Kim Solana",
        author: "Viện Sử học Hoàng gia Solana",
        sourceTitle: "Biên niên sử Chính thống Solana, Quyển IV",
        summary: "Khẳng định hiệp ước là thành tựu ngoại giao mở ra kỷ nguyên thịnh vượng chung.",
        body: "Theo ghi chép chính thức tại Solis Prime, Hiệp ước Ánh Dương giúp chấm dứt 40 năm thuế quan chồng chéo, chuẩn hóa tiền tệ Aurel và bảo vệ các thương đoàn nhỏ khỏi hải tặc.",
        reliability: 94,
        createdAt: now
      },
      {
        id: "PERSP-000002",
        workspaceId: "ws-aethelgard",
        eventKey: "evt-hiep-uoc-anh-duong",
        eventTitle: "Ký kết Hiệp ước Ánh Dương (Năm 765)",
        perspectiveKind: "nation_b",
        holderName: "Liên minh Thương cảng Phương Bắc",
        author: "Thương hội Cực Quang",
        sourceTitle: "Thư từ Kháng nghị của Hội đồng Cảng vụ (Năm 766)",
        summary: "Cho rằng tỷ giá quy đổi Aurel tạo lợi thế quá lớn cho ngân khố Solana.",
        body: "Nhiều thương nhân phương Bắc ghi nhận rằng điều khoản định giá khoáng sản theo chuẩn Aurel khiến các thành bang nhỏ phụ thuộc sâu hơn vào tín dụng từ thủ đô phía Nam.",
        reliability: 82,
        createdAt: now
      },
      {
        id: "PERSP-000003",
        workspaceId: "ws-aethelgard",
        eventKey: "evt-hiep-uoc-anh-duong",
        eventTitle: "Ký kết Hiệp ước Ánh Dương (Năm 765)",
        perspectiveKind: "scholar",
        holderName: "Học giả Độc lập Tháp Tinh Tú",
        author: "Hội đồng Nghiên cứu Địa chính trị Aethelgard",
        sourceTitle: "Chuyên khảo Kinh tế Liên lục địa (Năm 795)",
        summary: "Đánh giá cân bằng: hiệp ước thúc đẩy GDP toàn cầu nhưng làm tăng chênh lệch trung tâm–ngoại vi.",
        body: "Số liệu thực nghiệm suốt 30 năm cho thấy kim ngạch thương mại tăng 68%, đồng thời các cảng trung chuyển cần chính sách hỗ trợ hạ tầng riêng để giữ tự chủ tài chính.",
        reliability: 96,
        createdAt: now
      }
    ]
  };
}

async function ensurePg() {
  if (pgInit || !isPostgresConfigured()) return;
  const pool = getPostgresPool();
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS codex_archives_blob (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  pgInit = true;
}

export async function loadArchivesStore(): Promise<ArchivesStore> {
  if (cached) return cached;
  if (isPostgresConfigured()) {
    try {
      await ensurePg();
      const pool = getPostgresPool();
      if (pool) {
        const res = await pool.query(`SELECT payload FROM codex_archives_blob WHERE id = 'primary' LIMIT 1`);
        if (res.rows[0]?.payload) {
          cached = res.rows[0].payload as ArchivesStore;
          return cached;
        }
      }
    } catch {
      // fall through
    }
  }
  if (fs.existsSync(LOCAL_FILE)) {
    try {
      cached = JSON.parse(fs.readFileSync(LOCAL_FILE, "utf8")) as ArchivesStore;
      return cached;
    } catch {
      // fall through
    }
  }
  cached = buildDefaultStore();
  return cached;
}

async function saveArchivesStore(store: ArchivesStore) {
  cached = store;
  if (isPostgresConfigured()) {
    try {
      await ensurePg();
      const pool = getPostgresPool();
      if (pool) {
        await pool.query(
          `INSERT INTO codex_archives_blob (id, payload, updated_at)
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

export async function queryHistoricalDocuments(opts: {
  workspaceId: string;
  q?: string;
  docType?: string;
}) {
  const store = await loadArchivesStore();
  return store.documents.filter((d) => {
    if (opts.workspaceId && d.workspaceId !== opts.workspaceId) return false;
    if (opts.docType && d.docType !== opts.docType) return false;
    if (opts.q && opts.q.trim()) {
      const hay = `${d.id} ${d.title} ${d.author} ${d.originPlace} ${d.language} ${d.content} ${d.linkedEntityIds.join(" ")}`;
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });
}

export async function createHistoricalDocument(
  input: Omit<HistoricalDocumentRecord, "id" | "createdAt">
): Promise<HistoricalDocumentRecord> {
  const store = await loadArchivesStore();
  const id = `DOC-${String(store.documents.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`;
  const rec: HistoricalDocumentRecord = {
    ...input,
    id,
    createdAt: new Date().toISOString()
  };
  store.documents.unshift(rec);
  await saveArchivesStore(store);
  return rec;
}

export async function deleteHistoricalDocument(id: string): Promise<boolean> {
  const store = await loadArchivesStore();
  const before = store.documents.length;
  store.documents = store.documents.filter((d) => d.id !== id);
  if (store.documents.length === before) return false;
  await saveArchivesStore(store);
  return true;
}

export async function queryEventPerspectives(opts: {
  workspaceId: string;
  eventKey?: string;
  q?: string;
}) {
  const store = await loadArchivesStore();
  return store.perspectives.filter((p) => {
    if (opts.workspaceId && p.workspaceId !== opts.workspaceId) return false;
    if (opts.eventKey && p.eventKey !== opts.eventKey) return false;
    if (opts.q && opts.q.trim()) {
      const hay = `${p.eventTitle} ${p.holderName} ${p.author} ${p.sourceTitle} ${p.summary} ${p.body}`;
      if (!matchesVietnameseQuery(hay, opts.q)) return false;
    }
    return true;
  });
}

export async function createEventPerspective(
  input: Omit<EventPerspectiveRecord, "id" | "createdAt">
): Promise<EventPerspectiveRecord> {
  const store = await loadArchivesStore();
  const id = `PERSP-${String(store.perspectives.length + 1).padStart(6, "0")}-${crypto.randomBytes(2).toString("hex")}`;
  const rec: EventPerspectiveRecord = {
    ...input,
    id,
    createdAt: new Date().toISOString()
  };
  store.perspectives.push(rec);
  await saveArchivesStore(store);
  return rec;
}

export async function deleteEventPerspective(id: string): Promise<boolean> {
  const store = await loadArchivesStore();
  const before = store.perspectives.length;
  store.perspectives = store.perspectives.filter((p) => p.id !== id);
  if (store.perspectives.length === before) return false;
  await saveArchivesStore(store);
  return true;
}
