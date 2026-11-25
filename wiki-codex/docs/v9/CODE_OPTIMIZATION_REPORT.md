# BÁO CÁO TỐI ƯU HÓA MÃ NGUỒN & KIẾN TRÚC (CODE OPTIMIZATION REPORT — V9.0)

**Dự án:** Aethel Codex V9.0  
**Mục tiêu:** Giảm trùng lặp, loại bỏ mã chết đã xác minh, tách gói tải lười (`next/dynamic`) và chuẩn hóa cấu trúc module mà không thêm thư viện ngoài dư thừa.

---

## 1. Loại Bỏ Mã Chết (Verified Dead Code Elimination)

Qua kiểm toán tham chiếu toàn cục (`grep` trên toàn bộ `src/`), 2 tệp giao diện cũ hoàn toàn không còn bất kỳ `import` nào đã được dọn dẹp an toàn:
1. `src/components/CodexModulesHub.tsx` — đã được thay thế hoàn toàn bởi `CodexDomainPortalView.tsx` và các Studio chuyên biệt.
2. `src/components/WorldAnalyticsDashboard.tsx` — đã được hợp nhất số liệu trực tiếp vào Đại Sảnh (`GrandHallView.tsx`) và Trung tâm Sức khỏe Wiki (`WikiHealthView.tsx`).

---

## 2. Tách Hằng Số Điều Hướng & Design Primitives Tái Sử Dụng

- **Tách `src/lib/navigation-config.ts`**: Đưa toàn bộ danh mục 8 chủ đề (`CODEX_THEMES`), từ điển tiêu đề phân hệ (`SECTION_TITLES`) và cấu trúc 5 nhóm điều hướng (`V9_NAVIGATION_GROUPS`) ra khỏi `CodexApp.tsx`, giúp giảm độ phức tạp của component gốc và dùng chung nhất quán giữa Sidebar Desktop, Breadcrumb Header và Mobile Bottom Dock.
- **Xây dựng `src/components/ui/ImperialPrimitives.tsx`**: Cung cấp bộ nguyên tử UI chuẩn hóa (`ImperialButton`, `ImperialBentoCard`, `ImperialSegmentedControl`, `ImperialViewSkeleton`, `MobileBottomNavDock`, `UnsavedChangesPrompt`) với 0 thư viện ngoài phát sinh.

---

## 3. Tách Gói Động (`next/dynamic` Code-Splitting)

Trong phiên bản V8.0, `CodexApp.tsx` nạp tĩnh (eager import) toàn bộ các phân hệ nặng ngay trong lần tải đầu tiên. Trong V9.0, **24 phân hệ & modal chuyên sâu** đã được chuyển sang nạp động theo yêu cầu kèm khung chờ `ImperialViewSkeleton`:
- Các Studio chuyên biệt: `AtlasView` (kèm Three.js / Globe 3D), `RoyalHeraldryStudio`, `CharacterCodexHub`, `KingdomCodexHub`, `V4WorldStudioView`, `V3OmniverseStudioView`, `KnowledgeGraphView`, `TimelineView`, `CalendarView`, `ConlangStudioView`, `LoreboardView`, `MediaVaultView`, `WikiHealthView`, `CodexDomainPortalView`, `CategoryManagerView`, `TrashView`.
- Các Modal nghiệp vụ: `EntryDetailView`, `EntryEditorModal`, `PublishCenterModal`, `BookPublisherModal`, `BatchCsvImportModal`, `WorkspaceSettingsModal`, `TypeSchemaModal`, `SystemBackupCenterModal`.

### Kết quả đo lường thực tế từ `next build`:
- **Page JS của `/` (`CodexApp`)**: Giảm từ **`452 kB` xuống còn `228 kB` (-49,6%)**.
- **First Load JS của `/`**: Giảm từ **`577 kB` xuống còn `352 kB` (-39,0%, tiết kiệm `225 kB`)**.
- **Số gói npm cài mới**: **`0` gói** (giữ bộ phụ thuộc gọn nhẹ, an toàn chuỗi cung ứng).
