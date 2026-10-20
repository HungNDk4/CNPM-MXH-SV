# WORKTREE REGISTRY — branch ownership, not proof of local folders
As of 2026-10-17. This registry lists **logical streams**. A GitHub remote branch is not a physically created worktree on either member's PC.

| Worktree ID | Owner | Branch | PR / base | Local path verified? | State | Notes |
|---|---|---|---|---|---|---|
| WT-BASE | AI | chore/project-foundation-20261017 | PR #1 → main | NO (GitHub-only) | REVIEW | Current foundation CI PASS |
| WT-OPS | AI | docs/session-worktree-control-20261017 | Draft PR #2 → chore/project-foundation-20261017 | NO (GitHub-only) | REVIEW | Initial control docs CI PASS; human review pending |
| WT-SCOPE | AI | docs/mvp-scope-option-b-20261017 | Draft PR #3 → docs/session-worktree-control-20261017 | NO (GitHub-only) | REVIEW | Human A confirmed Option B only; docs & build/syntax initial CI PASS |
| WT-PDF | AI | docs/pdf-upload-scope-20261017 | **Draft PR #4** → docs/mvp-scope-option-b-20261017 | NO (GitHub-only) | REVIEW | Direct PDF product decision confirmed; initial 3 CI checks PASS; details DRAFT |
| WT-ACCESS | AI | docs/guest-metadata-auth-download-20261018 | **Draft PR #5** → docs/pdf-upload-scope-20261017 | NO (GitHub-only) | REVIEW | ADR-011 approved; initial CI 3 jobs PASS, detailed SRS and runtime QA pending |
| WT-LIMITS | AI | docs/pdf-upload-limits-20261018 | **Draft PR #6** → docs/guest-metadata-auth-download-20261018 | NO (GitHub-only) | REVIEW | ADR-012 approved; initial 3-job CI PASS; runtime tests NOT RUN |
| WT-DEP01 | AI | docs/dep01-online-feasibility-20261018 | **Draft PR #7** → docs/pdf-upload-limits-20261018 | NO (GitHub-only) | REVIEW | 5/5 GitHub Actions PASS initial scaffold commit 3ebee966, Vercel 403 blocks HTTPS live stage, no local worktree |
| WT-UBUNTU | AI | chore/ubuntu-dev-setup-20261019 | **Draft PR #8** → docs/dep01-online-feasibility-20261018 | NO (GitHub-only) | REVIEW | Ubuntu 24.04 + MySQL 8 CI PASS 6/6 at fix commit 01077636, human laptop NOT TESTED, no physical worktree |
| WT-ANALYSIS | UNASSIGNED | Not created | Base reviewed main after merge | NO | PLANNED | Requirements/UC/ERD session |
| WT-DEV | UNASSIGNED | Not created | Base reviewed main after merge | NO | PLANNED | Independently scoped coding |
| WT-WBS | AI (docs drafting only; human work unassigned) | docs/two-track-wbs-unassigned-20261020 | Draft PR #9 → chore/ubuntu-dev-setup-20261019 (#8) | NO (GitHub-only) | REVIEW | WBS A/B/G are options, not assignments; source and task board owners unchanged |
| WT-HANDOFF | AI docs drafting; Human A chose BE role, Human B task acceptance pending | docs/core-backend-handoff-20261020 | Draft PR forthcoming → docs/two-track-wbs-unassigned-20261020 (#9) | NO (GitHub-only) | REVIEW | Role-level handoff, no source/DB changes, no per-task owner claim |
| WT-QA | Unassigned | Not created | Base reviewed main after merge | NO | OPTIONAL | Integration/regression tests |

## Fields required when confirming a real local worktree
- Worktree ID, owner, machine alias (optional), **local path** (relative/sanitized), branch, base/head SHA, current PR, lock/dirty status, timestamp checked.
- Verify with `git worktree list --porcelain`, `git -C <path> branch --show-current`, `git -C <path> status --short` and `git -C <path> rev-parse HEAD`.
- Do NOT commit absolute private Windows paths, secrets or computer usernames into this registry; use normalized relative folder examples or machine aliases.

## Operations protocol
- Register branch creation/update in SESSION_LOG; update this table only after evidence.
- If a worktree is removed, set state RETIRED, date and final commit/PR instead of deleting the audit trail.
- AI with only GitHub connector may record REMOTE BRANCH VERIFIED; must set local path to NO/UNKNOWN.
