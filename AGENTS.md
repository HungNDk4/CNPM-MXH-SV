# AGENTS.md — Quy ước cho AI coding agents

**MANDATORY SESSION GATE:** Trước khi làm bất kỳ task nào, đọc `PROJECT_CONTROL.md` → `docs/ops/CURRENT_STATE.md` → `docs/ops/TASK_BOARD.md` → `docs/ops/WORKTREE_REGISTRY.md` → `docs/ops/SESSION_LOG.md` → `docs/ops/SESSION_START.md`. Kiểm tra branch/commit/PR/CI trực tiếp; cập nhật trạng thái và handoff khi kết thúc. GitHub branch ≠ local worktree.

Áp dụng cho toàn bộ repository `CNPM-MXH-SV`. Đọc `README.md`, `CONTRIBUTING.md`, `docs/TEAM_WORKFLOW.md`, `docs/TECH_STACK_PLAYBOOK.md`, `docs/ANALYSIS_DESIGN_PROCESS.md`, `docs/AI_SKILLS_PLAYBOOK.md`, `docs/SRS.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` trước khi sửa code. Nhóm có đúng 2 thành viên con người; AI tạo draft/code nhưng không tự duyệt hoặc tự merge.

## Ranh giới và workflow
1. **Không commit/push trực tiếp vào `main`**. Tạo branch mới từ `main`: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`, `test/<slug>`.
2. Một nhiệm vụ / một nhánh / một PR; ghi rõ scope, file thay đổi, test đã chạy, các rủi ro còn lại. Không tự merge, không force-push và không xóa branch người khác khi chưa được yêu cầu rõ ràng.
3. Không thay thế kiến trúc/stack, không đổi schema, không xóa dữ liệu hoặc lịch sử git chỉ vì thuận tiện. Thay đổi DB cần kế hoạch migration + hướng tương thích.
4. Tách **đã có source**, **đã kiểm thử PASS**, và **đề xuất**. Không ghi PASS nếu chưa chạy.
5. Không commit `.env`, secret, token, thẻ thanh toán, dữ liệu người dùng, file upload. Không sửa thông số production/sandbox để chạy tắt.
6. Không implement thanh toán thật, chuyển tiền/rút tiền hoặc công bố tài liệu có phí khi chưa có task và security acceptance riêng.
7. Nếu chưa rõ nghiệp vụ, ghi câu hỏi vào PR / `docs/DECISIONS.md`; không ngầm coi quyết định đề xuất là đã được nhóm duyệt.

## Nguyên tắc code hiện tại
- `client/`: React + Vite + Tailwind; dùng `src/services/api.js` và `src/lib/axios.js` cho API.
- `server/`: Express routes → controllers → Sequelize models; kiểm tra auth, quyền sở hữu, validation.
- `database/schema.sql`: schema gốc; kiểm tra drift với Sequelize; không dùng `sequelize.sync({ alter: true })` trên DB quan trọng.
- Không đưa public URL tài liệu có phí vào response nếu chưa được cấp quyền; xử lý callback thanh toán **idempotent**.
- Mỗi tính năng cần test case hoặc hướng dẫn kiểm chứng; cập nhật docs khi API/schema thay đổi.

## Trước khi gửi PR
- `cd client && npm ci && npm run build`.
- Kiểm tra syntax backend: `cd server && find src -type f -name '*.js' -exec node --check {} \\;` (Linux/macOS/Git Bash); hoặc chạy `node --check` trên từng file thay đổi.
- Test chức năng có MySQL khi sẵn môi trường; ghi rõ kết quả và điều gì chưa kiểm thử.
- Tránh thay đổi ngoài scope. Không sửa nhánh của thành viên khác.
