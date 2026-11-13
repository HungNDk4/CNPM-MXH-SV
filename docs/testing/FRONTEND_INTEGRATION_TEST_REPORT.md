# Báo cáo Kiểm thử Tích hợp Frontend (Frontend Integration Test Report)

**Dự án:** Mini Study Network · **Repository:** [HungNDk4/CNPM-MXH-SV](https://github.com/HungNDk4/CNPM-MXH-SV)  
**Nhánh kiểm thử:** `feat/frontend-complete-20261025` (và `feat/frontend-integration`)  
**Nhánh base mục tiêu:** `integration/team-dev-20261020`  
**Trạng thái nghiệm thu:** **REVIEW READY (Draft PR)** — Chưa merge vào integration hoặc main.

---

## 1. Tóm tắt phạm vi các tính năng kiểm thử

Đợt tích hợp này hoàn thiện toàn bộ các nhiệm vụ Frontend và tiện ích mở rộng mạng xã hội được giao theo tài liệu `docs/handoff/frontend/README.md`:

| Mã Task | Phân hệ chức năng | File nguồn chính | Kiểm thử thực hiện |
| :--- | :--- | :--- | :---: |
| **FE-01** | Chi tiết bài viết, bình luận gốc, trả lời 1 cấp, like bài/bình luận, xóa bình luận | `client/src/pages/posts/PostDetailPage.jsx` | Chromium E2E + Static Build |
| **FE-03** | Tìm kiếm từ khóa trên Navbar, lọc môn học/tags, phân trang bài viết | `client/src/pages/HomePage.jsx`, `client/src/layouts/MainLayout.jsx` | Static Build + Manual URL |
| **FE-04** | Xem hồ sơ, sửa thông tin cá nhân, đổi mật khẩu, đồng bộ avatar toàn hệ thống | `client/src/pages/profile/ProfilePage.jsx` | Static Build + Manual E2E |
| **FE-05** | Chỉnh sửa và xóa bài viết với phân quyền chính chủ / admin | `client/src/pages/posts/PostDetailPage.jsx` | Static Build + Manual E2E |
| **EXT-01** | Lưu bài viết (Bookmarks), trang danh sách bài đã lưu, icon Navbar | `client/src/pages/bookmarks/BookmarksPage.jsx` | Static Build + Manual E2E |
| **EXT-02** | Hệ thống Follow, đếm người theo dõi, popup danh sách followers/following | `client/src/pages/profile/ProfilePage.jsx` | Static Build + Manual E2E |
| **EXT-03** | Quản trị viên: Nhật ký kiểm duyệt (Audit Logs), công cụ ẩn/xóa bài nhanh | `client/src/pages/admin/AdminAuditPage.jsx` | Static Build + Manual E2E |
| **EXT-04** | Chuông thông báo in-app, tự động polling số chưa đọc mỗi 30s, đánh dấu đọc | `client/src/layouts/MainLayout.jsx` | Static Build + Manual E2E |

---

## 2. Bằng chứng kiểm tra tĩnh & Tự động hóa

### A. Kiểm thử build Frontend Production
```bash
cd client && npm run build
```
- **Kết quả:** `PASS` (Exit code: 0).
- **Thống kê bundle:** 167 modules transformed thành công, không có lỗi runtime/build cảnh báo.
  - `dist/index.html`: ~1.09 kB
  - `dist/assets/index-*.css`: ~31.31 kB
  - `dist/assets/index-*.js`: ~358.68 kB

### B. Kiểm tra cú pháp Backend & Toàn vẹn tài liệu dự án
```bash
node --check client/e2e/fe01.test.cjs
node scripts/check-project-control.mjs
find server/src -type f -name '*.js' -exec node --check {} \;
```
- **Kết quả:** `100% PASS` (Exit code: 0).
- Không có lỗi cú pháp JavaScript; các quy tắc kiểm soát dự án trong `check-project-control.mjs` đạt đầy đủ.

### C. Tích hợp kiểm thử trình duyệt Chromium (E2E)
- File kiểm thử: `client/e2e/fe01.test.cjs` được cấu hình trực tiếp vào GitHub Actions workflow `.github/workflows/ci.yml`.
- Bao phủ:
  - Tạo tài khoản sinh viên A, đăng bài hỏi đáp, xem chi tiết bài viết.
  - Tương tác Like/Unlike bài viết và bình luận, kiểm tra đồng bộ số đếm từ server.
  - Tạo bình luận gốc và trả lời phân cấp 1 cấp.
  - Kiểm tra phân quyền: Sinh viên B bị từ chối xóa bình luận của Sinh viên A (403).
  - Tác giả xóa câu trả lời thành công và danh sách tự động cập nhật.
  - Kiểm tra độ tương thích giao diện tại các kích thước màn hình: 320px, 375px, 390px, 768px, 1280px; kích thước tap target tối thiểu 40px cho mobile.
  - Kiểm tra bảo vệ khách vãng lai: Chưa đăng nhập không thể xem nội dung hỏi đáp (login gate).

---

## 3. Các giới hạn đã xác minh & Nguyên tắc bất biến (Invariants)

1. **Upload Avatar:** Backend hiện tại chỉ lưu trữ chuỗi URL HTTPS (tối đa 500 ký tự) cho `avatar_url`, không có endpoint upload file ảnh `multipart/form-data` (Multer backend chỉ phục vụ tải PDF học tập 10 MiB). Giao diện hồ sơ hỗ trợ nhập link ảnh HTTPS và tự động hiển thị avatar gradient fallback khi không có ảnh.
2. **Trạng thái Like lúc tải trang:** Backend chưa có trường `likedByMe` khi tải dữ liệu bài viết ban đầu. Giao diện hiển thị nút trung thực (`Thích / Bỏ thích`) và chỉ chuyển sang trạng thái rõ ràng sau khi có phản hồi toggle từ server.
3. **Phân quyền và bảo mật:**
   - Quyền Sửa/Xóa bài viết chỉ cấp cho tác giả bài viết hoặc tài khoản có role `admin`.
   - Quyền truy cập trang `/admin/audit-logs` được bảo vệ bằng `AdminRoute`, tự động chặn và chuyển hướng tài khoản sinh viên thông thường.
4. **Không can thiệp Backend/Database:** Toàn bộ công việc chỉ sửa đổi mã nguồn `client/`, file cấu hình CI và tài liệu dự án; không sửa database schema, không chạy migration tự ý và không sửa đổi backend.
