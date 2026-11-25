# NHẬT KÝ THAY ĐỔI PHIÊN BẢN (CHANGELOG — AETHEL CODEX V9.0)

**Phiên bản:** `V9.0.0`  
**Ngày phát hành:** 26/11/2026  
**Định hướng:** *Complete UI/UX Redesign × Motion UI × System Optimization × 100% Feature Preservation × Advanced Wiki Intelligence*

---

## 1. Thiết Kế Lại Giao Diện Toàn Diện & Motion UI
- **Hệ thống Token & Chuyển động V9.0 (`src/app/globals.css`)**: Chuẩn hóa thang bo góc, đổ bóng đa tầng, hiệu ứng chuyển cảnh GPU `.animate-v9-page-enter`, nút ánh kim `.v9-sheen-btn`, thẻ `.v9-bento-card`, thanh lệnh kính mờ `.v9-glass-header` và tôn trọng `prefers-reduced-motion` / `[data-perf="lite"]`.
- **Đại Sảnh Tri Thức Bento (`src/components/GrandHallView.tsx`)**: Thiết kế lại hoàn toàn thành trung tâm điều phối tri thức đa thế giới kèm thanh tìm kiếm tức thì, khám phá ngẫu nhiên, chỉ số trực tiếp, đọc tiếp & dấu trang, 14 cổng phân hệ, quốc gia & nhân vật tiêu biểu, biên niên sử và dòng chảy biên tập.
- **Database Studio V9.0 (`src/components/DatabaseView.tsx`)**: Nâng cấp 4 chế độ hiển thị (`Grid`, `Table` có bản thẻ di động riêng, `Compact`, `Magazine`), bộ lọc thu gọn thông minh trên Mobile, sửa lỗi phân trang ở chế độ bảng/danh sách và mở rộng thanh thao tác hàng loạt (gắn thẻ, đổi danh mục, đổi trạng thái, xuất JSON, chuyển thùng rác).
- **Điều hướng Thích ứng Đa Thiết bị (`CodexApp.tsx`, `ImperialPrimitives.tsx`)**: Bổ sung Breadcrumb động trên Header, Thanh điều hướng đáy 5 tác vụ cho Mobile (`MobileBottomNavDock`), hộp thoại cảnh báo thay đổi chưa lưu (`UnsavedChangesPrompt`) và huy hiệu thời gian lưu nháp tự động trong `EntryEditorModal.tsx`.

## 2. Trí Tuệ Wiki Nâng Cao (Advanced Wiki Intelligence)
- **Omni-Search Xếp hạng & Xuyên Không gian (`/api/search`, `CommandPalette.tsx`)**: Chấm điểm độ khớp (`scoreSearchMatch`: khớp chính xác tiêu đề/ID > tiền tố > bí danh > phụ đề/thẻ > nội dung), hỗ trợ tìm kiếm xuyên mọi Workspace được phép truy cập và gợi ý từ khóa thông minh.
- **Knowledge Graph Pro (`/api/graph`, `KnowledgeGraphView.tsx`)**: Hợp nhất nút `Entry` + `Character (CHAR-)` + `Kingdom (KING-)` và quan hệ đa chiều trong một đồ thị thống nhất có thu phóng, thống kê Top Knowledge Hubs và Radar phát hiện cặp thực thể chưa liên kết.
- **AI Lore Consistency & Missing-Data Studio (`/api/ai-assistant`, `WikiHealthView.tsx`)**: Bổ sung chế độ đối chiếu mâu thuẫn niên đại/sinh tử (`timeline_consistency`) và gợi ý bổ sung dữ liệu thiếu kèm thống kê nguồn gốc tri thức (`missing_data_suggestions`), lưu an toàn vào hàng đợi xét duyệt.

## 3. Gia Cố Bảo Mật, Chống Xung Đột & Sao Lưu Thảm Họa
- **Xác thực & RBAC (`src/lib/auth.ts`, các route `/api/*`)**: Đồng bộ khóa `SESSION_SECRET` trên Render, thêm bộ chặn vét cạn mật khẩu (HTTP `429`), cờ khóa chuyển vai trò demo, ẩn `webhookUrl` khỏi khách xem và bảo vệ các API kiểm toán.
- **Khóa Đồng thời Lạc quan (`ConcurrentEditError`)**: Trả về HTTP `409 Conflict` khi phát hiện xung đột `expectedUpdatedAt` trên Hồ sơ Bách khoa, Nhân vật và Quốc gia.
- **Sao lưu & Phục hồi Toàn hệ thống (`src/lib/system-backup.ts`, `/api/backup`, `SystemBackupCenterModal.tsx`)**: Sao lưu nguyên vẹn cả 8 kho dữ liệu kèm chữ ký `SHA-256` và tự động chụp bản an toàn trước khi khôi phục.

## 4. Tối Ưu Hóa Hiệu Năng & Chất Lượng Mã Nguồn
- Chuyển 24 phân hệ và modal nặng sang nạp lười `next/dynamic`, giúp giảm **49,6%** dung lượng chunk trang chủ (`452 kB → 228 kB`) và giảm **39,0%** First Load JS (`577 kB → 352 kB`).
- Dọn sạch 2 tệp giao diện chết không còn tham chiếu (`CodexModulesHub.tsx`, `WorldAnalyticsDashboard.tsx`).
- Mở rộng bộ kiểm thử tự động lên **12 tệp / 88 bài kiểm thử (100% PASS)**.
