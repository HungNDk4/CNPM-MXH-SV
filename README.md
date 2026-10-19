# Mini Study Network — Mạng xã hội học tập sinh viên

> **BẮT ĐẦU SESSION MỚI:** đọc [PROJECT_CONTROL.md](PROJECT_CONTROL.md) trước mọi thay đổi. Đây là mục lục trạng thái, worktree, task board và session logs, tránh phụ thuộc lịch sử chat.

**Trạng thái:** Đang phát triển (đồ án Công nghệ phần mềm). Repository đã có mã nguồn frontend/backend và schema; **chưa có bằng chứng kiểm thử end-to-end**. Không coi API thanh toán hoặc quyền tải tài liệu là production-ready.

## Mục tiêu
Sinh viên đăng câu hỏi, thảo luận và chia sẻ tài liệu học tập **miễn phí**. Có phân quyền tài khoản và quản trị. **Đã chốt Option B (17/10/2026):** VNPay Sandbox và tài liệu thu phí là chức năng mở rộng, **không thuộc MVP**. Trước khi demo phải chặn an toàn các API thanh toán/paid-file hiện tồn tại — ẩn nút UI không đủ.

**Đọc phạm vi MVP:** [docs/MVP_SCOPE.md](docs/MVP_SCOPE.md).

## Công nghệ
- Client: React 18, Vite 5, Tailwind CSS, React Query, Zustand, Axios.
- Server: Node.js 24 LTS, Express 4, JWT, Sequelize 6.
- Database: MySQL 8 (đề xuất cho môi trường phát triển).
- Thanh toán thử nghiệm: VNPay Sandbox.

## Chạy trên máy cá nhân
1. Cài Node.js 24 LTS, npm và MySQL.
2. Tạo schema: `mysql -u root -p < database/schema.sql` (hoặc chạy trong MySQL Workbench).
3. Copy `server/.env.example` thành `server/.env`, thay thông tin DB và hai JWT secret; **không commit `.env`**.
4. Terminal backend: `cd server && npm ci && npm run dev`.
5. Terminal frontend: `cd client && npm ci && npm run dev`.
6. Kiểm tra `http://localhost:5000/api/health`, mở `http://localhost:5173`.

Hướng dẫn và lưu ý: [docs/DEV_SETUP.md](docs/DEV_SETUP.md).

## Bắt đầu làm việc trong nhóm
- [AGENTS.md](AGENTS.md) — quy tắc dành cho các AI coding agents.
- [docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md) — cách phối hợp 2 thành viên và AI.
- [docs/TECH_STACK_PLAYBOOK.md](docs/TECH_STACK_PLAYBOOK.md) — thư viện, version-specific patterns, security gates.
- [docs/ANALYSIS_DESIGN_PROCESS.md](docs/ANALYSIS_DESIGN_PROCESS.md) — quy trình SRS → UML → ERD → API → tests.
- [docs/AI_SKILLS_PLAYBOOK.md](docs/AI_SKILLS_PLAYBOOK.md) — kỹ năng và checklist AI Research/Engineering.
- [docs/REQUIREMENTS_TRACEABILITY.md](docs/REQUIREMENTS_TRACEABILITY.md) — trace FR → thiết kế → test.
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

## Ubuntu 24.04 LTS — Development environment
- **Complete instructions:** [docs/UBUNTU_SETUP.md](docs/UBUNTU_SETUP.md).
- After installing Node.js 24 (nvm), MySQL 8 and Git: `bash scripts/ubuntu/doctor.sh` then `bash scripts/ubuntu/setup.sh`.
- Configure the generated **local-only** `server/.env`, create dedicated MySQL user/database, import `database/schema.sql`, and run backend/client in two Ubuntu terminals.
- The Ubuntu MySQL integration GitHub Actions job uses an **ephemeral MySQL 8 container** with no real data; no local Ubuntu laptop has yet been configured remotely.
- **Never expose** the current Express app publicly: legacy payment routes, raw `/uploads` and PDF permissions still require P0 fixes.
