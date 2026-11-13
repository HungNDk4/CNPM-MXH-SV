# Kiểm thử PDF — Campus Pop / Mini Study Network

**Chỉ dùng với MySQL 8 dùng một lần trên localhost.** Không chạy seed hoặc rollback trên TiDB, Render, môi trường production hoặc database dùng chung của nhóm. Hai script seed cũ trong thư mục này đã được gỡ vì chứa TRUNCATE, tắt khóa ngoại và ghi đè ID người dùng.

## 1. Dữ liệu mẫu an toàn

Seeder chính thức của repo: `server/src/seeders/seed-sample-data.js`.
Bộ bảo vệ: `server/src/seeders/fe66-disposable-guard.js`.
Rollback: `server/src/seeders/undo-sample-data.js`.

- Khởi tạo **database mới, rỗng, cô lập** trên MySQL 8 cục bộ với tên `fe66_seed_upload_test_01`, tạo tài khoản MySQL **không phải root/admin**.
- Sử dụng schema và migration theo hướng dẫn của Backend/CI. **Chú ý:** `database/schema.sql` có lệnh `USE mini_study_network`; không import trực tiếp sang database disposable khi chưa điều chỉnh database đích.
- Cấu hình môi trường riêng cho lệnh seed (không sửa `.env` của server đang dùng chung):

```dotenv
NODE_ENV=test
DB_AUTO_SYNC=false
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=fe66_seed_upload_test_01
DB_USER=local_nonroot_test_user
DB_PASSWORD=<mật khẩu riêng của MySQL test>
FE66_SEED_DISPOSABLE=I_UNDERSTAND_THIS_IS_DISPOSABLE
FE66_DEMO_PASSWORD=<mật khẩu demo dài ít nhất 12 ký tự>
```

Sau khi xác nhận **đúng database disposable**, chạy từ thư mục `server`:

```bash
node src/seeders/seed-sample-data.js
```

Seeder chính thức tạo 10 tài khoản sinh viên và 18 bài viết mẫu cùng tương tác; không tạo PDF thật, không tạo tài khoản admin mặc định. Mật khẩu demo do bạn đặt trong `FE66_DEMO_PASSWORD`, không dùng mật khẩu hardcode công khai.

## 2. Kiểm thử upload/download PDF thật

Khởi động Backend và Frontend bằng **database test đã kiểm tra**, đăng nhập bằng tài khoản thử và upload file PDF thật từ `/posts/create` hoặc giao diện composer.

- Backend: `POST /api/documents` (multipart, authenticated).
- Dung lượng giới hạn: tối đa **10 MiB**, một file PDF/bài.
- Đăng xuất và thử tải: phải bị từ chối; không trả `storage_key`, `file_url`, đường dẫn nội bộ.
- File khác PDF hoặc vượt giới hạn: phải bị từ chối.
- Dùng `seed_upload_test.sql` trong thư mục này để **SELECT kiểm tra metadata** của `posts` và `document_files` sau khi upload.
- Đảm bảo rollback chỉ xóa fixture do seeder tạo và không làm mất dữ liệu ngoài phạm vi.

Dữ liệu sample chỉ phục vụ demo UI; **không thay thế** test Chromium + Express + MySQL + private storage trên đúng commit cần nghiệm thu.
