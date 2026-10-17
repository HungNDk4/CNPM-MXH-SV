# AI Research & Engineering — Skill Playbook
**Dành cho ChatGPT/Codex và công cụ AI khác khi tham gia CNPM-MXH-SV.** Đây là hướng dẫn kỹ năng trong repository; không có nghĩa các plugin hoặc kỹ năng bên ngoài đã được cài đặt/được cấp quyền.

## Research first, không tự tưởng tượng
- Đọc branch/commit và mã nguồn liên quan; liệt kê sự thật **SOURCE-VERIFIED**.
- Khi nghi ngờ API/thư viện, kiểm tra tài liệu chính thức theo **đúng major version** rồi ghi URL/ngày.
- Nếu chưa chạy lệnh, ghi `NOT TESTED`, không ghi `PASS`.
- Tránh dùng source cũ nếu PR đang thay đổi chính module đó; kiểm tra head/ref trước khi sửa.

## Skill matrix theo loại nhiệm vụ
| Skill | Dùng khi | Input phải có | Output & evidence |
|---|---|---|---|
| Requirement engineering | Feature mới, scope mơ hồ | Actor, mục tiêu, FR hiện có | SRS/UC draft, rules, open questions |
| UML & system design | Cần thiết kế trước code | Approved FR, source model/API | UC, activity/sequence, ERD, mappings |
| Repository/architecture audit | Nhận task hoặc đổi phần lõi | Branch, code, docs | File map, dependencies, conflicts, risk |
| React/Vite/Tailwind UI | Trang và tương tác người dùng | Approved UI states/API contract | Components, responsive, loading/errors, build |
| REST/Express/JWT | Endpoint/auth/role | Contract, threat model | Route/controller/validation, auth tests |
| Sequelize/MySQL modeling | Sửa DB và nghiệp vụ | ERD, constraints, migration plan | DDL/model/migration + rollback + DB tests |
| Security review | Auth, tài liệu, payment, upload | Actor/resources/attack scenarios | Finding severity, negative tests, mitigation |
| Test automation/QA | Sau hoặc trước code theo TDD | Acceptance, seed DB | Test cases, actual logs PASS/FAIL, CI |
| GitHub collaboration | Thực hiện bất kỳ thay đổi source | branch, scope, issue | Separate branch, small PR, peer review |
| Documentation/handoff | Bàn giao cho thành viên/AI khác | Diff, known gaps, test results | Handoff theo template và next actions |

## Agent routine chuẩn
1. **Intake**: tóm tắt task và constraints; xác định `FR-xx`, branch HEAD, ownership.
2. **Inspect**: đọc source và docs, xem đang có PR/branch nào chạm file cùng phạm vi.
3. **Research**: official docs đúng phiên bản, xác thực các giả định.
4. **Design**: brief, API/schema/UI/test acceptance + risk; xin duyệt các thay đổi nghiệp vụ lớn.
5. **Implement**: patch nhỏ, không format toàn repo hoặc sửa ngoài scope.
6. **Verify**: install/build/test thật; ghi PASS/FAIL/NOT TESTED và lệnh/bằng chứng.
7. **Handoff**: commit, PR, reviewers, file manifest, các việc còn thiếu và quyết định chưa chốt.

## Prompt giao việc mẫu (điền giá trị cụ thể)
```text
Repo: HungNDk4/CNPM-MXH-SV
Base: main (kiểm tra HEAD mới nhất)
Module/FR:
Tài liệu phải đọc: AGENTS.md, SRS, API_CONTRACT, TECH_STACK_PLAYBOOK
Nhiệm vụ:
In scope / Out of scope:
Acceptance criteria + testcase:
Không đụng source khác; branch riêng; không merge; không sửa secrets.
Phải báo cáo: file changed, tests actual, blockers, PR URL.
```

## Stop conditions
- Không rõ hợp đồng API, thiếu tiêu chí xác nhận nghiệp vụ hoặc đang có conflict chưa phân giải.
- Không có QA cho thanh toán hoặc tài liệu trả phí: chỉ viết design/proposal, chưa tuyên bố hoàn chỉnh.
- Branch/commit không đúng hoặc main có thay đổi không mong đợi: ngừng mutation, kiểm tra với nhóm.

## Lưu ý kỹ năng/điểm tham chiếu
- Frontend: React 18 rules, Router v6, Query v5, Tailwind v3.
- Backend: Express 4 async errors, Sequelize v6 transactions/locks.
- Security: OWASP API BOLA + field-level authorization; payment idempotency.
- Đọc `docs/TECH_STACK_PLAYBOOK.md` để tới nguồn chính thức, không dùng syntax của latest major nếu repo chưa upgrade.
