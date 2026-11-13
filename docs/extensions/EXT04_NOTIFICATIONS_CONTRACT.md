# EXT-04 — In-app Notifications (Backend-only)

**Baseline:** `integration/team-dev-20261020` commit `8b5c65b5028a69d2b8a2705013c7280c8a2e5715`, after EXT-03 accepted. This is an optional extension, not a retroactive MVP feature or FE implementation.

## Triggers and recipient
- `follow`: existing `POST /api/users/:id/follow` only when a Follow row is newly created. Unfollow/repeated follow create no event. Recipient = target user.
- `comment`: new root Comment → active Post owner.
- `reply`: new reply → active root Comment author (not also Post author).
- `like_post`, `like_comment`: new Like creation → active target Post/Comment author. Unlike produces no new event; a subsequent like after unlike can produce a new event.
- No self notifications. No notification to inactive/removed recipient.
- The original operation and generated notification share one transaction. Notification insert failure rolls back the Follow/Like/Comment creation. No delivery guarantee outside committed DB transaction and no retroactive backfill for old events.
- Neither untrusted text nor file paths, credentials or PDF bytes are copied into notifications. Only actor/content IDs and event type.

## Read API — authenticated *self* only (no `app.js` mount)
| Endpoint | Response |
|---|---|
| `GET /api/users/me/notifications?page=1&limit=10&unread_only=false` | `{success:true,data:[SafeNotification],pagination:{total,page,limit,totalPages}}` |
| `GET /api/users/me/notifications/unread-count` | `{success:true,data:{count}}` |
| `PATCH /api/users/me/notifications/:id/read` | `{success:true,data:{id,is_read:true}}` (own idempotent; unknown/other user 404) |
| `PATCH /api/users/me/notifications/read-all` | `{success:true,data:{updated:N}}` (visible unread records only) |

- `SafeNotification = {id,event_type,actor_id,post_id,comment_id,is_read,created_at}`; no recipient/account/private Post payload. Latest first by `created_at DESC, id DESC`.
- Page 1..10000 (default 1), limit 1..50 (default 10); unread_only must be exactly `true` or `false`. Bad ID or query 422.
- Guest missing token 401. No endpoint to read another recipient's list/mark their item.
- Read list and unread count exclude inactive/deleted actors, hidden/deleted/paid Posts and deleted target Comments. Hidden events are retained in DB but not exposed by list/count/read-all. If previously visible content returns to active, events can reappear unless already read. A direct mark-read for a guessed *owned* hidden event is allowed without content details; nonowned ID 404.

## Persistence and rollout
- Additive `notifications` table: BIGINT id, User recipient/actor FKs cascade, optional Post/Comment FKs cascade, type enum, unread bit, timestamp and recipient+recent/read indices; SQL CHECK excludes self.
- Fresh isolated MySQL8 uses `database/schema.sql`. For an existing database, back up and review **`database/migrations/20261024_notifications.sql`** then apply separately before running changed interaction endpoints. No production schema sync/deploy in this task.
- Existing Follow, Comment, Reply, Like success/error payloads are unchanged. No realtime, WS, web push, app push, email, queue, retention policy, moderation reports, group notifications, FE components or `main` changes.

## Verification
`scripts/ubuntu/ext04-notifications-regression.cjs`: 10 real HTTP/MySQL8 groups with 3 synthetic students: auth/validation, unique follow, root/self comment, reply, like-toggle, safe inbox+pagination, ownership/read-all, moderation/actor visibility, transaction rollback. Existing QA-04, EXT-01/02/03, BE modules, Chromium E2E and 7-job CI must pass on exact source commit. Only Draft PR until separately reviewed.
