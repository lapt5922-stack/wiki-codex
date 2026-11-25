# MA TRẬN BẢO TOÀN CHỨC NĂNG & NGHIỆP VỤ (FEATURE PRESERVATION MATRIX — V8.0 → V9.0)

**Dự án:** Aethel Codex — Encyclopedia & Worldbuilding Platform  
**Phiên bản đối chiếu:** V8.0 Baseline (`ae3a6c7`) → V9.0 Release  
**Kết quả kiểm định:** **100% Chức năng & Dữ liệu được bảo toàn tuyệt đối (0 chức năng mất, 0 API gãy, 0 dữ liệu bị xóa)**

---

## 1. Bảng Đối Chiếu Toàn Bộ Phân Hệ Chức Năng

| STT | Phân hệ / Tính năng | Trạng thái V8.0 | Trạng thái V9.0 | Tệp thực thi chính | Ghi chú nâng cấp V9.0 |
|---|---|---|---|---|---|
| 1 | **Đa Không gian Thế giới (Multi-Workspace)** | Hoạt động | **Bảo toàn & Nâng cấp** | `src/app/api/workspaces/route.ts`, `CodexApp.tsx` | Bổ sung tìm kiếm xuyên không gian (`crossWorkspace=true`) có kiểm soát RBAC |
| 2 | **Đại Sảnh Tri Thức (Grand Hall)** | Hoạt động | **Thiết kế lại V9.0** | `src/components/GrandHallView.tsx` | Nâng cấp thành Bento Knowledge Sanctuary, giữ nguyên Continue Reading, Bookmarks, Random Discovery, 14 Cổng phân hệ |
| 3 | **Kho Hồ sơ Bách khoa (Database Studio)** | Hoạt động | **Thiết kế lại V9.0** | `src/components/DatabaseView.tsx` | 4 chế độ xem (`grid`/`table`/`compact`/`magazine`), sửa lỗi phân trang bảng, thêm thẻ bảng Mobile & Bulk Actions mở rộng |
| 4 | **Hồ sơ Chi tiết & Markdown/Wikilinks** | Hoạt động | **Bảo toàn 100%** | `src/components/EntryDetailView.tsx`, `MarkdownView.tsx` | Bảo toàn 12 tab động, `[[Wikilinks]]`, Spoiler, Conlang block, Backlinks, Unlinked Mentions |
| 5 | **Trình Biên tập Hồ sơ & Chống Mất Dữ liệu** | Hoạt động | **Bảo toàn & Nâng cấp** | `src/components/EntryEditorModal.tsx` | Thêm hộp thoại cảnh báo chưa lưu (`UnsavedChangesPrompt`), `beforeunload`, huy hiệu Autosave trực tiếp & khóa đồng thời `expectedUpdatedAt` |
| 6 | **3-Level Freeform CRUD & Empty-Field Engine** | Hoạt động | **Bảo toàn 100%** | `src/lib/empty-field-engine.ts`, `FreeformLayoutEditor.tsx` | Giữ nguyên quy tắc ẩn trường rỗng, bảo toàn số `0` và boolean `false`, không hiện `"—"` |
| 7 | **Image Lightbox V2 (Zoom/Pan/Keyboard)** | Hoạt động | **Bảo toàn 100%** | `src/components/ui/ImageLightboxModal.tsx` | Phóng đại ảnh từ mọi Infobox, chân dung, quốc kỳ, huy hiệu và thư viện ảnh |
| 8 | **Character Codex (17 Nhóm / 34+ Trường)** | Hoạt động | **Bảo toàn & Nâng cấp** | `src/components/CharacterCodexHub.tsx`, `character-repository.ts` | Bảo toàn toàn bộ 17 nhóm dữ liệu, lịch sử phiên bản, xuất/nhập CSV-JSON + khóa chống ghi đè HTTP `409` |
| 9 | **Kingdom Codex & 360 Quốc gia Hành tinh** | Hoạt động | **Bảo toàn & Nâng cấp** | `src/components/KingdomCodexHub.tsx`, `kingdom-repository.ts` | Bảo toàn 360 quốc gia địa chính trị + 18 nhóm hồ sơ quốc gia + khóa chống ghi đè HTTP `409` |
| 10 | **Royal Heraldry (2.400+ mẫu) & Flag Studio (450+ mẫu)** | Hoạt động | **Bảo toàn 100%** | `src/components/RoyalHeraldryStudio.tsx`, `heraldry-repository.ts` | Giữ nguyên kho 2.400+ mẫu huy hiệu, 450+ mẫu quốc kỳ, trình dựng SVG nhiều lớp |
| 11 | **Bản đồ Thế giới 2D/3D Planetary Atlas** | Hoạt động | **Bảo toàn 100%** | `src/components/AtlasView.tsx`, `PlanetaryGlobe3D.tsx` | Giữ nguyên ghim bản đồ, đo khoảng cách, lớp sương mù, địa cầu 3D tương tác |
| 12 | **Biên niên sử & Lịch Thiên văn Đa Mặt trăng** | Hoạt động | **Bảo toàn 100%** | `TimelineView.tsx`, `CalendarView.tsx` | Giữ nguyên trục sự kiện lịch sử, chu kỳ mặt trăng và ngày lễ |
| 13 | **Xưởng Ngôn ngữ Conlang & Loreboard** | Hoạt động | **Bảo toàn 100%** | `ConlangStudioView.tsx`, `LoreboardView.tsx` | Giữ nguyên 6 ngôn ngữ, bảng chữ cái cổ ngữ, từ điển và bảng ghim chiến lược |
| 14 | **V3 Omniverse & V4 World Studio** | Hoạt động | **Bảo toàn 100%** | `V3OmniverseStudioView.tsx`, `V4WorldStudioView.tsx` | Giữ nguyên quy đổi đơn vị, máy tính hành trình, sơ đồ tổ chức, xuất bản sách HTML/In ấn |
| 15 | **Đồ thị Tri thức, Gia phả & Cây phân cấp** | Hoạt động | **Bảo toàn & Nâng cấp Pro** | `KnowledgeGraphView.tsx`, `GenealogyExplorerView.tsx` | Mở rộng thành Knowledge Graph Pro hợp nhất `Entry + Character + Kingdom`, Top Hubs & Radar gợi ý liên kết |
| 16 | **Kiểm toán 9 Quy tắc, Quan hệ & AI Studio** | Hoạt động | **Bảo toàn & Nâng cấp** | `WikiHealthView.tsx`, `/api/ai-assistant` | Bổ sung tab AI Lore & Consistency Studio (`timeline_consistency`, `missing_data_suggestions`) có gắn nhãn nguồn gốc |
| 17 | **Kho Tư liệu Media Vault & Lưu trữ PostgreSQL** | Hoạt động | **Bảo toàn 100%** | `MediaVaultView.tsx`, `media-blob-store.ts` | Giữ nguyên tải ảnh trực tiếp lưu vào bảng `codex_media_blobs` bền vững qua redeploy |
| 18 | **Nhập / Xuất CSV, JSON, Markdown & Web Công khai** | Hoạt động | **Bảo toàn & Gia cố RBAC** | `BatchCsvImportModal.tsx`, `PublishCenterModal.tsx`, `/public` | Bảo toàn toàn bộ pipeline Import/Export và cổng `/public/[workspaceSlug]`, ẩn `webhookUrl` với khách |
| 19 | **Sao lưu Toàn hệ thống & Phục hồi Thảm họa** | Chưa có | **Mới trong V9.0** | `src/lib/system-backup.ts`, `/api/backup`, `SystemBackupCenterModal.tsx` | Sao lưu đồng bộ cả 8 kho dữ liệu kèm kiểm tra toàn vẹn `SHA-256` và bản chụp an toàn trước khi khôi phục |

---

## 2. Đối Chiếu Hệ Thống Định Tuyến API (37 Route V8.0 → 38 Route V9.0)

- **Toàn bộ 37 route của V8.0**: Được giữ nguyên đường dẫn, phương thức HTTP và cấu trúc phản hồi tương thích ngược 100%.
- **Route bổ sung mới ở V9.0**: `GET / POST / PUT /api/backup` phục vụ sao lưu và phục hồi thảm họa cấp Quản trị viên.
