# Quy trình, tài liệu, giao diện bàn giao và chống overlap — CHƯA PHÂN CÔNG
**Đọc cùng [TEAM_WBS_UNASSIGNED.md](TEAM_WBS_UNASSIGNED.md).** DRAFT v0.1 (2026-10-20). Các ký hiệu `A`/`B` là hai **luồng nhiệm vụ để chọn**, KHÔNG phải danh tính người. Mọi owner trong `docs/ops/TASK_BOARD.md` giữ nguyên trạng thái chưa chốt; không tạo nhiệm vụ cá nhân giả.

## 1. Vì sao chia thành 2 luồng + 1 lớp tích hợp?
- **Luồng A = Hành vi, thiết kế, React UI**: xác định người dùng làm gì, màn hình, input/output mong muốn, UX và kiểm thử hiển thị.
- **Luồng B = API, MySQL, bảo mật, cloud**: xác định xử lý/kiểm tra thực tế, DTO/backend, schema, lưu file, bảo vệ quyền và kiểm thử server.
- **G = Giao điểm duy nhất**: phân quyền nghiệp vụ, API contract, việc tích hợp, quyết định cloud, phát hành, báo cáo. G là **gói phối hợp**, không phải người thứ ba, không có ai “tự động” sở hữu.
- Không chia theo kiểu cả hai đều “làm module đăng nhập” mà **chia hai sản phẩm không trùng file**: UI form vs backend auth+DB; nối bằng contract đã review.
- Không chia “A code, B báo cáo” hoặc “A không code”, vì cả hai luồng phải có **đầu ra kỹ thuật có thể chứng minh** sau khi được chọn.

## 2. Ma trận module — bàn giao theo chiều nào, lúc nào?

| Slice/MVP | Luồng A giao | Luồng B giao | Contract bắt buộc trước khi code tích hợp | Definition of done cho slice |
|---|---|---|---|---|
| **Identity FR-01/02** | Register/Login/logout/expired UX, app state | Register/Login/refresh/logout JWT, DB, login defense | Body/DTO/token rotation/401/409/session; A06 ↔ B05 | 2 vai trò, invalid credentials/expired token test; refresh unique `jti` verified baseline |
| **Feed FR-03/09** | Feed/list/search/filter/pagination UX, guest view | GET active posts with paginated safe DTO, filter/optional auth | Fields/public rule, paging, query/error; ADR-002 for generic guest | Browser/API agree; no private storage key/file_url; guest doc metadata only approved |
| **Posts FR-04/05/06** | Create/detail/edit/delete states | CRUD, validation, ownership, soft delete | Who edits, post types, status, public DTO, 401/403/404 | Create→detail→edit→delete and cross-account denial |
| **Comments FR-07** | Threaded UI, reply, error/empty | Parent-post check, CRUD, soft delete | parentId/postId and response structure | Reply references valid parent in same post, unauthorized actions denied |
| **Likes FR-08** | Like button, count, disabled/loading | Target validation, uniqueness/concurrency | Toggle vs create/delete semantics, count DTO | No duplicate likes, invalid target rejected |
| **Profile FR-10** | Public/private profile UI, edit/password UX | Profile/password APIs, data redaction, token invalidate rule | Public fields; password/change session contract | No cross-user profile edits; password safe flow |
| **Free PDF FR-11** | Browse safe metadata, login CTA, upload/download UI | Private storage, 1 PDF ≤10 MiB, auth download, cleanup | Upload mode, token issuance, 413/415, state/file metadata, progress | T-UP-LIM / T-DOCFREE / T-PUBLISH tests, no raw URL, 1 PDF/post |
| **Admin FR-12** | Moderation queue/actions/status UI (minimum approved) | Admin role guards, hide/delete state & access revocation | Who can moderate, audit, error/outcomes; appeals unapproved | Admin acts; Student blocked; hidden file inaccessible |
| **Global UX quality** | Responsive, accessibility, client error state, visual regression | Rate limits, error handling, server logs, input validation, security tests | Error code names, correlation IDs if approved | No misleading UI success, reproducible error conditions |
| **Hosted site** | UI production build + public usability check | HTTPS deploy, MySQL/Blob durability, secrets, backup/restore | Environment URLs, version, upload architecture and quotas | Guest link works off-device and content survives restart/redeploy; free tier ≠ SLA |

> **Module có thể thiết kế trước** nhưng không nên triển khai hai nửa song song khi DTO/permission chưa được khóa. A dùng mock fixtures chuẩn G04; B dùng HTTP integration tests tương ứng; G05 mới xác nhận End-to-End.

## 3. Phụ thuộc đối với phát triển song song — hướng dẫn lập lịch không bịa ngày
### Việc mở song song ngay trong thời kỳ phân tích (sau pre-flight G02)
- A01/A02: liệt kê FR/NFR và UC gaps; A04/A05: khảo sát sitemap/wireframe và UI states dựa trên **luật đã chốt**, phần open để giả định PROPOSED.
- B01/B02: rà mã nguồn, ERD thực trạng, SQL/MySQL 8.4 vs 8.0; B04: threat inventory; B18 **chỉ nghiên cứu quota, không cấp account/chi phí**.
- G02: review theo thứ tự PR #1 → #8; một phiên merge có hai review, không force push.
- Hai luồng **không** chỉnh `docs/API_CONTRACT.md`/`docs/DECISIONS.md` đồng thời. Việc business change phải thông qua G01/G03.

### Những phần phải chờ contract (không cần backend chạy)
- A06–A13 xây UI trên fake data chỉ khi G03 quy định rõ request/response/error, field null, quyền và pagination. Mỗi API giả có file fixture dùng chung theo G04; không chế API riêng trong React.
- B05–B11 có thể xây backend độc lập không cần giao diện khi G03 đã khóa và DB migrations được review. Chạy integration tests bằng temporary MySQL.
- G05 tích hợp từng slice khi cả frontend và backend của slice có PR/CI tương ứng; không chờ toàn bộ hệ thống xong.

### Đường găng không thể thay thế
- **B12 khóa payment / B13 tránh leak** → phải test trước khi có public app; free-first UI không làm vô hiệu hóa API cũ.
- **B14 storage+schema** → **B15 patched upload** → **B16 download+status** → A11 tích hợp → G06 PDF security → G07 persistent cloud.
- **G02 baseline** + **G01 requirements** → **G03 API/permission** → FE/BE implementation → **G05 integration** → **G06 negative tests** → **G07 online full app** → G08 report/demo.
- Một PR UI có thể đạt build PASS trong khi module DB/API còn NOT RUN; phải ghi hai mức khác nhau.

## 4. Nguyên tắc file ownership để không đụng code

| Khu vực/file | Editor duy nhất theo gói việc sau khi được giao | Reviewer phía còn lại | Quy tắc |
|---|---|---|---|
| `client/src/**`, `client/vite.config.js` | Luồng A | Luồng B | Chỉ client; không tự sửa route/Sequelize |
| `server/src/routes/**`, `controllers/**`, `middlewares/**`, `models/**` | Luồng B | Luồng A | Chỉ backend; giữ DTO đã duyệt |
| `database/schema.sql` + migration scripts | Luồng B qua B02/B14 | Luồng A + cả hai duyệt business | Không tự `sync({alter:true})` lên DB thật; migration+backup |
| `docs/SRS.md`, `docs/ANALYSIS_DESIGN_PROCESS.md`, UC/wireframe nguồn | Editor A ở A02/A03/A04 | B | Thay FR/permissions cần ADR và re-review G03 |
| `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md` | Editor B ở B02/B03 | A | Không đổi contract chỉ vì UI muốn field mới; mở Change Request |
| `docs/DECISIONS.md`, `docs/REQUIREMENTS_TRACEABILITY.md` | **Gói G01/G03: 1 editor được chỉ định riêng ở mỗi PR** | Cả hai xác nhận | Không gán mặc định A hoặc B; ai chưa được giao thì chỉ đề xuất |
| `docs/ops/TASK_BOARD.md`, `CURRENT_STATE.md`, `SESSION_LOG.md` | **Điều phối viên lượt đó (chưa chọn)** | Người còn lại | Board là SoT owner/status; append-only log; update khi có bằng chứng |
| `.github/workflows/**`, hosting config, secrets inventory (KHÔNG phải secrets thật) | Editor gói hạ tầng B17/B18 | A | CI shared file: single PR, không đổi workflow liên tục trên 2 branch |
| `README.md`, `docs/ops/MASTER_PLAN.md`, báo cáo cuối | **Một release/docs integrator được chọn khi tới G08** | Cả hai | Gửi nội dung theo phần, chỉ 1 người ghép; không song song edit cùng file |

**Trường hợp bắt buộc đụng file khác phạm vi:** không tự sửa, tạo issue `CHANGE REQUEST` ghi FR/UC/API impact, reviewer, dự kiến file; người editor có quyền tạo PR sửa contract trước, PR phía bên kia rebase rồi mới tích hợp. Không dùng cùng branch/commit dưới cùng một tài khoản để “đỡ merge”.

## 5. Hợp đồng A ↔ B bắt buộc cho MỖI module (template)
Dùng `docs/templates/FEATURE_HANDOFF_TEMPLATE.md`, điền đủ:

```text
PACKAGE: Axx/Bxx; canonical TASK_ID (AN-..., FE-..., BE-..., SEC-..., DOC-...)
STATUS: DRAFT | IN_REVIEW | APPROVED | IMPLEMENTED | VERIFIED
OWNER: UNASSIGNED (cho đến khi nhận việc)
REVIEWER: UNASSIGNED
BASE: commit/branch (ghi chính xác)
FR/UC/NFR: ...     OUT OF SCOPE: ...
ACTOR/ROLE MATRIX: Guest / Student / Admin; unauth/ownership/hidden
API CONTRACT VERSION: method+route, auth, request, response, error codes
DATA: tables/columns/null/unique/transaction/file lifecycle; migration ID
UI: screens, loading/empty/success/error/401/403/404/413/415/429
TEST: unit, API/integration, browser, negative cases, fixture; expected vs actual
FILES: exact allowed paths, related PRs/blocks, no shared-file write
EVIDENCE: date, OS/browser, commit SHA, CI run, screenshots/log without secrets
ROLLBACK: migration and code revert plan
SIGN-OFF: Review A = PENDING; Review B = PENDING (until actual human review)
```

**Contract freeze checklist G03:**
1. Actor/mục tiêu/FR, quyền và tài liệu public fields.
2. API method/path + schema JSON/examples, semantic of status/error, pagination.
3. DB entity + migration, nullable/unique/foreign key + transaction/cleanup.
4. Security: IDOR, direct file URL, no JWT exposed, deferred payment deny.
5. Test matrix valid/invalid/boundary/state; feature flag and rollback.
6. Một editor hợp đồng, người thứ hai review → ghi version, SHA, link PR.
7. Đổi DTO mới = đổi contract PR trước hoặc cùng PR integration được cả hai đồng ý; không có API “ẩn” khác với tài liệu.

## 6. GitHub/Ubuntu quy trình từ giao việc đến merge (áp dụng cho 2 người + AI)
1. **Review baseline:** xem PR #1→#8 đang Draft; review/merge lần lượt theo parent dependency, không bắt đầu feature branch từ `main` cũ rồi giả định đủ files.
2. **Nhận work package:** ghi canonical TASK ID, người thực hiện, reviewer, dependency, branch, file ownership vào `docs/ops/TASK_BOARD.md`. **Lúc viết tài liệu này tất cả vẫn UNASSIGNED**. Nếu chưa có human acceptance, chỉ draft, không tự nhận hộ.
3. **Issue** có tiêu chí acceptance & dependency; branch mới từ baseline duyệt: `feat/auth-ui` / `feat/auth-api` / `fix/security-paid-block` / `docs/uc-auth` v.v. Hai PR không chung branch, không force push hay sửa cùng file trong một thời điểm.
4. **Contract review** G03; FE dùng fixtures và mock API có cùng response schema, BE có test API+DB. Một module có hai PR, có thể tạo PR tích hợp thứ ba bởi 1 người khi được giao.
5. **CI/QA:** FE `npm ci && npm run build` và browser UI; BE `npm ci`, `node --check`, MySQL integration, auth/permission negative tests; CI = evidence source, không phải proof mọi path.
6. **PR review chéo:** kiểm tra file diff, FR/UC link, tests, screenshots, security, migration, response DTO, migration rollback; xác nhận PASS/FAIL/SKIP/NOT RUN theo bằng chứng.
7. **Merge có kiểm soát:** chỉ merge vào baseline khi hợp đồng tương thích và phụ thuộc xong; reviewer/merger chỉ một thao tác/lượt. Sau merge, cập nhật branch còn lại và test lại liên luồng.
8. **Handoff:** SHA, PR, version contract, files, tests, known issues, block; cập nhật `CURRENT_STATE`, `TASK_BOARD`, `SESSION_LOG` và registry; AI không tự đánh dấu human approval.

## 7. Tổ chức tài liệu và phân tách evidence
**Bộ tài liệu nền tảng:** Project Charter / SRS / UC / ERD / architecture / API contract / UI flow / security & permission matrix / Test Plan / QA evidence / User Guide / Technical Manual / deployment & backup runbook / Report & demo.

| Tài liệu/bằng chứng | Nội dung bắt buộc | Khi nào khóa |
|---|---|---|
| `PROJECT_CHARTER.md` | Problem, stakeholder, giới hạn thời gian/kĩ năng, in/out, 2 người; số giờ/dates chưa biết = OPEN | G01 |
| `SRS.md` + `REQUIREMENTS_TRACEABILITY.md` | FR-01..12, NFR, rules, FR→UC→API/DB/UI→T ID; business vs proposed | G01/G03 |
| UC, Activity, Sequence | Main/alternate/exception, failure, authorization; PlantUML/Mermaid/source tùy rubric | G03/G08 |
| `ARCHITECTURE.md` + `DATA_MODEL.md` / ERD | Components, SQL/ORM relationships, storage strategy, migration, threat boundaries | G03 |
| `API_CONTRACT.md` | Request/response/DTO/auth/error/pagination, no raw PDF URLs; versioned change | G03 |
| UI flow/wireframes | Guest/Student/Admin sitemap, responsive/empty/error/permission | G03 |
| `TEST_PLAN.md` + evidence | Unit/API/DB/security/FE/E2E, test data, expected/actual, commit/env/log/screenshots | G05/G06 |
| `UBUNTU_SETUP.md` + deployment runbook | WSL, Node24, MySQL 8.4 dev, cloud setup, rollback/quota/backup (cloud TBD) | G07/G08 |
| User/admin/technical guides | Steps verified by clean-room setup, not screenshots that misstate unsupported features | G08 |
| Final report | Problem→requirements→design→implementation→tests→limits, per-part contribution evidence after selecting owners | G08 |

**Report không làm hai bản trùng nhau:** nội dung A = nghiệp vụ/UX/UC; nội dung B = stack/API/DB/security/infra; **một integrator** biên tập thành 1 bản sau. Người chưa được chọn không tự ký tên “phụ trách”.

## 8. Nghiệm thu và phản hồi chất lượng (không đẩy nghĩa vụ cho AI)
- **Tác giả gói việc** phải có PR, commit, manual test (khi phù hợp), ảnh/log không secret; **reviewer** phải thử tình huống lỗi và trái quyền.
- **Tạo test fixture** chung: guest không token; student_1/student_2; admin_test; 1 public question/discussion, 1 active free PDF, 1 hidden/deleted; API login session valid/expired; không dùng dữ liệu thật/secret.
- **Auth:** wrong password/email, expired/revoked refresh, token uniqueness, access to other profile.
- **Posts/Interaction:** ownership violation, soft delete, parent cross-post, duplicate like, pagination invalid.
- **PDF:** guest list metadata 200, guest direct download 401, authenticated other student 200, hidden 404/deny, exactly 10 MiB inclusive, 10 MiB+1 reject, multiple/malformed rejected, abort/storage failure cleanup; file never visible via public static path.
- **Paid P0:** direct endpoints for order/payment/return/IPN/paid file must be disabled safely before public MVP; no wallet mutation.
- **Infra:** external browser without team login, independent machine/network, persisted DB/PDF after redeploy, quotas/backup; Vercel health-only smoke **không phải** test hoàn thiện.
- **Trạng thái hợp lệ:** TODO → IN_PROGRESS (sau khi owner nhận) → REVIEW (đã có evidence) → DONE (human duyệt + điều kiện PASS), hoặc BLOCKED/DEFERRED. Cấm đổi các gói WBS này sang IN_PROGRESS chỉ vì tài liệu liệt kê.

## 9. Cách chọn hướng cho hai người SAU NÀY — chưa chọn bây giờ
- Mỗi người đọc A01–A16 và B01–B19, đánh dấu **mong muốn / đã quen / muốn học / thời gian khả dụng**, không cần gửi thông tin cá nhân nhạy cảm.
- Ước lượng từng gói theo `S/M/L` sau khi thấy tiêu chí và độ khó (không ấn định 50/50 chỉ bằng số task: B có 19 gói nhưng có nhiều gói infra/security dài; A có 16 gói UI/report dài).
- Cân bằng theo **tổng effort + độ rủi ro + số luồng code thực + minh chứng đóng góp**, không phải số hàng trong bảng.
- Nếu một người không phù hợp trọn luồng A/B, có thể trao đổi **các work package nguyên khối** khi G03 đã khóa; cấm “hai người cùng sửa module backend post” không có chủ file.
- Chỉ khi cả hai chọn rõ: điền Human A/Human B theo task trên **canonical TASK_BOARD** và link agreement; DRAFT này vẫn không phải sự phân công.

## 10. Danh sách checkpoint phải hoàn thành trước khi gọi đồ án DONE
- [ ] G01/G02 phạm vi & PR baseline thống nhất, duyệt hai người.
- [ ] G03 FR/UC/DTO/DB/permission đồng nhất, issues OPEN được xử lý hay defer rõ.
- [ ] G05 tối thiểu core social browser→API→MySQL chạy thật, 2 student + guest/admin.
- [ ] G06 P0 SEC-01/03/04, quyền PDF/Guest/Admin và security negative tests PASS.
- [ ] G07 website HTTPS công khai independent laptop, DB + private PDF persist qua redeploy, quota/backup kiểm chứng.
- [ ] G08 report/diagrams/manual/demo match actual release commit, evidence và phân công thật được xác nhận.

**Đề xuất xử lý tiếp:** hai người REVIEW tài liệu (không bắt đầu giao tên ngay), chọn hàng ưu tiên trong catalog sau khi chốt G01/G03, rồi mới giao owner trong TASK_BOARD.
