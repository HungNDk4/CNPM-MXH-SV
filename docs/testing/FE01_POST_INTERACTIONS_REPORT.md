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

## FE-01 reviewer pass — responsive test coverage added (2026-10-23)

- No pre-existing inline reviewers, approvals or issue comments on PR #36 at review start; review findings below were generated from source inspection.
- R1 (UX): MainLayout's long logo + three navbar actions could overflow 320px mobile; mobile uses compact `MSN`, plus symbol for new post, icon-only logout with accessible labels and >=40px buttons. Desktop labels remain.
- R2 (Touch): Reply/Delete comment controls were text-only small hit targets; both now >=40px high with keyboard focus ring. Like toggle is >=40px.
- R3 (Acceptance): New Playwright Chromium responsive matrix 320/375/390/768/1280px, mobile/touch emulation for <=768px and desktop 1280px. Asserts post display, no horizontal page/article overflow, touch target height, 320px guest login gate. Screenshot artifacts stored per CI run, 14-day retention.
- **Proof boundary:** Chromium mobile viewport/touch emulation is *not physical phone/tablet testing*. Safari iOS, physical Android Chrome, soft keyboard and actual hardware screenshots remain NOT RUN pending a real review device with FE-01 preview. Existing live Render still runs older source.

## Source review verdict and device-test boundary — 2026-10-23

**PR review:** No earlier submitted human review / inline comments were present at the time of this review. Source/UX audit found two frontend issues and fixed both in commit `ae206608`: (1) narrow-mobile MainLayout navbar overflow risk; (2) Reply/Delete small touch targets. Tests now also guard against these regressions.

**Automated browser QA:** [GitHub Actions 39824367930](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39824367930) **7/7 jobs PASS**, including FE01 functionality 10/10 and responsive checks at 320/375/390/768/1280px, 320px guest login-gate, document/body/article no horizontal overflow and >=39px tappable controls. [Screenshot artifact](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39824367930/artifacts/12446565680) has five screenshots. Initial screenshots were captured mid-page `fade-in` and appear artificially dim; follow-up screenshot-only test revision disables CSS animations during capture. No user interface visibility bug was concluded from that transient frame.

**Security review blocker — [Issue #37](https://github.com/HungNDk4/CNPM-MXH-SV/issues/37):** Backend comments/likes routes do not consistently enforce active post, parent association, nested depth, content validation or hidden/deleted visibility. A React UI check cannot replace API authorization. FE01 frontend review may proceed, **public promotion must wait for separately reviewed backend validation**. Initial viewer-like state also still requires a read-only authenticated API contract if full UX consistency is requested.

**Physical-device acceptance: NOT RUN.** A simulated mobile Chromium browser is not a physical Android/iPhone. Prior to merging/deploying, Human A/B should open FE01 in a trusted local LAN preview on a physical phone and tablet, verify mobile browser bars/keyboard/rotation/touch, capture device/browser/date screenshots and note PASS/FAIL in PR #36. Do not advertise phone QA PASS until completed.
