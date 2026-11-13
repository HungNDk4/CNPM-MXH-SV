# EXT-02 Follow System — Backend extension API contract

**Baseline:** `integration/team-dev-20261020` at `13bf0adc35bdd2a2e12b84853f85473e299e403a` after EXT-01 accepted. This is an opt-in extension, **not** retroactive MVP requirement. Backend only; no notifications, payment, FE, cloud or deployment changes.

| Endpoint | Authentication | Response |
|---|---|---|
| `POST /api/users/:id/follow` | Bearer | 200 `{success:true,data:{user_id:id,following:true}}` (repeat idempotent) |
| `DELETE /api/users/:id/follow` | Bearer | 200 `{success:true,data:{user_id:id,following:false}}` (repeat idempotent) |
| `GET /api/users/:id/followers?page=1&limit=10` | Bearer | 200 safe user array + sibling pagination |
| `GET /api/users/:id/following?page=1&limit=10` | Bearer | 200 safe user array + sibling pagination |
| `GET /api/users/:id/follow-stats` | Bearer | 200 `{success:true,data:{user_id,followers,following,is_following}}` |

**Rules:** only follow currently active target accounts; caller's follower ID always comes from authenticated JWT/DB, never body/query. Self-follow/unfollow denied 422 (SQL CHECK also protects inserts), malformed positive-safe-integer IDs 422, unknown/inactive target 404, guest/invalid token 401. Unfollow own stale relationship 200 even if target missing/inactive; it reveals no target metadata. No ability to change another user's relations, no email/hash/wallet/token disclosure.

**Listings:** only active related users. Each is exactly `{id,full_name,avatar_url,university}`. Pagination `page` 1..10000, `limit` 1..50 (default 1 and 10). Relationship `created_at DESC`, tie-breaker id DESC. Inactive/missing target has no list or stats. Counts exclude inactive relations. `is_following` is caller-specific and false for self.

**Schema:** `user_follows` table (follower_id, following_id, created_at, id), unique pair, FK cascades, SQL self-check constraint, two direction-specific sort indexes. New disposable CI databases receive table via `database/schema.sql`; an existing database requires **reviewed manual application** of `database/migrations/20261024_user_follows.sql`. Do not use production `sync({alter:true})` and do not auto-migrate live TiDB or hosting.

**Testing:** real HTTP/MySQL8 with 3 disposable accounts and 9 groups; new test launched inside existing DOC-04 chain in a child process. Negative unauthorized, self/malformed/missing, duplicate, per-user isolation, safe DTO, pagination, stats, inactive targets, FK delete and old Profile regression. Full CI 7/7 incl. Chromium required before review.

**Scope boundaries:** no `server/src/app.js`, React, Post/PDF, paid, notification or deploy changes. This is Codex-ready specification, but ChatGPT's connected GitHub tools perform commits in this conversation; no Codex run is asserted.
