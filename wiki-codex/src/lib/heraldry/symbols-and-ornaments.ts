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
  {
    id: "sym-bear",
    name: "Gấu Bắc Địa",
    category: "animals",
    tags: ["gấu", "bear", "sức mạnh", "phương bắc"],
    svgInner: `<path d="M-26 -28 A8 8 0 1 1 -14 -24 L14 -24 A8 8 0 1 1 26 -28 L32 -4 L24 22 L12 36 L-12 36 L-24 22 L-32 -4 Z" fill="currentColor"/><circle cx="-10" cy="-6" r="3" fill="#101522"/><circle cx="10" cy="-6" r="3" fill="#101522"/><polygon points="-6,8 6,8 0,15" fill="#101522"/>`
  },
  {
    id: "sym-horse",
    name: "Chiến mã Hoàng gia",
    category: "animals",
    tags: ["ngựa", "chiến mã", "horse", "kỵ binh"],
    svgInner: `<path d="M-12 -38 L8 -28 L26 -8 L16 6 L4 2 L16 36 L-22 36 L-26 6 L-18 -20 Z" fill="currentColor"/><circle cx="6" cy="-16" r="2.8" fill="#101522"/>`
  },
  {
    id: "sym-serpent",
    name: "Mãng xà Cổ đại",
    category: "animals",
    tags: ["rắn", "serpent", "trí tuệ", "bí ẩn"],
    svgInner: `<path d="M0 -38 C24 -34 28 -14 6 -6 C-18 2 -20 22 4 28 C18 32 22 38 6 40 C-18 38 -30 20 -24 2 C-18 -14 8 -14 6 -24 C4 -30 -10 -28 -16 -22 L-22 -30 C-14 -38 -6 -38 0 -38 Z" fill="currentColor"/>`
  },
  {
    id: "sym-tiger",
    name: "Mãnh hổ Vương triều",
    category: "animals",
    tags: ["hổ", "tiger", "quân đoàn"],
    svgInner: `<path d="M-32 -24 L-16 -32 L-8 -20 L8 -20 L16 -32 L32 -24 L28 8 L14 34 L0 40 L-14 34 L-28 8 Z" fill="currentColor"/><path d="M-18 -6 L-6 -2 M18 -6 L6 -2 M-14 14 L0 20 L14 14" stroke="#101522" stroke-width="3.5" fill="none"/>`
  },
  {
    id: "sym-raven",
    name: "Quạ Đen Tiên tri",
    category: "animals",
    tags: ["quạ", "raven", "tiên tri", "bóng tối"],
    svgInner: `<path d="M-4 -38 L10 -24 L42 -16 L24 2 L32 20 L8 14 L0 38 L-10 14 L-34 20 L-24 2 L-42 -16 L-14 -24 Z" fill="currentColor"/>`
  },
  {
    id: "sym-wyvern",
    name: "Wyvern Hộ vệ",
    category: "animals",
    tags: ["wyvern", "rồng cánh", "thần thú"],
    svgInner: `<path d="M-28 -36 L-8 -20 L14 -34 L40 -14 L20 6 L34 26 L8 18 L0 40 L-16 24 L-36 10 L-22 -8 Z" fill="currentColor"/>`
  },
  {
    id: "sym-boar",
    name: "Lợn rừng Chiến trận",
    category: "animals",
    tags: ["boar", "dũng cảm", "quý tộc"],
    svgInner: `<path d="M-34 10 L-24 -22 L0 -32 L24 -22 L34 10 L20 30 L0 36 L-20 30 Z" fill="currentColor"/><path d="M-24 16 Q-34 2 -28 -8 M24 16 Q34 2 28 -8" stroke="#101522" stroke-width="4" fill="none"/>`
  },
  {
    id: "sym-falcon",
    name: "Chim ưng Hoàng tộc",
    category: "animals",
    tags: ["chim ưng", "falcon", "tốc độ"],
    svgInner: `<path d="M0 -40 L12 -18 L44 -22 L28 4 L12 12 L16 38 L0 26 L-16 38 L-12 12 L-28 4 L-44 -22 L-12 -18 Z" fill="currentColor"/>`
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
  {
    id: "sym-fleur-de-lis",
    name: "Hoa Bách hợp (Fleur-de-lis)",
    category: "royal",
    tags: ["fleur-de-lis", "bách hợp", "hoàng tộc"],
    svgInner: `<path d="M0 -42 C10 -24 12 -6 4 6 C14 -10 34 -12 32 6 C30 18 16 20 6 14 L10 36 L0 28 L-10 36 L-6 14 C-16 20 -30 18 -32 6 C-34 -12 -14 -10 -4 6 C-12 -6 -10 -24 0 -42 Z" fill="currentColor"/><rect x="-18" y="10" width="36" height="6" rx="2" fill="currentColor"/>`
  },
  {
    id: "sym-globus-orb",
    name: "Quả cầu Vương quyền (Globus)",
    category: "royal",
    tags: ["quả cầu", "orb", "đế chế"],
    svgInner: `<g fill="currentColor"><circle cx="0" cy="10" r="24"/><rect x="-3" y="-38" width="6" height="28"/><rect x="-14" y="-28" width="28" height="6"/></g><path d="M-24 10 H24 M0 -14 V34" stroke="#101522" stroke-width="3" fill="none"/>`
  },
  {
    id: "sym-throne",
    name: "Ngai vàng Đế chế",
    category: "royal",
    tags: ["ngai vàng", "throne", "vương triều"],
    svgInner: `<path d="M-24 -36 L-12 -22 L0 -40 L12 -22 L24 -36 V8 H34 V38 H22 V24 H-22 V38 H-34 V8 H-24 Z" fill="currentColor"/>`
  },
  {
    id: "sym-halberd",
    name: "Kích Cấm vệ quân",
    category: "royal",
    tags: ["kích", "halberd", "cấm vệ"],
    svgInner: `<g fill="currentColor"><rect x="-3" y="-40" width="6" height="80"/><path d="M3 -26 C26 -24 30 0 3 6 Z"/><polygon points="-3,-18 -24,-8 -3,0"/></g>`
  },
  {
    id: "sym-shield-mini",
    name: "Huy khiên Trung tâm (Escutcheon)",
    category: "royal",
    tags: ["khiên nhỏ", "escutcheon", "gia huy"],
    svgInner: `<path d="M-26 -30 H26 V6 C26 24 0 38 0 38 C0 38 -26 24 -26 6 Z" fill="currentColor"/><path d="M0 -24 V30 M-20 -4 H20" stroke="#101522" stroke-width="3.5"/>`
  },
  {
    id: "sym-diadem",
    name: "Mũ miện Nữ hoàng",
    category: "royal",
    tags: ["mũ miện", "diadem", "hoàng hậu"],
    svgInner: `<path d="M-36 18 Q0 -26 36 18 L30 28 Q0 16 -30 28 Z" fill="currentColor"/><circle cx="0" cy="-16" r="6" fill="currentColor"/><circle cx="-18" cy="-4" r="4" fill="currentColor"/><circle cx="18" cy="-4" r="4" fill="currentColor"/>`
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
  {
    id: "sym-lotus",
    name: "Liên hoa Thuần khiết",
    category: "nature",
    tags: ["hoa sen", "lotus", "tôn giáo", "phương đông"],
    svgInner: `<g fill="currentColor"><path d="M0 -38 C12 -16 14 8 0 28 C-14 8 -12 -16 0 -38 Z"/><path d="M-8 24 C-30 14 -38 -6 -28 -22 C-14 -12 -6 4 -8 24 Z"/><path d="M8 24 C30 14 38 -6 28 -22 C14 -12 6 4 8 24 Z"/><rect x="-24" y="28" width="48" height="7" rx="3"/></g>`
  },
  {
    id: "sym-oak-leaf",
    name: "Lá Sồi Trường tồn",
    category: "nature",
    tags: ["lá sồi", "oak", "rừng", "bền vững"],
    svgInner: `<path d="M0 -40 C16 -32 10 -18 24 -12 C28 0 14 8 20 20 C12 28 4 22 3 38 H-3 C-4 22 -12 28 -20 20 C-14 8 -28 0 -24 -12 C-10 -18 -16 -32 0 -40 Z" fill="currentColor"/>`
  },
  {
    id: "sym-lightning",
    name: "Lôi điện Thiên uy",
    category: "nature",
    tags: ["sấm sét", "lightning", "bão"],
    svgInner: `<polygon points="8,-42 -22,4 -2,4 -12,42 24,-6 4,-6" fill="currentColor"/>`
  },
  {
    id: "sym-snowflake",
    name: "Băng tinh Phương Bắc",
    category: "nature",
    tags: ["băng", "tuyết", "frost", "bắc cực"],
    svgInner: `<g stroke="currentColor" stroke-width="5" stroke-linecap="round"><line x1="0" y1="-38" x2="0" y2="38"/><line x1="-33" y1="-19" x2="33" y2="19"/><line x1="-33" y1="19" x2="33" y2="-19"/><circle cx="0" cy="0" r="9" fill="currentColor"/></g>`
  },
  {
    id: "sym-constellation",
    name: "Chòm sao Thiên cầu",
    category: "nature",
    tags: ["chòm sao", "constellation", "thiên văn"],
    svgInner: `<g stroke="currentColor" stroke-width="2.5" fill="currentColor"><line x1="-30" y1="-16" x2="-8" y2="-28"/><line x1="-8" y1="-28" x2="18" y2="-10"/><line x1="18" y1="-10" x2="30" y2="18"/><line x1="18" y1="-10" x2="-14" y2="24"/><circle cx="-30" cy="-16" r="5"/><circle cx="-8" cy="-28" r="6"/><circle cx="18" cy="-10" r="7"/><circle cx="30" cy="18" r="5"/><circle cx="-14" cy="24" r="6"/></g>`
  },
  {
    id: "sym-wheat",
    name: "Bông lúa Trù phú",
    category: "nature",
    tags: ["lúa", "wheat", "nông nghiệp", "thịnh vượng"],
    svgInner: `<g fill="currentColor"><rect x="-2.5" y="-34" width="5" height="72"/><ellipse cx="-12" cy="-20" rx="8" ry="4" transform="rotate(-35 -12 -20)"/><ellipse cx="12" cy="-20" rx="8" ry="4" transform="rotate(35 12 -20)"/><ellipse cx="-14" cy="-4" rx="9" ry="4.5" transform="rotate(-35 -14 -4)"/><ellipse cx="14" cy="-4" rx="9" ry="4.5" transform="rotate(35 14 -4)"/><ellipse cx="-12" cy="12" rx="8" ry="4" transform="rotate(-35 -12 12)"/><ellipse cx="12" cy="12" rx="8" ry="4" transform="rotate(35 12 12)"/></g>`
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
  {
    id: "sym-astrolabe",
    name: "Thiên cầu Nghi (Astrolabe)",
    category: "arcane",
    tags: ["astrolabe", "thiên văn", "ma pháp"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="3.5"><circle cx="0" cy="0" r="34"/><ellipse cx="0" cy="0" rx="34" ry="14" transform="rotate(35)"/><ellipse cx="0" cy="0" rx="34" ry="14" transform="rotate(-35)"/><circle cx="0" cy="0" r="7" fill="currentColor"/></g>`
  },
  {
    id: "sym-hourglass",
    name: "Đồng hồ Cát Thời gian",
    category: "arcane",
    tags: ["thời gian", "hourglass", "lịch sử"],
    svgInner: `<g fill="currentColor"><rect x="-26" y="-38" width="52" height="7" rx="2"/><rect x="-26" y="31" width="52" height="7" rx="2"/><polygon points="-22,-31 22,-31 0,0"/><polygon points="-22,31 22,31 0,0"/></g>`
  },
  {
    id: "sym-chalice",
    name: "Chén Thánh Huyền bí",
    category: "arcane",
    tags: ["chén thánh", "chalice", "tôn giáo"],
    svgInner: `<path d="M-26 -34 H26 C24 -8 12 2 4 6 V28 H18 V36 H-18 V28 H-4 V6 C-12 2 -24 -8 -26 -34 Z" fill="currentColor"/>`
  },
  {
    id: "sym-pentacle",
    name: "Ngũ mang Tinh Ấn",
    category: "arcane",
    tags: ["ngũ mang tinh", "pentacle", "pháp thuật"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="3.5"><circle cx="0" cy="0" r="36"/><polygon points="0,-34 10,-6 34,-6 14,10 22,34 0,18 -22,34 -14,10 -34,-6 -10,-6"/></g>`
  },
  {
    id: "sym-halo-cross",
    name: "Thánh giá Hào quang",
    category: "arcane",
    tags: ["thánh giá", "tôn giáo", "giáo hội"],
    svgInner: `<g fill="currentColor"><circle cx="0" cy="0" r="24" fill="none" stroke="currentColor" stroke-width="4"/><rect x="-6" y="-40" width="12" height="80" rx="2"/><rect x="-32" y="-12" width="64" height="12" rx="2"/></g>`
  },
  {
    id: "sym-portal-gate",
    name: "Cổng Không gian Cổ đại",
    category: "arcane",
    tags: ["cổng", "portal", "huyền bí"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="4"><path d="M-28 36 V-8 A28 28 0 0 1 28 -8 V36"/><path d="M-16 36 V-4 A16 16 0 0 1 16 -4 V36" stroke-dasharray="5 4"/><circle cx="0" cy="4" r="6" fill="currentColor"/></g>`
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
  },
  {
    id: "sym-anchor",
    name: "Mỏ neo Hải quân",
    category: "civilization",
    tags: ["mỏ neo", "anchor", "hải quân", "thương cảng"],
    svgInner: `<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><circle cx="0" cy="-28" r="8"/><line x1="0" y1="-20" x2="0" y2="34"/><line x1="-18" y1="-8" x2="18" y2="-8"/><path d="M-30 14 C-26 32 -12 36 0 36 C12 36 26 32 30 14"/></g>`
  },
  {
    id: "sym-hammer",
    name: "Búa Rèn Công xưởng",
    category: "civilization",
    tags: ["búa", "hammer", "thợ rèn", "hội đoàn"],
    svgInner: `<g fill="currentColor"><rect x="-32" y="-32" width="64" height="22" rx="4"/><rect x="-6" y="-10" width="12" height="48" rx="3"/></g>`
  },
  {
    id: "sym-city-gate",
    name: "Cổng Thành Đô thị",
    category: "civilization",
    tags: ["cổng thành", "thành phố", "đô thị"],
    svgInner: `<path d="M-36 -34 H-24 V-22 H-12 V-34 H12 V-22 H24 V-34 H36 V36 H14 V10 A14 14 0 0 0 -14 10 V36 H-36 Z" fill="currentColor"/>`
  },
  {
    id: "sym-quill",
    name: "Bút lông Sử gia",
    category: "civilization",
    tags: ["bút lông", "quill", "sử gia", "văn thư"],
    svgInner: `<path d="M30 -38 C8 -32 -14 -12 -24 16 L-34 38 L-10 26 C14 14 32 -10 30 -38 Z" fill="currentColor"/>`
  },
  {
    id: "sym-scroll",
    name: "Cuộn Thư Hiến chương",
    category: "civilization",
    tags: ["cuộn thư", "scroll", "luật pháp", "hiệp ước"],
    svgInner: `<g fill="currentColor"><rect x="-24" y="-30" width="48" height="60" rx="6"/><rect x="-32" y="-34" width="64" height="10" rx="5"/><rect x="-32" y="24" width="64" height="10" rx="5"/></g>`
  },
  {
    id: "sym-flask",
    name: "Bình Giả kim & Khoa học",
    category: "civilization",
    tags: ["giả kim", "khoa học", "học viện", "y học"],
    svgInner: `<path d="M-10 -38 H10 V-14 L32 28 C34 34 28 38 22 38 H-22 C-28 38 -34 34 -32 28 L-10 -14 Z" fill="currentColor"/>`
  }
];

export const EXTERNAL_ORNAMENTS: Array<{ id: OrnamentId; label: string; description: string }> = [
  { id: "none", label: "Không trang trí ngoài", description: "Giữ dáng khiên tinh gọn" },
  { id: "imperial_crown", label: "Vương miện Đế chế", description: "Đặt trang trọng trên đỉnh khiên" },
  { id: "royal_crown", label: "Vương miện Vương quốc", description: "Vương miện 5 đỉnh cổ điển" },
  { id: "knight_helmet", label: "Mũ giáp Hiệp sĩ (Helmet & Torse)", description: "Mũ giáp quý tộc kèm mào lông trên đỉnh" },
  { id: "laurel_wreath", label: "Vòng Nguyệt quế", description: "Ôm hai bên hông khiên" },
  { id: "oak_wreath", label: "Vòng Lá Sồi Bền vững", description: "Vòng lá sồi uy nghi hai bên khiên" },
  { id: "supporters_wings", label: "Đôi Cánh Bảo hộ", description: "Hai cánh uy nghi chầu hai bên" },
  { id: "banner_supporters", label: "Song Kỳ Chầu Hai Bên", description: "Hai cột cờ nghi lễ chéo sau khiên" },
  { id: "royal_mantle", label: "Áo choàng Hoàng gia", description: "Màn trướng quyền uy phía sau" },
  { id: "decorative_frame", label: "Khung Viền Ấn triện", description: "Vòng tròn ấn triện cổ điển" },
  { id: "baroque_cartouche", label: "Khung Cartouche Baroque", description: "Khung chạm khắc hoàng gia cổ điển" },
  { id: "arcane_halo", label: "Hào quang Thiên văn", description: "Vòng tinh tú huyền bí phía sau" },
  { id: "sunburst_halo", label: "Hào quang Thái dương", description: "Tia sáng tỏa tròn sau quốc huy" },
  { id: "crest_stars", label: "Chòm sao Đỉnh khiên", description: "3 ngôi sao hoàng gia trên đỉnh" }
];
