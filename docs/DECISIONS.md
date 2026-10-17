# Decision Log — các điểm cần nhóm thống nhất
**DRAFT**. Không suy diễn mục chưa chốt thành quyết định được duyệt.

| ID | Câu hỏi | Đề xuất hiện tại | Trạng thái |
|---|---|---|---|
| ADR-001 | Tên chính thức đề tài | Mini Study Network — Mạng xã hội học tập sinh viên | PROPOSED |
| ADR-002 | Ai xem được feed | Guest được đọc nội dung public, login cho thao tác ghi | PROPOSED |
| ADR-003 | Phạm vi tài liệu | **MVP chỉ chia sẻ miễn phí**; paid-doc phần mở rộng, **DOC-01 = upload PDF trực tiếp** (Human A đã chốt 2026-10-17) | CONFIRMED Human A (2026-10-17); team review pending |
| ADR-004 | Thanh toán đồ án | **Option B** — VNPay Sandbox DEFERRED, không phải điều kiện MVP; bật lại cần review riêng | CONFIRMED Human A (2026-10-17); team review pending |
| ADR-005 | File storage | Upload PDF website **đã chốt về mặt sản phẩm**; nơi lưu trữ và chính sách truy cập vẫn PROPOSED. Không dùng URL tĩnh công khai cho file chưa được phép. | PRODUCT CHOICE CONFIRMED; technical design OPEN |
| ADR-006 | Quy trình nhóm | Mỗi thành viên/AI branch riêng, PR review trước merge | PROPOSED |
| ADR-007 | DB strategy | Dùng migration có kiểm soát, không chạy alter trong production | PROPOSED |
| ADR-008 | Xác minh sinh viên | Chưa có yêu cầu cụ thể; không tuyên bố đã verify | OPEN |
| ADR-009 | Phân công, deadline, tiêu chí chấm | Cần nhóm và giảng viên cung cấp | OPEN |

| ADR-010 | DOC-01: phương thức chia sẻ tài liệu miễn phí | **Phương án B: upload PDF trực tiếp vào website**, không chỉ dán external URL; dung lượng/giới hạn số file cần duyệt riêng | CONFIRMED Human A (2026-10-17); detailed design DRAFT |

## Decision evidence — 2026-10-17
Human A explicitly chose: "Chốt phương án B: VNPay Sandbox là chức năng mở rộng. Ưu tiên mạng xã hội và chia sẻ miễn phí." This approves the **product priority only**, not full SRS, detailed upload method, payment security, G0/G1, or teammate acceptance.

**Implementation impact:** FR-01..FR-12 proposed MVP; FR-13/14 and PAY-01/02 DEFERRED; SEC-03 must deny unsafe payment routes and paid resources before demo. See [MVP_SCOPE.md](MVP_SCOPE.md).

**DOC-01 decision (Human A, 2026-10-17):** “B — Upload tài liệu trực tiếp, trước mắt giới hạn PDF và kích thước file phù hợp.” Không tự coi 10 MB hay số file/bài là đã phê duyệt. Tham khảo [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md). Các quyết định tiếp theo: ai được xem/tải PDF, giới hạn dung lượng cuối, chính sách duyệt/xóa tài liệu.

Khi chốt quyết định: bổ sung ngày, người phê duyệt, phương án chọn và hệ quả tới SRS/schema/API. Tránh thay đổi âm thầm trong code.
