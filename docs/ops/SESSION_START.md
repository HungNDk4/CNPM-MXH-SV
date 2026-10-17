# START HERE — New Session / Fresh AI Context
**Purpose:** an AI or teammate can resume without re-reading an old chat. This file is operational instruction, not a demand to change main.

## Mandatory read order (first 5 minutes)
1. `PROJECT_CONTROL.md`
2. `docs/ops/CURRENT_STATE.md`
3. `docs/ops/TASK_BOARD.md`
4. `docs/ops/SESSION_LOG.md` (last entry first)
5. `docs/ops/WORKTREE_REGISTRY.md`
6. For planned work: MASTER_PLAN, SRS, DECISIONS, TECH_STACK_PLAYBOOK, relevant source.
Time reference means order of attention, not a promised execution duration.

## Before every write
- Use repo `HungNDk4/CNPM-MXH-SV`; get current HEAD of `main` and active branch; list open PRs/conflicts; compare to log.
- If local runtime: print `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git worktree list --porcelain`.
- If GitHub-only: state **LOCAL WORKTREE UNVERIFIED**. Do not claim access to member's disk.
- Select ONE task ID from TASK_BOARD, read FR/UC/design/acceptance, confirm no simultaneous conflicting PR.
- Confirm branch policy: no direct writes to main, no force push, no auto merge. Current main may not yet include ops docs due stacked Draft PRs.

## Session execution rule
`Inspect → choose task → research/source check → plan/acceptance → implement/docs on own branch → verify → commit/PR → handoff log.`
Each output claims only what evidence proves. No fabricated tests, approvals, external decisions, or deadlines.

## Required end-of-session packet
Copy and fill [SESSION_HANDOFF_TEMPLATE.md](SESSION_HANDOFF_TEMPLATE.md); update TASK_BOARD and CURRENT_STATE on any material change; append evidence to SESSION_LOG; update WORKTREE_REGISTRY when new branches/worktrees created.
If changes exist only locally/only in chat, mark `NOT PUSHED / NOT RESUMABLE`.

## Safe resume prompt for a new AI session
```text
CONTINUE CNPM-MXH-SV FROM REPO STATE, NOT FROM CHAT MEMORY.
Repo: HungNDk4/CNPM-MXH-SV.
Read PROJECT_CONTROL.md → docs/ops/CURRENT_STATE.md → TASK_BOARD.md → SESSION_LOG.md → WORKTREE_REGISTRY.md → SESSION_START.md → relevant SRS/DECISIONS/TECH_STACK_PLAYBOOK.
First fetch current main/branches/PRs/CI; do not assume notes are up-to-date.
Identify next READY task and task ID, worktree/branch ownership, dependencies and acceptance; report brief snapshot.
Use a dedicated branch and PR, no direct main writes, no auto merge/force push, no secrets.
Before ending, update task/status/current snapshot/session log/registry and provide exact SHA, PR, tests PASS/FAIL/NOT RUN, blockers and next step.
If GitHub-only, never claim local worktree exists. Do not change features outside approved scope.
```
