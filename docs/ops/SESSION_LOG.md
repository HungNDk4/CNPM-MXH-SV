# SESSION LOG — append-only cross-session evidence
Entries are appended at the bottom in chronological order (oldest first). Do not delete/modify past results except to append a dated correction. Each entry must link to a verifiable commit/PR, and classify run vs not run.

## SESSION-20261017-OPS-01 — Foundation created (prior conversation)
**Actor:** AI via GitHub connector. **Tasks:** OPS-01, OPS-02.
**Main HEAD:** `0993a42154feb37e8842ef8bb3ed4d0a03627889`; not modified by assistant.
**Branch:** `chore/project-foundation-20261017`.
**Commit:** `87eb985e023f77935edd49916ca7655346ff83eb`. **Draft PR:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/1.
**Scope:** docs/SRS and architecture drafts, guidelines, tech/skills playbooks, Node 24/Vite ESM alias, CI workflow.
**CI:** Frontend build PASS, Backend syntax PASS (GitHub Actions run https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39048486394).
**QA NOT RUN:** database integration, login E2E, paid-document access, VNPay Sandbox.
**Next:** review foundation, control plan and human decisions before implementation.
## SESSION-20261017-OPS-02 — Session control system creation
**Actor:** AI via GitHub connector. **Task:** OPS-03. **Status:** IN_PROGRESS at draft creation.
**Base:** `chore/project-foundation-20261017` @ `87eb985e023f77935edd49916ca7655346ff83eb`.
**Working branch:** `docs/session-worktree-control-20261017`, created from exact base.
**Scope:** define WBS/gates, task statuses, read-first index, worktree methodology, session logs/handoffs, docs integrity checks.
**Source verification:** PR #1 at baseline was OPEN / DRAFT; main @ `0993a42154feb37e8842ef8bb3ed4d0a03627889`; foundation CI PASS.
**Security/runtime:** no payment/DB/source business mutation. Local worktree **NOT VERIFIED**.
**Evidence:** new control-system PR/commit and CI are to be added in a following append-only entry once completed. No claim of PASS yet.
**Next:** publish Draft PR against foundation, validate CI, request human review, then start AN-01 after G0 acceptance.


## SESSION-20261017-OPS-03 — Control docs published for review
**Actor:** AI via GitHub connector. **Task:** OPS-03. **Transition:** IN_PROGRESS → REVIEW (not DONE).
**Branch:** `docs/session-worktree-control-20261017` based on `87eb985e...`.
**Initial commit:** `3f4a018c3c40f34d348276c41156f459df96dca8`; **Draft PR #2:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/2 → foundation branch.
**CI evidence:** https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39049674352 — frontend build PASS, backend syntax PASS, project control docs static checks PASS.
**Changes:** master plan P0–P7, canonical task board, read-first index, worktree guide/registry, session start/log/handoff, risk and research register, status read-only PowerShell script, docs-integrity check.
**QA NOT RUN:** DB integration, E2E, live/Sandbox payment. **Local worktree:** NOT VERIFIED (remote branch only). **Main:** not modified.
**Next:** reviewer approves/edits PR #1 then PR #2 dependency, human owners and MVP scope. Once G0 accepted, AN-01/AN-02 on analysis worktree. A follow-up commit updated status snapshots; verify the latest CI independently.

## SESSION-20261017-AN-00 — Free-first MVP decision captured
**Actor:** Human A (product decision), AI (GitHub documentation). **Task:** AN-00. **Result:** Human A CONFIRMED Option B, not entire SRS/G0/G1.
**User choice:** VNPay Sandbox is optional extension; prioritize student social networking and FREE documents for MVP.
**Branch:** `docs/mvp-scope-option-b-20261017`, based on control branch HEAD `8c0b28ec025516cb98fe240fb9497020ac9822f0`. Linked PR added after publishing; verify GitHub current head.
**Changed:** `docs/MVP_SCOPE.md`, ADR-003/004, SRS, Charter, Roadmap, Master Plan, task board, current state, requirements traceability, risk and registry. 
**Approval:** Human A approved scope option only; Human B/instructor review and DOC-01 link-vs-upload decision PENDING.
**P0:** SEC-03 server-side deny paid/checkout/payment callback and SEC-01 prevent paid URL leakage are REQUIRED before demo. Payment code is not yet disabled; SEC-02 full idempotent payment flow deferred.
**Tests:** DOCS only; no DB/E2E/payment integration verified. GitHub CI will be checked after opening PR.
**Next:** choose DOC-01 free document sharing method, review PR #1/#2/#3 in order, then start requirements AN-01/AN-02 after G0.

## SESSION-20261017-AN-00-PR — Scope decision docs published
**Actor:** AI via GitHub connector. **Task:** AN-00 documentation. **Status:** REVIEW; human product scope Option B already CONFIRMED.
**Draft PR #3:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/3 → `docs/session-worktree-control-20261017`, stacked after PR #2 and PR #1.
**Initial published commit:** `07a72f9c2d04038a37a001c05ab54d3590f16b57`. CI run https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39051123916 — **Frontend build, Backend syntax, docs integrity all PASS**.
**Decision record:** ADR-003/004 + docs/MVP_SCOPE.md, product owner Human A selected free-first MVP; detailed SRS and teammates' review remain DRAFT/PENDING.
**Code change:** NONE in business controllers/models/database. **Payment APIs NOT DISABLED YET**; SEC-03 and SEC-01 are P0 gate before MVP demo.
**Local worktree:** UNVERIFIED (remote branch only). No DB/E2E/VNPay QA run.
**Next exact product decision:** DOC-01 choose (A) external URL, (B) upload file to website, or (C) both. Avoid claim of completion of G0/G1.
**Follow-up:** status/log registry update creates new HEAD; verify final CI independently.

## SESSION-20261017-DOC-01 — Human A chooses direct PDF uploads
**Actor:** Human A (product decision) + AI (research and GitHub docs). **Task:** DOC-01. **Decision:** direct website PDF upload for free documents, replacing external-link-only MVP; exact size limit not selected.
**Branch:** `docs/pdf-upload-scope-20261017`, based on scope branch `a5bc0c57693b82753daa29a89ece565a683f884e`. Planned Draft PR #4 → `docs/mvp-scope-option-b-20261017`.
**Files:** `docs/DOCUMENT_UPLOAD_SPEC.md`, ADR-010, MVP_SCOPE, SRS, API_CONTRACT and DATA_MODEL draft proposals, TEST_PLAN, requirement traceability, MASTER_PLAN, TASK_BOARD, CURRENT_STATE, WORKTREE_REGISTRY.
**Source verified:** current `server/src/controllers/post.controller.js` writes only supplied `file_url`; `server/src/app.js` exposes `/uploads` as static; `server/package.json` declares `multer ^1.4.5-lts.1`.
**Research:** OWASP File Upload Cheat Sheet, official Multer API, GHSA-wc9g-mqfw-jrwm (`multer <2.3.0` affected; upgrade required before upload).
**Security:** SEC-04 added for patched multipart parser; SEC-01/SEC-03 still block paid-file/payment exposures. **NO upload implementation occurred**; no DB changes; QA PDF/storage NOT RUN.
**Detailed proposals only:** cap 10 MiB, one PDF/post, private download endpoint; need user/team review.
**NEXT PRODUCT QUESTION:** are public guests allowed to view/download PDFs, or is login required? Do not invent access policy.
**Ops:** GitHub-only; no physical worktree created/verified. PR/CI details appended in a later session entry when available.

## SESSION-20261017-DOC-01-PR — PDF decision docs ready for human review
**Actor:** AI via linked GitHub. **Task:** DOC-01 (product choice DONE, docs IN REVIEW).
**PR:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/4 (Draft) targeting `docs/mvp-scope-option-b-20261017`. Dependent on PR #3, #2 and #1.
**Initial changes HEAD:** `4aafba2a0093865e8737c86e3b3f42fc83776f2a`. Verified GitHub Actions https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39051750751: **Frontend production build PASS; Backend JS syntax PASS; project-control integrity PASS**.
**Files:** docs/DECISIONS, MVP_SCOPE, SRS, DOCUMENT_UPLOAD_SPEC, API_CONTRACT, DATA_MODEL, TEST_PLAN, MASTER_PLAN, REQUIREMENTS_TRACEABILITY, TASK_BOARD, CURRENT_STATE, SESSION_LOG, WORKTREE_REGISTRY.
**Business scope:** free PDF upload is the selected method. **10 MiB max / one PDF per post are proposals ONLY;** guest download rights undecided.
**Technical and security:** multer 1.x declared and vulnerable; SEC-04 requires patched dependency review, file validation and protected storage before implementation. No controller/model/schema changed. No file-upload/DB/E2E tests performed.
**Local worktree:** NOT VERIFIED (GitHub-only branch). **Human approval of detailed design/G0/G1:** PENDING.
**Next:** choose guest PDF viewing/downloading policy, review size constraints, PR #1-#4 in dependency order. CI for any handoff-only follow-up commit needs fresh verification.

## SESSION-20261018-AN-06 — Human A confirms PDF discovery / download permission
**Actor:** Human A (business rule), AI (GitHub documentation), **Task:** AN-06 (product decision DONE; detailed design/implementation pending).
**Decision:** Guest can see free/public/active PDF list, title and description; **must log in before downloading PDF**. Signed-in active student may download another student's active free PDF. No university email verification or inline preview implied.
**Approval boundary:** Only ADR-011 document permission rule approved by Human A; general-post feed ADR-002, size cap, number of files, final storage policy, Human B/teacher review remain OPEN.
**Implementation:** NOT IMPLEMENTED. No controller/database/schema changes; direct URL access and raw `/uploads` still require security patch before deployment.
**Branch:** `docs/guest-metadata-auth-download-20261018`, branched from PDF docs HEAD `db170bd05eee924dcf612c51d2a22dd4dd110886`. Physical local worktree NOT VERIFIED.
**Documentation changed:** DECISIONS (ADR-011), DOCUMENT_ACCESS_POLICY, MVP_SCOPE, SRS, DOCUMENT_UPLOAD_SPEC, API_CONTRACT, TEST_PLAN, REQUIREMENTS_TRACEABILITY, MASTER_PLAN, TASK_BOARD, CURRENT_STATE, SESSION_LOG, WORKTREE_REGISTRY.
**Tests added, NOT RUN:** T-DOCFREE-01..06 (guest metadata, guest direct download 401, expired token, student cross-owner download, hidden/deleted/paid, unauthorized writes).
**Next:** publish dependent Draft PR #5, confirm GitHub Actions and append PR/CI evidence; next review 10 MiB cap/one PDF-post proposals and whether to approve wider Guest feed (ADR-002).

## SESSION-20261018-AN-06-PR — Guest PDF access docs published
**Actor:** AI via GitHub connector. **Task:** AN-06 completed as product decision, docs in REVIEW.
**Draft PR #5:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/5 → `docs/pdf-upload-scope-20261017` (dependent PR stack #1→#2→#3→#4→#5).
**Initial commit:** `ab3111900479283cade14b86ff21dd3270333388`. Verified GitHub Actions https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39052464467: **3/3 PASS** (backend syntax, frontend build, project-control docs integrity).
**Approved:** Guest lists and reads active free PDF metadata; PDF file bytes require authenticated session (401 without token). No extrapolation to all post types (ADR-002 remains open).
**Still PROPOSED:** upload cap 10 MiB, one PDF per post, provider/storage choice, inline preview and moderation implementation details.
**Implementation/QA:** No backend/frontend/schema changes; runtime tests **NOT RUN**. Source payment and file exposure P0 warnings remain.
**Local worktree:** UNVERIFIED (remote branch only).
**Next:** Human A reviews technical PDF size/count and ADR-002 general feed scope; both humans review PR chain; then implement auth/download API and test.
**Handoff:** this entry and registry changes produce a new HEAD; check its CI separately, do not attribute previous CI result to new HEAD.

## SESSION-20261018-AN-07 — Human A confirms 10 MiB and one PDF per document post
**Actor:** Human A (business requirement), AI (docs via GitHub connector). **Task:** AN-07. **Status:** product decision DONE; docs awaiting review.
**Decision:** maximum **10 MiB = 10,485,760 bytes** inclusive, **exactly one PDF** per document post. This supersedes *proposal status* of the same limits in earlier documentation, not historical evidence. Must reject zero bytes, multiple files, wrong type and 10,485,761+ bytes. UI may pre-check, server must enforce.
**Branch:** `docs/pdf-upload-limits-20261018` based on `docs/guest-metadata-auth-download-20261018` @ `4d101fcb5b63f79af49811c86566be594d6d7191`. Draft PR expected targeting that branch, not main; verify PR and CI when published.
**Files/doc scope:** ADR-012, MVP_SCOPE, SRS, DOCUMENT_UPLOAD_SPEC, API_CONTRACT, DATA_MODEL, TEST_PLAN, REQUIREMENTS_TRACEABILITY, MASTER_PLAN, TASK_BOARD, CURRENT_STATE, WORKTREE_REGISTRY, SESSION_LOG; source controllers/schema untouched.
**QA:** T-UP-LIM-01..06 specified, NOT RUN (no upload implementation); CI on new commit pending verification.
**Still OPEN:** provider/storage approach, file replacement policy, retention/deletion, admin moderation/publish approval, full G0/G1 acceptance, other general-post guest access ADR-002.
**Next:** publish/verify dependent Draft PR #6; ask Human A whether PDF is published immediately after passing validation or requires admin approval. Continue human review of stacked docs PRs #1-#6 and start AN-01/AN-02 after G0. GitHub-only branch: local worktree UNVERIFIED.

## SESSION-20261018-AN-07-PR — PDF upload limits published for review
**Actor:** AI via GitHub connector; **task:** AN-07 (human decision DONE; docs in REVIEW).
**Draft PR #6:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/6 → `docs/guest-metadata-auth-download-20261018` (dependent on Draft PRs #1-#5).
**Initial commit:** `c15e59b19740d278ef6cf409400c322a8d03ce3d`. Verified GitHub Actions: https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39137384913 **3/3 PASS** (frontend production build, backend JS syntax, project control docs integrity).
**Human A confirmed:** exactly one PDF per new document post and limit 10 MiB = 10,485,760 bytes inclusive. 10 MiB + 1 byte rejected.
**Docs:** ADR-012, SRS, MVP_SCOPE, DOCUMENT_UPLOAD_SPEC, DOCUMENT_ACCESS_POLICY, API_CONTRACT, DATA_MODEL, TEST_PLAN, REQUIREMENTS_TRACEABILITY, MASTER_PLAN, TASK_BOARD, CURRENT_STATE, WORKTREE_REGISTRY, SESSION_LOG.
**Runtime status:** no app/upload/backend/schema change; T-UP-LIM-01..06 **NOT RUN**; static CI success does not prove PDF upload works.
**Local worktree:** NOT VERIFIED (remote branch only); `main` unchanged at start of this session.
**Next:** Human A decides whether successfully validated PDF auto-publishes or waits for admin review; two human teammates review stacked PRs; then G0 and analysis AN-01/AN-02.
**CI caveat:** this handoff-only follow-up commit advances PR HEAD; verify its own run independently.

## SESSION-20261018-AN-08 — Immediate PDF publication selected
**Actor:** Human A selected **A — Hiển thị ngay**; AI updated docs through GitHub. **Task:** AN-08 DONE as product choice, NOT implementation.
**Decision ADR-013:** validated FREE PDF becomes `active` and publicly discoverable immediately after file storage + DB commit succeed. No admin manual preapproval. Admin may hide/delete violations afterwards; hidden/deleted PDF must be absent from public metadata and denied on direct download even for uploader.
**Approval boundary:** user-report/flag UI, appeal/unhide, durable PDF storage/retention and exact moderator UI NOT approved by this choice. Existing ADR-011 and ADR-012 unchanged.
**Branch/PR:** `docs/pdf-upload-limits-20261018` / https://github.com/HungNDk4/CNPM-MXH-SV/pull/6 (Draft), stacked after #5. Updated within current PR (no seventh PR), no direct `main` modification.
**Files changed:** DECISIONS, MVP_SCOPE, SRS, DOCUMENT_UPLOAD_SPEC, DOCUMENT_ACCESS_POLICY, API_CONTRACT, TEST_PLAN, REQUIREMENTS_TRACEABILITY, MASTER_PLAN, TASK_BOARD, CURRENT_STATE, SESSION_LOG.
**Test specification:** T-PUBLISH-01..06, **NOT RUN**; no application controller, model, database migration, payment or PDF upload code changed. SEC-01/SEC-03/SEC-04 unresolved; physical worktrees unverified.
**Next:** verify new PR #6 HEAD and CI; Human A/Human B review stacked PRs; next technical decision storage/retention and optional reporter workflow; G0/G1 not yet approved.

## SESSION-20261018-AN-08-CI — ADR-013 docs PR CI evidence
**Draft PR #6:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/6 (title updated to include ADR-012 and ADR-013).
**Verified commit:** `19cd787cf6de365fe9475a96fbecf67f7d145a25`. **GitHub Actions:** https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39138720270 — CI **PASS** (frontend build, backend JS syntax, project control docs).
**Scope:** Documentation-only decision & handoff, **NOT** upload, download, moderation, DB integration or P0 security regression QA. `main` was still `0993a42154feb37e8842ef8bb3ed4d0a03627889` when verified.
**Next:** review this PR within stacked dependencies; choose persistent storage, retention and whether report flow is needed. This log-only follow-up advances branch HEAD and triggers a new CI run; verify it live.

## SESSION-20261018-AN-09 — Student budget-first constraint
**Actor:** Human A expressed concern that student project costs should not balloon; AI researched current official provider free-tier/pricing and prepared recommendation (task AN-09 DONE as cost requirement capture only).
**Decision boundary:** Human A confirmed **cost minimization**; did NOT explicitly approve an exact numeric hard cap, sign up for any service, use a payment card or select a storage provider. Proposed target 0 VND recurring fees for local demo. ADR-014 records this distinction.
**Recommendation:** local private PDF directory on the computer running backend + local MySQL during development/demo. No monthly infrastructure subscription, but no always-online hosted link and team must handle safe backup. R2 10GB-month free (overage can bill), Supabase Storage 1GB free (usage caps) are **optional future** choices; no connectors/services provisioned.
**Docs:** `docs/STORAGE_COST_REVIEW.md`, DECISIONS ADR-014, SRS NFR-08, TASK_BOARD AN-09, CURRENT_STATE, SESSION_LOG.
**GitHub scope:** update existing Draft PR #6 only, **no new PR**, no source/schema/hosting/credentials change. CI check is docs/build/syntax only; PDF E2E/security tests NOT RUN.
**Next product question:** classroom/local demo versus a continuously accessible public online deployment, since this determines infrastructure need. Confirm actual budget/provider only when needed. Update current-state and CI evidence after publication if possible.

## SESSION-20261018-AN-10 — Instructor-accessible public online deployment requirement
**Human A explicitly confirmed:** the Mini Study Network website must be reachable via a public online link at arbitrary times, independent of student's laptop. Local-only demo does not satisfy final delivery. **Decision ADR-015 CONFIRMED**. Cost minimization ADR-014 remains.
**Provider choice:** NONE approved; zero subscription is only target, not an uptime SLA. AI researched official Vercel Express/Functions/Blob docs, TiDB Cloud Starter and Sequelize compatibility, Render Free sleep/disk and Oracle Always Free VM.
**Candidate for DEP-01 PoC:** Vercel Hobby React+Express Function; TiDB Starter MySQL-compatible for Sequelize v6 with integration tests; Vercel Blob Private for 10 MiB direct client uploads. Vercel Function payload **4.5 MB** prohibits server-proxied 10 MiB PDF. Auth token, post-upload server content check, hidden-post denial and streaming required.
**Docs:** ADR-015, NFR-09, docs/ONLINE_DEPLOYMENT_OPTIONS.md, corrected STORAGE_COST_REVIEW, Charter, TASK_BOARD AN-10 DONE/DEP-01 TODO/DEP-02 BLOCKED, MASTER_PLAN, CURRENT_STATE, RISK_REGISTER, DOCUMENT_UPLOAD_SPEC, SESSION_LOG.
**Execution status:** docs-only on existing Draft PR #6. No cloud account, backend deployment, database migration, file service, payment card or local worktree created. DEP-T01..07 tests **NOT RUN**; no source implementation. Human A+Human B must review provider feasibility and PR dependency stack #1→#6 before implementation.
**Next:** publish docs commit to PR #6 and verify exact HEAD/CI; review DEP-01 and establish user-authorized cloud account connections only if needed.

## SESSION-20261018-DEP-01 — Offline source-level feasibility started
**Actor:** AI (GitHub app, public vendor documentation). **Task:** DEP-01 IN_PROGRESS; DEP-01A offline audit prepared and awaiting CI evidence.
**Baseline:** `main` `0993a42154feb37e8842ef8bb3ed4d0a03627889` (last verified); parent scope branch `docs/pdf-upload-limits-20261018` @ `2f6b28052076232dc93e889325a14aac4266dfeb`. New GitHub-only branch `docs/dep01-online-feasibility-20261018` intended Draft PR #7 → PR #6 branch; confirm PR/CI after publishing.
**Source-backed findings:** Express app export supports Function adapter, but `src/index.js` uses `app.listen`; relative frontend `/api` has only development proxy; Sequelize `mysql` not tested on TiDB; refresh_tokens schema missing updated_at while Sequelize timestamps enabled; direct `file_url` and `/uploads` are insecure for private PDF; paid routes mounted; Multer 1.x; Vercel config absent. Vercel 4.5MB Function payload cannot proxy approved 10MiB PDF.
**Artifacts:** `docs/DEP01_FEASIBILITY_AUDIT.md`, `scripts/dep01-readiness.mjs`, `scripts/dep01-readiness.test.mjs`, `scripts/dep01-express-smoke.test.cjs`, new isolated GitHub Actions job `DEP-01 offline Express/source probe (NOT cloud deployment)`. No app source/schema/provider config changes.
**Test truth:** static audit+local Node HTTP smoke to be verified via CI; TiDB integration, Vercel deployed HTTPS, private Blob upload/download, DB/file persistence, online availability tests DEP-A01..06 all **NOT RUN**. Offline test intentionally documents current guest feed 401, which is a failure against approved future guest document-read behavior, not a product acceptance pass.
**Permissions/cost:** no billed services, payment cards, credentials or provider accounts created; user-approved low-cost/online constraints retained. Cloud PoC not authorized by mere research request. Human B review and G0 still pending.
**Next:** publish Draft PR #7, verify CI and update handoff; assess isolated free-tier cloud PoC after human review.

## SESSION-20261018-DEP-01A-CI — Offline Express handler smoke verified
**Draft PR #7:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/7 → `docs/pdf-upload-limits-20261018` (dependency chain #1..#7), no merge.
**Initial commit:** `4c75b2086ea1a8cfa013a769095e8fefa7553db2`. Verified GitHub Actions run https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39141647075: **4/4 jobs PASS**, including new `DEP-01 offline Express/source probe (NOT cloud deployment)`.
**Actual tests:** Node HTTP handler `/api/health` returned 200 and JSON success on localhost without connecting real DB. Guest GET `/api/posts` returned 401 (recognized current defect, NOT desired final guest behavior); static source audit 11 findings, byte-budget assertion 10 MiB > 4.5 MB, audit metadata correctly reports NOT_RUN for hosted checks.
**Not tested:** Vercel deployed HTTPS, TiDB Sequelize integration, private Blob client upload/download, CDN cache and hidden-post access revocation, off-network uptime and persistence, production security hardening. Those **DEP-A01..06 remain NOT RUN**. DEP-01 main task IN_PROGRESS; DEP-01A in REVIEW (Human B to review); G0/G1/G3/G5/G6 not approved.
**Security:** old paid routes/public /uploads still in source, no public app deployment allowed. This follow-up handoff-only commit changes HEAD and requires latest CI verification.

## SESSION-20261018-DEP-01B — Cloud PoC requested; Vercel authorization gate
**Human A explicitly requested:** "PoC cloud cô lập" following DEP-01 offline audit. Authorized **safe isolated feasibility testing**, not paid plans, unapproved scope, legacy API deployment or unrestricted new cloud accounts.
**Vercel connection evidence:** `get_git_deployment_context` returned `teams:[]`; `list_teams` returned `teams:[]`; `list_projects` displayed five historical projects under an existing team, but `get_team` returned HTTP 403 forbidden for mapped Vercel team scope. **Action:** DO NOT create project in alternate personal/team scope to bypass authorization. Proper Vercel plugin team reauthorization needed.
**Scope of PoC code:** `poc/dep01-cloud-isolated/` contains independent zero-dependency static HTML, Node Function GET/HEAD `/api/health`, no app source import, no DB/Blob credentials, no user data, no payment or upload endpoints, safe response metadata, local Node smoke test and Vercel root config.
**CI:** isolated smoke job added to `.github/workflows/ci.yml` — pending real run at publishing. **Cloud:** Vercel HTTPS DEP-A01 NOT RUN, TiDB DEP-A02 NOT RUN, private Blob DEP-A03 NOT RUN. No resource created, no charge incurred. 
**Next:** commit PoC onto existing Draft PR #7 branch, verify 5 jobs; get approved team access; then deploy ONLY `poc/dep01-cloud-isolated` to separate preview under authorized Hobby scope. Never deploy existing backend with P0 SEC-01/03.

## SESSION-20261018-DEP-01B-CI — Standalone cloud probe scaffold verified offline
**Draft PR #7:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/7 targeting `docs/pdf-upload-limits-20261018`.
**Initial scaffold commit:** `3ebee96643b873e726fc1f3c11fe508f2cf8107f`.
**Verified GitHub Actions run:** https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39143252600 — **5/5 PASS**: existing frontend build, backend syntax, project control checks, DEP-01 source/Express offline probe and new standalone cloud scaffold HTTP tests.
**Actual PoC stage:** `poc/dep01-cloud-isolated` standalone health-only Vercel-ready source, **not uploaded/deployed to Vercel**. No credentials, database/blob, student files, vulnerable source imports or payment routes. Stage-A real HTTPS DEP-A01 **BLOCKED ACCESS (403)** due team permission; TiDB DEP-A02 and Blob DEP-A03 **NOT RUN**.
**Cost / security:** 0 new cloud resources and 0 new subscriptions. Existing Vercel team's ID not accessible through connector; reauthorization required, not account switching. No production/main changes. DEP-01B in REVIEW for Human B, NOT formally DONE. Cloud PoC as a whole remains IN_PROGRESS.
**Next:** verify CI after this log-only commit; ask Human A to reconnect Vercel app with correct authorized team or grant team membership; then inspect Hobby plan and deploy preview only from isolated root. Do not deploy existing CNPM backend until SEC-01/03/04 resolved.

## SESSION-20261019-DEP-A01-USER-BROWSER — Isolated PoC externally rendered
**Observed:** Vercel account `hunny-17` plan Hobby, authorized personal PoC project created successfully after earlier team discovery/403 uncertainty. Project `prj_YZzSucZKTjpzzghzVBFmZf02ZY21`, deployment `dpl_Umv7RsTsnEycnxyKXzQsrbLRrwtq` Vercel API **READY**. Alias https://mini-study-network-dep01.vercel.app/.
**Evidence from Human A:** uploaded Chrome Incognito screenshot dated 2026-10-19 shows public landing page rendered without login and status `API thử nghiệm: phản hồi thành công`, `Database: NOT_CONNECTED · PDF: NOT_CONNECTED · VNPay: NOT_INCLUDED`. Frontend successfully fetched cloud /api/health (code checks 2xx and marker fields). This proves user-browser HTTPS access and handler executed, not full outside-network SLA/reliability.
**Deployment caveat:** Vercel returned **production target/alias**, although request specified staging. Because PoC contains only standalone safe health code, no CNPM source/payments/data was exposed. No automatic Git repo deployment link configured.
**Unverified:** independent-network traffic not captured by assistant due DNS/network restrictions; HEAD/POST live HTTP, uptime, redeploy persistence, TiDB/Sequelize compatibility DEP-A02, Blob Private PDF DEP-A03, auth & admin rules and payment hard-deny still NOT RUN.
**Task state:** DEP-01 IN_PROGRESS, DEP-A01 REVIEW (observed browser success), stage proof not full G6 acceptance. Record in DEP01_LIVE_EVIDENCE and refresh PR #7. Do not touch main or merge stacked PRs without human review.
**Next:** verify HTTPS from a different device/network, inspect Vercel protection without weakening other projects, then design isolated TiDB Starter test after explicit account/zero-spend approval.

## SESSION-20261019-OPS-07 — Reproducible Ubuntu local development
**Actor:** Human A requested running project on Ubuntu. AI prepared GitHub-only branch `chore/ubuntu-dev-setup-20261019` stacked from DEP-01 Draft PR #7 at `10b92d3c304bfd4c96427d03b09b6dc70f5ee45b`.
**Scope:** Ubuntu 24.04 LTS local dev (Node 24, MySQL 8, Vite/React+Express), no Docker prerequisite. Add `docs/UBUNTU_SETUP.md`, `scripts/ubuntu/{doctor,setup}.sh`, `scripts/ubuntu/mysql-integration.test.cjs`; CI Ubuntu 24.04 runner + MySQL 8 Docker service with fresh schema and backend integration tests.
**Model/schema parity:** fresh bootstrap schema adds `updated_at` to `likes` and `refresh_tokens` to match Sequelize; these changes do **not** migrate existing DBs. `DB_AUTO_SYNC=false` suppresses `sync({alter:true})` when the fresh SQL is imported on Ubuntu local development (other development behavior unchanged).
**Security boundaries:** local 127.0.0.1 only; no live document binary upload, no payment calls or public server exposure; old paid routes/static uploads still present. Never treat Ubuntu setup smoke as full security, online deployment or product E2E PASS.
**Execution:** source/CI branch prepared; no human laptop, WSL installation or Ubuntu machine controlled by assistant. Initial CI status must be verified from GitHub before reporting PASS.
**Next:** publish PR #8 targeting PR #7 branch, verify CI and provide user commands for own Ubuntu; tests after source review/human signoff.

## SESSION-20261019-OPS-07-CI — Ubuntu MySQL integration and JWT refresh uniqueness fix
**Draft PR #8:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/8 → `docs/dep01-online-feasibility-20261018` (stacked after Draft PRs #1–#7).
**Initial CI:** first Ubuntu/MySQL 8 job FAIL: `POST /api/auth/refresh` returned 409 duplicate `refresh_tokens.token` when register/login happened within the same JWT second. The preexisting `generateTokens` method used identical payload and timestamp, so login and registration could issue identical refresh tokens. Failure is an **application bug revealed on real MySQL 8**, not Ubuntu incompatibility.
**Fix commit:** `01077636e162a84fc9293ba4f40947facdc05b3c`: refresh JWT signed with unique crypto.randomUUID() `jti`; added assertions registration/login tokens differ and refresh rotation issues a different token and rejects reuse.
**Verified GitHub Actions:** https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39288366164 — **6/6 PASS**, including Ubuntu 24.04 + MySQL 8 service and backend register/login/refresh/post integration test, all existing jobs. GitHub Actions MySQL is disposable with CI-only test secret and fake users, no external cloud/storage/payment data.
**Model/schema:** fresh-install database/schema.sql adds timestamps needed for likes and refresh_tokens; existing real DBs require reviewed migration/backup. Opt-out `DB_AUTO_SYNC=false` prevents dev schema auto-alter. No production DB touched, no user computer accessed.
**Docs/scripts:** `docs/UBUNTU_SETUP.md`, `scripts/ubuntu/doctor.sh` and `setup.sh` now available in PR #8. Setup scripts don't create DB or modify existing .env; user must run on own Ubuntu (local machine test NOT RUN).
**Next:** verify CI on handoff/documentation follow-up commit; let Human A/Human B review/merge dependency PRs before main, and get user Ubuntu command outputs without credentials. Paid routes, exposed uploads and PDF permission still P0 and cannot deploy real backend publicly.

## SESSION-20261020-WBS-UNASSIGNED — Two-track exhaustive task/dependency draft
**User request:** list every bounded work package, dependent vs parallel work, operating instructions, documents, coordination, QA and handoff to support **two future human workers**. **Explicit user constraint: NO ONE HAS CHOSEN WORK STREAM/OWNER YET.**
**Branch:** `docs/two-track-wbs-unassigned-20261020` branched from PR #8 HEAD `f4a4c8627da1367dd2ed7a72141124a5cd337046`. Docs-only; no source/API/DB or payment changes.
**Deliverables:** `docs/TEAM_WBS_UNASSIGNED.md` (16 optional A packages + 19 optional B packages + 8 shared G gates = 43, dependency map/conditions/acceptance) and `docs/TEAM_WORK_RULES_UNASSIGNED.md` (module pair handoffs, contract/DTO/DB freeze, file-level boundaries, CI, QA, docs, report, selection later). `TEAM_WORKFLOW.md` updated to retract any implicit allocation from older example; README index updated.
**Critical invariant:** No owner assigned, no deadlines or SRS/approval fabricated, no change to canonical `TASK_BOARD.md` owner/status. Human A/Human B selection remains future joint action. AI remains support, not a third person. Existing Ubuntu and Vercel verification remains as observed, no new runtime tests.
**Next:** Create Draft PR to #8, verify docs/CI, ask both humans to review WBS/effort balance before assigning any owner.

## SESSION-20261020-CORE-BACKEND-HANDOFF — Role-level choice and readiness assessment
**Human decision:** Human A (user) explicitly chose Core Backend for self and described teammate taking remaining FE/design work. Human B has not provided independent task-by-task acceptance; keep those work packages PROPOSED. WBS stream labels A/B are NOT Human A/Human B.
**Source audit:** GitHub main unchanged at 0993a421; Draft PR #1→#9 stacked, no merge. User local evidence WSL Ubuntu26.04/MySQL8.4/7 tables/health200/Vite UI. No new access to user's terminal, so no local E2E claims. Existing payment/orders/raw uploads still P0; Multer outdated; PostDetail/Profile stubs and inactive feed UI remain.
**Workstream:** `docs/core-backend-handoff-20261020`, based on PR #9 latest c421caa6. Deliverable `docs/CORE_BACKEND_TEAM_HANDOFF_20261020.md`: 10 Core Backend packages, 12 teammate packages, readiness P01–P07, exact file ownership, data contract handoff, test/deploy gates. This is planning, no backend/DB/frontend source modification, no credentials read or shared.
**Canonical board status:** no task set to IN_PROGRESS/DONE. Task Board owner preamble clarified only; Human B must confirm work packages before assigned owner rows edited.
**Next:** Draft PR to #9; CI verify exact HEAD, share with teammate and get acceptance. Then review/merge PR stack and freeze API contract for first modules.

## SESSION-20261020-GITHUB-TEAM-SPRINT01 — User requested shared branches and task allocation
**User instruction:** proceed GitHub organization and first task allocation for 2 people. **Role decision:** Human A Core Backend; Human B planned FE/Design, specific task acceptance pending. User WSL completed real Auth/Post 7/7 smoke + SQL persisted post ID1. Human A git worktree clean on Ubuntu setup branch, no local source edited by assistant.
**GitHub:** remote main `0993a421...`, PR #1→#10 Draft stacked, PR #10 HEAD `b840f16...` 6/6 CI PASS. Created remote shared preview branch `integration/team-dev-20261020` from that exact commit WITHOUT merge/reset/force. Eight issue backlogs #11..#18: #11 G03 contract, #12 SEC-03, #13 SEC-01, #14 QA-01; #15 FE-01, #16 FE-04, #17 AN/DS, #18 shared setup. Issues have no GitHub assignee; Human B acceptance pending.
**Sprint doc:** `docs/ops/TEAM_SPRINT01_20261020.md` including exact CLI, file boundaries, PR base, dependencies, known blockers, Definition of Done. Board status and owner cells unchanged; linked issues as evidence only. No changes to feature code, database, local env or cloud. Next humans to fetch and branch; CI on latest integration head to be checked. No merge to main before two-human review.

## SESSION-20261021-G03-CONTRACT — Issue #11 candidate before PDF security
**Authorization/scope:** user requested API Contract v1 first, then #13 only after both-human acceptance. Read #11/#13 and empty discussions, #20/#21 current metadata, source and policy docs; no existing contract branch/PR found. Created dedicated `docs/api-contract-v1-20261021` from fetched integration `dffe5ae41f14983a5cad2c77a0e465726a3cbbcc`; main `0993a421` unchanged. Local worktree verified at normalized `work/CNPM-MXH-SV`; prior QA checkout was clean, no member changes overwritten.
**Deliverable:** expanded canonical `docs/API_CONTRACT.md` as DRAFT v0.1 candidate for v1, with 13 Auth/Post/Profile endpoints, as-is DTO/errors/permissions, explicitly separate missing approved behavior and proposed SafePost/visibility choices, compatibility gaps, existing FR/test mapping and R1..R5 two-human checklist. `docs/fixtures/api-contract-v1.json` contains 22 synthetic examples; tokens/passwords are inert mock placeholders. DS-03 REVIEW, both approvals PENDING. Only contract/mock and four standard control handoff files changed; no new duplicate report/issue/test registry.
**Validation:** `node scripts/check-project-control.mjs` PASS; temporary offline fixture validator PASS (22 examples, 13/13 actual source routes, envelope/status, SafePost types/allowlist, pagination, pending approvals and contract links); `git diff --check` PASS. Validator is workspace scratch, not product code. No API/DB/Frontend runtime checks rerun for docs. Existing #20/#21 CI and WSL PASS evidence retained with exact heads/run links; not attributed to this candidate's proposed behavior. Remote docs/PR head and CI are published in the Issue #11 / PR handoff rather than a self-referential SHA here.
**Dependency/gate:** #20 at `8a4a3b6` Draft/unmerged; #21 at `96d6efc` Draft/unmerged, stacked on #20. Docs base still mounts legacy payments; contract records branch distinction. **#13 NOT STARTED**, no server/static/DTO change before both humans accept the same contract revision. Prefer reviewed #20 merge before #13 app.js work; otherwise select explicit dependency branch/one editor or wait. No automatic merge/retarget/force-push, no ADR-002 expansion, no schema/env/cloud changes.
**Next:** publish documentation-only Draft PR for #11; Human A and Human B review/accept exact revision and resolve R1..R5. Issue #11 is not DONE, #13 remains gated; no repeated manual WSL/reinstall checkpoint requested.

## SESSION-20261021-DEP01-HTTPS-PREFLIGHT — Cloud feasibility refresh; no deployment
**Actor:** AI via GitHub and read-only Vercel connector; task DEP-01. **Base:** integration/team-dev-20261020 @ 7bbe302623191d5f28e967424ae529df307a13e7, main untouched. **Branch:** docs/dep01-public-https-readiness-20261021, remote-only; local worktree NOT VERIFIED.
**Read-only Vercel evidence:** project mini-study-network-dep01 (prj_YZzSucZKTjpzzghzVBFmZf02ZY21), dpl_Umv7RsTsnEycnxyKXzQsrbLRrwtq READY health-only; not an application deployment. Source audit covered current React /api dev-only proxy, 10 MiB Express upload/private disk, Sequelize/MySQL TLS, SPA deep routes and migration. New docs/DEP01_PUBLIC_HTTPS_READINESS_20261021.md compares persistent long-running API/volume vs serverless direct Blob upload vs self-managed VM; provides preflight and user-gated provider/spending decisions. Official hosting quotas reviewed with dated vendor docs; no cloud resource, credential, code deploy or paid subscription created.
**QA dependency:** Draft PR #30 current commit 31a5467 at inspection had 7/7 success Actions 39592227079 and new expired-Blob token refresh test; zero independent human approvals. Review comment on PR #30 calls out stale report evidence and weak local test DB guard. DEP-01 prep is independent and cannot claim QA-03 human acceptance or public app readiness. Next: docs CI and Draft PR, both-human review, host/cost decision.
