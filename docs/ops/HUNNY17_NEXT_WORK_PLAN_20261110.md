> **2026-11-10 live update:** PR #88 and #86 have been merged in order into integration `928928047f83`. BE-12 ADM-02 Issue #79 has source in [Draft PR #89](https://github.com/HungNDk4/CNPM-MXH-SV/pull/89) @ `b79799f066` with **9/9 GitHub CI PASS**, peer review pending. Render is still on PoC `71499dfd`, not integration. The operator has created TiDB QA branch `qa-acceptance` + CRUD SQL user `hung_qa`; second laptop connection pending. Historical text below claiming #86 open or BE-12 no branch describes the plan at creation time, not current truth. No cloud DDL/deploy.

# Hunny-17 — Continuation plan & worktree/codebase agreement (2026-11-10)

Status: **PROPOSED FOR HUMAN REVIEW** (docs/source audit only). Owner at role level: **Hunny-17, Core Backend / Security / DB / API / integration QA**. Other teammate **HungNDk4** currently owns PR #86. No assignment or human approval is inferred from issue authorship. See [TASK_BOARD.md](TASK_BOARD.md) for live lane statuses.

## 0. Verified baseline and non-claims

- Repository: `HungNDk4/CNPM-MXH-SV`; default `main` = `0993a42154feb37e8842ef8bb3ed4d0a03627889` (older than integration). **Never create new implementation work from old main by default.**
- Reviewed source baseline (at plan creation): `integration/team-dev-20261020` = `955bee98c91ffa5b3f068891ba31912b3102d86a`, containing merged PRs #77, #82, #84, #85. Confirm current SHA again before each session.
- Other member's **open, unmerged** PR #86: `feat/post-management-admin-analytics-20261103` = `f8c9625da21a9ba28bc444e2740901f1cd1176bc`. Its current Actions run #41909832513 reports success, **not** sufficient to approve Cloud/real DB deployment or all new suites. PR #86 changes shared `client/`, `server/`, `database/`, not just UI.
- Source-complete is different from PR-merged, CI-PASS, Cloud-PASS and human-approved DONE. No private production data, cloud service, teammate's worktree, or main branch was changed to create this plan.
- Existing documentation (particularly historical 2026-10-17/21 statuses) may be stale. Prefer latest remote refs, PRs and exact-SHA Actions over dated snippets.

## 1. Dependency-ordered work packages

| Gate / board ID | Priority | Scope, concrete outputs | Dependency and acceptance |
|---|---|---|---|
| G0 / OPS-08 | P0 | Reconcile branches, owner/PR/file matrix, reserve exclusive task worktrees; record source truth and plan. **No runtime code.** | Docs PR review; no overlapping source writes. |
| G1 / QA-06 | P0 | Independently review #86's Backend/API/DB/security and test coverage; confirm report, my-post and admin audit contract before deciding merge order. | #86 owned by HungNDk4; review findings to author; CI at exact HEAD + appropriate DB/browser tests; human review required. |
| G2 / OPS-09 | P0 | Cloud preflight for #75/#78/#32; verify Render actual deployment branch, TiDB schema, optional audit reason column, backups, Blob Private; controlled release of reviewed candidate; Auth/PDF/Admin live smoke. | **BLOCKED** until cloud access, migration/backup, owner approval. Use PR #85 integration as source baseline, not unapproved #86. No automatic deploy. |
| G3 / BE-11 | P1 | Complete #80 only after #86 review: authenticated **owner-only paginated** my-posts backend contract, >50 posts and cross-user tests; coordinate separate frontend change. Feedback form must not claim success without persistence; either disable honestly or scope a reviewed endpoint. | #86 has `/my-posts` and `GET /api/posts/my-stats`, but page uses public `/posts?author_id=...`; do not duplicate existing stats/UI. Distinct approved backend PR. |
| G4 / QA-07 | P1/P2 | Review and accept #81 report workflow already in PR #86: migration, post_reports uniqueness, concurrent admin action, append-only moderation audit/rollback, role guards, Chromium and MySQL8 test evidence. | Do not reimplement report endpoints or UI; close issue only after merged+reviewed evidence, separately from cloud. |
| G5 / BE-12 | P1 | Design and build #79 ADM-02 account moderation **only after API/schema review**: admin list/filter, lock/unlock reason, append-only audit, revoke active sessions, deny inactive JWT, prevent self/last-admin lock, concurrency rollback. | Separate backend branch/PR; MySQL8 role, race and negative tests; frontend teammate owns UI on separate PR after contract freeze. No arbitrary role promotion/hard delete. |
| G6 / DOCS-04 | P1 | Reconcile stale #15–18, old Draft PRs, API/DB/UC docs, report evidence and clean demo handoff; do not close solely because code exists. | Owners/reviewers verify links+SHA+CI and actual demo. |

**Safe scheduling:** perform G0 → G1 before authoring BE-11/BE-12. G2 read-only preparation can run separately but never trigger deploy or SQL without approval. G3/G4 depend on disposition of #86. G5 does not share active PR #86 files. G6 is last. No invented calendar deadline.

## 2. Known specific review checkpoints for PR #86 (not yet accepted bugs)

1. `client/src/pages/admin/AdminPostsPage.jsx` invokes `adminAPI.moderatePost(postId,status)` without a UI-supplied reason; align with #82/#84 reviewed audited-reason user journey. Do not silently change old backward-compatible API contract.
2. `client/src/pages/settings/SettingsPage.jsx` feedback handler shows a success toast without an actual request; stop simulated success pending scope decision.
3. `client/src/pages/posts/MyPostsPage.jsx` uses `GET /posts?author_id=...` (active-only list), not dedicated private owner-only pagination; do not duplicate existing `my-stats` endpoint.
4. `client/src/pages/notifications/NotificationsPage.jsx` fetches `page:1,limit:30` only; pagination is still a distinct UI improvement.
5. `server/src/controllers/report.controller.js` already implements report create/queue/transactional review; verify consistency with audited moderation and real concurrency/rollback, not a duplicate implementation.
6. New `post_images`, `post_reports`, avatar/image filesystem handling in PR #86 need a **release/persistence plan** for ephemeral Render filesystem. Private PDF Blob adapter in #85 does not automatically cover images.
7. Existing CI on #86 does not directly list the new `server/tests/post-reports.test.cjs` and `server/tests/avatar-upload.test.cjs` suites; confirm actual test execution/evidence before accepting their cases. No redundant new test framework.

## 3. Worktree & code ownership — effective agreement for new work

**Remote-only verification:** the GitHub branch is NOT a created local worktree; neither person's current local `git status` or filesystem was accessed here.

- Keep `integration/team-dev-20261020` as **shared, read-only development base**, not a feature editing branch; never commit to `main`.
- Use a **single existing primary clone** and at most **one sibling worktree per active task**. Do not create new clones/worktrees on every chat/session; reuse the verified clean worktree for the *same* task. Worktrees must be outside the repository root.
- Plan/docs owner: `docs/hunny17-resume-worktree-20261110` (this remote-only docs PR). No local path registered; do not confuse GitHub PR with local workspace.
- HungNDk4 owns `feat/post-management-admin-analytics-20261103` (PR #86). **Never checkout it as a write target or push changes into it for Hunny-17.** Review via GitHub or a read-only local checkout after coordination.
- Hunny-17: future isolated branches (not created yet) `fix/ux01-my-posts-api`, `feat/adm02-account-moderation-api`, and a dedicated review/docs branch if needed. Create them only when current task is approved and file locks checked. Do **not** create placeholder branches for the backlog.
- Default ownership: Hunny-17 `server/**`, `database/**` and focused related test code **only when not touched by another open PR**; HungNDk4 `client/**` for current #86. Shared `client/src/services/api.js`, `server/src/app.js`, models, `.github/workflows/ci.yml`, `docs/ops/**`, `database/schema.sql`: **one nominated editor per change**, with explicit handoff/merge order. Review does not grant edit permission.
- If #86 touches a backend file proposed for Hunny-17: mark task BLOCKED, ask #86 author to fix there or first merge/rebase; do not cherry-pick or implement parallel overlapping changes without accepted plan.
- Canonical Git practices: one issue/work package → one branch → one PR; **one cohesive reviewed commit when feasible** (not micro-commits for each edit; fix-up commits only for meaningful review/test issues); stage selected paths, never blindly `git add .`; no forced push, auto-merge, premature squash or merge without approval.

### Windows PowerShell preflight (run locally; NOT executed in this GitHub-only session)

```powershell
git fetch origin
git status --short
git branch --show-current
git rev-parse HEAD
git worktree list --porcelain
git diff --name-only origin/integration/team-dev-20261020...HEAD
```

If dirty or checked out elsewhere: **STOP and inspect**. Do not use `git reset --hard`, `git clean -fdx`, `git worktree remove --force`, `git push --force` or delete someone else's files to manufacture a clean state.

**After ownership + baseline approved, example for ADM-02 only** (sibling folder; do not execute until file overlap gate passes):

```powershell
git fetch origin
git worktree add -b feat/adm02-account-moderation-api ../CNPM-MXH-SV-wt-adm02 origin/integration/team-dev-20261020
git -C ../CNPM-MXH-SV-wt-adm02 status --short
git -C ../CNPM-MXH-SV-wt-adm02 branch --show-current
git -C ../CNPM-MXH-SV-wt-adm02 rev-parse HEAD
```

Never claim that the above example has run. Existing local branches/worktrees must be inspected before reusing the branch name. The actual local path stays PRIVATE and is registered only after evidence.

## 4. No-trash / no-duplication controls

- Reuse existing `client/`, `server/`, `database/`, `scripts/`, `docs/` layout; no `server-v2`, `client-new`, duplicated routes/controllers, second auth/storage implementation or copied dependency trees just to experiment.
- Do not commit `node_modules/`, `dist/`, `build/`, `.env*`, logs, temporary SQL dumps, uploads, private PDFs, real personal data, preview screenshots or ephemeral CI output. Honor existing `.gitignore`; add targeted rules only when an actual new generated artifact demands it.
- Use disposable MySQL8 fixture DB for integration and existing E2E suites; don't seed/reset real TiDB. Avoid duplicate runners/workflow jobs, unrelated refactors, mass formatting, unapproved schema edits.
- `git status --short`, `git diff --check`, `git diff --stat` and `git diff --cached --name-only` before committing; explicitly stage intended files only. Review ignored/untracked artifacts without bulk deleting them. Never delete tracked files simply because they look obsolete.
- Retire completed worktrees **only** when clean, pushed, merged/reviewed and owner authorizes; verify with `git worktree list --porcelain`, then normal `git worktree remove <path>` (no `--force`). Keep historical registry trace instead of erasing it.

## 5. Definition of Done & handoff

For each slice: read current SHA/issues/PRs, ownership lock, approved scope and FR/API/DB boundary → implement only intended files → targeted syntax/build/MySQL8 security regression → exact-HEAD CI → independent human review → controlled integration merge → post-merge CI. Cloud acceptance is a distinct gate. Track **SOURCE VERIFIED / TESTED PASS / NOT RUN / BLOCKED / REVIEW / DONE** honestly.

End session by updating [TASK_BOARD.md](TASK_BOARD.md), [CURRENT_STATE.md](CURRENT_STATE.md), [WORKTREE_REGISTRY.md](WORKTREE_REGISTRY.md), [SESSION_LOG.md](SESSION_LOG.md): task ID, branch, commit SHA, PR, file manifest, tests, blocker, reviewer and next step. Never mark a teammate's approval or local worktree as verified without evidence.
