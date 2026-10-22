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
`scripts/ubuntu/be04-interactions-regression.cjs` runs from **existing** `scripts/ubuntu/pdf-security.test.cjs` during the already configured Ubuntu 24.04 + MySQL 8 isolated CI job. No CI workflow edits. Exercises live in-process Express HTTP, two disposable student accounts, direct MySQL state assertions and cleanup by existing user cascade:
- Active/free post and document comment + Like happy paths, existing FE-01 Like/Comment envelopes.
- Guest/non-owner 401/403 and moderation/paid/hidden/deleted 404.
- IDs, malformed payload, 2,001 chars, missing/mismatched/deleted/nested parent 422.
- Owner deletes reply/root, cross-user DELETE 403, no orphan inserts.
- Existing likes on moderated posts remain retained internally but are hidden from read/write endpoints.
- Render/TiDB/Vercel Blob, browser-on-physical-device and public deployment **NOT RUN**; no secrets or production credentials used.

**Implementation and CI verdict:** pending exact new PR GitHub Actions results. No claim of PASS before completion.

**Operational note:** Old `GET /api/posts/:id` excluded `deleted` but exposed hidden non-document detail. Fixed with `status===active` and `price===0`. No generalized post search/profile/payment changes.
