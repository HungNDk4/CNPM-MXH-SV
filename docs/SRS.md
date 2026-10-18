# SRS — Software Requirements Specification
**Baseline DRAFT** (2026-10-17). **Approved product priority:** Human A selected Option B; free sharing is MVP and VNPay Sandbox deferred. Detailed workflows still DRAFT. See [MVP_SCOPE.md](MVP_SCOPE.md). FR = yêu cầu đề xuất; trạng thái 'có code' không phải test PASS. Phải xác nhận với nhóm và giảng viên.

## Actor
- GUEST: người chưa đăng nhập.
- STUDENT: người dùng đã xác thực, role `student`.
- ADMIN: role `admin`.
- VNPAY: hệ thống thanh toán Sandbox bên ngoài — DEFERRED extension; not an MVP actor.

## Yêu cầu chức năng (FR)
| ID | Actor | Yêu cầu/tiêu chí nghiệm thu | Hiện trạng source |
|---|---|---|---|
| FR-01 | GUEST | Đăng ký với email hợp lệ, không trùng, mật khẩu được hash | FE + BE có code |
| FR-02 | STUDENT | Đăng nhập, refresh, logout; token hết hạn được xử lý | FE + BE có code; chưa test |
| FR-03 | GUEST/STUDENT | Xem feed công khai, phân trang; chỉ xem bài active | Có code, GET hiện bị authenticate chặn guest |
| FR-04 | STUDENT | Tạo câu hỏi, thảo luận, tài liệu với tiêu đề hợp lệ | FE + BE có code |
| FR-05 | STUDENT/ADMIN | Chỉ tác giả hoặc admin được sửa/xóa mềm bài | BE có code, FE thiếu thao tác |
| FR-06 | GUEST/STUDENT | Xem chi tiết, tác giả, bình luận; không lộ URL tài liệu trả phí | FE stub; BE detail có kiểm tra nhưng list còn lộ URL |
| FR-07 | STUDENT | Bình luận/trả lời bài; chỉ người có quyền xóa | BE có code, FE thiếu |
| FR-08 | STUDENT | Like/unlike bài/bình luận; chống like trùng | BE có code, FE thiếu |
| FR-09 | GUEST/STUDENT | Tìm kiếm theo từ khóa, loại bài, môn học | BE hỗ trợ một phần; FE chưa nối |
| FR-10 | GUEST/STUDENT | Xem profile công khai; người dùng sửa hồ sơ và đổi mật khẩu của mình | BE có code; FE profile stub |
| FR-11 | GUEST/STUDENT | **MVP:** 1 PDF/bài ≤10 MiB; **hiển thị active ngay sau validation + lưu/commit thành công**; Guest đọc metadata, người đăng nhập được tải; Admin có thể ẩn/xóa sau đăng. Storage DRAFT | Source chưa có upload/download hoặc kiểm thử runtime |
| FR-12 | ADMIN | Ẩn/xóa bài vi phạm, kiểm soát tài khoản | Quyền admin nền tảng; UI/quy trình thiếu |
| FR-13 | STUDENT/VNPAY | **DEFERRED:** mua tài liệu bằng VNPay Sandbox; không bắt buộc MVP | BE khung, FE thiếu; phải chặn an toàn khi chưa mở |
| FR-14 | STUDENT | **DEFERRED:** phân quyền tài liệu trả phí | Model tồn tại; hiện chưa an toàn, phải chặn paid path trong MVP |

## MVP boundary và security gate
- **MVP DRAFT requirements:** FR-01 tới FR-12; nhóm cần duyệt chi tiết trước khi gọi SRS APPROVED.
- **DEFERRED:** FR-13 và FR-14; không yêu cầu chạy VNPay Sandbox trong demo MVP.
- **BẮT BUỘC trước demo:** dù payment deferred, API checkout/callback/paid document từ source cũ vẫn có thể truy cập; phải chặn từ backend và kiểm thử trực tiếp, không chỉ ẩn giao diện. Không được rò URL file trả phí.
- **CONFIRMED DOC-01:** website tiếp nhận PDF trực tiếp. **ADR-011 CONFIRMED:** guest xem metadata tài liệu, phải login mới download. **ADR-012 CONFIRMED:** tối đa 10 MiB (10.485.760 byte, inclusive) và đúng 1 PDF/bài. **ADR-013 CONFIRMED:** PDF được publish active ngay sau khi hợp lệ và lưu thành công; admin ẩn/xóa sau đăng. **OPEN:** storage/deployment, retention, chống mã độc/quota, Guest với các post khác, báo cáo vi phạm/khôi phục và chi tiết Admin UI.

## FR-11 — Free PDF upload (product mechanism CONFIRMED, detailed behavior DRAFT)
- Sinh viên đăng nhập gửi `multipart/form-data` chứa PDF + metadata của bài tài liệu.
- **ADR-012:** Backend chỉ cho phép đúng **1 file PDF trong mỗi bài tài liệu**, có kích thước **>0 và ≤10.485.760 byte**. Thừa file, file rỗng, quá ngưỡng, không phải PDF → reject, không tạo bài/file dở dang. Frontend chỉ kiểm tra sớm, không thay backend validation.
- Backend kiểm tra extension/MIME/file signature, lưu với key ngẫu nhiên không dùng original filename cho filesystem.
- Dữ liệu DB lưu metadata/file key, không đặt nội dung PDF vào bảng `posts` theo phương án thiết kế; storage location cần duyệt.
- Guest được xem danh sách và metadata công khai của tài liệu active; yêu cầu tải PDF thiếu token/phiên hợp lệ phải bị API từ chối 401. Sinh viên đăng nhập được tải PDF miễn phí active; hidden/deleted không được tải.
- File invalid/oversize, unauthenticated upload, interrupted upload, unauthorized delete, removed document phải có response/test và cleanup.
- Hiện source chỉ ghi `file_url`, `server/uploads` public; **chưa triển khai** upload PDF theo quyết định mới.
- Chi tiết thiết kế/test: [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md). **10 MiB/1 PDF mỗi bài đã được Human A phê duyệt trong ADR-012**. Cách lưu file và kiểm duyệt vẫn là bản thiết kế.

## Quy tắc nghiệp vụ cần duyệt
1. Một email tương ứng tối đa một tài khoản.
2. Guest đọc nội dung public là đề xuất ADR-002 còn OPEN; viết/tương tác phải xác thực; mua không thuộc MVP.
3. Tác giả hoặc admin có thể chỉnh sửa/xóa bài, nhưng giao dịch đã tạo cần giữ tính nhất quán lịch sử.
4. **DEFERRED extension:** Tài liệu có phí chỉ cấp quyền sau khi backend xác thực giao dịch đúng amount, mã tham chiếu, trạng thái, chữ ký. Callback lặp không được cộng tiền/cấp quyền thêm lần nữa.
5. **DEFERRED extension:** Tác giả không mua tài liệu của chính mình; không thanh toán lại tài liệu đã sở hữu quyền.
6. Không hiển thị link file/đường dẫn trực tiếp cho người chưa có quyền, kể cả trong feed, cache, log và static upload.
7. Nội dung vi phạm phải có chính sách kiểm duyệt và lưu trữ phù hợp (đề xuất; chưa thiết kế).
8. Không coi người đăng ký là sinh viên được xác minh nếu chưa có quy trình xác minh.

## NFR — Phi chức năng (mục tiêu, chưa đo đạt)
- NFR-01: Không lưu mật khẩu thô; bí mật qua env; giới hạn đăng nhập và validate input.
- NFR-02: Phân quyền ở backend; tránh IDOR, URL lộ file; có log audit cho thay đổi trạng thái thanh toán.
- NFR-03: Trả về lỗi HTTP/JSON nhất quán, thông báo dễ hiểu.
- NFR-04: Responsive tối thiểu desktop/mobile cho luồng chính.
- NFR-05: Tác vụ phân trang và chỉ mục DB phục vụ dữ liệu demo; chưa đặt SLA khi chưa đo tải.
- NFR-06: Source cài được từ README bằng một MySQL local; CI chạy được build/syntax; test runtime ghi thành chứng cứ.
- NFR-07: Không dùng thẻ thật/số tiền thật trong môi trường demo; không commit dữ liệu nhạy cảm.

## Tiêu chí ngoài phạm vi
Không yêu cầu realtime chat, nhóm học tập, gợi ý AI hay production money movement trừ khi cập nhật quyết định phạm vi.

## Ghi chú
Danh sách use case chi tiết, ngoại lệ và sơ đồ UML sẽ được bổ sung theo từng FR/issue. Không tự coi bảng này là biên bản phê duyệt yêu cầu.

## BR-DOC-ACCESS-01 — Access policy CONFIRMED by Human A (2026-10-18)
- **Read metadata:** Guest and authenticated accounts may list/search/view title/description/subject/uploader of **active free PDF document** posts; no authentication needed for these metadata responses.
- **Read file bytes:** login required. Unauthenticated `GET /api/documents/:postId/download` returns **401**, with no PDF body, no signed/public storage URL and no redirect that leaks content. Invalid/expired sessions are unauthorized.
- **Signed-in student/admin:** may download **active, free, public** PDFs even if uploaded by another student. Hidden/deleted, unavailable or future paid documents must be rejected according to approved visibility policy; precise 403/404 concealment convention is design-level DRAFT.
- **Upload/update/delete:** write action requires authentication and existing owner/admin checks; exact administrative policy still DRAFT.
- **Not implied:** guest access to other post types, inline PDF preview, university-verification requirement or new file-size limits.
- **Tests:** T-DOCFREE-01..06; see [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md), [TEST_PLAN.md](TEST_PLAN.md). Current source does not implement this; do not label QA PASS.

## BR-DOC-UPLOAD-01 — PDF quantity and size, confirmed Human A 2026-10-18
1. New document post must contain exactly **one** uploaded PDF (field `file` in proposed multipart API); zero or two+ files are invalid.
2. PDF byte count must be **1 through 10,485,760 inclusive** (10 MiB = 10 × 1,048,576). At exactly 10 MiB a structurally acceptable valid PDF is not denied solely due to size; at 10 MiB + 1 byte it must be rejected. Empty file rejected.
3. MIME, extension and content checks are backend requirements; merely renaming a non-PDF file does not grant acceptance. Security scanning and handling hostile PDFs remain architectural concerns.
4. Reject invalid uploads without partial public post, database row or orphaned object. Return bounded error with clear reason. UI displays size/count/type validation errors.
5. **Not decided:** editing/replacing an attached PDF, storage capacity/quotas, administrative preapproval, or max page count. Paid documents/VNPay remain DEFERRED.
6. Acceptance tests: T-UP-LIM-01..06 in [TEST_PLAN.md](TEST_PLAN.md). All **NOT RUN** until implemented and exercised.

## BR-DOC-PUBLISH-01 — Automatic publication and post-moderation (Human A CONFIRMED 2026-10-18)
1. An authenticated Student submits exactly one valid free PDF (ADR-012). The system completes upload validation, protected file persistence and DB transaction successfully; **then** sets the document post to `active` and returns success without waiting for manual admin approval.
2. The new `active` free document appears immediately in public document listings/search and safe metadata detail (Guest). An authenticated Student can download PDF bytes (ADR-011). Public metadata contains no raw PDF URL or storage key.
3. Rejected/interrupted upload or failed storage/DB transaction **must not** produce public/active content or orphaned file; no misleading success message.
4. Authenticated Admin can hide/delete already published PDFs for violations. Hidden/deleted document must not appear in public lists/details or be downloaded via direct API, including by its creator. Non-admin may not hide another person's document.
5. Report-button, reviewer queue, appeal/unhide and any automatic malware scanning engine details are NOT approved by this decision. Physical deletion retention policy is a separate design decision.
6. Test scenarios `T-PUBLISH-01..06` are defined in [TEST_PLAN.md](TEST_PLAN.md), **NOT RUN**. Current source has an `active/hidden/deleted` field but does not implement this full upload/download/moderation workflow.

## NFR-08 — Budget guardrail (human cost constraint CONFIRMED, numeric target PROPOSED)
The two-person student team requires low-cost operations. **Recommendation only:** avoid paid subscriptions and target zero incremental recurring cloud fees in the local-development/classroom-demo stage using local Node/Express+MySQL and private PDF disk storage. Any online/demo deployment must document backend, database, storage, domain and bandwidth costs, free-tier quotas, card/billing requirements and an explicit approval gate **before incurring fees**. A free storage tier alone does not mean the entire website is free. No hosting/storage provider approved yet. See [STORAGE_COST_REVIEW.md](STORAGE_COST_REVIEW.md) and ADR-014 in [DECISIONS.md](DECISIONS.md).
