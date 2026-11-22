import type { CodexDatabaseState } from "@/types/codex";
import { hashPassword } from "@/lib/auth";
import { createSixDefaultConlangs } from "@/lib/conlang";
import {
  createCharacterAttributePreset,
  createKingdomAttributePreset
} from "@/lib/v3-engines";
import {
  buildAll360NationEntries,
  buildPlanetaryContinentCategories,
  buildTriBorderAndMajorRelations
} from "@/lib/planetary-atlas/nation-dossiers";

const NOW = "2026-11-22T07:00:00.000Z";

export function createInitialSeedState(): CodexDatabaseState {
  return {
    users: [
      {
        id: "usr-admin",
        email: "admin@codex.local",
        name: "Đại Học Giả (Admin)",
        role: "admin",
        passwordHash: hashPassword("admin123", "aethelgard-admin-salt"),
        createdAt: NOW
      },
      {
        id: "usr-editor",
        email: "editor@codex.local",
        name: "Sử Gia Biên Tập (Editor)",
        role: "editor",
        passwordHash: hashPassword("editor123", "aethelgard-editor-salt"),
        createdAt: NOW
      },
      {
        id: "usr-guest",
        email: "guest@codex.local",
        name: "Độc Giả Công Khai (Guest)",
        role: "guest",
        passwordHash: hashPassword("guest123", "aethelgard-guest-salt"),
        createdAt: NOW
      }
    ],
    workspaces: [
      {
        id: "ws-aethelgard",
        slug: "luc-dia-aethelgard",
        name: "Biên niên sử Lục địa Aethelgard",
        description:
          "Đại bách khoa toàn thư huyền ảo lưu giữ lịch sử các vương quốc, nhân vật truyền kỳ, dòng tộc, học phái, hệ sinh thái tự nhiên và Cổ ngữ Aethel'va (100% thuần tri thức, không yếu tố game).",
        icon: "Sparkles",
        sigil: "✦",
        accentColor: "#D4AF37",
        isPublic: true,
        defaultLanguageId: "lang-aethelva",
        publicTagline: "Đại Tàng Cổ Thư — Lưu giữ ký ức của ngàn năm tinh tú",
        defaultTheme: "astral-grimoire",
        createdAt: NOW,
        updatedAt: NOW
      },
      {
        id: "ws-tech-archive",
        slug: "bach-khoa-kien-truc-tri-thuc",
        name: "Bách khoa Kiến trúc & Tri thức Khoa học",
        description:
          "Kho hồ sơ học thuật chuyên sâu về kiến trúc hệ thống phân tán, cơ sở dữ liệu quy mô lớn, ngôn ngữ học và các nguyên lý tri thức hiện đại.",
        icon: "Library",
        sigil: "❖",
        accentColor: "#60A5FA",
        isPublic: true,
        publicTagline: "Hệ tri thức kỹ thuật chuẩn xác & mở rộng quy mô lớn",
        defaultTheme: "celestial-ivory",
        createdAt: NOW,
        updatedAt: NOW
      }
    ],
    // 24 multi-level categories (Cha -> Con -> Cháu)
    categories: [
      // Group 1: Vương quốc & Chính thể
      { id: "cat-vuong-quoc", workspaceId: "ws-aethelgard", parentId: null, name: "Vương quốc & Chính thể", slug: "vuong-quoc-chinh-the", description: "Các quốc gia, đế chế, liên minh và thể chế lịch sử.", icon: "Castle", sigil: "⚜", color: "#D4AF37", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-phuong-bac", workspaceId: "ws-aethelgard", parentId: "cat-vuong-quoc", name: "Liên bang Phương Bắc", slug: "lien-bang-phuong-bac", description: "Các vùng đất băng giá và hải cảng cổ đại vùng cực Bắc.", icon: "Snowflake", sigil: "✧", color: "#38BDF8", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-bang-trieu-chi", workspaceId: "ws-aethelgard", parentId: "cat-phuong-bac", name: "Hoàng triều Băng Triều", slug: "hoang-trieu-bang-trieu", description: "Tư liệu chuyên sâu về các đời quân chủ và luật cổ Băng Triều.", icon: "Crown", sigil: "❖", color: "#60A5FA", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-cuc-quang", workspaceId: "ws-aethelgard", parentId: "cat-phuong-bac", name: "Thương cảng Cực Quang", slug: "thuong-cang-cuc-quang", description: "Mạng lưới hải cảng tự do phía Đông Bắc.", icon: "Compass", sigil: "✦", color: "#38BDF8", sortOrder: 2, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-phuong-nam", workspaceId: "ws-aethelgard", parentId: "cat-vuong-quoc", name: "Vùng Đất Ánh Dương", slug: "vung-dat-anh-duong", description: "Các đế chế hưng thịnh bên bờ biển Nam và đồng bằng vàng.", icon: "Sun", sigil: "✹", color: "#F59E0B", sortOrder: 2, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-bay-thanh-bang", workspaceId: "ws-aethelgard", parentId: "cat-phuong-nam", name: "Bảy Thành bang Sông Vàng", slug: "bay-thanh-bang-song-vang", description: "Liên minh bảy đô thị cổ tiền thân Đế chế Solaria.", icon: "Building2", sigil: "❂", color: "#EAB308", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-quan-dao-may", workspaceId: "ws-aethelgard", parentId: "cat-vuong-quoc", name: "Quần đảo Mây Trắng", slug: "quan-dao-may-trang", description: "Các cộng hòa hải đảo nổi tiếng về thiên văn hàng hải.", icon: "Waves", sigil: "☽", color: "#94A3B8", sortOrder: 3, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Group 2: Nhân vật & Dòng tộc
      { id: "cat-nhan-vat", workspaceId: "ws-aethelgard", parentId: null, name: "Nhân vật & Dòng tộc", slug: "nhan-vat-dong-toc", description: "Học giả, sử gia, quân chủ, kiến trúc sư và các đại gia tộc.", icon: "Users", sigil: "⚝", color: "#A78BFA", sortOrder: 2, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-hoc-gia", workspaceId: "ws-aethelgard", parentId: "cat-nhan-vat", name: "Học giả & Sử gia", slug: "hoc-gia-su-gia", description: "Những người bảo tồn cổ thư tại Tháp Tinh Tú.", icon: "Feather", sigil: "⚚", color: "#C084FC", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-quan-chu", workspaceId: "ws-aethelgard", parentId: "cat-nhan-vat", name: "Quân chủ & Nhà lập pháp", slug: "quan-chu-nha-lap-phap", description: "Các vị vua hiền minh và nhà cải cách hiến pháp.", icon: "Crown", sigil: "⚜", color: "#D4AF37", sortOrder: 2, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-dong-toc-co", workspaceId: "ws-aethelgard", parentId: "cat-nhan-vat", name: "Đại Gia tộc Cổ đại", slug: "dai-gia-toc-co-dai", description: "Phả hệ và di sản của các dòng họ lớn.", icon: "GitBranch", sigil: "ᛟ", color: "#F472B6", sortOrder: 3, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Group 3: Địa lý & Kỳ quan
      { id: "cat-dia-danh", workspaceId: "ws-aethelgard", parentId: null, name: "Địa lý & Kỳ quan", slug: "dia-ly-ky-quan", description: "Thư viện cổ, rừng nguyên sinh, biển cả và di tích.", icon: "Mountain", sigil: "◈", color: "#34D399", sortOrder: 3, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-dai-thu-vien", workspaceId: "ws-aethelgard", parentId: "cat-dia-danh", name: "Đại Thư viện & Học viện", slug: "dai-thu-vien-hoc-vien", description: "Các trung tâm lưu trữ tri thức trên lục địa.", icon: "Library", sigil: "⌘", color: "#D4AF37", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-rung-co", workspaceId: "ws-aethelgard", parentId: "cat-dia-danh", name: "Rừng Cổ & Hệ sinh thái", slug: "rung-co-he-sinh-thai", description: "Khu bảo tồn thiên nhiên và vùng sinh thái đặc biệt.", icon: "Trees", sigil: "ᛇ", color: "#10B981", sortOrder: 2, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-di-tich", workspaceId: "ws-aethelgard", parentId: "cat-dia-danh", name: "Di tích & Thành cổ", slug: "di-tich-thanh-co", description: "Những phế tích khảo cổ từ thời tiền sử.", icon: "Landmark", sigil: "⟐", color: "#F59E0B", sortOrder: 3, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Group 4: Tổ chức & Học phái
      { id: "cat-to-chuc", workspaceId: "ws-aethelgard", parentId: null, name: "Tổ chức & Học phái", slug: "to-chuc-hoc-phai", description: "Hội đồng học thuật, hiệp hội thương thuyền và viện dịch thuật.", icon: "Shield", sigil: "⛨", color: "#60A5FA", sortOrder: 4, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-hoi-dong-thien-van", workspaceId: "ws-aethelgard", parentId: "cat-to-chuc", name: "Hội đồng Thiên văn", slug: "hoi-dong-thien-van", description: "Tổ chức quan trắc tinh tú và hiệu chỉnh lịch pháp.", icon: "Orbit", sigil: "✶", color: "#818CF8", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Group 5: Văn hóa, Cổ ngữ & Tri thức
      { id: "cat-tri-thuc", workspaceId: "ws-aethelgard", parentId: null, name: "Văn hóa, Cổ ngữ & Tri thức", slug: "van-hoa-co-ngu-tri-thuc", description: "Hệ thống ngôn ngữ, hiệp ước hòa bình và văn hiến cổ đại.", icon: "Languages", sigil: "ᚨ", color: "#F472B6", sortOrder: 5, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-hiep-uoc-luat", workspaceId: "ws-aethelgard", parentId: "cat-tri-thuc", name: "Hiệp ước & Hiến chương", slug: "hiep-uoc-hien-chuong", description: "Các văn kiện ngoại giao và luật quốc tế cổ đại.", icon: "Scale", sigil: "⚖", color: "#D4AF37", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Group 6: Hệ Sinh thái & Khoa học Tự nhiên
      { id: "cat-sinh-hoc", workspaceId: "ws-aethelgard", parentId: null, name: "Tự nhiên & Sinh học", slug: "tu-nhien-sinh-hoc", description: "Thực vật học, sinh vật tự nhiên và khoáng vật lục địa.", icon: "Leaf", sigil: "ᛇ", color: "#34D399", sortOrder: 6, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-thuc-vat", workspaceId: "ws-aethelgard", parentId: "cat-sinh-hoc", name: "Thực vật & Thảo mộc", slug: "thuc-vat-thao-moc", description: "Các loài cây phát quang và dược thảo cổ đại.", icon: "Leaf", sigil: "✧", color: "#10B981", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Group 7: Cổ vật Văn hóa & Tác phẩm
      { id: "cat-co-vat", workspaceId: "ws-aethelgard", parentId: null, name: "Cổ vật Văn hóa & Tác phẩm", slug: "co-vat-van-hoa-tac-pham", description: "Bản thảo cổ thư, công cụ thiên văn và di sản nghệ thuật.", icon: "Gem", sigil: "❖", color: "#FB7185", sortOrder: 7, deletedAt: null, createdAt: NOW, updatedAt: NOW },

      // Workspace 2 Categories
      { id: "cat-tech-arch", workspaceId: "ws-tech-archive", parentId: null, name: "Kiến trúc Hệ thống", slug: "kien-truc-he-thong", description: "Nguyên lý thiết kế phần mềm quy mô lớn và cơ sở dữ liệu.", icon: "Cpu", sigil: "⬡", color: "#60A5FA", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      { id: "cat-tech-db", workspaceId: "ws-tech-archive", parentId: "cat-tech-arch", name: "Cơ sở dữ liệu & Tìm kiếm", slug: "co-so-du-lieu-tim-kiem", description: "Chỉ mục GIN, phân trang Keyset và tối ưu hóa truy vấn.", icon: "Database", sigil: "⌬", color: "#34D399", sortOrder: 1, deletedAt: null, createdAt: NOW, updatedAt: NOW },
      // 9 Planetary Continent Subcategories (360 Nations)
      ...buildPlanetaryContinentCategories("ws-aethelgard", NOW)
    ],
    // 14 Entity-Aware Encyclopedic Types (V5.0 — Distinct fields, tabs & card designs per type)
    entryTypes: [
      {
        id: "type-kingdom",
        workspaceId: "ws-aethelgard",
        name: "Vương quốc / Chính thể",
        slug: "vuong-quoc",
        description: "Hồ sơ địa chính trị, văn hóa, kinh đô, kinh tế và dân cư của một vương quốc.",
        icon: "Castle",
        sigil: "⚜",
        color: "#D4AF37",
        supportsPower: true,
        supportsVariants: true,
        powerPresetKind: "kingdom",
        cardStyle: "kingdom",
        enabledTabs: ["overview", "holdings", "roster", "power", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "capital", label: "Kinh đô", type: "text", showInInfobox: true, placeholder: "Ví dụ: Thành Băng Aurelia" },
          { key: "founded_era", label: "Niên đại thành lập", type: "text", showInInfobox: true, placeholder: "Năm 120 Kỷ Nguyên Ánh Sao" },
          { key: "governance", label: "Thể chế quản trị", type: "select", options: ["Quân chủ lập hiến", "Hội đồng Học giả", "Liên bang Thương cảng", "Đế chế Cổ điển"], showInInfobox: true },
          { key: "ruler", label: "Người đứng đầu / Triều đại", type: "text", showInInfobox: true },
          { key: "population", label: "Dân số ước tính", type: "number", unit: "người", showInInfobox: true },
          { key: "currency", label: "Tiền tệ lưu hành", type: "text", showInInfobox: true },
          { key: "official_languages", label: "Ngôn ngữ chính thức", type: "multiselect", options: ["Cổ ngữ Aethel'va", "Phương ngữ Băng Triều", "Tiếng Solaria", "Ngữ tộc Rừng Ngọc"], showInInfobox: true },
          { key: "provinces_table", label: "Bảng Hành chính & Tỉnh thành", type: "table", columns: ["Tỉnh / Vùng", "Trung tâm", "Đặc trưng văn hóa"] },
          { key: "private_editorial_plan", label: "Ghi chú mạch sử riêng tư", type: "private_note", placeholder: "Chỉ hiển thị với Admin & Biên tập viên..." }
        ]
      },
      {
        id: "type-character",
        workspaceId: "ws-aethelgard",
        name: "Nhân vật Truyền kỳ",
        slug: "nhan-vat",
        description: "Tiểu sử, ngoại hình, tính cách, năng lực, hành trình và di sản của nhân vật.",
        icon: "User",
        sigil: "⚝",
        color: "#A78BFA",
        supportsPower: true,
        supportsVariants: true,
        powerPresetKind: "character",
        cardStyle: "character",
        enabledTabs: ["overview", "power", "holdings", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "title_role", label: "Danh hiệu / Chức vị", type: "text", showInInfobox: true },
          { key: "species_origin", label: "Chủng tộc / Xuất thân", type: "text", showInInfobox: true },
          { key: "gender", label: "Giới tính", type: "select", options: ["Nữ", "Nam", "Phi nhị nguyên", "Chưa rõ"], showInInfobox: true },
          { key: "birth_year", label: "Năm sinh — Năm mất", type: "text", showInInfobox: true },
          { key: "life_status", label: "Trạng thái hiện tại", type: "select", options: ["Còn sống", "Đã qua đời", "Mất tích", "Bất tử / Huyền thoại"], showInInfobox: true },
          { key: "origin_ref", label: "Quê quán / Vương quốc", type: "entity_ref", showInInfobox: true },
          { key: "house_ref", label: "Dòng tộc / Học phái", type: "text", showInInfobox: true },
          { key: "personality", label: "Tính cách cốt lõi", type: "text", showInInfobox: true },
          { key: "signature_gear", label: "Công cụ / Vũ khí tiêu biểu", type: "text", showInInfobox: true },
          { key: "notable_works", label: "Tác phẩm / Di sản tiêu biểu", type: "textarea", showInInfobox: true },
          { key: "private_arc", label: "Bản thảo bí mật (Riêng tư)", type: "private_note" }
        ]
      },
      {
        id: "type-language",
        workspaceId: "ws-aethelgard",
        name: "Ngôn ngữ & Cổ ngữ học",
        slug: "co-ngu-ngon-ngu",
        description: "Hệ thống ngôn ngữ, cổ tự, ngữ pháp, âm vị học và lịch sử giải mã (không có chỉ số sức mạnh).",
        icon: "Languages",
        sigil: "ᚨ",
        color: "#C084FC",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "language",
        enabledTabs: ["overview", "details", "sections", "eras", "relations", "timeline", "sources"],
        fieldSchema: [
          { key: "language_family", label: "Họ ngôn ngữ / Ngữ hệ", type: "text", showInInfobox: true },
          { key: "writing_system", label: "Hệ chữ viết", type: "select", options: ["Chữ Runic khắc đá", "Bảng chữ cái Phiên âm", "Chữ Tượng hình Thiên văn", "Chữ Nét Mực Cổ"], showInInfobox: true },
          { key: "alphabet_size", label: "Số lượng ký tự", type: "number", unit: "ký tự", showInInfobox: true },
          { key: "word_order", label: "Trật tự ngữ pháp", type: "select", options: ["SVO (Chủ-Động-Tân)", "SOV (Chủ-Tân-Động)", "VSO (Động-Chủ-Tân)", "Tự do theo biến cách"], showInInfobox: true },
          { key: "regions_spoken", label: "Vùng sử dụng", type: "text", showInInfobox: true },
          { key: "era_formed", label: "Thời kỳ hình thành", type: "text", showInInfobox: true },
          { key: "vitality", label: "Tình trạng hiện tại", type: "select", options: ["Ngôn ngữ sống phổ biến", "Cổ ngữ học thuật / Nghi lễ", "Đang mai một", "Tử ngữ đã giải mã"], showInInfobox: true },
          { key: "sample_phrase", label: "Câu mẫu kinh điển & Bản dịch", type: "textarea", showInInfobox: true },
          { key: "grammar_table", label: "Bảng Ngữ pháp / Biến cách", type: "table", columns: ["Cách / Thì", "Hậu tố", "Ví dụ & Nghĩa"] }
        ]
      },
      {
        id: "type-city",
        workspaceId: "ws-aethelgard",
        name: "Thành phố & Đô thị",
        slug: "thanh-pho-do-thi",
        description: "Kinh đô, thương cảng, pháo đài đô thị, kiến trúc và đời sống thị dân.",
        icon: "Building2",
        sigil: "❖",
        color: "#38BDF8",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "city",
        enabledTabs: ["overview", "holdings", "roster", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "nation", label: "Quốc gia trực thuộc", type: "entity_ref", showInInfobox: true },
          { key: "city_population", label: "Dân số đô thị", type: "number", unit: "cư dân", showInInfobox: true },
          { key: "governor", label: "Lãnh chúa / Thị trưởng", type: "text", showInInfobox: true },
          { key: "founded_year", label: "Năm lập thành", type: "text", showInInfobox: true },
          { key: "architecture", label: "Phong cách kiến trúc", type: "text", showInInfobox: true },
          { key: "main_economy", label: "Kinh tế mũi nhọn", type: "text", showInInfobox: true },
          { key: "climate", label: "Khí hậu đặc trưng", type: "text", showInInfobox: true },
          { key: "districts_table", label: "Các Quận / Khu phố tiêu biểu", type: "table", columns: ["Khu phố", "Chức năng", "Địa điểm nổi bật"] }
        ]
      },
      {
        id: "type-religion",
        workspaceId: "ws-aethelgard",
        name: "Tôn giáo & Tín ngưỡng",
        slug: "ton-giao-tin-nguong",
        description: "Hệ thần thoại, giáo lý, nghi lễ, thánh địa và ảnh hưởng văn hóa (không có chỉ số sức mạnh).",
        icon: "Sun",
        sigil: "✹",
        color: "#F59E0B",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "religion",
        enabledTabs: ["overview", "details", "sections", "eras", "relations", "timeline", "sources"],
        fieldSchema: [
          { key: "deities", label: "Đấng tối cao / Hệ thần linh", type: "text", showInInfobox: true },
          { key: "founder_prophet", label: "Người khai sáng / Tiên tri", type: "text", showInInfobox: true },
          { key: "holy_site", label: "Thánh địa trung tâm", type: "text", showInInfobox: true },
          { key: "sacred_texts", label: "Kinh điển thiêng liêng", type: "text", showInInfobox: true },
          { key: "core_tenets", label: "Giáo lý cốt lõi", type: "textarea", showInInfobox: true },
          { key: "major_rituals", label: "Nghi lễ & Đại lễ", type: "textarea", showInInfobox: true }
        ]
      },
      {
        id: "type-magic-system",
        workspaceId: "ws-aethelgard",
        name: "Hệ thống Ma pháp / Khoa học",
        slug: "he-thong-quy-luat",
        description: "Quy luật năng lượng, học thuyết vật lý giả tưởng, công nghệ cổ đại và giới hạn vận hành.",
        icon: "Atom",
        sigil: "⬡",
        color: "#2DD4BF",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "system",
        enabledTabs: ["overview", "details", "sections", "relations", "timeline", "sources"],
        fieldSchema: [
          { key: "system_kind", label: "Phân loại hệ thống", type: "select", options: ["Ma pháp Cộng hưởng", "Khoa học Cổ đại", "Thuật Giả kim", "Công nghệ Tinh vân"], showInInfobox: true },
          { key: "energy_source", label: "Nguồn năng lượng gốc", type: "text", showInInfobox: true },
          { key: "catalyst", label: "Công cụ xúc tác", type: "text", showInInfobox: true },
          { key: "laws_limits", label: "Quy luật bảo toàn & Cái giá", type: "textarea", showInInfobox: true },
          { key: "civil_uses", label: "Ứng dụng dân sự & học thuật", type: "textarea", showInInfobox: true }
        ]
      },
      {
        id: "type-house",
        workspaceId: "ws-aethelgard",
        name: "Dòng tộc / Gia tộc",
        slug: "dong-toc",
        description: "Phả hệ, gia huy, khẩu hiệu và lịch sử truyền thừa của một dòng họ.",
        icon: "Users",
        sigil: "ᛟ",
        color: "#F472B6",
        supportsPower: true,
        supportsVariants: false,
        powerPresetKind: "organization",
        cardStyle: "house",
        enabledTabs: ["overview", "holdings", "roster", "power", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "motto", label: "Khẩu hiệu gia tộc", type: "text", showInInfobox: true },
          { key: "founder", label: "Người sáng lập", type: "text", showInInfobox: true },
          { key: "ancestral_seat", label: "Lãnh địa gốc", type: "text", showInInfobox: true },
          { key: "heraldry", label: "Gia huy & Màu sắc", type: "text", showInInfobox: true },
          { key: "lineage_table", label: "Bảng Các Đời Kế Thừa", type: "table", columns: ["Đời", "Người đứng đầu", "Giai đoạn"] }
        ]
      },
      {
        id: "type-landmark",
        workspaceId: "ws-aethelgard",
        name: "Địa danh & Kỳ quan",
        slug: "dia-danh",
        description: "Kiến trúc cổ đại, thư viện, đài thiên văn và kỳ quan thiên nhiên (không có chỉ số sức mạnh).",
        icon: "Landmark",
        sigil: "◈",
        color: "#34D399",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "landmark",
        enabledTabs: ["overview", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "region", label: "Khu vực địa lý", type: "text", showInInfobox: true },
          { key: "architectural_style", label: "Phong cách kiến trúc", type: "text", showInInfobox: true },
          { key: "elevation", label: "Độ cao / Quy mô", type: "number", unit: "mét", showInInfobox: true },
          { key: "built_era", label: "Năm khởi công / Hình thành", type: "text", showInInfobox: true },
          { key: "preservation", label: "Tình trạng bảo tồn", type: "select", options: ["Nguyên vẹn", "Đang trùng tu", "Di tích cổ"], showInInfobox: true }
        ]
      },
      {
        id: "type-organization",
        workspaceId: "ws-aethelgard",
        name: "Tổ chức / Học phái",
        slug: "to-chuc-hoc-phai",
        description: "Hội đồng thiên văn, viện hàn lâm, hiệp hội thương thuyền.",
        icon: "Shield",
        sigil: "⛨",
        color: "#60A5FA",
        supportsPower: true,
        supportsVariants: false,
        powerPresetKind: "organization",
        cardStyle: "organization",
        enabledTabs: ["overview", "holdings", "roster", "power", "details", "sections", "eras", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "headquarters", label: "Trụ sở chính", type: "text", showInInfobox: true },
          { key: "founded", label: "Năm thành lập", type: "text", showInInfobox: true },
          { key: "leader", label: "Người đứng đầu", type: "text", showInInfobox: true },
          { key: "mission", label: "Tôn chỉ hoạt động", type: "textarea", showInInfobox: true },
          { key: "branches_table", label: "Cơ cấu Phân viện", type: "table", columns: ["Phân viện", "Địa điểm", "Chuyên môn"] }
        ]
      },
      {
        id: "type-artifact",
        workspaceId: "ws-aethelgard",
        name: "Cổ vật & Thánh vật",
        slug: "co-vat-tac-pham",
        description: "Bản thảo cổ thư, công cụ thiên văn, bảo vật chế tác và di sản lịch sử.",
        icon: "Gem",
        sigil: "❖",
        color: "#FB7185",
        supportsPower: true,
        supportsVariants: true,
        powerPresetKind: "artifact",
        cardStyle: "artifact",
        enabledTabs: ["overview", "power", "details", "sections", "relations", "timeline", "sources", "gallery"],
        fieldSchema: [
          { key: "creator", label: "Tác giả / Nghệ nhân", type: "text", showInInfobox: true },
          { key: "era_created", label: "Niên đại chế tác", type: "text", showInInfobox: true },
          { key: "material", label: "Chất liệu", type: "text", showInInfobox: true },
          { key: "owner", label: "Chủ sở hữu / Đơn vị bảo quản", type: "text", showInInfobox: true },
          { key: "location", label: "Nơi lưu giữ hiện tại", type: "text", showInInfobox: true },
          { key: "activation_note", label: "Công năng & Điều kiện kích hoạt", type: "textarea", showInInfobox: true }
        ]
      },
      {
        id: "type-flora-fauna",
        workspaceId: "ws-aethelgard",
        name: "Sinh vật & Thực vật học",
        slug: "sinh-vat-thuc-vat",
        description: "Hồ sơ sinh học tự nhiên, sinh vật huyền thoại, môi trường sống và bảo tồn.",
        icon: "Leaf",
        sigil: "ᛇ",
        color: "#10B981",
        supportsPower: true,
        supportsVariants: true,
        powerPresetKind: "creature",
        cardStyle: "creature",
        enabledTabs: ["overview", "power", "details", "sections", "relations", "sources", "gallery"],
        fieldSchema: [
          { key: "scientific_name", label: "Danh pháp Cổ ngữ", type: "text", showInInfobox: true },
          { key: "habitat", label: "Môi trường sống (Biome)", type: "text", showInInfobox: true },
          { key: "avg_size", label: "Kích thước trung bình", type: "text", showInInfobox: true },
          { key: "diet_behavior", label: "Tập tính & Chế độ dinh dưỡng", type: "text", showInInfobox: true },
          { key: "conservation", label: "Tình trạng bảo tồn", type: "select", options: ["Phổ biến", "Quý hiếm", "Cần bảo tồn nghiêm ngặt", "Huyền thoại"], showInInfobox: true }
        ]
      },
      {
        id: "type-event",
        workspaceId: "ws-aethelgard",
        name: "Sự kiện & Biến cố Lịch sử",
        slug: "su-kien-lich-su",
        description: "Biên bản lịch sử, hội nghị ngoại giao, khám phá địa lý lớn (không có chỉ số sức mạnh).",
        icon: "Hourglass",
        sigil: "⧗",
        color: "#F59E0B",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "event",
        enabledTabs: ["overview", "details", "sections", "relations", "timeline", "sources"],
        fieldSchema: [
          { key: "event_date", label: "Thời điểm diễn ra", type: "text", showInInfobox: true },
          { key: "location", label: "Địa điểm", type: "text", showInInfobox: true },
          { key: "participants", label: "Các bên tham gia", type: "text", showInInfobox: true },
          { key: "outcome", label: "Hệ quả lịch sử", type: "textarea", showInInfobox: true }
        ]
      },
      {
        id: "type-lore",
        workspaceId: "ws-aethelgard",
        name: "Văn hiến, Hiệp ước & Triết học",
        slug: "co-ngu-van-hien",
        description: "Hiệp ước lịch sử, hệ thống luật pháp, tư tưởng triết học và tài liệu học thuật (không có chỉ số sức mạnh).",
        icon: "ScrollText",
        sigil: "⚖",
        color: "#E879F9",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "lore",
        enabledTabs: ["overview", "details", "sections", "relations", "timeline", "sources"],
        fieldSchema: [
          { key: "classification", label: "Phân loại học thuật", type: "text", showInInfobox: true },
          { key: "dating", label: "Niên đại văn bản", type: "text", showInInfobox: true },
          { key: "signatories", label: "Tác giả / Các bên ký kết", type: "text", showInInfobox: true },
          { key: "key_clauses", label: "Nội dung / Điều khoản cốt lõi", type: "textarea", showInInfobox: true }
        ]
      },
      {
        id: "type-tech-concept",
        workspaceId: "ws-tech-archive",
        name: "Khái niệm Kỹ thuật",
        slug: "khai-niem-ky-thuat",
        description: "Hồ sơ kỹ thuật chuyên sâu, công thức và tiêu chuẩn kiến trúc (không có chỉ số sức mạnh).",
        icon: "Atom",
        sigil: "⬡",
        color: "#60A5FA",
        supportsPower: false,
        supportsVariants: false,
        cardStyle: "system",
        enabledTabs: ["overview", "details", "sections", "relations", "timeline", "sources"],
        fieldSchema: [
          { key: "domain", label: "Lĩnh vực", type: "text", showInInfobox: true },
          { key: "complexity", label: "Độ phức tạp tiêu chuẩn", type: "text", showInInfobox: true },
          { key: "benchmark_table", label: "Bảng thông số hiệu năng", type: "table", columns: ["Quy mô bản ghi", "Độ trễ trung bình", "Chiến lược chỉ mục"] }
        ]
      }
    ],
    entries: [
      {
        id: "ent-bang-trieu",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-kingdom",
        categoryId: "cat-bang-trieu-chi",
        slug: "vuong-quoc-bang-trieu",
        title: "Vương quốc Băng Triều",
        subtitle: "Valdoria Glacien — Pháo đài Tri thức của Cực Bắc",
        summary:
          "Vương quốc cổ đại ven biển băng phương Bắc, nổi tiếng với kiến trúc kính tinh thể, hải cảng không đóng băng và truyền thống bảo tồn sử liệu.",
        icon: "Castle",
        sigil: "⚜",
        coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        featured: true,
        aliases: ["Valdoria Glacien", "Bắc Hải Quốc", "Liên minh Vịnh Băng"],
        epigraph: {
          quote: "Băng giá có thể phủ kín đại dương, nhưng ánh sáng từ những trang cổ thư sẽ giữ ấm cả một nền văn minh.",
          author: "Hiến chương Aurelia",
          source: "Khắc trên cổng Bắc Hải năm 125"
        },
        roster: [
          { id: "ros-bt-1", name: "Hội Đồng Bảy Học Giả Bắc Hải", roleTitle: "Cơ quan Lập pháp Tối cao", department: "Triều chính", rankOrder: 1, tenure: "Năm 120 – Nay", status: "active", note: "Điều hành quốc chính theo Hiến chương Aurelia." },
          { id: "ros-bt-2", name: "Lyraen Vaelor", entryId: "ent-lyraen", roleTitle: "Cố vấn Sử học & Đặc phái viên", department: "Ngoại giao & Lưu trữ", rankOrder: 2, tenure: "Năm 315 – 374", status: "former", note: "Đại diện ký kết các nghị định thư học thuật." },
          { id: "ros-bt-3", name: "Đô đốc Halvor Skald", roleTitle: "Tổng Chỉ huy Hạm đội Băng Triều", department: "Hải quân", rankOrder: 3, tenure: "Năm 322 – Nay", status: "active", note: "Bảo vệ tuyến hàng hải và vịnh nước ấm Aurelia." }
        ],
        lawsAndCustoms: [
          { id: "law-bt-1", title: "Đạo Luật Bảo Tồn Cổ Thư", category: "law", summary: "Mọi thương thuyền cập cảng Aurelia mang theo bản sao sách quý đều được miễn thuế cảng trong 30 ngày.", enforcement: "Bắt buộc trên toàn lãnh thổ" },
          { id: "law-bt-2", title: "Lễ Thắp Đèn Pha Lê Mùa Cực Quang", category: "custom", summary: "Mỗi đầu Tháng Băng Tâm, mọi gia đình treo đèn thạch anh trước cửa để dẫn đường cho thủy thủ trở về.", enforcement: "Phong tục truyền thống" },
          { id: "law-bt-3", title: "Điều Cấm Kỵ Đốt Phá Thư Viện", category: "taboo", summary: "Hủy hoại sử liệu hoặc bản khắc cổ ngữ bị xem là trọng tội phản bội văn minh.", enforcement: "Trục xuất vĩnh viễn khỏi vương quốc" }
        ],
        forceUnits: [
          { id: "fu-bt-1", name: "Hạm Đội Phá Băng Cực Quang", branch: "Hải quân", sizeLabel: "42 chiến thuyền vỏ đồng · 6.500 thủy thủ", commander: "Đô đốc Halvor Skald", baseLocation: "Kinh đô Aurelia", note: "Chuyên tuần tra vịnh Bắc Hải và hộ tống thương đoàn." },
          { id: "fu-bt-2", name: "Đội Vệ Binh Kính Pha Lê", branch: "Cận vệ", sizeLabel: "1.200 tinh nhuệ", commander: "Đội trưởng Brenna Vaelor", baseLocation: "Đồi Kính Thiên Văn", note: "Bảo vệ xưởng quang học và kho lưu trữ hoàng gia." }
        ],
        resourceItems: [
          { id: "res-bt-1", name: "Thạch Anh Pha Lê Bắc Hải", abundance: "Độc quyền", tradeRole: "Xuất khẩu chủ lực", note: "Nguyên liệu duy nhất trên lục địa chế tác thấu kính thiên văn cấp cao." },
          { id: "res-bt-2", name: "Địa Nhiệt Vịnh Thalassor", abundance: "Dồi dào", tradeRole: "Nội địa", note: "Giữ cảng biển không đóng băng và sưởi ấm các khu phố cổ." },
          { id: "res-bt-3", name: "Ngũ cốc & Gia vị Phương Nam", abundance: "Khan hiếm", tradeRole: "Nhập khẩu", note: "Nhập khẩu ổn định từ Đế chế Solaria theo Hiệp ước Ánh Sao." }
        ],
        rumorsAndSecrets: [
          { id: "rum-bt-1", title: "Mạch Nước Nóng Ngầm Là Công Trình Cổ Đại", tier: "rumor", truthPercent: 65, content: "Các thợ lặn ở cảng Aurelia đồn rằng dưới đáy vịnh có những cột đá khắc cổ ngữ phát nhiệt từ trước khi vương quốc ra đời.", sourceLabel: "Lời truyền miệng của thủy thủ Bắc Hải" },
          { id: "rum-bt-2", title: "Kho Lưu Trữ Tầng Ngầm Số 0", tier: "secret", truthPercent: 100, content: "Bên dưới Đồi Kính Thiên Văn có một hầm băng lưu giữ 12 phiến đá ghi chép về nền văn minh trước Kỷ Nguyên Ánh Sao.", sourceLabel: "Hồ sơ mật của Hội Đồng Bảy Học Giả", gmOnly: true }
        ],
        customSections: [
          {
            id: "sec-bt-1",
            title: "Kiến trúc Kính Tinh Thể & Địa Nhiệt",
            sigil: "◈",
            content: "Các công trình tại kinh đô Aurelia sử dụng tường đá hoa cương dẫn ống nước ấm từ mạch suối địa nhiệt sâu 400m, kết hợp mái vòm kính pha lê đón tối đa ánh sáng cực quang mùa đông."
          },
          {
            id: "sec-bt-2",
            title: "Lễ hội Đêm Đông Chí & Văn hóa Đọc",
            sigil: "✦",
            content: "Mỗi dịp Đông Chí, toàn bộ thư viện công cộng tại Băng Triều mở cửa suốt bảy đêm liền, tổ chức các buổi đọc sử thi và trao đổi bản chép tay giữa học giả các miền."
          }
        ],
        eraSnapshots: [
          {
            id: "era-bt-1",
            eraLabel: "Thời Sơ Khai Khai Phá",
            yearLabel: "Năm 120 – 210",
            summary: "Giai đoạn định cư quanh vịnh nước ấm Bắc Hải và hình thành các xưởng đóng tàu thám hiểm đầu tiên.",
            keyChanges: "Dân số ~380.000 người · Thể chế Hội đồng Thị trưởng"
          },
          {
            id: "era-bt-2",
            eraLabel: "Thời Thịnh Trị Minh Triết",
            yearLabel: "Năm 305 – 420",
            summary: "Sau Hiệp ước Ánh Sao, Băng Triều trở thành trung tâm chế tác thấu kính thiên văn và thư viện lớn nhất phương Bắc.",
            keyChanges: "Dân số ~2.450.000 người · Quân chủ lập hiến · Bảo trợ Tháp Tinh Tú"
          }
        ],
        breakdownBars: [
          { id: "bar-1", groupTitle: "Cơ cấu Ngôn ngữ Sử dụng", label: "Phương ngữ Băng Triều", percentage: 58, color: "#38BDF8" },
          { id: "bar-2", groupTitle: "Cơ cấu Ngôn ngữ Sử dụng", label: "Cổ ngữ Aethel'va", percentage: 29, color: "#D4AF37" },
          { id: "bar-3", groupTitle: "Cơ cấu Ngôn ngữ Sử dụng", label: "Tiếng Solaria & Khác", percentage: 13, color: "#A78BFA" }
        ],
        powerLevel: 485000,
        powerSourceLabel: "Quốc lực Hàng hải, Địa nhiệt & Tri thức Thiên văn",
        attributes: createKingdomAttributePreset(),
        powerHistory: [
          { id: "ph-bt-1", eraLabel: "Khai phá Bắc Hải", yearLabel: "Năm 120", powerLevel: 45000 },
          { id: "ph-bt-2", eraLabel: "Hiệp ước Ánh Sao", yearLabel: "Năm 305", powerLevel: 260000 },
          { id: "ph-bt-3", eraLabel: "Thịnh trị Minh Triết", yearLabel: "Năm 350", powerLevel: 485000 }
        ],
        abilities: [
          { id: "ab-bt-1", name: "Mạng lưới Địa nhiệt Aurelia", category: "Kỹ thuật", rank: "Kỳ quan", sigil: "◈", description: "Giữ ấm toàn bộ kinh đô và giữ hải cảng không đóng băng quanh năm." },
          { id: "ab-bt-2", name: "Chế tác Thấu kính Tinh thể", category: "Học thuật", rank: "Độc bản", sigil: "✦", description: "Đúc thấu kính pha lê độ chính xác cao cung cấp cho Tháp Tinh Tú." }
        ],
        feats: [
          { id: "ft-bt-1", title: "Đồng ký kết Hiệp ước Ánh Sao", yearLabel: "Năm 305", description: "Thiết lập kỷ nguyên hòa bình và tự do nghiên cứu liên lục địa." }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["vương quốc", "phương bắc", "kiến trúc", "kỷ nguyên ánh sao"],
        contentMarkdown: `## Tổng quan Địa lý & Lịch sử

**Vương quốc Băng Triều** (*Valdoria Glacien* trong [[Cổ ngữ Aethel'va]]) được thành lập bên vịnh nước ấm Bắc Hải vào năm 120 Kỷ Nguyên Ánh Sao. Nhờ mạng lưới suối địa nhiệt tự nhiên dưới lòng đá hoa cương, kinh đô Aurelia trở thành trung tâm giao thương và nghiên cứu thiên văn hàng đầu lục địa.

:::conlang
Dưới ánh sáng tinh tú phương Bắc, tri thức là ngọn lửa vĩnh cửu của vương quốc.
:::

:::callout Ghi chú Địa lý Học thuật
Hải cảng Aurelia là một trong hai thương cảng duy nhất ở vĩ độ cực Bắc không bao giờ bị đóng băng hoàn toàn vào mùa đông nhờ dòng hải lưu ấm Thalassor.
:::

## Quan hệ Ngoại giao & Văn hóa

Trong suốt ba thế kỷ, Băng Triều duy trì mối liên kết học thuật chặt chẽ với [[Đế chế Hoàng Kim Solaria]] và bảo trợ trực tiếp cho việc xây dựng [[Tháp Tinh Tú Orakel'on]]. Nữ sử gia [[Lyraen Vaelor]] thuộc [[Gia tộc Vaelor]] từng dành hai mươi năm tại đây để biên soạn bộ đại sử bảy tập.

Theo các cuộn giấy mới khai quật, các nhà hàng hải Băng Triều từng vẽ hải đồ dẫn tới [[Thành cổ Mất tích]] ở ngoài khơi biển sương mù.

:::spoiler Ghi chú khảo cổ về Hầm Lưu Trữ Sâu
Tầng hầm thứ tư dưới kinh đô Aurelia lưu giữ bản gốc bằng đồng của [[Hiệp ước Ánh Sao]] cùng các bản vẽ thiên văn cổ chưa từng công bố rộng rãi.
:::`,
        customFields: {
          capital: "Kinh đô Aurelia",
          founded_era: "Năm 120 — Kỷ Nguyên Ánh Sao",
          governance: "Quân chủ lập hiến",
          population: 2450000,
          official_languages: ["Cổ ngữ Aethel'va", "Phương ngữ Băng Triều"],
          provinces_table: {
            headers: ["Tỉnh / Vùng", "Trung tâm", "Đặc trưng văn hóa"],
            rows: [
              ["Vịnh Aurelia", "Thành Aurelia", "Thủ phủ hành chính & xưởng kính thiên văn"],
              ["Cao nguyên Sương Trắng", "Pháo đài Solis", "Khai khoáng thạch anh & đài quan sát"],
              ["Bờ Biển Nam Cảng", "Hải cảng Thalass", "Đóng tàu thám hiểm & thư viện hàng hải"]
            ]
          },
          private_editorial_plan: "Ghi chú nội bộ: Cần bổ sung thêm sơ đồ gia phả đời vua thứ 4 vào chương III."
        },
        sourcesMarkdown: `- *Biên niên sử Bắc Hải*, Tập II — Lưu trữ tại Tháp Tinh Tú Orakel'on.\n- *Hải đồ Kỷ Nguyên Ánh Sao*, bản khắc năm 412.`,
        privateNotes: "Ghi chú riêng tư của biên tập viên: Sắp tới sẽ tách mục 'Luật Hàng Hải Băng Triều' thành hồ sơ độc lập.",
        gallery: [
          {
            id: "gal-1",
            thumbUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=70",
            fullUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85",
            caption: "Toàn cảnh vùng vịnh phương Bắc trong mùa cực quang",
            alt: "Vịnh phương Bắc"
          },
          {
            id: "gal-2",
            thumbUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=480&q=70",
            fullUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85",
            caption: "Đại sảnh lưu trữ cổ thư tại kinh đô Aurelia",
            alt: "Thư viện cổ"
          }
        ],
        editorialNotes: [
          {
            id: "ed-1",
            authorName: "Đại Học Giả (Admin)",
            authorRole: "admin",
            content: "Đã kiểm chứng niên đại thành lập khớp với sự kiện Dòng thời gian năm 120.",
            createdAt: NOW
          }
        ],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-solaria",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-kingdom",
        categoryId: "cat-phuong-nam",
        slug: "de-che-hoang-kim-solaria",
        title: "Đế chế Hoàng Kim Solaria",
        subtitle: "Imperion Solarius — Cái nôi của Nghệ thuật và Luật pháp Phương Nam",
        summary: "Đế chế rộng lớn trải dài khắp đồng bằng ánh dương phương Nam, nơi khai sinh lịch pháp mặt trời và hệ thống đại học mở đầu tiên.",
        icon: "Sun",
        sigil: "✹",
        coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Imperion Solarius", "Liên minh Sông Vàng"],
        epigraph: {
          quote: "Luật pháp công minh tựa ánh dương: soi sáng đồng đều mọi mái nhà không phân biệt giàu nghèo.",
          author: "Bộ Luật Bảy Thành Bang",
          source: "Chương I, Điều 1"
        },
        customSections: [
          {
            id: "sec-sol-1",
            title: "Hệ thống Cầu Dẫn Nước & Quy hoạch Đô thị",
            sigil: "❂",
            content: "Mạng lưới hơn 300km cầu dẫn nước đá vôi đưa nước ngọt từ dãy núi Nam Sơn về tưới tiêu cho đồng bằng Solaria."
          }
        ],
        eraSnapshots: [],
        breakdownBars: [
          { id: "bar-s1", groupTitle: "Cơ cấu Kinh tế — Văn hóa", label: "Nông nghiệp & Thủy lợi", percentage: 45, color: "#F59E0B" },
          { id: "bar-s2", groupTitle: "Cơ cấu Kinh tế — Văn hóa", label: "Thương mại Đường biển", percentage: 35, color: "#D4AF37" },
          { id: "bar-s3", groupTitle: "Cơ cấu Kinh tế — Văn hóa", label: "Học thuật & Thủ công mỹ nghệ", percentage: 20, color: "#34D399" }
        ],
        powerLevel: 1250000,
        powerSourceLabel: "Quy mô Đế chế, Thương lộ Sông Vàng & Học viện Mở",
        attributes: createKingdomAttributePreset().map((a, i) => ({
          ...a,
          id: `attr-sol-${i}`,
          value: Math.round(a.value * 1.35),
          sliderMax: 15000
        })),
        abilities: [
          { id: "ab-sol-1", name: "Hệ thống Cầu Dẫn Nước 300km", category: "Kiến trúc", rank: "Kỳ quan", sigil: "✹", description: "Cung cấp nước ngọt ổn định cho toàn bộ bảy thành bang phương Nam." }
        ],
        feats: [
          { id: "ft-sol-1", title: "Ban hành Lịch pháp Mặt Trời", yearLabel: "Năm 45", description: "Chuẩn hóa đo đạc thời gian trên toàn miền Nam." }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["đế chế", "phương nam", "lịch pháp", "văn hóa"],
        contentMarkdown: `## Khởi nguyên & Thịnh trị

**Đế chế Hoàng Kim Solaria** hình thành từ liên minh bảy thành bang dọc lưu vực sông Vàng. Thay vì mở rộng bằng xung đột, Solaria nổi danh nhờ mạng lưới thương lộ, cầu dẫn nước đá vôi và các viện hàn lâm nghệ thuật.

## Giao lưu với Lục địa

Solaria cùng [[Vương quốc Băng Triều]] ký kết [[Hiệp ước Ánh Sao]] năm 305, mở ra kỷ nguyên trao đổi tự do học giả giữa hai miền Nam – Bắc. Các kiến trúc sư Solaria cũng góp công dựng mái vòm đồng cho [[Tháp Tinh Tú Orakel'on]].`,
        customFields: {
          capital: "Thành Thái Dương Solis-Prima",
          founded_era: "Năm 45 — Kỷ Nguyên Ánh Sao",
          governance: "Đế chế Cổ điển",
          population: 6800000,
          official_languages: ["Tiếng Solaria", "Cổ ngữ Aethel'va"]
        },
        sourcesMarkdown: `- *Biên niên sử Sông Vàng*, bản dịch tiếng Việt hiện đại.`,
        privateNotes: "Cần bổ sung danh sách 7 thành bang sáng lập.",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Sử Gia Biên Tập (Editor)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-lyraen",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-character",
        categoryId: "cat-hoc-gia",
        slug: "lyraen-vaelor",
        title: "Lyraen Vaelor",
        subtitle: "Đại Sử Gia của Tháp Tinh Tú — Tác giả Bộ Bách Khoa Aethelgard",
        summary: "Nhà ngôn ngữ học và sử gia kiệt xuất thế kỷ IV, người chuẩn hóa hệ thống phiên âm Cổ ngữ Aethel'va và lập bản đồ tri thức liên lục địa.",
        icon: "Feather",
        sigil: "⚝",
        coverImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Nữ Sử Gia Ánh Sao", "Lumenor Lyraen"],
        epigraph: {
          quote: "Một dân tộc chỉ thực sự trường tồn khi biết lắng nghe tiếng nói của quá khứ qua từng dòng chữ cổ.",
          author: "Lyraen Vaelor",
          source: "Lời tựa Đại Bách Khoa Aethelgard, Tập I"
        },
        powerLevel: 18500,
        powerSourceLabel: "Minh triết Cổ ngữ, Trí nhớ Bách khoa & Tầm ảnh hưởng Học thuật",
        attributes: createCharacterAttributePreset(),
        powerHistory: [
          { id: "ph-ly-1", eraLabel: "Học giả trẻ tại Aurelia", yearLabel: "Năm 308", powerLevel: 1200 },
          { id: "ph-ly-2", eraLabel: "Khảo sát Rừng Ngọc Sylvaris", yearLabel: "Năm 325", powerLevel: 8500 },
          { id: "ph-ly-3", eraLabel: "Viện trưởng Tháp Tinh Tú", yearLabel: "Năm 350", powerLevel: 18500 }
        ],
        abilities: [
          { id: "ab-ly-1", name: "Thông Thạo Sáu Bộ Cổ Ngữ", category: "Ngôn ngữ học", rank: "Đại sư", sigil: "ᚨ", description: "Đọc hiểu và đối chiếu trực tiếp toàn bộ bia đá cổ trên lục địa Aethelgard." },
          { id: "ab-ly-2", name: "Phương pháp Liên kết Chéo Tri thức", category: "Học thuật", rank: "Sáng lập", sigil: "✦", description: "Khai sinh mô hình trích dẫn hai chiều cho kho lưu trữ bốn trăm nghìn cuộn sách." }
        ],
        feats: [
          { id: "ft-ly-1", title: "Hoàn thành Bộ Đại Bách Khoa 7 Tập", yearLabel: "Năm 330", description: "Công trình chuẩn mực nhất về lịch sử và ngôn ngữ học Aethelgard." }
        ],
        variants: [
          {
            id: "var-ly-default",
            name: "Viện Trưởng Lưu Trữ (Thời Kỳ Đỉnh Cao)",
            badge: "Chính Sử",
            eraLabel: "Năm 350",
            avatarUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=480&q=70",
            summary: "Giai đoạn Lyraen điều hành Tháp Tinh Tú Orakel'on và chuẩn hóa 6 bộ cổ ngữ lục địa.",
            powerLevel: 18500,
            attributes: createCharacterAttributePreset(),
            isDefault: true
          },
          {
            id: "var-ly-arch",
            name: "Chưởng Ấn Kỷ Nguyên (Thức Tỉnh Cổ Ngữ)",
            badge: "Huyền Sử / Biến Thể",
            eraLabel: "Năm 372 — Đêm Nhật Thực",
            avatarUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=480&q=70",
            summary: "Trạng thái cộng hưởng toàn bộ 400.000 cuộn cổ thư tại tầng 9 Tháp Tinh Tú để bảo vệ ký ức lục địa.",
            powerLevel: 950000,
            attributes: [
              { id: "a-str", key: "str", label: "Thể lực / Chiến lực", value: 4200, sliderMax: 10000, color: "#F87171", sigil: "⚔" },
              { id: "a-int", key: "int", label: "Trí tuệ & Học thuật", value: 980000, sliderMax: 1000000, color: "#60A5FA", sigil: "✦" },
              { id: "a-mag", key: "mag", label: "Cộng hưởng Cổ ngữ", value: 1200000, sliderMax: 1500000, color: "#C084FC", sigil: "ᚨ" },
              { id: "a-spd", key: "spd", label: "Tốc độ Tư duy", value: 250000, sliderMax: 500000, color: "#34D399", sigil: "✧" },
              { id: "a-cha", key: "cha", label: "Uy tín Lục địa", value: 850000, sliderMax: 1000000, color: "#FBBF24", sigil: "⚜" }
            ]
          }
        ],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["nhân vật", "sử gia", "ngôn ngữ học", "tháp tinh tú"],
        contentMarkdown: `## Tiểu sử & Sự nghiệp Học thuật

**Lyraen Vaelor** sinh ra tại vùng duyên hải [[Vương quốc Băng Triều]] trong [[Gia tộc Vaelor]], nhưng dành phần lớn cuộc đời nghiên cứu tại [[Tháp Tinh Tú Orakel'on]]. Bà là người đầu tiên áp dụng phương pháp trích dẫn chéo (cross-referencing) khi biên soạn lịch sử các triều đại.

## Đóng góp cho Cổ ngữ học

Bằng việc đối chiếu các bia đá ở [[Rừng Ngọc Sylvaris]] và tài liệu ngoại giao của [[Đế chế Hoàng Kim Solaria]], Lyraen đã hoàn thiện bộ từ điển chuẩn cho [[Cổ ngữ Aethel'va]], giúp thế hệ sau đọc hiểu toàn bộ văn hiến cổ đại.`,
        customFields: {
          title_role: "Đại Sử Gia & Viện trưởng Lưu trữ",
          birth_year: "Năm 288 — Năm 374 (Kỷ Nguyên Ánh Sao)",
          origin_ref: "Vương quốc Băng Triều",
          house_ref: "Gia tộc Vaelor",
          notable_works: "Đại Bách Khoa Aethelgard (7 tập); Từ điển Chuẩn Cổ ngữ Aethel'va"
        },
        sourcesMarkdown: `- *Hồi ký Tháp Tinh Tú*, mục ghi năm 375.`,
        privateNotes: "Nhân vật trung tâm nối kết 3 nhánh lịch sử chính.",
        gallery: [],
        editorialNotes: [],
        createdBy: "Sử Gia Biên Tập (Editor)",
        updatedBy: "Sử Gia Biên Tập (Editor)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-gia-toc-vaelor",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-house",
        categoryId: "cat-dong-toc-co",
        slug: "gia-toc-vaelor",
        title: "Gia tộc Vaelor",
        subtitle: "Dòng tộc Bảo thủ Cổ thư và Thiên văn Hàng hải Phương Bắc",
        summary: "Một trong những đại gia tộc học thuật lâu đời nhất của Vương quốc Băng Triều, nổi tiếng với truyền thống đào tạo sử gia và nhà vẽ hải đồ.",
        icon: "Users",
        sigil: "ᛟ",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Nhà Vaelor", "Othalir Vaelor"],
        epigraph: {
          quote: "Ghi chép trung thực, giữ gìn trọn vẹn.",
          author: "Gia huấn Vaelor"
        },
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["dòng tộc", "phương bắc", "học thuật"],
        contentMarkdown: `## Nguồn gốc & Vai trò Lịch sử

**Gia tộc Vaelor** khởi nguồn từ những nhà vẽ hải đồ đầu tiên cập bến vịnh Aurelia của [[Vương quốc Băng Triều]]. Thành viên kiệt xuất nhất của gia tộc là nữ sử gia [[Lyraen Vaelor]], người đã biên soạn bộ đại bách khoa cho toàn lục địa.`,
        customFields: {
          motto: "Ghi chép trung thực, giữ gìn trọn vẹn",
          founder: "Thuyền trưởng Arion Vaelor",
          ancestral_seat: "Đồi Kính Thiên Văn — Aurelia",
          lineage_table: {
            headers: ["Đời", "Người đứng đầu", "Giai đoạn"],
            rows: [
              ["Đời I", "Arion Vaelor", "Năm 120 – 175"],
              ["Đời IV", "Seren Vaelor", "Năm 240 – 295"],
              ["Đời V", "Lyraen Vaelor", "Năm 295 – 374"]
            ]
          }
        },
        sourcesMarkdown: `- *Gia phả Vịnh Bắc Hải*, quyển I.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-orakel",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-landmark",
        categoryId: "cat-dai-thu-vien",
        slug: "thap-tinh-tu-orakel-on",
        title: "Tháp Tinh Tú Orakel'on",
        subtitle: "Đại Thư viện & Đài Thiên văn Trung tâm Lục địa",
        summary: "Công trình kiến trúc chín tầng bằng đá trắng và kính pha lê nằm ở giao điểm ba miền, lưu giữ hơn bốn trăm nghìn cuộn cổ thư và bản đồ sao.",
        icon: "Landmark",
        sigil: "◈",
        coverImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Đại Tháp Orakel", "Orakel'on"],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["địa danh", "thư viện", "thiên văn", "kỳ quan"],
        contentMarkdown: `## Kiến trúc & Chức năng

**Tháp Tinh Tú Orakel'on** tọa lạc trên đỉnh đồi Trung Tâm, là trung lập địa được công nhận bởi [[Hiệp ước Ánh Sao]] và là trụ sở của [[Hội đồng Thiên văn Aethelgard]]. Tòa tháp kết hợp giữa đại thư viện lưu trữ mở và đài quan sát thiên văn với hệ thống thấu kính do nghệ nhân [[Vương quốc Băng Triều]] chế tác.

## Kho Tàng Cổ Thư

Dưới sự điều hành của [[Lyraen Vaelor]], hệ thống phân loại danh mục đa cấp đầu tiên của lục địa đã ra đời tại đây, giúp tra cứu hàng chục nghìn hồ sơ chỉ trong vài khoảnh khắc.`,
        customFields: {
          region: "Cao nguyên Trung Tâm Aethelgard",
          architectural_style: "Tân Tinh Tú — Đá cẩm thạch & Mái vòm đồng",
          elevation: 1840,
          preservation: "Nguyên vẹn"
        },
        sourcesMarkdown: `- *Kiến trúc Kỳ quan Aethelgard*, Chương 1.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-hoi-dong-thien-van",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-organization",
        categoryId: "cat-hoi-dong-thien-van",
        slug: "hoi-dong-thien-van-aethelgard",
        title: "Hội đồng Thiên văn Aethelgard",
        subtitle: "Tổ chức Học thuật Liên miền hiệu chỉnh Lịch pháp & Bản đồ Sao",
        summary: "Hội đồng quy tụ các nhà thiên văn từ cả Bắc lẫn Nam, chịu trách nhiệm ban hành Lịch Tinh Tú và bảo quản Thiên cầu Kính Pha Lê.",
        icon: "Orbit",
        sigil: "✶",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Học phái Tinh Tú", "Astrelis Concilium"],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["tổ chức", "thiên văn", "lịch pháp"],
        contentMarkdown: `## Sứ mệnh Học thuật

Đặt trụ sở chính tại tầng chín [[Tháp Tinh Tú Orakel'on]], **Hội đồng Thiên văn Aethelgard** điều hành mạng lưới 12 đài quan sát trên khắp lục địa, duy trì sự thống nhất của lịch pháp liên quốc gia và bảo quản [[Thiên cầu Pha Lê Aurelia]].`,
        customFields: {
          headquarters: "Tháp Tinh Tú Orakel'on",
          founded: "Năm 306 — Kỷ Nguyên Ánh Sao",
          mission: "Quan trắc chu kỳ thiên thể, hiệu chỉnh lịch pháp và phổ biến tri thức thiên văn mở."
        },
        sourcesMarkdown: `- *Điều lệ Hội đồng Thiên văn*, bản năm 306.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-thien-cau-pha-le",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-artifact",
        categoryId: "cat-co-vat",
        slug: "thien-cau-pha-le-aurelia",
        title: "Thiên cầu Pha Lê Aurelia",
        subtitle: "Cổ vật Thiên văn Cơ khí bằng Đồng thau và Thạch anh Nguyên khối",
        summary: "Mô hình bầu trời cơ khí chính xác cao được chế tác năm 308 để kỷ niệm Hiệp ước Ánh Sao, có khả năng mô phỏng chu kỳ mặt trăng suốt 100 năm.",
        icon: "Gem",
        sigil: "❖",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Quả cầu Tinh Tú", "Astrolabium Aurelia"],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["cổ vật", "thiên văn", "kiệt tác"],
        contentMarkdown: `## Mô tả Chế tác

**Thiên cầu Pha Lê Aurelia** là kiệt tác hợp tác giữa nghệ nhân kính [[Vương quốc Băng Triều]] và thợ đúc đồng [[Đế chế Hoàng Kim Solaria]]. Hiện cổ vật được trưng bày trang trọng tại đại sảnh [[Tháp Tinh Tú Orakel'on]].`,
        customFields: {
          creator: "Nghệ nhân Kaelen & Xưởng Kính Aurelia",
          era_created: "Năm 308 Kỷ Nguyên Ánh Sao",
          material: "Đồng thau cổ, Thạch anh Bắc Hải, Bạc chạm khắc",
          location: "Tầng 9 — Tháp Tinh Tú Orakel'on"
        },
        sourcesMarkdown: `- *Danh mục Bảo vật Lưu trữ Orakel'on*.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-aethelva",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-language",
        categoryId: "cat-tri-thuc",
        slug: "co-ngu-aethel-va",
        title: "Cổ ngữ Aethel'va",
        subtitle: "Ngôn ngữ Học thuật và Văn hiến Chung của Lục địa Aethelgard",
        summary: "Hệ thống ngôn ngữ cổ điển gồm cả chữ phiên âm La-tinh mềm mại và 29 cổ tự khắc đá, dùng trong ngoại giao, thiên văn và biên niên sử.",
        icon: "Languages",
        sigil: "ᚨ",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Aethel'va", "Ngôn ngữ Tinh Tú"],
        extraFields: [
          { id: "ef-lang-1", label: "Tỷ lệ đã giải mã", group: "Học thuật", kind: "progress", value: "94", color: "#C084FC", showInInfobox: true, order: 1 },
          { id: "ef-lang-2", label: "Độ phức tạp ngữ âm", group: "Học thuật", kind: "rating", value: "4", color: "#38BDF8", showInInfobox: true, order: 2 },
          { id: "ef-lang-3", label: "Các phương ngữ chính", group: "Phân bố", kind: "tags", value: "Chuẩn Orakel'on, Phương Bắc Cổ, Văn Bia Rừng Ngọc", color: "#A78BFA", showInInfobox: true, order: 3 },
          { id: "ef-lang-4", label: "Người chuẩn hóa", group: "Lịch sử", kind: "entity_ref", value: "Lyraen Vaelor", showInInfobox: false, order: 4 }
        ],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["cổ ngữ", "ngôn ngữ học", "văn hiến"],
        contentMarkdown: `## Cấu trúc Ngôn ngữ học

**Cổ ngữ Aethel'va** là ngôn ngữ cầu nối giữa [[Vương quốc Băng Triều]], [[Đế chế Hoàng Kim Solaria]] và các học giả tại [[Tháp Tinh Tú Orakel'on]]. Là một hệ thống ngôn ngữ học thuần túy, hồ sơ này chỉ lưu giữ cấu trúc ngữ pháp, cổ tự và lịch sử giải mã.

:::conlang
Tri thức và hòa bình là di sản vĩnh cửu của thế giới.
:::`,
        customFields: {
          language_family: "Ngữ hệ Cổ điển Aethelian",
          writing_system: "Chữ Runic khắc đá",
          alphabet_size: 29,
          word_order: "SVO (Chủ-Động-Tân)",
          regions_spoken: "Toàn lục địa Aethelgard (Ngoại giao & Học viện)",
          era_formed: "Trước Năm 0 — Chuẩn hóa năm 330",
          vitality: "Cổ ngữ học thuật / Nghi lễ",
          sample_phrase: "Lumenor et Aethel'va — Ánh sáng tri thức vượt qua thời gian.",
          grammar_table: {
            headers: ["Cách / Thì", "Hậu tố", "Ví dụ & Nghĩa"],
            rows: [
              ["Sở hữu cách", "-'va", "Aethel'va (Của Tinh Tú)"],
              ["Số nhiều", "-ir", "Lumenir (Những ánh sáng)"],
              ["Thì Quá khứ Cổ", "-en", "Valen (Đã từng khắc ghi)"]
            ]
          }
        },
        sourcesMarkdown: `- *Từ điển Chuẩn Cổ ngữ Aethel'va*, tác giả [[Lyraen Vaelor]].`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-hiep-uoc",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-event",
        categoryId: "cat-hiep-uoc-luat",
        slug: "hiep-uoc-anh-sao",
        title: "Hiệp ước Ánh Sao",
        subtitle: "Pactumir Astrelis — Hiến chương Hòa bình & Tự do Học thuật năm 305",
        summary: "Văn kiện ngoại giao lịch sử thiết lập quy chế trung lập vĩnh viễn cho Tháp Tinh Tú Orakel'on và hành lang giao thương học thuật liên miền.",
        icon: "Scale",
        sigil: "⚖",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Pactumir Astrelis", "Hiến chương Năm 305"],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["hiệp ước", "hòa bình", "lịch sử"],
        contentMarkdown: `## Bối cảnh Ký kết

Được ký vào đêm đông chí năm 305 tại đại sảnh [[Tháp Tinh Tú Orakel'on]] giữa đại diện [[Vương quốc Băng Triều]] và [[Đế chế Hoàng Kim Solaria]], **Hiệp ước Ánh Sao** chấm dứt nhiều thập kỷ tranh chấp hải lộ và công nhận quyền tiếp cận tri thức mở cho mọi học giả.`,
        customFields: {
          event_date: "Đêm Đông Chí năm 305",
          location: "Tháp Tinh Tú Orakel'on",
          outcome: "Thành lập Hội đồng Thiên văn Aethelgard và bảo vệ vĩnh viễn tự do nghiên cứu."
        },
        sourcesMarkdown: `- Bản gốc khắc đồng tại kinh đô Aurelia.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-sylvaris",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-flora-fauna",
        categoryId: "cat-rung-co",
        slug: "rung-ngoc-sylvaris",
        title: "Rừng Ngọc Sylvaris",
        subtitle: "Khu bảo tồn Cổ thụ Phát quang & Lưu trữ Thực vật học",
        summary: "Cánh rừng nguyên sinh phía Tây nổi tiếng với những tán cây lá ngọc bích phát quang sinh học dịu nhẹ và các phiến đá khắc cổ ngữ thời sơ khai.",
        icon: "Trees",
        sigil: "ᛇ",
        coverImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Sylvaris", "Khu rừng Phát Quang"],
        customSections: [],
        eraSnapshots: [],
        breakdownBars: [],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["địa danh", "thiên nhiên", "thực vật học"],
        contentMarkdown: `## Hệ Sinh thái & Khảo cổ

**Rừng Ngọc Sylvaris** là kho tàng đa dạng sinh học lớn nhất lục địa. Nhiều loài thực vật tại đây có hiện tượng phát quang sinh học dịu nhẹ vào ban đêm, từng được [[Lyraen Vaelor]] ghi chép chi tiết trong hành trình khảo sát [[Cổ ngữ Aethel'va]].`,
        customFields: {
          scientific_name: "Sylva Luminaris Aethelis",
          habitat: "Tây Nguyên Sylvaris (Khí hậu ôn đới ẩm)",
          conservation: "Cần bảo tồn nghiêm ngặt"
        },
        sourcesMarkdown: `- *Thực vật học Miền Tây*, Tập I.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Sử Gia Biên Tập (Editor)",
        updatedBy: "Sử Gia Biên Tập (Editor)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-private-draft",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-lore",
        categoryId: "cat-tri-thuc",
        slug: "ban-thao-bien-nien-ky-nguyen-moi",
        title: "Bản thảo Kỷ nguyên Thứ Hai (Nội bộ)",
        subtitle: "Tài liệu phác thảo riêng tư dành cho Ban Biên Tập",
        summary: "Bản nháp riêng tư dùng để kiểm chứng phân quyền RBAC: Người xem khách sẽ không thể thấy hồ sơ này.",
        icon: "Key",
        sigil: "⟐",
        coverImage: "",
        thumbImage: "",
        status: "draft",
        visibility: "private",
        canonStatus: "hypothesis",
        spoilerGate: true,
        spoilerLabel: "Nội dung bản thảo nội bộ chưa công bố",
        tags: ["nội bộ", "bản nháp"],
        contentMarkdown: `## Ghi chú Riêng tư\n\nHồ sơ này có trạng thái \`draft\` và phạm vi \`private\`, chỉ Quản trị viên và Biên tập viên mới nhìn thấy.`,
        customFields: {
          classification: "Bản thảo nội bộ",
          dating: "Đang biên soạn"
        },
        sourcesMarkdown: "",
        privateNotes: "Thông tin nhạy cảm chỉ nội bộ xem được.",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-pg-scale",
        workspaceId: "ws-tech-archive",
        entryTypeId: "type-tech-concept",
        categoryId: "cat-tech-db",
        slug: "chi-muc-gin-va-phan-trang-keyset",
        title: "Chỉ mục GIN & Phân trang Keyset cho Wiki Quy mô lớn",
        subtitle: "Kiến trúc tối ưu độ trễ dưới 20ms cho hàng chục nghìn thẻ và hàng triệu bản ghi",
        summary: "Phân tích kỹ thuật kết hợp PostgreSQL pg_trgm, truy vấn nhẹ (Projection) và tải ảnh lười để đảm bảo tốc độ tải mượt mà.",
        icon: "Database",
        sigil: "⌬",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        featured: true,
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["postgresql", "hiệu năng", "keyset pagination", "gin index"],
        contentMarkdown: `## Nguyên lý Tối ưu Hóa\n\nKhi hệ thống Wiki Codex phát triển lên **50.000 thẻ hồ sơ** và **hàng triệu liên kết / phiên bản**, 3 kỹ thuật cốt lõi gồm Lightweight Projection, Keyset Pagination và GIN Trigram Index đảm bảo độ trễ luôn dưới 25ms.`,
        customFields: {
          domain: "Cơ sở dữ liệu & Kiến trúc Web",
          complexity: "O(log N) cho phân trang & tìm kiếm chỉ mục",
          benchmark_table: {
            headers: ["Quy mô bản ghi", "Độ trễ trung bình", "Chiến lược chỉ mục"],
            rows: [
              ["10.000 hồ sơ", "< 12 ms", "B-Tree + Trigram GIN"],
              ["100.000 hồ sơ", "< 25 ms", "Keyset Cursor + Projection"],
              ["1.000.000+ phiên bản", "< 35 ms", "Partitioning theo workspace_id"]
            ]
          }
        },
        sourcesMarkdown: `- Tài liệu chính thức PostgreSQL 16 — *GIN Indexes & pg_trgm*.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      // ==================== V5.0 EXPANDED WORLD ENTRIES ====================
      {
        id: "ent-aurelia",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-city",
        categoryId: "cat-bang-trieu-chi",
        slug: "kinh-do-aurelia",
        title: "Kinh đô Aurelia",
        subtitle: "Cảng Pha Lê Không Đóng Băng của Vịnh Bắc Hải",
        summary: "Thủ phủ thương mại và xưởng chế tác thấu kính thiên văn lớn nhất phương Bắc, xây dựng trên bậc thềm đá bazan quanh các mạch suối địa nhiệt.",
        icon: "Building2",
        sigil: "❖",
        coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Thành Băng Aurelia", "Hải Cảng Ánh Sáng"],
        extraFields: [
          { id: "ef-aur-1", label: "Tỷ lệ biết chữ thị dân", group: "Xã hội", kind: "progress", value: "91", color: "#38BDF8", showInInfobox: true, order: 1 },
          { id: "ef-aur-2", label: "Nhiệt độ trung bình vịnh", group: "Khí hậu", kind: "number", value: "8", unit: "°C (Nước ấm địa nhiệt)", showInInfobox: true, order: 2 },
          { id: "ef-aur-3", label: "Đặc sản nổi tiếng", group: "Kinh tế", kind: "tags", value: "Thấu kính Pha lê, Hải đồ đồng, Trà Băng Tâm", color: "#38BDF8", showInInfobox: true, order: 3 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["đô thị", "thương cảng", "băng triều"],
        contentMarkdown: `## Kiến Trúc & Đời Sống Đô Thị

**Kinh đô Aurelia** là trái tim của [[Vương quốc Băng Triều]]. Nhờ dòng hải lưu ấm Thalassor kết hợp mạch nước nóng ngầm, cảng biển Aurelia hoạt động suốt bốn mùa bất chấp băng tuyết phương Bắc.`,
        customFields: {
          nation: "Vương quốc Băng Triều",
          city_population: 285000,
          governor: "Hội đồng Thị chính Aurelia",
          founded_year: "Năm 120 Kỷ Nguyên Ánh Sao",
          architecture: "Đá bazan trắng kết hợp mái vòm kính pha lê",
          main_economy: "Quang học thiên văn, đóng tàu & hàng hải",
          climate: "Ôn đới lạnh duyên hải",
          districts_table: {
            headers: ["Khu phố", "Chức năng", "Địa điểm nổi bật"],
            rows: [
              ["Đồi Kính Thiên Văn", "Học thuật & Chế tác", "Phủ Gia tộc Vaelor"],
              ["Bến Cảng Bắc Hải", "Thương mại", "Ngọn Hải Đăng Pha Lê"],
              ["Phố Cổ Địa Nhiệt", "Dân cư & Chợ đêm", "Quảng trường Băng Đăng"]
            ]
          }
        },
        sourcesMarkdown: `- *Địa chí Đô thị Phương Bắc*, Quyển II.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-bang-trieu-ngu",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-language",
        categoryId: "cat-tri-thuc",
        slug: "bang-trieu-co-ngu",
        title: "Băng Triều Cổ Ngữ",
        subtitle: "Ngôn ngữ Hàng hải & Khắc đá của các Thuyền trưởng Bắc Hải",
        summary: "Hệ ngôn ngữ giàu phụ âm sắc gọn, thiết kế để truyền lệnh rõ ràng giữa bão tuyết và khắc trên hải đồ đồng thau.",
        icon: "Languages",
        sigil: "ᛉ",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Skald-Glacien", "Tiếng Bắc Hải Cổ"],
        extraFields: [
          { id: "ef-btl-1", label: "Tỷ lệ bảo tồn", group: "Học thuật", kind: "progress", value: "88", color: "#38BDF8", showInInfobox: true, order: 1 },
          { id: "ef-btl-2", label: "Đặc trưng âm vị", group: "Ngữ âm", kind: "tags", value: "Phụ âm bật hơi, Nhịp ngắn, Không thanh điệu", color: "#60A5FA", showInInfobox: true, order: 2 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["ngôn ngữ học", "phương bắc", "hàng hải"],
        contentMarkdown: `## Đặc Điểm Ngôn Ngữ

**Băng Triều Cổ Ngữ** ra đời trong cộng đồng thủy thủ sơ khai tại [[Kinh đô Aurelia]] và [[Vương quốc Băng Triều]]. Ngôn ngữ này có hơn 40 từ riêng biệt chỉ các trạng thái băng trôi và hướng gió biển.`,
        customFields: {
          language_family: "Ngữ hệ Bắc Hải (Nordic-Glacien)",
          writing_system: "Chữ Runic khắc đá",
          alphabet_size: 29,
          word_order: "VSO (Động-Chủ-Tân)",
          regions_spoken: "Vịnh Bắc Hải & Quần đảo Băng",
          era_formed: "Thế kỷ I Kỷ Nguyên Ánh Sao",
          vitality: "Ngôn ngữ sống phổ biến",
          sample_phrase: "Skal-fjord valk — Con thuyền vững vàng giữa băng triều."
        },
        sourcesMarkdown: `- *Từ điển Hàng hải Bắc Hải*.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Sử Gia Biên Tập (Editor)",
        updatedBy: "Sử Gia Biên Tập (Editor)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-duc-tin-tinh-tu",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-religion",
        categoryId: "cat-tri-thuc",
        slug: "duc-tin-tinh-tu-astralisme",
        title: "Đức Tin Tinh Tú (Astralisme)",
        subtitle: "Triết lý Chiêm nghiệm Bầu trời & Tôn vinh Ký ức Nhân loại",
        summary: "Tín ngưỡng ôn hòa coi mỗi ngôi sao là một trang sử của vũ trụ, đề cao việc ghi chép trung thực, lòng hiếu học và sự hài hòa giữa các quốc gia.",
        icon: "Sun",
        sigil: "✹",
        coverImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Tinh Tú Giáo", "Đạo Ánh Sao"],
        extraFields: [
          { id: "ef-rel-1", label: "Tỷ lệ ảnh hưởng lục địa", group: "Phổ biến", kind: "progress", value: "68", color: "#F59E0B", showInInfobox: true, order: 1 },
          { id: "ef-rel-2", label: "Giá trị cốt lõi", group: "Giáo lý", kind: "tags", value: "Tri thức, Trung lập, Chiêm nghiệm, Hòa bình", color: "#D4AF37", showInInfobox: true, order: 2 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["tôn giáo", "triết học", "thiên văn"],
        contentMarkdown: `## Giáo Lý & Thánh Địa

**Đức Tin Tinh Tú** không thờ phụng thần chiến tranh mà tôn vinh **Ánh Sáng Khởi Nguyên** — biểu tượng của trí tuệ và ký ức. Thánh địa lớn nhất chính là [[Tháp Tinh Tú Orakel'on]].`,
        customFields: {
          deities: "Ánh Sáng Khởi Nguyên & Ba Mặt Trăng Chứng Nhân",
          founder_prophet: "Hiền giả Orakel Đệ Nhất",
          holy_site: "Tháp Tinh Tú Orakel'on",
          sacred_texts: "Bảy Cuộn Kinh Tinh Đồ (Codex Astrelis)",
          core_tenets: "Không đốt sách, không xóa lịch sử, và giữ trọn lời thề dưới ánh sao.",
          major_rituals: "Đêm Đông Chí Thắp Đèn & Lễ Quan Sát Nhật Thực."
        },
        sourcesMarkdown: `- *Tôn giáo học So sánh Aethelgard*, Tập III.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-cong-huong-pha-le",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-magic-system",
        categoryId: "cat-tri-thuc",
        slug: "hoc-thuyet-cong-huong-pha-le",
        title: "Học Thuyết Cộng Hưởng Pha Lê",
        subtitle: "Hệ thống Quy luật Quang học – Năng lượng Tinh tú của Aethelgard",
        summary: "Nền tảng khoa học – ma đạo lý giải cách thạch anh phương Bắc hội tụ bức xạ tinh tú để chiếu sáng, lưu trữ âm thanh và dẫn đường hải trình.",
        icon: "Atom",
        sigil: "⬡",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Astral Resonance", "Quang Ma Học"],
        extraFields: [
          { id: "ef-sys-1", label: "Mức độ ứng dụng dân sự", group: "Thực tiễn", kind: "progress", value: "82", color: "#2DD4BF", showInInfobox: true, order: 1 },
          { id: "ef-sys-2", label: "Rủi ro quá tải", group: "Giới hạn", kind: "rating", value: "3", color: "#FB7185", showInInfobox: true, order: 2 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["hệ thống ma pháp", "khoa học", "pha lê"],
        contentMarkdown: `## Nguyên Lý Bảo Toàn

**Học Thuyết Cộng Hưởng Pha Lê** quy định mọi nguồn sáng hội tụ qua thấu kính đều phải tuân theo định luật cân bằng nhiệt năng. Đây là nền tảng tạo nên [[Thiên cầu Pha Lê Aurelia]].`,
        customFields: {
          system_kind: "Ma pháp Cộng hưởng",
          energy_source: "Bức xạ ánh sao & từ trường cực quang Bắc Hải",
          catalyst: "Thạch anh nguyên khối chạm khắc Cổ ngữ Aethel'va",
          laws_limits: "Năng lượng thu vào không vượt quá ngưỡng chịu nhiệt của pha lê; lạm dụng gây nứt vỡ tinh thể và suy giảm ký ức người vận hành.",
          civil_uses: "Hải đăng không tắt, lưu trữ giọng nói trong tinh thể, sưởi ấm thư viện."
        },
        sourcesMarkdown: `- *Luận án Quang học Tinh tú*, Hội đồng Thiên văn.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-aurelius-solis",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-character",
        categoryId: "cat-hoc-gia",
        slug: "hoang-de-aurelius-solis-iii",
        title: "Hoàng Đế Aurelius Solis III",
        subtitle: "Minh Quân Kiến Thiết — Người Đồng Ký Hiệp Ước Ánh Sao",
        summary: "Vị hoàng đế thứ ba của Đế chế Hoàng Kim Solaria, nổi tiếng với tầm nhìn ngoại giao ôn hòa, bảo trợ nghệ thuật và tài thao lược bậc thầy.",
        icon: "Crown",
        sigil: "☀",
        coverImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
        thumbImage: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=70",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Thái Dương Vương", "Aurelius Người Hòa Giải"],
        powerLevel: 42000,
        powerSourceLabel: "Uy quyền Đế chế, Chiến lược Quân sự & Huyết mạch Thái Dương",
        attributes: [
          { id: "a-as-1", key: "str", label: "Chiến lực & Kiếm thuật", value: 9200, sliderMax: 15000, color: "#F87171", sigil: "⚔" },
          { id: "a-as-2", key: "int", label: "Chiến lược & Trị quốc", value: 14500, sliderMax: 20000, color: "#60A5FA", sigil: "✦" },
          { id: "a-as-3", key: "mag", label: "Cộng hưởng Thái Dương", value: 11800, sliderMax: 20000, color: "#F59E0B", sigil: "✹" },
          { id: "a-as-4", key: "cha", label: "Uy tín Ngoại giao", value: 18500, sliderMax: 20000, color: "#D4AF37", sigil: "⚜" },
          { id: "a-as-5", key: "spd", label: "Phản xạ & Quyết đoán", value: 7600, sliderMax: 15000, color: "#34D399", sigil: "✧" }
        ],
        extraFields: [
          { id: "ef-as-1", label: "Chiều cao", group: "Ngoại hình", kind: "number", value: "186", unit: "cm", showInInfobox: true, order: 1 },
          { id: "ef-as-2", label: "Tính cách nổi bật", group: "Tính cách", kind: "tags", value: "Uy nghiêm, Rộng lượng, Tầm nhìn xa", color: "#F59E0B", showInInfobox: true, order: 2 },
          { id: "ef-as-3", label: "Uy tín lịch sử", group: "Đánh giá", kind: "rating", value: "5", color: "#D4AF37", showInInfobox: true, order: 3 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["nhân vật", "hoàng đế", "solaria", "ngoại giao"],
        contentMarkdown: `## Sự Nghiệp Trị Quốc

**Aurelius Solis III** trị vì [[Đế chế Hoàng Kim Solaria]] trong giai đoạn hoàng kim nhất của thế kỷ IV. Ông cùng phái đoàn [[Vương quốc Băng Triều]] ký kết [[Hiệp ước Ánh Sao]] năm 305.`,
        customFields: {
          title_role: "Hoàng đế Đế chế Hoàng Kim Solaria",
          species_origin: "Nhân loại (Dòng dõi Solis phương Nam)",
          gender: "Nam",
          birth_year: "Năm 262 — Năm 338",
          life_status: "Đã qua đời",
          origin_ref: "Đế chế Hoàng Kim Solaria",
          house_ref: "Hoàng tộc Solis",
          personality: "Quyết đoán, trọng hiền tài, ghét chiến tranh vô nghĩa",
          signature_gear: "Quyền trượng Nhật Thực bằng vàng ròng",
          notable_works: "Hiệp ước Ánh Sao năm 305; Mái vòm Đồng Tháp Tinh Tú"
        },
        sourcesMarkdown: `- *Hoàng Triều Thực Lục Solaria*, Tập IV.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-long-ngu-bac-hai",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-flora-fauna",
        categoryId: "cat-sinh-hoc",
        slug: "long-ngu-bac-hai-cryo-leviathan",
        title: "Long Ngư Bắc Hải (Cryo-Leviathan)",
        subtitle: "Sinh vật Biển Sâu Huyền Thoại Sống Quanh Mạch Địa Nhiệt",
        summary: "Loài sinh vật biển khổng lồ có vảy phát quang xanh lam, thường bơi hộ tống các đoàn tàu qua vịnh Bắc Hải vào mùa cực quang.",
        icon: "Leaf",
        sigil: "ᛇ",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Thủy Long Bắc Hải", "Cryo-Leviathan"],
        powerLevel: 125000,
        powerSourceLabel: "Sức mạnh Sinh học Biển sâu & Lớp vảy Kháng băng",
        attributes: [
          { id: "a-ln-1", key: "str", label: "Sức mạnh Thể chất", value: 48000, sliderMax: 60000, color: "#38BDF8", sigil: "⚔" },
          { id: "a-ln-2", key: "def", label: "Độ cứng Vảy Băng", value: 52000, sliderMax: 60000, color: "#10B981", sigil: "⛨" },
          { id: "a-ln-3", key: "spd", label: "Tốc độ Lặn biển", value: 25000, sliderMax: 40000, color: "#60A5FA", sigil: "✧" }
        ],
        extraFields: [
          { id: "ef-ln-1", label: "Chiều dài tối đa", group: "Hình thái", kind: "number", value: "42", unit: "mét", showInInfobox: true, order: 1 },
          { id: "ef-ln-2", label: "Mức độ nguy hiểm", group: "Sinh thái", kind: "rating", value: "4", color: "#FB7185", showInInfobox: true, order: 2 },
          { id: "ef-ln-3", label: "Tập tính nổi bật", group: "Sinh thái", kind: "tags", value: "Hiền hòa với tàu thuyền, Phát quang cực quang, Di cư theo mạch nóng", color: "#10B981", showInInfobox: true, order: 3 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["sinh vật", "huyền thoại", "bắc hải"],
        contentMarkdown: `## Đặc Điểm Sinh Học

**Long Ngư Bắc Hải** là biểu tượng thiêng liêng trong truyền thuyết hàng hải của [[Vương quốc Băng Triều]]. Chúng chỉ xuất hiện quanh dòng hải lưu ấm Thalassor gần [[Kinh đô Aurelia]].`,
        customFields: {
          scientific_name: "Leviathanus Cryoluminescens",
          habitat: "Biển sâu Vịnh Bắc Hải (quanh mạch địa nhiệt)",
          avg_size: "32 – 42 mét",
          diet_behavior: "Ăn sinh vật phù du phát quang & cá biển sâu",
          conservation: "Huyền thoại"
        },
        sourcesMarkdown: `- *Hải Trình Ký của Thuyền trưởng Arion*.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Sử Gia Biên Tập (Editor)",
        updatedBy: "Sử Gia Biên Tập (Editor)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      {
        id: "ent-hai-do-arion",
        workspaceId: "ws-aethelgard",
        entryTypeId: "type-artifact",
        categoryId: "cat-co-vat",
        slug: "hai-do-vang-cua-arion",
        title: "Hải Đồ Vàng Của Thuyền Trưởng Arion",
        subtitle: "Bản Khắc Đồng Thau Dẫn Đường Cổ Xưa Nhất Bắc Hải",
        summary: "Tấm hải đồ cơ khí khắc Cổ ngữ có khả năng tự phát sáng theo vị trí ba mặt trăng, giúp đoàn thuyền đầu tiên tìm ra vịnh Aurelia.",
        icon: "Gem",
        sigil: "❖",
        coverImage: "",
        thumbImage: "",
        status: "published",
        visibility: "public",
        canonStatus: "canon",
        aliases: ["Bản đồ Tinh Tú Arion", "Astrolabe-Chart"],
        powerLevel: 9500,
        powerSourceLabel: "Cộng hưởng Địa từ & Khắc ấn Cổ ngữ Hàng hải",
        attributes: [
          { id: "a-hd-1", key: "res", label: "Độ cộng hưởng Tinh tú", value: 4200, sliderMax: 10000, color: "#D4AF37", sigil: "✦" },
          { id: "a-hd-2", key: "dur", label: "Độ bền Vật liệu", value: 3800, sliderMax: 10000, color: "#FB7185", sigil: "❖" },
          { id: "a-hd-3", key: "acc", label: "Độ chính xác Dẫn đường", value: 9800, sliderMax: 10000, color: "#38BDF8", sigil: "✧" }
        ],
        extraFields: [
          { id: "ef-hd-1", label: "Độ hiếm bảo tàng", group: "Giá trị", kind: "rating", value: "5", color: "#FB7185", showInInfobox: true, order: 1 },
          { id: "ef-hd-2", label: "Tình trạng nguyên vẹn", group: "Bảo tồn", kind: "progress", value: "97", color: "#34D399", showInInfobox: true, order: 2 }
        ],
        spoilerGate: false,
        spoilerLabel: "",
        tags: ["cổ vật", "hàng hải", "gia tộc vaelor"],
        contentMarkdown: `## Lịch Sử Hiện Vật

**Hải Đồ Vàng Của Thuyền Trưởng Arion** là gia bảo đời đầu của [[Gia tộc Vaelor]]. Các rãnh đồng trên mặt hải đồ chứa bột thạch anh cộng hưởng theo [[Học Thuyết Cộng Hưởng Pha Lê]].`,
        customFields: {
          creator: "Thuyền trưởng Arion Vaelor",
          era_created: "Năm 118 Kỷ Nguyên Ánh Sao",
          material: "Hợp kim Đồng Hoàng Kim & Bột Thạch Anh",
          owner: "Gia tộc Vaelor",
          location: "Bảo tàng Hàng hải Kinh đô Aurelia",
          activation_note: "Chiếu ánh trăng Ngân Nguyệt lên tâm la bàn để hiện lộ tuyến hải lưu ẩn."
        },
        sourcesMarkdown: `- *Gia phả Vịnh Bắc Hải*, quyển I.`,
        privateNotes: "",
        gallery: [],
        editorialNotes: [],
        createdBy: "Đại Học Giả (Admin)",
        updatedBy: "Đại Học Giả (Admin)",
        createdAt: NOW,
        updatedAt: NOW,
        deletedAt: null
      },
      // 360 Complete Encyclopedic Nation Dossiers (Aethelgard Prime)
      ...buildAll360NationEntries("ws-aethelgard", NOW)
    ],
    revisions: [
      {
        id: "rev-1",
        entryId: "ent-bang-trieu",
        versionNumber: 1,
        changeSummary: "Khởi tạo hồ sơ Vương quốc Băng Triều",
        editorName: "Đại Học Giả (Admin)",
        createdAt: "2026-11-20T09:00:00.000Z",
        snapshot: {
          title: "Vương quốc Băng Triều",
          subtitle: "Valdoria Glacien — Bản ghi sơ khởi",
          summary: "Vương quốc cổ đại ven biển băng phương Bắc.",
          categoryId: "cat-bang-trieu-chi",
          status: "published",
          visibility: "public",
          tags: ["vương quốc", "phương bắc"],
          contentMarkdown: "## Tổng quan Địa lý & Lịch sử\n\nVương quốc Băng Triều thành lập năm 120 bên vịnh Bắc Hải.\nĐây là bản ghi sơ khởi trước khi bổ sung tư liệu Hiệp ước Ánh Sao.",
          customFields: { capital: "Kinh đô Aurelia" },
          sourcesMarkdown: "",
          privateNotes: "",
          gallery: []
        }
      }
    ],
    relations: [
      { id: "rel-1", workspaceId: "ws-aethelgard", sourceEntryId: "ent-bang-trieu", targetEntryId: "ent-solaria", relationType: "Đồng minh học thuật", note: "Ký kết Hiệp ước Ánh Sao năm 305", createdAt: NOW },
      { id: "rel-2", workspaceId: "ws-aethelgard", sourceEntryId: "ent-bang-trieu", targetEntryId: "ent-orakel", relationType: "Bảo trợ xây dựng", note: "Cung cấp hệ thống thấu kính thiên văn pha lê", createdAt: NOW },
      { id: "rel-3", workspaceId: "ws-aethelgard", sourceEntryId: "ent-lyraen", targetEntryId: "ent-orakel", relationType: "Viện trưởng Lưu trữ", note: "Thiết lập hệ thống danh mục đa cấp tại tháp", createdAt: NOW },
      { id: "rel-4", workspaceId: "ws-aethelgard", sourceEntryId: "ent-lyraen", targetEntryId: "ent-aethelva", relationType: "Người chuẩn hóa", note: "Biên soạn bộ từ điển chuẩn Cổ ngữ Aethel'va", createdAt: NOW },
      { id: "rel-5", workspaceId: "ws-aethelgard", sourceEntryId: "ent-hiep-uoc", targetEntryId: "ent-orakel", relationType: "Bảo hộ trung lập", note: "Công nhận quyền tự do nghiên cứu vĩnh viễn", createdAt: NOW },
      { id: "rel-6", workspaceId: "ws-aethelgard", sourceEntryId: "ent-lyraen", targetEntryId: "ent-sylvaris", relationType: "Khảo sát thực địa", note: "Giải mã các bia đá cổ ngữ trong Rừng Ngọc", createdAt: NOW },
      { id: "rel-7", workspaceId: "ws-aethelgard", sourceEntryId: "ent-gia-toc-vaelor", targetEntryId: "ent-lyraen", relationType: "Thành viên kiệt xuất", note: "Đời thứ V của Gia tộc Vaelor", createdAt: NOW },
      { id: "rel-8", workspaceId: "ws-aethelgard", sourceEntryId: "ent-hoi-dong-thien-van", targetEntryId: "ent-thien-cau-pha-le", relationType: "Đơn vị bảo quản", note: "Trưng bày tại tầng 9 Tháp Tinh Tú", createdAt: NOW },
      ...buildTriBorderAndMajorRelations("ws-aethelgard", NOW)
    ],
    timelineEvents: [
      { id: "tl-1", workspaceId: "ws-aethelgard", title: "Liên minh Bảy Thành bang Solaria", dateLabel: "Ngày 12 Tháng Minh Dương, Năm 45", sortYear: 45, calendarMonthIndex: 5, calendarDay: 12, era: "Kỷ Nguyên Khởi Nguyên", icon: "Sun", sigil: "✹", color: "#F59E0B", summary: "Bảy thành bang phương Nam hợp nhất thành Đế chế Hoàng Kim Solaria và ban hành lịch pháp mặt trời.", entryIds: ["ent-solaria"], createdAt: NOW },
      { id: "tl-2", workspaceId: "ws-aethelgard", title: "Thành lập Vương quốc Băng Triều", dateLabel: "Ngày 5 Tháng Băng Tâm, Năm 120", sortYear: 120, calendarMonthIndex: 0, calendarDay: 5, era: "Kỷ Nguyên Khởi Nguyên", icon: "Castle", sigil: "⚜", color: "#38BDF8", summary: "Kinh đô Aurelia được xây dựng quanh vịnh suối địa nhiệt phương Bắc.", entryIds: ["ent-bang-trieu", "ent-gia-toc-vaelor"], createdAt: NOW },
      { id: "tl-3", workspaceId: "ws-aethelgard", title: "Ký kết Hiệp ước Ánh Sao", dateLabel: "Ngày 21 Tháng Đông Chí, Năm 305", sortYear: 305, calendarMonthIndex: 11, calendarDay: 21, era: "Kỷ Nguyên Minh Triết", icon: "Scale", sigil: "⚖", color: "#D4AF37", summary: "Vương quốc Băng Triều và Đế chế Solaria ký hiến chương hòa bình, thiết lập Tháp Tinh Tú Orakel'on làm trung tâm tri thức chung.", entryIds: ["ent-hiep-uoc", "ent-bang-trieu", "ent-solaria", "ent-orakel"], createdAt: NOW },
      { id: "tl-4", workspaceId: "ws-aethelgard", title: "Hoàn thành Bộ Từ điển Chuẩn Cổ ngữ Aethel'va", dateLabel: "Ngày 14 Tháng Tinh Quang, Năm 330", sortYear: 330, calendarMonthIndex: 2, calendarDay: 14, era: "Kỷ Nguyên Minh Triết", icon: "Languages", sigil: "ᚨ", color: "#A78BFA", summary: "Đại Sử Gia Lyraen Vaelor công bố hệ thống chuẩn hóa Cổ ngữ Aethel'va sau chuyến khảo sát Rừng Ngọc Sylvaris.", entryIds: ["ent-lyraen", "ent-aethelva", "ent-sylvaris"], createdAt: NOW }
    ],
    atlasMaps: [
      { id: "map-aethelgard", workspaceId: "ws-aethelgard", name: "Hải đồ & Lục địa Aethelgard", description: "Bản đồ tổng quan các vương quốc, đại thư viện, tuyến thương mại và vùng sinh thái cổ đại.", imageUrl: "", themePreset: "aethelgard", scaleKmPerWidth: 2800, width: 1200, height: 700, createdAt: NOW },
      { id: "map-tech-arch", workspaceId: "ws-tech-archive", name: "Sơ đồ Kiến trúc Dữ liệu Quy mô lớn", description: "Bản đồ các tầng lưu trữ, chỉ mục và cổng phân phối CDN.", imageUrl: "", themePreset: "architecture", scaleKmPerWidth: 100, width: 1200, height: 700, createdAt: NOW }
    ],
    atlasPins: [
      { id: "pin-1", mapId: "map-aethelgard", workspaceId: "ws-aethelgard", label: "Kinh đô Aurelia (Băng Triều)", description: "Thủ phủ phương Bắc với vịnh nước ấm và xưởng kính thiên văn.", xPercent: 48, yPercent: 20, color: "#38BDF8", icon: "Castle", sigil: "⚜", layer: "Vương quốc", entryId: "ent-bang-trieu" },
      { id: "pin-2", mapId: "map-aethelgard", workspaceId: "ws-aethelgard", label: "Tháp Tinh Tú Orakel'on", description: "Đại thư viện chín tầng và đài thiên văn trung lập của lục địa.", xPercent: 52, yPercent: 48, color: "#D4AF37", icon: "Landmark", sigil: "◈", layer: "Thư viện & Di tích", entryId: "ent-orakel" },
      { id: "pin-3", mapId: "map-aethelgard", workspaceId: "ws-aethelgard", label: "Rừng Ngọc Sylvaris", description: "Cánh rừng cổ thụ phát quang phía Tây lưu giữ nhiều bia cổ ngữ.", xPercent: 26, yPercent: 54, color: "#34D399", icon: "Trees", sigil: "ᛇ", layer: "Thiên nhiên", entryId: "ent-sylvaris" },
      { id: "pin-4", mapId: "map-aethelgard", workspaceId: "ws-aethelgard", label: "Thành Thái Dương Solaria", description: "Trung tâm văn hóa và học viện phương Nam.", xPercent: 68, yPercent: 76, color: "#F59E0B", icon: "Sun", sigil: "✹", layer: "Vương quốc", entryId: "ent-solaria" },
      { id: "pin-tech-1", mapId: "map-tech-arch", workspaceId: "ws-tech-archive", label: "Cụm PostgreSQL GIN + Keyset", description: "Tầng truy vấn tốc độ cao cho hàng chục nghìn thẻ.", xPercent: 50, yPercent: 50, color: "#60A5FA", icon: "Database", sigil: "⌬", layer: "Cơ sở dữ liệu", entryId: "ent-pg-scale" }
    ],
    atlasRoutes: [
      {
        id: "route-1",
        mapId: "map-aethelgard",
        workspaceId: "ws-aethelgard",
        name: "Hải lộ Học thuật Bắc — Nam",
        description: "Tuyến giao thương và trao đổi cổ thư nối kinh đô Aurelia, Tháp Tinh Tú và Thành Thái Dương Solaria.",
        color: "#D4AF37",
        dashed: true,
        points: [
          { xPercent: 48, yPercent: 20 },
          { xPercent: 52, yPercent: 48 },
          { xPercent: 68, yPercent: 76 }
        ]
      },
      {
        id: "route-2",
        mapId: "map-aethelgard",
        workspaceId: "ws-aethelgard",
        name: "Hành trình Khảo cổ Lyraen",
        description: "Chuyến điền dã giải mã bia cổ ngữ từ Tháp Tinh Tú sang Rừng Ngọc Sylvaris.",
        color: "#34D399",
        dashed: false,
        points: [
          { xPercent: 52, yPercent: 48 },
          { xPercent: 39, yPercent: 51 },
          { xPercent: 26, yPercent: 54 }
        ]
      }
    ],
    conlangs: createSixDefaultConlangs("ws-aethelgard", NOW),
    templates: [
      {
        id: "tpl-kingdom",
        workspaceId: "ws-aethelgard",
        name: "Mẫu Hồ sơ Vương quốc Chuẩn",
        description: "Bố cục bách khoa đầy đủ cho quốc gia, đế chế hoặc thành bang.",
        sigil: "⚜",
        entryTypeId: "type-kingdom",
        defaultTags: ["vương quốc", "lịch sử"],
        contentMarkdown: "## Tổng quan Địa lý & Khởi nguyên\n\nMô tả vị trí địa lý và bối cảnh thành lập...\n\n## Thể chế & Luật pháp\n\nTrình bày cơ cấu quản trị...\n\n## Văn hóa, Kiến trúc & Ngoại giao\n\nGhi nhận các mối liên kết với [[Tháp Tinh Tú Orakel'on]].",
        customSections: [
          { id: "ts-1", title: "Lễ hội & Tập tục", sigil: "✦", content: "Mô tả các dịp lễ truyền thống của người dân..." }
        ],
        createdAt: NOW
      },
      {
        id: "tpl-character",
        workspaceId: "ws-aethelgard",
        name: "Mẫu Tiểu sử Nhân vật Truyền kỳ",
        description: "Cấu trúc tiểu sử học thuật cho học giả, quân chủ, nghệ nhân.",
        sigil: "⚝",
        entryTypeId: "type-character",
        defaultTags: ["nhân vật", "tiểu sử"],
        contentMarkdown: "## Xuất thân & Thời niên thiếu\n\n...\n\n## Sự nghiệp & Đóng góp Lịch sử\n\n...\n\n## Di sản & Đánh giá của Sử gia\n\n...",
        customSections: [],
        createdAt: NOW
      }
    ],
    loreboards: [
      {
        id: "lb-1",
        workspaceId: "ws-aethelgard",
        name: "Mạng lưới Hiệp ước Ánh Sao (Năm 305)",
        description: "Sơ đồ trực quan hóa các thế lực học thuật và nhân vật tham gia ký kết Hiệp ước Ánh Sao.",
        nodes: [
          { id: "ln-1", kind: "entry", title: "Vương quốc Băng Triều", content: "Bảo trợ thấu kính & hải cảng Bắc Hải", entryId: "ent-bang-trieu", x: 60, y: 60, width: 220, color: "#38BDF8", sigil: "⚜" },
          { id: "ln-2", kind: "entry", title: "Tháp Tinh Tú Orakel'on", content: "Trung lập địa ký kết Hiệp ước", entryId: "ent-orakel", x: 350, y: 140, width: 230, color: "#D4AF37", sigil: "◈" },
          { id: "ln-3", kind: "entry", title: "Đế chế Hoàng Kim Solaria", content: "Đồng ký kết & bảo trợ học viện Nam", entryId: "ent-solaria", x: 650, y: 60, width: 230, color: "#F59E0B", sigil: "✹" },
          { id: "ln-4", kind: "note", title: "Ghi chú Mạch Sử", content: "Kiểm tra lại danh sách đại sứ hai miền trong bản khắc đồng năm 305.", x: 350, y: 310, width: 230, color: "#A78BFA", sigil: "✦" }
        ],
        edges: [
          { id: "le-1", fromNodeId: "ln-1", toNodeId: "ln-2", label: "Bảo trợ kính pha lê", color: "#38BDF8" },
          { id: "le-2", fromNodeId: "ln-3", toNodeId: "ln-2", label: "Xây mái vòm đồng", color: "#F59E0B" },
          { id: "le-3", fromNodeId: "ln-2", toNodeId: "ln-4", label: "Ghi chú nghiên cứu", color: "#A78BFA" }
        ],
        updatedAt: NOW
      }
    ],
    calendars: [
      {
        id: "cal-aethelgard",
        workspaceId: "ws-aethelgard",
        name: "Lịch Tinh Tú Aethelgard",
        eraName: "Kỷ Nguyên Ánh Sao",
        currentYear: 330,
        moonCycleDays: 28,
        weekdays: ["Nhật Tinh", "Nguyệt Tinh", "Thủy Tinh", "Mộc Tinh", "Kim Tinh", "Thổ Tinh", "Tinh Hòa"],
        months: [
          { name: "Tháng Băng Tâm", days: 30, season: "Đông", sigil: "✧" },
          { name: "Tháng Sương Bạc", days: 30, season: "Đông", sigil: "☽" },
          { name: "Tháng Tinh Quang", days: 30, season: "Xuân", sigil: "✦" },
          { name: "Tháng Hoa Ngọc", days: 30, season: "Xuân", sigil: "ᛇ" },
          { name: "Tháng Gió Tây", days: 30, season: "Xuân", sigil: "❖" },
          { name: "Tháng Minh Dương", days: 30, season: "Hạ", sigil: "✹" },
          { name: "Tháng Kim Sa", days: 30, season: "Hạ", sigil: "☀" },
          { name: "Tháng Hải Triều", days: 30, season: "Hạ", sigil: "❂" },
          { name: "Tháng Lá Vàng", days: 30, season: "Thu", sigil: "⚜" },
          { name: "Tháng Cổ Thư", days: 30, season: "Thu", sigil: "ᚨ" },
          { name: "Tháng Mây Trắng", days: 30, season: "Thu", sigil: "◈" },
          { name: "Tháng Đông Chí", days: 30, season: "Đông", sigil: "⧗" }
        ],
        moons: [
          { id: "moon-selene", name: "Ngân Nguyệt (Selena)", cycleDays: 28, offsetDays: 0, color: "#E2E8F0" },
          { id: "moon-aether", name: "Lam Tinh Nguyệt (Aether)", cycleDays: 19, offsetDays: 5, color: "#38BDF8" },
          { id: "moon-crimson", name: "Huyết Nguyệt (Krimson)", cycleDays: 73, offsetDays: 14, color: "#FB7185" }
        ],
        holidays: [
          { id: "hol-1", monthIndex: 0, day: 1, name: "Lễ Hội Băng Đăng Khai Niên", description: "Thắp đèn pha lê dọc vịnh Bắc Hải đón năm mới.", sigil: "✧" },
          { id: "hol-2", monthIndex: 2, day: 14, name: "Ngày Cổ Ngữ & Lưu Trữ", description: "Kỷ niệm ngày công bố Bộ Từ điển Chuẩn Aethel'va.", sigil: "ᚨ" },
          { id: "hol-3", monthIndex: 5, day: 12, name: "Đại Lễ Hoàng Kim Solaria", description: "Lễ hội ánh sáng kéo dài 3 đêm tại phương Nam.", sigil: "✹" },
          { id: "hol-4", monthIndex: 11, day: 21, name: "Đêm Hiệp Ước Ánh Sao", description: "Các học viện trên toàn lục địa mở cửa tự do cho học giả.", sigil: "⚖" }
        ]
      }
    ],
    mediaAssets: [
      { id: "med-1", workspaceId: "ws-aethelgard", title: "Vịnh Bắc Hải mùa Cực Quang", thumbUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=480&q=70", fullUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1400&q=85", tags: ["phương bắc", "băng triều"], caption: "Khung cảnh kinh đô Aurelia về đêm", source: "external", createdAt: NOW },
      { id: "med-2", workspaceId: "ws-aethelgard", title: "Đại sảnh Cổ Thư Orakel'on", thumbUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=480&q=70", fullUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1400&q=85", tags: ["thư viện", "cổ thư"], caption: "Hàng trăm nghìn cuộn sách lưu trữ", source: "external", createdAt: NOW },
      { id: "med-3", workspaceId: "ws-aethelgard", title: "Bầu trời Sao Cao nguyên Trung Tâm", thumbUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=480&q=70", fullUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=85", tags: ["thiên văn", "tháp tinh tú"], caption: "Góc nhìn từ đài thiên văn tầng 9", source: "external", createdAt: NOW },
      { id: "med-4", workspaceId: "ws-aethelgard", title: "Rừng Cổ Thụ Sylvaris", thumbUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=480&q=70", fullUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1400&q=85", tags: ["thiên nhiên", "sylvaris"], caption: "Tán rừng nguyên sinh miền Tây", source: "external", createdAt: NOW }
    ],
    glossaryTerms: [
      { id: "gl-1", workspaceId: "ws-aethelgard", term: "Thalassor", shortDef: "Dòng hải lưu ấm chảy từ phương Nam lên vịnh Bắc Hải giúp cảng Aurelia không đóng băng.", category: "Địa lý", sigil: "✧", linkedEntryId: "ent-bang-trieu" },
      { id: "gl-2", workspaceId: "ws-aethelgard", term: "Kỷ Nguyên Ánh Sao", shortDef: "Hệ thống tính năm chung của toàn lục địa Aethelgard, lấy mốc Năm 0 là ngày dựng đài quan sát đầu tiên.", category: "Lịch pháp", sigil: "⧗", linkedEntryId: null },
      { id: "gl-3", workspaceId: "ws-aethelgard", term: "Lumenor", shortDef: "Danh hiệu danh dự bằng Cổ ngữ Aethel'va trao cho các đại học giả tại Tháp Tinh Tú.", category: "Học thuật", sigil: "⚝", linkedEntryId: "ent-lyraen" }
    ],
    collections: [
      {
        id: "col-1",
        workspaceId: "ws-aethelgard",
        title: "Hành trình Nhập môn Lục địa Aethelgard",
        description: "Lộ trình đọc 5 hồ sơ nền tảng giúp độc giả mới nắm trọn lịch sử, địa lý và cổ ngữ của thế giới.",
        sigil: "✦",
        color: "#D4AF37",
        isPublic: true,
        entryIds: ["ent-bang-trieu", "ent-solaria", "ent-orakel", "ent-lyraen", "ent-aethelva"],
        createdAt: NOW
      }
    ],
    editorialTasks: [
      { id: "tsk-1", workspaceId: "ws-aethelgard", title: "Viết hồ sơ: Thành cổ Mất tích (Liên kết đỏ)", description: "Bổ sung tư liệu khảo cổ về phế tích ngoài khơi biển sương mù.", stage: "idea", priority: "high", linkedEntryId: null, createdAt: NOW },
      { id: "tsk-2", workspaceId: "ws-aethelgard", title: "Bổ sung bản đồ tuyến thương mại Quần đảo Mây Trắng", description: "Gắn thêm 3 ghim hải đảo trên Bản đồ Atlas.", stage: "writing", priority: "medium", linkedEntryId: null, createdAt: NOW },
      { id: "tsk-3", workspaceId: "ws-aethelgard", title: "Rà soát niên đại Gia tộc Vaelor đời II–III", description: "Đối chiếu với Biên niên sử Bắc Hải.", stage: "review", priority: "low", linkedEntryId: "ent-gia-toc-vaelor", createdAt: NOW }
    ],
    activityLog: [
      { id: "act-1", workspaceId: "ws-aethelgard", actor: "Đại Học Giả (Admin)", action: "Khởi tạo V2.0 Grand Edition", targetTitle: "Biên niên sử Lục địa Aethelgard", targetType: "workspace", createdAt: NOW },
      { id: "act-2", workspaceId: "ws-aethelgard", actor: "Sử Gia Biên Tập (Editor)", action: "Cập nhật hồ sơ", targetTitle: "Vương quốc Băng Triều", targetType: "entry", createdAt: NOW }
    ],
    worldUnits: [
      { id: "u-sol-gold", workspaceId: "ws-aethelgard", category: "currency", name: "Đồng Hoàng Kim Solaria", symbol: "☀G", ratioToBase: 100, note: "Tiền tệ chuẩn trong giao thương liên miền" },
      { id: "u-bt-silver", workspaceId: "ws-aethelgard", category: "currency", name: "Bạc Băng Triều", symbol: "✧S", ratioToBase: 10, note: "10 Bạc Băng Triều = 1 Hoàng Kim Solaria" },
      { id: "u-aur-copper", workspaceId: "ws-aethelgard", category: "currency", name: "Xu Đồng Aurelia", symbol: "❖C", ratioToBase: 1, note: "Đơn vị cơ sở sinh hoạt thường ngày" },
      { id: "u-len-km", workspaceId: "ws-aethelgard", category: "length", name: "Kilômét Chuẩn", symbol: "km", ratioToBase: 1, note: "Đơn vị địa lý tiêu chuẩn" },
      { id: "u-len-league", workspaceId: "ws-aethelgard", category: "length", name: "Dặm Tinh Tú (Star-League)", symbol: "SL", ratioToBase: 1.85, note: "Đơn vị đo hải đồ Bắc Hải (1 SL = 1.85 km)" }
    ],
    savedViews: [
      {
        id: "sv-high-power",
        workspaceId: "ws-aethelgard",
        name: "Thực thể Cấp Vương Quốc (≥ 100K)",
        sigil: "✦",
        filters: { minPower: 100000, sortBy: "powerLevel" }
      },
      {
        id: "sv-canon-scholars",
        workspaceId: "ws-aethelgard",
        name: "Chính sử — Nhân vật Truyền kỳ",
        sigil: "⚝",
        filters: { entryTypeId: "type-character", canonStatus: "canon", sortBy: "powerLevel" }
      }
    ],
    hierarchyCharts: [
      {
        id: "hier-vaelor",
        workspaceId: "ws-aethelgard",
        name: "Phả Hệ Gia Tộc Học Giả Vaelor",
        kind: "genealogy",
        description: "Dòng dõi năm đời các kiến trúc sư và sử gia bảo trợ Tháp Tinh Tú Orakel'on.",
        nodes: [
          { id: "hn-1", label: "Aldric Vaelor I", subtitle: "Khởi tổ · Năm 118", sigil: "⚜", color: "#D4AF37", parentId: null, relationLabel: "Khởi tổ", entryId: "ent-gia-toc-vaelor" },
          { id: "hn-2", label: "Seraphina Vaelor", subtitle: "Đời II · Nữ Thợ Kính Pha Lê", sigil: "✧", color: "#38BDF8", parentId: "hn-1", relationLabel: "Trưởng nữ" },
          { id: "hn-3", label: "Theron Vaelor", subtitle: "Đời II · Hải Đồ Sư Bắc Hải", sigil: "⚓", color: "#60A5FA", parentId: "hn-1", relationLabel: "Thứ nam" },
          { id: "hn-4", label: "Kaelen Vaelor", subtitle: "Đời III · Đại Sứ Hiệp Ước", sigil: "⚖", color: "#F59E0B", parentId: "hn-2", relationLabel: "Kế vị" },
          { id: "hn-5", label: "Lyraen Vaelor", subtitle: "Đời V · Đại Sử Gia Orakel'on", sigil: "⚝", color: "#A78BFA", parentId: "hn-4", relationLabel: "Hậu duệ kiệt xuất", entryId: "ent-lyraen" },
          { id: "hn-6", label: "Elowen Vaelor", subtitle: "Đời V · Học giả Rừng Ngọc", sigil: "ᛇ", color: "#34D399", parentId: "hn-4", relationLabel: "Em gái" }
        ],
        updatedAt: NOW
      }
    ],
    systemRules: [
      {
        id: "sys-astral-resonance",
        workspaceId: "ws-aethelgard",
        name: "Hệ Thống Cộng Hưởng Tinh Tú (Astral Resonance)",
        category: "magic",
        energySource: "Bức xạ ánh sao tụ hội qua thấu kính pha lê và cổ ngữ khắc đá.",
        costAndLimits: "Mọi phép cộng hưởng đều đòi hỏi cân bằng nhiệt năng và sự minh mẫn ký ức; lạm dụng sẽ gây hiện tượng 'Đóng Băng Ký Ức'.",
        description: "Quy luật tự nhiên chi phối học thuật, thiên văn và nghệ thuật cổ ngữ tại Lục địa Aethelgard.",
        elements: ["Tinh Quang", "Băng Triều", "Thái Dương", "Mộc Linh", "Hư Không"],
        matrix: {
          "Tinh Quang::Hư Không": "strong",
          "Băng Triều::Thái Dương": "weak",
          "Thái Dương::Băng Triều": "strong",
          "Mộc Linh::Băng Triều": "synergy",
          "Thái Dương::Mộc Linh": "synergy",
          "Hư Không::Tinh Quang": "nullify",
          "Hư Không::Thái Dương": "strong"
        },
        tiers: [
          { id: "st-1", rank: 1, name: "Học Đồ Quan Sát (Initiate)", requirement: "Đọc hiểu 29 ký tự Cổ ngữ cơ bản", powerHint: "100 – 1K", color: "#94A3B8" },
          { id: "st-2", rank: 2, name: "Tinh Tú Sư (Stargazer)", requirement: "Tự chế tác thấu kính pha lê cộng hưởng", powerHint: "1K – 25K", color: "#38BDF8" },
          { id: "st-3", rank: 3, name: "Đại Học Giả (Lumenor)", requirement: "Được Hội đồng Thiên văn công nhận", powerHint: "25K – 250K", color: "#D4AF37" },
          { id: "st-4", rank: 4, name: "Chưởng Ấn Kỷ Nguyên (Arch-Chronicler)", requirement: "Nắm giữ quy luật thời-không cổ sơ", powerHint: "1M+", color: "#C084FC" }
        ],
        updatedAt: NOW
      }
    ],
    taxonomyNodes: [
      { id: "tax-1", workspaceId: "ws-aethelgard", parentId: null, rank: "Giới", name: "Giới Thực Vật Phát Quang (Luminophyta)", scientificName: "Regnum Luminophyta", biome: "Rừng Ngọc Sylvaris & Cao nguyên", rarity: "Phổ biến", dietOrRole: "Quang hợp ánh sao ban đêm", description: "Nhóm thực vật cổ đại có khả năng tích tụ ánh sáng tinh tú trong nhựa cây.", sigil: "ᛇ", linkedEntryId: "ent-sylvaris" },
      { id: "tax-2", workspaceId: "ws-aethelgard", parentId: "tax-1", rank: "Họ", name: "Họ Cổ Thụ Ngân Diệp", scientificName: "Familia Argentifolia", biome: "Thung lũng ẩm Tây Nguyên", rarity: "Ít gặp", dietOrRole: "Tạo tán rừng che chở hệ sinh thái", description: "Lá có sắc ánh bạc phản chiếu ánh trăng, vỏ cây dùng làm giấy chép cổ thư không mục nát.", sigil: "✦", linkedEntryId: "ent-sylvaris" },
      { id: "tax-3", workspaceId: "ws-aethelgard", parentId: "tax-2", rank: "Loài", name: "Mộc Quang Thụ Ngàn Năm", scientificName: "Sylva Luminaris Aethelis", biome: "Lõi Rừng Ngọc Sylvaris", rarity: "Hiếm", dietOrRole: "Cộng sinh với đom đóm pha lê", description: "Loài cổ thụ cao trên 90 mét, phát ra ánh xanh ngọc dịu nhẹ mỗi dịp Trăng Tròn Ngân Nguyệt.", sigil: "❖", linkedEntryId: "ent-sylvaris" },
      { id: "tax-4", workspaceId: "ws-aethelgard", parentId: null, rank: "Giới", name: "Giới Sinh Vật Bắc Hải (Cryozoa)", scientificName: "Regnum Cryozoa", biome: "Vịnh Bắc Hải & Đảo Băng", rarity: "Ít gặp", dietOrRole: "Sinh vật biển chịu lạnh cực hạn", description: "Hệ động vật tiến hóa quanh các mạch suối địa nhiệt đáy biển phương Bắc.", sigil: "✧", linkedEntryId: "ent-bang-trieu" }
    ],
    tradeCommodities: [
      { id: "com-1", workspaceId: "ws-aethelgard", name: "Thấu Kính Pha Lê Aurelia", category: "Công nghệ", basePrice: 450, unitLabel: "1 bộ thấu kính", rarity: "Độc quyền", originLabel: "Vương quốc Băng Triều", originEntryId: "ent-bang-trieu", tradeRouteNote: "Xuất khẩu độc quyền tới Tháp Tinh Tú Orakel'on và học viện Solaria." },
      { id: "com-2", workspaceId: "ws-aethelgard", name: "Giấy Vỏ Ngân Diệp", category: "Xa xỉ phẩm", basePrice: 85, unitLabel: "1 cuộn 50 tờ", rarity: "Khan hiếm", originLabel: "Rừng Ngọc Sylvaris", originEntryId: "ent-sylvaris", tradeRouteNote: "Được các sử gia săn đón nhờ độ bền trên 500 năm." },
      { id: "com-3", workspaceId: "ws-aethelgard", name: "Rượu Mật Hoàng Kim", category: "Lương thực", basePrice: 30, unitLabel: "1 vò gốm", rarity: "Ổn định", originLabel: "Đế chế Hoàng Kim Solaria", originEntryId: "ent-solaria", tradeRouteNote: "Mặt hàng trao đổi phổ biến trên tuyến thương mại Bắc – Nam." },
      { id: "com-4", workspaceId: "ws-aethelgard", name: "Mực Phát Quang Tinh Tú", category: "Ma pháp", basePrice: 160, unitLabel: "1 lọ pha lê", rarity: "Khan hiếm", originLabel: "Tháp Tinh Tú Orakel'on", originEntryId: "ent-orakel", tradeRouteNote: "Dùng để sao chép bản đồ hải trình đọc được trong bóng tối." }
    ],
    chronicleChapters: [
      {
        id: "chr-1",
        workspaceId: "ws-aethelgard",
        bookTitle: "Biên Niên Sử Kỷ Nguyên Ánh Sao",
        chapterNumber: 1,
        title: "Đêm Ký Kết Tại Tháp Tinh Tú",
        eraLabel: "Năm 305 — Kỷ Nguyên Minh Triết",
        summary: "Ghi chép tường thuật cuộc hội ngộ lịch sử giữa phái đoàn Băng Triều và Solaria.",
        contentMarkdown: `Tuyết đầu mùa rơi nhẹ trên những bậc đá cẩm thạch dẫn lên [[Tháp Tinh Tú Orakel'on]]. Từ phương Bắc xa xôi, thuyền buồm của [[Vương quốc Băng Triều]] mang theo bộ thấu kính pha lê lớn nhất từng được chế tác.

Ở phía đối diện đại sảnh, phái đoàn [[Đế chế Hoàng Kim Solaria]] đặt lên bàn tròn cuộn hiến chương viết bằng [[Cổ ngữ Aethel'va]]. Khi hai dấu ấn cùng in xuống sáp vàng, [[Hiệp ước Ánh Sao]] chính thức khai mở kỷ nguyên hòa bình và trao đổi học thuật xuyên lục địa.

> [!LORE] Ghi chú của sử gia: Bản gốc cuộn hiến chương hiện vẫn được [[Lyraen Vaelor]] bảo quản tại tầng 7 của đại thư viện.`,
        published: true,
        updatedAt: NOW
      },
      {
        id: "chr-2",
        workspaceId: "ws-aethelgard",
        bookTitle: "Biên Niên Sử Kỷ Nguyên Ánh Sao",
        chapterNumber: 2,
        title: "Hành Trình Vào Lõi Rừng Ngọc",
        eraLabel: "Năm 328 — Kỷ Nguyên Minh Triết",
        summary: "Nhật ký khảo sát thực địa các bia đá cổ ngữ trong Rừng Ngọc Sylvaris.",
        contentMarkdown: `Sau mười bốn ngày băng qua cao nguyên sương mù, đoàn khảo sát của [[Lyraen Vaelor]] cuối cùng cũng chạm tới rìa [[Rừng Ngọc Sylvaris]]. Khi Ngân Nguyệt lên cao, hàng ngàn tán cổ thụ đồng loạt tỏa thứ ánh sáng xanh dịu như một dải ngân hà rơi xuống mặt đất.

Trên phiến đá phủ rêu ở trung tâm khu rừng, những ký tự cổ nhất của [[Cổ ngữ Aethel'va]] vẫn còn sắc nét đến kỳ lạ — bằng chứng cho thấy các học giả cổ đại từng coi nơi này là khởi nguồn của mọi ngôn ngữ.`,
        published: true,
        updatedAt: NOW
      }
    ],
    propertyBlueprints: [
      {
        id: "bp-char-full",
        workspaceId: "ws-aethelgard",
        name: "Bộ Thuộc Tính Nhân Vật Chuyên Sâu",
        entryTypeId: "type-character",
        sigil: "⚝",
        fields: [
          { label: "Chiều cao", group: "Ngoại hình", kind: "number", value: "175", unit: "cm", showInInfobox: true, order: 1 },
          { label: "Màu mắt / Tóc", group: "Ngoại hình", kind: "text", value: "", showInInfobox: true, order: 2 },
          { label: "Nét tính cách", group: "Tính cách", kind: "tags", value: "Điềm tĩnh, Quyết đoán", color: "#A78BFA", showInInfobox: true, order: 3 },
          { label: "Mức độ ảnh hưởng", group: "Đánh giá", kind: "rating", value: "4", color: "#FBBF24", showInInfobox: true, order: 4 }
        ],
        createdAt: NOW
      },
      {
        id: "bp-lang-study",
        workspaceId: "ws-aethelgard",
        name: "Bộ Thuộc Tính Khảo Cứu Cổ Ngữ",
        entryTypeId: "type-language",
        sigil: "ᚨ",
        fields: [
          { label: "Tỷ lệ đã giải mã", group: "Học thuật", kind: "progress", value: "80", color: "#C084FC", showInInfobox: true, order: 1 },
          { label: "Độ khó ngữ âm", group: "Học thuật", kind: "rating", value: "4", color: "#38BDF8", showInInfobox: true, order: 2 },
          { label: "Phương ngữ tiêu biểu", group: "Phân bố", kind: "tags", value: "Cổ điển, Học viện", color: "#A78BFA", showInInfobox: true, order: 3 }
        ],
        createdAt: NOW
      }
    ],
    holdings: [
      {
        id: "hld-1",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-bang-trieu",
        targetEntryId: "ent-aurelia",
        customName: "Kinh đô Aurelia",
        holdingKind: "city",
        roleLabel: "Thủ đô & Thương cảng chính",
        status: "active",
        eraNote: "Từ Năm 120 đến nay",
        summary: "Trái tim hành chính, thương mại và xưởng chế tác thấu kính lớn nhất phương Bắc.",
        createdAt: NOW
      },
      {
        id: "hld-2",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-bang-trieu",
        targetEntryId: "ent-sylvaris",
        customName: "Rừng Ngọc Sylvaris",
        holdingKind: "territory",
        roleLabel: "Khu Bảo tồn Sinh thái Biên giới Tây",
        status: "active",
        eraNote: "Hiệp định Bảo tồn Năm 280",
        summary: "Vùng rừng phát quang cổ thụ do Băng Triều đồng bảo vệ và cấp phép khảo cổ.",
        createdAt: NOW
      },
      {
        id: "hld-3",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-bang-trieu",
        targetEntryId: "ent-gia-toc-vaelor",
        customName: "Gia tộc Vaelor",
        holdingKind: "vassal",
        roleLabel: "Đại Gia tộc Học thuật & Hải đồ",
        status: "active",
        eraNote: "Năm đời kế thừa",
        summary: "Gia tộc phụ trách Đồi Kính Thiên Văn và công tác lưu trữ sử liệu của vương quốc.",
        createdAt: NOW
      },
      {
        id: "hld-4",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-bang-trieu",
        targetEntryId: null,
        customName: "Pháo đài Băng Tâm (Cực Bắc)",
        holdingKind: "fortress",
        roleLabel: "Trạm Quan trắc & Tiền đồn Bắc Hải",
        status: "active",
        eraNote: "Xây dựng Năm 198",
        summary: "Tiền đồn đá đen nằm trên mũi đảo băng cực Bắc, theo dõi dòng hải lưu và bão tuyết.",
        createdAt: NOW
      },
      {
        id: "hld-5",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-hoi-dong-thien-van",
        targetEntryId: "ent-orakel",
        customName: "Tháp Tinh Tú Orakel'on",
        holdingKind: "headquarters",
        roleLabel: "Trụ sở Chính & Đại Thư viện Trung lập",
        status: "active",
        eraNote: "Bảo hộ theo Hiệp ước Ánh Sao năm 305",
        summary: "Đại thư viện chín tầng và đài thiên văn trung tâm của toàn lục địa.",
        createdAt: NOW
      },
      {
        id: "hld-6",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-hoi-dong-thien-van",
        targetEntryId: "ent-thien-cau-pha-le",
        customName: "Thiên cầu Pha Lê Aurelia",
        holdingKind: "artifact",
        roleLabel: "Bảo vật Trưng bày Tầng 9",
        status: "active",
        eraNote: "Từ Năm 308",
        summary: "Mô hình bầu trời cơ khí chuẩn xác nhất lục địa đặt tại sảnh đài thiên văn.",
        createdAt: NOW
      },
      {
        id: "hld-7",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-gia-toc-vaelor",
        targetEntryId: "ent-hai-do-arion",
        customName: "Hải Đồ Vàng Của Thuyền Trưởng Arion",
        holdingKind: "artifact",
        roleLabel: "Gia bảo Truyền đời",
        status: "active",
        eraNote: "Từ Năm 118",
        summary: "Tấm hải đồ đồng thau khắc cổ ngữ dẫn đường khai lập vịnh Aurelia.",
        createdAt: NOW
      },
      {
        id: "hld-8",
        workspaceId: "ws-aethelgard",
        ownerEntryId: "ent-solaria",
        targetEntryId: null,
        customName: "Thành Thái Dương Solaria",
        holdingKind: "city",
        roleLabel: "Kinh đô Phương Nam",
        status: "active",
        eraNote: "Từ Năm 45",
        summary: "Đô thị bằng đá sa thạch vàng rực rỡ và trung tâm Học viện Hoàng Kim.",
        createdAt: NOW
      }
    ],
    publishTargets: [
      { id: "pub-default", name: "Cổng Công Khai Nội Bộ (/public)", provider: "custom", webhookUrl: process.env.DEPLOY_WEBHOOK_URL || "", publicBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", enabled: true, createdAt: NOW }
    ],
    publishSnapshots: [
      { id: "snap-1", workspaceId: "ws-aethelgard", workspaceSlug: "luc-dia-aethelgard", version: 1, publishedBy: "Đại Học Giả (Admin)", publicEntryCount: 10, webhookTriggered: false, webhookStatus: "Đã đồng bộ cổng công khai", publicUrl: "/public/luc-dia-aethelgard", note: "Xuất bản lần đầu Biên niên sử Lục địa Aethelgard V2.0", createdAt: NOW }
    ]
  };
}
