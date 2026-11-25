# BÁO CÁO HIỆU NĂNG & DUNG LƯỢNG GÓI TẢI (PERFORMANCE REPORT — V9.0)

**Dự án:** Aethel Codex V9.0  
**Phương pháp đo:** Đo trực tiếp từ đầu ra biên dịch sạch `next build` (Next.js `15.5.29`) và bài benchmark tải lớn trong Vitest.

---

## 1. So Sánh Dung Lượng Bundle Production (V8.0 vs V9.0)

| Chỉ số đo lường | V8.0 Baseline (`ae3a6c7`) | V9.0 Release | Mức cải thiện thực tế |
|---|---:|---:|---:|
| **Page JS tại `/` (`CodexApp`)** | `452 kB` | **`228 kB`** | **Giảm `224 kB` (-49,6%)** |
| **First Load JS tại `/`** | `577 kB` | **`352 kB`** | **Giảm `225 kB` (-39,0%)** |
| **First Load JS tại `/public/[workspaceSlug]`** | `107 kB` | **`107 kB`** | Giữ nguyên mức siêu nhẹ |
| **First Load JS tại `/public/[workspaceSlug]/[entrySlug]`** | `132 kB` | **`132 kB`** | Giữ nguyên mức siêu nhẹ |
| **Shared JS dùng chung toàn ứng dụng** | `103 kB` | **`103 kB`** | Không phình to thư viện nền |
| **Tổng số Route biên dịch thành công** | `37 / 37` | **`38 / 38`** | +1 route `/api/backup` |

> **Nhận xét kỹ thuật:** Mặc dù V9.0 bổ sung thêm Đại Sảnh Bento mới, Database Studio 4 chế độ xem, Thanh điều hướng Mobile, Trung tâm Sao lưu Thảm họa, Omni-Search xuyên không gian, Đồ thị Tri thức Pro và AI Lore Studio, dung lượng JavaScript tải lần đầu của trang chủ vẫn **giảm gần một nửa (-49,6% ở chunk trang)** nhờ kiến trúc tách 24 phân hệ nặng qua `next/dynamic`.

---

## 2. Hiệu Năng Xử Lý Dữ Liệu Lớn & Đồ Họa Chuyển Động

1. **Benchmark 10.000 Hồ sơ (`codex-core.test.ts`)**:
   - Phân trang máy chủ, tìm kiếm tiếng Việt không dấu (`normalizeVietnamese`) và tính tổng đếm đệ quy cây danh mục trên **10.000 hồ sơ** hoàn thành trong **`364 ms`**.
2. **Đồ thị Tri thức Pro (`KnowledgeGraphView.tsx`)**:
   - Giới hạn thông minh Top-120 nút trung tâm kèm hạn ngạch cân bằng đa thực thể (`CHAR-`, `KING-`, `Entry`) và bố cục vòng tròn đồng tâm tất định $O(N)$ (0 giật khung hình so với mô phỏng vật lý lực đẩy nặng CPU).
3. **Motion UI 60fps**:
   - Mọi hiệu ứng chuyển trang, thẻ Bento và nút ánh kim chỉ biến đổi `transform` và `opacity` trên tầng tổng hợp GPU, không gây `layout thrashing` hay `reflow`.
