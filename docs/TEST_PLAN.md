# Test Plan và Acceptance Gates
**DRAFT**; các testcase chức năng trong bảng bên dưới mặc định **NOT RUN** trên cloud nếu không có bằng chứng riêng. Có kết quả giới hạn của DEP-01C ở mục tiếp theo; ghi status PASS/FAIL/SKIP kèm environment, commit, bằng chứng và thời điểm.

## DEP-01C — actual Render Free + TiDB Starter preview checkpoint (2026-10-22)

| Gate | Result | Evidence / limits |
|---|---|---|
| DEP-LIVE-01: React SPA root | **PASS (single visit)** | Human A browser loaded site; Render `GET /` 200 + compiled assets 200 at 09:26Z. |
| DEP-LIVE-02: HTTPS API health | **PASS (single visit)** | Human A JSON `success:true`, timestamp `2026-10-22T09:26:36.401Z`; Render matching `GET /api/health 200` at 09:26:36.406Z. |
| DEP-LIVE-03: Express ↔ TiDB connectivity | **PASS (startup authentication)** | Render `MySQL connected successfully` 09:24:17Z; does not prove ORM CRUD/transactions. |
| DEP-LIVE-04: TiDB schema tables | **PASS (table presence only)** | Human A `SHOW TABLES` lists 8 required tables, including document_files; column/index/FK compatibility not fully verified. |
| DEP-LIVE-05: deployed source CI | **PASS (7/7, offline/CI runners)** | `71499dfd63d21feb019d6144efcadc7ee9232951`, run [39753376890](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39753376890); isolated MySQL 8/Chromium not actual TiDB or cloud Blob. |
| DEP-LIVE-06: real private PDF byte operations | **NOT RUN** | Test synthetic authenticated PDF put/get/delete, exact equality, 10MiB limit, invalid uploads, cross-user auth, hidden/deleted direct denial, no leaked storage URL. |
| DEP-LIVE-07: cloud social/auth/paid API checks | **NOT RUN** | Two synthetic accounts register/login/refresh/posts; guest/owner/admin and hard-deny paid endpoints. A single GET feed 200 does not prove complete contract. |
| DEP-LIVE-08: persistence & reliability | **NOT RUN** | Controlled redeploy and sleep/resume, durable TiDB rows/Blob bytes, quota alerts, cold-start/off-network. |

**Gate verdict: INFRASTRUCTURE PREVIEW VERIFIED; full DEP-01C release sign-off PENDING.** Real endpoint: https://mini-study-network-dep01-demo.onrender.com . Evidence detail: [DEP-01C runbook](DEP01C_RENDER_TIDB_PRIVATE_BLOB_RUNBOOK.md). Never downgrade security checks merely because health is 200.

| ID | Luồng kiểm tra | Kỳ vọng |
|---|---|---|
| T-AUTH-01 | Đăng ký email hợp lệ, login, refresh, logout | Token và user trả đúng; logout từ chối token refresh cũ |
| T-AUTH-02 | Email trùng/sai, mật khẩu sai, user inactive | Trả 4xx phù hợp, không rò dữ liệu |
| T-FEED-01 | Guest xem trang chủ và bài công khai | Không cần login, active only |
| T-POST-01 | Student tạo/sửa/xóa bài của mình | Dữ liệu cập nhật; soft delete không hiện feed |
| T-POST-02 | Student khác sửa/xóa bài | 403 |
| T-POST-03 | Search/filters/pagination, đầu vào bất thường | Không lỗi 500; phân trang ổn định |
| T-COMMENT-01 | Bình luận/reply, delete của owner | Hiển thị đúng phân cấp, xóa mềm |
| T-COMMENT-02 | Reply với parent không thuộc post | Phải bị từ chối |
| T-LIKE-01 | Like và unlike; target không tồn tại | Đếm chính xác; không tạo orphan |
| T-PROFILE-01 | Xem profile, sửa hồ sơ, đổi mật khẩu | User khác không được sửa |
| T-DOC-01 | Guest/unentitled gọi feed/detail/download tài liệu trả phí | Không lộ URL, không đọc file |
| T-DOC-02 | Buyer có quyền/owner download | Đúng file, ủy quyền server-side |
| T-PAY-01 | VNPay Sandbox success/fail, kiểm chứng chữ ký/amount | Paid chỉ khi IPN hợp lệ, không cấp quyền khi fail |
| T-PAY-02 | IPN lặp, IPN và return đến đảo thứ tự | Không cộng ví/cấp quyền hai lần |
| T-PAY-03 | User sửa query `status=success` trên client | UI không coi đó là bằng chứng thanh toán |
| T-ADMIN-01 | Admin ẩn bài, Student bị chặn hành động admin | Đúng role/ownership |
| T-OPS-01 | `npm ci`, build client, server syntax/health | PASS và lưu log thực tế |

## Gate theo mức
- **G0 (setup):** docs review, CI thực sự chạy, cấu hình local của nhóm.
- **G1 (MVP core):** T-AUTH, T-FEED, T-POST, T-COMMENT, T-LIKE, T-PROFILE, T-ADMIN.
- **G2 (paid documents):** T-DOC + T-PAY đầy đủ; không lộ URL/tải trái phép và không double credit.
- **G3 (handoff):** demo, screenshots, test log, ERD/UML, report, hướng dẫn cài đặt.

## Định dạng evidence cho test
```text
ID: T-...
Commit:
Date/time:
Environment: Node ..., MySQL ..., OS/browser ...
Steps:
Expected:
Actual:
Result: PASS | FAIL | SKIP | NOT RUN
Evidence: log/screenshot/PR link (không chứa secret)
```
Không đánh PASS chỉ vì code có hàm tương ứng.

## PDF upload QA (FR-11, DOC-01 confirmed; all NOT RUN)
Reference: [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md). The mechanism is chosen but these tests are **not yet implemented/executed**.

| ID | Scenario | Expected |
|---|---|---|
| T-UP-01 | Student uploads valid PDF | Post+metadata+file created; downloadable under approved policy |
| T-UP-02 | Guest tries to upload | 401, no file stored |
| T-UP-03 | Spoofed PDF extension/MIME/signature | Reject, remove temporary file |
| T-UP-04 | File larger than approved cap, multiple unexpected parts/files | 4xx, no orphan |
| T-UP-05 | Aborted upload / DB failure | Cleanup and consistent DB state |
| T-UP-06 | Different student deletes other student's document | Deny mutation |
| T-UP-07 | Hidden/deleted/private file via direct static path | File not exposed |
| T-UP-08 | Guest/other student download | Guest 401; logged-in active student 200 safe PDF attachment (ADR-011) |
| T-UP-09 | Legacy paid/payment endpoints | Direct request denied before MVP demo |
| T-UP-10 | Multipart parser malformed field names/DoS | Patched middleware, bounded parsing and safe errors |

**Security dependency:** `multer ^1.4.5-lts.1` is present and must not be used for new uploads without patched dependency review; relevant GHSA https://github.com/advisories/GHSA-wc9g-mqfw-jrwm. QA coverage including this vulnerability is planned, not PASS.

## Approved document access policy ADR-011 — acceptance tests (NOT RUN)
| ID | Scenario | Expected outcome |
|---|---|---|
| T-DOCFREE-01 | Guest lists/searches/views active free PDF metadata | 200 safe title/description/uploader, without URL/path/bytes |
| T-DOCFREE-02 | Guest requests PDF download directly | 401, no file bytes, storage URL, redirect or raw static access |
| T-DOCFREE-03 | Expired/invalid session requests download | 401, no bytes |
| T-DOCFREE-04 | Student A downloads Student B's active free PDF | 200 with correct PDF attachment and safe file name |
| T-DOCFREE-05 | Direct download of hidden/deleted/paid PDF | Denied; no raw path/file disclosure for any actor in MVP |
| T-DOCFREE-06 | Guest uploads or Student A modifies Student B's PDF | Guest 401, unauthorized student 403; no mutation |

**Status:** ADR-011 business requirement CONFIRMED by Human A 2026-10-18; implementation/integration tests NOT RUN. Do not mark PASS on documentation or CI build alone. See [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md).

## ADR-012 size and single-PDF boundary tests (NOT RUN)
**Approved by Human A 2026-10-18:** up to **10 MiB = 10,485,760 bytes** inclusive and exactly one PDF per document post. These test designs are **NOT RUN**, not evidence upload works.

| Test ID | Case | Expected |
|---|---|---|
| T-UP-LIM-01 | Logged-in student uploads structurally valid PDF of exactly 10,485,760 bytes | Not rejected solely for size, create one document post/file if all other validations pass |
| T-UP-LIM-02 | Logged-in student uploads PDF of 10,485,761 bytes | Reject as too large (413 suggested), no post, no temporary orphan |
| T-UP-LIM-03 | Upload 2 PDFs in same request (any sizes) | Reject excess file count (4xx), no post/files persisted |
| T-UP-LIM-04 | Upload with no `file` field or zero-byte file | Reject (400/422 suggested), no post persisted |
| T-UP-LIM-05 | Upload one small non-PDF disguised as `.pdf` | Reject on server-side content/type validation; clean up |
| T-UP-LIM-06 | Accept a valid PDF under the limit as 1 file, with concurrent/aborted requests | Exactly one document association per successful post; aborted/failed upload leaves no orphan |

**Do not fabricate PDF bytes** during review; fixture generating/test execution belongs to implementation QA. Endpoint path/error shape is proposed in [API_CONTRACT.md](API_CONTRACT.md); access rules in [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md).

## ADR-013 — Immediate publication / post-moderation tests (NOT RUN)
Human A confirmed Option A on 2026-10-18. These test cases are defined but **have not been executed**.

| ID | Case | Expected |
|---|---|---|
| T-PUBLISH-01 | Authenticated Student uploads valid PDF, server validates, stores and commits successfully | 201, one `active` free document; guest public metadata visible immediately; no Admin approval |
| T-PUBLISH-02 | Guest lists/views newly active document then tries direct download | Public safe metadata available; file bytes denied 401; signed-in student can download |
| T-PUBLISH-03 | Oversize/wrong MIME, failed storage or DB write, interrupted upload | No active public post, no orphan file, no misleading published success |
| T-PUBLISH-04 | Admin hides previously active PDF | Disappears from guest search/list/detail; signed-in author and other users denied direct PDF bytes |
| T-PUBLISH-05 | Admin deletes PDF, then access attempted with stale/raw URL | No public file bytes or metadata; HTTP access policy applied even for cached URLs |
| T-PUBLISH-06 | Ordinary Student tries to hide/delete another student's PDF | Backend rejects unauthorized modification (403); original post state unchanged |

**G5 gate:** real test evidence required, CI build/syntax/document checks do not establish PASS.
