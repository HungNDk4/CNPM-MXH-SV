# CURRENT STATE — Read this before taking action
**As-of:** 2026-10-17 (snapshot from linked GitHub evidence at creation; verify real-time refs when starting). **Approval status:** DRAFT / awaiting two-member review.

## Project and people
- Repo: https://github.com/HungNDk4/CNPM-MXH-SV, default branch `main`.
- Human team count: **2**. Human A is the user's analysis/design reviewer role; Human B is the second teammate; precise work assignments not confirmed.
- AI may research, draft, code and create PRs, but cannot claim human approval.
- Selected idea: Mini Study Network, student learning social network, free documents, optional paid documents VNPay Sandbox only.

## GitHub state recorded at bootstrap
- `main` HEAD confirmed: `0993a42154feb37e8842ef8bb3ed4d0a03627889`.
- Foundation branch: `chore/project-foundation-20261017`, head `87eb985e023f77935edd49916ca7655346ff83eb`; **Draft PR #1** → main; CI build/syntax PASS for that commit.
- This control-system workstream: `docs/session-worktree-control-20261017`, **based on foundation branch**, intended for Draft PR → `chore/project-foundation-20261017` (stacked). See PR link/status in SESSION_LOG once published. HEAD changes after commit; use GitHub not this dated snapshot.
- No local Git worktrees have been created/verified by this GitHub-only workflow.

## Phase and gate snapshot
- Active: P0 Foundation & control-system docs. OPS-02 in REVIEW; OPS-03 IN_PROGRESS pending this PR and CI.
- G0 **NOT YET APPROVED**. Requirements/design documents are DRAFT. No verified business E2E MySQL/Sandbox tests.
- Known P0: GET posts leaks paid file URL; VNPay return/IPN risk double seller credit; paid file static exposure.
- Known P1: guest GET feed blocked; PostDetail/Profile pages stub; SQL/Sequelize drift, no integration tests.

## NEXT_SESSION_ACTIONS — Follow this order
1. Inspect GitHub `main`, PR #1 and the documentation-control PR (if published). Compare HEAD and CI; do not assume this snapshot remains current.
2. Read `PROJECT_CONTROL.md`, `docs/ops/TASK_BOARD.md`, `docs/ops/SESSION_LOG.md`, `docs/ops/WORKTREE_REGISTRY.md`.
3. Human A + Human B review the two PRs, agree core scope/paid documents status, approve or request changes. Do not merge without approval.
4. Once foundation merged and G0 accepted: create a dedicated analysis branch/worktree, start AN-01 (actors/requirements) and AN-02 (FR/NFR) with source-backed documentation.
5. Before enabling payments/paid downloads, establish SEC-01/SEC-02 tests and patch security behavior in separate PRs.
6. At end of each session update TASK_BOARD, CURRENT_STATE, SESSION_LOG and registry if branch/worktree changed. Use `SESSION_HANDOFF_TEMPLATE.md`.

## Last verified tests
- Foundation PR commit `87eb985e`: GitHub Actions **Frontend production build PASS** and **Backend JavaScript syntax PASS** (Node 24).
- This planning PR: check latest run in GitHub; do not mark PASS until run completes.
- MySQL integration, E2E, sandbox, pen-test: **NOT RUN**.

## Operational warning
This is a snapshot, not the source of truth for task status or branch state. Do not create worktrees, claim local paths, update payments, or modify main without specific verified context.
