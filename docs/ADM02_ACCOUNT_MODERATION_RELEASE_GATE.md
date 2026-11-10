# ADM-02 — Account moderation API (Hunny-17, 2026-11-10)

**Status: implementation proposal / Draft PR, no deployment or live schema mutation.**
Issue: https://github.com/HungNDk4/CNPM-MXH-SV/issues/79

## Contract

All endpoints require authenticated, active `admin` (401 guest/locked JWT, 403 student). Routes are under `/api/admin`.

| Method | Route | Notes |
|---|---|---|
| GET | `/users?page=1&limit=20&search=&status=all|active|locked` | server-side page (1..10000), limit (1..50), safe projection `id,full_name,email,role,is_active,created_at`; no password/tokens/wallet |
| PATCH | `/users/:id/status` | JSON `{"is_active":false,"reason":"5–500 characters"}`; only boolean status and trimmed reason, rejects extra keys |
| GET | `/users/audit-logs?page=1&limit=20&target_user_id=` | append-only event history for admin; never exposes sessions |

- Status transition: one DB transaction, deterministic admin locks, row CAS, refresh token revocation on lock, immutable audit. Idempotent unchanged status does **not** create a second log. Self-lock is denied; last-active-admin lock is denied.
- Login now locks and re-reads the account immediately before refresh-token insertion, in the **same transaction**. It also rejects password changes that race with bcrypt validation. This ensures a login already in progress cannot create a usable refresh token after the lock transaction has revoked existing sessions.
- Access JWT is checked against `users.is_active` on EVERY authenticated request by existing middleware. On lock, even unexpired access JWT gets 401; refresh rotation and login also reject inactive accounts. Unlock requires login again; old refresh tokens stay revoked.
- Do not add role edits, mass deletions, password reset, paid content, UI or tenant-wide privileges in this slice.
- Regression: `scripts/ubuntu/adm02-account-moderation.test.cjs` runs ONLY with explicitly flagged local disposable MySQL8 in CI. It covers 401/403, pagination/projection, invalid payload, lock/unlock session invalidation, audit, repeat action, rollback, two-admin contention **and a deterministic login-vs-lock race**. **Does not imply live TiDB tests.**

## Migration and cloud gate (NOT EXECUTED)

- Additive audit table `account_moderation_audit_logs`: new `database/migrations/20261110_adm02_account_audit.sql` and fresh schema parity. No changes to `users` or refresh token schema, no FKs cascading away audit.
- Fresh disposable MySQL8 CI imports `database/schema.sql`; before a deployment to **existing** QA/production branch, inspect `information_schema` read-only, confirm parent/branch and database, take a recovery point/backup, obtain human operator approval, and apply this new table migration once under controlled change.
- **Do not** execute DDL on TiDB `main` or shared `qa-acceptance` via CI; the test SQL user `hung_qa` has CRUD grants only and cannot/should not run migrations.
- The connected Render service `mini-study-network-dep01-demo` remains linked to PoC branch `feat/dep01c-render-tidb-blob-poc-20261022` and latest recorded live deploy commit `71499dfd` (verified via read-only Render connector on 2026-11-10). Its `autoDeploy` is `yes` for **that PoC branch**, not integration. No deploy or environment changes performed.
- TiDB screenshot read-only evidence (provided by team): `main` shows 12 baseline tables and `moderation_audit_logs.reason VARCHAR(500) NULL`; teammate QA branch `qa-acceptance` was created, and SQL user `hung_qa` granted SELECT/INSERT/UPDATE/DELETE on database. This is **user-supplied evidence**, not a connector-verified TiDB session. Do not store passwords/SQL tokens in repo.

## Human acceptance gates

1. Confirm issue/branch/file ownership and peer review; obtain exact-HEAD CI + isolated DB test PASS, including the newly added ADM-02 suite.
2. Human author/reviewer check UX/API error codes, SQL lock order, account audit retention, role guards, no false admin promotion.
3. Before TiDB QA migration: separate operator approval, schema preflight and backup; do not infer approval from PR merge.
4. UI owner HungNDk4 consumes frozen API in separate Frontend task; test with two accounts and real MySQL QA only after migration approval.
