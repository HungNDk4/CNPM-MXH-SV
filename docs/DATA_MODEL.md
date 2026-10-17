# Data Model — MySQL / Sequelize
**DRAFT**, nguồn đối chiếu `database/schema.sql` và `server/src/models/index.js`.

| Bảng | Khóa/quan hệ chính | Ghi chú |
|---|---|---|
| users | id; email UNIQUE | role student/admin; wallet_balance (decimal) |
| posts | user_id → users | question/document/discussion; status active/hidden/deleted |
| comments | post_id → posts; user_id → users; parent_id → comments | phản hồi một cấp hiển thị trong API hiện tại |
| likes | user_id → users; (user_id,target_type,target_id) UNIQUE | polymorphic target, không có FK tới post/comment |
| orders | buyer_id/seller_id → users; post_id → posts; vnp_txn_ref UNIQUE | trạng thái pending/paid/failed/refunded |
| document_access | user_id → users; post_id → posts; order_id → orders | UNIQUE (user_id,post_id) |
| refresh_tokens | user_id → users; token UNIQUE | revoked + expires_at |

## Các điểm cần kiểm tra trước khi migration
- Trong `schema.sql`, `refresh_tokens` không khai báo `updated_at`; Sequelize `RefreshToken` mặc định `timestamps:true` → có nguy cơ drift.
- `likes.target_id` và `comments.parent_id` cần validation nghiệp vụ tồn tại/thuộc đúng bài.
- `posts.file_url` là metadata nhạy cảm nếu tài liệu thu phí; phương án lưu private object path + secured download endpoint cần duyệt.
- `orders.amount`, `users.wallet_balance` dùng DECIMAL; không dùng Number/float để làm sổ cái tiền thật.
- `schema.sql` có hash admin placeholder (không dùng được để đăng nhập). Không phát hành mật khẩu admin thật trong repo.
- `server/src/index.js` gọi `sequelize.sync({alter:true})` trong development: tránh dùng khi DB có dữ liệu cần bảo toàn.
- `document_access` cho người mua chỉ cấp quyền sau xử lý thanh toán được chứng thực, không dựa trên query return client.

## Quy tắc schema change
Mỗi thay đổi schema phải ghi migration theo version, kế hoạch rollback, tương thích model, seed không chứa secret và test dữ liệu liên quan. Không trực tiếp drop/recreate DB có dữ liệu nhóm.
