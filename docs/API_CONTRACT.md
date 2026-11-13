# API Contract v1 — Auth, Posts, Profile

**Candidate:** DRAFT v0.1 for v1 acceptance · 2026-10-21 (Asia/Bangkok). **Issue:** [#11](https://github.com/HungNDk4/CNPM-MXH-SV/issues/11), TEAM/G03 / DS-03. **Author:** Codex supporting Human A. **Reviewers:** Human A (Core Backend), Human B (Frontend/Analysis). **Both approvals: PENDING.** This document does not approve itself or authorize Issue #13 implementation.

## 1. Evidence, labels and branch scope

Source baseline: `integration/team-dev-20261020` at `dffe5ae41f14983a5cad2c77a0e465726a3cbbcc`. Inspected actual routes/controllers, middleware, models, SQL and React service. Source inspection is not a runtime test. Read alongside [SRS](SRS.md), [Data Model](DATA_MODEL.md), [Decisions](DECISIONS.md), [Document Access Policy](DOCUMENT_ACCESS_POLICY.md), [Upload Spec](DOCUMENT_UPLOAD_SPEC.md) and [Test Plan](TEST_PLAN.md).

| Label | Meaning |
|---|---|
| **IMPLEMENTED** | Confirmed in baseline source, including defects. Not a security endorsement or new PASS claim. |
| **APPROVED BUT NOT IMPLEMENTED** | Existing product requirement from ADR-010/011/012/013 or free-first scope, missing in source. Product decisions do not replace both humans' contract review. |
| **PROPOSED / OPEN** | Candidate DTO, validation, status convention or unresolved policy; needs explicit contract acceptance. |

| Branch / PR | Inspected head | Payment routes | QA-01 |
|---|---|---|---|
| Shared integration (this docs base) | `dffe5ae` | `/api/orders` and `/api/payment` still mounted | Ubuntu smoke only |
| [Draft #20](https://github.com/HungNDk4/CNPM-MXH-SV/pull/20) | `8a4a3b6` | Mounts/imports removed; historical code/schema retained | Unchanged |
| [Draft #21](https://github.com/HungNDk4/CNPM-MXH-SV/pull/21), based on #20 | `96d6efc` | Inherits #20 | Adds two-account script/CI step |

Neither PR is merged at inspection; main remains `0993a421`. Do not describe shutdown or QA-01 as integrated into this docs baseline/main. Auth/Post/Profile product source is identical across the three heads. Comments/Likes detail contracts, payment expansion, full upload/storage/download and cloud are outside #11. No product implementation occurs here.

## 2. Transport, envelopes and authentication

**IMPLEMENTED:** prefix `/api`, JSON bodies/responses except legacy payment/static files. Protected routes require `Authorization: Bearer <accessToken>`. [Mock fixtures](fixtures/api-contract-v1.json) are synthetic; token placeholders are deliberately not JWTs. Preserve each fixture's status label when using it as a mock.

| Response | Current shape |
|---|---|
| Success | `{success:true,data:...}`; `message` present on some writes. Logout/password/delete have message but no data. |
| Feed | `{success:true,data:[...],pagination:{total,page,limit,totalPages}}`; pagination is a sibling of data. |
| General failure | `{success:false,message:"..."}`; no universal machine-readable code. |
| Route validation 422 | General failure plus `errors:[{field:"email",message:"..."}]`. |
| Sequelize validation 422 | General failure plus `errors:["..."]` (different shape). |
| Unique constraint 409 | General failure plus optional field; duplicate-register controller has no field. |
| Access JWT 401 | Expired -> `code:"TOKEN_EXPIRED"`; malformed/bad signature -> `code:"TOKEN_INVALID"`. Missing token or missing/inactive DB user has no code. Refresh errors have neither code. |
| Unexpected failure | Handler defaults to 500; inputs without validators can reach it. `stack` appears only in development; never depend on it. |
| Rate limit 429 | General failure; shared `/api/` limiter: 100 requests per 15 minutes per client. |

**IMPLEMENTED auth:** access middleware verifies signature/expiry and reloads ID/role/active state from DB. Client role/ID cannot grant ownership. Inactive login ->403; inactive access authentication ->401. JWT defaults: access 15 minutes, refresh 7 days, configurable by environment; stored refresh expiry is independently hard-coded to 7 days. Refresh checks a stored nonrevoked token, DB expiry, JWT signature/expiry and existing user, then rotates with unique jti. It does **not** explicitly check user.is_active or compare stored.user_id with JWT ID; rotation is not transactional or an atomic concurrent-use guarantee. These are documented limitations, not changes in this PR.

Logout revokes only the supplied refresh token; missing/unknown/already revoked token still returns 200. Existing stateless access JWTs remain usable until expiry/account rejection; other sessions are not revoked. Password change also does not revoke tokens. Immediate access-JWT revocation after logout is not an implemented promise.

**PROPOSED / OPEN:** preserve envelope nesting/JWT codes for FE compatibility; normalize error arrays only in a coordinated change. Body-type validation, inactive refresh/session policy, concurrent rotation, cookies and all-session logout are separate follow-ups, not approved implementations here.

## 3. DTO catalogue

Notation: `?` = absent key allowed; `null` = present JSON null. Normal IDs are positive integers. Dates serialize as date-time strings. DECIMAL price commonly serializes as string; create/update/driver behavior is not a guarantee of a uniform type. Source tags accepts general JSON, not only string arrays.

### IMPLEMENTED identity and profile

| DTO | Source-selected fields |
|---|---|
| RegisterUser | id, full_name, email, role (student default; no client-selected role). |
| LoginUser | RegisterUser plus avatar_url: string or null. |
| MeUser | id, email, full_name, role, is_active:boolean, avatar_url:string or null. No bio/university/major. |
| PublicProfile | id, full_name, avatar_url/bio/university/major each string or null, created_at. No email/hash/wallet/active flag/tokens. |
| ProfileUpdateResult | Authenticated MeUser instance plus fields supplied by the update and possible save timestamp. Not a stable full PublicProfile: untouched profile fields were never loaded by auth middleware. |

Register/login wrap `{user,accessToken,refreshToken}` in data; refresh returns only `{accessToken,refreshToken}`. Credentials belong only in auth responses. Load profile fields through GET /users/:id, not /auth/me. Public profile currently does not filter inactive users.

### IMPLEMENTED Post serialization — unsafe as a public allowlist

Current model fields: id, user_id, title, content, post_type, **file_url**, **file_name**, price, subject, tags, view_count, status, created_at, updated_at. Nullable source fields: content, file_url, file_name, subject, tags. Feed author: `{id,full_name,avatar_url,university}`; detail author omits university. Avatar/university nullable. Create/update have no author join.

Feed/search can expose file_url. Detail only nulls it for a paid document when nonowner lacks DocumentAccess; free/owner/entitled responses still expose it. Its guest masking branch is unreachable through mandatory auth. A null sensitive field is not a safe allowlist. Legacy file_name is user input, not proven sanitized. Do not treat model serialization as the approved public DTO.

### PROPOSED / OPEN — SafePost v1 for #13 review

Use one bounded projection for feed, detail, create and update. Preserve envelope names and snake_case. This is a mock target, **not an implemented DTO**.

| Field | Candidate type/semantics |
|---|---|
| id, user_id | Positive integers; post and author identity. |
| title | Nonempty string, max 300 characters. |
| content | string or null; existing content/description, no new description alias. |
| post_type | question, discussion or document. |
| subject | string or null, max 200. |
| tags | array of strings or null; normalization/limits need review. |
| price | Decimal string, `"0.00"` for MVP free documents; retained for PostCard compatibility, no paid entitlement implied. |
| view_count | Nonnegative integer; detail need not reflect its own increment immediately. |
| status | active/hidden/deleted; public list/detail only active; authorized mutation may return resulting hidden/deleted state without file data. |
| created_at, updated_at | UTC date-time strings. |
| author | `{id,full_name,avatar_url:string|null,university:string|null}` or null if not joined; unavailable university normalized to null. |

No other Post keys. **Omit**, including nested objects: file_url, file_name, storage_key, filesystem/private object paths, raw/signed PDF URLs, hashes, wallet data, refresh tokens and DocumentAccess/Order records. A future original display filename needs a reviewed sanitization rule; omitted for now. Avatar URL represents a public image, never a protected PDF URL. This projection does not claim to sanitize arbitrary author-entered free text; content/public-image validation is separate work.

Do not add storage lookups, inferred file size, upload routes or canDownload:true merely to populate this DTO in #13; no working download endpoint exists. Request migration from legacy file_url is a separate compatibility decision.

## 4. Auth endpoint contract

All five are **IMPLEMENTED**. Register/login/refresh/logout do not require Bearer auth; /me does. Requests are JSON; token names use camelCase.

| Method/path | Request | Success | Current rejection/limitations |
|---|---|---|---|
| POST `/auth/register` | Required full_name, email, password; optional university, major. Name trimmed/nonempty; email validated/normalized; password min 6. Model lengths: name 100, email 150, university/major 200; not all explicitly route-validated. | 201 + message + data:{user:RegisterUser,accessToken,refreshToken}. | 422 route/model validation; 409 duplicate; unexpected DB/signing errors may be 500. |
| POST `/auth/login` | Valid/normalized email, nonempty password. | 200 + message + data:{user:LoginUser,accessToken,refreshToken}. | 422 validation; 401 unknown email/wrong password; 403 inactive. |
| POST `/auth/refresh` | {refreshToken:string}; stored refresh JWT, not access JWT. | 200 + data:{accessToken,refreshToken}; old token revoked. | 400 missing; 401 unknown/revoked/DB-expired/JWT-expired/invalid JWT/missing user. No general body validator; malformed types may fail differently. |
| POST `/auth/logout` | Optional {refreshToken:string}. | 200 + message, no data. | Missing/unknown token is successful no-op; malformed types/DB errors can fail. |
| GET `/auth/me` | No body/query; valid active-user Bearer. | 200 + data:MeUser. | 401 missing/invalid/expired JWT or missing/inactive user. |

**PROPOSED / OPEN:** validate refresh/logout body types, reject inactive refresh and specify concurrency/session policy separately. Auth mocks retain implemented shapes; no token state is inferred from public profile responses.

## 5. Posts endpoint contract

### IMPLEMENTED feed/detail and query parsing

| Method/path | Access/behavior | Success and current errors |
|---|---|---|
| GET `/posts` | Active authenticated student/admin. Always status=active, order created_at DESC. Queries below. | 200 serialized Posts + feed author + sibling pagination; guest 401 even type=document. Paid/legacy documents still included unless filtered. Bad query/DB errors may be 500. |
| GET `/posts/:id` | Active authenticated student/admin; raw ID passed to ORM. Existing row except status=deleted; constructs response then increments views. | 200 serialized Post + detail author; absent/deleted 404. Hidden may be 200 to another student; URL masking incomplete. Invalid IDs not explicitly validated. Returned view count may predate increment. |

| Query | IMPLEMENTED | PROPOSED / OPEN validation |
|---|---|---|
| page | Default 1, parseInt, offset=(page-1)*limit. | Integer >=1, malformed ->422. |
| limit | Default 10, parseInt, no max. | Integer 1..50, default 10, otherwise 422. |
| type | Exact post_type match when truthy. | question/discussion/document enum; omitted type never grants guest authorization. |
| subject | SQL LIKE contains. | Nonempty string <=200 if supplied; escaping semantics to confirm. |
| search | SQL LIKE contains on title only. | Nonempty string <=300 if supplied, not full-text/content search. |
| minPrice, maxPrice | parseFloat, inclusive comparisons. | Legacy compatibility only, no paid UI contract; invalid/negative/reversed ranges need acceptance. |

Pagination total counts filtered rows; totalPages=ceil(total/limit), 0 when empty; empty valid pages ->200/empty array. No cursor or deterministic tie-breaker for equal creation times. Search/filter share the same serializer and safe-DTO obligation. Invalid page/limit are not guaranteed 422 today.

### IMPLEMENTED writes

| Method/path | Body and authorization | Success | Current errors/limits |
|---|---|---|---|
| POST `/posts` | Any active authenticated role. Model-required title nonempty <=300; optional content, post_type(default question), subject, tags, price, legacy file_url/file_name. Owner always req.user.id; client user_id/status not accepted. | 201 + message + serialized Post, no author join. Document also creates DocumentAccess for its author. | 401 auth; model 422; some invalid type/enum/DB failures 500. price=parseFloat(price or 0), model min 0. No actual PDF upload/validation/exact-one-file/persistence transaction. #20 does not disable paid Post creation. |
| PUT `/posts/:id` | Owner **or admin**, DB role. Partial allowlist: title, content, subject, tags, status. Other fields ignored; cannot update user_id/post_type/price/file fields. | 200 + message + serialized Post, no author join. | 401 auth; 404 absent; 403 nonowner student; model 422 or DB 500. No state guard; owner can currently set status and reactivate deleted rows. Empty update not explicitly rejected. |
| DELETE `/posts/:id` | Owner **or admin**; no body required. | 200 + message, no data; status=deleted soft delete, no byte deletion. Repeat by authorized user can still be 200. | 401 auth; 404 absent; 403 nonowner student. File retention/cleanup/revocation unimplemented. |

**APPROVED BUT NOT IMPLEMENTED:** Guest safe metadata of active/free PDFs; no protected URL/key/path disclosure; hidden/deleted PDF metadata and ordinary bytes unavailable; deny paid document paths in MVP; exactly one valid PDF of 1..10,485,760 bytes, active only after successful validation/storage/DB persistence. Existing JSON URL creation is not that upload workflow.

**PROPOSED / OPEN:** apply SafePost to feed/detail/create/update; ordinary hidden/deleted/paid document detail ->404 and exclude from list/search for Guest/Student/Admin alike, without inventing an Admin moderation-read exception. Narrow guest access to GET /posts?type=document and active/free document detail only. Guest unfiltered/question/discussion feed stays 401 pending ADR-002; supplied invalid credentials ->401 rather than silent guest downgrade. Status/routing details need acceptance; metadata access requirement itself is already approved. Moderation endpoints/state-transition controls are separate design work.

## 6. Profile endpoint contract

All are **IMPLEMENTED** inline in `server/src/routes/user.routes.js`; no user.controller file exists.

| Method/path | Request and authorization | Success | Current errors/limits |
|---|---|---|---|
| GET `/users/:id` | Public; raw ID to ORM; no auth middleware. Even invalid/expired supplied Bearer is ignored here. | 200 + data:PublicProfile. | 404 absent; bad ID/DB errors possible. Inactive profiles not filtered. |
| PUT `/users/profile` | Authenticated own user only. Optional full_name, bio, university, major, avatar_url. No target ID; cannot set email/role/wallet/password/active flag. | 200 + message + ProfileUpdateResult. | 401 auth; model 422/DB failures. No complete route validation/URL policy; unmodified profile fields not loaded. |
| PUT `/users/change-password` | Authenticated own user; current_password, new_password strings; compare bcrypt old hash, hash replacement. | 200 + message, no data. | 401 auth; 400 wrong current password. Missing/type errors can reach 500; no route-level minimum length for new password. No session revocation. |

**PROPOSED / OPEN:** choose stable update projection (MeUser plus bio/university/major, no hashes/wallet/tokens) vs existing sparse result + refetch; Human B reviews compatibility. Future validation: nonempty name <=100, university/major string|null <=200, bio cap OPEN, public-image URL|null policy, password string/min 6 and positive-ID validation before ORM, invalid input ->422 candidate. Inactive-profile visibility and password-change session policy are OPEN. No private attributes of another user may be exposed/edited by this contract.

## 7. Permission/PDF boundary

| Action | IMPLEMENTED | Approved requirement / candidate |
|---|---|---|
| Guest general feed/detail | 401 | ADR-002 OPEN; do not open general posts. |
| Guest active/free PDF metadata | 401 | APPROVED BUT NOT IMPLEMENTED: readable safe metadata; narrow routing proposed in section 5. |
| A/B active general posts | Both read; owner/admin mutate; B modifying A ->403. | Preserve identity/ownership. Student tests do not prove Admin matrix. |
| Hidden/deleted PDF | Feed excludes both, hidden detail still readable, deleted detail 404; static bypasses auth/state. | APPROVED BUT NOT IMPLEMENTED: no public metadata/ordinary bytes including owner/admin; candidate ordinary detail 404. |
| Paid/legacy documents | Post/file URL paths still supported. | Free-first: deny paid access. #20 only unmounts payment/order, not paid Post creation/serialization. |
| Direct `/uploads/...` | Public express.static on all inspected heads. | APPROVED BUT NOT IMPLEMENTED: protected PDFs inaccessible, including alternate/encoded/traversal paths. #13 after gate. |
| `/documents` API | No mounted router. | Business rules approved; route/schema still proposed, not instruction to build in #13. |

**PROPOSED / OPEN future routes:** POST /documents, multipart field file + reviewed metadata; GET /documents/:postId/download, active-user authenticated attachment stream. Proposed statuses: upload 201; auth 401; bad metadata/count/empty 400 or 422 (select later); oversize 413; invalid PDF 415; unavailable/hidden/deleted/paid download 404; valid authenticated free/active download 200 with sanitized attachment filename. Exactly one positive-size valid PDF <=10,485,760 and immediate publish after safe persistence are approved, not proposed numbers. Admin upload, replacement, quotas, retention, storage provider/transport are OPEN. #13 must not implement full infrastructure.

## 8. Compatibility / missing implementation report

| Gap | FE consequence / bounded follow-up |
|---|---|
| Unsafe Post responses/guest metadata blocked | PostCard uses id/title/type/subject/date/views/price/author, retained by SafePost. Guest fixtures are target-only until implemented/tested. |
| CreatePostPage sends file_url/price, paid controls | Existing request is not approved upload UX. Response-field removal does not migrate it. Human B owns later UI work coordinated with Human A; client unchanged here. |
| author/tags/price/query differences | Candidate nullable author and normalization avoid relying on joins/type coercion. Acceptance and separate validation work needed; not silently bundled into #13. |
| `/me` lacks full profile; update sparse | Profile screen must fetch public profile fields until response choice accepted. Profile/password validation remains outside #13. |
| Axios expects token codes/camelCase | Keep TOKEN_EXPIRED, envelopes and rotated token names. Service returns AxiosResponse; payload is response.data, entity response.data.data. Auth store expects data.user. Refresh queue exists, not proof of backend concurrency. |
| React orderAPI still present | Works against integration's legacy mounts; #20/#21 yield 404. Deferred, no MVP dependency. |
| Historical Data Model conflicts | Actual integration SQL includes likes/refresh_tokens.updated_at. ADR-012 subsequently approved 10 MiB/one PDF; older proposed paragraphs do not override it. No schema edit in #11. |

## 9. FR -> API -> existing tests/evidence

Reuse IDs from [TEST_PLAN](TEST_PLAN.md); no duplicate registry or new issues. Baseline has `scripts/ubuntu/mysql-integration.test.cjs`; `scripts/ubuntu/auth-ownership.test.cjs` lives only in #21. QA numbers below are internal checks, not 15 Node test cases.

| FR | API | Test mapping / actual scope |
|---|---|---|
| FR-01 | register | T-AUTH-01/02; smoke register/hash; #21 QA [01..03] duplicate/invalid registration PASS on its head. |
| FR-02 | login/refresh/logout/me | T-AUTH-01/02; smoke token uniqueness; #21 [04..10,15] A/B identity, invalid/expired/revoked tokens, inactive access PASS. Concurrent rotation/access revocation not covered. |
| FR-03 | feed | T-FEED-01; authenticated type=question smoke PASS on #20/#21; observed guest 401 is a KNOWN GAP, not desired public-access PASS. |
| FR-04 | create | T-POST-01; smoke and #21 [11] question creation PASS. Full PDF creation unimplemented/NOT RUN. |
| FR-05 | update/delete | T-POST-01/02; #21 [12..14] B->403 + DB title/status/owner invariant, owner update/soft-delete PASS. Admin/state-transition matrix NOT RUN. |
| FR-06 | detail/safe DTO | T-POST-01, T-DOC-01; #21 [13..14] active question/deleted 404 PASS. Hidden/paid/PDF/static defenses NOT RUN/unimplemented; #13 after gate. |
| FR-09 | search/filter/page | T-POST-03; type=question smoke only. Full search/invalid pagination/boundary matrix NOT RUN. |
| FR-10 | profile/update/password | T-PROFILE-01; source inspected, runtime NOT RUN. Auth/Post tests are not Profile evidence. |
| FR-11/12 | PDF/moderation | T-DOCFREE-01..06, T-UP-LIM-01..06, T-PUBLISH-01..06; approved requirements, NOT RUN. #13 covers exposure/static/visibility; full upload/download/moderation later. |

Historical evidence reused: [#20 CI 39463899588](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39463899588), 6/6 jobs PASS for head 8a4a3b6, reported WSL HTTP 6/6 and Auth/Post 8/8. [#21 CI 39465876052](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39465876052), 6/6 and QA-01 15/15 PASS (Actions merge ref bdbeae7 for head 96d6efc on 8a4a3b6); [Human A WSL evidence](https://github.com/HungNDk4/CNPM-MXH-SV/issues/14#issuecomment-6297050288), exact head 96d6efc, 15/15, runner pass 1/fail 0. These do not prove proposed DTOs or this docs revision's runtime behavior. No ceremonial WSL repetition requested.

## 10. Both-human review checklist and acceptance record

Both review the same commit/PR revision. A proposal becomes accepted only through explicit human acceptance; post-review changes need review of that revision. Unchecked boxes are not approvals.

| Decision | Candidate / exact question |
|---|---|
| R1 SafePost | Accept section 3 allowlist for feed/detail/create/update, nullable author, omit all file/storage fields including file_name, retain decimal-string price? |
| R2 Visibility/guest routing | Accept PDF-only guest read, general guest unchanged, ordinary hidden/deleted/paid document detail 404 and list exclusion for all normal roles, invalid supplied token 401? No Admin bypass implied. |
| R3 Legacy compatibility | Accept security response-field removal without claiming request upload migration? Keep question/discussion CRUD; scope document-creation migration/paid-creation disabling separately, without allowing unsafe file access meanwhile. |
| R4 Validation/profile | Accept follow-up design only or request revision: pagination 1..50/422, string-array tags, price normalization, stable update vs sparse+refetch, password/session rules. Not mandatory implementation in #13. |
| R5 Phase B scope | Accept #13 limited to DTO leaks, static protection, document visibility and focused tests after both approvals; no full upload/storage/download or ADR-002 expansion? |

- [ ] Human A: source/errors/ownership reviewed; R1..R5 accepted or requested changes recorded.
- [ ] Human B: Axios/envelopes/nullability/mock fields/profile choice reviewed; R1..R5 accepted or requested changes recorded.
- [ ] Both: synthetic fixtures only, ADR-002 remains OPEN, missing APIs not advertised as available.
- [ ] Both: record accepted SHA, identities, date and conditions in PR; then mark Contract v1 APPROVED.

| Gate | Record |
|---|---|
| Candidate | This docs PR head; exact SHA in PR evidence. |
| Human A acceptance | PENDING, not inferred from assignment or AI preparation. |
| Human B acceptance | PENDING, not inferred from team role. |
| Issue #11 | REVIEW candidate, not DONE until both accept. |
| Issue #13 | NOT STARTED; blocked by both-human contract acceptance. |

After acceptance, recheck #20/#21/integration. #20 owns app.js mount removal: prefer its reviewed merge into integration before branching #13. If still unmerged, explicitly choose a dependency branch containing #20 with one app.js editor or wait; never parallel conflicting edits. Preserve #20 -> #21. Do not merge/retarget/force-push automatically or modify main. Full-backend public deployment remains outside scope.
