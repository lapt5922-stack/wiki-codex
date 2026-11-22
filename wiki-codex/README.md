# ✦ Aethel Codex — Universal Wiki & Knowledge Codex

Ứng dụng web **100% thuần Wiki & Bách khoa tri thức (Universal Wiki & Knowledge Codex)** mang phong cách **Huyền ảo Fantasy (Arcane Grand Archive)**, lược bỏ hoàn toàn mọi yếu tố trò chơi (không chỉ số RPG/chiến đấu, không đấu trường, không trang bị/cường hóa/khảm ngọc, không gacha/xúc xắc).

## Tính năng Nổi bật
- **Font chữ Tiếng Việt đầy đủ dấu** (`Playfair Display`, `Be Vietnam Pro`, `JetBrains Mono` với `subset: vietnamese`, `display: swap`) + **4 giao diện màu Huyền ảo** (*Tinh Hà Cổ Thư*, *Huyết Nguyệt Nhung*, *Giấy Da Hoàng Kim*, *Rừng Ngọc Cổ Đại*) & **Chế độ Đọc tập trung (Zen Mode)**.
- **Kiến trúc Quy mô lớn**: PostgreSQL (`src/db/schema.sql`) với chỉ mục `GIN (pg_trgm)`, phân trang Keyset/Cursor, truy vấn nhẹ (Card Projection), tải ảnh lười tách `thumb_url`/`full_url` — sẵn sàng cho hàng chục nghìn thẻ nhân vật, vương quốc và hàng triệu dữ liệu.
- **Cổng Web Công khai & 1-Click Push Tự động**: đường dẫn chuẩn SEO `/public`, `/public/[workspaceSlug]`, `/public/[workspaceSlug]/[entrySlug]` kèm nút **Đẩy lên Web Công khai (1-Click Push)** kích hoạt revalidation + Deploy Webhook (Vercel, Netlify, Cloudflare, Render, GitHub).
- **Bộ Ngôn ngữ Thế giới Riêng (World Conlang Engine)**: tích hợp sẵn **Cổ ngữ Aethelian (*Aethel'va*)** hỗ trợ chuyển đổi **Tiếng Việt → Cổ ngữ chỉ với 1 Ấn** (Phiên âm, Văn tự Cổ ngữ Tượng hình, Song ngữ) và CRUD tự tạo ngôn ngữ/từ điển mới.
- **CRUD Toàn diện mọi phân hệ + Kho 100+ Biểu tượng & Ký hiệu Cổ ngữ**: Không gian, Danh mục đa cấp (Cha → Con → Cháu, đếm không trùng, chống vòng lặp, xóa an toàn), Loại hồ sơ & Trường động, Hồ sơ Codex (Infobox, 6 Tab, Revisions, Duplicate, Spoiler Gate), Đồ thị Tri thức + BFS tìm đường + Gia phả, Biên niên sử, Bản đồ Atlas gắn ghim, Sức khỏe Wiki (Orphans, Red Links), So sánh 2 hồ sơ song song, Phân quyền RBAC (`admin`/`editor`/`guest`), Xuất/Nhập JSON/Markdown/HTML/ZIP và Tìm kiếm toàn cục `Ctrl+K`.

## Chạy nhanh Cục bộ
```bash
npm install
npm run dev
```
Mở `http://localhost:3000`. Nếu chưa cấu hình `DATABASE_URL`, hệ thống tự động chạy bằng kho JSON cục bộ (`.data/codex-db.json`) để dùng ngay lập tức.

### Mở cổng Công khai (LAN / Internet)
```bash
npm run build
npm run start:public
```
- Kết hợp `cloudflared tunnel --url http://localhost:3000` để chia sẻ URL công khai ngay lập tức, hoặc deploy bằng `vercel.json` / `Dockerfile` và gắn `DEPLOY_WEBHOOK_URL` trong `.env.local` để dùng nút **1-Click Push**.

### Tài khoản Demo (RBAC)
- **Admin**: `admin@codex.local` / `admin123`
- **Biên tập viên**: `editor@codex.local` / `editor123`
- **Người xem khách**: `guest@codex.local` / `guest123` (hoặc truy cập trực tiếp `/public`)

## Kiểm tra Chất lượng
```bash
npx tsc --noEmit
npm test
npm run build
```
