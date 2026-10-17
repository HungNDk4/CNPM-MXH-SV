# Test Plan và Acceptance Gates
**DRAFT**, chưa chạy; mọi testcase mặc định **NOT RUN**. Ghi status PASS/FAIL/SKIP kèm environment, commit, bằng chứng, thời gian thực hiện.

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
