# SRS — Software Requirements Specification
**Baseline DRAFT** (2026-10-17). **Approved product priority:** Human A selected Option B; free sharing is MVP and VNPay Sandbox deferred. Detailed workflows still DRAFT. See [MVP_SCOPE.md](MVP_SCOPE.md). FR = yêu cầu đề xuất; trạng thái 'có code' không phải test PASS. Phải xác nhận với nhóm và giảng viên.

## Actor
- GUEST: người chưa đăng nhập.
- STUDENT: người dùng đã xác thực, role `student`.
- ADMIN: role `admin`.
- VNPAY: hệ thống thanh toán Sandbox bên ngoài — DEFERRED extension; not an MVP actor.

## Yêu cầu chức năng (FR)
| ID | Actor | Yêu cầu/tiêu chí nghiệm thu | Hiện trạng source |
|---|---|---|---|
| FR-01 | GUEST | Đăng ký với email hợp lệ, không trùng, mật khẩu được hash | FE + BE có code |
| FR-02 | STUDENT | Đăng nhập, refresh, logout; token hết hạn được xử lý | FE + BE có code; chưa test |
| FR-03 | GUEST/STUDENT | Xem feed công khai, phân trang; chỉ xem bài active | Có code, GET hiện bị authenticate chặn guest |
| FR-04 | STUDENT | Tạo câu hỏi, thảo luận, tài liệu với tiêu đề hợp lệ | FE + BE có code |
| FR-05 | STUDENT/ADMIN | Chỉ tác giả hoặc admin được sửa/xóa mềm bài | BE có code, FE thiếu thao tác |
| FR-06 | GUEST/STUDENT | Xem chi tiết, tác giả, bình luận; không lộ URL tài liệu trả phí | FE stub; BE detail có kiểm tra nhưng list còn lộ URL |
| FR-07 | STUDENT | Bình luận/trả lời bài; chỉ người có quyền xóa | BE có code, FE thiếu |
| FR-08 | STUDENT | Like/unlike bài/bình luận; chống like trùng | BE có code, FE thiếu |
| FR-09 | GUEST/STUDENT | Tìm kiếm theo từ khóa, loại bài, môn học | BE hỗ trợ một phần; FE chưa nối |
| FR-10 | GUEST/STUDENT | Xem profile công khai; người dùng sửa hồ sơ và đổi mật khẩu của mình | BE có code; FE profile stub |
| FR-11 | STUDENT | **MVP:** chia sẻ và truy cập tài liệu miễn phí; chọn link/upload qua DOC-01 | URL nhập tay; upload/download kiểm soát chưa có |
| FR-12 | ADMIN | Ẩn/xóa bài vi phạm, kiểm soát tài khoản | Quyền admin nền tảng; UI/quy trình thiếu |
| FR-13 | STUDENT/VNPAY | **DEFERRED:** mua tài liệu bằng VNPay Sandbox; không bắt buộc MVP | BE khung, FE thiếu; phải chặn an toàn khi chưa mở |
| FR-14 | STUDENT | **DEFERRED:** phân quyền tài liệu trả phí | Model tồn tại; hiện chưa an toàn, phải chặn paid path trong MVP |

## MVP boundary và security gate
- **MVP DRAFT requirements:** FR-01 tới FR-12; nhóm cần duyệt chi tiết trước khi gọi SRS APPROVED.
- **DEFERRED:** FR-13 và FR-14; không yêu cầu chạy VNPay Sandbox trong demo MVP.
- **BẮT BUỘC trước demo:** dù payment deferred, API checkout/callback/paid document từ source cũ vẫn có thể truy cập; phải chặn từ backend và kiểm thử trực tiếp, không chỉ ẩn giao diện. Không được rò URL file trả phí.
- **OPEN:** cách chia sẻ tài liệu miễn phí DOC-01 (link, upload, cả hai); guest feed và quyền admin cần chốt.

## Quy tắc nghiệp vụ cần duyệt
1. Một email tương ứng tối đa một tài khoản.
2. Guest đọc nội dung public là đề xuất ADR-002 còn OPEN; viết/tương tác phải xác thực; mua không thuộc MVP.
3. Tác giả hoặc admin có thể chỉnh sửa/xóa bài, nhưng giao dịch đã tạo cần giữ tính nhất quán lịch sử.
4. **DEFERRED extension:** Tài liệu có phí chỉ cấp quyền sau khi backend xác thực giao dịch đúng amount, mã tham chiếu, trạng thái, chữ ký. Callback lặp không được cộng tiền/cấp quyền thêm lần nữa.
5. **DEFERRED extension:** Tác giả không mua tài liệu của chính mình; không thanh toán lại tài liệu đã sở hữu quyền.
6. Không hiển thị link file/đường dẫn trực tiếp cho người chưa có quyền, kể cả trong feed, cache, log và static upload.
7. Nội dung vi phạm phải có chính sách kiểm duyệt và lưu trữ phù hợp (đề xuất; chưa thiết kế).
8. Không coi người đăng ký là sinh viên được xác minh nếu chưa có quy trình xác minh.

## NFR — Phi chức năng (mục tiêu, chưa đo đạt)
- NFR-01: Không lưu mật khẩu thô; bí mật qua env; giới hạn đăng nhập và validate input.
- NFR-02: Phân quyền ở backend; tránh IDOR, URL lộ file; có log audit cho thay đổi trạng thái thanh toán.
- NFR-03: Trả về lỗi HTTP/JSON nhất quán, thông báo dễ hiểu.
- NFR-04: Responsive tối thiểu desktop/mobile cho luồng chính.
- NFR-05: Tác vụ phân trang và chỉ mục DB phục vụ dữ liệu demo; chưa đặt SLA khi chưa đo tải.
- NFR-06: Source cài được từ README bằng một MySQL local; CI chạy được build/syntax; test runtime ghi thành chứng cứ.
- NFR-07: Không dùng thẻ thật/số tiền thật trong môi trường demo; không commit dữ liệu nhạy cảm.

## Tiêu chí ngoài phạm vi
Không yêu cầu realtime chat, nhóm học tập, gợi ý AI hay production money movement trừ khi cập nhật quyết định phạm vi.

## Ghi chú
Danh sách use case chi tiết, ngoại lệ và sơ đồ UML sẽ được bổ sung theo từng FR/issue. Không tự coi bảng này là biên bản phê duyệt yêu cầu.
