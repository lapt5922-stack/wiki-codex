import type { OrnamentId, SymbolCategoryId } from "@/types/heraldry";

export interface HeraldicSymbolDef {
  id: string;
  name: string;
  category: SymbolCategoryId;
  tags: string[];
  /** Pure vector SVG inner markup centered in a 100x100 viewBox (-50..50) */
  svgInner: string;
}

export const SYMBOL_CATEGORY_LABELS: Record<SymbolCategoryId, string> = {
  animals: "Động vật & Thần thú",
  royal: "Hoàng gia & Vương quyền",
  nature: "Thiên nhiên & Vũ trụ",
  arcane: "Huyền bí & Ma pháp",
  civilization: "Văn minh & Học viện"
};

export const HERALDIC_SYMBOLS: HeraldicSymbolDef[] = [
  // 1. ANIMALS & MYTHICAL CREATURES
  {
    id: "sym-lion",
    name: "Sư tử Hoàng gia",
    category: "animals",
    tags: ["sư tử", "lion", "hoàng gia", "dũng mãnh"],
    svgInner: `<path d="M-24 34 L-18 8 L-30 -6 L-20 -26 L-4 -36 L14 -30 L24 -14 L18 4 L28 24 L14 36 L4 20 L-8 36 Z" fill="currentColor"/><circle cx="4" cy="-18" r="3" fill="#101522"/>`
  },
  {
    id: "sym-eagle",
    name: "Đại bàng Tung cánh",
    category: "animals",
    tags: ["đại bàng", "eagle", "đế chế"],
    svgInner: `<path d="M0 -36 L8 -22 L44 -28 L34 -4 L40 10 L14 8 L18 36 L0 26 L-18 36 L-14 8 L-40 10 L-34 -4 L-44 -28 L-8 -22 Z" fill="currentColor"/>`
  },
  {
    id: "sym-double-eagle",
    name: "Đại bàng Hai đầu Đế chế",
    category: "animals",
    tags: ["đại bàng hai đầu", "imperial", "byzantine"],
    svgInner: `<path d="M-14 -34 L-4 -20 L4 -20 L14 -34 L18 -18 L46 -26 L36 0 L42 14 L14 12 L20 36 L0 26 L-20 36 L-14 12 L-42 14 L-36 0 L-46 -26 L-18 -18 Z" fill="currentColor"/>`
  },
  {
    id: "sym-dragon",
    name: "Rồng Cổ đại",
    category: "animals",
    tags: ["rồng", "dragon", "huyền thoại"],
    svgInner: `<path d="M-36 -20 L-12 -34 L10 -24 L36 -32 L26 -4 L38 14 L12 18 L24 36 L-2 28 L-24 38 L-16 12 L-38 4 Z" fill="currentColor"/>`
  },
  {
    id: "sym-phoenix",
    name: "Phượng hoàng Bất tử",
    category: "animals",
    tags: ["phượng hoàng", "phoenix", "lửa"],
    svgInner: `<path d="M0 -40 L10 -20 L42 -30 L28 -2 L38 16 L10 12 L0 40 L-10 12 L-38 16 L-28 -2 L-42 -30 L-10 -20 Z" fill="currentColor"/>`
  },
  {
    id: "sym-wolf",
    name: "Sói Phương Bắc",
    category: "animals",
    tags: ["sói", "wolf", "bắc"],
    svgInner: `<path d="M-28 -32 L-10 -14 L10 -14 L28 -32 L26 6 L16 26 L0 38 L-16 26 L-26 6 Z" fill="currentColor"/><polygon points="-10,-2 -4,4 -12,6" fill="#101522"/><polygon points="10,-2 4,4 12,6" fill="#101522"/>`
  },
  {
    id: "sym-stag",
    name: "Hươu Gạc Vàng",
    category: "animals",
    tags: ["hươu", "stag", "rừng"],
    svgInner: `<path d="M-34 -34 L-18 -12 L-8 -28 L-4 -10 L4 -10 L8 -28 L18 -12 L34 -34 L22 -4 L14 8 L12 34 L0 40 L-12 34 L-14 8 L-22 -4 Z" fill="currentColor"/>`
  },
  {
    id: "sym-griffin",
    name: "Griffin Bảo hộ",
    category: "animals",
    tags: ["griffin", "thần thú"],
    svgInner: `<path d="M-32 -26 L-6 -34 L18 -18 L40 -26 L26 4 L32 32 L8 24 L-12 36 L-24 14 L-38 2 Z" fill="currentColor"/>`
  },
  {
    id: "sym-owl",
    name: "Cú Trí tuệ",
    category: "animals",
    tags: ["cú", "owl", "học viện"],
    svgInner: `<path d="M-24 -30 L-10 -20 L10 -20 L24 -30 L28 6 C28 24 14 36 0 38 C-14 36 -28 24 -28 6 Z" fill="currentColor"/><circle cx="-10" cy="-6" r="5" fill="#101522"/><circle cx="10" cy="-6" r="5" fill="#101522"/>`
  },
  {
    id: "sym-unicorn",
    name: "Kỳ lân Bạch ngân",
    category: "animals",
    tags: ["kỳ lân", "unicorn", "thuần khiết"],
    svgInner: `<path d="M0 -42 L6 -16 L24 -10 L18 14 L26 36 L-18 36 L-24 10 L-12 -14 Z" fill="currentColor"/>`
  },

  // 2. ROYAL SYMBOLS
  {
    id: "sym-crown",
    name: "Vương miện Đế chế",
    category: "royal",
    tags: ["vương miện", "crown", "hoàng gia"],
    svgInner: `<path d="M-36 22 L-40 -14 L-18 4 L0 -26 L18 4 L40 -14 L36 22 Z" fill="currentColor"/><rect x="-36" y="26" width="72" height="10" rx="3" fill="currentColor"/>`
  },
  {
    id: "sym-sword",
    name: "Thánh kiếm Hoàng gia",
    category: "royal",
    tags: ["kiếm", "sword", "quân đoàn"],
    svgInner: `<path d="M0 -42 L8 -28 L6 12 L24 12 L24 19 L6 19 L6 34 L12 40 L-12 40 L-6 34 L-6 19 L-24 19 L-24 12 L-6 12 L-8 -28 Z" fill="currentColor"/>`
  },
  {
    id: "sym-crossed-swords",
    name: "Song kiếm Giao nhau",
    category: "royal",
    tags: ["song kiếm", "quân sự", "chiến thắng"],
    svgInner: `<g fill="currentColor"><path d="M-32 -32 L-22 -36 L26 12 L34 6 L38 12 L28 22 L36 32 L28 38 L18 28 L8 38 L4 32 L12 22 Z"/><path d="M32 -32 L22 -36 L-26 12 L-34 6 L-38 12 L-28 22 L-36 32 L-28 38 L-18 28 L-8 38 L-4 32 L-12 22 Z"/></g>`
  },
  {
    id: "sym-scepter",
    name: "Quyền trượng Vương triều",
    category: "royal",
    tags: ["quyền trượng", "scepter"],
    svgInner: `<g fill="currentColor"><rect x="-4" y="-14" width="8" height="54" rx="3"/><polygon points="0,-42 14,-24 0,-8 -14,-24"/><circle cx="-18" cy="-24" r="5"/><circle cx="18" cy="-24" r="5"/></g>`
  },
  {
    id: "sym-key",
    name: "Chìa khóa Hoàng gia",
    category: "royal",
    tags: ["chìa khóa", "key", "kho báu"],
    svgInner: `<g fill="currentColor"><path d="M0 -38 A16 16 0 1 0 0 -6 A16 16 0 1 0 0 -38 Z M0 -30 A8 8 0 1 1 0 -14 A8 8 0 1 1 0 -30 Z"/><rect x="-4" y="-8" width="8" height="48" rx="2"/><rect x="4" y="18" width="14" height="6"/><rect x="4" y="28" width="10" height="6"/></g>`
  },
  {
    id: "sym-laurel",
    name: "Vòng Nguyệt quế Chiến thắng",
    category: "royal",
    tags: ["nguyệt quế", "laurel", "vinh quang"],
    svgInner: `<path d="M-12 34 C-36 20 -40 -12 -18 -34 C-26 -10 -22 14 -6 26 Z M12 34 C36 20 40 -12 18 -34 C26 -10 22 14 6 26 Z" fill="currentColor"/>`
  },

  // 3. NATURE & COSMOS
  {
    id: "sym-sun",
    name: "Thái dương Rực rỡ",
    category: "nature",
    tags: ["mặt trời", "sun", "ánh sáng"],
    svgInner: `<g fill="currentColor"><circle cx="0" cy="0" r="16"/><polygon points="0,-42 5,-22 -5,-22"/><polygon points="0,42 5,22 -5,22"/><polygon points="-42,0 -22,5 -22,-5"/><polygon points="42,0 22,5 22,-5"/><polygon points="-30,-30 -14,-20 -20,-14"/><polygon points="30,-30 14,-20 20,-14"/><polygon points="-30,30 -14,20 -20,14"/><polygon points="30,30 14,20 20,14"/></g>`
  },
  {
    id: "sym-moon",
    name: "Trăng lưỡi liềm Cổ đại",
    category: "nature",
    tags: ["mặt trăng", "moon", "đêm"],
    svgInner: `<path d="M16 -34 A34 34 0 1 0 16 34 A24 24 0 1 1 16 -34 Z" fill="currentColor"/>`
  },
  {
    id: "sym-star",
    name: "Tinh tú Tám cánh",
    category: "nature",
    tags: ["ngôi sao", "star", "tinh tú"],
    svgInner: `<polygon points="0,-42 9,-9 42,0 9,9 0,42 -9,9 -42,0 -9,-9" fill="currentColor"/>`
  },
  {
    id: "sym-mountain",
    name: "Sơn mạch Tuyết phủ",
    category: "nature",
    tags: ["núi", "mountain", "địa lý"],
    svgInner: `<g fill="currentColor"><polygon points="-40,30 -10,-28 20,30"/><polygon points="-4,30 20,-14 42,30" opacity="0.8"/></g>`
  },
  {
    id: "sym-waves",
    name: "Hải dương & Sóng biển",
    category: "nature",
    tags: ["biển", "sóng", "hải cảng"],
    svgInner: `<g stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round"><path d="M-36 -10 Q-18 -26 0 -10 T36 -10"/><path d="M-36 10 Q-18 -6 0 10 T36 10"/><path d="M-30 28 Q-15 16 0 28 T30 28"/></g>`
  },
  {
    id: "sym-tree",
    name: "Cây Cổ thụ Thế giới",
    category: "nature",
    tags: ["cây", "tree", "rừng"],
    svgInner: `<g fill="currentColor"><polygon points="0,-40 -26,-2 26,-2"/><polygon points="0,-20 -34,18 34,18"/><rect x="-7" y="18" width="14" height="22" rx="2"/></g>`
  },
  {
    id: "sym-flame",
    name: "Ngọn lửa Vĩnh cửu",
    category: "nature",
    tags: ["lửa", "flame", "nhiệt"],
    svgInner: `<path d="M0 -40 C16 -18 28 -4 26 14 C24 30 12 38 0 38 C-14 38 -26 28 -26 12 C-26 -4 -12 -14 -8 -26 C-4 -16 4 -24 0 -40 Z" fill="currentColor"/>`
  },
  {
    id: "sym-rose",
    name: "Hoa hồng Hoàng gia",
    category: "nature",
    tags: ["hoa hồng", "rose", "quý tộc"],
    svgInner: `<g fill="currentColor"><circle cx="0" cy="-16" r="14"/><circle cx="15" cy="-5" r="14"/><circle cx="10" cy="14" r="14"/><circle cx="-10" cy="14" r="14"/><circle cx="-15" cy="-5" r="14"/><circle cx="0" cy="0" r="8" fill="#101522"/></g>`
  },

  // 4. ARCANE & MYSTIC
  {
    id: "sym-magic-circle",
    name: "Vòng tròn Ma pháp",
    category: "arcane",
    tags: ["ma pháp", "magic circle", "arcane"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="3.5"><circle cx="0" cy="0" r="36"/><circle cx="0" cy="0" r="24" stroke-dasharray="5 5"/><polygon points="0,-34 29,18 -29,18"/><polygon points="0,34 29,-18 -29,-18"/></g>`
  },
  {
    id: "sym-mystic-eye",
    name: "Thiên nhãn Huyền bí",
    category: "arcane",
    tags: ["con mắt", "eye", "tri thức"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="4"><path d="M-40 0 Q0 -30 40 0 Q0 30 -40 0 Z"/><circle cx="0" cy="0" r="12" fill="currentColor"/></g>`
  },
  {
    id: "sym-rune",
    name: "Cổ tự Rune Năng lượng",
    category: "arcane",
    tags: ["rune", "cổ ngữ", "glyph"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M0 -38 V38 M0 -36 L22 -14 L0 6 M0 -8 L-22 14 L0 36"/></g>`
  },
  {
    id: "sym-crystal",
    name: "Tinh thể Aether",
    category: "arcane",
    tags: ["tinh thể", "crystal", "aether"],
    svgInner: `<polygon points="0,-42 24,-10 14,38 -14,38 -24,-10" fill="currentColor"/>`
  },

  // 5. CIVILIZATION & ORGANIZATIONS
  {
    id: "sym-book",
    name: "Cổ thư Tri thức",
    category: "civilization",
    tags: ["sách", "book", "thư viện", "học viện"],
    svgInner: `<path d="M-38 -22 Q-18 -30 0 -20 Q18 -30 38 -22 V26 Q18 18 0 28 Q-18 18 -38 26 Z" fill="currentColor"/>`
  },
  {
    id: "sym-tower",
    name: "Tháp Canh & Thành trì",
    category: "civilization",
    tags: ["tháp", "tower", "thành phố"],
    svgInner: `<path d="M-24 -36 H-14 V-26 H-5 V-36 H5 V-26 H14 V-36 H24 V-16 H18 V36 H-18 V-16 H-24 Z" fill="currentColor"/>`
  },
  {
    id: "sym-scales",
    name: "Cán cân Công lý",
    category: "civilization",
    tags: ["cán cân", "scales", "hội đồng"],
    svgInner: `<g stroke="currentColor" stroke-width="4.5" fill="none" stroke-linecap="round"><path d="M0 -34 V32 M-30 -20 H30 M-18 32 H18"/><polygon points="-30,-20 -40,6 -20,6" fill="currentColor" fill-opacity="0.35"/><polygon points="30,-20 20,6 40,6" fill="currentColor" fill-opacity="0.35"/></g>`
  },
  {
    id: "sym-compass",
    name: "La bàn Hàng hải",
    category: "civilization",
    tags: ["la bàn", "compass", "thám hiểm"],
    svgInner: `<g fill="currentColor"><polygon points="0,-40 10,-6 0,40 -10,-6"/><polygon points="-40,0 -6,-10 40,0 -6,10" opacity="0.72"/></g>`
  },
  {
    id: "sym-gear",
    name: "Bánh răng Công nghệ",
    category: "civilization",
    tags: ["bánh răng", "gear", "công nghệ"],
    svgInner: `<g fill="currentColor"><circle cx="0" cy="0" r="24"/><rect x="-6" y="-38" width="12" height="76" rx="3"/><rect x="-38" y="-6" width="76" height="12" rx="3"/><circle cx="0" cy="0" r="10" fill="#101522"/></g>`
  },
  {
    id: "sym-torch",
    name: "Ngọn đuốc Khai sáng",
    category: "civilization",
    tags: ["đuốc", "torch", "học viện"],
    svgInner: `<g fill="currentColor"><path d="M0 -42 C14 -24 16 -12 0 -4 C-16 -12 -14 -24 0 -42 Z"/><path d="M-14 0 H14 L8 38 H-8 Z"/></g>`
  }
];

export const EXTERNAL_ORNAMENTS: Array<{ id: OrnamentId; label: string; description: string }> = [
  { id: "none", label: "Không trang trí ngoài", description: "Giữ dáng khiên tinh gọn" },
  { id: "imperial_crown", label: "Vương miện Đế chế", description: "Đặt trang trọng trên đỉnh khiên" },
  { id: "royal_crown", label: "Vương miện Vương quốc", description: "Vương miện 5 đỉnh cổ điển" },
  { id: "laurel_wreath", label: "Vòng Nguyệt quế", description: "Ôm hai bên hông khiên" },
  { id: "supporters_wings", label: "Đôi Cánh Bảo hộ", description: "Hai cánh uy nghi chầu hai bên" },
  { id: "royal_mantle", label: "Áo choàng Hoàng gia", description: "Màn trướng quyền uy phía sau" },
  { id: "decorative_frame", label: "Khung Viền Ấn triện", description: "Vòng tròn ấn triện cổ điển" },
  { id: "arcane_halo", label: "Hào quang Thiên văn", description: "Vòng tinh tú huyền bí phía sau" },
  { id: "crest_stars", label: "Chòm sao Đỉnh khiên", description: "3 ngôi sao hoàng gia trên đỉnh" }
];
