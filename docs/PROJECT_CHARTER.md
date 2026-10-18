# Project Charter — Mini Study Network
**Trạng thái:** DRAFT chi tiết. Human A đã xác nhận Option B (17/10/2026): mạng xã hội + tài liệu miễn phí là MVP, VNPay Sandbox DEFERRED; chờ review đầy đủ từ nhóm/giảng viên. **Ngày khởi tạo baseline:** 2026-10-17.

## Bài toán
Sinh viên cần một nơi tập trung để đặt câu hỏi, thảo luận, tìm và chia sẻ tài liệu học tập. Dự án là một nền tảng mạng xã hội học tập quy mô đồ án, không phải hệ thống thương mại production.

## Mục tiêu dự kiến
- Sinh viên có thể đăng ký/đăng nhập, đăng bài, tìm nội dung, bình luận, thích và quản lý hồ sơ.
- Tài liệu có thể được chia sẻ miễn phí; mô hình tài liệu có phí/VNPay Sandbox là **luồng mở rộng bị hoãn khỏi MVP**. Source hiện có không được xem là an toàn hoặc đã vô hiệu hóa.
- Hệ thống có cơ chế phân quyền và kiểm duyệt cơ bản, được test theo các tình huống nghiệp vụ chính.

## Đối tượng và stakeholders
- Khách: xem nội dung công khai, đăng ký.
- Sinh viên: tạo và tương tác nội dung, chia sẻ tài liệu.
- Admin: quản lý/ẩn nội dung và tài khoản vi phạm (cần triển khai giao diện + nghiệp vụ).
- Giảng viên, trưởng nhóm, thành viên: xem xét phạm vi, tiến độ, báo cáo; **chưa có danh sách và vai trò được xác nhận**.
- VNPay Sandbox: bên ngoài hệ thống, chỉ liên quan tính năng thanh toán thử nghiệm.

## Ranh giới
**In scope đề xuất (MVP):** Auth, feed, bài viết, tìm kiếm/lọc, bình luận, like, hồ sơ, chia sẻ tài liệu miễn phí, kiểm duyệt mức tối thiểu, QA.
**Phase mở rộng có điều kiện, không bắt buộc MVP:** Mua tài liệu VNPay Sandbox, cấp quyền tải an toàn, lịch sử đơn hàng; phải khóa backend các endpoint chưa an toàn trong MVP.
**Out of scope mặc định:** Chat realtime, livestream, marketplace hàng hóa, production payments, rút tiền thật, AI gợi ý, social graph phức tạp.

## Deliverables cần có
Source + cấu hình mẫu không có secret; SRS; use case; ERD; API contract; test cases và chứng cứ PASS; hướng dẫn khởi chạy; demo; báo cáo nhóm.

## Rủi ro chính
1. Lộ đường dẫn tài liệu thu phí qua API hoặc static uploads.
2. Callback thanh toán lặp tạo sai quyền truy cập/số dư.
3. FE/BE không khớp contract; các trang placeholder.
4. Schema DDL và Sequelize drift; `sync({alter:true})` thay đổi schema tự động.
5. Thiếu phân công, review và kiểm thử tích hợp.

## Gate hoàn tất đồ án (đề xuất)
- Demo luồng: đăng ký → đăng bài → tìm/xem → bình luận/like → quản lý hồ sơ.
- Luồng tài liệu miễn phí có quyền truy cập phù hợp.
- Không còn P0 bảo mật đã biết trong luồng được demo.
- Test suite và bằng chứng thực nghiệm; tài liệu phản ánh đúng trạng thái triển khai.
- Thanh toán chỉ nghiệm thu khi đã có test callback idempotency, amount, order ownership, access.

## Chưa xác nhận
Tên chính thức đề tài, thời hạn nộp, nhân sự/phân công, định nghĩa đối tượng sinh viên, yêu cầu upload file thật, và VNPay có bắt buộc trong kỳ này không. Ghi quyết định vào `docs/DECISIONS.md`.

## Deployment requirement confirmed (2026-10-18)
The instructor must have a **public HTTPS website link reachable at arbitrary times**, independent of students' laptops. Minimize recurring operating expenses, but no 100% free-tier SLA or provider choice has been approved. Persistent backend data and PDF uploads plus reviewed access security are mandatory for online demonstration; local-only screenshots do not meet the final requirement. See [ONLINE_DEPLOYMENT_OPTIONS.md](ONLINE_DEPLOYMENT_OPTIONS.md).
