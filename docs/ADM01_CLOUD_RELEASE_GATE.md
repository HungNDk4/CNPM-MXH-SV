# ADM-01 cloud schema + deployment release gate

**Release state: BLOCKED until live Render workspace/service and TiDB schema are verified.** This note is an operator checklist, not approval to run SQL or deploy.

## Evidence known from source (2026-11-02)
- `integration/team-dev-20261020` carries merged Campus Pop PR #74 at `31ce61782e1074576e696f27eeeca0a58259b459`, exact merge CI 9/9 SUCCESS.
- ADM-01 source PR #82 adds nullable `moderation_audit_logs.reason VARCHAR(500)` and the API queries/inserts that column. Isolated MySQL8 + Chromium CI 9/9 PASS, **not a TiDB cloud migration test**.
- Repository `.github/workflows/ci.yml` runs CI on pull requests and push to integration/main. No deployment YAML or workflow was found in the merged repository tree. This **does not** reveal Render dashboard service settings.
- Read-only Render tool requires the user to confirm a workspace before listing service details. TiDB Cloud schema is not reachable via the connected Render Postgres read-only SQL action.

## Release gate order (DO NOT skip)
1. User selects/authorizes the Render workspace to inspect. Read the **actual** service name, Git repository, linked branch, `autoDeployTrigger`, build/root settings, current deployed commit, recent deploy status. No changes to service while inspecting.
2. If Render points at `integration/team-dev-20261020` with auto-deploy `On Commit` or `After CI Checks Pass`, **do not merge PR #82** until the existing TiDB database schema has been examined and one-time migration is explicitly approved. The current source is not backward-compatible with schema lacking reason.
3. In TiDB Console (read-only), select the **approved** database. Run `database/migrations/20261102_adm01_reason_readonly_preflight.sql`. Capture `DATABASE()`, table presence, column types, nullable flags, index metadata and audit row count. Do not share database credentials or connection strings. Confirm database engine against actual TiDB version.
4. If `reason` already exists as nullable VARCHAR(500), **skip** ALTER and investigate whether cloud is already migrated. If the table is absent, schema differs, privileges are unclear, or existing data differs unexpectedly, **STOP**.
5. For existing table without `reason`, record backup/export or verified recovery snapshot with timestamp and restore plan, schema/row-count baseline, and operator approval. Confirm TiDB DDL support on the running cluster. Review `database/migrations/20261102_adm01_moderation_reason.sql` (one ALTER statement). A DDL migration is **not** assumed to be transactionally reversible.
6. Only with explicit approval, execute the one-time ADD COLUMN using a controlled operator path, then **rerun read-only preflight** and verify same audit row count, old event values unchanged, new reason nullable. Avoid looping or blind retries on partial failures.
7. Merge PR #82 on the pinned reviewed HEAD, verify CI on the exact **merge commit**, and only then allow a controlled Render deploy (or verify automatic deploy). Confirm deployed SHA, Admin list/search/detail, `PATCH` with reason, old status-only `PATCH`, audit read, 401/403, hidden PDF 404, no secret leaks.
8. On deploy failure, restore the **prior application version**; the nullable additive column can remain during a code rollback. **Do not DROP the column** to roll back application code, because new audit reasons may have been recorded. Escalate before touching data.

## Stop conditions
- Missing workspace confirmation, unknown Render auto-deploy/branch, unknown live DB/schema, missing/untested backup, wrong database, non-nullable or incompatible reason column, unexpected row-count changes, missing independent review, or exact-SHA CI failure.
- Never seed/clear shared data, disable FK checks, or execute destructive SQL for this release.

## Evidence checklist (fill with actual records, not assumptions)
- [ ] Render workspace confirmed: (ID/name)
- [ ] Service+linked branch+autoDeployTrigger recorded: (value)
- [ ] Currently deployed SHA recorded: (value)
- [ ] TiDB `DATABASE()` + table/column preflight read-only evidence: (value)
- [ ] Backup/export and tested recovery path recorded: (value)
- [ ] Human explicitly approves one-time ALTER for this environment
- [ ] Postmigration schema and audit row count compared
- [ ] Independent PR #82 review and pinned SHA
- [ ] Exact merge SHA CI success
- [ ] Live smoke and rollback decision recorded

**References:** `docs/ADM01_BACKEND_CONTRACT.md`, `database/migrations/20261102_adm01_moderation_reason.sql`, Render service settings (requires confirmed workspace).