# Architecture — Source-backed baseline
**DRAFT**, đối chiếu mã nguồn tại `main` commit `0993a421` ngày 2026-10-17. Phân biệt design với verified behavior.

## Context / luồng
```text
Browser (React/Vite + Zustand + Query) ── HTTP JSON /api ──> Express
                                                         ├─ middleware (JWT, validation, rate limit)
                                                         ├─ routes/controllers
                                                         └─ Sequelize ──> MySQL
Student ── redirect ──> VNPay Sandbox ── return/IPN ──> Express (chưa QA)
```

## Hiện có
- Client: `client/src/App.jsx`, `pages/`, `components/`, `stores/authStore.js`, `lib/axios.js`, `services/api.js`.
- API: `server/src/app.js`, `routes/`, `controllers/`, `middlewares/`.
- DB: `database/schema.sql`, `server/src/models/`, Sequelize associations.
- Config: `server/.env.example`, `client/vite.config.js` proxy `/api` sang localhost:5000.
- Upload static: `/uploads` hiện public, **không dùng để phục vụ tài liệu có phí**.

## Mô-đun đề xuất khi triển khai tiếp
- Auth/Profile: identity, role, session.
- Posts/Interaction: feed, detail, comment, like, search.
- Documents: metadata, upload validation, access-controlled download.
- Orders/Payments: idempotent order state machine, verified IPN, read-only result.
- Admin: moderation, status, audit.
Không cần microservices ở phạm vi đồ án.

## Bất biến bảo mật
1. Backend quyết định auth/access. React ProtectedRoute chỉ để UX.
2. Danh sách/chi tiết/search không bao giờ trả URL tài liệu trả phí cho guest/unentitled user.
3. Không phục vụ file trả phí qua static public URLs; phải dùng private storage/secured proxy.
4. Chỉ IPN xác thực và kiểm tra đủ trường mới quyết định trạng thái paid; return page không được trở thành một đường cộng tiền thứ hai.
5. Ghi nhận paid và credit seller là giao dịch nguyên tử, xử lý lặp an toàn; có khóa/unique guard. Không dùng floating point cho số dư.
6. Các thay đổi database phải có migration và rollback plan; tránh tự đồng bộ `alter: true` ngoài DB dev rỗng.

## Vấn đề đã thấy khi static review
- `server/src/routes/post.routes.js`: GET dùng `authenticate` bắt buộc trong khi tài liệu mô tả public.
- `server/src/controllers/post.controller.js`: list không lọc `file_url` cho tài liệu thu phí.
- `server/src/controllers/payment.controller.js`: return cập nhật paid/credit không có guard trạng thái; IPN cùng cập nhật.
- `client/src/pages/posts/PostDetailPage.jsx`, `profile/ProfilePage.jsx`: placeholder.
- `server/src/models/index.js`: RefreshToken timestamps không trùng hoàn toàn SQL gốc.

## Quy tắc thay đổi kiến trúc
Sửa route/API phải cập nhật `docs/API_CONTRACT.md`, SRS và test; sửa models phải cập nhật `docs/DATA_MODEL.md`, DDL/migration. Ghi quyết định kiến trúc quan trọng vào `docs/DECISIONS.md`.
