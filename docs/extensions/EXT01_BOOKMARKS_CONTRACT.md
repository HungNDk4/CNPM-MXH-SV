# EXT-01 — Bookmarks API contract (optional extension)

**Scope:** Core Backend only, independent of MVP, FE-01 and DEP-01C. Original implementation baseline: `integration/team-dev-20261020` @ `431ce2c`. No changes to `app.js`, payments, document storage or Frontend.

## Endpoint contract

| Endpoint | Request / access | Success response |
|---|---|---|
| `POST /api/posts/:id/bookmark` | Bearer, ID positive safe integer | 200 `{success:true,data:{post_id:123,bookmarked:true}}` |
| `DELETE /api/posts/:id/bookmark` | Bearer; repeat permitted even if Post no longer exists | 200 `{success:true,data:{post_id:123,bookmarked:false}}` |
| `GET /api/posts/bookmarks?page=1&limit=10` | Bearer only; page 1–10000; limit 1–50 | 200 `{success:true,data:[SafePost,...],pagination:{total,page,limit,totalPages}}` |

Responses preserve ordinary Backend JSON envelopes. Query sorting uses bookmark `created_at DESC, id DESC`; pagination is **after filtering** to currently active/free Posts, not historical hidden or paid rows. Saved list returns Post DTOs, not raw Bookmark rows or storage keys. `author` is nullable, same SafePost as current feed.

**Errors:** 401 no/invalid auth, 404 saving unavailable/hidden/deleted/legacy paid Post, 422 malformed ID/query, 429 shared API limiter. Unsave intentionally remains 200 for a valid ID even if the Post is hidden, missing or never saved: allows cleanup of stale bookmarks without content enumeration. No paid-document entitlement granted by a Bookmark.

## Data / migration

- Additive `bookmarks` table: id, user_id, post_id, created_at.
- Database UNIQUE `(user_id,post_id)` for repeated requests and concurrency; Post and User FK ON DELETE CASCADE; sorting index `(user_id,created_at,id)`.
- Existing database: apply `database/migrations/20261024_bookmarks.sql` in a reviewed SQL environment; new disposable CI DB uses `database/schema.sql` containing the equivalent table definition. **Do not run `sequelize.sync({alter:true})` in production.**
- Existing Likes/Comments/Post/PDF/Auth APIs unchanged. No direct PDF exposure, static URL or extra `/api/bookmarks` app-level mount.

## Tests / scope protections

New isolated `scripts/ubuntu/ext01-bookmarks-regression.cjs` runs in existing MySQL8 chain. Nine groups cover two accounts, 401/422, idempotent save/unsave, UNIQUE pair, isolation, safe pagination and DTO, 404 suppression, hidden/paid state transition and unchanged feed. No cloud or production data. Full 7-job CI incl. Chromium required on exact source SHA before REVIEW READY.

**Not included:** bookmark folders, push notifications, follow system, bookmarks of comments, offline sync, FE UI, payments, deployment or `main` merge.

**Codex-ready brief:** implement/review solely this contract on branch `feat/ext01-post-bookmarks-20261024`, preserving unchanged endpoint behavior. In this ChatGPT session changes are committed directly via GitHub integration rather than a Codex execution session.
