# Team Workflow — Nhóm hai thành viên + AI
**Updated DRAFT v0.3 · 2026-10-20. Role split newly discussed; per-task owner pending teammate acceptance.**

**CẬP NHẬT 20/10:** Human A (người dùng) đã **chốt nhận Core Backend**; Human B được đề xuất nhận Frontend + Analysis/Design và tài liệu, nhưng phản hồi chấp nhận workload cụ thể từ Human B vẫn **PENDING**. Xem [CORE_BACKEND_TEAM_HANDOFF_20261020.md](CORE_BACKEND_TEAM_HANDOFF_20261020.md). Trước đây hai thành viên **chưa chọn luồng công việc nào**; mọi vai trò từng ghi như "thành viên phụ trách phân tích thiết kế" hay "thành viên còn lại phụ trách code" trước đây chỉ là gợi ý, **không phải phân công đã chốt**. Human A/B trong Task Board chỉ là nhãn phối hợp/nhân sự dự kiến, không tương đương "người đã nhận module". Không giả định ai có năng lực/vị trí nào.

**Bản phân rã mới:** [TEAM_WBS_UNASSIGNED.md](TEAM_WBS_UNASSIGNED.md) (43 gói A01–A16 / B01–B19 / G01–G08, điều kiện bắt đầu và tiêu chí nghiệm thu) và [TEAM_WORK_RULES_UNASSIGNED.md](TEAM_WORK_RULES_UNASSIGNED.md) (bàn giao, folder/file boundaries, hợp đồng/API/DB, Git/QA, selection).

## Hai hướng lựa chọn, chưa gán tên
| Hoạt động | Luồng A: Phân tích/UX/Frontend (slot, chưa có người) | Luồng B: API/DB/Security/Infra (slot, chưa có người) | Lớp G: phải có 2 human review |
|---|---|---|---|
| Business/requirements | SRS/UC/user flow, frontend constraints | kiểm tra feasibility, data/security constraints | Quyết định scope, quyền và contract |
| Implementation | React screens/components/adapter & UX tests | Express routes/controllers/models, MySQL, storage, API tests | Integration slice, E2E, security review |
| Documents | business/design/UI part; user manual | technical/API/DB/deployment part | one report integrator selected later |
| Merge/release | candidate + review, not ownership | candidate + review, not ownership | one merger per PR after two humans agree |
| AI | supports either with isolated PR and evidence | supports either with isolated PR and evidence | cannot count as human or self-approve |

**Vị trí hiện tại:** Human A đã xác nhận chọn luồng kỹ thuật B (Core Backend); Human B được đề xuất luồng A (Frontend/Design). Quy ước luồng A/B trong WBS không phải Human A/B. Chưa gán chính thức các task cho Human B khi chưa có phản hồi xác nhận; canonical Task Board là nguồn trạng thái cuối.

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
