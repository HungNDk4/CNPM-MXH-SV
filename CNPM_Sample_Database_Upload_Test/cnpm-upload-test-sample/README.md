# Bộ dữ liệu mẫu & Hướng dẫn kiểm thử — Mini Study Network

Bộ dữ liệu mẫu phục vụ phát triển, trình diễn (demo) và kiểm thử toàn diện giao diện **Campus Pop** và tính năng **Upload / Tải file PDF** của mạng xã hội học tập sinh viên.

---

## 1. Danh sách tài khoản đăng nhập mẫu

Tất cả tài khoản sinh viên đều có mật khẩu chung là: `123456`  
Tài khoản Quản trị viên (Admin) có mật khẩu là: `Admin@123`

| Họ và tên | Email đăng nhập | Vai trò | Trường & Ngành học | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên Hệ thống** | `admin@studynet.vn` | `admin` | ĐHQG TP.HCM | Dùng để test trang `/admin/audit-logs` |
| **Nguyễn Hùng** | `hungnd13112004@gmail.com` | `student` | UIT - Kỹ thuật Phần mềm | Tài khoản chính của bạn (có sẵn bookmark, follow, thông báo) |
| **Tài khoản Demo** | `demo1@gmail.com` | `student` | Bách Khoa HCM - KTPM | Tài khoản phụ test tương tác |
| **Trần Quốc Bảo** | `bao.tran@studynet.vn` | `student` | Bách Khoa HCM - KHMT | Chuyên gia CSDL & DevOps |
| **Nguyễn Thu Hà** | `ha.nguyen@studynet.vn` | `student` | KHTN - Công nghệ Thông tin | UI/UX Designer & Frontend |
| **Lê Minh Khoa** | `khoa.le@studynet.vn` | `student` | ĐHBK Hà Nội - KTMT | Backend Java & Go |
| **Phạm Ngọc Anh** | `anh.pham@studynet.vn` | `student` | ĐH Quốc Tế - Data Science | Data Science & Machine Learning |
| **Vũ Hoàng Long** | `long.vu@studynet.vn` | `student` | SPKT TP.HCM - ATTT | An toàn thông tin & Mạng |
| **Bùi Phương Linh** | `linh.bui@studynet.vn` | `student` | NEU - HTTT Quản lý | Ban học tập & Cheatsheet |
| **Đặng Gia Huy** | `huy.dang@studynet.vn` | `student` | ĐH FPT - KTPM | Mobile App Developer |

---

## 2. Cách nạp dữ liệu mẫu (2 Cách)

### Cách 1: Chạy 1 câu lệnh bằng Node.js (Khuyên dùng)
Từ thư mục gốc dự án, chạy lệnh:
```bash
node CNPM_Sample_Database_Upload_Test/cnpm-upload-test-sample/seed_sample_data.js
```
*Script sẽ tự động kết nối MySQL cục bộ (cổng 3306), dọn dẹp dữ liệu rác cũ, tạo bảng `document_files` nếu chưa có, và nạp đầy đủ người dùng, bài viết, bình luận, lượt thích, bookmark và thông báo.*

### Cách 2: Chạy trực tiếp file SQL trong MySQL Workbench
1. Mở MySQL Workbench và kết nối tới database `mini_study_network`.
2. Mở file [`seed_sample_data.sql`](./seed_sample_data.sql).
3. Bấm **Execute (Ctrl + Shift + Enter)** để chạy toàn bộ file.

---

## 3. Nội dung dữ liệu mẫu được nạp

- **Bài viết đa dạng theo Campus Pop**:
  - **Hỏi đáp (Questions)**: Tối ưu SQL JOIN hàng triệu dòng, Chuẩn hóa BCNF vs 3NF, Token Concurrency & Refresh Token Rotation trong React, Scrum Sprint estimation cho nhóm 2 người, React 18 StrictMode double render.
  - **Thảo luận (Discussions)**: Kinh nghiệm làm Đồ án tốt nghiệp đạt 9.5, Clean Architecture vs Onion Architecture, Review công cụ viết báo cáo (LaTeX vs Typst vs Word).
  - **Tài liệu (Documents)**: Bộ tài liệu Fullstack Web 80 trang, Slide ôn thi AI & Machine Learning, Mẫu Đặc tả yêu cầu phần mềm SRS chuẩn IEEE 830, Cẩm nang ôn thi Kiến trúc máy tính & Vi xử lý.
- **Bình luận & Phản hồi lồng nhau**: Nhiều thảo luận học thuật thực tế, trao đổi kinh nghiệm.
- **Lượt thích & Bookmarks**: Tài khoản `hungnd13112004@gmail.com` đã được bookmark sẵn 4 tài liệu giá trị để test trang `/bookmarks`.
- **Mạng lưới Theo dõi (Follows)**: Đầy đủ các mối quan hệ follower/following giữa các sinh viên để test modal theo dõi trên `ProfilePage`.
- **Thông báo trong ứng dụng**: 6 thông báo tương tác để test dropdown thông báo và trang `/notifications`.

---

## 4. Hướng dẫn kiểm thử tính năng Upload PDF

1. Khởi động backend (`cd server && npm run dev`) và frontend (`cd client && npm run dev`).
2. Đăng nhập bằng tài khoản `hungnd13112004@gmail.com` (mật khẩu `123456`).
3. Điều hướng tới trang **Đăng bài mới** (`/posts/create`).
4. Chọn tab **Chia sẻ tài liệu**, kéo thả một file PDF (dung lượng < 10MB) vào khung upload.
5. Xem trước hiển thị trực quan ở cột **Thẻ xem trước trực tiếp (Live Preview)** bên phải.
6. Nhấn nút **Chia sẻ PDF**.
7. Mở MySQL Workbench hoặc chạy các câu lệnh trong [`seed_upload_test.sql`](./seed_upload_test.sql) để kiểm tra dòng bản ghi mới trong bảng `posts` và bảng `document_files`.
