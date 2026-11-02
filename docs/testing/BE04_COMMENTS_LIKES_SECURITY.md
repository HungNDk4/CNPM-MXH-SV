# BE-04 — Comments/Likes target-state and ownership backend hardening

**Issue:** [#37](https://github.com/HungNDk4/CNPM-MXH-SV/issues/37) — Core Backend only.
**Base:** `integration/team-dev-20261020` HEAD `f5c974b3` (no merge).
**Scope:** `server/src/routes/{comment,like}.routes.js`, narrow get/edit status guard in `server/src/controllers/post.controller.js`, shared backend-only `server/src/utils/interaction-target.js`, and dedicated MySQL HTTP regression scripts. No React, migrations, `.github/workflows/ci.yml`, DEP cloud branch, token or live database changes.

## Policy and API observations
- Positive safe-integer IDs required. Invalid identifiers 422; missing post/target 404; missing post_id query 400.
- Only `active`, free posts are interactable. Hidden, deleted or legacy paid posts are 404 on detail/comments/likes for both guests and users. Question/discussion still requires authentication (401), consistent with existing product behavior. Active free document comment/count metadata may be public, but private PDF bytes stay protected by the unrelated download route.
- Root comments must be string content 1..2000 chars after trim. Reply parent must exist, be active, belong to the *same post* and be a root. Delete comments requires active parent post, active comment, and owner/admin. Deleted parent replies cannot be liked or revealed via direct target IDs.
- Like toggle and count validate target status, comment status and parent before counting/toggling. No new user-liked-state endpoint; FE-01 contract remains unchanged.
- Non-admin owners can edit normal active post content, **cannot mutate status**, and cannot edit/reactivate hidden/deleted content. Admin retains existing ability to moderate status except resurrecting deleted post via generic edit.
- Preserves SafePost DTO; no new public fields or database migrations.

## Regression evidence
`scripts/ubuntu/be04-interactions-regression.cjs` is spawned as a **separate Node process** from the existing `scripts/ubuntu/pdf-security.test.cjs` during the already configured Ubuntu 24.04 + MySQL 8 isolated CI job. No CI workflow edits. Exercises live in-process Express HTTP, two disposable student accounts, direct MySQL state assertions and cleanup by existing user cascade:
- Active/free post and document comment + Like happy paths, existing FE-01 Like/Comment envelopes.
- Guest/non-owner 401/403 and moderation/paid/hidden/deleted 404.
- IDs, malformed payload, 2,001 chars, missing/mismatched/deleted/nested parent 422.
- Owner deletes reply/root, cross-user DELETE 403, no orphan inserts.
- Existing likes on moderated posts remain retained internally but are hidden from read/write endpoints.
- Render/TiDB/Vercel Blob, browser-on-physical-device and public deployment **NOT RUN**; no secrets or production credentials used.

**Implementation and CI verdict (2026-10-23):** [GitHub Actions #39832123033](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39832123033) **7/7 jobs SUCCESS** on source commit `41de3566528b84ec66c7ea682cdf1629905141ba`. Real disposable Ubuntu MySQL8 BE-04 **7/7 test groups PASS**, SEC-01 **17/17 PASS**, Auth/Ownership **15/15 PASS**, baseline Chromium E2E PDF PASS. This does not represent real Render/TiDB cloud testing or review approval.

**Operational note:** Old `GET /api/posts/:id` excluded `deleted` but exposed hidden non-document detail. Fixed with `status===active` and `price===0`. No generalized post search/profile/payment changes.

## First CI diagnostic (corrective test-harness isolation)

[CI run 39831024684](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39831024684) reached **BE04 five groups PASS** then returned 429 due to Express' existing global rate limit (100 calls per 15 minutes), counting original SEC-01 requests plus new BE-04 assertions. This is a test-harness false-negative and does **not** justify disabling/throttling the production app. Fix: spawn a **fresh local Express process and separate in-memory limiter** for BE04, still using the disposable CI MySQL8. Focused test stays below 100 requests per process, and app.js / workflow untouched. Latest CI must prove this fix; do not mark it PASS early.

## Final regression and non-overlap checkpoint

1. [First CI 39831024684](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39831024684): rate-limit 429 after five BE04 groups due to sharing SEC01 limiter in same Node process; application rate-limit unchanged.
2. [Second CI 39831694116](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39831694116): BE04 7/7 PASS, but baseline Chromium PDF E2E caught owner `PUT /api/posts/:id {status:'hidden'}` denied by overstrict BE04 guard (403 instead of previously supported 200).
3. **Corrected code `41de356` [third CI 39832123033](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39832123033): 7/7 SUCCESS.** Active post owners may one-way change their status to `hidden` or `deleted`, but cannot update or reactivate an already hidden/deleted post. Existing PDF E2E 12 cases completed; new BE04 safety checks remain green.

**Scope/overlap audit:** PR #33 contains deploy/PDF/CI config, PR #36 contains frontend/CI config; this BE04 PR only modifies `server/src/routes/comment.routes.js`, `server/src/routes/like.routes.js`, `server/src/controllers/post.controller.js`, new `server/src/utils/interaction-target.js`, `scripts/ubuntu/pdf-security.test.cjs`, new BE04 test helper and this scoped report. No `client/**`, `.github/workflows/**`, `server/src/app.js`, migration, or infra changes. Draft PR #38 targets integration; it has not been merged or deployed. Note that FE01 Chromium-specific tests in PR #36 are on a separate unmerged branch and therefore were **not** executed by PR #38's E2E job; FE01 API request/response envelopes remain unchanged, but cross-PR combined QA must run after integration.
