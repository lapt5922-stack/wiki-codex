export interface EntityBlueprintPreset {
  id: string;
  label: string;
  sigil: string;
  icon: string;
  suggestedTypeSlug: string;
  defaultTags: string[];
  summaryTemplate: string;
  contentMarkdown: string;
}

/**
 * #2: 12 Instant Pure-Wiki Encyclopedic Blueprint Presets for rapid entity creation.
 */
export const ENTITY_BLUEPRINT_PRESETS: EntityBlueprintPreset[] = [
  {
    id: "bp-kingdom",
    label: "Vương quốc / Quốc gia",
    sigil: "⚜",
    icon: "Castle",
    suggestedTypeSlug: "vuong-quoc",
    defaultTags: ["quoc-gia", "dia-chinh-tri", "chinh-su"],
    summaryTemplate: "Chính thể địa chính trị tọa lạc tại [Lục địa], đặt thủ đô tại [Thủ đô] và nổi tiếng với [Đặc trưng văn hóa].",
    contentMarkdown: `## Tổng quan Địa chính trị\n\nGiới thiệu vị trí địa lý, quy mô dân cư và vai trò trong khu vực[^1].\n\n## Địa lý, Khí hậu & Hệ sinh thái\n\n- **Vị trí**: Tọa độ và vùng tiếp giáp.\n- **Khí hậu**: Đặc điểm nhiệt độ, mùa và địa hình.\n\n## Thể chế, Luật pháp & Hành chính\n\nMô tả cơ cấu quản trị, ngôn ngữ hành chính và các tỉnh trực thuộc.\n\n## Ngoại giao & Giao thương\n\n- Quan hệ với [[Liên bang Hoàng gia Valoria]] và các quốc gia láng giềng.\n\n[^1]: Văn khố Niên giám Hành tinh Aethelgard Prime.`,
  },
  {
    id: "bp-character",
    label: "Nhân vật Lịch sử",
    sigil: "⚝",
    icon: "User",
    suggestedTypeSlug: "nhan-vat",
    defaultTags: ["nhan-vat", "tieu-su"],
    summaryTemplate: "Nhân vật lịch sử / học giả / nhà lập pháp có đóng góp quan trọng trong giai đoạn [Kỷ nguyên].",
    contentMarkdown: `## Tiểu sử & Xuất thân\n\nGhi nhận quê quán, gia tộc và bối cảnh trưởng thành[^1].\n\n## Sự nghiệp & Đóng góp Nổi bật\n\n- **Giai đoạn đầu**: Những công trình hoặc dấu ấn khởi đầu.\n- **Giai đoạn đỉnh cao**: Các hiệp ước, tác phẩm hoặc cải cách tiêu biểu.\n\n## Tư tưởng, Tính cách & Di sản\n\nĐánh giá của hậu thế về ảnh hưởng lịch sử của nhân vật.\n\n[^1]: Biên niên sử Nhân vật, Viện Lưu trữ Tam Biên.`,
  },
  {
    id: "bp-city",
    label: "Đô thị / Thành phố",
    sigil: "❂",
    icon: "Building2",
    suggestedTypeSlug: "do-thi",
    defaultTags: ["do-thi", "kien-truc"],
    summaryTemplate: "Trung tâm đô thị, thương cảng hoặc thủ phủ hành chính thuộc [Quốc gia].",
    contentMarkdown: `## Vị trí & Quy hoạch Đô thị\n\nMô tả địa thế tự nhiên, hệ thống tường thành, kênh đào và các quận chính.\n\n## Kiến trúc & Công trình Tiêu biểu\n\n- **Khu Hành chính**: Trụ sở hội đồng và quảng trường trung tâm.\n- **Khu Văn hóa & Thư viện**: Các viện lưu trữ và trường học.\n\n## Kinh tế & Đời sống Cư dân\n\nThương mại, nghề thủ công và lễ hội thường niên của thành phố.`,
  },
  {
    id: "bp-landmark",
    label: "Địa danh & Kỳ quan",
    sigil: "◈",
    icon: "Mountain",
    suggestedTypeSlug: "dia-danh",
    defaultTags: ["dia-danh", "tu-nhien"],
    summaryTemplate: "Địa danh tự nhiên hoặc kỳ quan kiến trúc nổi bật nằm tại [Khu vực].",
    contentMarkdown: `## Đặc điểm Địa chất & Cảnh quan\n\nMô tả quy mô, độ cao, khí hậu và cấu tạo địa chất đặc thù.\n\n## Lịch sử Khảo sát & Khám phá\n\nCác đoàn thám hiểm và ghi chép trắc địa sớm nhất về địa danh này.\n\n## Giá trị Văn hóa & Bảo tồn\n\nÝ nghĩa đối với cư dân bản địa và các quy định bảo tồn hiện hành.`,
  },
  {
    id: "bp-organization",
    label: "Tổ chức / Học phái",
    sigil: "⛨",
    icon: "Shield",
    suggestedTypeSlug: "to-chuc",
    defaultTags: ["to-chuc", "hoc-thuat"],
    summaryTemplate: "Tổ chức học thuật, hội đồng ngoại giao hoặc hiệp hội thương mại hoạt động xuyên biên giới.",
    contentMarkdown: `## Sứ mệnh & Hiến chương Thành lập\n\nBối cảnh ra đời, người sáng lập và tôn chỉ hoạt động.\n\n## Cơ cấu Tổ chức & Chi nhánh\n\n- **Trụ sở chính**: Đặt tại [Thành phố].\n- **Các phân ban**: Lưu trữ, Khảo sát, Ngoại giao.\n\n## Thành tựu & Ảnh hưởng Lịch sử\n\nNhững đóng góp tiêu biểu cho tri thức và hòa bình khu vực.`,
  },
  {
    id: "bp-house",
    label: "Gia tộc / Dòng họ",
    sigil: "ᛟ",
    icon: "GitBranch",
    suggestedTypeSlug: "gia-toc",
    defaultTags: ["gia-toc", "pha-he"],
    summaryTemplate: "Đại gia tộc lịch sử gắn liền với truyền thống học thuật, lập pháp hoặc thương mại tại [Quốc gia].",
    contentMarkdown: `## Nguồn gốc & Gia huy\n\nÝ nghĩa gia huy, gia huấn và vùng đất phát tích.\n\n## Các Đời Nhân vật Kiệt xuất\n\n- **Đời I**: Người đặt nền móng.\n- **Các thế hệ kế cận**: Những nhân vật nổi tiếng.\n\n## Di sản & Quan hệ Liên minh\n\nẢnh hưởng văn hóa, thư viện gia tộc và quan hệ với các dòng họ khác.`,
  },
  {
    id: "bp-artifact",
    label: "Cổ vật & Tác phẩm",
    sigil: "❖",
    icon: "Gem",
    suggestedTypeSlug: "co-vat",
    defaultTags: ["co-vat", "di-san"],
    summaryTemplate: "Hiện vật khảo cổ, bản thảo cổ thư hoặc khí cụ thiên văn quý hiếm có niên đại từ [Kỷ nguyên].",
    contentMarkdown: `## Mô tả Hình thái & Chất liệu\n\nKích thước, vật liệu chế tác, hoa văn và ký tự cổ ngữ khắc trên hiện vật.\n\n## Lịch sử Lưu truyền\n\nQuá trình phát hiện, bảo quản và nơi trưng bày hiện tại.\n\n## Giá trị Nghiên cứu\n\nNhững bí mật lịch sử hoặc khoa học được giải mã từ hiện vật.`,
  },
  {
    id: "bp-creature",
    label: "Sinh vật & Thực vật học",
    sigil: "ᛇ",
    icon: "Leaf",
    suggestedTypeSlug: "sinh-vat",
    defaultTags: ["sinh-hoc", "he-sinh-thai"],
    summaryTemplate: "Loài sinh vật hoặc thực vật bản địa đặc hữu của hệ sinh thái [Hệ sinh thái].",
    contentMarkdown: `## Phân loại & Phân bố Địa lý\n\nVùng sinh sống chủ yếu, biên độ nhiệt độ và độ cao thích nghi.\n\n## Đặc điểm Hình thái & Tập tính\n\nCấu tạo sinh học, chu kỳ sinh trưởng và vai trò trong chuỗi thức ăn.\n\n## Ứng dụng & Bảo tồn\n\nGiá trị dược liệu, nông nghiệp hoặc tình trạng bảo tồn tự nhiên.`,
  },
  {
    id: "bp-language",
    label: "Cổ ngữ / Ngôn ngữ",
    sigil: "ᚨ",
    icon: "Languages",
    suggestedTypeSlug: "co-ngu",
    defaultTags: ["ngon-ngu", "van-tu"],
    summaryTemplate: "Hệ ngôn ngữ và văn tự hành chính sử dụng tại [Khu vực / Lục địa].",
    contentMarkdown: `## Ngữ hệ & Phạm vi Sử dụng\n\nNguồn gốc phát triển và các phương ngữ khu vực chính.\n\n## Hệ thống Văn tự & Ngữ âm\n\nĐặc điểm bảng chữ cái, quy tắc ghép âm và cách viết trên bia đá / giấy da.\n\n## Tư liệu & Từ vựng Tiêu biểu\n\nMột số thuật ngữ cổ điển thường gặp trong sử ký.`,
  },
  {
    id: "bp-religion",
    label: "Tín ngưỡng & Triết học",
    sigil: "✶",
    icon: "Orbit",
    suggestedTypeSlug: "ton-giao",
    defaultTags: ["triet-hoc", "van-hoa"],
    summaryTemplate: "Hệ thống triết lý, tín ngưỡng thiên văn hoặc truyền thống đạo đức cổ đại.",
    contentMarkdown: `## Khởi nguyên & Kinh điển\n\nBối cảnh hình thành và các văn bản nền tảng.\n\n## Giáo lý & Nghi lễ Tiêu biểu\n\nCác ngày lễ theo chu kỳ mặt trăng, quy tắc ứng xử và biểu tượng.\n\n## Ảnh hưởng tới Kiến trúc & Nghệ thuật\n\nDấu ấn trong đền đài, lịch pháp và văn học.`,
  },
  {
    id: "bp-event",
    label: "Sự kiện Lịch sử",
    sigil: "✹",
    icon: "Hourglass",
    suggestedTypeSlug: "su-kien",
    defaultTags: ["su-kien", "bien-nien-su"],
    summaryTemplate: "Biến cố lịch sử hoặc hội nghị ngoại giao diễn ra vào [Năm / Kỷ nguyên].",
    contentMarkdown: `## Bối cảnh & Nguyên nhân\n\nTình hình địa chính trị dẫn đến sự kiện.\n\n## Diễn biến Chính\n\n- **Mở đầu**: Các mốc sự kiện khởi phát.\n- **Bước ngoặt**: Quyết định hoặc thỏa thuận mang tính lịch sử.\n\n## Hệ quả & Di sản Lâu dài\n\nTác động đối với biên giới, thương mại và các thế hệ sau.`,
  },
  {
    id: "bp-treaty",
    label: "Hiệp ước & Văn hiến",
    sigil: "⚖",
    icon: "Scale",
    suggestedTypeSlug: "van-hien",
    defaultTags: ["hiep-uoc", "ngoai-giao", "phap-ly"],
    summaryTemplate: "Văn kiện ngoại giao hoặc bộ luật liên quốc gia được ký kết giữa các chính thể.",
    contentMarkdown: `## Các Bên Ký Kết & Thời Điểm\n\nLiệt kê các quốc gia tham gia ký kết và địa điểm lưu giữ bản gốc.\n\n## Các Điều Khoản Cốt Lõi\n\n1. **Điều I — Biên giới & Chủ quyền**: ...\n2. **Điều II — Thông thương & Lưu trữ**: ...\n3. **Điều III — Cơ chế Hòa giải**: ...\n\n## Hiệu Lực & Đánh Giá Lịch Sử\n\nVai trò của hiệp ước trong việc duy trì ổn định khu vực.`,
  },
];
