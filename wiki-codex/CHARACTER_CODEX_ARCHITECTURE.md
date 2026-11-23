# CHARACTER CODEX — Tài liệu Kiến trúc Kỹ thuật (Aethel Codex Integration)

## 1. Tổng quan Kiến trúc
Hệ thống **CHARACTER CODEX** được tích hợp trực tiếp vào **Aethel Codex** (Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS v4) mà không phá vỡ hay viết lại bất kỳ module nào hiện có.

- **Giao diện tích hợp**: Nằm tại mục điều hướng `Character Codex` (`section === "characters"`) trong `src/components/CodexApp.tsx`, tự động tối ưu bố cục riêng cho iPhone/Android, Tablet và Desktop thông qua `useDeviceUI()` (`src/lib/device-ui.tsx`).
- **Liên kết hai chiều với Thế giới quan Aethelgard**: Mỗi nhân vật có thể liên kết trực tiếp tới hồ sơ 360 Quốc gia (`linkedNationEntryId`), tiền tệ 9 châu lục (`WORLD_CURRENCIES`), tọa độ Bản đồ Hành trình (`mapX`, `mapY`) và ghim lên `Grand Hall`.

## 2. Kiến trúc Cơ sở Dữ liệu 22 Bảng Chuẩn hóa
Toàn bộ DDL PostgreSQL nằm tại [`src/db/schema-characters.sql`](src/db/schema-characters.sql) với 22 bảng quan hệ chuẩn hóa, khóa chính/khóa ngoại, ràng buộc dữ liệu, chỉ mục `GIN` (`tags`), `pg_trgm` (`search_text`) và chỉ mục phân trang cursor cho quy mô hàng triệu hồ sơ:
1. `characters` (Nhóm 1, 6, 10, 15) · 2. `character_appearances` · 3. `character_personalities` · 4. `character_biographies` · 5. `character_abilities` (13 cột chỉ số tách riêng) · 6. `skills` · 7. `character_skill_relations` · 8. `items` · 9. `character_equipment` · 10. `relationships` · 11. `organizations` · 12. `affiliations` · 13. `events` · 14. `character_events` · 15. `achievements` · 16. `character_assets` · 17. `character_quotes` · 18. `character_images` · 19. `character_versions` · 20. `sources` · 21. `custom_field_definitions` · 22. `custom_field_values`.

**Hệ thống ID Bất biến (`src/lib/character-id.ts`)**: Không dùng tên làm khóa chính; mọi thực thể sinh ID tuần tự ổn định (`CHAR-000001`, `SKILL-000001`, `ITEM-000001`, `REL-000001`, `ORG-000001`, `EVENT-000001`, `ACH-000001`, `ASSET-000001`, `QUO-000001`, `IMG-000001`, `SRC-000001`, `CFLD-000001`).

## 3. Phân quyền, Spoiler Cấp Từng Mục & Trạng thái Xác thực
- Mỗi chương tiểu sử, giai đoạn ngoại hình/tâm lý, bí mật, kỹ năng, trang bị và quan hệ có `accessLevel` độc lập (`public`, `spoiler`, `unpublished`, `private_draft`, `authorized_only`, `admin_only`).
- `canViewAccessLevel(level, role)` trong `src/db/character-repository.ts` lọc triệt để phía server trước khi trả JSON cho trình duyệt; nội dung `spoiler` được bọc trong `SpoilerGateBox` yêu cầu người đọc chủ động nhấn mở.
- 8 trạng thái xác thực (`official`, `verified`, `unverified`, `inferred`, `creative`, `updating`, `draft`, `outdated`) tách bạch rõ ràng — không tự biến suy luận thành chính thức.

## 4. Hệ thống API RESTful (`/api/characters/...`)
| Endpoint | Phương thức | Chức năng |
| :--- | :--- | :--- |
| `/api/characters` | `GET`, `POST` | Tìm kiếm không dấu, lọc đa điều kiện, sắp xếp, phân trang server; tạo nhân vật mới |
| `/api/characters/[id]` | `GET`, `PATCH`, `DELETE` | Tải hồ sơ 17 nhóm theo quyền; cập nhật + tự tạo phiên bản mới; xóa mềm |
| `/api/characters/[id]/versions` | `GET`, `POST` | Xem lịch sử phiên bản & khôi phục phiên bản cũ |
| `/api/characters/custom-fields` | `GET`, `POST`, `DELETE` | Quản lý trường dữ liệu tùy biến không mất dữ liệu cũ (lưu theo `fieldId`) |
| `/api/characters/audit` | `GET` | Kiểm định phát hiện ID trùng lặp, quan hệ thiếu mục tiêu, mâu thuẫn niên đại |
| `/api/characters/io` | `GET`, `POST` | Xuất toàn bộ JSON/CSV & nhập hàng loạt CSV/JSON vào cơ sở dữ liệu |

## 5. Khả năng Mở rộng
Để thêm trường dữ liệu mới mà không cần sửa code hay làm mất dữ liệu cũ, quản trị viên mở **Trường động** ngay trong Character Codex để tạo/đổi tên/đổi kiểu dữ liệu (`CFLD-XXXXXX`). Giá trị được lưu theo `fieldId` độc lập trong `custom_field_values`.
