# PROJECT CONTROL — Mini Study Network
**Read-first index for every new human/AI session.** Last documentation update: 2026-10-17. Status: DRAFT until reviewed by both team members.

> Do not begin from old chat history. Start here, then confirm remote branch/PR HEAD with GitHub.

## Quick start (read in order)
1. [docs/ops/CURRENT_STATE.md](docs/ops/CURRENT_STATE.md) — what is true now; immediate next steps; blockers.
2. [docs/ops/TASK_BOARD.md](docs/ops/TASK_BOARD.md) — canonical work item statuses, owners and dependencies.
3. [docs/ops/WORKTREE_REGISTRY.md](docs/ops/WORKTREE_REGISTRY.md) — logical branch/worktree ownership; local paths verified separately.
4. [docs/ops/SESSION_LOG.md](docs/ops/SESSION_LOG.md) — append-only progress/evidence.
5. [docs/ops/SESSION_START.md](docs/ops/SESSION_START.md) — mandatory checks and exact resume prompt.
6. [docs/ops/MASTER_PLAN.md](docs/ops/MASTER_PLAN.md) — phases, deliverables, acceptance gates.
7. [docs/ops/CHANGE_CONTROL.md](docs/ops/CHANGE_CONTROL.md) — update and sign-off rules.

## Existing technical sources
- [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md) — branch/AI guardrails.
- [docs/TEAM_WORKFLOW.md](docs/TEAM_WORKFLOW.md) — 2-person + AI working model.
- [docs/SRS.md](docs/SRS.md), [docs/REQUIREMENTS_TRACEABILITY.md](docs/REQUIREMENTS_TRACEABILITY.md).
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/DATA_MODEL.md](docs/DATA_MODEL.md), [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
- [docs/TECH_STACK_PLAYBOOK.md](docs/TECH_STACK_PLAYBOOK.md), [docs/AI_SKILLS_PLAYBOOK.md](docs/AI_SKILLS_PLAYBOOK.md).
- [docs/TEST_PLAN.md](docs/TEST_PLAN.md), [docs/DECISIONS.md](docs/DECISIONS.md).

## Status model / truth hierarchy
- **GitHub refs/PR/CI** prove repo state; never infer HEAD from a dated note.
- **TASK_BOARD.md** = single source for task status, owner, dependency and linked PR.
- **CURRENT_STATE.md** = concise snapshot derived from board + verified GitHub refs; update whenever board changes materially.
- **SESSION_LOG.md** = append-only evidence of actions. Never rewrite earlier history to pretend a result happened.
- **DECISIONS.md** = requirements decisions; PROPOSED is not APPROVED.
- Files under `docs/ops/` are committed; local `git worktree` directories remain machine-specific.

## Definition of terms
`SOURCE_VERIFIED`: inspected actual files/refs. `CI_PASS`: job succeeded. `QA_PASS`: test executed and evidence recorded. `PROPOSED`: draft, not authorized for implementation if business-changing. `BLOCKED`: cannot proceed safely.

## End-of-session invariant
Before stopping: update TASK_BOARD, CURRENT_STATE, SESSION_LOG, WORKTREE_REGISTRY if changed, and the PR/handoff with exact branch/commit/tests. Keep one commit per coherent ops update. If the worktree is uncommitted, say so explicitly: **handoff is NOT available to other sessions until pushed**.
