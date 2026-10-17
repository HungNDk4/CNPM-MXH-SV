# Mini Study Network — Mạng xã hội học tập sinh viên

**Trạng thái:** Đang phát triển (đồ án Công nghệ phần mềm). Repository đã có mã nguồn frontend/backend và schema; **chưa có bằng chứng kiểm thử end-to-end**. Không coi API thanh toán hoặc quyền tải tài liệu là production-ready.

## Mục tiêu
Sinh viên đăng câu hỏi, thảo luận và chia sẻ tài liệu học tập (miễn phí hoặc có phí). Có phân quyền tài khoản và quản trị. VNPay chỉ dùng **Sandbox** trong quá trình đồ án.

## Công nghệ
- Client: React 18, Vite 5, Tailwind CSS, React Query, Zustand, Axios.
- Server: Node.js 20, Express 4, JWT, Sequelize 6.
- Database: MySQL 8 (đề xuất cho môi trường phát triển).
- Thanh toán thử nghiệm: VNPay Sandbox.

## Chạy trên máy cá nhân
1. Cài Node.js 20, npm và MySQL.
2. Tạo schema: `mysql -u root -p < database/schema.sql` (hoặc chạy trong MySQL Workbench).
3. Copy `server/.env.example` thành `server/.env`, thay thông tin DB và hai JWT secret; **không commit `.env`**.
4. Terminal backend: `cd server && npm ci && npm run dev`.
5. Terminal frontend: `cd client && npm ci && npm run dev`.
6. Kiểm tra `http://localhost:5000/api/health`, mở `http://localhost:5173`.

Hướng dẫn và lưu ý: [docs/DEV_SETUP.md](docs/DEV_SETUP.md).

## Bắt đầu làm việc trong nhóm
- [AGENTS.md](AGENTS.md) — quy tắc dành cho các AI coding agents.
- [CONTRIBUTING.md](CONTRIBUTING.md) — Git branch, PR và quy tắc hợp tác.
- [docs/PROJECT_CHARTER.md](docs/PROJECT_CHARTER.md) — mục tiêu, phạm vi và quyết định còn mở.
- [docs/SRS.md](docs/SRS.md) — yêu cầu và tiêu chí nghiệm thu (bản nháp).
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DATA_MODEL.md](docs/DATA_MODEL.md), [docs/API_CONTRACT.md](docs/API_CONTRACT.md) — kiến trúc và hợp đồng API.
- [docs/ROADMAP.md](docs/ROADMAP.md) — thứ tự triển khai; [docs/TEST_PLAN.md](docs/TEST_PLAN.md) — kiểm thử.
- [docs/DECISIONS.md](docs/DECISIONS.md) — nhật ký quyết định chưa chốt.

`architecture_guide.md` là tài liệu gốc; tài liệu trong `docs/` dùng để theo dõi phát triển và **không phải bằng chứng tính năng đã hoạt động**.

## An toàn và giới hạn hiện tại
- API liệt kê bài viết chưa che `file_url` của tài liệu có phí; cần sửa trước khi cho phép sử dụng chức năng trả phí.
- VNPay callback còn nguy cơ ghi nhận lại giao dịch/cộng ví lặp; chưa nghiệm thu.
- Hai trang `PostDetailPage` và `ProfilePage` vẫn là placeholder; nhiều UI chưa nối API.
- Script schema có admin seed dùng hash **placeholder**, không phải tài khoản admin có thể đăng nhập.
- CI đầu tiên chỉ kiểm tra cú pháp JS backend và build frontend; **chưa có test DB, unit/e2e hoặc kiểm thử Sandbox**.
