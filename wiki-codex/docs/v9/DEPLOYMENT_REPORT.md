# BÁO CÁO TRIỂN KHAI PRODUCTION & QUY TRÌNH ROLLBACK (DEPLOYMENT REPORT — V9.0)

**Dự án:** Aethel Codex V9.0  
**Môi trường triển khai mục tiêu:** Render Cloud (`https://wiki-codex-atlas.onrender.com/`) + PostgreSQL Managed Database  
**Cấu hình IaC:** `render.yaml`

---

## 1. Kiến Trúc Triển Khai Bền Vững Trên Render

- **Web Service**: Next.js `15.5.29` chạy ở chế độ Production (`npm run build` → `npm run start`).
- **Biến môi trường tương thích hoàn toàn với `render.yaml`**:
  - `DATABASE_URL`: Kết nối tự động tới PostgreSQL để lưu bền vững toàn bộ 8 kho dữ liệu JSONB, kho ảnh nhị phân `codex_media_blobs` và kho sao lưu `codex_system_backups`.
  - `SESSION_SECRET` / `AUTH_SECRET`: Cả hai tên biến đều được `src/lib/auth.ts` nhận diện tự động để ký phiên `HMAC-SHA256`.
  - `DISABLE_DEMO_ROLE_SWITCH` *(Tùy chọn)*: Đặt bằng `"true"` nếu muốn tắt tính năng chuyển nhanh vai trò trải nghiệm trên môi trường đóng.
- **Health Check Endpoint**: `GET /api/health` trả về trạng thái dịch vụ và thông tin backend lưu trữ hiện hành (`postgresql` hoặc `local-json`).

---

## 2. Tính Bền Vững Dữ Liệu Khi Redeploy Container

Trên Render (hệ tệp container tạm thời - ephemeral filesystem):
1. Toàn bộ hồ sơ Bách khoa, Nhân vật, Quốc gia, Huy hiệu, Quan hệ, Văn kiện cổ, Đề xuất AI, Trạng thái kiểm toán sức khỏe và Tệp ảnh tải lên đều được ghi trực tiếp vào **PostgreSQL** ngay khi phát sinh thao tác.
2. Khi triển khai bản cập nhật mới (Redeploy), ứng dụng tự động khởi tạo bảng bằng `CREATE TABLE IF NOT EXISTS` (không bao giờ chạy `DROP TABLE`) và nạp nguyên vẹn toàn bộ dữ liệu đã lưu.

---

## 3. Quy Trình Sao Lưu & Rollback An Toàn (2 Tầng)

### Tầng 1 — Khôi phục Dữ liệu Tức thì ngay trên Giao diện Quản trị
1. Đăng nhập tài khoản **Admin** → bấm biểu tượng **Sao lưu** trên thanh lệnh trên cùng để mở **Trung tâm Sao lưu & Phục hồi Thảm họa V9.0**.
2. Bấm **Tạo Bản Sao lưu Ngay** (hoặc **Tải tệp `.json` về máy** trước mỗi đợt biên tập lớn).
3. Nếu cần quay lui dữ liệu về thời điểm trước, bấm **Khôi phục** trên bản chụp mong muốn. Hệ thống sẽ xác minh chữ ký `SHA-256` và tự động chụp lại một bản an toàn trước khi khôi phục.

### Tầng 2 — Rollback Mã nguồn Git / Render
- Toàn bộ thay đổi V9.0 hoàn toàn tương thích ngược với cấu trúc dữ liệu V8.0 (chỉ bổ sung trường tùy chọn, không xóa cột hay đổi khóa chính).
- Nếu cần quay lui mã nguồn trên Render Dashboard, chỉ cần chọn bản Deploy của commit `ae3a6c7` (V8.0 Baseline) và nhấn **Rollback to this deploy** mà không cần can thiệp cơ sở dữ liệu.
