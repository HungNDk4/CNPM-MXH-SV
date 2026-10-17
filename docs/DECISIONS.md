# Decision Log — các điểm cần nhóm thống nhất
**DRAFT**. Không suy diễn mục chưa chốt thành quyết định được duyệt.

| ID | Câu hỏi | Đề xuất hiện tại | Trạng thái |
|---|---|---|---|
| ADR-001 | Tên chính thức đề tài | Mini Study Network — Mạng xã hội học tập sinh viên | PROPOSED |
| ADR-002 | Ai xem được feed | Guest được đọc nội dung public, login cho thao tác ghi | PROPOSED |
| ADR-003 | Phạm vi tài liệu | **MVP chỉ chia sẻ miễn phí**; paid-doc phần mở rộng, cách chia sẻ DOC-01 còn OPEN | CONFIRMED Human A (2026-10-17); team review pending |
| ADR-004 | Thanh toán đồ án | **Option B** — VNPay Sandbox DEFERRED, không phải điều kiện MVP; bật lại cần review riêng | CONFIRMED Human A (2026-10-17); team review pending |
| ADR-005 | File storage | Không phục vụ file trả phí qua `/uploads` public; dùng private/protected download | PROPOSED |
| ADR-006 | Quy trình nhóm | Mỗi thành viên/AI branch riêng, PR review trước merge | PROPOSED |
| ADR-007 | DB strategy | Dùng migration có kiểm soát, không chạy alter trong production | PROPOSED |
| ADR-008 | Xác minh sinh viên | Chưa có yêu cầu cụ thể; không tuyên bố đã verify | OPEN |
| ADR-009 | Phân công, deadline, tiêu chí chấm | Cần nhóm và giảng viên cung cấp | OPEN |

## Decision evidence — 2026-10-17
Human A explicitly chose: "Chốt phương án B: VNPay Sandbox là chức năng mở rộng. Ưu tiên mạng xã hội và chia sẻ miễn phí." This approves the **product priority only**, not full SRS, detailed upload method, payment security, G0/G1, or teammate acceptance.

**Implementation impact:** FR-01..FR-12 proposed MVP; FR-13/14 and PAY-01/02 DEFERRED; SEC-03 must deny unsafe payment routes and paid resources before demo. See [MVP_SCOPE.md](MVP_SCOPE.md).

Khi chốt quyết định: bổ sung ngày, người phê duyệt, phương án chọn và hệ quả tới SRS/schema/API. Tránh thay đổi âm thầm trong code.
