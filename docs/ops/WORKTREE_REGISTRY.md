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
| WT-SHARED-PREVIEW | G02 shared integration baseline (not owned as task by one human) | integration/team-dev-20261020 | From PR #10 b840f16; #1–#10 still Draft, no main merge | NO (remote-only) | PREVIEW | Shared branch for one-task/one-PR work; never use it as feature editing branch |
| WT-QA | Unassigned | Not created | Base reviewed main after merge | NO | OPTIONAL | Integration/regression tests |
| WT-CONTRACT | Codex drafts for Human A; Human A + Human B review pending | docs/api-contract-v1-20261021 | Issue #11 docs PR -> integration/team-dev-20261020 at dffe5ae | YES, this session: work/CNPM-MXH-SV; branch/HEAD/status/worktree verified | REVIEW | Dedicated contract branch; doc/mocks/control handoff only, no product changes. Published SHA/PR in Issue #11. Not member B's checkout or proof of approval. |

| WT-E2E01 | AI (QA-03; Human A review) | test/e2e01-fullstack-20261021 | Draft PR #30 → integration/team-dev-20261020 | Canonical remote verified; separate local scratch audit verified | REVIEW | Browser/full-stack test on disposable CI MySQL 8; 12 checkpoints PASS at 31a5467, local teammate worktree unverified, no cloud. |

| WT-DEP01C | AI isolated code / Human A/B review | feat/dep01c-render-tidb-blob-poc-20261022 | Draft PR #33 → integration/team-dev-20261020 | Historical Codex local checkout verified at fa1014b4; **current local state NOT checked by this GitHub-only session** | REVIEW | Remote deployed HEAD `71499dfd63d21feb019d6144efcadc7ee9232951`; Render Free **LIVE**, website and health HTTP 200 observed, TiDB connected + 8-table user evidence. Cloud Blob/auth/security/persistence E2E pending. No main merge. |
| WT-DEP01C-DOCS | AI GitHub-only documentation / Human A/B review | docs/dep01c-live-checkpoint-20261022 | Draft stacked PR → feat/dep01c-render-tidb-blob-poc-20261022 | NO (remote-only, local worktree NOT VERIFIED) | REVIEW | 2026-10-22 progress/runbook/board/test/README updates only; based on deployed `71499dfd63d21feb019d6144efcadc7ee9232951`. Avoid triggering auto-deploy from live source. |

| WT-DEP01C-CLOUD-QA | AI GitHub Actions, Human A review | test/dep01c-cloud-auth-pdf-20261022 | Draft PR #35 → docs/dep01c-live-checkpoint-20261022 (PR #34) | NO local worktree; GitHub-only CI remote | REVIEW | Real HTTP acceptance run [39816112003](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39816112003) PASS AUTH-02 + small PDF-01; synthetic user/private Blob cleanup pending. No Render source push. |

## Fields required when confirming a real local worktree
- Worktree ID, owner, machine alias (optional), **local path** (relative/sanitized), branch, base/head SHA, current PR, lock/dirty status, timestamp checked.
- Verify with `git worktree list --porcelain`, `git -C <path> branch --show-current`, `git -C <path> status --short` and `git -C <path> rev-parse HEAD`.
- Do NOT commit absolute private Windows paths, secrets or computer usernames into this registry; use normalized relative folder examples or machine aliases.

## Operations protocol
- Register branch creation/update in SESSION_LOG; update this table only after evidence.
- If a worktree is removed, set state RETIRED, date and final commit/PR instead of deleting the audit trail.
- AI with only GitHub connector may record REMOTE BRANCH VERIFIED; must set local path to NO/UNKNOWN.

E2E-01 local audit note: scratch/e2e01-local-audit-20261021 at f4e4096 is a clean, unpublished local checkpoint under work/CNPM-MXH-SV. It does not mirror canonical remote test/e2e01-fullstack-20261021 and was not merged/pushed. Native MySQL backend tests passed locally; frontend build/browser remained ACL-blocked. See canonical integration report section 6. No new member-owned worktree was created.

## 2026-10-22 post-OAuth checkout verification
- Existing Windows source checkout inspected, clean at local `b97b5314b3e959e0f397da84d509e1b2c7737501` on the named feature branch; this is **older than remote/deployed `71499dfd`**. No checkout reset, branch move, source edit or local commit performed.
- This session updated existing remote-only docs branch `docs/dep01c-live-checkpoint-20261022` / PR #34 through GitHub tools with a fast-forward lease on `a1cd5660`. No new Git worktree created. Remote docs and source are distinct; do not infer local checkout contains latest docs.
- Post-OAuth live result: auth FAIL, dependent PDF acceptance BLOCKED. [Evidence](../testing/DEP01C_POST_OAUTH_REPORT.md). No Render deploy triggered.
