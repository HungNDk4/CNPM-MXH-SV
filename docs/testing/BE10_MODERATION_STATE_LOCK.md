# BE-10 — Immutable moderation states in generic Post API

**Integration baseline:** `integration/team-dev-20261020` @ `637d2972fa8ad715ff87f854db4b1b8f1d0dc84e` (BE-06/07/08/09 merged and 7/7 integrated CI PASS). No parallel BE backend PR conflicts identified.

## Policy interpretation (ADR-013, fail closed)

The project **approved** automatic publication of valid free PDFs and Admin hide/delete *after publication*, but **did not approve** restore/unhide, appeals, review queues or editing already-suppressed posts. BE-09 retained a legacy generic Admin `PUT /api/posts/:id` path that could turn `hidden` back to `active`; this BE-10 patch removes that bypass. It does not create a new restore policy or claim Human A approved one.

| Endpoint | Existing state | Actor | Action | BE-10 expected |
|---|---|---|---|---|
| `PUT /api/posts/:id` | active | owner or admin | valid metadata edit | 200 |
| `PUT /api/posts/:id` | active | owner or admin | status hidden/deleted | 200 (existing behavior) |
| `PUT /api/posts/:id` | active | admin | status active (unapproved no-op) | 422 |
| `PUT /api/posts/:id` | hidden/deleted | owner or admin | any metadata or status edit, including active | 403, no DB write |
| `PATCH /api/posts/:id/moderation` | active | admin | hidden/deleted | 200 |
| `PATCH /api/posts/:id/moderation` | hidden | admin | deleted | 200 |
| `PATCH /api/posts/:id/moderation` | deleted | admin | hidden | 409 |

**Implementation:** `server/src/controllers/post.controller.js` always rejects edits to suppressed rows after ownership check, regardless of Admin status. `server/src/utils/post-input.js` forbids `status: "active"` in *any* generic PUT. BE-09 compare-and-set `WHERE id AND previous status` remains to defend a concurrent hide/delete race. No direct physical deletion of private PDF, no change in guest metadata or protected download.

**Test integration:** `scripts/ubuntu/be10-moderation-state-regression.cjs` runs real HTTP against disposable loopback MySQL8 with three synthetic users, DB-promoted Admin and a synthetic valid PDF. Eight assertion groups cover active normal edit/ownership; owner hide, Admin restoration bypass; Admin hide PDF; complete PDF/metadata/interaction denial after hide; Admin soft delete and no retention-policy guess; invalid active status; Admin hide/delete remains. A child-process hook in `scripts/ubuntu/pdf-download.test.cjs` runs the suite without CI workflow edits. Cleanup removes only created user IDs and stored synthetic PDF by key.

**Out of scope:** admin account suspension, report/appeal UX, restore endpoint, cloud deploy, FE, payments, schemas, CI configuration.

**Gate:** exact BE-10 HEAD must pass BE10 8/8 real MySQL8 groups and all existing GitHub Actions jobs (including Chromium E2E) before REVIEW READY. Draft PR only; no auto merge or deploy.
