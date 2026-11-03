# DEP-RELEASE: cloud adapter compatibility

The Render service currently tracks `feat/dep01c-render-tidb-blob-poc-20261022`
and is deployed at `71499dfd`. **This PR does not deploy it.**

The modern `integration/team-dev-20261020` line lacked the verified TLS
connection settings and private Vercel Blob adapter from the isolated PoC.
This release-compatibility patch imports only those runtime interfaces,
preserving all student/Admin API additions and local filesystem mode.

## Environment
- TiDB: set `TIDB_CLOUD=true` and either `TIDB_ENABLE_SSL=true` or
  `DB_SSL_MODE=require`, with verified TLS. Never disable verification.
- Vercel Blob Private: `DOCUMENT_STORAGE_DRIVER=vercel-blob`,
  `BLOB_READ_WRITE_TOKEN` server-only, and use a PRIVATE store, not public.
- Local/CI: default filesystem storage and localhost MySQL remain unchanged.
- Fresh/local tests may use disposable MySQL8 and local PDF storage. Passing them
  does **not** certify TiDB Cloud or Blob service behavior.

## Strict release gates
1. Read-only TiDB schema preflight and operator-selected database / backup.
2. Confirm `moderation_audit_logs.reason` (nullable VARCHAR(500)), apply
   additive migration only if missing, with explicit operator approval.
3. Review actual Render env var names and update linked branch only after
   backend build and SQL compatibility are accepted; keep existing live
   PoC available during verification and identify any API/Blob limitations.
4. Run real cloud Auth, Admin list/hide/delete/reason/audit and authorized
   free PDF upload/download (including 10MiB, hidden 404, guest 401),
   persistent storage across restart. No credential or Blob URL leakage.
5. If regressions occur, roll back **application deployment**, not the audit
   reason column or existing audit records.

Do not merge entire legacy PoC branch into integration; the branches have
diverged substantially and may overwrite newer Backend security fixes.
