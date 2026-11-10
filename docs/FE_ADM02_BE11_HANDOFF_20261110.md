# Frontend Integration — ADM-02 and BE-11 (2026-11-10)

**Scope:** Frontend-only integration source PR: `feat/fe-adm02-be11-integration-20261110`. This is a separate review lane for UI owner **HungNDk4**. It does NOT merge source Backend PR #89/#90 nor modify their files or trigger cloud writes.

## Dependencies (strict)
- PR #89 ADM-02 Backend: `GET /api/admin/users`, `PATCH /api/admin/users/:id/status`, `GET /api/admin/users/audit-logs`. Migration: `account_moderation_audit_logs` required in target database before using this feature.
- PR #90 BE-11 Backend: `GET /api/posts/my`, JWT-authenticated, status/type/search/page/limit/sort. No new DB migration for this endpoint.
- Both PRs passed exact-HEAD CI in disposable MySQL8 tests on 2026-11-10. **No submitted independent GitHub APPROVED reviews at latest inspection.** Do not claim approval from the author's review, and do not bypass the two-human review gate. Do not merge/deploy FE branch before backend PRs are reviewed/merged.
- Cloud: `mini-study-network-dep01-demo` still tracks an old PoC source branch; nothing is deployed here. The TiDB `qa-acceptance` schema still requires read-only preflight and controlled approved migrations before account audit works.

## UI contracts
1. `/admin/users` wrapped in `AdminRoute`, linked from `AdminLayoutNav`. Real paginated account search/status filtering; role+state badge; current Admin cannot self-lock; reason required 5–500 chars; explicit confirm. API failures remain visible rather than simulating success. Account audit records display actor/target IDs and reason; no password/token/wallet access.
2. `/my-posts` uses `postAPI.getMyPosts({page,limit,type,status,search,sort})`, **never `author_id`**. Sorting is server-global. Hidden/deleted posts appear as inert status cards (no PostCard component, which would try to comment/like/download inaccessible posts). Active posts reuse existing PostCard and public interactions. KPI retains existing active-only `/posts/my-stats` contract.
3. No Mock APIs. No changes to existing Admin moderation/Report queue, private PDF access or account roles.

## Acceptance gates
- [ ] Frontend isolated CI source contract test and production build PASS on exact HEAD.
- [ ] Human HungNDk4 reviews UI ownership, accessibility, responsive behavior and current API response shape.
- [ ] Hùng approves Backend PR #89/#90 independently; operator authorizes sequential merges to integration.
- [ ] After backend merge and approved QA migration: real browser authenticated Student A/B/Admin checks on `qa-acceptance`: A's 51+ posts page 50+1 across pages, B isolation, own hidden/deleted state, status + sort, Admin account 401/403/success, lock/revoked refresh, unlock, audit persistence and no PDF path exposure.
- [ ] No change to TiDB `main`, no automatic Render deploy and no automated seed/reset on persistent databases.
