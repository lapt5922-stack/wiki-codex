# MASTER DEVELOPMENT PLAN — AETHEL CODEX V9.0

- **Dự án:** Aethel Codex — Encyclopedia & Worldbuilding Platform
- **Phiên bản nguồn:** V8.0
- **Phiên bản đích:** V9.0 ("Imperial Astral Sanctum")
- **Ngày lập:** 2026-11-26

## 1. Mục tiêu Cốt lõi V9.0
1. **Complete UI/UX Redesign:** Thiết kế lại toàn bộ hệ thống giao diện theo phong cách *Imperial Fantasy Library × Premium Digital Encyclopedia × Modern Knowledge Management × Arcane World Atlas*, kết hợp các micro-interactions tinh tế lấy cảm hứng từ Uiverse.
2. **Motion UI Chuẩn GPU:** Hệ thống chuyển động sử dụng `transform` và `opacity`, tôn trọng `prefers-reduced-motion: reduce` và chế độ `Performance: Lite`.
3. **Adaptive Responsive Master:** Tối ưu độc lập cho Desktop, Laptop, Tablet và Mobile (thanh điều hướng đáy Mobile Bottom Dock 5 điểm chạm `>= 44px`, Bottom-Sheet Modals, bảng dữ liệu thích ứng).
4. **Zero Feature Loss & Zero Data Loss:** Bảo toàn 100% nghiệp vụ, dữ liệu, API, 360 Vương quốc, 17 nhóm Nhân vật, 18 nhóm Quốc gia, 14 phân hệ Codex, Heraldry/Flag Studio (2.850+ mẫu), 3-Level Freeform CRUD, Empty-Field Engine và Lightbox V2.
5. **Code Re-Engineering & Bundle Splitting:** Tách tải động (`next/dynamic`) cho các studio nặng trong `CodexApp.tsx`, gom cấu hình điều hướng và UI Primitives dùng chung, dọn sạch dead code đã xác minh (`CodexModulesHub.tsx`, `WorldAnalyticsDashboard.tsx`).
6. **Security, Concurrency & Disaster Recovery:** Đồng bộ `AUTH_SECRET || SESSION_SECRET`, Rate Limiting đăng nhập, bảo vệ RBAC cho `/api/publish` & `/api/characters/audit`, Optimistic Concurrency (`expectedUpdatedAt`), đồng bộ PostgreSQL cho `health_resolutions` và API Sao lưu/Khôi phục toàn hệ thống (`/api/backup` kèm mã băm SHA-256).
7. **Advanced Wiki Intelligence:** Tìm kiếm xếp hạng độ liên quan xuyên Workspace theo RBAC, Knowledge Graph Pro đa thực thể và AI Consistency & Missing Data Suggestions an toàn (chỉ lưu đề xuất chờ duyệt).

## 2. Lộ trình 8 Giai đoạn Thực thi
- **Phase 1 — Complete System Audit:** Kiểm kê toàn bộ components, repositories, API routes, dependencies, bundle size và lỗ hổng bảo mật.
- **Phase 2 — Data Protection & Security Hardening:** Củng cố Auth, RBAC, Optimistic Concurrency, PostgreSQL sync cho `health_resolutions` và Full-System Backup/Restore (`/api/backup`).
- **Phase 3 — V9.0 Design System & Complete UI/UX Redesign:** Xây dựng Design Tokens V9.0, `src/components/ui/ImperialPrimitives.tsx`, `navigation-config.ts`, thiết kế lại App Shell, Grand Hall, Database Studio, Universal Profile Detail và Form Builder.
- **Phase 4 — Motion UI & Adaptive Performance:** Tích hợp hiệu ứng chuyển trang, micro-interactions Uiverse, Skeleton Shimmer và Reduced Motion.
- **Phase 5 — Code Re-Engineering & Bundle Optimization:** Code-splitting `next/dynamic` trong `CodexApp.tsx` và dọn dẹp 2 file dead code không còn tham chiếu.
- **Phase 6 — Advanced Wiki Intelligence:** Nâng cấp `/api/search`, Knowledge Graph Pro (`src/lib/graph.ts`) và AI Consistency/Missing-Data Modes (`/api/ai-assistant`).
- **Phase 7 — Complete QA Automation:** Thực thi toàn bộ 83 bài kiểm thử hiện hữu + bộ kiểm thử tích hợp V9.0 mới, kiểm tra TypeScript và Production Build.
- **Phase 8 — Production Release & Deliverables:** Xuất đầy đủ 11 báo cáo kỹ thuật V9.0 và phát hành lên nhánh `main`.
