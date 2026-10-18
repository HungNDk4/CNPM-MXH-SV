# CURRENT STATE — Read this before taking action
**As-of:** 2026-10-18 (snapshot from linked GitHub evidence at creation; verify real-time refs when starting). **Approval status:** DRAFT / awaiting two-member review.

## Project and people
- Repo: https://github.com/HungNDk4/CNPM-MXH-SV, default branch `main`.
- Human team count: **2**. Human A is the user's analysis/design reviewer role; Human B is the second teammate; precise work assignments not confirmed.
- AI may research, draft, code and create PRs, but cannot claim human approval.
- Selected idea: Mini Study Network. **Human A confirmed Option B on 2026-10-17**: social learning + free documents are MVP; paid documents/VNPay Sandbox are DEFERRED. See docs/MVP_SCOPE.md. Details still DRAFT.

## GitHub state recorded at bootstrap
- `main` HEAD confirmed: `0993a42154feb37e8842ef8bb3ed4d0a03627889`.
- Foundation branch: `chore/project-foundation-20261017`, head `87eb985e023f77935edd49916ca7655346ff83eb`; **Draft PR #1** → main; CI build/syntax PASS for that commit.
- This control-system workstream: `docs/session-worktree-control-20261017`, **based on foundation branch**, **Draft PR #2** → `chore/project-foundation-20261017` (dependent/stacked). Initial commit `3f4a018c3c40f34d348276c41156f459df96dca8` has GitHub CI PASS (3 jobs); latest HEAD changes as follow-up log is committed. HEAD changes after commit; use GitHub not this dated snapshot.
- Scope branch: `docs/mvp-scope-option-b-20261017`, based on control branch @ `8c0b28ec025516cb98fe240fb9497020ac9822f0`, **Draft PR #3** → `docs/session-worktree-control-20261017`, CI initial scope commit PASS. Check latest HEAD/CI online.
- No local Git worktrees have been created/verified by this GitHub-only workflow.

## Phase and gate snapshot
- Active: P0 Foundation & control-system docs. AN-00 **DONE** (Human A's limited Option B scope decision), but G0/G1 not yet approved. OPS-02 in REVIEW; OPS-03 in REVIEW, both awaiting human approval.
- G0 **NOT YET APPROVED**. Requirements/design documents are DRAFT. No verified business E2E MySQL/Sandbox tests.
- Known P0: posts feed leaks paid file URL; payment return/IPN risk double credit; paid static file exposure. **These endpoints are NOT disabled by the scope decision:** SEC-03 must deny them before MVP demo.
- Product decision DOC-01 confirmed by Human A 2026-10-17: **direct PDF upload**, size limit appropriate but not specified. Technical spec DRAFT, SEC-04 Multer review required. Scope branch: `docs/pdf-upload-scope-20261017` based on option-B branch, **Draft PR #4** → option-B branch; initial commit `4aafba2a` CI 3 jobs PASS (https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39051750751); verify latest HEAD.
- ADR-011 CONFIRMED by Human A 2026-10-18: guest may list/search/view active free-PDF metadata; **login required to download file bytes**, enforced backend 401. Source not updated; policy in docs/DOCUMENT_ACCESS_POLICY.md; branch `docs/guest-metadata-auth-download-20261018` **Draft PR #5** → PDF docs branch. Initial docs commit `ab311190` CI all three jobs PASS (https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39052464467); verify final HEAD.
- **ADR-012 CONFIRMED by Human A 2026-10-18:** 10 MiB (10,485,760 bytes) max **inclusive** and exactly 1 uploaded PDF per document post. Source still unmodified; new branch `docs/pdf-upload-limits-20261018` based on PR #5 docs branch, **Draft PR #6** → PR #5 branch. Initial commit `c15e59b1` CI PASS (https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39137384913); verify final HEAD separately. T-UP-LIM-01..06 NOT RUN.
- **ADR-013 approved by Human A on 2026-10-18:** after successful PDF validation + protected storage + DB commit, publish as `active` immediately (no Admin preapproval). Admin can hide/delete later, and hidden/deleted file bytes must be unavailable via direct download. Same **Draft PR #6** contains this docs follow-up, commit `19cd787c` CI 3 jobs PASS (https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39138720270). Tests T-PUBLISH-01..06 **NOT RUN**; report/appeal flow OPEN.
- Known P1: guest GET feed blocked; PostDetail/Profile pages stub; SQL/Sequelize drift, no integration tests.

## NEXT_SESSION_ACTIONS — Follow this order
1. Inspect GitHub `main` and stacked Draft PRs #1 through #5. Compare HEAD and CI; do not assume this snapshot remains current.
2. Read `PROJECT_CONTROL.md`, `docs/ops/TASK_BOARD.md`, `docs/ops/SESSION_LOG.md`, `docs/ops/WORKTREE_REGISTRY.md`.
3. Human A/Human B review stacked Draft PRs **#1 → #2 → #3 → #4 → #5 → #6**; payment scope Option B already chosen by Human A, remaining SRS and G0/G1 not approved. Do not merge without review.
4. **DOC-01/ADR-011/ADR-012 CONFIRMED:** direct PDF upload; guest metadata public; login required for PDF download; **max 10 MiB (10,485,760 bytes inclusive), exactly 1 PDF per document post.** ADR-013 CONFIRMED by Human A: publish valid PDF immediately after successful checks, storage and DB commit; Admin may hide/delete afterward. NEXT: decide durable PDF storage/retention and whether report/appeal UX belongs to MVP. Do not re-ask approved rules.
5. Once foundation merged and G0 accepted, start AN-01 (actors and SRS) and AN-02 on dedicated analysis branch.
6. Before MVP demo, implement and negative-test **SEC-03 server-side paid-flow shutdown** and **SEC-01 paid URL protection**. SEC-02 full payment fix deferred.
7. At end of each session update TASK_BOARD, CURRENT_STATE, SESSION_LOG and registry if branch/worktree changed. Use `SESSION_HANDOFF_TEMPLATE.md`.

## Last verified tests
- Foundation PR commit `87eb985e`: GitHub Actions **Frontend production build PASS** and **Backend JavaScript syntax PASS** (Node 24).
- Planning PR initial commit `3f4a018c` GitHub Actions run https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39049674352: **three jobs PASS** (frontend build, backend syntax, docs integrity). Check latest follow-up commit CI separately.
- Scope PR #3 initial commit `07a72f9c`: GitHub Actions https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39051123916 **3 jobs PASS**; this is docs/build/syntax only. Re-check final HEAD after log update.
- ADR-011 PR #5 initial commit `ab311190`: https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39052464467 **3 jobs PASS** (frontend build/backend syntax/docs checks). Follow-up handoff commit CI must be verified separately.
- ADR-012 PR #6 initial commit `c15e59b1`: https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39137384913 **3 jobs PASS** (frontend build, backend syntax, docs integrity); recheck CI if HEAD advances.
- PDF upload boundary tests T-UP-LIM-01..06, PDF access tests T-DOCFREE-01..06, MySQL integration, E2E, sandbox, pen-test: **NOT RUN**.

## Operational warning
This is a snapshot, not the source of truth for task status or branch state. Do not create worktrees, claim local paths, update payments, or modify main without specific verified context.
