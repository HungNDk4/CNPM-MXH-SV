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
- **Proposal for route, CONFIRMED business rule ADR-011:** GET `/api/documents/:postId/download` with server-side authentication and streamed PDF attachment. Missing/invalid token returns **401**, no PDF body or redirect; active signed-in student may download any active/free PDF. Never expose storage key, absolute path or raw static access.
- Existing payment/order endpoints must still be denied by backend before MVP demo (SEC-03). Upload implementation will be a separate reviewed PR; not included in this docs-only decision.

## ADR-011 document metadata/download access (APPROVED requirement, NOT IMPLEMENTED)
- `GET /api/posts?type=document` and `GET /api/posts/:id` for active/free **PDF document metadata** must allow Guest. Any data response exposes only safe public fields, such as title, description, subject, uploader, file display name; no binary, raw `file_url`, `storage_key` or public static file URL. The current code's mandatory `authenticate` blocks guests; do not claim it works yet.
- `GET /api/documents/:postId/download` **proposed path**: requires active authenticated session. 401 on unauthenticated/invalid/expired token without bytes; logged-in active student downloads active/free PDF (200 attachment). Hidden/deleted/paid PDFs denied. Authorization must be enforced server-side regardless of UI.
- Guest scope applies to **document metadata**; public access to all other post types is still ADR-002 OPEN. Routes may require splitting read contracts, filtering DTOs or implementing optional-auth without opening sensitive content.
- Requirements & negative tests: [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md), `T-DOCFREE-01..06`.

## ADR-012 upload quantity and size (APPROVED requirements, NOT IMPLEMENTED)
- **Proposed** `POST /api/documents`, multipart field `file`: exactly 1 PDF, length in **[1, 10,485,760] bytes** inclusive. Reject missing/extra files, other formats or zero bytes. Client pre-validation is advisory only; backend enforces.
- **Suggested error mapping (contract detail still DRAFT):** 400/422 for missing/extra/empty or invalid metadata; 413 for PDF exceeding 10 MiB; 415 for non-PDF. No partial DB post or storage object must remain after rejected upload.
- Do not expose raw storage URL in upload response; existing `/uploads` static route is not appropriate for protected new PDF bytes. Proposed download requires authentication per ADR-011, active/free document visibility enforced.
- Boundary acceptance: T-UP-LIM-01..06. If actual route naming/response body changes, update SRS/API/test together in one reviewed PR.

## ADR-013 — Immediate publish and hide/delete (approved business behavior; endpoints DRAFT)
- Proposed upload `POST /api/documents`: validate 1 free PDF ≤10 MiB, persist file+metadata consistently, return 201 with `active` status **only after successful storage and DB commit**. No Admin preapproval/pending queue.
- Public guest document list/detail include only `active`, free, safe metadata; hidden/deleted PDF posts never appear. Direct `GET /api/documents/:postId/download` authenticates and checks latest post state; denies hidden/deleted **even to the owner**.
- Only Admin may hide another user's document for moderation. Endpoint and exact error responses still subject to API design review. Failed upload does not create public post/file and does not return publication success.
- `T-PUBLISH-01..06` are acceptance plans **NOT RUN**. No source implementation changed in this docs-only PR.
