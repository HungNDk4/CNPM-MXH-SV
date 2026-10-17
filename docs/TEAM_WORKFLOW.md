# Team Workflow — Nhóm hai thành viên + AI
**Trạng thái:** Đề xuất vận hành dựa trên thông tin nhóm có đúng **2 thành viên**; ngày 2026-10-17. Người dùng sẽ duyệt/chỉnh kết quả phân tích và thiết kế AI. Chưa xác định tên/khả năng/phân công chính thức của thành viên còn lại.

## Trách nhiệm
| Hoạt động | Thành viên phụ trách phân tích/thiết kế | Thành viên còn lại | AI assistant |
|---|---|---|---|
| Chốt vấn đề, scope, yêu cầu | Quyết định/duyệt | Đóng góp phản biện | Tổng hợp evidence và đề xuất |
| SRS, Use Case, UML, ERD, API | Review/duyệt version | Review khả thi kỹ thuật | Nghiên cứu, viết bản nháp, trace |
| Coding / integration | Có thể tham gia + review | Nhận module được giao (đề xuất) | Viết/kiểm tra code trên branch riêng |
| QA/UAT | Duyệt acceptance và demo | Chạy lại luồng / phản biện | Thiết kế test, tự động kiểm tra nếu có runtime |
| Merge / release | Một người có quyền merge sau review | Review chéo | Tạo PR, **không tự merge khi chưa được yêu cầu** |

AI không phải thành viên con người thứ ba; AI không được tự phê duyệt tài liệu hoặc giả mạo kết quả kiểm thử. Hai thành viên nên phân công theo khả năng và lịch học thay vì cứng nhắc như bảng trên.

## Single source of truth (SoT)
1. `docs/DECISIONS.md`: các lựa chọn nghiệp vụ/tech đã chốt; mục PROPOSED không phải đã phê duyệt.
2. `docs/SRS.md`: các FR/NFR và acceptance được version hóa.
3. `docs/ANALYSIS_DESIGN_PROCESS.md`: yêu cầu về artifacts và review.
4. `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/API_CONTRACT.md`: thiết kế có thể đối chiếu.
5. `docs/TEST_PLAN.md`: test cases và bằng chứng.
6. PR / Issues: nhật ký thay đổi source và người phụ trách thực hiện.

## Luồng giao việc (tránh ghi đè)
- Người duyệt chốt đầu vào: FR, use case, API/DB impact, acceptance.
- Người/AI nhận task tạo branch RIÊNG từ `main`; không dùng chung branch hoặc sửa cùng file đang có PR khác.
- Source đổi API/schema → sửa contract + test tương ứng trong cùng PR.
- PR mô tả code + test actual; reviewer không chỉ xem giao diện mà kiểm tra authorization và boundary.
- Hai thành viên review chéo khi có thể; không bắt buộc số lượng reviewer trên GitHub nếu chưa cấu hình protection.
- Merge xong mới bắt đầu tính năng phụ thuộc. Giữ PR nhỏ (mỗi luồng hoàn chỉnh), không dồn nhiều module.

## Phiên review tài liệu (AI → Human)
1. AI đọc code và nguồn → draft với metadata `DRAFT`, phân tách VERIFIED SOURCE và PROPOSED.
2. Người phụ trách đánh dấu thay đổi: chấp nhận / sửa / từ chối / chờ thông tin.
3. AI cập nhật bản nháp, checklist yêu cầu và ảnh hưởng tới các artifacts.
4. Chỉ gắn `APPROVED` nếu người có trách nhiệm đã xác nhận rõ ràng; ghi thời điểm và người duyệt.
5. Code chỉ bắt đầu theo phần đã duyệt; nếu cần chứng minh tính khả thi thì dùng spike tách biệt.

## Nhịp làm việc gợi ý (không phải lịch tự động)
- Trước mỗi module: brief 1 trang có FR, use case, expected API, test cases.
- Cuối mỗi PR: CI + manual smoke trên DB test, ghi PASS/FAIL theo bằng chứng.
- Mỗi lần đổi scope: cập nhật Decision Log, Roadmap và Traceability.

## Định nghĩa hoàn thành (Definition of Done)
- Scope và acceptance rõ; không mở rộng ngoài yêu cầu.
- PR được review; không bí mật/token/file nhạy cảm; changes nhỏ và rollback được.
- CI PASS *và* test nghiệp vụ liên quan PASS (nếu chưa có môi trường ghi NOT TESTED).
- SRS/API/Data Model/Test Plan nhất quán với code; demo có thể tái hiện.
