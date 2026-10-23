# Bàn giao Frontend — Bắt đầu tại đây

**Dự án:** Mini Study Network · **Repository:** [CNPM-MXH-SV](https://github.com/HungNDk4/CNPM-MXH-SV)  
**Nhánh làm căn cứ:** `integration/team-dev-20261020`  
**Phạm vi bàn giao:** Source React hiện tại, hợp đồng API Backend đã tích hợp, và bằng chứng kiểm thử. **Không bàn giao quyền triển khai cloud, database production hoặc công việc Backend.**

## 1. Đọc theo thứ tự này

| Thứ tự | File | Mục đích |
|---|---|---|
| 1 | **[README này](README.md)** | Cách bắt đầu, trạng thái tính năng và quy trình làm việc |
| 2 | **[SOURCE_INDEX.md](SOURCE_INDEX.md)** | Biết chính xác file Frontend nào cần đọc/sửa |
| 3 | **[CORE_BACKEND_MVP_API_HANDOFF.md](../CORE_BACKEND_MVP_API_HANDOFF.md)** | API hiện hành: request, response, quyền truy cập, lỗi, PDF và EXT-01 → EXT-04 |
| 4 | **[FULLSTACK_INTEGRATION_ACCEPTANCE_20261024.md](../../testing/FULLSTACK_INTEGRATION_ACCEPTANCE_20261024.md)** | Luồng đã được kiểm thử và những luồng Frontend chưa được nghiệm thu |

Chỉ khi triển khai tính năng tương ứng mới mở các hợp đồng chi tiết:
[EXT-01 Bookmarks](../../extensions/EXT01_BOOKMARKS_CONTRACT.md) ·
[EXT-02 Follow](../../extensions/EXT02_FOLLOW_CONTRACT.md) ·
[EXT-03 Admin Audit](../../extensions/EXT03_ADMIN_AUDIT_CONTRACT.md) ·
[EXT-04 Notifications](../../extensions/EXT04_NOTIFICATIONS_CONTRACT.md).

**Nguồn API ưu tiên:** `docs/handoff/CORE_BACKEND_MVP_API_HANDOFF.md` và source server hiện tại. **Không dùng** `docs/API_CONTRACT.md` hay `docs/fixtures/api-contract-v1.json` làm hợp đồng triển khai mới vì đó là bản draft cũ.

## 2. Trạng thái được bàn giao

| Nhóm chức năng | Backend trên integration | Frontend trên integration |
|---|---|---|
| Đăng ký, đăng nhập, JWT | Đã tích hợp | Có giao diện; Chromium E2E đã kiểm thử các luồng chính |
| Feed tài liệu miễn phí, tạo bài/PDF, xem/tải PDF | Đã tích hợp | Có giao diện; một số luồng đã PASS E2E |
| Chi tiết bài hỏi đáp, bình luận/trả lời, Likes | Đã tích hợp | **Chưa tích hợp:** trang chi tiết là placeholder. Code FE-01 đang ở [Draft PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36) |
| Hồ sơ người dùng | Đã tích hợp | `ProfilePage.jsx` hiện là placeholder |
| EXT-01 Bookmarks | Đã tích hợp | Chưa có giao diện/wrapper |
| EXT-02 Follow System | Đã tích hợp | Chưa có giao diện/wrapper |
| EXT-03 Admin Audit Log | Đã tích hợp | Chưa có giao diện Admin; chỉ thực hiện nếu được giao |
| EXT-04 In-app Notifications | Đã tích hợp | Chưa có giao diện/wrapper |
| VNPay, mua tài liệu, PDF trả phí | **Không nằm trong Backend đang mount** | Không phát triển từ các route/placeholder thanh toán cũ |

**Lưu ý FE-01:** PR #36 đã có source và kiểm thử trên nhánh riêng, nhưng **chưa merge**. Kiểm tra, review và cập nhật PR này cùng người đang phụ trách trước khi sửa `PostDetailPage.jsx` / `MainLayout.jsx`; không làm lại cùng chức năng ở một PR khác. Kết quả test PR #36 không thay cho E2E trên integration mới.

## 3. Lấy source và chạy Frontend

Yêu cầu: **Node.js 24** (file [`.nvmrc`](../../../.nvmrc)), npm, Git; dùng GitHub Desktop hoặc Git CLI.

1. Clone repository về máy (hoặc **Fetch origin** nếu đã clone).
2. Checkout `integration/team-dev-20261020` và **tạo branch Frontend riêng từ nhánh đó**. Không commit trực tiếp vào integration hoặc `main`.
3. Ở thư mục gốc repository, chạy:

```bash
npm --prefix client ci
npm --prefix client run dev
```

4. Mở `http://localhost:5173`. Trước khi tạo PR, kiểm tra build:

```bash
npm --prefix client run build
```

**Để gọi API thật:** Express phải chạy tại `http://localhost:5000` và kết nối với database dev phù hợp; Vite proxy `/api` đến cổng này trong [`client/vite.config.js`](../../../client/vite.config.js). Việc chỉ mở được giao diện ở 5173 **không** chứng minh API hoạt động. Không copy `.env`, mật khẩu, JWT hoặc token của thành viên khác vào Git; nếu cần môi trường Backend local, phối hợp cấu hình database phát triển riêng.

## 4. Luồng triển khai để không bị trùng việc

| Thứ tự | Phần Frontend | Điểm bắt đầu | Điều kiện bàn giao |
|---|---|---|---|
| 1 | Tiếp nhận và review FE-01 Post Detail / Comments / Likes | [PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36) | Review/rebase nếu cần, chạy lại CI với Backend integration mới trước khi đề nghị merge |
| 2 | Profile xem/cập nhật và đổi mật khẩu | [`ProfilePage.jsx`](../../../client/src/pages/profile/ProfilePage.jsx), hợp đồng API mục Auth/Profile | Kiểm tra dữ liệu public/self, response lỗi và ownership |
| 3 | Hoàn thiện trải nghiệm Feed/Post theo phạm vi được giao | [`HomePage.jsx`](../../../client/src/pages/HomePage.jsx), [`CreatePostPage.jsx`](../../../client/src/pages/posts/CreatePostPage.jsx) | Không thay đổi guest document rule, quyền Post hoặc luồng PDF |
| 4 | Giao diện Bookmarks, Follow, Notifications theo công việc được phân | `SOURCE_INDEX.md` + hợp đồng EXT-01/02/04 | Tạo wrapper dưới `client/src/services/`; giao diện đúng trạng thái đăng nhập/ẩn/xóa |
| Khi được giao | Giao diện quản trị xem Audit Log | EXT-03 contract | Admin-only; không mở rộng quyền server |

Đây là **thứ tự kỹ thuật để phối hợp**, không phải xác nhận rằng thành viên Frontend đã nhận hết các đầu việc. Mỗi chức năng nên có branch/PR riêng, tránh sửa đồng thời cùng file đang được review.

## 5. Nguyên tắc dùng API (đã xác minh trong source)

- Frontend gọi qua `/api`, Axios attach Bearer token từ `authStore`. Response thường có dữ liệu tại `response.data.data`; `pagination` là trường ngang hàng với `data`. **Like toggle** dùng `response.data.liked`.
- Guest được đọc danh sách metadata **tài liệu miễn phí** qua `GET /api/posts?type=document`; không được tự mở toàn bộ feed hỏi đáp khi chưa đăng nhập.
- PDF: **một file/bài, tối đa 10 MiB**; upload `POST /api/documents` với multipart field `file`; download PDF bằng authenticated Blob `GET /api/documents/:postId/download`. Không dùng `file_url` hay URL thư mục lưu trữ.
- `/api/orders` và `/api/payment` **không được mount**. `orderAPI` trong source FE chỉ là code cũ; không được dựa vào nó để làm thanh toán.
- Backend Likes **chưa có** endpoint xác định `likedByMe` lúc tải trang. Không suy ra trạng thái đã thích từ số lượt Like.
- EXT-01/02/04 có API Backend nhưng **chưa có component React sẵn**. Giao diện phải xử lý Loading/Empty/Error/401/403/404 theo API thực tế.

## 6. Khi giao PR để tích hợp

- Chỉ sửa file Frontend đúng phạm vi; mọi thay đổi hợp đồng API hoặc database chuyển sang đầu việc Backend riêng.
- Chạy `npm --prefix client run build`, ghi rõ thao tác đã chạy và kết quả; nếu test trình duyệt chưa thực hiện thì ghi **CHƯA TEST**, không tự đánh dấu PASS.
- Có ít nhất các trường hợp liên quan: Guest, người dùng đã đăng nhập, dữ liệu rỗng, lỗi API, owner vs. non-owner và bài bị ẩn/xóa (nếu chức năng đụng đến chúng).
- Tạo PR hướng về **`integration/team-dev-20261020`**, nêu file đã sửa, màn hình đã hoàn tất, endpoint đã gọi, bằng chứng test và phần chưa kiểm thử; người còn lại review trước khi merge.
- CI hiện hành xác nhận Auth/PDF React và các API Backend; để nghiệm thu màn hình Social/Extensions cần **bổ sung kiểm thử E2E trình duyệt trên commit đã kết hợp FE + BE**.

**Điểm tham chiếu đã kiểm thử:** [GitHub Actions #40018094190](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40018094190), **7/7 SUCCESS** trên integration sau đợt bàn giao API. Không xem đây là bằng chứng cho giao diện mới chưa merge.
