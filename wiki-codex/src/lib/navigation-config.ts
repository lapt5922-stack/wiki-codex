import type { FantasyThemeId } from "@/types/codex";

export type MainSection =
  | "home"
  | "modules"
  | "database"
  | "characters"
  | "kingdoms"
  | "omniverse"
  | "v4studio"
  | "chronicles"
  | "graph"
  | "timeline"
  | "archives"
  | "heraldry"
  | "calendar"
  | "atlas"
  | "loreboard"
  | "conlang"
  | "media"
  | "collections"
  | "health"
  | "trash";

export interface NavItemConfig {
  id: MainSection;
  label: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeKey?: "entries" | "kingdoms360" | "characters" | "events" | "media";
  accent?: string;
}

export interface NavGroupConfig {
  id: string;
  titleVi: string;
  kickerEn: string;
  items: NavItemConfig[];
}

export const CODEX_THEMES: Array<{
  id: FantasyThemeId;
  label: string;
  dot: string;
  mode: "dark" | "light";
}> = [
  { id: "astral-grimoire", label: "Tinh Hà Cổ Thư", dot: "#CDAA6A", mode: "dark" },
  { id: "velvet-eclipse", label: "Huyết Nguyệt Nhung", dot: "#C084FC", mode: "dark" },
  { id: "imperial-amber", label: "Hoàng Hôn Cổ Đô", dot: "#F59E0B", mode: "dark" },
  { id: "sylvan-emerald", label: "Rừng Ngọc Cổ Đại", dot: "#34D399", mode: "dark" },
  { id: "astral-scifi", label: "Tinh Vân Sci-Fi", dot: "#38BDF8", mode: "dark" },
  { id: "jade-ink", label: "Mực Tàu Ngọc Bích", dot: "#2DD4BF", mode: "dark" },
  { id: "gilded-parchment", label: "Giấy Da Hoàng Kim", dot: "#9A6B20", mode: "light" },
  { id: "celestial-ivory", label: "Thiên Cung Bạch Ngọc", dot: "#2563EB", mode: "light" }
];

export const SECTION_TITLES: Record<MainSection, { title: string; group: string }> = {
  home: { title: "Đại Sảnh Tri Thức", group: "Trung tâm" },
  modules: { title: "14 Phân hệ Bách khoa", group: "Bách khoa" },
  database: { title: "Database Studio", group: "Bách khoa" },
  characters: { title: "Character Codex", group: "Bách khoa" },
  kingdoms: { title: "Kingdom Codex (360)", group: "Bách khoa" },
  heraldry: { title: "Royal Heraldry & Flag Studio", group: "Bách khoa" },
  atlas: { title: "Đại Bản Đồ 360 & Atlas", group: "Thế giới & Không gian" },
  v4studio: { title: "Quả Địa Cầu 3D & World Studio", group: "Thế giới & Không gian" },
  timeline: { title: "Biên Niên Sử & Dòng Thời Gian", group: "Thế giới & Không gian" },
  calendar: { title: "Lịch Pháp Đa Trăng", group: "Thế giới & Không gian" },
  graph: { title: "Đồ Thị Tri Thức (Graph Pro)", group: "Kho Lưu Trữ" },
  archives: { title: "Văn Khố & Góc Nhìn Lịch Sử", group: "Kho Lưu Trữ" },
  chronicles: { title: "Đọc Biên Niên Sử Chương Hồi", group: "Kho Lưu Trữ" },
  conlang: { title: "Xưởng Cổ Ngữ (Conlang Studio)", group: "Kho Lưu Trữ" },
  omniverse: { title: "Đa Vũ Trụ & Ma Trận V3", group: "Kho Lưu Trữ" },
  loreboard: { title: "Bảng Ý Tưởng (Loreboard)", group: "Thư Viện Cá Nhân" },
  media: { title: "Media Vault (Kho Hình Ảnh)", group: "Thư Viện Cá Nhân" },
  collections: { title: "Bộ Sưu Tập Tuyển Chọn", group: "Thư Viện Cá Nhân" },
  health: { title: "Sức Khỏe Wiki & Trợ Lý AI", group: "Quản Trị" },
  trash: { title: "Thùng Rác & Khôi Phục", group: "Quản Trị" }
};

export const V9_NAVIGATION_GROUPS: NavGroupConfig[] = [
  {
    id: "sanctum-world",
    titleVi: "Khám Phá Thế Giới",
    kickerEn: "WORLD & ATLAS",
    items: [
      {
        id: "home",
        label: "Đại Sảnh Tri Thức",
        shortLabel: "Đại Sảnh",
        description: "Trung tâm điều hướng, thống kê sống & lối tắt bách khoa",
        iconName: "LayoutDashboard"
      },
      {
        id: "atlas",
        label: "Đại Bản Đồ 360 & Atlas",
        shortLabel: "Bản Đồ",
        description: "360 lãnh thổ Voronoi, ghim tọa độ, tuyến hành trình & khí hậu",
        iconName: "Map"
      },
      {
        id: "v4studio",
        label: "Quả Địa Cầu & World Studio",
        shortLabel: "Địa Cầu 3D",
        description: "Mô phỏng hành tinh 3D, phả hệ, thương phẩm & quy luật tự nhiên",
        iconName: "Globe2"
      },
      {
        id: "timeline",
        label: "Dòng Thời Gian Lịch Sử",
        shortLabel: "Timeline",
        description: "Biên niên sử đa kỷ nguyên & đối chiếu 2 thời đại song song",
        iconName: "Hourglass",
        badgeKey: "events"
      },
      {
        id: "calendar",
        label: "Lịch Pháp Đa Trăng",
        shortLabel: "Lịch Pháp",
        description: "Chu kỳ mặt trăng, tháng năm & đại lễ thế giới",
        iconName: "Calendar"
      }
    ]
  },
  {
    id: "encyclopedia-core",
    titleVi: "Bách Khoa Toàn Thư",
    kickerEn: "ENCYCLOPEDIA",
    items: [
      {
        id: "database",
        label: "Database Studio",
        shortLabel: "Kho Hồ Sơ",
        description: "Kho hồ sơ tổng hợp (Grid / Table / Compact) & thao tác hàng loạt",
        iconName: "Library",
        badgeKey: "entries"
      },
      {
        id: "modules",
        label: "14 Phân Hệ Codex",
        shortLabel: "14 Phân Hệ",
        description: "Cổng truy cập chuyên biệt theo 14 lĩnh vực thế giới quan",
        iconName: "Layers"
      },
      {
        id: "characters",
        label: "Character Codex",
        shortLabel: "Nhân Vật",
        description: "Hồ sơ nhân vật chuyên sâu 17 nhóm dữ liệu & quan hệ 2 chiều",
        iconName: "Users",
        badgeKey: "characters"
      },
      {
        id: "kingdoms",
        label: "Kingdom Codex (360)",
        shortLabel: "Quốc Gia",
        description: "360+ vương quốc, đế chế, 18 nhóm địa chính trị & 14 chỉ số",
        iconName: "Crown",
        badgeKey: "kingdoms360"
      },
      {
        id: "heraldry",
        label: "Royal Heraldry & Flag Studio",
        shortLabel: "Huy Hiệu",
        description: "2.400+ mẫu quốc huy, 450+ mẫu quốc kỳ, bảo vật & từ điển ý nghĩa",
        iconName: "Shield"
      }
    ]
  },
  {
    id: "knowledge-archive",
    titleVi: "Văn Khố & Mạng Lưới",
    kickerEn: "KNOWLEDGE ARCHIVE",
    items: [
      {
        id: "graph",
        label: "Knowledge Graph Pro",
        shortLabel: "Đồ Thị",
        description: "Mạng lưới liên kết đa thực thể, tìm đường ngắn nhất & phát hiện thiếu sót",
        iconName: "Network"
      },
      {
        id: "archives",
        label: "Văn Khố Góc Nhìn Lịch Sử",
        shortLabel: "Văn Khố",
        description: "Chứng cứ gốc DOC-XXXXXX & đối chiếu đa góc nhìn sử học",
        iconName: "Archive"
      },
      {
        id: "chronicles",
        label: "Biên Niên Sử Chương Hồi",
        shortLabel: "Sử Ký",
        description: "Trình đọc sách cổ thư dài kỳ liền mạch",
        iconName: "BookOpen"
      },
      {
        id: "conlang",
        label: "Conlang Studio (Cổ Ngữ)",
        shortLabel: "Cổ Ngữ",
        description: "Bảng chữ cái Runic, ngữ âm & từ điển dịch thuật tự động",
        iconName: "Languages"
      },
      {
        id: "omniverse",
        label: "Omniverse Studio V3",
        shortLabel: "Omniverse",
        description: "Power scaling, bảng thuật ngữ & không gian đa vũ trụ",
        iconName: "Sparkles"
      }
    ]
  },
  {
    id: "personal-library",
    titleVi: "Thư Viện Biên Tập",
    kickerEn: "PERSONAL STUDIO",
    items: [
      {
        id: "media",
        label: "Media Vault",
        shortLabel: "Kho Ảnh",
        description: "Lưu trữ hình ảnh tối ưu hóa & gắn thẻ tư liệu",
        iconName: "Image",
        badgeKey: "media"
      },
      {
        id: "loreboard",
        label: "Loreboard (Bảng Ý Tưởng)",
        shortLabel: "Loreboard",
        description: " Không gian thẻ ghim trực quan kết nối cốt truyện",
        iconName: "FolderKanban"
      },
      {
        id: "collections",
        label: "Bộ Sưu Tập & Nhiệm Vụ",
        shortLabel: "Sưu Tập",
        description: "Tuyển tập chủ đề, lịch sử hoạt động & đơn vị đo lường",
        iconName: "Star"
      }
    ]
  },
  {
    id: "administration",
    titleVi: "Quản Trị & Bảo Toàn",
    kickerEn: "ADMINISTRATION",
    items: [
      {
        id: "health",
        label: "Wiki Health & AI Auditor",
        shortLabel: "Kiểm Toán",
        description: "9 quy tắc sức khỏe dữ liệu, gắn link tự động & đề xuất AI an toàn",
        iconName: "Activity"
      },
      {
        id: "trash",
        label: "Thùng Rác & Khôi Phục",
        shortLabel: "Thùng Rác",
        description: "Khôi phục hồ sơ xóa mềm an toàn không mất dữ liệu",
        iconName: "Trash2"
      }
    ]
  }
];
