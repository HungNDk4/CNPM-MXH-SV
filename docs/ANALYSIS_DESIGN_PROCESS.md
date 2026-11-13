# Quy trình Phân tích & Thiết kế phần mềm — Mini Study Network
**DRAFT workflow** dành cho 2 thành viên. AI thực hiện research/draft; người phụ trách review/điều chỉnh trước khi khóa baseline.

## 1. Mỗi artifact phải có metadata
- Title, version, date, author (AI/human), reviewer, status.
- Status: `DRAFT` → `IN_REVIEW` → `APPROVED` → `IMPLEMENTED` → `VERIFIED`; hoặc `BLOCKED`.
- Phân biệt thông tin từ **SOURCE/CODE**, **REQUIREMENT APPROVED**, **PROPOSAL**, **ASSUMPTION**. Nếu thông tin thiếu, ghi OPEN QUESTION; không tự khẳng định là yêu cầu chính thức.
- Điều chỉnh approved doc cần change log và kiểm tra tác động qua API/DB/test.

## 2. Chuỗi yêu cầu → thiết kế → kiểm thử
```text
Project Charter + stakeholders
           ↓
SRS: FR/NFR + actors + business rules
           ↓
Use Case Diagram & Specification (main/alternative/exception)
           ↓
Activity / Sequence cho luồng khó: Auth, Post, Document, Payment
           ↓
Architecture + ERD (cardinalities/constraints) + API contract
           ↓
Wireframe/UI states (loading/error/empty/authorization)
           ↓
Test cases & traceability (FR → UC → component/API → testcase)
           ↓
Review người dùng → Implementation PR → Test evidence
```

## 3. Gói phân tích tối thiểu theo module
1. User story; actor; problem; scope/out-of-scope.
2. FR IDs, NFR/ràng buộc; business rules với ví dụ hợp lệ/bất hợp lệ.
3. Use case template ở `docs/templates/USE_CASE_TEMPLATE.md`: preconditions, postconditions, normal/alternate/error, permission matrix.
4. ERD/schema impact, API request/response/error, UI states.
5. Acceptance criteria rõ ràng, trace tới test ID; test data, test DB và rollback.
6. Human sign-off (APPROVED) trước khi AI/nhóm thay đổi nghiệp vụ/DB/payment.

## 4. Các artifacts toàn hệ thống còn cần bổ sung
| Artifact | Trạng thái lúc thiết lập | Review gate |
|---|---|---|
| Project Charter | Có bản DRAFT | Scope, timeline và vai trò |
| SRS FR/NFR | Có bản DRAFT | Actors và business rules |
| Use Case diagram | Chưa tạo | Đủ actor và quan hệ include/extend có căn cứ |
| Use Case specifications | Chưa tạo | Main/alternate/error và phân quyền |
| ERD diagram | Chưa tạo (có schema SQL) | FK, cardinality, constraints đúng code |
| Activity / Sequence diagrams | Chưa tạo | Luồng Auth/Post và Payment nếu chọn |
| UI flow/wireframe | Chưa có bản chính thức | Guest/auth/admin và states |
| Test plan | Có DRAFT, chưa chạy | Test match FR/UC, có evidence |
| Traceability matrix | Có khung, chưa verify | Không FR nào thiếu test khi đưa vào MVP |
| Report cuối kỳ | Chưa tạo | Các bản design khớp trạng thái source |

## 5. Review checklist của người duyệt
- Chức năng có phục vụ mục tiêu học tập sinh viên? Có vượt scope đồ án không?
- Từng actor có quyền gì? Guest đọc đến mức nào? Admin xử lý vi phạm ra sao?
- Flow thất bại/không có dữ liệu/concurrency/permission đã mô tả?
- Model DB có hỗ trợ các trường hợp nghiệp vụ và tránh orphan/vi phạm?
- API trả những field nào? Có lộ URL trả phí hoặc token không?
- Có test cụ thể chứng minh chức năng và quy tắc bảo mật?
- Những gì đang code/chưa code/chưa test có ghi riêng, không đánh tráo mức hoàn thành?
- Giảng viên yêu cầu dạng biểu đồ, phạm vi, deadline nào? Nếu chưa biết để OPEN.

## 6. Điểm khóa trước khi bắt đầu module
Chỉ build feature theo bản brief đã được review. Nếu thay đổi phá schema/luồng quyền hoặc payment, tách thành ADR + migration plan + test P0. Dùng `docs/templates/FEATURE_HANDOFF_TEMPLATE.md` khi bàn giao AI ↔ developer.
