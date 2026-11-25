# BÁO CÁO TOÀN VẸN CƠ SỞ DỮ LIỆU & PHỤC HỒI THẢM HỌA (DATABASE INTEGRITY REPORT — V9.0)

**Dự án:** Aethel Codex V9.0  
**Kiến trúc lưu trữ:** Dual-Engine Persistence (PostgreSQL JSONB Transactional Tables + Atomic Local JSON Fallback)

---

## 1. Kiến Trúc Lưu Trữ Bền Vững 8 Kho Dữ Liệu

Trong V9.0, **100% trạng thái nghiệp vụ (8/8 kho dữ liệu)** đều đã được đồng bộ hóa kép lên PostgreSQL (khi có `DATABASE_URL`) và tệp JSON cục bộ:

| STT | Kho dữ liệu | Bảng PostgreSQL | Tệp JSON cục bộ (`.data/`) | Trạng thái V9.0 |
|---|---|---|---|---|
| 1 | Kho Bách khoa Trung tâm (Workspaces, Entries, Categories, Timeline, Atlas, Calendars, Conlangs...) | `codex_state_snapshots` | `codex-db.json` | Ghi nguyên tử 4 lần thử lại kèm PID |
| 2 | Hồ sơ Nhân vật 17 Nhóm (Character Codex) | `codex_character_state` | `character-codex.json` | Ghi nguyên tử + Khóa đồng thời `409` |
| 3 | Hồ sơ Quốc gia & 360 Quốc gia Hành tinh | `codex_kingdom_state_blob` | `kingdom-codex.json` | Ghi nguyên tử + Khóa đồng thời `409` |
| 4 | Huy hiệu Hoàng gia & Quốc kỳ (Heraldry & Flag) | `codex_heraldry_blob` | `heraldry-store.json` | Đã tích hợp vào Sao lưu Toàn cục |
| 5 | Quan hệ Đa chiều 2 Chiều (Universal Relations) | `codex_universal_relations_blob` | `universal-relations.json` | Đã tích hợp vào Sao lưu Toàn cục |
| 6 | Kho Lưu trữ Văn kiện Cổ (Historical Archives) | `codex_archives_blob` | `archives-store.json` | Đã tích hợp vào Sao lưu Toàn cục |
| 7 | Hàng đợi Đề xuất AI (AI Proposals) | `codex_ai_proposals_blob` | `ai-proposals.json` | Mở rộng thêm `provenanceBreakdown` |
| 8 | Trạng thái Xử lý Kiểm toán Sức khỏe Wiki | `codex_health_resolutions_blob` | `health-resolutions.json` | **Nâng cấp mới ở V9.0** (trước đây chỉ lưu đĩa cục bộ) |

*(Ngoài ra, kho ảnh nhị phân `codex_media_blobs` và kho bản chụp sao lưu `codex_system_backups` hoạt động độc lập trong PostgreSQL để đảm bảo ảnh tải lên và bản sao lưu không bao giờ mất khi container Render khởi động lại).*

---

## 2. Chống Xung Đột Chỉnh Sửa Đồng Thời (Optimistic Concurrency Control)

- Bổ sung lớp ngoại lệ `ConcurrentEditError` và kiểm tra trường tùy chọn `expectedUpdatedAt` trong:
  - `updateEntry` (`PATCH /api/entries/[id]`)
  - `updateCharacterDossier` (`PATCH /api/characters/[id]`)
  - `updateKingdomDossier` (`PATCH /api/kingdoms/[id]`)
- Khi hai biên tập viên cùng mở một hồ sơ, nếu người thứ nhất lưu trước làm thay đổi `updatedAt`, yêu cầu lưu cũ của người thứ hai sẽ nhận phản hồi **HTTP `409 Conflict`** rõ ràng thay vì âm thầm ghi đè mất công sức của người trước.
- Tương thích ngược 100%: Các lời gọi API tích hợp không truyền `expectedUpdatedAt` vẫn hoạt động bình thường.

---

## 3. Cơ Chế Sao Lưu & Khôi Phục Thảm Họa (`SHA-256` Verified)

- `createFullSystemBackup()` đóng gói đồng thời cả 8 kho dữ liệu vào định dạng chuẩn `aethel-codex-full-backup-v9`, tính toán mã kiểm tra `checksumSha256` và lưu tối đa 12 bản chụp xoay vòng gần nhất vào bảng `codex_system_backups` + `.data/backups/`.
- `restoreFullSystemBackup()` thực hiện 3 bước an toàn bắt buộc:
  1. Kiểm tra cấu trúc hợp lệ của các mảng cốt lõi (`workspaces`, `entries`, `characters`).
  2. Tính lại `SHA-256` và từ chối ngay lập tức nếu dữ liệu bị sửa đổi hoặc hỏng hóc.
  3. **Tự động tạo một bản sao lưu an toàn (`preRestoreSafetyBackupId`) của trạng thái hiện tại** trước khi ghi khôi phục xuống cả 8 kho.
