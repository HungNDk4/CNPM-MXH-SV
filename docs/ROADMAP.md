# Roadmap / Work Breakdown — Mini Study Network
**DRAFT; chưa phân công, chưa cam kết thời hạn. Option B confirmed by Human A 2026-10-17: free MVP, VNPay deferred. Master plan: [ops/MASTER_PLAN.md](ops/MASTER_PLAN.md).** Thực hiện bằng issue → branch → PR → review.

## Cloud preview checkpoint — 2026-10-22 (DEP-01C)

- **Now working:** Render Free serves React SPA + Express over HTTPS; `/api/health` 200 verified in user browser and Render logs, deployed commit `71499dfd63d21feb019d6144efcadc7ee9232951` (CI 7/7). TiDB Starter Singapore 8 tables visible and Sequelize startup authentication succeeded.
- **Not a release:** private Vercel Blob storage is configured at startup only. No real cloud PDF upload/download/security/redeploy persistence proof; auth, paid-route lockdown and moderator controls must pass cloud QA. Draft PR #33 and [operational runbook](DEP01C_RENDER_TIDB_PRIVATE_BLOB_RUNBOOK.md).
- **Next delivery slice:** execute bounded cloud E2E (two test accounts, valid/boundary PDF, guest 401, cross-user 403, hidden/deleted deny, paid API deny), then persist through controlled redeploy. Keep source work on preview PR stack, do not merge `main` without reviews.

## P0 — Chặn các lỗi cốt lõi trước feature demo
- [ ] ISSUE: Không lộ `file_url` trả phí từ GET posts/search/detail và static uploads.
- [ ] ISSUE **MVP**: khóa backend payment/paid-file flows (bao gồm API trực tiếp và callbacks) với negative tests; triển khai idempotency VNPay đầy đủ chỉ khi mở lại feature.
- [ ] ISSUE: Guest feed và optional-auth đúng contract.
- [ ] ISSUE: Fix Sequelize/SQL drift và chiến lược migration.
- [ ] ISSUE: Thiết lập test tối thiểu cho security regression.
Acceptance: test tái hiện lỗi FAIL trước sửa và PASS sau sửa; không regress auth.

## P1 — Hoàn chỉnh luồng mạng xã hội học tập
- [ ] Post detail FE và comments/replies.
- [ ] Like/unlike FE + validate target backend.
- [ ] Search/filter UI gắn API và pagination.
- [ ] Profile FE, update và change password.
- [ ] Edit/delete post UI, ownership checks.
- [ ] Admin moderation và bằng chứng phân quyền.
Acceptance: G1 trong `TEST_PLAN.md`.

## P2 — Tài liệu miễn phí, thanh toán Sandbox deferred
- [ ] DOC-01: quyết định tài liệu miễn phí bằng external URL, upload trực tiếp, hoặc cả hai.
- [ ] Document download permission endpoint, preview/metadata phù hợp.
- [ ] DEFERRED: UI tạo đơn, trạng thái từ backend, lịch sử mua.
- [ ] DEFERRED: test Sandbox success/failure/replay/invalid signature.
Acceptance: free documents end-to-end và routes trả phí bị deny; không yêu cầu Sandbox test cho MVP.

## P3 — Sẵn sàng bảo vệ đồ án
- [ ] Use case diagram và use case specification theo SRS.
- [ ] ERD, sequence diagrams cho Auth/Post/Payment nếu có.
- [ ] Kiểm thử có log, screenshot và dữ liệu demo.
- [ ] Update README, báo cáo, hướng dẫn triển khai.
Acceptance: G3.

## Quy tắc ưu tiên
Không mở rộng chat/realtime/AI trước khi G1/G2 liên quan đạt; payment không triển khai thật. Mọi thay đổi scope cần ghi `docs/DECISIONS.md`.
