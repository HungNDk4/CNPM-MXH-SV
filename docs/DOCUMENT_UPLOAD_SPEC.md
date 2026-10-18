# Free PDF Upload — Functional & Technical Draft
**DOC-01 direct PDF upload CONFIRMED** 2026-10-17; **ADR-011 Guest metadata / login download CONFIRMED** 2026-10-18; **ADR-012 10 MiB inclusive and 1 PDF/post CONFIRMED** 2026-10-18. **ADR-013 immediate publication after successful upload, post-moderation by Admin confirmed** 2026-10-18. Remaining storage/API/QA details DRAFT.
**Relevant requirements:** FR-11, FR-04, FR-05, FR-06; **tasks:** DOC-02, DOC-03, DOC-04, SEC-04; **extension:** FR-13/14 DEFERRED.

## 1. Scope / proposed constraints
- MVP document post has title, description, subject/category, uploader, created date, original display name, size, and downloadable **PDF** content.
- Only authenticated student accounts may UPLOAD (proposed, aligned with general write access); GUEST may browse **public metadata** but may NOT download PDF bytes (ADR-011 CONFIRMED 2026-10-18).
- **ADR-012 APPROVED:** each new document post carries exactly **1 PDF file**, **1 ≤ size_bytes ≤ 10,485,760** (10 MiB inclusive). Two files, empty file, non-PDF and any PDF of **10,485,761+ bytes** are denied. Need team review separately for per-user quota, file version/replacement, page count and retention.
- URL-based external sharing is **not the selected MVP path**; existing `file_url` code is not the new upload pipeline.
- PDF inline preview, document version history, OCR/text indexing, paid access and storage on third-party clouds are NOT automatically in scope.

## 2. Happy path (proposed UX)
1. Authenticated student clicks "Chia sẻ tài liệu", enters title/description/subject/tags and selects PDF.
2. Frontend checks extension/size for early UX; backend independently validates authenticated user, upload bounds, signature and acceptable type.
3. Store file outside public `/uploads`, generate unpredictable storage key, persist metadata and an active `document` post consistently.
4. Return public-safe DTO: post ID, metadata, safe download endpoint (but not a raw storage key/path). Show post on feed/search.
5. A GUEST opens public document details/metadata and sees a login prompt on download; an AUTHENTICATED viewer can download an active/free PDF through a backend-authenticated route. Provide errors for deleted/hidden/missing files.

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
- Restrict POST upload to authenticated users, and enforce ownership for edit/delete and moderation. **Access policy CONFIRMED ADR-011:** guest reads safe metadata only; file bytes/download require a valid login (401 otherwise). Do not infer that guests can access all non-document posts from this rule.
- Return file with appropriate Content-Type and safe Content-Disposition (prefer attachment until preview security is designed), no raw filesystem path. Do not enable public static `/uploads` for stored PDFs.
- Do not commit example user PDFs, personal documents or secrets; include copyright and prohibited-content guidance, report/remove workflow.

## 5. Proposed HTTP contract (not existing endpoints)
| Method | Route | Access | Action |
|---|---|---|---|
| POST | /api/documents | Auth | `multipart/form-data`, field `file` + metadata, create free document post |
| GET | /api/posts/:id | Guest/Authenticated for **active free document metadata** | Safe document metadata; no raw storage key; other post types pending ADR-002 |
| GET | /api/documents/:postId/download | **Authenticated active user required (ADR-011)** | 401 without valid login; check free+active document; attachment stream, no static URL |
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
| T-UP-08 | Guest direct download vs authenticated download | Guest 401; active logged-in student 200 and safe attachment; no raw path leakage |
| T-UP-09 | Direct POST old paid/order/payment callbacks | Denied (SEC-03), no wallet/order/entitlement effect |
| T-UP-10 | Multipart malformed field names / abort floods | Parser patched and bounded; no service crash (SEC-04) |

## 7. Engineering task split and human review
- **DOC-02:** guest download policy confirmed ADR-011 and PDF caps confirmed ADR-012; still decide retention, storage/deployment, moderation, safe file inspection; approve wireframe, model/migration and API.
- **SEC-04:** patched multipart library with security regression tests.
- **DOC-03:** backend upload with storage and DB metadata (branch + PR).
- **DOC-04:** post detail/upload/download frontend integration and ownership cleanup.
- **QA:** tests T-UP-01..10, evidence on disposable DB, docs updated.
- **Owners:** Human A reviews design, Human B module ownership currently UNASSIGNED, AI drafts/implements by reviewed task. No claimed QA PASS.

## References checked 2026-10-17
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Express/Multer middleware docs: https://expressjs.com/en/resources/middleware/multer/
- GitHub reviewed advisory: https://github.com/advisories/GHSA-wc9g-mqfw-jrwm

## 8. Approved access flow ADR-011 (2026-10-18)
1. Guest requests active/free PDF metadata: return safe DTO with title, description, subject, uploader and public fields; **never** a file URL, storage path/key or bytes.
2. Guest presses Download: client prompts login; if bypassing UI and calling download API directly, backend returns 401 and no file content.
3. Authenticated student downloads another student's active/free PDF: backend verifies session and post state, streams attachment; no raw static file URL.
4. Hidden/deleted or paid documents remain inaccessible through this MVP path even for authenticated users until separately approved.
5. Filename, storage and Content-Disposition safety constraints still apply; inline preview is out of decision scope.

**Reference:** [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md). These are requirements, **not implemented or tested**.

## 9. Approved PDF size & count limits — ADR-012 (2026-10-18)
- **Unit:** MiB (binary), not MB decimal. `MAX_PDF_BYTES = 10 * 1024 * 1024 = 10485760`.
- **Per document post:** EXACTLY 1 PDF file. Multipart request with 0 files / >1 file (even if both under cap) fails; never silently ignore extra files.
- **Size:** valid positive PDF with exactly **10,485,760 bytes passes the size-boundary check**; 10,485,761 bytes rejected (413 suggested); zero bytes rejected as invalid (400/422 suggested). Passing the size boundary does **not** override content/PDF security checks.
- **Server:** enforce limits at multipart parser and validate true byte count after receipt, MIME/extension and file header/content; stream/drop excess without exhausting memory. Stop/clean temporary writes and avoid database records on failure. Restrict fields/parts to bounded values.
- **Client UX:** allow selection of only one PDF, display “Tối đa 10 MiB (10.485.760 byte)”; invalid/oversize message without creating a post; backend remains authoritative.
- **Test IDs:** T-UP-LIM-01..06. Existing `T-UP-04` now uses fixed 10 MiB cap. Tests have NOT RUN; implementation NOT STARTED.
- **Not approved:** PDF replacement after posting, number of posts per user, malware scanning vendor, or storage provider. See [DECISIONS.md](DECISIONS.md), ADR-012.

## 10. ADR-013 — Publish immediately after validated PDF, Admin moderation afterwards
```text
Student login → select 1 PDF ≤ 10 MiB → validate metadata/file
  → securely store PDF → persist post + file metadata atomically
  → mark post active → success → guest-safe list/detail/search
  → signed-in Student download (login check and latest post status)
Admin finds violation → mark hidden/deleted → public metadata excluded
  → all ordinary direct PDF download attempts denied
Any failure before successful save/commit → no active post, clean temp/orphan data
```
- **Product rule APPROVED (2026-10-18):** no manual admin approval before public release; `active` follows successful upload/validation/persistence. The source already has `active|hidden|deleted` statuses, but must implement full lifecycle/authorizations; no new `pending_approval` state is required for this MVP.
- Use a DB+file failure-compensation strategy to prevent public/orphan rows/files; protect against direct static URL, cache bypass and hidden/deleted file downloads. No admin permission should be inferred from frontend buttons alone.
- Admin **hide/delete post-publication** is approved. Reporting by other users, admin appeal/reinstatement and detailed moderation interface remain PROPOSED, not approved.
- Filename/type checks are not comprehensive malware scanning; required security architecture remains under review.
- **T-PUBLISH-01..06 NOT RUN**. See [TEST_PLAN.md](TEST_PLAN.md) and [DECISIONS.md](DECISIONS.md).

## 11. Public online availability ADR-015 (CONFIRMED human requirement, vendor DRAFT)
- The final website must run at a **public HTTPS link without student's laptop**, with relational data and uploaded PDFs surviving app redeploy/restart. Local disk beside a serverless function is NOT durable storage.
- On Vercel Functions, maximum body payload is **4.5 MB**, smaller than the 10 MiB accepted PDF. If this platform is selected, browser must upload directly to **private** object storage using a short-lived backend-authenticated token (with one-file, user and MIME constraints), then backend verifies the actual stored object size/type/content and DB ownership **before** publishing `active`. Failed/oversized uploads cleaned. Download through authenticated streaming; hidden/deleted/paid path blocked, raw URLs not exposed.
- Vercel Hobby + TiDB Starter + Vercel Blob Private is **one candidate**, not approved. TiDB SQL/Sequelize compatibility, cloud quotas, public uptime and private-Blob protocol require DEP-01 integration PoC; upload E2E NOT RUN. See [ONLINE_DEPLOYMENT_OPTIONS.md](ONLINE_DEPLOYMENT_OPTIONS.md), ADR-015.
