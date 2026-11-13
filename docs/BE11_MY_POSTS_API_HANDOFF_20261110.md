# BE-11 / Issue #80 — My Posts authenticated API contract (2026-11-10)

**Scope:** Backend-only feature branch `feat/be11-my-posts-api-20261110`, independent of Draft ADM-02 PR #89 and Frontend owner HungNDk4. No cloud operations, schema changes or frontend edits. Human independent review mandatory before merge.

## API: GET /api/posts/my (requires a currently active JWT)

Query parameters (unknown keys are 422):

| Query | Default | Valid |
|---|---|---|
| page | 1 | integer 1..10000 |
| limit | 10 | integer 1..50 |
| type | all | all, question, discussion, document |
| status | all | all, active, hidden, deleted |
| search | absent | 1..100 chars after trim, exact wildcard escaping |
| sort | newest | newest, engagement |

Response: `{success:true,data:[...safePostDTO],pagination:{total,page,limit,totalPages}}`.
`totalPages` is at least 1 for an empty result. Newest ties break by descending post ID.
**Never send `author_id`**: backend uses `req.user.id` only, ignores NO role client-claimed IDs, and rejects unexpected parameters with 422. Status includes the owner's own hidden/deleted posts for visibility; public detail/feed still suppresses non-active items. The response is mapped through existing `toSafePost`: no `file_url`, `file_name`, private PDF storage key, password hash, token or admin audit. No new / duplicate My Stats API: keep `GET /api/posts/my-stats` as-is (current active-only stats contract).

## Frontend handoff to HungNDk4 (outside this PR)

1. Add `postAPI.getMyPosts: (params) => api.get('/posts/my', { params })` in `client/src/services/api.js`.
2. In `client/src/pages/posts/MyPostsPage.jsx`, replace `postAPI.getAll({ author_id: user.id, ... })` with `postAPI.getMyPosts({ page, limit:10, type, status, search, sort })`. Remove `author_id`; use a status chip/filter so hidden/deleted posts are not mistaken for public or editable.
3. Send `sort=engagement` to backend when selected (sorting only the current page in browser gives incorrect global ordering). Reset page when type/status/search/sort changes.
4. On hidden/deleted item disable actions requiring an active public post. Keep edit/delete behaviors consistent with existing backend status restrictions. No pseudo-success, no mock counts.
5. Owner-safe loading/empty/error page, 51+ authored posts, page navigation and browser UX acceptance required after approved merge.
6. Coordinate separate frontend PR and reviewer; **do not edit backend files from Frontend branch**.

## Acceptance / safety evidence

- New isolated GitHub Action `.github/workflows/be11-my-posts.yml` deliberately avoids modifying `.github/workflows/ci.yml` owned by concurrent PR #89.
- Test `scripts/ubuntu/be11-my-posts.test.cjs` creates 56 synthetic posts for student A, 3 for B, empty C on disposable MySQL 8 only; asserts 50+6 pagination, all IDs no leaks, A/B isolation, empty state, 401/422, status hidden/deleted, type and text search, popular global sort and no private PDF fields.
- CI test refuses execution without `GITHUB_ACTIONS=true`, `BE11_DISPOSABLE_MYSQL=true`, `NODE_ENV=test`, local DB_HOST/PORT/root, `DB_AUTO_SYNC=false`; no shared TiDB QA/main or Render tests. Fixture rows deleted only by synthetic user IDs; no TRUNCATE/DB reset.
- No migration is required to add this endpoint. Existing TiDB `qa-acceptance` runtime may still need prior PR #86 migrations; that separate operator gate is NOT satisfied by source CI.
- PR #89 ADM-02: 9/9 CI PASS, open Draft, requested independent HungNDk4 review. Do not merge automatically. This API can be reviewed in parallel because file manifests do not overlap.
