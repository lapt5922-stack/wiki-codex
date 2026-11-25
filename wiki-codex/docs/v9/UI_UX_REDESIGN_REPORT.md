# BÁO CÁO TÁI THIẾT KẾ GIAO DIỆN & MOTION UI (UI/UX REDESIGN REPORT — V9.0)

**Dự án:** Aethel Codex V9.0  
**Triết lý thiết kế:** *Imperial Astral Sanctuary × Bento Knowledge Architecture × GPU-Accelerated Motion UI*

---

## 1. Hệ Thống Design System V9.0 Tập Trung

Toàn bộ token thị giác và chuyển động được chuẩn hóa tập trung trong `src/app/globals.css` và `src/lib/navigation-config.ts`:
- **8 Chủ đề Giao diện Đa Thế giới (Theme Engine)**:
  - 6 giao diện tối cao cấp: *Astral Grimoire*, *Velvet Eclipse*, *Imperial Amber*, *Sylvan Emerald*, *Astral Sci-Fi*, *Jade Ink*.
  - 2 giao diện sáng giấy cổ / ngà thiên thanh: *Gilded Parchment*, *Celestial Ivory*.
  - Khắc phục triệt để lỗi màu nền cứng (`#0f1420`) trên thẻ để 2 giao diện sáng đạt độ tương phản chữ chuẩn WCAG AA.
- **Hệ phân cấp Typography & Bo góc**:
  - Tiêu đề bách khoa: `Cinzel` / `Cormorant Garamond`; Nội dung đọc dài: `Plus Jakarta Sans` / `Inter`; Mã định danh chuẩn (`CHAR-`, `KING-`, `DOC-`): `JetBrains Mono`.
  - Token bo góc thống nhất: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-2xl`.

---

## 2. Hệ Thống Chuyển Động (Uiverse-Inspired Motion UI)

1. **Chỉ sử dụng thuộc tính tăng tốc phần cứng GPU (`transform`, `opacity`)**:
   - `.animate-v9-page-enter`: Chuyển cảnh mượt giữa các phân hệ với đường cong `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`.
   - `.v9-sheen-btn`: Nút bấm ánh kim trượt ngang tinh tế lấy cảm hứng từ Uiverse.
   - `.v9-bento-card`: Thẻ Bento nâng nhẹ `-2px` kèm viền sáng chủ đề khi di chuột.
   - `.v9-skeleton`: Khung xương tải lấp lánh đồng bộ khi tách gói `next/dynamic`.
2. **Tôn trọng Khả năng Tiếp cận & Thiết bị Cấu hình Thấp**:
   - Tự động vô hiệu hóa chuyển động khi hệ điều hành bật `@media (prefers-reduced-motion: reduce)` hoặc người dùng chọn chế độ hiệu năng nhẹ `[data-perf="lite"]`.

---

## 3. Tái Cấu Trúc Bố Cục & Responsive Đa Thiết Bị

| Thiết bị | Giải pháp Kiến trúc Giao diện V9.0 |
|---|---|
| **Desktop & Ultrawide (`≥ 1024px`)** | Thanh lệnh kính mờ (`v9-glass-header`) tích hợp Breadcrumb động + Omni-Search trung tâm + Thanh điều hướng 5 nhóm phân hệ có thể thu gọn + Lưới Bento 12 cột tại Đại Sảnh. |
| **Tablet (`768px – 1023px`)** | Lưới Bento tự động co giãn 2 cột, ngăn kéo điều hướng trượt mượt, bảng dữ liệu cuộn ngang có cố định ngữ cảnh. |
| **Mobile (`< 768px`)** | Bổ sung **Thanh Điều Hướng Đáy (`MobileBottomNavDock`)** một chạm cho 5 tác vụ cốt lõi (*Đại Sảnh, Kho Hồ sơ, Tìm kiếm, Bản đồ, Sáng tạo*), tự động chuyển bảng dữ liệu rộng sang **Thẻ Dữ liệu Di động**, và biến Modal thành **Bottom-Sheet** tôn trọng vùng an toàn `env(safe-area-inset-bottom)`. |

---

## 4. Trải Nghiệm Chống Mất Thao Tác (Zero Accidental Data Loss UX)

- Tích hợp `UnsavedChangesPrompt` và sự kiện trình duyệt `beforeunload` trong `EntryEditorModal.tsx` khi người biên tập có thay đổi chưa lưu.
- Hiển thị huy hiệu thời gian lưu nháp tự động (`Autosave HH:MM:SS`) theo thời gian thực ngay trên thanh tiêu đề trình biên tập.
