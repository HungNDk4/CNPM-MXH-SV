# EXT-03 — Admin Moderation Audit Log (Backend extension)

**Baseline:** `integration/team-dev-20261020` at `cf73c4249e39db0e8b8c9977c748766a563e334d`, after EXT-02 [CI #40009853041](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40009853041) accepted. This is an optional extension, not an approved revision of the free-first MVP.

## Contract and privacy

**Existing** `PATCH /api/posts/:id/moderation` stays Admin-only. On a *real* `active→hidden`, `active→deleted` or `hidden→deleted` transition, the endpoint atomically updates the Post and writes **one** ModerationAuditLog event. Requests that are unauthorized, invalid, not found, conflict, or repeat the same already-set status create **no** new event. Database write failures roll back the Post update rather than returning an unlogged success. A repeated action still returns its existing successful response. Deleted content cannot be restored via the extension.

**New:** `GET /api/posts/moderation/audit-logs?page=1&limit=10&post_id?`, **Admin only**. JWT authentication required; Student 403, Guest 401. Page 1..10000 and limit 1..50, default 1 and 10. Optional `post_id` must be a positive safe integer. Returns:

```json
{
  "success": true,
  "data": [
    {
      "id": 18,
      "actor_admin_id": 2,
      "post_id": 77,
      "previous_status": "active",
      "new_status": "hidden",
      "created_at": "2026-10-24T00:00:00.000Z"
    }
  ],
  "pagination": {"total": 1, "page": 1, "limit": 10, "totalPages": 1}
}
```

The output contains exactly the six audit fields above, sorted `created_at DESC` then `id DESC`. There are **no** username/email/IP address, JWT, post content, file URL/storage key, password hash or wallet fields. The endpoint is not exposed to Student/Guest and does not grant ability to view hidden posts or PDF bytes.

## Storage and integrity

- `moderation_audit_logs` table contains `id BIGINT UNSIGNED`, `actor_admin_id INT UNSIGNED`, `post_id INT UNSIGNED`, `previous_status`, `new_status`, `created_at DATETIME(3)`, plus browse/filter indexes.
- Rows are **append-only through HTTP/API** (only Admin GET, no public edit/delete). No foreign key cascade deletes past audit rows when actors or Posts are physically purged; actor and Post IDs remain for historical tracing. This is **not** cryptographically tamper-proof against privileged database operators. Long-term retention, export and data-erasure policies remain undecided.
- Atomic transaction: row lock `SELECT FOR UPDATE`, conditional status update and audit insertion in **one Sequelize transaction**. On failed audit insert, Post transition rolls back.
- Fresh disposable CI uses `database/schema.sql`; existing test/demo DBs must apply `database/migrations/20261024_moderation_audit_logs.sql` via reviewed manual procedure before using moderation API. `DB_AUTO_SYNC` is not authorization to mutate production.
- No new account lockdown, report/appeal, restore/delete permanently, manual preapproval or PDF scanning.

## Regression acceptance

`scripts/ubuntu/ext03-admin-audit-regression.cjs` runs 9 real HTTP/MySQL8 groups as a subprocess of existing DOC-04 suite. It covers one student/Admin, 401/403, 422/404/409, idempotency, correct transition and history, deliberate audit write failure rollback, pagination/filter, safe DTO and pre-existing suppressed Post visibility. Existing BE-08/BE-10, EXT-01/02, QA-04 and Chromium E2E must all PASS on exact PR HEAD. Draft PR until review; no auto merge/deploy.

No `server/src/app.js` or `client/**` edits: static read is scoped in `server/src/routes/post.routes.js`, avoiding overlap with DEP-01C/FE-01. No production/cloud, payment or `main` modifications.
