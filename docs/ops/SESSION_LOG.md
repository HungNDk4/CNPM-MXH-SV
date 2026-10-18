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
