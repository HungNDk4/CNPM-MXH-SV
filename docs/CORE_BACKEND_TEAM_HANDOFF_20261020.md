# Handoff 2 người: Core Backend ↔ Frontend + Phân tích thiết kế
**Mini Study Network — DRAFT v0.1 · 2026-10-20 · Mục đích phân công không trùng lặp**

## 0. Quyết định và trạng thái
**Human A (người dùng) đã xác nhận chọn Core Backend:** Node/Express, Sequelize/MySQL, Auth/JWT, API nghiệp vụ post/comment/like/profile, quyền truy cập, PDF backend, bảo mật server, DB/API integration tests.

**Human B (thành viên còn lại) được đề xuất nhận các gói Frontend + Analysis/Design + UI QA + báo cáo:** cần người này xác nhận phạm vi và khả năng thực hiện trước khi owner từng task được cập nhật trong canonical Task Board. Không hiểu là Human B đã xác nhận hết các mục.

**Phần chung:** thống nhất phạm vi/role, API contract, DB schema-impact, tích hợp FE↔BE, cloud/release và báo cáo cuối. Hai người review chéo. AI không phải thành viên thứ ba.

**Tránh nhầm:** trong `TEAM_WBS_UNASSIGNED.md`, *luồng A* = Frontend/Design, *luồng B* = Backend. Đây KHÔNG phải Human A và Human B. Tài liệu WBS gốc giữ nguyên lịch sử chưa phân công; file này là handoff sau quyết định mới.

**Business đã chốt:** free-first, VNPay/paid deferred; 1 PDF/bài, tối đa 10,485,760 bytes, không rỗng; Guest xem metadata tài liệu active/free, authenticated mới download; publish active ngay sau storage + DB commit; Admin hide/delete sau. Guest xem **mọi loại post** chưa chốt ADR-002. Website online HTTPS độc lập laptop là yêu cầu, cloud provider chưa được chọn.

## 1. Kiểm tra setup hiện tại
| Hạng mục | Evidence | Verdict |
|---|---|---|
| Ubuntu WSL26.04.1; Node24/npm11; Git; doctor.sh | User chạy script, 0 lỗi | READY local dev |
| MySQL 8.4.11, database `mini_study_network`, TCP user `studynet_dev` | 7 tables SHOW TABLES, 2 `updated_at` columns | READY schema dev |
| `server/.env`, JWT pair | JWT ACCESS/REFRESH/DIFFERENT đều OK; DB_AUTO_SYNC=false; MAX_FILE_SIZE_MB=10 | Config checks PASS; **DB password từng bị dán trong chat, chưa chứng minh đã rotate** |
| Express/Vite | Ubuntu `curl /api/health` 200 và người dùng xác nhận giao diện localhost:5173 mở thành công | READY dev servers |
| GitHub CI | PR #9 c421caa… Actions 39313757893 6/6 PASS; có MySQL8 Ubuntu24 disposable auth+post smoke | PASS CI subset, **không thay local browser/DB integration hoặc security QA** |
| Existing UI | `PostDetailPage.jsx` và `ProfilePage.jsx` là stub; Feed filter buttons chưa nối state; document create dùng `file_url` và `price` | Backlog rõ, CHƯA DONE |
| Github merge | PR #1–#9 DRAFT dạng stacked; `main` vẫn 0993a421… | BLOCKED team base selection/review |
| Public app | Vercel isolated health-only PoC READY | Full App HTTPS + DB + Blob + private PDF **NOT READY** |
| Backend security | `/api/payment`/`orders` vẫn mount; `/uploads` public; Multer 1.x | P0 phải sửa trước public demo |
| User local E2E | Chưa nhận bằng chứng thực tế register→login→create post→read→logout, 2-account permissions | PENDING |
| Teammate setup | Không có bằng chứng clone/npm build/GitHub push/PR | PENDING |

**Verdict:** đủ để Human A bắt đầu viết Core Backend; **chưa đủ tuyên bố TEAM READY / PUBLIC READY**. Không cài lại Ubuntu/Node/MySQL.

## 2. P0 chuẩn bị trước khi hai người cùng code
- **P-01 Repo:** đọc và review Draft PR #1→#9 (stacked), quyết định cách merge tuần tự để thống nhất một base; không chọn `main` cũ và tưởng rằng đã có docs/setup/CI.
- **P-02 Auth/Post smoke:** Human A chạy test giả trên WSL: đăng ký một email TEST, đăng nhập, tạo post type `question`, xem detail/feed bằng quyền phù hợp, refresh/logout; kiểm tra MySQL, không dán token/password.
- **P-03 Secret hygiene:** Human A đổi mật khẩu MySQL từng lộ nếu chưa đổi, đồng bộ env và test DB, giữ `chmod 600 server/.env`. Test `git status` để chắc không commit env. Không công bố raw PDF.
- **P-04 Contract v1:** cùng review `SRS.md` + `API_CONTRACT.md` + `DATA_MODEL.md` + permission matrix; Human A biên tập API request/response/errors và database migration, Human B review từ UI, ADR chưa duyệt để OPEN.
- **P-05 Human B machine:** cài riêng Node24/npm/Git, clone, checkout baseline có docs, `cd client && npm ci && npm run build && npm run dev`; test branch/PR permissions. Có thể làm UI mocked **không cần MySQL**. Localhost 5000 của máy B không phải máy A.
- **P-06 Ownership:** 1 work package, 1 editor, 1 branch, 1 PR, một người review còn lại; tránh sửa file đang có PR của người khác. Chỉ ghi tên owner sau khi B xác nhận nhận từng phần.
- **P-07 Release guard:** local-only cho tới khi payment paths disabled, private PDF an toàn, policy checks, cloud persistence được kiểm thử.

## 3. Backlog rõ cho bạn cùng nhóm (Human B dự kiến), thứ tự và phụ thuộc
| ID | Thời điểm | Hạng mục / Task Board ref | Phạm vi công việc và Deliverables | Khi nào DONE |
|---|---|---|---|---|
| **F01** | NGAY | A01–A03 · AN-01/02/04 | Rà Project Charter/SRS, actors Guest/Student/Admin, FR/NFR, UC Diagram và UC Specs, flow Auth/Post/Document/Profile/Admin; trace FR→UC→test. Không tự đổi business | UC main/alternate/error, DRAFT/review rõ |
| **F02** | NGAY | A04–A05 · DS-04 | Sitemap, screen flow, wireframes responsive, thành phần tái sử dụng và trạng thái loading/empty/error/401/403; quản lý tài liệu UI | Một flow map/wireframe review được |
| **F03** | NGAY MOCK → API SAU | A08 · FE-01 | `PostDetailPage.jsx` hiện placeholder; xây trang chi tiết và related sections, chỉ DTO safe; không sửa backend | Build + screenshots + error/empty, FE↔BE integration sau G03 |
| **F04** | NGAY MOCK → API SAU | A10 · FE-04 | `ProfilePage.jsx` hiện placeholder; thông tin công khai, edit own profile, đổi mật khẩu UX | Build, permissions UI, cross-account test khi API sẵn |
| **F05** | NGAY | A06 · FR-01/02 | Audit/hoàn thiện UI Login/Register, form validation, 401/loading/expired UX, navigation, mobile | Client build PASS, UI smoke, không sửa issuer JWT |
| **F06** | MOCK NGAY → API SAU | A07 · FE-03 | Feed, Search, Filter tabs (hiện inactive), pagination query/empty states, metadata cho Guest PDF | Mock theo contract; guest non-document feed cần quyết định ADR-002 |
| **F07** | HỢP ĐỒNG SAU | A09 · FE-01/02 | Comment/reply tree, like/unlike/count UI theo endpoints; no duplicate UI state | API mapping, FE tests, API integration sau B08/09 |
| **F08** | HỢP ĐỒNG SAU | A08 · FE-05 | Create/edit/delete own posts, ownership controls, remove old paid/file_url UX for free PDF flow | 2-account browser test, BE unauthorized test không thuộc FE |
| **F09** | DESIGN NGAY, CODE SAU | A11 · DOC-04/FR-11 | Upload single PDF ≤10 MiB early UX, public metadata, Login-to-Download CTA, progress/abort, errors, hidden/removed UX | Chờ PDF upload/download API/storage contract; no public raw URL |
| **F10** | DESIGN NGAY, CODE SAU | A12 · FR-12 | Admin moderation UI hide/delete, role-specific screens, minimum approved policy | Chờ BE moderation & API contract, student negative path |
| **F11** | SONG SONG | A13–A14 · QA-03 | FE axios adapter và React Query states theo contract; responsive/accessibility UI tests, browser screenshots | UI build+actual browser evidence; không tự ghi backend QA PASS |
| **F12** | GIAI ĐOẠN CUỐI | A15–A16 · DOCS-01/02/03 DEMO-01 | User/Admin manual, frontend/UI + nghiệp vụ trong báo cáo, UML cập nhật đúng source, script demo, ảnh minh chứng | Báo cáo/demo khớp commit cuối và actual tests |

**Ưu tiên đề xuất có thể giao ngay:** F01 + F02 (phân tích và UI blueprint), F03 + F04 (2 trang placeholder), F05, F06 trên mock. **Không giao đồng thời tất cả**, người nhận chọn 1–2 gói/iteration. F07–F10 đợi hợp đồng hoặc API cụ thể; F11 kiểm tra cho mỗi slice, F12 tích lũy báo cáo theo evidence.

## 4. Backlog Core Backend cho Human A (user), unblock phần FE
| ID | Ưu tiên | Task Board ref | Công việc và điểm bàn giao |
|---|---|---|---|
| **C01** | NGAY | OPS-04, DS-03 | Chốt base/branch, contract v1: methods, DTO, errors, auth/permission, pagination; gửi mock JSON cho FE |
| **C02** | P0 | SEC-03, QA-01 | Chặn hard-disable paid/order/payment/callback routes ở backend, không tạo order/wallet changes; HTTP negative tests |
| **C03** | P0 | SEC-01, QA-01 | Loại raw file_url/storage path từ public feed/detail/search; khóa static private file access, negative tests |
| **C04** | P1 | BE-02, DS-02 | Audit ERD/schema/model, migrations không destructive, DB integration suite |
| **C05** | P1 | FR-01/02, BE-01 | Auth/register/login/refresh/logout + ownership tests; guest PDF metadata, guest general post policy OPEN |
| **C06** | P1 | Posts/Comment/Like/Profile BE | CRUD + validation/post-parent invariant/like target, role checks; stable response contracts |
| **C07** | P0 trước PDF | DOC-02, SEC-04 | Quyết định private storage, schema, quota/cleanup, nâng cấp Multer patched, bounded requests |
| **C08** | P1 | DOC-03/04, BE-03 | Upload/store 1 PDF ≤10 MiB, download token guard, Admin hide/delete revoke |
| **C09** | P1 | QA-02, QA-04 | Test MySQL/permissions/security/regression, evidence real local CI |
| **C10** | SHARED | DEP-01/02 | Backend cloud integration with private storage/DB, không tự deploy full app khi P0 chưa PASS |

**Cloud work split:** B có thể chuẩn bị build/UI hosting/đo browser website công khai, A quản lý API/data/PDF access; cả hai cùng review provider, env secrets, quota/backup và release. Không tự gán toàn bộ deployment cho A chỉ vì A nhận backend.

## 5. File ownership tránh overlap
| File/scope | Editor mặc định | Reviewer |
|---|---|---|
| `client/**`, React pages/components/UI tests | Human B **sau xác nhận** | Human A |
| `server/**`, `database/**`, API/DB tests | Human A | Human B |
| `docs/API_CONTRACT.md`, `docs/DATA_MODEL.md`, technical integration | Human A làm đầu mối | Human B |
| `docs/SRS.md`, UC specs, UI flow, user guide | Human B sau xác nhận | Human A |
| `docs/DECISIONS.md`, `docs/ops/TASK_BOARD.md`, `README.md`, release docs, CI shared | **Một editor được chỉ định theo task**, không mặc định cả hai | Hai người review |

**Đổi API:** Human A soạn change+JSON sample và ghi contract version trước; Human B không tự sửa `server/**`. **Đổi UX có thêm field:** Human B tạo request chỉ rõ FR/screen/DTO cần thêm, Human A review và quyết định thay đổi contract; không tự thay schema. Một task chỉ chạm shared files khi issue ghi rõ editor.

## 6. Lệnh kiểm tra Ubuntu không lộ secrets
Trong Ubuntu WSL chạy:
~~~bash
cd ~/CNPM-MXH-SV
git branch --show-current
git status --short
git log -1 --oneline
git remote -v
node -v && npm -v
bash scripts/ubuntu/doctor.sh
stat -c '%a %n' server/.env
~~~
Backend chạy terminal riêng. Trong terminal thứ hai:
~~~bash
curl -fsS http://127.0.0.1:5000/api/health
~~~
Lưu ý máy teammate không nhất thiết có MySQL để xây UI trên mocks, nhưng phải test client build và GitHub PR. Không paste server/.env, token, mật khẩu, dữ liệu cá nhân.

## 7. API handoff template
~~~text
TASK + FR:
CURRENT GIT BASE / BRANCH / COMMIT:
ACTOR: Guest / Student / Admin / Owner
METHOD + PATH:
REQUEST JSON / FORM:          (dùng dữ liệu giả)
SUCCESS CODE + DTO EXAMPLE:
ERROR CODES + EXAMPLES:
DB MIGRATION / PERMISSION:
FRONTEND MOCK/FIXTURES PATH:
TEST ID & ACTUAL RESULTS:
READY FOR UI MOCK / READY FOR INTEGRATION:
KNOWN BLOCKERS / BREAKING CHANGES:
REVIEWER:
~~~

## 8. Acceptance milestones
- **R1 Dev Environment READY (Human A):** WSL/node/npm/MySQL/DB/JWT/Express health/Vite UI. DONE theo user outputs, ngoại trừ secret-rotation chưa xác minh.
- **R2 Collaboration READY:** PR stack reviewed/merged or deliberate shared base, teammate clone/build/PR access, contract v1 reviewed. PENDING.
- **R3 Core Social E2E:** guest/auth/2 students/admin, actual FE→API→MySQL, negative ownership tests. NOT RUN.
- **R4 Secure PDF:** 10 MiB inclusive + invalid/abort tests, private storage, guest metadata/auth download and hidden deny, payment paths disabled. NOT RUN.
- **R5 Public HTTPS:** full React+API+persistent DB/private files, uptime checks independent laptop, restore/quota, human approval. NOT RUN.
- **R6 Academic Handoff:** UML/report/manual/demo reproduce actual release commit; two humans approve. NOT DONE.

**Bản này là đề xuất phân việc để Human B đọc và lựa chọn task cụ thể; không thay canonical Owner/Status trong TASK_BOARD trước khi người đó xác nhận.** References: `TEAM_WBS_UNASSIGNED.md`, `TEAM_WORK_RULES_UNASSIGNED.md`, `PROJECT_CONTROL.md`, `UBUNTU_SETUP.md`, `API_CONTRACT.md`, `TEST_PLAN.md`.
