# FE-01 Post Detail + Comments/Replies + Likes

Implementation on a dedicated branch based on integration/team-dev-20261020. Source scope: client/src/pages/posts/PostDetailPage.jsx only; no backend, SQL, API wrapper, or Render deployment changes.

Post Detail: question and discussion detail via postAPI.getById; loading, invalid id, 403, 404, guest login prompt, document redirect, unavailable/hidden state, metadata and safe text rendering.

Comments: top-level comments and one-level replies via commentAPI.getByPost/create/delete. Forms reject empty content and limit UI input to 2000 characters. Owner or admin sees delete button, API remains authorization authority; query refetch/invalidation and toast feedback after mutation.

Likes: post and comment counts from likeAPI.count, toggle from likeAPI.toggle with known liked value only after mutation, refetching server counts. The current API does NOT expose the viewer's saved liked state at initial load, so the UI labels initial state as unknown. Adding a viewerLiked endpoint needs backend contract review; no guessed persisted heart state.

Remaining backend risks: comment endpoint does not deeply validate parent/post/status and like endpoint does not validate target visibility. These are separate security hardening tasks, not claimed fixed here. Browser and build evidence: [CI run 39822074901](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39822074901) on implementation HEAD 20622577013d7f6ab7e443bddaafa7faa373b400 **7/7 SUCCESS**; old E2E01 12/12 checks PASS, and new FE01 Chromium 10/10 cases PASS.

Do not merge into main or auto-deployed Render branch without Human A/B review.

## Browser E2E regression coverage

The isolated MySQL 8 + Chromium GitHub Actions job now runs FE-01 after the existing PDF regression. The FE-01 browser runner checks registration, real Post Detail, Like/Unlike count, comments, one-level replies, comment Like, Student B unauthorized delete (403), Student A reply delete, guest login-gate and missing-post 404. It rejects production/cloud DBs and removes its own fixture records. Actual job verdict must be captured from CI after this commit; source additions alone are NOT a PASS.

## Test outcome — 2026-10-23 ~00:24 ICT

- GitHub Actions [39822074901](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39822074901): **7/7 jobs PASS** on exact code commit `2062257`.
- FE01 browser checks 10/10 PASS: register in React, question post detail, post like/unlike, root comment, one-level reply, comment like, cross-user DELETE 403, reply delete+UI refresh, guest login-gate, missing post 404.
- Earlier source-only/CI runs at `fc905da` and `063342b` failed due to **test harness errors only** (Sequelize module resolved from client, and reading an HTTP response body twice). Both were corrected; the third run above passed completely. Historical failures retained in CI.
- Environment: disposable CI MySQL 8, Vite/React/Chromium, Express local HTTP. **NOT DEPLOYED to current Render/TiDB**. Responsive visual/manual QA and Human A/B review NOT RUN.
- Remaining backend contract gap: Like status is unknown on initial load because GET /likes/count omits viewer-liked state. Do not label initial toggle as known.
