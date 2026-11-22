import type {
  DynamicPropertyKind,
  Entry,
  EntryCustomProperty,
  EntryTabKey,
  EntryType
} from "@/types/codex";

export const NON_POWER_TYPE_SLUGS = new Set([
  "co-ngu-ngon-ngu",
  "ngon-ngu",
  "co-ngu-van-hien",
  "su-kien-lich-su",
  "dia-danh",
  "thanh-pho-do-thi",
  "ton-giao-tin-nguong",
  "he-thong-quy-luat",
  "khai-niem-ky-thuat"
]);

export const DYNAMIC_PROPERTY_KINDS: Array<{
  kind: DynamicPropertyKind;
  label: string;
  hint: string;
}> = [
  { kind: "text", label: "Văn bản ngắn", hint: "VD: Xanh băng, Cao nguyên Bắc" },
  { kind: "textarea", label: "Đoạn văn dài", hint: "Mô tả nhiều dòng chi tiết" },
  { kind: "number", label: "Số & Đơn vị", hint: "VD: 182 (cm), 450000 (dân)" },
  { kind: "progress", label: "Thanh tỷ lệ (0–100%)", hint: "VD: Độ giải mã 94%" },
  { kind: "tags", label: "Danh sách thẻ (Tags)", hint: "Phân cách bằng dấu phẩy" },
  { kind: "date", label: "Niên đại / Ngày tháng", hint: "VD: Năm 305 Kỷ Nguyên Ánh Sao" },
  { kind: "rating", label: "Đánh giá (1–5 sao)", hint: "VD: Độ hiếm 5/5" },
  { kind: "entity_ref", label: "Liên kết Hồ sơ Wiki", hint: "Nhập tên hồ sơ để bấm nhảy tới" },
  { kind: "url", label: "Đường dẫn URL", hint: "Tài liệu tham khảo ngoài" },
  { kind: "private_note", label: "Ghi chú mật (Ẩn Khách)", hint: "Chỉ Editor/Admin nhìn thấy" }
];

export interface PropertyPresetPack {
  id: string;
  title: string;
  forTypeSlugs: string[];
  fields: Array<Omit<EntryCustomProperty, "id" | "order">>;
}

export const QUICK_PROPERTY_PRESETS: PropertyPresetPack[] = [
  {
    id: "preset-char-appearance",
    title: "Ngoại hình & Cá tính (Nhân vật)",
    forTypeSlugs: ["nhan-vat"],
    fields: [
      { label: "Chiều cao", group: "Ngoại hình", kind: "number", value: "172", unit: "cm", showInInfobox: true },
      { label: "Màu mắt & Màu tóc", group: "Ngoại hình", kind: "text", value: "Mắt xanh tinh tú · Tóc bạch kim", showInInfobox: true },
      { label: "Đặc điểm tính cách", group: "Tính cách", kind: "tags", value: "Điềm tĩnh, Uyên bác, Kiên định", color: "#A78BFA", showInInfobox: true },
      { label: "Mức độ ảnh hưởng", group: "Xã hội", kind: "rating", value: "5", color: "#FBBF24", showInInfobox: false }
    ]
  },
  {
    id: "preset-lang-linguistics",
    title: "Ngữ pháp & Âm vị học (Cổ ngữ)",
    forTypeSlugs: ["co-ngu-ngon-ngu", "co-ngu-van-hien"],
    fields: [
      { label: "Trật tự câu chuẩn", group: "Ngữ pháp", kind: "text", value: "SVO (Chủ – Động – Tân)", showInInfobox: true },
      { label: "Tỷ lệ đã giải mã", group: "Học thuật", kind: "progress", value: "92", color: "#C084FC", showInInfobox: true },
      { label: "Độ phức tạp ngữ âm", group: "Học thuật", kind: "rating", value: "4", color: "#38BDF8", showInInfobox: true },
      { label: "Các phương ngữ chính", group: "Phân bố", kind: "tags", value: "Bắc Hải, Học Viện, Cổ Thư", color: "#34D399", showInInfobox: false }
    ]
  },
  {
    id: "preset-kingdom-econ",
    title: "Kinh tế & Nhân khẩu (Quốc gia / Đô thị)",
    forTypeSlugs: ["vuong-quoc", "thanh-pho-do-thi"],
    fields: [
      { label: "Tỷ lệ biết chữ", group: "Xã hội", kind: "progress", value: "86", color: "#38BDF8", showInInfobox: true },
      { label: "Mặt hàng xuất khẩu chính", group: "Kinh tế", kind: "tags", value: "Thấu kính pha lê, Hải đồ, Gỗ quý", color: "#F59E0B", showInInfobox: true },
      { label: "Mức độ phồn vinh", group: "Kinh tế", kind: "rating", value: "5", color: "#D4AF37", showInInfobox: false }
    ]
  },
  {
    id: "preset-artifact-craft",
    title: "Thông số Chế tác & Di sản (Cổ vật)",
    forTypeSlugs: ["co-vat-tac-pham"],
    fields: [
      { label: "Độ hiếm bảo tàng", group: "Giá trị", kind: "rating", value: "5", color: "#FB7185", showInInfobox: true },
      { label: "Tình trạng nguyên vẹn", group: "Bảo tồn", kind: "progress", value: "96", color: "#34D399", showInInfobox: true },
      { label: "Đặc tính nổi bật", group: "Chuyên khảo", kind: "tags", value: "Phát quang, Khắc cổ ngữ, Bền vững", color: "#D4AF37", showInInfobox: false }
    ]
  },
  {
    id: "preset-creature-eco",
    title: "Sinh thái & Tập tính (Sinh vật)",
    forTypeSlugs: ["sinh-vat-thuc-vat"],
    fields: [
      { label: "Chiều dài / Sải cánh", group: "Hình thái", kind: "number", value: "14", unit: "mét", showInInfobox: true },
      { label: "Mức độ nguy hiểm", group: "Sinh thái", kind: "rating", value: "4", color: "#F87171", showInInfobox: true },
      { label: "Tập tính nổi bật", group: "Sinh thái", kind: "tags", value: "Sống theo đàn, Di cư theo mùa, Phát quang", color: "#10B981", showInInfobox: true }
    ]
  },
  {
    id: "preset-religion-lore",
    title: "Nghi lễ & Tầm ảnh hưởng (Tôn giáo / Quy luật)",
    forTypeSlugs: ["ton-giao-tin-nguong", "he-thong-quy-luat"],
    fields: [
      { label: "Tỷ lệ tín đồ / người ứng dụng", group: "Phổ biến", kind: "progress", value: "74", color: "#F59E0B", showInInfobox: true },
      { label: "Giá trị cốt lõi", group: "Giáo lý", kind: "tags", value: "Tri thức, Cân bằng, Chiêm nghiệm", color: "#D4AF37", showInInfobox: true }
    ]
  }
];

export function entryTypeSupportsPower(entryType?: EntryType | null): boolean {
  if (!entryType) return false;
  if (typeof entryType.supportsPower === "boolean") return entryType.supportsPower;
  if (NON_POWER_TYPE_SLUGS.has(entryType.slug)) return false;
  return entryType.enabledTabs.includes("power");
}

export function entrySupportsPower(entry: Entry, entryType?: EntryType | null): boolean {
  if (entry.tabOverrides?.disabled?.includes("power")) return false;
  if (entry.tabOverrides?.enabled?.includes("power")) return true;
  return entryTypeSupportsPower(entryType);
}

export function entrySupportsVariants(entry: Entry, entryType?: EntryType | null): boolean {
  if (entry.variants && entry.variants.length > 0) return true;
  if (typeof entryType?.supportsVariants === "boolean") return entryType.supportsVariants;
  return entryType?.slug === "nhan-vat" || entryType?.slug === "sinh-vat-thuc-vat" || entryType?.slug === "co-vat-tac-pham";
}

export function resolveEntryTabs(entry: Entry, entryType?: EntryType | null): EntryTabKey[] {
  const base: EntryTabKey[] = entryType?.enabledTabs
    ? [...entryType.enabledTabs]
    : ["overview", "details", "sections", "relations", "timeline", "sources", "gallery"];

  const filtered = base.filter((t) => {
    if (t === "power" && !entrySupportsPower(entry, entryType)) return false;
    if (entry.tabOverrides?.disabled?.includes(t)) return false;
    return true;
  });

  for (const extra of entry.tabOverrides?.enabled ?? []) {
    if (!filtered.includes(extra)) {
      if (extra === "economy") filtered.splice(1, 0, "economy");
      else if (extra === "power") filtered.splice(1, 0, "power");
      else filtered.push(extra);
    }
  }
  if (entry.economyProfile && !filtered.includes("economy") && !entry.tabOverrides?.disabled?.includes("economy")) {
    filtered.splice(1, 0, "economy");
  }
  return filtered;
}

export function extractCardHighlights(
  entry: Entry,
  entryType?: EntryType | null
): Array<{ label: string; value: string; color?: string }> {
  const highlights: Array<{ label: string; value: string; color?: string }> = [];
  const hiddenSet = new Set(entry.hiddenSchemaKeys ?? []);

  // 1. Pick top non-private extraFields marked showInInfobox
  const extras = [...(entry.extraFields ?? [])]
    .filter((f) => f.kind !== "private_note" && f.showInInfobox && f.value.trim())
    .sort((a, b) => a.order - b.order);

  for (const f of extras) {
    if (highlights.length >= 3) break;
    let display = f.value.trim();
    if (f.kind === "number" && f.unit) display = `${display} ${f.unit}`;
    else if (f.kind === "progress") display = `${Math.min(100, Math.max(0, Number(display) || 0))}%`;
    else if (f.kind === "rating") {
      const n = Math.min(5, Math.max(1, Math.round(Number(display) || 1)));
      display = "★".repeat(n) + "☆".repeat(5 - n);
    }
    highlights.push({ label: f.label, value: display.slice(0, 34), color: f.color });
  }

  // 2. Fill remaining slots from EntryType fieldSchema (infobox fields, non-private, non-table)
  if (highlights.length < 3 && entryType) {
    for (const def of entryType.fieldSchema) {
      if (highlights.length >= 3) break;
      if (def.type === "private_note" || def.type === "table" || hiddenSet.has(def.key)) continue;
      const raw = entry.customFields?.[def.key];
      if (raw === undefined || raw === null || raw === "" || typeof raw === "object") continue;
      const valStr = def.unit ? `${raw} ${def.unit}` : String(raw);
      highlights.push({ label: def.label, value: valStr.slice(0, 34) });
    }
  }

  return highlights;
}

export function computeSchemaCompleteness(
  entry: Pick<Entry, "summary" | "contentMarkdown" | "coverImage" | "customFields" | "extraFields" | "hiddenSchemaKeys">,
  entryType?: EntryType | null
): { percent: number; missingLabels: string[]; filledCount: number; totalCount: number } {
  const hiddenSet = new Set(entry.hiddenSchemaKeys ?? []);
  const schemaFields = (entryType?.fieldSchema ?? []).filter(
    (f) => f.type !== "private_note" && !hiddenSet.has(f.key)
  );

  let filled = 0;
  let total = 3 + schemaFields.length; // summary + content + cover + schema fields
  const missingLabels: string[] = [];

  if (entry.summary && entry.summary.trim().length >= 15) filled++;
  else missingLabels.push("Tóm tắt hồ sơ");

  if (entry.contentMarkdown && entry.contentMarkdown.trim().length >= 60) filled++;
  else missingLabels.push("Nội dung bài viết chi tiết");

  if (entry.coverImage && entry.coverImage.trim().length > 0) filled++;
  else missingLabels.push("Ảnh bìa / Minh họa");

  for (const f of schemaFields) {
    const val = entry.customFields?.[f.key];
    const hasVal =
      val !== undefined &&
      val !== null &&
      val !== "" &&
      !(Array.isArray(val) && val.length === 0);
    if (hasVal) filled++;
    else missingLabels.push(f.label);
  }

  // Bonus credit for custom extraFields
  const filledExtras = (entry.extraFields ?? []).filter((x) => x.value.trim().length > 0).length;
  if (filledExtras > 0) {
    filled += Math.min(2, filledExtras);
    total += Math.min(2, filledExtras);
  }

  return {
    percent: total > 0 ? Math.min(100, Math.round((filled / total) * 100)) : 100,
    missingLabels,
    filledCount: filled,
    totalCount: total
  };
}
