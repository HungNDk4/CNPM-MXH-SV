# WBS hai luồng công việc — CHƯA PHÂN CÔNG (DRAFT)
**Mini Study Network · Đồ án CNPM · 2 thành viên con người + AI hỗ trợ**

> **KHÔNG CÓ OWNER ĐƯỢC CHỐT.** Cột `Luồng A`/`Luồng B` chỉ mô tả **hai gói vai trò để nhóm lựa chọn sau**. A KHÔNG đồng nghĩa người dùng, B KHÔNG đồng nghĩa thành viên còn lại. Không ghi tên, không đánh dấu bất kỳ task nào là đã được giao. AI không tính là nhân sự thứ ba. Phân công chính thức chỉ có hiệu lực sau khi hai người xác nhận và cập nhật `docs/ops/TASK_BOARD.md`.

- **Phiên bản:** DRAFT v0.1 — 2026-10-20; nền tảng GitHub PR #1→#8 vẫn Draft tại thời điểm đọc.
- **Đối chiếu:** `docs/MVP_SCOPE.md`, `docs/SRS.md`, `docs/ops/MASTER_PLAN.md`, `docs/ops/TASK_BOARD.md`, `docs/API_CONTRACT.md`, `docs/DOCUMENT_UPLOAD_SPEC.md`, `docs/TEST_PLAN.md` và source trong `client/`, `server/`, `database/`.
- **Quyết định đã có:** miễn phí-first; PDF upload trực tiếp; 1 PDF/post, từ 1 tới 10,485,760 byte; khách được xem metadata PDF active/free, người đăng nhập mới tải bytes; publish ngay sau upload/storage/DB thành công; admin có thể ẩn/xóa sau đăng; yêu cầu site công khai HTTPS độc lập laptop; VNPay/paid documents DEFERRED.
- **Chưa chốt:** chính xác ai làm luồng nào, thời lượng từng task, API/schema lưu PDF, provider cloud, quota/retention, chính sách duyệt/report, guest feed chung (ADR-002), tiêu chí giảng viên ngoài các thông tin đã ghi. Không tự điền tên hoặc deadline.
- **Trạng thái thực tế:** WSL Ubuntu 26.04 + Node 24 + MySQL 8.4 + 7 bảng + Express health và Vite UI đã được người dùng kiểm tra. GitHub Actions Ubuntu 24.04/MySQL 8.0 run 39288887715: 6/6 PASS (smoke). Chưa có test E2E toàn bộ, PDF thật, deploy app thật. Vercel PoC health-only độc lập đã READY; không phải sản phẩm cuối.

## 1. Quy tắc đếm và mức phụ thuộc
**Tổng 43 work packages**: 16 gói A + 19 gói B + 8 gói G (chung). Một work package có thể bao gồm nhiều subtask; **không tương đương 43 tính năng**. `FR`/`Task` dùng ID đã có trong SRS/Task Board, còn `Axx/Bxx/Gxx` là mã tổ chức **đề xuất**, không thay ID canonical.

**Mức phụ thuộc:**
- **Độc lập (I):** khởi động nghiên cứu/thiết kế/test strategy/song song sau khi kiểm tra baseline; chưa cần API chạy.
- **Hợp đồng (C):** cần thống nhất FR, DTO, quyền, schema hoặc file boundary trước khi hai luồng cùng implement; sau đó có thể làm song song bằng mock/fixtures.
- **Thực thi (D):** cần kết quả từ work package trước hoặc service thực chạy; nếu thiếu thì giữ BLOCKED/NOT RUN.
- **Cổng phát hành (R):** phụ thuộc tích hợp/test và phê duyệt của cả nhóm. Không dùng CI build để thay acceptance runtime.

## 2. Luồng A — Phân tích yêu cầu, thiết kế trải nghiệm và frontend (16 gói; CHƯA GÁN NGƯỜI)

| ID | Gói việc + FR / task liên quan | Điều kiện bắt đầu | Đầu ra đúng phạm vi, tránh overlap | Kiểm tra / bàn giao |
|---|---|---|---|---|
| **A01** | Product brief, stakeholders, actors, Project Charter (`AN-01`) | I / G01 rà scope | Mục tiêu, vấn đề, 3 actor Guest/Student/Admin, in/out, success criteria; dùng `docs/PROJECT_CHARTER.md`; không tự duyệt business | Brief DRAFT, không tạo actor VNPay cho MVP |
| **A02** | SRS FR/NFR, luật nghiệp vụ (`AN-02/03`; FR-01..12) | A01 + G01 | Viết yêu cầu đo được, permissions dạng business, trạng thái, lỗi, phi chức năng; **không định nghĩa JSON/SQL** | Mỗi FR có acceptance, OPEN được đánh dấu |
| **A03** | Use Case + activity/sequence flow ở góc nhìn người dùng (`AN-04/05, DS-05`) | A02 | UC diagram, UC specs main/alternate/exception và user-flow Auth/Post/Document/Admin; sequence kỹ thuật cần review B | FR→UC→test trace không thiếu |
| **A04** | IA/sitemap, thiết kế màn hình và quyền hiển thị (`DS-04`) | A02; quyền cuối qua G03 | Sitemap Guest/Student/Admin, navigation, empty/loading/error, privacy cues; **không tạo backend authorization** | UI flow review; state matrix |
| **A05** | Design tokens/component/wireframe responsive (`DS-04`) | I/A04 | Component inventory, mobile/desktop layout, form patterns, accessibility; giữ thống nhất React/Tailwind | Prototype/wireframe + tiêu chí responsive |
| **A06** | Auth frontend đăng ký/đăng nhập/logout/refresh (`FR-01/02`) | G03 contract, B05 stub/mock | `client/src/pages/auth/*`, auth UX, submit/error/route protection; không sửa JWT issuer/DB | FE test valid/invalid/expired token; tích hợp sau B05 |
| **A07** | Trang chủ, feed, filter/search/pagination (`FR-03/09, FE-03`) | A04 + G03/B06 contract | `client/src/pages/HomePage.jsx` và component hiển thị bài, query state, guest restrictions rõ ràng; không tự sửa GET API | Empty/loading/error/filter/paging tests; guest general feed phải chờ ADR-002 |
| **A08** | Tạo/xem/sửa/xóa bài và post detail (`FR-04/05/06, FE-01/05`) | G03/B07 contract, A04 | `client/src/pages/posts/*`, edit/delete affordances, confirmation, ownership UX; không sửa SQL | 2 account browser test, errors 401/403/404 |
| **A09** | Bình luận/reply và like frontend (`FR-07/08, FE-02`) | G03 + B08/B09 contract | Component comments, reply, like/count, optimistic/loading state; không ghi DB trực tiếp | Interaction visual tests, forbidden/error UI |
| **A10** | Trang cá nhân/chỉnh hồ sơ/đổi mật khẩu UX (`FR-10, FE-04`) | G03/B10 contract | `client/src/pages/profile/*`, public/private fields, form/validation UI; không xử lý password hashing | Privacy and wrong-account UX |
| **A11** | Giao diện khám phá, upload, tải PDF miễn phí (`FR-11, DOC-04`) | G03, B14 storage/API spec, B15/B16 mocked | PDF form 1 file, client precheck ≤10 MiB, guest metadata+login CTA, active/hidden states; **không tự quyết định storage/url** | T-DOCFREE UI states, errors, progress/abort; binary upload cần B15/B16 |
| **A12** | Dashboard admin/moderation UI (`FR-12`) | business moderation spec + B11 contract | Admin route/access UX, hide/delete posts, trạng thái phản hồi; không cấp role bằng frontend | Student forbidden, Admin visible, reversible UI nếu spec duyệt |
| **A13** | Frontend API adapter, lỗi chuẩn và trạng thái a11y (`DS-04`) | G03 frozen DTO | Chỉ quản lý `client/src/services/api.js`, `client/src/lib/axios.js`, reusable UI errors, keyboard, responsive; không đổi schema backend | Contract snapshots / accessibility review |
| **A14** | UI/component/test browser phía frontend (`QA-03`) | A06..A13 từng phần | FE test scripts/screenshots responsive, keyboard, error/empty/loading, không ghi API integration PASS hộ B | Evidence browser/env/commit |
| **A15** | Tài liệu nghiệp vụ/thiết kế & hướng dẫn người dùng (`DOCS-01/02/03`) | A01..A05 + thực tế code | Phần SRS, UC, UI, hành trình sử dụng trong báo cáo; không diễn giải sai các kết quả triển khai B | Diagram + text phiên bản khớp commit |
| **A16** | UAT, kịch bản demo hành trình người dùng (`DEMO-01`) | G05/G06, core integrated | Script 2 tài khoản + guest/admin, ảnh/video minh chứng, kiểm tra demo trên browser; không tự tuyên bố backend security PASS | UAT checklist và defect backlog |

**File boundary mặc định A:** `client/**`; đề xuất `docs/analysis/**` và `docs/ui/**` (nếu nhóm duyệt); biên tập nội dung SRS/UC/UX. Không sửa `server/**`, `database/**` hoặc CI/deploy config trong một PR frontend. Tài liệu SRS/UC do **một người biên tập trong một PR** và người còn lại review, không cả hai cùng push một file.

## 3. Luồng B — API, dữ liệu, bảo mật, hạ tầng (19 gói; CHƯA GÁN NGƯỜI)

| ID | Gói việc + FR / task liên quan | Điều kiện bắt đầu | Đầu ra đúng phạm vi, tránh overlap | Kiểm tra / bàn giao |
|---|---|---|---|---|
| **B01** | Audit architecture/toolchain/source & dev environment (`DS-01, OPS-07`) | I/G02 baseline | Sơ đồ component, status backend, Ubuntu runbook/CI; không quyết định UI | Source paths, smoke evidence, limitations |
| **B02** | ERD, schema/Sequelize parity, migration (`DS-02, BE-02`) | A02 business fields + G03 | ERD/cardinality, `database/**` + `server/src/models/**`, reversible DB migration; không tự duyệt FR | MySQL 8 temp DB, zero unintended ALTER |
| **B03** | API contract và DTO/error/permission design (`DS-03`) | A02/A03, B02 model | 1 nguồn `docs/API_CONTRACT.md` duy nhất: route/method/body/response/4xx/session/pagination/data exposure; A review | Versioned approved schema, examples, test expectations |
| **B04** | Security threat model & auth boundary (`DS-06`) | I → G03 | Threat map role/IDOR/upload/leak/legacy payments, security checklist; không bổ sung chức năng thanh toán | P0 risks, negative test IDs |
| **B05** | Auth API, session lifecycle, password/profile protection (`FR-01/02, QA-01`) | B02+B03 | `server/src/routes/auth.routes.js`, controller/middleware, refresh token uniqueness and revocation; frontend không tự issue JWT | DB integration: register/login/refresh/logout/invalid/expired; random jti baseline PASS in PR #8 |
| **B06** | Feed/search/guest optional auth (`FR-03/09, BE-01`) | B03 + ADR-002 cho guest bài thường | SQL/Sequelize list/filter/pagination, safe DTO/active-only, rate limiting; **không làm UI** | GET guest doc metadata 200; general feed only when rule approved |
| **B07** | Post CRUD/detail/ownership (`FR-04/05/06`) | B02+B03+B13 | Create/read/update/delete active/hidden state, validation/transaction, safe response | two-user negative tests, no storage key |
| **B08** | Comment/replies API (`FR-07`) | B07 data contract | Reply parent-post invariant, soft delete, permissions | T-COMMENT-01/02 integration |
| **B09** | Like/unlike API (`FR-08`) | B07/B08 + B02 | Target type existence, uniqueness, counters; backend-only rules | T-LIKE-01 + concurrent idempotency |
| **B10** | Profile API/edit/password/ownership (`FR-10`) | B05 + B03 | Public/private DTO, profile updates, password change and token invalidation policy reviewed | T-PROFILE-01, IDOR denial |
| **B11** | Admin moderation API (`FR-12, BE-03`) | G01 moderation rules, B07 | Role guards hide/delete; hidden PDF never downloadable; no Admin UI | Admin/student negative tests + audit data as approved |
| **B12** | **SEC-03 P0**: hard-disable paid/order/VNPay routes & callbacks in MVP | G01 free-first decision, B04 | Backend deny regardless of UI, no order/wallet mutation; do not delete historical models casually | HTTP negative regression: orders, payment, callback, paid documents all denied |
| **B13** | **SEC-01 P0**: redact `file_url`, private file boundary & response DTO | B03+B04 | No URL/storage key in public DTO, remove public private-file exposure; backend authorization, not CSS | Enumerate list/detail/static/direct URL attacks and test denial |
| **B14** | Private PDF storage/data/retention architecture (`DOC-02, DS-02/03`) | G03 + storage selection/zero-cost review | Object key metadata, ownership, file lifecycle, 1 PDF/post, retention/quota/cleanup, MySQL migration; provider **not assumed** | Technical design + cost quota; review before implement |
| **B15** | **SEC-04 P0 + DOC-03**: patch multipart + secure PDF upload | B14, B12/13 | Patched middleware/limits, validate PDF 1..10,485,760 bytes, abort cleanup, DB consistency; Vercel Function 4.5 MB means direct private Blob if chosen | T-UP-LIM-01..06, T-UP-01..10 negative tests; do not claim PASS before run |
| **B16** | Protected PDF download + public metadata (`DOC-04`) | B14+B15+B11 | Authenticated binary download, guest only safe metadata, hidden/deleted disallow even owner | T-DOCFREE-01..06, T-PUBLISH-01..06, no raw links |
| **B17** | Backend integration suite/test data/migrations (`QA-01/02/04`) | By module + G04 | Disposable MySQL tests, seed/test cleanup, negative auth/privacy/security tests; no frontend UAT duplication | Logs per test/commit, CI; Ubuntu 24.04/MySQL8.0 narrow smoke exists |
| **B18** | Public HTTPS infra, DB/Blob integration, quotas/backup (`DEP-01/02, OPS-05`) | B12/13 + B15/16 + G06; provider review | Separate DEV/STAGING/DEMO; persistent cloud database/files, secrets, monitoring, restore, domain; only after approval | External device, persistence after redeploy; PoC health-only != app PASS |
| **B19** | Technical docs, deployment/manual/maintenance (`DOCS-02/03, OPS-06`) | Modules + B17/18 | Architecture/API/DB runbooks, install/backup/restore, technical part of final report; **không viết lại SRS/UX** | Independent setup reproduction, exact commit/CI evidence |

**File boundary mặc định B:** `server/**`, `database/**`, `scripts/backend-or-ops/**`, `.github/workflows/**`, `docs/DATA_MODEL.md` và `docs/API_CONTRACT.md` khi đã nhận quyền biên tập sau này. Không sửa `client/**` trong PR backend. **Các file chung không gán mặc định cho người nào lúc này** — người biên tập được chọn theo work package khi giao việc.

## 4. Công việc chung không chia đôi hoặc nhân bản (8 gói; người điều phối CHƯA CHỐT)

| ID | Công việc chung | Phụ thuộc | Đầu ra/gate | Chống overlap |
|---|---|---|---|---|
| **G01** | Chốt scope, actor, FR/NFR, ADR đang OPEN | Các bản phân tích A01/A02 và phản biện B | Approved scope/MVP & permissions; giữ VNPay DEFERRED; không thêm chat/follow/realtime | Một quyết định duy nhất `docs/DECISIONS.md`, hai người review |
| **G02** | Chọn baseline mã nguồn, review/merge PR #1→#8 | CI của từng PR, human review | Branch chuẩn sạch, hợp nhất stack đúng thứ tự, release baseline | **Chỉ một người thao tác merge tại một thời điểm**, không đụng main khi chưa duyệt |
| **G03** | **Khóa hợp đồng liên luồng** SRS→UC→API→DTO→ERD→permission | A02/A03, B02/B03/B04 | `CONTRACT v1`: endpoints, JSON samples, fields, auth, status, error codes, PDF lifecycle | Một file một editor, reviewer chéo; thay đổi phá contract phải mở ADR/PR |
| **G04** | Dữ liệu mẫu, fixtures, test identities, isolation | G03 | Test data không PII/secrets, phân quyền 2 Student/Guest/Admin, seed reset; DB test độc lập | Một chuẩn fixture chung, không viết DB seed riêng rẽ rồi xung đột |
| **G05** | Tích hợp từng vertical slice | G03 + 1 cặp module Ax/Bx | Demo chức năng trọn FE→API→DB, PR, evidence | Mỗi slice **một integrator được chọn khi bắt đầu**, người kia review; không cùng commit file |
| **G06** | Security/QA gate toàn app | B12/B13/B15/B16, A14, B17 | P0 negative tests, guest/auth/owner/admin/hidden, no PDF leak; E2E regression | Mỗi test case có executor và reviewer; UI test ≠ API auth test |
| **G07** | Chốt cloud/deploy và nghiệm thu public HTTPS | G06 + B18 + actual account/cost approval | Online link, persistence after restart/redeploy, privacy, rollback/quota | Người giữ cloud secrets ≠ tự duyệt deployment; không sử dụng PoC như full site |
| **G08** | Báo cáo, demo, sign-off và handoff cuối kỳ | G05/G06/G07 | Báo cáo khớp source và tests, commit tag, demo và checklist giảng viên | Báo cáo tổng hợp **một editor tích hợp**, nội dung A/B theo artifact; 2 người duyệt |

## 5. Các chuỗi phụ thuộc chính (không phụ thuộc ≠ tự ý đưa lên production)

```text
[ĐỘC LẬP TƯƠNG ĐỐI / lập draft song song]
A01 stakeholders/Charter ------+             B01 source+environment
A02 SRS / scope rules ---------+---- G01 ---- B02 model/schema audit
A03 UC drafts -----------------+             B04 security baseline
A04/A05 IA-wireframes ---------+             B18 cost/hosting research ONLY
                                             |
[HỢP ĐỒNG PHẢI KHÓA]                     G02 baseline/PR stack
 A02/A03 + B02/B03/B04 -----------> G03 contract+permission+schema FREEZE
                                              |
[IMPLEMENT SONG SONG SAU FREEZE]
 A06 auth UI   ------------------------- B05 Auth API
 A07 feed UI   ------------------------- B06 Feed API
 A08 post UI   ------------------------- B07 Post API
 A09 comments/like UI ------------------ B08/B09 interaction API
 A10 profile UI ------------------------ B10 Profile API
 A12 admin UI -------------------------- B11 Admin API
 A11 PDF UI ---------------------------- B14 → B15 → B16 PDFs
                |                              |
                 └──────── G05 integration ───┘
                                |
 B12/13 security hard deny ---- G06 security/QA ---- G07 public cloud
                                |
                              G08 report/release
```

- A làm layout/wireframes trên dữ liệu giả trước khi API có thể chạy, **nhưng mock phải theo G03** mới được coi là code tích hợp ổn định.
- B có thể làm các bản audit/read-only P0 song song với SRS; mọi sửa nghiệp vụ/schema/JSON public đều phải chờ hợp đồng và review.
- B12/B13 là chốt chặn **trước DEMO ONLINE**; B14/B15/B16 là đường găng PDF; B18 hosting nghiên cứu được sớm, **triển khai app thật** chỉ khi bảo mật và persistence PASS.
- Một màn hình frontend chưa thể nghiệm thu end-to-end khi API tương ứng chưa sẵn sàng, dù Vite build PASS.

## 6. Ghi rõ mức độ hoàn thành ngay thời điểm lập WBS
- **Có bằng chứng môi trường:** Ubuntu WSL user setup (Node24, MySQL8.4, DB 7 bảng, backend health 200, React UI đã mở); CI Ubuntu 24.04 + MySQL 8.0 6/6 PASS trong PR #8; health-only Vercel PoC READY và browser ẩn danh xác nhận.
- **Chưa làm/chưa xác nhận:** toàn bộ acceptance FR-01..12 end-to-end trên WSL; API guest feed đúng quyền; secure PDF upload/download; Admin moderation; paid route hard deny; SRS/UC/ERD bản được nhóm duyệt; cloud thật dữ liệu bền vững; báo cáo chính thức.
- **Cảnh báo triển khai:** app Express nguồn hiện tồn tại payment/order API và `/uploads` public; chưa được công khai nguyên backend. Multer 1.x cần xử lý trước khi bật upload; báo cáo npm audit tồn tại, cần đánh giá chứ không ép fix.
- **Không gán người:** mỗi mã A/B/G đều `UNASSIGNED`, không có deadline, % done hay điểm công được suy đoán. Chỉ lựa chọn sau khi hai người xem khối lượng thực tế.

## 7. Tài liệu phải đọc theo thứ tự
1. `PROJECT_CONTROL.md` → `docs/ops/CURRENT_STATE.md` → `docs/ops/TASK_BOARD.md` → `docs/ops/WORKTREE_REGISTRY.md` → `docs/ops/SESSION_LOG.md`.
2. `docs/MVP_SCOPE.md`, `docs/DECISIONS.md`, `docs/SRS.md`, `docs/REQUIREMENTS_TRACEABILITY.md`.
3. `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/API_CONTRACT.md`, `docs/ANALYSIS_DESIGN_PROCESS.md`.
4. `docs/DOCUMENT_UPLOAD_SPEC.md`, `docs/DOCUMENT_ACCESS_POLICY.md`, `docs/TEST_PLAN.md`.
5. `docs/TEAM_WORKFLOW.md`, `CONTRIBUTING.md`, `AGENTS.md`, `docs/ops/CHANGE_CONTROL.md`, `docs/templates/FEATURE_HANDOFF_TEMPLATE.md`.
6. `docs/UBUNTU_SETUP.md`, `docs/ONLINE_DEPLOYMENT_OPTIONS.md`, `docs/DEP01_LIVE_EVIDENCE.md`.

**Quy trình chi tiết, hợp đồng bàn giao, file ownership, QA và selection**: [TEAM_WORK_RULES_UNASSIGNED.md](TEAM_WORK_RULES_UNASSIGNED.md).

**Không cập nhật cột OWNER ở TASK_BOARD theo bảng này**: đây chỉ là bản thiết kế hai hướng để nhóm so sánh workload, phân công sau.
