# Chỉ mục file Frontend — Mở file nào, để làm gì?

**Gốc làm việc:** repository `CNPM-MXH-SV`, nhánh `integration/team-dev-20261020`. File dưới đây là **đường dẫn thật đã kiểm tra trong repo**. Nhấn vào tên file để mở mã nguồn; không cần tải toàn bộ tài liệu Backend để bắt đầu sửa UI.

## A. File nền tảng Frontend — đọc trước khi code

| File | Vai trò thực tế | Khi nào cần sửa |
|---|---|---|
| [`client/package.json`](../../../client/package.json) | Lệnh `dev`, `build` và thư viện React/Vite | Chỉ khi thêm hoặc đổi dependency được duyệt |
| [`client/vite.config.js`](../../../client/vite.config.js) | Alias `@`, dev server 5173, proxy `/api` → localhost:5000 | Thường **không** cần sửa |
| [`client/src/App.jsx`](../../../client/src/App.jsx) | Khai báo page routes, protected routes | Khi thêm màn hình/route mới |
| [`client/src/layouts/MainLayout.jsx`](../../../client/src/layouts/MainLayout.jsx) | Bố cục ứng dụng, navigation | Khi cập nhật menu/điều hướng; **đối chiếu PR #36 trước** |
| [`client/src/index.css`](../../../client/src/index.css) | Tailwind và kiểu dùng chung | Chỉ chỉnh style thuộc UI đang nhận |
| [`client/src/lib/axios.js`](../../../client/src/lib/axios.js) | HTTP client `/api`, Bearer, refresh JWT, xử lý lỗi Blob | Đọc để hiểu request; hạn chế đổi cơ chế xác thực |
| [`client/src/stores/authStore.js`](../../../client/src/stores/authStore.js) | Lưu trạng thái đăng nhập/token | Đọc để dùng đúng `isAuthenticated`, logout |
| [`client/src/services/api.js`](../../../client/src/services/api.js) | Các wrapper Auth, Post, Comment, Like, Profile, Document; còn `orderAPI` cũ | Nơi thêm wrapper cho Bookmarks/Follow/Notifications nếu được giao |

## B. Màn hình & component đang có

| File | Trạng thái trong integration | Phạm vi liên quan |
|---|---|---|
| [`client/src/pages/auth/LoginPage.jsx`](../../../client/src/pages/auth/LoginPage.jsx) | Có giao diện | Login và xử lý thông báo lỗi |
| [`client/src/pages/auth/RegisterPage.jsx`](../../../client/src/pages/auth/RegisterPage.jsx) | Có giao diện | Đăng ký |
| [`client/src/layouts/AuthLayout.jsx`](../../../client/src/layouts/AuthLayout.jsx) | Có layout | Khung Login/Register |
| [`client/src/pages/HomePage.jsx`](../../../client/src/pages/HomePage.jsx) | Có Feed | Lọc document/question/discussion theo quyền |
| [`client/src/components/PostCard.jsx`](../../../client/src/components/PostCard.jsx) | Có component Post | Card nội dung & điều hướng |
| [`client/src/pages/posts/CreatePostPage.jsx`](../../../client/src/pages/posts/CreatePostPage.jsx) | Có form | Tạo Post/question/discussion, upload PDF |
| [`client/src/pages/documents/DocumentDetailPage.jsx`](../../../client/src/pages/documents/DocumentDetailPage.jsx) | Có giao diện | Metadata miễn phí và tải PDF xác thực |
| [`client/src/pages/posts/PostDetailPage.jsx`](../../../client/src/pages/posts/PostDetailPage.jsx) | **Placeholder trên integration** | Post Detail + Comments/Replies/Likes: **code đang ở [PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36)**; không viết đè |
| [`client/src/pages/profile/ProfilePage.jsx`](../../../client/src/pages/profile/ProfilePage.jsx) | **Placeholder trên integration** | Profile public/edit/password nếu nhận FE-04 |
| [`client/src/pages/payment/PaymentResultPage.jsx`](../../../client/src/pages/payment/PaymentResultPage.jsx) | File route cũ | **Không dùng** để triển khai tính năng thanh toán của MVP |
| [`client/src/pages/NotFoundPage.jsx`](../../../client/src/pages/NotFoundPage.jsx) | Màn hình 404 | Điểm tham khảo điều hướng lỗi |

**Chưa có trong integration:** page/component Frontend cho Bookmarks, Follow, Notifications và Admin Audit Log. Không có đường dẫn file hiện hữu cho những màn hình này; tạo mới trong `client/src/` khi được phân công và thống nhất route UI.

## C. Hợp đồng và chứng cứ — chỉ đọc theo chức năng

| File | Khi nào đọc |
|---|---|
| **[`docs/handoff/CORE_BACKEND_MVP_API_HANDOFF.md`](../CORE_BACKEND_MVP_API_HANDOFF.md)** | **Bắt buộc:** triển khai bất kỳ màn hình nào gọi API |
| [`docs/extensions/EXT01_BOOKMARKS_CONTRACT.md`](../../extensions/EXT01_BOOKMARKS_CONTRACT.md) | Nút lưu/bỏ lưu và trang Bookmarks |
| [`docs/extensions/EXT02_FOLLOW_CONTRACT.md`](../../extensions/EXT02_FOLLOW_CONTRACT.md) | Nút Follow, danh sách followers/following, số liệu |
| [`docs/extensions/EXT03_ADMIN_AUDIT_CONTRACT.md`](../../extensions/EXT03_ADMIN_AUDIT_CONTRACT.md) | Chỉ khi triển khai Admin audit |
| [`docs/extensions/EXT04_NOTIFICATIONS_CONTRACT.md`](../../extensions/EXT04_NOTIFICATIONS_CONTRACT.md) | Danh sách thông báo, số chưa đọc, đánh dấu đọc |
| [`docs/testing/FULLSTACK_INTEGRATION_ACCEPTANCE_20261024.md`](../../testing/FULLSTACK_INTEGRATION_ACCEPTANCE_20261024.md) | Phân biệt tính năng đã nghiệm thu trong browser với API-only |
| [`client/e2e/e2e01.test.cjs`](../../../client/e2e/e2e01.test.cjs) | Mẫu kiểm thử thực sự qua Chromium/Vite/Express/MySQL/PDF hiện có |
| [`docs/testing/FE01_POST_INTERACTIONS_REPORT.md` trong PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/blob/feat/fe01-post-detail-comments-likes-20261023/docs/testing/FE01_POST_INTERACTIONS_REPORT.md) | Khi review FE-01. **File này chưa thuộc integration** |

## D. Các file Backend có thể tra cứu khi API không rõ

*Chỉ dùng để xác minh luồng, không phải file được phân công sửa từ phía Frontend.*

| File | Chứa API gì |
|---|---|
| [`server/src/app.js`](../../../server/src/app.js) | Các router thực sự được mount (không có order/payment) |
| [`server/src/routes/auth.routes.js`](../../../server/src/routes/auth.routes.js) | Auth |
| [`server/src/routes/post.routes.js`](../../../server/src/routes/post.routes.js) | Feed, Post, Bookmarks, Admin Audit |
| [`server/src/routes/comment.routes.js`](../../../server/src/routes/comment.routes.js) | Comments/Replies |
| [`server/src/routes/like.routes.js`](../../../server/src/routes/like.routes.js) | Likes |
| [`server/src/routes/user.routes.js`](../../../server/src/routes/user.routes.js) | Public Profile, Follow, Notifications, password |
| [`server/src/routes/document.routes.js`](../../../server/src/routes/document.routes.js) | Upload/download PDF |

**Không sử dụng** `docs/API_CONTRACT.md` hoặc `docs/fixtures/api-contract-v1.json` cho API đang chạy: đây là các bản nháp lưu lịch sử, không phải hợp đồng hiện hành.

## E. Tránh sửa trùng PR đang mở

- **[PR #36 — FE-01](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36):** có sửa `PostDetailPage.jsx`, `MainLayout.jsx` và bổ sung test browser. Review/tiếp tục PR này trước khi sửa các file trùng.
- **[PR #33 — Cloud PoC](https://github.com/HungNDk4/CNPM-MXH-SV/pull/33):** nhánh cloud tách biệt; không gộp vào PR Frontend.
- **Nhánh tích hợp:** `integration/team-dev-20261020`. Mỗi task Frontend dùng một branch/PR riêng, hướng về nhánh tích hợp; không commit trực tiếp lên `main` hoặc nhánh tích hợp.
