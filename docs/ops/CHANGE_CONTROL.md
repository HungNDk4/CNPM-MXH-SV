# Change Control & Review Contract
**Status:** DRAFT (2026-10-17) for a 2-member human team. No delegated AI approval.

## Sources of truth: exact update ownership
| File | Responsibility | Update trigger |
|---|---|---|
| PROJECT_CONTROL.md | Stable read-first navigation | Changes to file locations/procedure |
| docs/ops/MASTER_PLAN.md | Phase intent, WBS, acceptance gates | New scope, gate definitions, dependencies (requires human review) |
| docs/ops/TASK_BOARD.md | **Only canonical task statuses**, assignments, blockers | Start/stop/review/complete any task |
| docs/ops/CURRENT_STATE.md | Compressed session snapshot and next steps | Any material board/PR/blocker change |
| docs/ops/WORKTREE_REGISTRY.md | Logical branch/worktree owners | Branch created/changed/retired; local path only if verified |
| docs/ops/SESSION_LOG.md | Append-only evidence/history | Every session handoff, commit, test, PR |
| docs/DECISIONS.md | Business/architecture decisions, human approver | Scope/business changes, DB/security choice |
| docs/SRS.md and traceability | Feature requirements→UC→test | Requirement approval/change |
| docs/TEST_PLAN.md | Tests and evidence conventions | Acceptance added/changed, QA completed |

## Standard session transaction
1. **PRE-FLIGHT:** inspect GitHub refs/PR/CI; locally check worktree/dirty status if connected. Name task ID, branch, owner and acceptance.
2. **DESIGN:** read SRS+contracts, research exact version, note unanswered questions. Proposed decisions stay PROPOSED.
3. **EXECUTE:** change only owned files on a task branch. Review diff before committing.
4. **VERIFY:** run appropriate syntax/build/tests; logs show actual PASS/FAIL/SKIP/NOT RUN; do not convert build PASS into runtime QA PASS.
5. **COMMIT:** push feature branch and Draft PR. If operating docs/handoff on same branch, append session record, update board and snapshot before final push.
6. **HANDOFF:** provide SHA, PR URLs, base, tests, blockers and next exact task; verify GitHub actually has the commit.
7. **REVIEW:** human reviewers approve/request changes. AI can prepare a proposed revision but never self-approve.

## Status transitions and reviews
- `TODO → IN_PROGRESS`: owner accepted and branch claimed.
- `IN_PROGRESS → REVIEW`: deliverables committed/pushed with enough evidence, Draft PR permitted.
- `REVIEW → DONE`: documented human review and appropriate tests; if pending merge, don't claim integrated DONE.
- `BLOCKED`: record precise reason and unblock condition.
- `DEFERRED`: explicit scope deferral; don't silently drop P0 issues.

## Commit/PR and versioning
- Use Conventional Commits: `docs(analysis): ...`, `feat(posts): ...`, `fix(payment): ...`.
- Put **single task ID** in PR description; one bounded problem per PR.
- Document versions are `DRAFT v0.x` and `APPROVED v1.x` after human sign-off, with date & approver. Do not claim approvals from chat absent explicit review.
- For migrations/payment/private files require additional threat review and negative tests.
- Avoid merging PR #2 (this ops branch) before its foundation PR #1 unless reviewed and the dependency resolved deliberately.

## Gate decision record (plain text)
```text
Gate: G?
Date:
Evidence (links + commits):
Reviewer Human A:
Reviewer Human B:
Outcome: APPROVED | REJECTED | BLOCKED
Conditions:
```

## Recovery protocol
When snapshot and remote state conflict: remote GitHub refs are authoritative, inspect diff, append a CORRECTION to log, update snapshot/board; never overwrite teammate work to match a stale note.
If a worktree is dirty: do not reset/clean/rebase/force without checking its owner. New session may create a separate clean worktree for independent tasks.
