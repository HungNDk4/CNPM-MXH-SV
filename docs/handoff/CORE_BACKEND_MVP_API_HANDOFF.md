# CORE BACKEND MVP — API HANDOFF TO FRONTEND

**Version/source of truth (24/10/2026):** `integration/team-dev-20261020` @ `488306e4e72272c3a55bfd230ca895908da69879` (**EXT-01→EXT-04 merged**). [Post-merge GitHub Actions #40015007328](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40015007328): 7/7 jobs SUCCESS on exact SHA, 12/12 Chromium E2E01, all MySQL8 extension suites PASS. Backend source + this document are the current implemented contract. [`docs/API_CONTRACT.md`](../API_CONTRACT.md) and [`docs/fixtures/api-contract-v1.json`](../fixtures/api-contract-v1.json) remain **historical drafts**, not valid acceptance data for the current source.

**Ownership and integration status:** Core Backend MVP + EXT-01/02/03/04 **integrated**. FE-01 [PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36) (Post Detail Comments/Replies/Likes UI) is still **Draft/unmerged**; the integrated React `PostDetailPage.jsx` is a placeholder. There are no integrated React interfaces/API service wrappers for Bookmarks, Follow, Audit Log, or Notifications. Cloud [PR #33](https://github.com/HungNDk4/CNPM-MXH-SV/pull/33) is separate. Do **not** treat API tests as a claim that these screens are shipped.

## General rules
- Base path `/api`; JSON except `POST /documents` multipart and PDF binary download. Auth `Authorization: Bearer <accessToken>`; refresh uses JSON `refreshToken` (camelCase).
- Success usually `{success:true,data:...}`; `message` is optional. Feed returns `{success:true,data:[...],pagination:{total,page,limit,totalPages}}`. Errors use `{success:false,message}`; JWT expiry includes `code:TOKEN_EXPIRED`, invalid token may include `code:TOKEN_INVALID`. Do not depend on all failures having codes.
- Common status: 400 malformed/missing refresh/logout input; 401 unauthenticated/invalid JWT; 403 forbidden; 404 absent/hidden/deleted/paid document; 409 duplicate/conflict; 413 oversized PDF; 415 invalid PDF; 422 validation/invalid IDs; 429 rate-limited (100 API requests per 15 minutes).
- Roles: `student` and `admin`; middleware uses active role from database on each protected request. Access JWT remains valid until its expiry after logout; refresh sessions are revoked on password change.

## 1. Auth and Profile
| Method + path | Access | Request / success data |
|---|---|---|
| `GET /api/health` | public | `{success:true,message,timestamp}` |
| `POST /api/auth/register` | public | `{full_name,email,password,university?,major?}` => `{user:{id,full_name,email,role},accessToken,refreshToken}` |
| `POST /api/auth/login` | public | `{email,password}` => `{user:{id,full_name,email,role,avatar_url},accessToken,refreshToken}` |
| `POST /api/auth/refresh` | public with token body | `{refreshToken}` => `{accessToken,refreshToken}`; old refresh token revoked atomically |
| `POST /api/auth/logout` | public with optional token | `{refreshToken?}` => `{success:true,message}`; empty/unknown token idempotent; nonstring/>512 characters => 400 |
| `GET /api/auth/me` | signed in | `{id,email,full_name,role,is_active,avatar_url}`; NOT complete public profile |
| `GET /api/users/:id` | public | only active accounts: `{id,full_name,avatar_url,bio,university,major,created_at}` |
| `PUT /api/users/profile` | signed in, self | partial `{full_name?,bio?,university?,major?,avatar_url?}` => complete safe public profile |
| `PUT /api/users/change-password` | signed in, self | `{current_password,new_password}`; revokes all refresh tokens; existing access JWTs expire normally |

Profile names max 100, bio 1000, university/major max 200. `avatar_url` must be HTTPS if nonempty (no image-upload API). New password is 6..72 UTF-8 bytes. No public email/password hash/wallet balance. Use `users/:id` for bio/university/major instead of assuming `/auth/me` contains them.

## 2. Feed, Posts and moderation
| Method + path | Access | Request / behavior |
|---|---|---|
| `GET /api/posts?type=document` | public | active/free PDF safe metadata; optional page,limit,subject,search,minPrice,maxPrice |
| `GET /api/posts` or `?type=question|discussion` | signed in | active/free social feed; guest 401 (ADR-002 still open) |
| `GET /api/posts/:id` | public only if active/free document; otherwise auth required | 200 SafePost; invalid positive-safe-integer ID 422; hidden/deleted/paid 404 |
| `POST /api/posts` | signed in | JSON `{title,content?,post_type?:question|discussion,subject?,tags?,price?:0}`; no direct PDF or file_url |
| `PUT /api/posts/:id` | owner/Admin on active Post only | partial `{title?,content?,subject?,tags?,status?:hidden|deleted}`; cannot restore or edit suppressed Post |
| `DELETE /api/posts/:id` | owner/Admin | status becomes deleted (soft delete) |
| `PATCH /api/posts/:id/moderation` | Admin only | exactly `{status:hidden|deleted}`; active=>hidden/deleted; hidden=>deleted; no restore |

Feed page default 1 (1..10000), limit default 10 (1..50), search title <=100 chars, subject <=200. Page total is a sibling pagination object. Member feed can mix free post types with no type filter; guest MUST supply `type=document`. Sorting: newest `created_at` then highest `id` first.

**SafePost** has exactly `id,user_id,title,content,post_type,subject,tags,price,view_count,status,created_at,updated_at,author`. Price is decimal string e.g. `"0.00"`; `tags` array of strings or null; `author` `{id,full_name,avatar_url,university}` or null if not joined (notably create/update). No file_url, file_name, raw storage keys, signed URL, hashes, wallet data. Status mutation can return `hidden` once but that does not grant later read access.

## 3. PDF
| Method + path | Access | Behavior |
|---|---|---|
| `POST /api/documents` | student only | `multipart/form-data`: field `file` exactly 1 PDF, `title` required, `description?`, `subject?`, `tags?` JSON-encoded array string. 201 publishes active free document |
| `GET /api/documents/:postId/download` | authenticated student/Admin | 200 binary PDF attachment if active/free document; otherwise 404. Guest 401. |

Size: 1..10,485,760 bytes inclusive (10 MiB). Server validates file extension, MIME, signature, EOF, private storage and DB transaction; failed upload cannot publish partial content. PDF download returns `Content-Type:application/pdf`, attachment disposition, `Cache-Control:private, no-store`. Never build static `/uploads/...` link. Hidden/deleted PDFs inaccessible, including owner/Admin. No PDF replace, physical purge, antivirus or unhide policy in current MVP.

## 4. Comments, replies, likes
| Method + path | Access | Request / result |
|---|---|---|
| `GET /api/comments?post_id=:id` | guest for active free document, otherwise logged in | roots with one-level `replies`, active comments and safe author projection |
| `POST /api/comments` | logged in | `{post_id,content,parent_id?}`; content trimmed 1..2000 chars, parent must be active root on same post |
| `DELETE /api/comments/:id` | owner/Admin | soft-deleted comment |
| `GET /api/likes/count?target_type=post|comment&target_id=:id` | guest for active free document targets; otherwise logged in | `{success:true,data:{count}}` |
| `POST /api/likes` | logged in | `{target_type:post|comment,target_id}`; toggle `{success:true,liked:boolean,message}` |

No second-level replies, no `likedByMe` endpoint, no comment pagination contract. Hidden/deleted/paid parent targets rejected (404). FE should use `response.data.data`, `response.data.pagination` for feed and **`response.data.liked`** for Like toggle.

## 5. EXT-01 — Bookmarks (Backend integrated)

All APIs require a valid Bearer access token; **self-only list**, no public saved lists.

| HTTP | Behavior and response envelope |
|---|---|
| `POST /api/posts/:id/bookmark` | Save an active/free Post, idempotent 200 `{success:true,data:{post_id,bookmarked:true}}`. Invalid ID 422; missing/hidden/deleted/paid target 404. |
| `DELETE /api/posts/:id/bookmark` | Unsave your own bookmark, including stale/hidden/missing Post id, idempotent 200 `{success:true,data:{post_id,bookmarked:false}}`. No Post existence disclosed. |
| `GET /api/posts/bookmarks?page=1&limit=10` | Your active/free saved Posts only: `{success:true,data:[SafePost,...],pagination:{total,page,limit,totalPages}}`, newest bookmark first. |

Query ranges: page 1–10000, limit 1–50, invalid values 422. SafePost is the same DTO as `GET /api/posts`; do not expect a raw bookmark row, storage URL or paid entitlement. Backend table: `bookmarks` with UNIQUE `(user_id,post_id)`. Source contract: [EXT01_BOOKMARKS_CONTRACT.md](../extensions/EXT01_BOOKMARKS_CONTRACT.md).

## 6. EXT-02 — Follow System (Backend integrated)

All endpoints require Bearer token. Followers/following can only list **active** user accounts and respond with safe user profiles (exactly `id,full_name,avatar_url,university`).

| HTTP | Behavior and response |
|---|---|
| `POST /api/users/:id/follow` | Follow an active account, repeat idempotent 200 `{success:true,data:{user_id,following:true}}`. Self-follow 422; missing/inactive 404. |
| `DELETE /api/users/:id/follow` | Own relation removal, repeat idempotent 200 `{success:true,data:{user_id,following:false}}`; stale target does not block cleanup. |
| `GET /api/users/:id/followers?page=1&limit=10` | Paginated followers (safe user array + sibling pagination). |
| `GET /api/users/:id/following?page=1&limit=10` | Paginated followed accounts (safe user array + sibling pagination). |
| `GET /api/users/:id/follow-stats` | `{success:true,data:{user_id,followers,following,is_following}}`, where `is_following` is for the current caller only. |

Page 1–10000, limit 1–50; bad positive IDs/query 422. Follow DB uses unique actor-target pair and rejects self-relations. No system-wide follower feed, notification UI or realtime socket contract is implied. Source: [EXT02_FOLLOW_CONTRACT.md](../extensions/EXT02_FOLLOW_CONTRACT.md).

## 7. EXT-03 — Admin Moderation Audit Log (Backend integrated)

- The **existing** `PATCH /api/posts/:id/moderation` (Admin) now atomically records a log row for each *actual* transition `active→hidden`, `active→deleted`, `hidden→deleted`, in the same DB transaction. Repeating the same status returns the existing success without another log; forbidden restore 409; audit write failure rolls back the Post update. Ordinary owner `DELETE /api/posts/:id` is **not** an Admin audit event.
- **New** `GET /api/posts/moderation/audit-logs?page=1&limit=10&post_id?`: **Admin-only** (guest 401, Student 403), newest first, optional positive `post_id` filter. Response `{success:true,data:[AuditEntry,...],pagination:{total,page,limit,totalPages}}` where `AuditEntry` contains exactly `id,actor_admin_id,post_id,previous_status,new_status,created_at`. Page 1–10000, limit 1–50. No Post content, email, PDF path, token, or private file information.
- Audit is append-only via published HTTP API, **not cryptographically tamper-proof against DB admins**. Retention/deletion policy is outside this module.

Source: [EXT03_ADMIN_AUDIT_CONTRACT.md](../extensions/EXT03_ADMIN_AUDIT_CONTRACT.md).

## 8. EXT-04 — In-app Notifications (Backend integrated)

**Generated only by committed events:** first new Follow (`follow`), root Comment on somebody else's Post (`comment`), reply to somebody else's root Comment (`reply`), toggle **on** Post Like (`like_post`), toggle **on** Comment Like (`like_comment`). No notification for yourself, repeat Follow, toggle-off Like, inactive recipient or failed interaction. Notification and underlying insert share a DB transaction. Existing Follow/Comment/Like success responses remain unchanged.

All read/update endpoints require the current user's Bearer token; the API does **not** accept another user's id as notification recipient.

| HTTP | Response |
|---|---|
| `GET /api/users/me/notifications?page=1&limit=10&unread_only=false` | `{success:true,data:[SafeNotification,...],pagination:{total,page,limit,totalPages}}` |
| `GET /api/users/me/notifications/unread-count` | `{success:true,data:{count}}` |
| `PATCH /api/users/me/notifications/:id/read` | `{success:true,data:{id,is_read:true}}` (repeat idempotent, non-owned/absent ID 404) |
| `PATCH /api/users/me/notifications/read-all` | `{success:true,data:{updated:N}}`, only currently visible unread events |

`SafeNotification` has exactly `id,event_type,actor_id,post_id,comment_id,is_read,created_at`. No email, user-supplied text, raw PDF URL or `recipient_id` exposed. List/count/read-all suppress notifications connected to hidden/deleted/paid Posts, inactive actors or deleted target Comments; Follow events have nullable `post_id`/`comment_id`. Newest first. `unread_only` must be literal `true` or `false`; page 1–10000, limit 1–50; malformed values 422. A direct read of an **owned** hidden event is possible but yields no content. No WebSocket, push/email, background delivery, unread badge UI or front-end notifications screen exists in this phase.

Source: [EXT04_NOTIFICATIONS_CONTRACT.md](../extensions/EXT04_NOTIFICATIONS_CONTRACT.md).

## 9. Frontend consumption / integration boundaries

- `client/src/services/api.js` **currently contains wrappers only for MVP** (Auth, Posts, Comments, Likes, Users, Documents) and a **legacy `orderAPI` object for endpoints that are NOT MOUNTED**. Do not call `orderAPI` or treat `/payment/result` placeholder routing as payment integration.
- FE wrappers for EXT-01..04 **do not exist yet**. Human B should add them on a FE-owned branch after accepting the contracts. No backend endpoint changes or React code are authorized by this handoff.
- FE-01 PR #36 has Post Detail/Comments/Replies/Likes UI and 10 FE-specific browser checks on its **own older base**, but has not been merged or tested together on the latest EXT-04 integration HEAD. The integrated `client/src/pages/posts/PostDetailPage.jsx` remains a placeholder. Do not claim full social-UI acceptance.
- React/Vite API base path: `/api`; Axios interceptors attach JWT and refresh once on `TOKEN_EXPIRED`; PDF bytes requested as Blob via authenticated download. UI data accesses generally require `response.data.data` (Axios envelope); Like toggle uses top-level `response.data.liked`, while feed/inbox pagination is `response.data.pagination`.
- Likes API still has **no `likedByMe` on initial GET**. FE must not infer initial heart state from count; this remains a separate product/contract decision.
- Auth and PDF React flows have real-Chromium CI evidence; EXT APIs have real MySQL8/HTTP evidence. **No browser UI/E2E exists for Bookmarks, Follow, Audit or Notifications on this integration HEAD.**
- For any existing database, migration sequence before running the current Backend: `database/migrations/20261021_document_files.sql` (if not already applied), then `database/migrations/20261024_bookmarks.sql`, `20261024_user_follows.sql`, `20261024_moderation_audit_logs.sql`, `20261024_notifications.sql`. Check original schema/table/migration state and **back up** before applying; scripts contain `USE mini_study_network` and **must not** be run on another or live database without operator review. Fresh CI DB uses `database/schema.sql` plus DocumentFile migration. No automatic live migration/deploy is included in this handoff.

## 10. Integration evidence and follow-up gates

See [Full-stack Integration Acceptance Matrix (2026-10-24)](../testing/FULLSTACK_INTEGRATION_ACCEPTANCE_20261024.md) for the 12 browser flows, Backend regression evidence and the **not-tested/unmerged** items. Baseline [Actions #40015007328](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40015007328) is 7/7 success on merged EXT-04 HEAD. Next documentation PR must itself pass CI on its exact head.

For FE handoff: (1) receive/read this API contract; (2) review/rebase FE-01 PR #36 separately; (3) create FE-owned extension screens/wrappers (not Backend scope); (4) run *new* real-browser E2E for Social UI and EXT interactions on a **combined integration commit**; (5) then conduct manually authorized cloud/TiDB/Blob tests. Not complete until those steps have evidence.

## 11. MVP exclusions & integration handoff constraints
- Legacy `/api/orders/**` and `/api/payment/**` are NOT MOUNTED, must return 404 for guests, students and Admin. VNPay Sandbox / paid documents are deferred; do not create payment UI or call legacy source routes.
- Free-first guest document metadata is public but guest question/discussion feeds are not (ADR-002 unresolved). No Admin account-ban, appeals/restore, reports, paid entitlement, university verification or public-cloud infrastructure contract is created here.
- Refresh access token once on `TOKEN_EXPIRED`; do not retry PDF download indefinitely. Use authenticated binary download for PDF bytes, never serialize storage URLs.
- Existing `docs/API_CONTRACT.md` includes historical unimplemented/unsafe behavior from prior commits. For subsequent FE work, this document plus current source and exact-HEAD test results are the integration implementation baseline.
- FE-01 PR #36 and public DEP-01C cloud PR #33 are separate; **no FE/production/cloud integration is claimed**. This handoff is limited to Backend integration readiness.

## Evidence and closure (exact merged HEAD)

- Current branch: `integration/team-dev-20261020` @ `488306e4e72272c3a55bfd230ca895908da69879` (merged [PR #62](https://github.com/HungNDk4/CNPM-MXH-SV/pull/62)).
- Exact merged-HEAD [CI #40015007328](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40015007328): **7/7 jobs SUCCESS** with **12/12** real Chromium E2E01 scenarios, **EXT-01 9/9**, **EXT-02 9/9**, **EXT-03 9/9**, **EXT-04 10/10**, **QA-04 8/8**, **Backend Final 7/7** on disposable MySQL8.
- This is Backend/API + **existing integrated Auth/PDF UI** acceptance only. FE-01 Post Detail and EXT UI not integrated; cloud live acceptance not covered. Human B FE contract approval is not implied by Backend CI.
- Every document-only handoff change needs a new exact-HEAD GitHub Actions run; do not silently reuse old source CI as a test result for the updated docs commit.
