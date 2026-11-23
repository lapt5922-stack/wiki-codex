# KINGDOM CODEX — Kiến trúc Hệ thống Hồ sơ Vương quốc (Aethel Codex)

## 1. Tổng quan Kiến trúc

**Kingdom Codex** là hệ thống bách khoa toàn thư địa chính trị chuyên sâu được tích hợp trực tiếp vào **Aethel Codex**, quản lý đầy đủ **360 quốc gia thực** (`KING-000001` → `KING-000360`) đồng bộ từ **Planetary Atlas 360** & **Economy Engine**, đồng thời hỗ trợ mở rộng lên hàng nghìn quốc gia (`KING-000361+`) và hàng triệu bản ghi liên quan.

### Nguyên tắc Thiết kế Cốt lõi
1. **Zero-Breakage Integration**: Không phá vỡ 360 hồ sơ Wiki hiện có (`ent-nation-1..360`). Mỗi quốc gia trong Kingdom Codex liên kết 2 chiều với Wiki Entry (`linkedWikiEntryId`) và Planetary Atlas (`linkedAtlasNationId`).
2. **Zero Character Duplication**: Nguyên thủ / Hoàng gia trong mục Chính trị **không bao giờ** nhân bản dữ liệu nhân vật — luôn liên kết trực tiếp qua `Character ID` (`CHAR-XXXXXX`) từ **Character Codex** và hydrate sống khi truy vấn.
3. **14 Chỉ số Thống kê Độc lập**: Không gộp các chỉ số thành 1 điểm mờ duy nhất; mỗi trong 14 chỉ số (Quân sự, Kinh tế, Công nghệ, Ổn định, Ngoại giao, Tài nguyên, Dân số, Văn hóa, Hạ tầng, Ma thuật, Giáo dục, Thương mại, Đổi mới, Độ giàu) có `score`, `tier`, `evaluatedAt`, và `sourceNote` riêng.
4. **Không tự bịa biên giới**: 360 quốc gia gốc hiển thị đường biên giới SVG thật trích xuất từ `buildPlanetaryAtlasBundle()`. Quốc gia tạo mới không sao chép hay bịa đường biên giới giả.

---

## 2. Cấu trúc Dữ liệu (18 Nhóm & 24 Bảng PostgreSQL)

Schema chuẩn hóa đầy đủ được định nghĩa tại [`src/db/schema-kingdoms.sql`](src/db/schema-kingdoms.sql) và TypeScript models tại [`src/types/kingdom-codex.ts`](src/types/kingdom-codex.ts):

| # | Nhóm dữ liệu | Bảng PostgreSQL chính |
|---|---|---|
| 1 | Thông tin nhận diện quốc gia | `kingdoms` |
| 2 | Biểu tượng & nhận diện hình ảnh | `kingdom_symbols`, `kingdom_images` |
| 3 | Địa lý & lãnh thổ (kèm SVG Atlas thật) | `kingdom_territories` |
| 4 | Phân cấp hành chính | `kingdom_regions` |
| 5 | Dân số & xã hội (lịch sử nhiều năm) | `kingdom_population_history` |
| 6 | Chính trị, thể chế & Lãnh đạo (`CHAR-XXXXXX`) | `kingdom_governments`, `kingdom_rulers` |
| 7 | Kinh tế (GDP, thương mại nhiều năm) | `kingdom_economy_history` |
| 8 | Quân sự & quốc phòng | `kingdom_military` |
| 9 | Khoa học, công nghệ & ma thuật | `kingdom_technology` |
| 10 | Văn hóa & tôn giáo | `kingdom_culture` |
| 11 | Hạ tầng & đô thị | `kingdom_infrastructure` |
| 12 | Tài nguyên & sinh thái | `kingdom_resources` |
| 13 | 14 chỉ số thống kê độc lập | `kingdom_statistics` |
| 14 | Quan hệ ngoại giao & Hiệp ước | `kingdom_relations`, `kingdom_treaties` |
| 15 | Sự kiện lịch sử & Dòng thời gian | `kingdom_events` |
| 16 | Thành tựu & bảng xếp hạng | `kingdom_achievements` |
| 17 | Thư viện hình ảnh & Nguồn tham khảo | `kingdom_images`, `kingdom_sources` |
| 18 | Phiên bản, Quyền truy cập & Trường mở rộng 13 kiểu | `kingdom_versions`, `kingdom_custom_fields`, `kingdom_custom_field_values` |

---

## 3. Repository & API Routes

- **Repository**: [`src/db/kingdom-repository.ts`](src/db/kingdom-repository.ts) — Dual-mode (PostgreSQL JSONB/Normalized + Local JSON overlay `.data/kingdom-codex.json`), lazy-hydrating toàn bộ 360 quốc gia gốc với bộ lọc server-side không dấu tiếng Việt (`matchesVietnameseQuery`).
- **API Endpoints**:
  - `GET /api/kingdoms` — Truy vấn danh sách phân trang, tìm kiếm, lọc theo lục địa/thể chế/loại hình/mức độ phát triển/trạng thái, sắp xếp theo Tên / Dân số / Diện tích / GDP / Cập nhật.
  - `POST /api/kingdoms` — Tạo quốc gia mới (`KING-000361+`) hoặc Nhân bản từ mẫu (`cloneFromId`).
  - `GET /api/kingdoms/[id]` — Trả về hồ sơ 18 nhóm đầy đủ + lịch sử phiên bản + hydrate sống `Character ID`.
  - `PATCH /api/kingdoms/[id]` — Cập nhật đa nhóm, lưu custom field values, tự động ghi snapshot phiên bản mới.
  - `DELETE /api/kingdoms/[id]` — Xóa mềm (Soft Delete).
  - `POST /api/kingdoms/[id]/versions` — Khôi phục hồ sơ về phiên bản lịch sử `versionNumber`.
  - `GET / POST / DELETE /api/kingdoms/custom-fields` — Quản lý trường dữ liệu động (13 kiểu dữ liệu, phân quyền `visibleTo` / `editableBy`, không phá vỡ dữ liệu cũ).
  - `GET /api/kingdoms/io?format=json|csv` — Xuất toàn bộ danh sách quốc gia ra JSON hoặc CSV (có chống CSV formula injection).

---

## 4. Giao diện Người dùng (Desktop Pro, Tablet & Mobile)

- [`src/components/kingdom-codex/KingdomCodexHub.tsx`](src/components/kingdom-codex/KingdomCodexHub.tsx):
  - 3 chế độ hiển thị: **Grid (Thẻ)**, **List (Danh sách)**, **Table (Bảng)**.
  - Thanh tìm kiếm + lọc nhanh đa chiều + phân trang server-side.
  - **So sánh 2–5 Quốc gia**: Biểu đồ Radar SVG tương tác trực quan trên 8 trục chỉ số + bảng so sánh dân số, diện tích, GDP, chỉ số quân sự/kinh tế/công nghệ.
  - Quản lý Trường dữ liệu mở rộng (13 kiểu) + Xuất JSON/CSV + Tạo mới / Nhân bản quốc gia.
- [`src/components/kingdom-codex/KingdomDetailView.tsx`](src/components/kingdom-codex/KingdomDetailView.tsx):
  - **16 Tab chuyên sâu** (Tổng quan, Địa lý & Bản đồ SVG thật, Hành chính, Dân số & Biểu đồ, Chính trị & Nguyên thủ `CHAR-XXXXXX`, Kinh tế & Biểu đồ GDP, Quân sự, Công nghệ & Ma thuật, Văn hóa, Hạ tầng, Tài nguyên, 14 Chỉ số Thống kê, Ngoại giao & Hiệp ước, Lịch sử & Thành tựu, Thư viện & Nguồn, Lịch sử Phiên bản & Khôi phục).
  - Tự động thích ứng: **Sticky Sidebar 2 cột** trên Desktop/Tablet và **Accordion gọn nhẹ** trên Mobile.
  - Nút nhảy thẳng sang **Planetary Atlas 360**, **Hồ sơ Wiki Entry**, và **Character Codex**.
- [`src/components/kingdom-codex/KingdomEditorModal.tsx`](src/components/kingdom-codex/KingdomEditorModal.tsx):
  - Trình soạn thảo đa tab (6 tab) cho phép chỉnh sửa trực tiếp nhận diện, lãnh thổ, chính trị + liên kết `CHAR-XXXXXX`, kinh tế/quân sự/văn hóa, 14 chỉ số thống kê độc lập, trạng thái workflow (`draft` / `review` / `published` / `archived`), và các trường mở rộng động.
