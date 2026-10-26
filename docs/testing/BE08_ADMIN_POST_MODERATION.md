# BE-08 — Admin Post Moderation (Core Backend only)

**Baseline:** `integration/team-dev-20261020` @ `a2c0544` (BE-05 merged). BE-06 Draft #42 and BE-07 Draft #44 remain separate and untouched. **Decision:** ADR-013 authorizes automatic publication of a valid free PDF and Admin hide/soft-delete after publication; no preapproval queue.

## Endpoint and permission
`PATCH /api/posts/:id/moderation` (Bearer Admin). Accept **only** `{"status":"hidden"}` or `{"status":"deleted"}`. 401 unauthenticated; 403 student; 422 invalid ID/body/fields; 404 missing ID; 409 invalid state transition.
- active → hidden; active/hidden → deleted. Same-state calls are idempotent 200. Deleted → hidden is prohibited. No restore, reporting, appeals or physical PDF purge in this module.
- Uses conditional Post SQL update; response `{success:true,message,data:{id,status}}` contains neither private file bytes/keys nor full Post/User details.
- The existing Post, Comment, Like and PDF download endpoints already check active/free parent status, so a moderated PDF becomes unreachable to both guest and registered users.
- Known prior limitation: generic `PUT /api/posts/:id` in `post.controller.js` allows **Admin** to reactivate hidden posts. That controller is owned by the still-open BE-06 PR #42, so no cross-PR edit was made. Restoration policy is unapproved and needs a separate decision.
- Account suspension, moderation listing/queue and retention policy are outside ADR-013 approval and not implemented.

## Regression
One independent disposable MySQL8 HTTP test `be08-admin-moderation-regression.cjs` is spawned from existing SEC-01 suite. Seven groups cover synthetic two-user/Admin setup, authorization/validation, actual private PDF upload+download before moderation, safe hide/idempotence, denial of feed/detail/download/comments/likes after hide, delete/idempotence and question moderation. Synthetic database rows and private PDF bytes cleaned by recorded IDs and key. Existing CI workflow untouched.

**CI acceptance:** check 7/7 BE08 groups in MySQL8 log, then all GitHub Actions jobs on exact final HEAD. Do not merge/deploy or change Frontend/credentials/provider resources.
