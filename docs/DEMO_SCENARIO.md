# KỊCH BẢN DEMO BẢO VỆ ĐỒ ÁN — MINI STUDY NETWORK
**Dự án:** Mạng xã hội học tập và chia sẻ tài liệu sinh viên (Mini Study Network)  
**Nhóm sinh viên thực hiện:** 2 thành viên (Human A — Core Backend & Security, Human B — Frontend & UI/UX)  
**Thời lượng đề xuất:** 10 – 15 phút trình diễn + 5 phút Q&A phản biện

---

## I. Đánh giá Mức độ Sẵn sàng Demo (Readiness Check)

| Phân hệ / Tính năng | Tiêu chí SRS / MVP | Trạng thái hiện tại | Đánh giá Demo |
|---|---|:---:|---|
| **1. Khách vãng lai (Guest)** | Xem feed công khai, tìm kiếm tài liệu, xem metadata PDF, chuyển theme | **HOÀN THÀNH** | Sẵn sàng demo |
| **2. Xác thực & Tài khoản (Auth)** | Đăng ký, đăng nhập JWT + Refresh Token, đổi mật khẩu thu hồi phiên | **HOÀN THÀNH** | Sẵn sàng demo |
| **3. Đăng bài & Chia sẻ PDF (Posts & Docs)** | Đăng câu hỏi/thảo luận, đính kèm ảnh, upload PDF (≤10MB) lưu trữ bảo mật | **HOÀN THÀNH** | Sẵn sàng demo |
| **4. Tải PDF bảo mật (Secure PDF Stream)** | Khách chặn tải (401), sinh viên đăng nhập tải stream an toàn, không lộ file key | **HOÀN THÀNH** | Điểm nhấn kỹ thuật |
| **5. Tương tác học tập (Interactions)** | Like/Unlike (chống duplicate), Bình luận phân cấp (Threaded), Báo cáo vi phạm | **HOÀN THÀNH** | Sẵn sàng demo |
| **6. Mạng xã hội mở rộng (Social)** | Lưu bài viết (Bookmark), Theo dõi (Follow/Unfollow), Thông báo thời gian thực | **HOÀN THÀNH** | Sẵn sàng demo |
| **7. Quản lý cá nhân (My Posts & Profile)** | KPI cá nhân, lọc trạng thái bài (công khai/ẩn/xóa), Campus ID card sinh viên | **HOÀN THÀNH** | Sẵn sàng demo |
| **8. Quản trị nội dung (Admin Content)** | Ẩn/xóa mềm bài vi phạm kèm lý do bắt buộc, xử lý hàng đợi báo cáo | **HOÀN THÀNH** | Sẵn sàng demo |
| **9. Quản trị người dùng (Admin Users)** | Khóa/mở khóa tài khoản có lý do, thu hồi phiên lập tức, chống tự khóa admin | **HOÀN THÀNH** | Điểm nhấn bảo mật |
| **10. Nhật ký & Phân tích (Analytics & Audit)** | Biểu đồ xu hướng, xếp hạng tương tác, nhật ký kiểm duyệt append-only | **HOÀN THÀNH** | Sẵn sàng demo |

> **KẾT LUẬN:** Hệ thống **đã đủ 100% chức năng cần thiết** cho buổi bảo vệ đồ án, giao diện Bento Academic đồng bộ, hỗ trợ Dark/Light mode và có dữ liệu mẫu thực tế.

---

## II. Chuẩn bị Tài khoản & Môi trường Trình diễn

### 1. Thông tin Đăng nhập Demo

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích trình diễn |
|---|---|---|---|
| **Khách (Guest)** | *(Chưa đăng nhập)* | *(Không)* | Demo xem trước metadata, chặn tải tài liệu |
| **Sinh viên A (Tác giả)** | `hungnd13112004@gmail.com` | `123456` | Demo đăng bài, upload PDF, tương tác, xem My Posts |
| **Sinh viên B (Người dùng khác)** | `demo1@gmail.com` | `123456` | Demo tải PDF, follow, like, bình luận, báo cáo vi phạm |
| **Quản trị viên (Admin)** | `admin@studynet.vn` | `Admin@123` | Demo Overview, kiểm duyệt bài viết, khóa tài khoản, xem Audit Log |

### 2. Thiết lập Môi trường Trình diễn
* **Mở 2 cửa sổ trình duyệt song song:**
  * Cửa sổ 1: Trình duyệt bình thường (Dành cho **Sinh viên A** hoặc **Admin**).
  * Cửa sổ 2: Trình duyệt ẩn danh (Incognito) (Dành cho **Khách** hoặc **Sinh viên B**).
* **Kiểm tra dịch vụ:**
  * Backend: `http://localhost:5000` (`npm start` trong thư mục `server`).
  * Frontend: `http://localhost:5173` (`npm run dev` trong thư mục `client`).

---

## III. Phân vai Trình diễn (2 Thành viên)

* **Thành viên 1 (Human A — Phụ trách Backend, Bảo mật & Luồng Admin):**
  * Thuyết trình kiến trúc backend, cơ chế bảo vệ PDF, phân quyền JWT/Refresh Token và trực tiếp demo các tính năng Quản trị hệ thống (Admin).
* **Thành viên 2 (Human B — Phụ trách Frontend, Trải nghiệm người dùng & Luồng Sinh viên):**
  * Thuyết trình phong cách thiết kế UI/UX Bento Academic, khả năng responsive, tối ưu hóa giao diện và trực tiếp demo các luồng thao tác của Khách & Sinh viên.

---

## IV. Kịch bản Chi tiết Từng Bước (12 Phút)

### Giai đoạn 1: Trải nghiệm Khách vãng lai & Tìm kiếm học tập (2 phút)
*Người trình bày: Thành viên 2 (Frontend)*

1. **Khám phá Bảng tin (Feed):**
   * Mở cửa sổ ẩn danh truy cập `http://localhost:5173/`.
   * Trình bày giao diện Campus Pop Bento: bố cục 3 cột (Danh mục môn học bên trái, Bảng tin trung tâm, Xu hướng & Thống kê bên phải).
   * Thao tác chuyển đổi nhanh **Chế độ Sáng (Light Mode) ↔ Chế độ Tối (Dark Mode)** trên thanh Navbar để minh họa độ đồng bộ giao diện.
2. **Tìm kiếm thông minh (Quick Search & Search Page):**
   * Bấm phím tắt `/` hoặc click ô tìm kiếm để mở **Quick Search Floating Panel**.
   * Gõ từ khóa `React` hoặc chọn môn `Công nghệ phần mềm`: kết quả gợi ý tức thời.
   * Chuyển sang trang Tìm kiếm nâng cao `/search`: lọc theo loại bài (Câu hỏi, Thảo luận, Tài liệu).
3. **Cơ chế Bảo vệ Tài liệu với Khách:**
   * Click vào một bài viết tài liệu PDF.
   * Chỉ rõ: Khách được xem tiêu đề, mô tả, môn học, tác giả và **metadata file** (kích thước, định dạng `.pdf`).
   * Bấm nút **"Tải tài liệu PDF"**: Hệ thống hiển thị thông báo popup yêu cầu đăng nhập, chặn truy cập file bytes trái phép (Backend trả HTTP 401).

---

### Giai đoạn 2: Trải nghiệm Sinh viên — Đăng tài liệu & Mạng xã hội (4 phút)
*Người trình bày: Thành viên 2 (Frontend) phối hợp Thành viên 1 (Backend)*

1. **Đăng nhập Sinh viên A:**
   * Đăng nhập với tài khoản `hungnd13112004@gmail.com` / `123456`.
   * Giao diện cập nhật thông tin sinh viên, hiển thị số thông báo và menu điều hướng cá nhân.
2. **Đăng tải Tài liệu PDF có đính kèm file:**
   * Bấm nút **"Đăng bài"** (`/posts/create`).
   * Chọn loại bài: **Tài liệu học tập**.
   * Nhập tiêu đề: `"Đề cương ôn tập & Bài tập lớn CNPM 2026"`.
   * Chọn môn học, nhập mô tả nội dung.
   * Tải lên 1 file PDF thực tế (dung lượng < 10MB).
   * Bấm **"Đăng tài liệu"**: Bài viết xuất hiện tức thì trên đầu Feed kèm huy hiệu Document.
3. **Tương tác đa chiều giữa Sinh viên A & B (Minh họa tính năng mạng xã hội):**
   * Chuyển sang Cửa sổ 2 đăng nhập **Sinh viên B** (`demo1@gmail.com` / `123456`).
   * Sinh viên B xem bài tài liệu vừa đăng của Sinh viên A:
     * Bấm **Tải tài liệu PDF**: File PDF được tải về máy thành công với đúng kích thước và nội dung nguyên bản.
     * Bấm **Thả tim (Like)**: Số lượt thích tăng lên thời gian thực. Bấm lại để Hủy like.
     * Viết **Bình luận**: `"Tài liệu rất chi tiết, cảm ơn bạn!"`.
     * Bấm **"Lưu bài viết" (Bookmark)**: Lưu vào danh sách cá nhân.
     * Click vào tác giả Sinh viên A, bấm **"Theo dõi" (Follow)**.
4. **Trung tâm thông báo (Notifications):**
   * Quay lại Cửa sổ 1 của Sinh viên A: Badge chuông thông báo hiển thị thông báo mới từ Sinh viên B (Like, Bình luận, Follow).
5. **Trang Bài viết của tôi (`/my-posts`):**
   * Sinh viên A truy cập `/my-posts`:
     * Chỉ rõ bảng KPI cá nhân: Tổng bài viết, tổng lượt thích, bình luận, lượt xem.
     * Thử nghiệm bộ lọc: Đang hiển thị (`active`), Bị ẩn (`hidden`), Đã xóa (`deleted`).
     * Thử nghiệm sắp xếp: Mới nhất (`newest`) ↔ Tương tác nhiều nhất (`engagement`).

---

### Giai đoạn 3: Phân hệ Quản trị viên (Admin Moderation & Security) (4 phút)
*Người trình bày: Thành viên 1 (Backend & Security)*

1. **Đăng nhập Quản trị viên:**
   * Đăng nhập tài khoản `admin@studynet.vn` / `Admin@123`.
   * Truy cập phân hệ Quản trị tại `/admin`.
2. **Tổng quan hệ thống (`/admin`):**
   * Trình bày Dashboard thống kê tổng số tài khoản, bài viết, tài liệu, báo cáo vi phạm.
   * Biểu đồ xu hướng hoạt động trong 7 ngày gần nhất.
3. **Kiểm duyệt Bài viết vi phạm (`/admin/posts` & `/admin/content`):**
   * Sinh viên B báo cáo một bài viết có nội dung vi phạm (Report post).
   * Admin vào `/admin/content` thấy bài viết nằm trong hàng đợi báo cáo.
   * Admin bấm **"Ẩn nội dung"**: Modal yêu cầu nhập lý do kiểm duyệt (5–500 ký tự). Nhập: `"Nội dung chứa liên kết không phù hợp quy định học thuật"`.
   * **Kiểm chứng bảo mật:**
     * Sinh viên B và Khách lập tức không thể xem bài viết đó trên feed hoặc detail (trả 404).
     * Sinh viên A (tác giả) vào `/my-posts` mục "Bị ẩn" vẫn thấy bài viết của mình kèm thẻ thông báo trạng thái tĩnh nhưng bị khóa tương tác.
4. **Kiểm duyệt & Khóa tài khoản Người dùng (`/admin/users`):**
   * Admin tìm kiếm tài khoản Sinh viên vi phạm (ví dụ `demo4@gmail.com`).
   * Trình bày tính năng an toàn: Nút "Khóa" của tài khoản Admin hiện tại bị **vô hiệu hóa** (ngăn chặn tự khóa chính mình).
   * Bấm **"Khóa tài khoản"** đối với `demo4@gmail.com`. Nhập lý do: `"Vi phạm tiêu chuẩn cộng đồng nhiều lần"`.
   * **Kiểm chứng tức thời:**
     * Mở tab đăng nhập thử tài khoản vừa bị khóa: Hệ thống từ chối đăng nhập với thông báo *"Tài khoản đã bị khóa"*.
     * Tất cả Refresh Token của tài khoản đó bị thu hồi toàn bộ trong database, Access Token hiện hành bị vô hiệu hóa lập tức (Backend kiểm tra cờ `is_active` trên mọi request).
   * Admin bấm **"Mở khóa tài khoản"** để khôi phục trạng thái.
5. **Nhật ký kiểm duyệt bất biến (`/admin/audit-logs`):**
   * Mở tab Nhật ký kiểm duyệt: Hiển thị đầy đủ lịch sử các thao tác Admin vừa thực hiện (thời gian chính xác, người thực hiện, đối tượng bị xử lý, lý do).

---

### Giai đoạn 4: Tổng kết & Câu hỏi Phản biện (Q&A) (2 – 5 phút)
*Cả 2 thành viên cùng giải trình*

Tóm tắt các điểm mạnh công nghệ nổi bật của dự án trước Hội đồng:
1. **Kiến trúc phân tầng sạch:** React Vite + Tailwind CSS ở Client; Node.js Express + Sequelize ORM + MySQL 8 ở Server.
2. **Bảo mật nhiều lớp:** Lưu trữ tài liệu Private Storage, xác thực kép Access/Refresh Token với cơ chế xoay vòng nguyên tử (Atomic Rotation), phòng chống hoàn toàn IDOR và Race Condition khi khóa tài khoản.
3. **Tuân thủ quy trình kiểm thử:** Đạt 100% PASS trên tất cả các bộ test hợp đồng API, kiểm thử hồi quy bảo mật và kiểm định giao diện Playwright E2E.

---

## V. Bộ Câu hỏi Phản biện Thường gặp (FAQ) & Gợi ý Trả lời

#### Câu 1: Tại sao hệ thống không cho Khách tải trực tiếp file PDF mà bắt buộc đăng nhập?
> **Gợi ý trả lời:**  
> *"Theo chính sách truy cập tài liệu ADR-011 của dự án, nhằm ngăn chặn việc cào dữ liệu (data scraping) tự động của bot và bảo vệ tài nguyên học thuật của sinh viên trong trường, hệ thống chỉ mở metadata công khai để phục vụ tìm kiếm SEO và hiển thị học thuật. File PDF nhị phân chỉ được stream qua endpoint bảo mật khi có Access JWT hợp lệ."*

#### Câu 2: File PDF được lưu trữ ở đâu? Có lưu trực tiếp vào thư mục công khai của web server không?
> **Gợi ý trả lời:**  
> *"Không. Hệ thống tuyệt đối không lưu file PDF trong thư mục tĩnh công khai (như `/public` hay `/uploads` công khai). Thay vào đó, hệ thống sử dụng module Private Document Storage lưu file với khóa định danh ngẫu nhiên (UUID hash). Khi sinh viên có quyền yêu cầu tải, backend sẽ kiểm tra quyền sở hữu và trạng thái bài viết (chỉ bài `active` mới được tải), sau đó stream dữ liệu trực tiếp về client kèm header chống rò rỉ đường dẫn vật lý."*

#### Câu 3: Khi Admin khóa một tài khoản, nếu tài khoản đó đang có JWT token còn hạn 15 phút thì có tiếp tục gọi API được không?
> **Gợi ý trả lời:**  
> *"Không thể gọi API được nữa. Trong middleware xác thực `auth.middleware.js`, hệ thống không chỉ giải mã chữ ký JWT mà còn kiểm tra trạng thái `users.is_active` trực tiếp trong database trên từng request. Khi tài khoản bị khóa, mọi request tiếp theo đều bị chặn với mã HTTP 401. Đồng thời, toàn bộ refresh token liên quan đều bị xóa khỏi database trong cùng một giao dịch (transaction) nguyên tử để ngăn chặn việc gia hạn phiên."*

#### Câu 4: Làm thế nào giải quyết xung đột (Race Condition) khi người dùng đang đăng nhập dở mà Admin bấm Khóa tài khoản?
> **Gợi ý trả lời:**  
> *"Trong PR #89, nhóm đã cài đặt cơ chế serialize giao dịch: trong hàm `login`, trước khi tạo refresh token mới, backend thực hiện khóa dòng (Row-level lock với `FOR UPDATE`) và kiểm tra lại trạng thái `is_active`. Nếu giao dịch khóa tài khoản của Admin hoàn tất trước, tiến trình đăng nhập sẽ nhận ra trạng thái khóa và rollback ngay lập tức, không để lọt bất kỳ session hợp lệ nào."*

#### Câu 5: Hệ thống có hỗ trợ thanh toán tài liệu có phí không?
> **Gợi ý trả lời:**  
> *"Theo quyết định phạm vi MVP (Option B - Free-first MVP), nhóm ưu tiên tối đa cho việc chia sẻ tài liệu miễn phí và mạng xã hội học tập để phục vụ sinh viên trước. Các route thanh toán VNPay Sandbox trước đây đã được nhóm chủ động vô hiệu hóa từ tầng backend (trả về 404/disabled) để bảo đảm an toàn bảo mật, tránh rủi ro gian lận tiền bạc trước khi có quy trình kiểm toán bảo mật chuyên sâu."*
