# Decision Log — các điểm cần nhóm thống nhất
**DRAFT**. Không suy diễn mục chưa chốt thành quyết định được duyệt.

| ID | Câu hỏi | Đề xuất hiện tại | Trạng thái |
|---|---|---|---|
| ADR-001 | Tên chính thức đề tài | Mini Study Network — Mạng xã hội học tập sinh viên | PROPOSED |
| ADR-002 | Ai xem được feed | Guest được đọc nội dung public, login cho thao tác ghi | PROPOSED |
| ADR-003 | Phạm vi tài liệu | Hoàn thiện tài liệu miễn phí trước, paid-doc sau security gate | PROPOSED |
| ADR-004 | Thanh toán đồ án | Chỉ VNPay Sandbox; có thể là phần mở rộng nếu được duyệt | PROPOSED |
| ADR-005 | File storage | Không phục vụ file trả phí qua `/uploads` public; dùng private/protected download | PROPOSED |
| ADR-006 | Quy trình nhóm | Mỗi thành viên/AI branch riêng, PR review trước merge | PROPOSED |
| ADR-007 | DB strategy | Dùng migration có kiểm soát, không chạy alter trong production | PROPOSED |
| ADR-008 | Xác minh sinh viên | Chưa có yêu cầu cụ thể; không tuyên bố đã verify | OPEN |
| ADR-009 | Phân công, deadline, tiêu chí chấm | Cần nhóm và giảng viên cung cấp | OPEN |

Khi chốt quyết định: bổ sung ngày, người phê duyệt, phương án chọn và hệ quả tới SRS/schema/API. Tránh thay đổi âm thầm trong code.
