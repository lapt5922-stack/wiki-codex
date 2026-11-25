# BÁO CÁO KIỂM TOÁN & GIA CỐ BẢO MẬT (SECURITY AUDIT REPORT — V9.0)

**Dự án:** Aethel Codex V9.0  
**Phạm vi kiểm toán:** Xác thực phiên (`HMAC-SHA256`), Phân quyền RBAC cấp API, Chống tấn công Brute-force, Chống rò rỉ dữ liệu nhạy cảm, Toàn vẹn gói sao lưu.

---

## 1. Các Lỗ Hổng & Điểm Yếu Đã Phát Hiện Và Khắc Phục Triệt Để

| Mã | Hạng mục kiểm toán | Phát hiện ở V8.0 | Biện pháp khắc phục ở V9.0 | Trạng thái |
|---|---|---|---|---|
| **SEC-01** | Đồng bộ khóa bí mật phiên (`render.yaml` vs `auth.ts`) | `render.yaml` sinh biến môi trường `SESSION_SECRET`, trong khi `src/lib/auth.ts` chỉ đọc `AUTH_SECRET`, dẫn đến nguy cơ dùng khóa mặc định trên môi trường cloud. | Hàm `getAuthSecret()` đọc ưu tiên `process.env.AUTH_SECRET \|\| process.env.SESSION_SECRET` trước khi fallback về khóa dev cục bộ. | **Đã khắc phục & Kiểm thử** |
| **SEC-02** | Chống vét cạn mật khẩu (Brute-force Login) | `POST /api/auth` chưa giới hạn số lần nhập sai mật khẩu liên tiếp. | Bổ sung bộ giới hạn tốc độ trong `src/lib/auth.ts` (`MAX_LOGIN_FAILURES = 8` trong cửa sổ `10 phút`, trả về HTTP `429 Too Many Requests` kèm `Retry-After`). | **Đã khắc phục & Kiểm thử** |
| **SEC-03** | Cờ khóa Chuyển vai trò Demo trên Production | Nút chuyển nhanh vai trò phục vụ trải nghiệm chưa có khóa cứng cấp môi trường. | Bổ sung kiểm tra `process.env.DISABLE_DEMO_ROLE_SWITCH === "true"` chặn hoàn toàn hành động `switch_role` khi triển khai đóng. | **Đã khắc phục** |
| **SEC-04** | Rò rỉ `webhookUrl` trong cấu hình Xuất bản | `GET /api/publish` trả về nguyên trạng `publishTargets` chứa `webhookUrl` cho cả người xem khách (`guest`). | Tự động ẩn `webhookUrl: ""` đối với mọi truy vấn không có quyền `canPublishPublic(user.role)`. | **Đã khắc phục & Kiểm thử** |
| **SEC-05** | Lộ tiêu đề hồ sơ nháp qua API Kiểm toán | `GET /api/characters/audit` và `GET /api/health/validate` chưa chặn `guest`, có thể làm lộ tiêu đề hồ sơ chưa công bố. | Áp dụng `requireEditor(user)` bắt buộc trên cả hai route (trả về HTTP `403` với `guest`). | **Đã khắc phục & Kiểm thử** |
| **SEC-06** | Bảo vệ API Sao lưu & Khôi phục Toàn hệ thống | Chưa có cơ chế kiểm tra giả mạo tệp sao lưu khi tải lên khôi phục. | `/api/backup` yêu cầu quyền `requireAdmin(user)` nghiêm ngặt và xác thực mã băm `SHA-256` trên toàn bộ 8 kho dữ liệu trước khi cho phép khôi phục. | **Đã khắc phục & Kiểm thử** |

---

## 2. Bảo Vệ Cookie, Markdown & Tải Lên Tệp Tin

- **Cookie phiên (`wiki_codex_session`)**: Thiết lập thông qua `buildSessionCookieOptions` với `httpOnly: true`, `sameSite: "lax"`, `path: "/"` và `secure: process.env.NODE_ENV === "production"`, ký số `HMAC-SHA256` so sánh bằng `crypto.timingSafeEqual` chống tấn công định thời gian (Timing Attack).
- **Mật khẩu tài khoản**: Băm bằng `crypto.scryptSync` kèm `16-byte random salt` riêng biệt cho từng người dùng.
- **Kiểm soát RBAC đa tầng**: Mọi truy vấn `entries`, `characters`, `kingdoms`, `universal-relations` và `search` đều lọc trường `private_note`, `admin_only`, `editor_only`, `unpublished` ngay tại tầng Backend trước khi trả JSON về trình duyệt.
