# Document Access Policy — ADR-011
**Version:** 0.1 · **Decision confirmed by Human A:** 2026-10-18 (Asia/Ho_Chi_Minh). **Implementation:** NOT IMPLEMENTED. **Human B / detailed SRS review:** PENDING.

## Approved rule
For free/public/active PDF documents only: **guests can discover and read public metadata (list, title, description); login is required to download PDF bytes.** No source code change occurs by approving this rule.

## Permission matrix — MVP
| Action | Guest (no session) | Student (authenticated) | Admin (authenticated) |
|---|---|---|---|
| List/search active free PDF metadata | ALLOW | ALLOW | ALLOW |
| Read safe metadata (title, description, subject, uploader) | ALLOW | ALLOW | ALLOW |
| Upload new free PDF | DENY (401) | ALLOW | Role/policy for admin uploads OPEN |
| Download active/free PDF bytes | DENY (401) | ALLOW | ALLOW |
| Edit/delete own document | DENY (401) | ALLOW (owner) | Moderation policy DRAFT |
| Download hidden/deleted documents | DENY | DENY | No ordinary download; moderation access requires separate design |
| See/download paid PDF | DENY | DENY in MVP | DENY in MVP (feature disabled) |

**Important:** only access for **free PDF document metadata** is decided here. Whether a guest may browse *all* questions, discussions and other feed posts is still ADR-002 PROPOSED, not approved by this narrower decision.

## API and UX acceptance
- Feed/search/detail: return *safe public metadata*, only for active/free PDF documents. Do not serialize `storage_key`, `file_url`, absolute path or any public/signed file URL capable of bypassing login. Whether to show inert download endpoint text in metadata is design-level open; preferably just `canDownload: false/true`.
- On guest download click: frontend invites login and can return to document detail afterwards.
- Direct API access must independently validate current active session; missing/invalid/expired token **401 with no bytes**. CORS and hiding buttons do not enforce access rights.
- Authenticated active student downloading any active/free document (not only their own) receives a valid PDF attachment (200). Header `Content-Disposition: attachment` with sanitized filename; no public static `/uploads`.
- Hidden/deleted/unavailable documents, paid docs, disabled users and cross-user edit/delete must obey server-side authorization and reject. Exact 403 vs 404 concealment behavior remains DRAFT.
- No university-email verification assumed, and **PDF inline preview was not approved**.
- **Historical ADR-011 boundary:** Guest/download decision did not itself approve upload caps; Human A **subsequently approved** 10 MiB and 1 PDF/post in **ADR-012 (2026-10-18)**. See [DECISIONS.md](DECISIONS.md).

## Negative test mapping (NOT RUN)
| ID | Test | Expected |
|---|---|---|
| T-DOCFREE-01 | Guest GET list/search/details of active free PDF | 200 + safe title/description metadata; no file bytes/keys/URLs |
| T-DOCFREE-02 | Guest direct GET download | 401; no file bytes, storage path or redirect |
| T-DOCFREE-03 | Invalid/expired token direct GET download | 401; no file bytes |
| T-DOCFREE-04 | Logged-in student GET another student's active/free PDF | 200 attachment; correct file and safe filename |
| T-DOCFREE-05 | Guest or student GET hidden/deleted/paid document | No unauthorized bytes/URLs; document state rules enforced |
| T-DOCFREE-06 | Guest POST upload or student modify other's PDF | 401 for guest; 403 for unauthorized student; no stored changes |

## Technical tasks/dependencies
- DOC-02: finalize API/authorization matrix with ADR-011 and size/count with ADR-012; select storage, retention and state concealment.
- DOC-03/04: implement server-side authenticated download, safe public DTO, file storage and UI login CTA only after design review.
- SEC-04: upgrade multipart parser from known vulnerable Multer 1.x before enabling upload; SEC-01/03 block legacy paid exposure.
- BE-01/ADR-002: separately decide/implement Guest access to *general posts* if desired.
- CI or source-only checks do not verify T-DOCFREE tests; require runtime tests on temporary MySQL data.

## Subsequent ADR-013 — Public after successful upload; Admin may hide/delete
Human A confirmed (2026-10-18): a free PDF becomes `active` and publicly discoverable immediately after safe upload, file storage and DB commit, without manual Admin approval. The Guest metadata vs authenticated download split remains as in ADR-011. Admin hide/delete after publication must revoke public metadata and normal download eligibility **immediately at server-side status checks**. Report/appeal flow and exact backend response code for concealed records remain DRAFT. See [DECISIONS.md](DECISIONS.md) and [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md).
