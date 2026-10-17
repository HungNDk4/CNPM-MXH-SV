# Roadmap / Work Breakdown — Mini Study Network
**DRAFT; chưa phân công, chưa cam kết thời hạn.** Thực hiện bằng issue → branch → PR → review.

## P0 — Chặn các lỗi cốt lõi trước feature demo
- [ ] ISSUE: Không lộ `file_url` trả phí từ GET posts/search/detail và static uploads.
- [ ] ISSUE: VNPay idempotent transaction; không double-credit khi return/IPN trùng; kiểm tra amount/order.
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

## P2 — Tài liệu và tích hợp thanh toán Sandbox
- [ ] Xác nhận phạm vi: URL-only hay upload private.
- [ ] Document download permission endpoint, preview/metadata phù hợp.
- [ ] UI tạo đơn, xác nhận status từ backend, lịch sử mua.
- [ ] Test Sandbox success/failure/replay/invalid signature.
Acceptance: G2; không gọi production-ready khi thiếu bằng chứng.

## P3 — Sẵn sàng bảo vệ đồ án
- [ ] Use case diagram và use case specification theo SRS.
- [ ] ERD, sequence diagrams cho Auth/Post/Payment nếu có.
- [ ] Kiểm thử có log, screenshot và dữ liệu demo.
- [ ] Update README, báo cáo, hướng dẫn triển khai.
Acceptance: G3.

## Quy tắc ưu tiên
Không mở rộng chat/realtime/AI trước khi G1/G2 liên quan đạt; payment không triển khai thật. Mọi thay đổi scope cần ghi `docs/DECISIONS.md`.
