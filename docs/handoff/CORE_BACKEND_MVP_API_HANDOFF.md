# CORE BACKEND MVP — API HANDOFF TO FRONTEND

**Implementation snapshot:** integration/team-dev-20261020 @ `61bb9326` before final input-guard patch. All behavior below reflects the current integrated backend after this patch, contingent on exact-HEAD CI and merge. This is an implementation contract, not an approval of open product policies. The older `docs/API_CONTRACT.md` is a 2026-10-21 historical draft with several superseded source observations.

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

## 5. MVP exclusions & integration handoff constraints
- Legacy `/api/orders/**` and `/api/payment/**` are NOT MOUNTED, must return 404 for guests, students and Admin. VNPay Sandbox / paid documents are deferred; do not create payment UI or call legacy source routes.
- Free-first guest document metadata is public but guest question/discussion feeds are not (ADR-002 unresolved). No Admin account-ban, appeals/restore, reports, paid entitlement, university verification or public-cloud infrastructure contract is created here.
- Refresh access token once on `TOKEN_EXPIRED`; do not retry PDF download indefinitely. Use authenticated binary download for PDF bytes, never serialize storage URLs.
- Existing `docs/API_CONTRACT.md` includes historical unimplemented/unsafe behavior from prior commits. For subsequent FE work, this document plus current source and exact-HEAD test results are the integration implementation baseline.
- FE-01 PR #36 and public DEP-01C cloud PR #33 are separate; **no FE/production/cloud integration is claimed**. This handoff is limited to Backend integration readiness.

## Evidence and closure
- Integrated pre-final baseline: [CI #40000099331](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40000099331), 7/7 jobs SUCCESS, QA-04 8/8, BE-06..BE-10, DOC-04, Chromium 12 scenarios PASS.
- Final input-guard branch and post-merge exact-HEAD evidence must be recorded in its PR and Issue before being marked complete. Local Windows/device QA and live external production are not claimed.
