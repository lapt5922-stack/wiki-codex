/**
 * Rich Fantasy & Encyclopedic Icon / Sigil / Gemstone Palette Registry
 */

export interface IconOption {
  id: string;
  label: string;
  group: "VuongTrieu" | "ThienVan" | "TriThuc" | "ThienNhien";
}

export interface SigilOption {
  glyph: string;
  label: string;
  group: "TinhTu" | "CoNgu" | "HoangGia";
}

export interface ColorSwatch {
  hex: string;
  name: string;
}

export const FANTASY_ICONS: IconOption[] = [
  // Vương triều & Kiến trúc
  { id: "Crown", label: "Vương miện", group: "VuongTrieu" },
  { id: "Castle", label: "Thành cổ / Vương quốc", group: "VuongTrieu" },
  { id: "Landmark", label: "Đền đài / Kỳ quan", group: "VuongTrieu" },
  { id: "Shield", label: "Huy hiệu / Gia huy", group: "VuongTrieu" },
  { id: "Flag", label: "Quốc kỳ / Lãnh thổ", group: "VuongTrieu" },
  { id: "Building2", label: "Kinh đô / Đô thị", group: "VuongTrieu" },
  { id: "Users", label: "Dòng tộc / Nhân vật", group: "VuongTrieu" },
  { id: "User", label: "Nhân vật truyền kỳ", group: "VuongTrieu" },
  { id: "Scale", label: "Hiến pháp / Công lý", group: "VuongTrieu" },
  { id: "Award", label: "Tước hiệu / Vinh danh", group: "VuongTrieu" },

  // Thiên văn & Huyền bí
  { id: "Sparkles", label: "Tinh quang / Huyền ảo", group: "ThienVan" },
  { id: "Moon", label: "Nguyệt thực / Mặt trăng", group: "ThienVan" },
  { id: "Sun", label: "Thái dương / Bình minh", group: "ThienVan" },
  { id: "Star", label: "Ngôi sao / Tinh tú", group: "ThienVan" },
  { id: "Compass", label: "La bàn / Thám hiểm", group: "ThienVan" },
  { id: "Eye", label: "Con mắt tri thức", group: "ThienVan" },
  { id: "Hourglass", label: "Đồng hồ cát / Kỷ nguyên", group: "ThienVan" },
  { id: "Key", label: "Chìa khóa bí ẩn", group: "ThienVan" },
  { id: "Gem", label: "Bảo ngọc / Pha lê", group: "ThienVan" },
  { id: "Flame", label: "Ngọn lửa cổ đại", group: "ThienVan" },
  { id: "Feather", label: "Lông vũ / Bút sử", group: "ThienVan" },
  { id: "Orbit", label: "Quỹ đạo / Vũ trụ", group: "ThienVan" },

  // Tri thức & Cổ thư
  { id: "BookOpen", label: "Cổ thư / Bách khoa", group: "TriThuc" },
  { id: "ScrollText", label: "Cuộn giấy biên niên", group: "TriThuc" },
  { id: "Library", label: "Thư viện đại tàng", group: "TriThuc" },
  { id: "Languages", label: "Cổ ngữ / Ngôn ngữ học", group: "TriThuc" },
  { id: "Map", label: "Bản đồ / Atlas", group: "TriThuc" },
  { id: "Globe", label: "Thế giới / Lục địa", group: "TriThuc" },
  { id: "Network", label: "Đồ thị liên kết", group: "TriThuc" },
  { id: "GitBranch", label: "Gia phả / Nhánh lịch sử", group: "TriThuc" },
  { id: "Atom", label: "Khoa học / Nguyên lý", group: "TriThuc" },
  { id: "Cpu", label: "Kiến trúc hệ thống", group: "TriThuc" },
  { id: "Database", label: "Kho dữ liệu", group: "TriThuc" },
  { id: "FileText", label: "Hồ sơ tài liệu", group: "TriThuc" },
  { id: "FolderTree", label: "Danh mục đa cấp", group: "TriThuc" },
  { id: "History", label: "Lịch sử / Dòng thời gian", group: "TriThuc" },

  // Thiên nhiên & Địa lý
  { id: "Mountain", label: "Dãy núi / Cao nguyên", group: "ThienNhien" },
  { id: "Trees", label: "Rừng cổ đại", group: "ThienNhien" },
  { id: "Waves", label: "Đại dương / Sông ngòi", group: "ThienNhien" },
  { id: "Leaf", label: "Thực vật / Hệ sinh thái", group: "ThienNhien" },
  { id: "Snowflake", label: "Vùng băng tuyết", group: "ThienNhien" },
  { id: "Wind", label: "Gió / Khí hậu", group: "ThienNhien" },
  { id: "MapPin", label: "Địa danh / Mốc tọa độ", group: "ThienNhien" }
];

export const ARCANE_SIGILS: SigilOption[] = [
  // Tinh tú & Huyền quang
  { glyph: "✦", label: "Tinh tú bốn cánh", group: "TinhTu" },
  { glyph: "✧", label: "Ánh sao bạc", group: "TinhTu" },
  { glyph: "✶", label: "Sao sáu cánh", group: "TinhTu" },
  { glyph: "✹", label: "Thái dương rực sáng", group: "TinhTu" },
  { glyph: "✵", label: "Tinh hoa tám cánh", group: "TinhTu" },
  { glyph: "❂", label: "Vòng tròn mặt trời", group: "TinhTu" },
  { glyph: "☽", label: "Trăng lưỡi liềm", group: "TinhTu" },
  { glyph: "☾", label: "Nguyệt ảnh", group: "TinhTu" },
  { glyph: "☀", label: "Nhật luân", group: "TinhTu" },
  { glyph: "⚝", label: "Ngôi sao học giả", group: "TinhTu" },

  // Hoàng gia & Biểu trưng
  { glyph: "⚜", label: "Hoa bách hợp vương triều", group: "HoangGia" },
  { glyph: "❖", label: "Kim cương bốn phương", group: "HoangGia" },
  { glyph: "◈", label: "Tinh thể lõi ngọc", group: "HoangGia" },
  { glyph: "⟐", label: "Con mắt kim cương", group: "HoangGia" },
  { glyph: "⛨", label: "Huy chương hộ quốc", group: "HoangGia" },
  { glyph: "⚖", label: "Thiên bình công lý", group: "HoangGia" },
  { glyph: "⧗", label: "Đồng hồ thời gian", group: "HoangGia" },
  { glyph: "⚚", label: "Trượng tri thức", group: "HoangGia" },
  { glyph: "⌘", label: "Ấn ký kinh đô", group: "HoangGia" },
  { glyph: "⬡", label: "Lục giác kết cấu", group: "HoangGia" },

  // Cổ ngữ & Ký tự
  { glyph: "ᛟ", label: "Cổ ngữ Di sản (Othala)", group: "CoNgu" },
  { glyph: "ᛉ", label: "Cổ ngữ Bảo hộ (Algiz)", group: "CoNgu" },
  { glyph: "ᚹ", label: "Cổ ngữ Khải hoàn (Wunjo)", group: "CoNgu" },
  { glyph: "ᛇ", label: "Cổ ngữ Cây Thế giới (Eihwaz)", group: "CoNgu" },
  { glyph: "ᚱ", label: "Cổ ngữ Hành trình (Raido)", group: "CoNgu" },
  { glyph: "ᛏ", label: "Cổ ngữ Minh triết (Tiwaz)", group: "CoNgu" },
  { glyph: "ᚨ", label: "Cổ ngữ Thần ngôn (Ansuz)", group: "CoNgu" },
  { glyph: "☥", label: "Ấn ký Sinh mệnh (Ankh)", group: "CoNgu" },
  { glyph: "∞", label: "Vô cực thời gian", group: "CoNgu" },
  { glyph: "Ω", label: "Omega Tận cùng", group: "CoNgu" },
  { glyph: "Ψ", label: "Psi Tâm trí", group: "CoNgu" },
  { glyph: "Φ", label: "Phi Tỷ lệ vàng", group: "CoNgu" },
  { glyph: "⌬", label: "Cấu trúc tri thức", group: "CoNgu" },
  { glyph: "⏣", label: "Vòng ấn học thuật", group: "CoNgu" }
];

export const GEMSTONE_COLORS: ColorSwatch[] = [
  { hex: "#D4AF37", name: "Vàng Hoàng Kim" },
  { hex: "#60A5FA", name: "Lam Tinh Tú" },
  { hex: "#A78BFA", name: "Tím Huyền Ảnh" },
  { hex: "#34D399", name: "Ngọc Lục Bảo" },
  { hex: "#F472B6", name: "Hồng Thạch Anh" },
  { hex: "#F59E0B", name: "Hổ Phách Cổ" },
  { hex: "#FB7185", name: "Đỏ Chu Sa" },
  { hex: "#38BDF8", name: "Xanh Băng Triều" },
  { hex: "#C084FC", name: "Thạch Anh Tím" },
  { hex: "#94A3B8", name: "Bạc Nguyệt Quang" },
  { hex: "#10B981", name: "Rừng Cổ Đại" },
  { hex: "#EAB308", name: "Đồng Thau Cổ" }
];
