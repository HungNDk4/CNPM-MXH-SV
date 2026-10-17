# WORKTREE REGISTRY — branch ownership, not proof of local folders
As of 2026-10-17. This registry lists **logical streams**. A GitHub remote branch is not a physically created worktree on either member's PC.

| Worktree ID | Owner | Branch | PR / base | Local path verified? | State | Notes |
|---|---|---|---|---|---|---|
| WT-BASE | AI | chore/project-foundation-20261017 | PR #1 → main | NO (GitHub-only) | REVIEW | Current foundation CI PASS |
| WT-OPS | AI | docs/session-worktree-control-20261017 | Draft PR #2 → chore/project-foundation-20261017 | NO (GitHub-only) | REVIEW | Initial control docs CI PASS; human review pending |
| WT-ANALYSIS | Human A (proposed) | Not created | Base reviewed main after merge | NO | PLANNED | Requirements/UC/ERD session |
| WT-DEV | Human B (proposed) | Not created | Base reviewed main after merge | NO | PLANNED | Independently scoped coding |
| WT-QA | Unassigned | Not created | Base reviewed main after merge | NO | OPTIONAL | Integration/regression tests |

## Fields required when confirming a real local worktree
- Worktree ID, owner, machine alias (optional), **local path** (relative/sanitized), branch, base/head SHA, current PR, lock/dirty status, timestamp checked.
- Verify with `git worktree list --porcelain`, `git -C <path> branch --show-current`, `git -C <path> status --short` and `git -C <path> rev-parse HEAD`.
- Do NOT commit absolute private Windows paths, secrets or computer usernames into this registry; use normalized relative folder examples or machine aliases.

## Operations protocol
- Register branch creation/update in SESSION_LOG; update this table only after evidence.
- If a worktree is removed, set state RETIRED, date and final commit/PR instead of deleting the audit trail.
- AI with only GitHub connector may record REMOTE BRANCH VERIFIED; must set local path to NO/UNKNOWN.
