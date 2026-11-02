# ADM-01 — Admin content management API (Backend Phase)

Scope: admin-only, read-only post discovery and detail; existing Admin hide/delete
operation with optional auditable reason. No Student/Guest access to suppressed
content; no private PDF storage credentials in API DTO.

## Routes (require bearer token of active Admin)
- `GET /api/posts/moderation/posts?page=1&limit=10&status=active&type=document&search=CNPM&author_id=123`
  Optional filters: status (active/hidden/deleted), type (question/discussion/document),
  search (title only, escaped literal LIKE), author_id. page 1..10000, limit 1..50.
  No filter defaults to all statuses. Results ordered created_at DESC, id DESC.
  Each result: id, user_id, title, post_type, subject, status, created_at,
  author {id,full_name}. Uses envelope {success,data,pagination}.
- `GET /api/posts/moderation/posts/:id`: Admin-only safe Post DTO, including
  content/tags and suppressed status. No `file_url`, `file_name`, `storage_key`.
- `PATCH /api/posts/:id/moderation`: `{"status":"hidden","reason":"Nội dung không phù hợp"}`.
  Reason is optional for older clients; if supplied, trimmed 5–500 characters;
  control characters invalid. Only hidden/deleted transitions, no restoration.
  Atomic Post update + append-only moderation audit insert. Repeated same-state
  requests do not create a duplicate event.
- `GET /api/posts/moderation/audit-logs`: existing filters/page, adds nullable
  `reason` to the audit DTO. Old rows have reason=null.
- Guest -> HTTP 401, Student -> HTTP 403; query/path validation -> HTTP 422.

## Schema & safe rollout
Fresh disposable databases: `database/schema.sql` includes reason (nullable).
Existing databases require **one-time, additive** SQL migration:
`database/migrations/20261102_adm01_moderation_reason.sql`.
Confirm database, backup and permissions first. Check `information_schema.columns`
for `moderation_audit_logs.reason` before applying; **do not rerun the ALTER**.
Do not deploy the new Backend against an unmigrated shared/TiDB database:
the audit list projection selects reason and would fail. No automatic migration
and no direct production write are part of this PR.

## Frontend handoff (separate PR after Campus Pop #74 acceptance)
Admin navigation: searchable/paginated list -> inspect via admin detail ->
confirm hide/delete with required reason in UI -> inspect audit history.
Do not provide a Student route or direct signed PDF links. Existing UI's
status-only moderation call remains backward compatible until upgraded.
