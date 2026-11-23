import type { CanonStatus, EntryCardProjection } from "@/types/codex";

export type CodexModuleId =
  | "world"
  | "kingdom"
  | "character"
  | "organization"
  | "location"
  | "history"
  | "event"
  | "lore"
  | "power"
  | "item"
  | "culture"
  | "religion"
  | "technology"
  | "species";

export interface CodexModuleDefinition {
  id: CodexModuleId;
  idPrefix: string;
  titleEn: string;
  titleVi: string;
  description: string;
  accentColor: string;
  sigil: string;
  /** Target navigation section when opening this module directly */
  targetSection: "v4studio" | "kingdoms" | "characters" | "database" | "timeline" | "conlang" | "omniverse";
  /** Keywords matched against entryTypeId, categoryId, tags, or title for classification */
  matchKeywords: string[];
  /** Suggested entry template markdown when creating a new record in this module */
  starterMarkdown: string;
}

export const CODEX_MODULES: CodexModuleDefinition[] = [
  {
    id: "world",
    idPrefix: "WRLD",
    titleEn: "World Codex",
    titleVi: "Bách khoa Thế giới",
    description: "Vũ trụ quan, hành tinh, lục địa, quy luật tự nhiên và hệ lịch đa trăng.",
    accentColor: "#38bdf8",
    sigil: "🌐",
    targetSection: "v4studio",
    matchKeywords: ["the-gioi", "world", "luc-dia", "hanh-tinh", "vu-tru", "realm"],
    starterMarkdown: "## Tổng quan Thế giới\n\n### Địa lý & Vũ trụ quan\n\n### Quy luật Tự nhiên\n\n### Nguồn tham khảo\n"
  },
  {
    id: "kingdom",
    idPrefix: "KING",
    titleEn: "Kingdom Codex",
    titleVi: "Hồ sơ Vương quốc (360)",
    description: "360+ vương quốc, đế chế, liên bang, thành bang với 18 nhóm địa chính trị & 14 chỉ số độc lập.",
    accentColor: "#f59e0b",
    sigil: "👑",
    targetSection: "kingdoms",
    matchKeywords: ["nation", "vuong-quoc", "quoc-gia", "de-che", "kingdom", "empire"],
    starterMarkdown: "## Tổng quan Quốc gia\n\n### Thể chế & Lãnh thổ\n\n### Kinh tế & Ngoại giao\n"
  },
  {
    id: "character",
    idPrefix: "CHAR",
    titleEn: "Character Codex",
    titleVi: "Hồ sơ Nhân vật",
    description: "Hồ sơ nhân vật chuyên sâu 17 nhóm dữ liệu, quan hệ 2 chiều, tiểu sử và dòng thời gian.",
    accentColor: "#22d3ee",
    sigil: "👤",
    targetSection: "characters",
    matchKeywords: ["nhan-vat", "character", "hoang-de", "anh-hung", "hoc-gia"],
    starterMarkdown: "## Tiểu sử Nhân vật\n\n### Vai trò Lịch sử\n\n### Quan hệ & Di sản\n"
  },
  {
    id: "organization",
    idPrefix: "ORG",
    titleEn: "Organization Codex",
    titleVi: "Tổ chức & Phe phái",
    description: "Giáo hội, học viện, hội đồng, thương hội, gia tộc và các tổ chức bí mật.",
    accentColor: "#a78bfa",
    sigil: "🏛",
    targetSection: "database",
    matchKeywords: ["to-chuc", "phe-phai", "gia-toc", "hoc-vien", "org", "faction", "guild"],
    starterMarkdown: "## Tổng quan Tổ chức\n\n### Cơ cấu Lãnh đạo & Thành viên\n\n### Mục tiêu & Lịch sử Hình thành\n"
  },
  {
    id: "location",
    idPrefix: "LOC",
    titleEn: "Location Codex",
    titleVi: "Địa danh & Lãnh địa",
    description: "Thủ đô, thành phố, pháo đài, kỳ quan, di tích cổ và vùng đất chiến lược.",
    accentColor: "#34d399",
    sigil: "📍",
    targetSection: "database",
    matchKeywords: ["dia-diem", "dia-danh", "do-thi", "thanh-pho", "location", "city", "fortress"],
    starterMarkdown: "## Vị trí & Địa hình\n\n### Kiến trúc & Điểm nổi bật\n\n### Vai trò Chiến lược\n"
  },
  {
    id: "history",
    idPrefix: "HIST",
    titleEn: "History Codex",
    titleVi: "Biên niên sử & Kỷ nguyên",
    description: "Các kỷ nguyên lớn, triều đại, sử biên niên và tiến trình phát triển văn minh.",
    accentColor: "#fbbf24",
    sigil: "📜",
    targetSection: "timeline",
    matchKeywords: ["lich-su", "ky-nguyen", "trieu-dai", "history", "era", "chronicle"],
    starterMarkdown: "## Bối cảnh Kỷ nguyên\n\n### Diễn biến Chính\n\n### Di sản Lịch sử\n"
  },
  {
    id: "event",
    idPrefix: "EVT",
    titleEn: "Event Codex",
    titleVi: "Sự kiện Lịch sử",
    description: "Chiến dịch, hiệp ước, đại biến cố, cải cách và các bước ngoặt địa chính trị.",
    accentColor: "#fb7185",
    sigil: "⏳",
    targetSection: "timeline",
    matchKeywords: ["su-kien", "bien-co", "chien-tranh", "hiep-uoc", "event", "treaty"],
    starterMarkdown: "## Tóm tắt Sự kiện\n\n### Nguyên nhân\n\n### Các bên Liên quan\n\n### Hệ quả Lịch sử\n"
  },
  {
    id: "lore",
    idPrefix: "LORE",
    titleEn: "Lore Codex",
    titleVi: "Tri thức & Truyền thuyết",
    description: "Biên khảo học thuật, truyền thuyết dân gian, thư tịch cổ và bí ẩn thế giới.",
    accentColor: "#e879f9",
    sigil: "📖",
    targetSection: "database",
    matchKeywords: ["lore", "truyen-thuyet", "co-thu", "tri-thuc", "bi-an"],
    starterMarkdown: "## Khái luận Tri thức\n\n### Nội dung Lưu truyền\n\n### Đánh giá Học thuật\n"
  },
  {
    id: "power",
    idPrefix: "PWR",
    titleEn: "Power Codex",
    titleVi: "Hệ thống Năng lực & Ma pháp",
    description: "Phân loại trường phái ma pháp, quy luật năng lượng và hệ quy chiếu học thuật (thuần tra cứu).",
    accentColor: "#60a5fa",
    sigil: "✦",
    targetSection: "omniverse",
    matchKeywords: ["ma-phap", "nang-luc", "he-thong", "power", "magic", "arcane"],
    starterMarkdown: "## Nguyên lý Năng lượng\n\n### Phân loại & Trường phái\n\n### Giới hạn & Hệ quả\n"
  },
  {
    id: "item",
    idPrefix: "ITEM",
    titleEn: "Item & Artifact Codex",
    titleVi: "Cổ vật & Hiện vật",
    description: "Thánh vật, bảo khí, cổ thư, ấn tín hoàng gia và hiện vật khảo cổ.",
    accentColor: "#f97316",
    sigil: "🏺",
    targetSection: "database",
    matchKeywords: ["co-vat", "hien-vat", "trang-bi", "item", "artifact", "relic"],
    starterMarkdown: "## Mô tả Hiện vật\n\n### Nguồn gốc Chế tác\n\n### Lịch sử Lưu giữ\n"
  },
  {
    id: "culture",
    idPrefix: "CUL",
    titleEn: "Culture & Civilization Codex",
    titleVi: "Văn hóa, Ngôn ngữ & Văn minh",
    description: "Ngôn ngữ cổ, bảng chữ cái, phong tục, lễ hội, nghệ thuật và kiến trúc.",
    accentColor: "#2dd4bf",
    sigil: "🎭",
    targetSection: "conlang",
    matchKeywords: ["van-hoa", "ngon-ngu", "conlang", "culture", "civilization", "phong-tuc"],
    starterMarkdown: "## Đặc trưng Văn hóa\n\n### Ngôn ngữ & Chữ viết\n\n### Lễ hội & Phong tục\n"
  },
  {
    id: "religion",
    idPrefix: "REL",
    titleEn: "Religion & Mythology Codex",
    titleVi: "Tôn giáo & Thần thoại",
    description: "Thần điện, giáo lý, kinh điển, nghi lễ và các dòng tư tưởng tâm linh.",
    accentColor: "#c084fc",
    sigil: "🕯",
    targetSection: "database",
    matchKeywords: ["ton-giao", "than-thoai", "tin-nguong", "religion", "myth", "deity"],
    starterMarkdown: "## Giáo lý & Vũ trụ quan\n\n### Hệ thống Thần linh / Biểu tượng\n\n### Nghi lễ & Thánh địa\n"
  },
  {
    id: "technology",
    idPrefix: "TECH",
    titleEn: "Technology Codex",
    titleVi: "Khoa học & Công nghệ",
    description: "Kỹ thuật luyện kim, hàng hải, thiên văn, cơ khí và công nghệ ma-kỹ thuật.",
    accentColor: "#38bdf8",
    sigil: "⚙",
    targetSection: "database",
    matchKeywords: ["cong-nghe", "khoa-hoc", "ky-thuat", "technology", "science", "engineering"],
    starterMarkdown: "## Nguyên lý Kỹ thuật\n\n### Lịch sử Phát minh\n\n### Ứng dụng Đời sống & Kinh tế\n"
  },
  {
    id: "species",
    idPrefix: "RACE",
    titleEn: "Species & Race Codex",
    titleVi: "Chủng tộc & Sinh vật học",
    description: "Phân loại chủng tộc thông minh, sinh học, tuổi thọ, phân bố địa lý và sinh vật kỳ ảo.",
    accentColor: "#4ade80",
    sigil: "🧬",
    targetSection: "database",
    matchKeywords: ["chung-toc", "sinh-vat", "loai", "species", "race", "biology"],
    starterMarkdown: "## Đặc điểm Sinh học\n\n### Phân bố Địa lý\n\n### Văn hóa & Quan hệ Liên chủng tộc\n"
  }
];

export type EditorialVerificationStatus =
  | "canon"
  | "verified"
  | "unverified"
  | "inferred"
  | "original_lore"
  | "draft";

export const EDITORIAL_STATUS_META: Record<
  EditorialVerificationStatus,
  { label: string; shortLabel: string; description: string; badgeClass: string }
> = {
  canon: {
    label: "Canon / Chính thức",
    shortLabel: "Canon",
    description: "Thông tin chính thức đã được xác lập trong nguyên tác thế giới.",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
  },
  verified: {
    label: "Verified / Đã xác minh",
    shortLabel: "Verified",
    description: "Đã đối chiếu nguồn tham khảo và kiểm duyệt tính nhất quán.",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40"
  },
  unverified: {
    label: "Unverified / Chưa xác minh",
    shortLabel: "Unverified",
    description: "Chưa có đủ nguồn xác thực, cần tiếp tục kiểm chứng.",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/40"
  },
  inferred: {
    label: "Inferred / Suy luận",
    shortLabel: "Inferred",
    description: "Suy luận học thuật từ các dữ kiện gián tiếp trong sử liệu.",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40"
  },
  original_lore: {
    label: "Original Lore / Sáng tạo",
    shortLabel: "Original Lore",
    description: "Nội dung worldbuilding sáng tạo gốc thuộc Aethel Codex.",
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/40"
  },
  draft: {
    label: "Draft / Bản nháp",
    shortLabel: "Draft",
    description: "Hồ sơ đang trong quá trình biên soạn, chưa hoàn thiện.",
    badgeClass: "bg-slate-500/20 text-slate-300 border-slate-500/40"
  }
};

/** Backward-compatible normalizer mapping legacy CanonStatus values to the 6 standard Editorial States */
export function normalizeEditorialStatus(
  status?: CanonStatus | string | null
): EditorialVerificationStatus {
  switch (status) {
    case "canon":
      return "canon";
    case "verified":
      return "verified";
    case "inferred":
    case "hypothesis":
      return "inferred";
    case "original_lore":
    case "apocrypha":
      return "original_lore";
    case "draft":
      return "draft";
    default:
      return "unverified";
  }
}

export function classifyEntryModule(entry: EntryCardProjection): CodexModuleId {
  const hay = [
    entry.entryTypeId || "",
    entry.categoryId || "",
    ...(entry.tags || []),
    entry.title || ""
  ]
    .join(" ")
    .toLowerCase();

  for (const mod of CODEX_MODULES) {
    if (mod.matchKeywords.some((kw) => hay.includes(kw))) {
      return mod.id;
    }
  }
  return "lore";
}
