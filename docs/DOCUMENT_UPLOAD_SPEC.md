# Free PDF Upload — Functional & Technical Draft
**2026-10-17. Product choice DOC-01:** **CONFIRMED by Human A**: directly upload PDF to the website, not external-link-only. **Detailed design / tests / size cap:** DRAFT, awaiting review.
**Relevant requirements:** FR-11, FR-04, FR-05, FR-06; **tasks:** DOC-02, DOC-03, DOC-04, SEC-04; **extension:** FR-13/14 DEFERRED.

## 1. Scope / proposed constraints
- MVP document post has title, description, subject/category, uploader, created date, original display name, size, and downloadable **PDF** content.
- Only authenticated student accounts may UPLOAD (proposed, aligned with general write access); PDF visibility/download for GUEST is **UNDECIDED**.
- Initial cap **10 MiB per PDF** and **1 PDF per document post** are engineering proposals, NOT approved decisions. Need team review for exact limit, quota/user, PDF page count and data retention.
- URL-based external sharing is **not the selected MVP path**; existing `file_url` code is not the new upload pipeline.
- PDF inline preview, document version history, OCR/text indexing, paid access and storage on third-party clouds are NOT automatically in scope.

## 2. Happy path (proposed UX)
1. Authenticated student clicks "Chia sẻ tài liệu", enters title/description/subject/tags and selects PDF.
2. Frontend checks extension/size for early UX; backend independently validates authenticated user, upload bounds, signature and acceptable type.
3. Store file outside public `/uploads`, generate unpredictable storage key, persist metadata and an active `document` post consistently.
4. Return public-safe DTO: post ID, metadata, safe download endpoint (but not a raw storage key/path). Show post on feed/search.
5. An authorized viewer opens details and downloads via backend-controlled route. Provide errors for deleted/hidden/missing files.

## 3. Architecture proposal — NOT IMPLEMENTED
```text
React form (multipart/form-data)
  -> authenticated upload endpoint (suggest POST /api/documents)
     -> security middleware + multipart parser
     -> validate PDF, metadata, size and max file count
     -> file storage: private path / configured durable object storage
     -> DB insert: posts(post_type=document, price=0) + proposed document_files metadata
  -> response DTO
View -> GET /api/posts/:id (safe metadata)
Download -> GET /api/documents/:postId/download (check policy & status) -> attachment stream
```
- **Proposal**: `document_files` table (id, post_id UNIQUE FK, uploader_id, storage_key UNIQUE, original_filename, mime_type, size_bytes, sha256, created_at). Model and migration need human review; do not change production schema in this PR.
- Implement atomic behavior for metadata/file lifecycle: if file storage succeeds but DB fails, delete stored orphan; if DB save succeeds but storage fails, roll back record; delete flow must prevent broken access and handle cleanup.
- Existing posts have `file_url`, `file_name`, `price`; design must specify migration/compatibility and **never return paid raw URL** in feed/detail or allow paid creation while extension is deferred.
- Local disk outside Express static root is possible for offline demo only if deployment persists files; ephemeral serverless filesystem is not reliable permanent storage. Storage provider/deployment architecture needs explicit choice.

## 4. Security acceptance (block feature until satisfied)
- Multer in `server/package.json` is `^1.4.5-lts.1`. **Do not enable uploads on this outdated 1.x dependency**. Official advisory GHSA-wc9g-mqfw-jrwm describes malformed field-name DoS affecting **<2.3.0**; upgrade to patched version **2.3.0 or newer** and verify exact compatible release/lockfile and regression, in a **separate PR**. Other advisories may require later versions: recheck security advisories at implementation time.
- Validate extension (PDF allowlist), MIME and file contents/signature, not Content-Type header alone. A PDF header check alone is NOT sufficient for full malware safety; consider scan/CDR where practical, otherwise document residual risk and constrain serving behavior.
- Limits on fileSize, files, fields, parts and field names; handle partial/aborted uploads and clean temp files; rate limits/quotas; generated filename; store outside webroot; no path traversal.
- Restrict POST upload to authenticated users, and enforce ownership for edit/delete and moderation. **Access/download policy** must explicitly decide guest eligibility; don't infer from guest feed.
- Return file with appropriate Content-Type and safe Content-Disposition (prefer attachment until preview security is designed), no raw filesystem path. Do not enable public static `/uploads` for stored PDFs.
- Do not commit example user PDFs, personal documents or secrets; include copyright and prohibited-content guidance, report/remove workflow.

## 5. Proposed HTTP contract (not existing endpoints)
| Method | Route | Access | Action |
|---|---|---|---|
| POST | /api/documents | Auth | `multipart/form-data`, field `file` + metadata, create free document post |
| GET | /api/posts/:id | Pending guest/post visibility policy | Safe document metadata; no raw storage key |
| GET | /api/documents/:postId/download | **PENDING ADR** | Validate post status + authorization; attachment response |
| DELETE | /api/posts/:id | Owner/admin | Soft delete post, revoke access; physical file retention/cleanup policy TBD |

Response/error draft: 201 created with ID/meta; 400 invalid data; 401 unauthenticated upload; 403 denied; 404 missing/hidden; 413 exceeds size; 415 not a valid allowed PDF; 429 quota/rate limit. Exact response bodies and path naming subject to API contract review.

## 6. Test acceptance matrix (NOT RUN)
| ID | Scenario | Expected |
|---|---|---|
| T-UP-01 | Valid PDF + authenticated student | 201 + post/metadata persisted and file retrievable |
| T-UP-02 | Guest POST file | 401, no file persisted |
| T-UP-03 | .exe renamed .pdf / wrong signature / suspicious PDF | Reject, cleanup |
| T-UP-04 | PDF over approved limit / too many parts/files | Reject with proper 4xx, no orphan |
| T-UP-05 | Upload interrupted / DB transaction failure | No orphaned blob or inconsistent post |
| T-UP-06 | Student edits/deletes another student's document | 403, no file changes |
| T-UP-07 | Hidden/deleted post, direct static URL attempts | Reject access; raw path never exposed |
| T-UP-08 | Valid download, download policy for guest/other student | Policy-specific 200 or 401/403, safe filename |
| T-UP-09 | Direct POST old paid/order/payment callbacks | Denied (SEC-03), no wallet/order/entitlement effect |
| T-UP-10 | Multipart malformed field names / abort floods | Parser patched and bounded; no service crash (SEC-04) |

## 7. Engineering task split and human review
- **DOC-02:** decide guest download, size, count, retention and storage; approve wireframe, model/migration and API.
- **SEC-04:** patched multipart library with security regression tests.
- **DOC-03:** backend upload with storage and DB metadata (branch + PR).
- **DOC-04:** post detail/upload/download frontend integration and ownership cleanup.
- **QA:** tests T-UP-01..10, evidence on disposable DB, docs updated.
- **Owners:** Human A reviews design, Human B module ownership currently UNASSIGNED, AI drafts/implements by reviewed task. No claimed QA PASS.

## References checked 2026-10-17
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Express/Multer middleware docs: https://expressjs.com/en/resources/middleware/multer/
- GitHub reviewed advisory: https://github.com/advisories/GHSA-wc9g-mqfw-jrwm
