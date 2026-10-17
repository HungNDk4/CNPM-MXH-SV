# CURRENT STATE — Read this before taking action
**As-of:** 2026-10-17 (snapshot from linked GitHub evidence at creation; verify real-time refs when starting). **Approval status:** DRAFT / awaiting two-member review.

## Project and people
- Repo: https://github.com/HungNDk4/CNPM-MXH-SV, default branch `main`.
- Human team count: **2**. Human A is the user's analysis/design reviewer role; Human B is the second teammate; precise work assignments not confirmed.
- AI may research, draft, code and create PRs, but cannot claim human approval.
- Selected idea: Mini Study Network. **Human A confirmed Option B on 2026-10-17**: social learning + free documents are MVP; paid documents/VNPay Sandbox are DEFERRED. See docs/MVP_SCOPE.md. Details still DRAFT.

## GitHub state recorded at bootstrap
- `main` HEAD confirmed: `0993a42154feb37e8842ef8bb3ed4d0a03627889`.
- Foundation branch: `chore/project-foundation-20261017`, head `87eb985e023f77935edd49916ca7655346ff83eb`; **Draft PR #1** → main; CI build/syntax PASS for that commit.
- This control-system workstream: `docs/session-worktree-control-20261017`, **based on foundation branch**, **Draft PR #2** → `chore/project-foundation-20261017` (dependent/stacked). Initial commit `3f4a018c3c40f34d348276c41156f459df96dca8` has GitHub CI PASS (3 jobs); latest HEAD changes as follow-up log is committed. HEAD changes after commit; use GitHub not this dated snapshot.
- Scope branch: `docs/mvp-scope-option-b-20261017`, based on control branch @ `8c0b28ec025516cb98fe240fb9497020ac9822f0`, proposed PR → `docs/session-worktree-control-20261017` (confirm PR/current HEAD online).
- No local Git worktrees have been created/verified by this GitHub-only workflow.

## Phase and gate snapshot
- Active: P0 Foundation & control-system docs. AN-00 **DONE** (Human A's limited Option B scope decision), but G0/G1 not yet approved. OPS-02 in REVIEW; OPS-03 in REVIEW, both awaiting human approval.
- G0 **NOT YET APPROVED**. Requirements/design documents are DRAFT. No verified business E2E MySQL/Sandbox tests.
- Known P0: posts feed leaks paid file URL; payment return/IPN risk double credit; paid static file exposure. **These endpoints are NOT disabled by the scope decision:** SEC-03 must deny them before MVP demo.
- Known P1: guest GET feed blocked; PostDetail/Profile pages stub; SQL/Sequelize drift, no integration tests.

## NEXT_SESSION_ACTIONS — Follow this order
1. Inspect GitHub `main`, PR #1 and Draft PR #2. Compare HEAD and CI; do not assume this snapshot remains current.
2. Read `PROJECT_CONTROL.md`, `docs/ops/TASK_BOARD.md`, `docs/ops/SESSION_LOG.md`, `docs/ops/WORKTREE_REGISTRY.md`.
3. Human A/Human B review stacked PRs #1/#2/#3 (once #3 published); payment scope Option B already chosen by Human A, remaining SRS and G0/G1 not approved. Do not merge without review.
4. **NEXT PRODUCT QUESTION: DOC-01** — free document external links, website uploads, or both? Record answer before designing file flow.
5. Once foundation merged and G0 accepted, start AN-01 (actors and SRS) and AN-02 on dedicated analysis branch.
6. Before MVP demo, implement and negative-test **SEC-03 server-side paid-flow shutdown** and **SEC-01 paid URL protection**. SEC-02 full payment fix deferred.
7. At end of each session update TASK_BOARD, CURRENT_STATE, SESSION_LOG and registry if branch/worktree changed. Use `SESSION_HANDOFF_TEMPLATE.md`.

## Last verified tests
- Foundation PR commit `87eb985e`: GitHub Actions **Frontend production build PASS** and **Backend JavaScript syntax PASS** (Node 24).
- Planning PR initial commit `3f4a018c` GitHub Actions run https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39049674352: **three jobs PASS** (frontend build, backend syntax, docs integrity). Check latest follow-up commit CI separately.
- MySQL integration, E2E, sandbox, pen-test: **NOT RUN**.

## Operational warning
This is a snapshot, not the source of truth for task status or branch state. Do not create worktrees, claim local paths, update payments, or modify main without specific verified context.
