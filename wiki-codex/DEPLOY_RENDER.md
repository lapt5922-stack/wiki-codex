# Hướng dẫn Port Công khai Wiki Codex & Đại Hành Tinh 360 Quốc gia lên Render.com

## Cách 1: Triển khai 1-Click bằng Blueprint (`render.yaml`) — Khuyên dùng
1. Đẩy thư mục dự án lên một repository GitHub (Public hoặc Private đều được).
2. Đăng nhập vào https://dashboard.render.com/.
3. Chọn **New +** → **Blueprint** → chọn repository GitHub của bạn.
4. Render sẽ tự đọc tệp `render.yaml`, tạo đồng thời:
   - **Web Service (`wiki-codex-atlas`)** chạy Node.js 20 tại khu vực `Singapore` (tốc độ nhanh từ Việt Nam), bind `0.0.0.0:$PORT`, giám sát sức khỏe qua `/api/health`.
   - **PostgreSQL Database (`wiki-codex-db`)** tự động gắn biến `DATABASE_URL` để dữ liệu Wiki, Tác vụ và Bản đồ không bao giờ bị mất khi Render redeploy.
   - Tự động sinh khóa bảo mật `SESSION_SECRET`.
5. Bấm **Apply** và chờ khoảng 2–4 phút để Render build xong. Sau đó truy cập đường dẫn `https://wiki-codex-atlas.onrender.com` (hoặc gắn tên miền riêng có SSL miễn phí trong mục **Settings → Custom Domains**).

## Cách 2: Tạo thủ công Web Service trên Render
- **Root Directory**: `wiki-codex`
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run start:render`
- **Health Check Path**: `/api/health`
- **Environment Variables**:
  - `NODE_VERSION` = `20`
  - `SESSION_SECRET` = *(chuỗi bí mật ngẫu nhiên ≥ 32 ký tự)*
  - `DATABASE_URL` = *(chuỗi kết nối PostgreSQL nếu dùng DB bền vững)*
