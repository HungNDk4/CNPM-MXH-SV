# DOC-02 — Private PDF storage design and execution contract

**Date:** 2026-10-21 · **Status:** ENGINEERING DESIGN CANDIDATE, no live provider selected or deployed.  
**Scope:** DOC-02 prepares DOC-03 upload and DOC-04 authenticated download.  
**Baseline:** `integration/team-dev-20261020` with Human A accepted API Contract v1 (#11/#22). PR #20/21/23/24 are not necessarily integrated: verify current GitHub refs before implementation.

## Approved product invariants

- Only **one** PDF per document post; byte length `1..10485760` inclusive (ADR-012).
- Guest sees **active/free** PDF metadata only, not bytes; valid active JWT required for download (ADR-011). General Guest feed remains ADR-002 OPEN.
- On verified success, persist metadata and PDF, then publish post as `active`; no admin preapproval (ADR-013). Hidden/deleted and legacy paid PDFs never stream to ordinary callers, **including owner**.
- Public HTTPS service independent of team laptops; persistent private bytes and SQL across deploy/restart (ADR-015). Keep student costs limited (ADR-014). Do not purchase/activate billable tiers without human authorization.
- No protected bytes served through `/uploads` static paths, raw storage URLs, or publicly readable object keys (SEC-01 / #23).
- Patched Multer >=2.3.0 (#24 provides 2.4.0), before an Express multipart endpoint is exposed.

## Architecture decision: portable adapter, two transports

Define `DocumentStorage` interface `put({key,stream,sizeLimit})`, `open(key)`, `remove(key)`, and `stat(key)`. Keys are random opaque UUIDs; no user-selected path segments. Only backend code knows storage key. Never return it in SafePost. Implement a private disk adapter **for development/integration testing only**, outside `server/uploads` and the served webroot. The final provider is **OPEN**, not assumed to be Vercel or local disk.

The production transport MUST be chosen from verified deployment capability:

1. **Persistent Node server with a durable private volume:** backend can receive one bounded 10 MiB PDF via Multer 2.4, validate then save using the adapter. A local disk next to serverless app **does not meet ADR-015**.
2. **Serverless platform with <10 MiB request-body limit (e.g. proposed Vercel Functions):** DO NOT send PDF bytes to the Function. Issue a short-lived, authenticated single-object upload capability, upload **directly to private object storage**, then verify actual object bytes/type/size and calling user before publishing. Never mint a public/read link and never trust claimed client file metadata. A basic adapter API is insufficient to implement this transport without explicit provider support.

Use the same database model, authorization checks and safe DTO across both transports. Do not deploy production upload until one transport proves 10 MiB E2E and private access.

## Proposed persistence — separate migration PR

`document_files` (one-to-one `posts`):
- `id` BIGINT/UNSIGNED primary key; `post_id` UNIQUE FK to posts with appropriate lifecycle; `uploader_id` FK to users.
- `storage_key` opaque UNIQUE (never in HTTP responses); `original_filename` sanitized display value; `mime_type` fixed `application/pdf`; `size_bytes` unsigned; `sha256` hex; `created_at`, `updated_at`.
- DB indexes/constraint and Sequelize associations designed to match existing MySQL 8. Do not silently sync or alter existing developer/production databases; use a reversible, reviewed migration and disposable MySQL test instance.

A post's existing `file_url`/paid-document legacy values are **not migrated automatically** into private PDFs, and a legacy URL is never sufficient authorization. Disable new legacy PDF creation until actual upload path exists (#23).

## Security and error behaviors to implement

`POST /api/documents`: authenticated, `multipart/form-data` with exactly one `file` and validated title/content/subject/tags. Reject zero/extra files, invalid PDF extension/MIME/magic/content, oversize (413), invalid type (415), invalid metadata (422), Guest (401), malformed multipart/limits and abort without DB-active post or orphan object. Restrict fields, parts, header pairs, filename and max per-request bytes; mitigate slow/aborted streams. A `%PDF-` header alone is **not a malware verdict**; document scanning/CDR residual risk and disallow active content/inline preview for MVP.

`GET /api/documents/:postId/download`: authenticate **before** any storage lookup, check current DB `active`/`document`/`price=0`, verify stored file exists and is associated with post. Guest/expired/invalid JWT ->401; missing, hidden/deleted, paid, legacy or missing blob ->404 without redirect/bytes. Stream with `Content-Type: application/pdf`, `Content-Disposition: attachment` with sanitized filename, and `Cache-Control: private, no-store`; do not emit `Location` to a public object. No unsafe `express.static` fallback.

Upload lifecycle: reserve a private temporary object (or provider-specific pending object), validate server-side, create `posts + document_files` in an SQL transaction, mark `active` **only after** durable private storage is confirmed. Compensate on failed transaction by deleting new private object; reconcile interrupted/pending uploads. Moderation can hide/delete immediately and download checks latest DB status on every request. Physical deletion/retention policy remains OPEN: default deny serving as soon as post becomes hidden/deleted rather than force-delete evidence without authorization.

## Stepwise implementation and gates

- **DOC-02 deliverable:** this portable design, threat assumptions and the remaining provider-specific decision. Documentation only; no provider registration, billing or deployment.
- **DOC-03:** branch from security integration that includes #20 (payment off), #23 (SafePost/static deny) and #24 (patched Multer). Add reviewed MySQL migration, storage adapter, metadata and upload service, and negative tests (T-UP-01..06, T-UP-LIM-01..06, T-PUBLISH-01..06). CI with disposable MySQL/private temp dir. If production target is serverless, ship **adapter/tests without enabling an incompatible public production multipart route**.
- **DOC-04:** implement authenticated download API and regression Guest / Student A/B / hidden / deleted / legacy paid / missing blob, plus guest metadata/login CTA in React only after confirming UI task ownership. No raw storage URL; ensure `Cache-Control: no-store` and verify server response headers. Browser E2E and 10 MiB boundary tests required.
- **Cloud readiness:** PoC private object store, actual SQL migration and upload/download under HTTPS, 10 MiB actual bytes, restart/redeploy persistence, external unauthenticated direct-read denial, quota/billing checks. These are NOT currently proven by local/CI unit tests.

## Required verification evidence

Record each `T-UP-01..10`, `T-DOCFREE-01..06`, `T-UP-LIM-01..06`, `T-PUBLISH-01..06` as PASS / FAIL / NOT RUN with exact commit and CI run. Test two users, malformed/extra parts, 10 MiB inclusive/10 MiB+1, orphan cleanup after DB failure, and stream cancel/error. Do not call SEC-01's existing 15/15 negative tests proof of end-to-end upload/download.

**Pending external choice:** affordable persistent Node + private durable volume **versus** serverless + private direct-to-blob upload. Human A's instruction authorizes preparation and source development, but does not authorize paid services, provider accounts, or deployment of private documents.
