# Setup môi trường phát triển
**Source hiện tại, chưa xác nhận chạy PASS trên máy thành viên.**

## Cần cài
- Node.js 24.x LTS và npm (tham khảo `.nvmrc`; cần kiểm thử bằng CI sau khi đổi phiên bản).
- MySQL (đề xuất 8.x), MySQL Workbench hoặc CLI.
- Git; VS Code hoặc IDE tùy ý.

## Chạy trên Windows / macOS / Linux
1. Clone repo và checkout nhánh team đang làm.
2. Chạy SQL trong `database/schema.sql` để tạo DB `mini_study_network`. **Chỉ dùng script khởi tạo trên DB dev rỗng**; không dùng như migration với dữ liệu thật.
3. Copy `server/.env.example` → `server/.env`. Thiết lập `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`.
4. Tạo 2 secret ngẫu nhiên độc lập, không dùng mẫu `your_super_secret...` và tuyệt đối không commit.
5. Terminal 1: `cd server`, `npm ci`, `npm run dev`.
6. Terminal 2: `cd client`, `npm ci`, `npm run dev`.
7. API health: `http://localhost:5000/api/health`; UI: `http://localhost:5173`.

### VNPay Sandbox (tùy chọn, KHÔNG là bước chạy MVP)
- Chỉ cấu hình `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL` khi có tài khoản Sandbox.
- Nếu IPN cần gửi từ VNPay về máy local thì callback phải có URL public phù hợp môi trường test.
- Backend thanh toán còn lỗ hổng xử lý lặp/URL tài liệu; **không demo như luồng thanh toán bảo mật đã nghiệm thu**.

## Các lỗi thường gặp
- MySQL refused/Access denied: kiểm tra port và user/password trong `.env`.
- `npm ci` lỗi: kiểm tra Node version; không tự xóa lockfile hoặc chạy `npm audit fix --force` khi chưa review diff.
- Frontend không gọi API: backend phải chạy cổng 5000; Vite proxy `/api` dựa trên cấu hình.
- `/posts` trả 401 khi guest: lỗi contract hiện hữu, đã đưa vào backlog.
- DB schema bị tự chỉnh: `sequelize.sync({alter:true})` chỉ nên dùng môi trường dev không cần giữ dữ liệu.

## Kiểm chứng
- Local manual: health, register/login, create/list, comment, profile, document permissions (theo `TEST_PLAN.md`).
- CI hiện tại: syntax backend + production build frontend; chưa kết nối MySQL, chưa chạy functional tests.
- Dùng issue/PR để ghi PASS/FAIL và bằng chứng thay vì kết luận từ source.

## Ubuntu-specific setup
Use [UBUNTU_SETUP.md](UBUNTU_SETUP.md) and `scripts/ubuntu/doctor.sh` / `setup.sh`. In Ubuntu local development with `database/schema.sql` imported, set `DB_AUTO_SYNC=false` to avoid Sequelize `sync({alter:true})` changing a handcrafted schema. The SQL baseline's fresh-install `likes.updated_at` and `refresh_tokens.updated_at` columns now match Sequelize timestamps; this is **not** a migration for existing populated databases. `npm ci` installs locked dependencies; Ubuntu GitHub CI must execute real MySQL 8 integration tests, not only Node syntax.
