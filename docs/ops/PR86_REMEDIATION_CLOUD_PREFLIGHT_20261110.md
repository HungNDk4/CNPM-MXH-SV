# PR #86 — Read-only cloud/release preflight (2026-11-10)

**Status: BLOCKED — no Render/TiDB access, no live schema verified, no deployment/DDL authorized or executed.**

## Evidence verified from GitHub

- PR #86 authored by HungNDk4, head `f8c9625da21a9ba28bc444e2740901f1cd1176bc`, targets `integration/team-dev-20261020` @ `955bee98c91ffa5b3f068891ba31912b3102d86a`. Its exact HEAD Actions run #41909832513: 9/9 SUCCESS.
- Existing merge #85 brings TiDB TLS and private Vercel Blob **PDF** adapter into integration. It does not add durable public image storage to the proposed `server/uploads/avatars` / `server/uploads/post-images` paths.
- PR #86 includes `database/migrations/20261101_post_images.sql` and `database/migrations/20261105_create_post_reports.sql`. Workflow imports new `database/schema.sql` into disposable MySQL; this is not an existing TiDB migration validation.
- Existing cloud gate `docs/ADM01_CLOUD_RELEASE_GATE.md` still requires checking `moderation_audit_logs.reason`, backup/export and explicit operator approval.
- The current verified historical note `docs/DEP_RELEASE_CLOUD_ADAPTER.md` records a Render PoC on `feat/dep01c-render-tidb-blob-poc-20261022` @ `71499dfd`; whether the live service still uses that branch is **UNKNOWN**.
- CI does **not explicitly invoke** new `server/tests/post-reports.test.cjs` or `server/tests/avatar-upload.test.cjs`. These tests assume test users/IDs and write DB/files; **never run on shared TiDB**.

## Read-only checklist — no write operations authorized

1. Confirm actual Render workspace/service, bound GitHub repo/branch, auto-deploy mode, build/start config, current deployed SHA and latest deploy status. Do not edit settings or redeploy.
2. With approved TiDB operator, inspect database name and read-only `information_schema` metadata for `users`, `posts`, `moderation_audit_logs`, `post_images`, `post_reports`; compare column type, nullability, indexes/foreign keys and row counts. Do not run `ALTER`, `CREATE` or data mutation.
3. Check nullable `moderation_audit_logs.reason VARCHAR(500)` and existing ADM-01 release gate. Record backup/recovery readiness and human approvals before any subsequent additive migration; never presume MySQL CI proves TiDB DDL.
4. Verify private Blob PDF storage and absence of unauthenticated direct-download path, with approved smoke evidence. Do not expose JWT/token/private file URLs.
5. Resolve public-image storage persistence before enabling uploads on Render; a successful disk GET before restart is not sufficient. Account for outer post DB transaction rollback after image files are written.
6. If a disposable MySQL8 test environment is provided, run targeted report concurrency/rollback/authorization and avatar/image cleanup tests there only; review fixed-ID fixture assumptions before execution.
7. Only after schema, backup and reviewer gates are passed may operator propose a controlled deploy. Keep release of integration (#85) distinct from unmerged PR #86.

**Status is source-reviewed / live-read-only checks NOT RUN.** Render connector needs user connection, and TiDB operator access/approval remains unknown. No production access was attempted here.
