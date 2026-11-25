# SYSTEM AUDIT REPORT — AETHEL CODEX (V8.0 BASELINE → V9.0)

## 1. Tổng quan Kiến trúc Nguồn (Baseline V8.0)
- **Framework:** Next.js 15.5.29 (App Router), React 19.1.0, TypeScript, Tailwind CSS v4.
- **Dependencies (`package.json`):** `jszip` (`^3.10.1`), `lucide-react` (`^0.511.0`), `next` (`^15.3.3` / resolved `15.5.29`), `pg` (`^8.16.0`), `react` (`^19.1.0`), `react-dom` (`^19.1.0`). Không có dependency thừa trong `package.json`.
- **Tổng số API Route Handlers:** 38 endpoints trong `src/app/api/` (thêm `/api/backup` trong V9.0 nâng tổng số lên 39 endpoints).
- **Tổng số Bộ Kiểm thử Hiện có:** 11 test suites (`83/83` tests PASS).
- **Bundle Baseline (`/`):** Page JS = `452 kB`, First Load JS = `577 kB`.

## 2. Đánh giá Trạng thái Từng Phân hệ Chức năng

| STT | Phân hệ / Tính năng | Tệp Thực thi Chính | Trạng thái V8.0 | Kế hoạch Xử lý V9.0 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Multi-Workspace & RBAC (Admin/Editor/Guest) | `src/lib/auth.ts`, `src/lib/rbac.ts`, `UtilityModals.tsx` | **Fully Working** | Chuẩn hóa `SESSION_SECRET`, thêm Rate Limit đăng nhập & Cookie flags chuẩn. |
| 2 | Grand Hall (Trang chủ Đại Sảnh) | `src/components/GrandHallView.tsx` | **Fully Working** | Thiết kế lại toàn diện thành Bento Knowledge Sanctuary V9.0. |
| 3 | Database View & Saved Views & Bulk Actions | `src/components/DatabaseView.tsx` | **Fully Working** | Thiết kế lại thành Database Studio V9.0 (Grid / Table / Compact + Bulk Toolbar nâng cấp). |
| 4 | 14 Phân hệ Codex & Unified Workspace | `src/lib/codex-modules.ts`, `UnifiedCodexWorkspace.tsx` | **Fully Working** | Bảo toàn 14 phân hệ, đồng bộ giao diện V9.0. |
| 5 | Universal Entity Detail, Empty-Field Engine & Lightbox V2 | `EntryDetailView.tsx`, `empty-field-engine.ts`, `ImageLightboxModal.tsx` | **Fully Working** | Thiết kế lại khung đọc học thuật V9.0, giữ 100% logic ẩn trường trống & giữ `0`/`false`. |
| 6 | 3-Level Freeform Tab/Block/Field CRUD & Form Editors | `CustomProfileLayoutBuilder.tsx`, `EntryEditorModal.tsx` | **Fully Working** | Bổ sung Unsaved Changes Guard, trạng thái lưu trực quan & bố cục nhóm V9.0. |
| 7 | Character Codex (17 nhóm dữ liệu, `CHAR-XXXXXX`) | `character-repository.ts`, `CharacterCodexHub.tsx`, `CharacterDetailView.tsx`, `CharacterEditorModal.tsx` | **Fully Working** | Đồng bộ Design System V9.0, thêm Optimistic Concurrency & bảo vệ RBAC tại `/api/characters/audit`. |
| 8 | Kingdom Codex (360 quốc gia, 18 nhóm, `KING-XXXXXX`) | `kingdom-repository.ts`, `KingdomCodexHub.tsx`, `KingdomDetailView.tsx`, `KingdomEditorModal.tsx` | **Fully Working** | Đồng bộ Design System V9.0, thêm Optimistic Concurrency, giữ nguyên liên kết sống với Atlas & Character. |
| 9 | Royal Heraldry Studio (2.400+ mẫu) & Flag Studio (450+ mẫu) & Regalia/Meaning DB | `RoyalHeraldryStudio.tsx`, `FlagBannerStudio.tsx`, `HeraldryExpansionHub.tsx`, `heraldry-repository.ts` | **Fully Working** | Tách tải động `next/dynamic`, giữ nguyên 100% kho mẫu vector, lịch sử tiến hóa & provenance. |
| 10 | Planetary Atlas (360 Voronoi), 3D Globe & Custom Atlas Maps | `PlanetaryAtlasStudio.tsx`, `PlanetaryGlobeView.tsx`, `AtlasView.tsx` | **Fully Working** | Tách tải động `next/dynamic` (giảm hơn 3.000 dòng code khỏi bundle trang đầu). |
| 11 | Economy Engine & Multi-Nation Comparator | `economy-engine.ts`, `EntryEconomyPanel.tsx`, `MultiNationEconomyComparatorModal.tsx` | **Fully Working** | Bảo toàn 5 cụm thanh kinh tế & quy đổi tiền tệ Aurel (`AUR`). |
| 12 | Timeline, Multi-Moon Calendar, Genealogy & Knowledge Graph | `TimelineView.tsx`, `CalendarView.tsx`, `GenealogyExplorerView.tsx`, `KnowledgeGraphView.tsx` | **Fully Working** | Nâng cấp Knowledge Graph Pro liên thông Entries + Characters + Kingdoms + Universal Relations. |
| 13 | Conlang Studio, Chronicle Reader, EPUB/CSV/JSON Import-Export | `ConlangStudioView.tsx`, `ChronicleReaderView.tsx`, `BookPublisherModal.tsx`, `epub-exporter.ts` | **Fully Working** | Bảo toàn toàn bộ khả năng dịch Runic/Romanized và đóng gói sách EPUB/ZIP/CSV. |
| 14 | Content Health (9 Rules) & AI Proposals | `content-health-engine.ts`, `WikiHealthView.tsx`, `ai-proposals-repo.ts` | **Partially Working** | Đưa `health-resolutions` lên PostgreSQL Dual-Store; bổ sung Missing Data & Timeline Consistency AI Modes. |
| 15 | Legacy Hub & Legacy Analytics | `src/components/CodexModulesHub.tsx`, `src/components/WorldAnalyticsDashboard.tsx` | **Unused Code** | `0` tham chiếu trên toàn dự án — xác minh an toàn và loại bỏ trong Phase 5. |

## 3. Phát hiện Bảo mật, Hiệu năng & Độ bền Dữ liệu Cần Khắc phục
1. **Lệch biến môi trường phiên (`src/lib/auth.ts` vs `render.yaml`):** `render.yaml` sinh `SESSION_SECRET` nhưng `auth.ts` chỉ đọc `AUTH_SECRET`.
2. **Thiếu kiểm tra quyền đọc nội bộ:** `GET /api/publish` trả về `webhookUrl` cho khách; `GET /api/characters/audit` chưa lọc theo quyền `editor`/`admin`.
3. **Thiếu bảo vệ ghi đè đồng thời:** Các hàm cập nhật `Entry`, `Character`, `Kingdom` cần kiểm tra `expectedUpdatedAt` (tùy chọn) để báo xung đột `409 Conflict` khi hai phiên cùng lưu bản cũ.
4. **Dữ liệu `health-resolutions.json` chưa đồng bộ PostgreSQL:** Trên môi trường Render filesystem tạm thời, file `.data/health-resolutions.json` sẽ mất khi redeploy nếu không lưu song song vào PostgreSQL.
5. **Tải tĩnh quá nhiều Studio trong `CodexApp.tsx`:** Khiến bundle `/` lên tới `452 kB` (First Load `577 kB`).
