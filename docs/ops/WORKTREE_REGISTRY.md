# WORKTREE REGISTRY — branch ownership, not proof of local folders
## Active 2026-11-10 logical ownership (remote-only, no local worktree confirmed)

The older rows below preserve historical branch snapshots and **do not** authorize new writes. Source baseline `integration/team-dev-20261020` @ `955bee98c91f` is shared/read-only for new task branches; `main` is stale. See [HUNNY17_NEXT_WORK_PLAN_20261110.md](HUNNY17_NEXT_WORK_PLAN_20261110.md) and [WORKTREE_PLAYBOOK.md](WORKTREE_PLAYBOOK.md).

| Worktree ID | Owner | Branch | PR / base | Local path verified? | State | Notes |
|---|---|---|---|---|---|---|
| WT-H17-PLAN-20261110 | Hunny-17 / AI docs support | docs/hunny17-resume-worktree-20261110 | Draft docs PR → integration @ 955bee98c91f | **NO** (GitHub connector only) | REMOTE DOCS / REVIEW | One coherent plan/control update; no runtime or local worktree claim |
| WT-HND-PR86 | HungNDk4 (existing PR author) | feat/post-management-admin-analytics-20261103 | Open PR #86 → integration; head f8c9625da21 | **UNKNOWN** | OPEN / OWNER LOCK | Mixed client/server/database changes; Hunny-17 review only, do not push or edit |
| WT-H17-PR88 | Hunny-17 (review fix author); PR #86 original owner remains HungNDk4 | fix/pr86-review-ui-gates-20261110 | **Draft stacked PR #88** → PR #86 branch, head 1f565543b830a17c6e3b5e27cddd3f48a4e56b54 | **NO** (remote only) | REVIEW / CI PENDING | Only three UI files and new read-only cloud preflight note; requires original author to review before integration |
| WT-H17-UX01 | Hunny-17 (proposed) | **NOT CREATED** | Future issue #80; after #86 disposition | **NO** | BLOCKED | Proposed `fix/ux01-my-posts-api`; no placeholder branch |
| WT-H17-ADM02 | Hunny-17 (proposed) | **NOT CREATED** | Future issue #79 after contract approval | **NO** | PLANNED | Proposed `feat/adm02-account-moderation-api`; no placeholder branch |
| WT-H17-CLOUD | Both humans + Hunny-17 (review proposed) | **NOT CREATED** | Issues #75/#78/#32; cloud preflight read-only first | **NO** | BLOCKED | No Render/TiDB operation authorized |

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
| WT-SHARED-PREVIEW | G02 shared integration baseline (not owned as task by one human) | integration/team-dev-20261020 | From PR #10 b840f16; #1–#10 still Draft, no main merge | NO (remote-only) | PREVIEW | Shared branch for one-task/one-PR work; never use it as feature editing branch |
| WT-QA | Unassigned | Not created | Base reviewed main after merge | NO | OPTIONAL | Integration/regression tests |
| WT-CONTRACT | Codex drafts for Human A; Human A + Human B review pending | docs/api-contract-v1-20261021 | Issue #11 docs PR -> integration/team-dev-20261020 at dffe5ae | YES, this session: work/CNPM-MXH-SV; branch/HEAD/status/worktree verified | REVIEW | Dedicated contract branch; doc/mocks/control handoff only, no product changes. Published SHA/PR in Issue #11. Not member B's checkout or proof of approval. |

| WT-E2E01 | AI (QA-03; Human A review) | test/e2e01-fullstack-20261021 | Draft PR #30 → integration/team-dev-20261020 | Canonical remote verified; separate local scratch audit verified | REVIEW | Browser/full-stack test on disposable CI MySQL 8; 12 checkpoints PASS at 31a5467, local teammate worktree unverified, no cloud. |


### 2026-11-10 — canonical file edit lock (reviewed scope; do not overwrite existing PRs)

| Scope / exact file groups | Active exclusive writer or lock | Hunny-17 allowed action now | Unlock condition |
|---|---|---|---|
| `feat/post-management-admin-analytics-20261103`, PR #86: existing `client/**`, `server/**`, `database/**`, `docs/ops/SESSION_LOG.md` changed in its diff | **HungNDk4**, current PR author | **READ/REVIEW only** on original branch, no direct push or rewrite | Author accepts focused PR #88, preserves history, PR #86 reviewed and merged |
| `client/src/pages/admin/AdminPostsPage.jsx`, `client/src/pages/settings/SettingsPage.jsx`, `client/src/pages/notifications/NotificationsPage.jsx` review changes | **Hunny-17** on separate Draft stacked PR #88 only | Code only on `fix/pr86-review-ui-gates-20261110`, targeted 3-file remediation | HungNDk4 reviews patch and merges into #86; do not edit parent PR directly |
| `docs/ops/PR86_REMEDIATION_CLOUD_PREFLIGHT_20261110.md` | Hunny-17, same PR #88 | Read-only GitHub-evidence report, no Render/TiDB write | Attach approved operator evidence in a separate release decision |
| `docs/ops/HUNNY17_NEXT_WORK_PLAN_20261110.md`, `WORKTREE_REGISTRY.md`, `WORKTREE_PLAYBOOK.md`, `TASK_BOARD.md`, `CURRENT_STATE.md`, `SESSION_LOG.md` | **Hunny-17** on Draft PR #87; `SESSION_LOG.md` shared with #86 | Docs updates on PR #87 only; **append** history and retain both branches' entries during merge | Two human reviewers approve, explicit merge order; never overwrite existing log |
| `server/src/controllers/post.controller.js`, `server/src/routes/post.routes.js`, `server/src/models/index.js` / related backend for BE-11 | **LOCKED by open PR #86** | Do not create/push BE-11 code branch; prepare API contract for Issue #80 only | #86 patch reviewed and integrated; recheck exact source SHA before branch |
| `server/src/app.js`, `server/src/routes/admin.routes.js`, `server/src/models/index.js`, auth/session/models for ADM-02 | **LOCKED by open PR #86** | Design Issue #79, **do not** mutate these until approved baseline | #86 merge + ADM-02 contract and reviewer approval |
| `database/schema.sql`, `database/migrations/*` | **LOCKED by PR #86 / cloud operator release gates** | No unilateral migration, schema update, destructive SQL or TiDB write | Separate migration review, backup, operator acceptance |
| `.github/workflows/ci.yml`, shared `client/src/services/api.js` | **Single editor by each PR handoff** | Review only until author/coordinator confirms exclusive editor | Explicit file handoff + CI in same approved PR |
| Render/TiDB/Vercel Blob live configuration and datasets | **Authorized human cloud operator**, not Git branch owner | Read-only preparation, never tokens/secret disclosure | Explicit workspace, read-only access, schema/backup and release approval |

**Authority boundaries:** user direction confirms Hunny-17's role and these no-overlap locks for this workflow, but does **not** count as HungNDk4 accepting #88 or as independent human PR sign-off. A remote branch is not a physical worktree; all local paths/dirty statuses are UNKNOWN until checked on the owner's machine. No placeholder implementation branch while source lock is active.

## Fields required when confirming a real local worktree
- Worktree ID, owner, machine alias (optional), **local path** (relative/sanitized), branch, base/head SHA, current PR, lock/dirty status, timestamp checked.
- Verify with `git worktree list --porcelain`, `git -C <path> branch --show-current`, `git -C <path> status --short` and `git -C <path> rev-parse HEAD`.
- Do NOT commit absolute private Windows paths, secrets or computer usernames into this registry; use normalized relative folder examples or machine aliases.

## Operations protocol
- Register branch creation/update in SESSION_LOG; update this table only after evidence.
- If a worktree is removed, set state RETIRED, date and final commit/PR instead of deleting the audit trail.
- AI with only GitHub connector may record REMOTE BRANCH VERIFIED; must set local path to NO/UNKNOWN.

E2E-01 local audit note: scratch/e2e01-local-audit-20261021 at f4e4096 is a clean, unpublished local checkpoint under work/CNPM-MXH-SV. It does not mirror canonical remote test/e2e01-fullstack-20261021 and was not merged/pushed. Native MySQL backend tests passed locally; frontend build/browser remained ACL-blocked. See canonical integration report section 6. No new member-owned worktree was created.
