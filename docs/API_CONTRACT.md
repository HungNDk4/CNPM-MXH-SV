# REST API Contract — hiện trạng và khoảng trống
**DRAFT**, source map tại commit `0993a421`. Prefix `/api`. API trả JSON `{success, data?, message?, errors?}` trừ VNPay redirect/IPN. Auth = Bearer JWT.

| Method | URL | Access hiện tại | Tác dụng |
|---|---|---|---|
| POST | /auth/register | Guest | Tạo tài khoản |
| POST | /auth/login | Guest | Đăng nhập |
| POST | /auth/refresh | Guest + refresh token body | Rotate token |
| POST | /auth/logout | Guest + refresh token body | Revoke token |
| GET | /auth/me | Auth | Thông tin của mình |
| GET | /posts | **Auth (code)** | Feed/filter/page; dự kiến Public |
| GET | /posts/:id | **Auth (code)** | Detail; dự kiến Optional auth |
| POST/PUT/DELETE | /posts, /posts/:id | Auth, owner/admin cho sửa/xóa | CRUD |
| GET/POST | /comments | GET public, POST auth | Bình luận |
| DELETE | /comments/:id | Owner/admin | Xóa mềm |
| POST | /likes | Auth | Toggle like |
| GET | /likes/count | Public | Đếm like |
| GET | /users/:id | Public | Public profile |
| PUT | /users/profile | Auth | Sửa profile |
| PUT | /users/change-password | Auth | Đổi mật khẩu |
| POST | /orders | Auth | Khởi tạo thanh toán Sandbox |
| GET | /orders/my | Auth | Lịch sử mua |
| GET | /payment/vnpay-return | VNPay/browser | Callback redirect |
| GET | /payment/vnpay-ipn | VNPay server | IPN server-to-server |
| GET | /health | Public | Health check |

## Contract phải thống nhất khi triển khai
- Public GET `/posts` và `/posts/:id` cần optional-auth middleware nếu guest được xem; không thay toàn bộ API mà quên guard.
- `GET /posts` hiện có thể gửi `file_url` trả phí. Phải phân loại safe DTO theo quyền; không lộ qua list/detail/search.
- GET/POST query fields và validation pagination chưa được chuẩn hóa; nên giới hạn page/limit và kiểu input.
- Status 401 = chưa xác thực; 403 = thiếu quyền; 404 = không tồn tại/không thể xem; 409 = conflict; 422 = dữ liệu không hợp lệ.
- Frontend gọi API qua `client/src/services/api.js`; thay đổi response shape phải sửa nơi dùng và test.
- VNPay return chỉ phục vụ UX; trạng thái thanh toán đáng tin phải được ghi nhận từ IPN xác thực. Chưa đạt gate bảo mật.

## Chưa có endpoint an toàn (đề xuất, KHÔNG đã triển khai)
- GET /documents/:postId/download — xác thực quyền sở hữu/quyền mua rồi stream file private.
- GET /orders/:id/status — tra cứu trạng thái cho buyer sau redirect, không tin query `status` từ browser.
- Admin moderation APIs — cần thiết kế chi tiết theo FR-12.

## Planned change for FR-11 (NOT IMPLEMENTED, DOC-01 confirmed)
- Direct PDF upload is the approved MVP product mechanism; current post creation takes `file_url` as text and does **not** handle file bytes.
- **Proposal:** POST `/api/documents` with `multipart/form-data`, one `file` field plus title/description/subject/tags, authenticated; returns public-safe document/post DTO. Error cases: invalid PDF 415, too large 413, unauthenticated 401, validation 400. Detailed design [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md).
- **Proposal:** GET `/api/documents/:postId/download` with server-side authorization and streamed PDF attachment. Guest eligibility is **OPEN**, not yet approved. Never expose storage key/absolute path or allow raw static access.
- Existing payment/order endpoints must still be denied by backend before MVP demo (SEC-03). Upload implementation will be a separate reviewed PR; not included in this docs-only decision.
