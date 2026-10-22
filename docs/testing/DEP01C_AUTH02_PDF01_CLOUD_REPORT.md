# DEP-01C — AUTH-02 → PDF-01: Real Render/TiDB/Private Blob Acceptance

**Executed:** 2026-10-22 16:42:02–16:42:14 UTC (23:42:02–23:42:14 ICT).
**Verdict:** AUTH-02 **PASS**, PDF-01 **PASS** for one small synthetic PDF and one disposable identity. Overall DEP-01C **IN_PROGRESS**; complete security and release gates remain open.

## Grounded environment and execution

- Public origin: https://mini-study-network-dep01-demo.onrender.com
- Render Free: `srv-dbcg9rbrjlhs73bc8870`, deployment `dep-dbd38o2vcj2c739h61sg` LIVE, deployed application SHA `71499dfd63d21feb019d6144efcadc7ee9232951`.
- Backend: Node/Express + Sequelize; actual TiDB Cloud Starter MySQL Compatible instance, not local/MySQL CI service.
- Storage: current server's `DOCUMENT_STORAGE_DRIVER=vercel-blob` (as configured on Render); private SDK adapter route exercised through real upload/download. No Vercel token read, exported or printed.
- Acceptance script commit: `c4446867e702dca49cfac72d2edfdbad4ca55e5d`, [Draft PR #35](https://github.com/HungNDk4/CNPM-MXH-SV/pull/35). Workflow [39816112003](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39816112003) **completed SUCCESS**, real-cloud job completed success. Companion source CI [39816111681](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39816111681) **SUCCESS**.
- Runner used Node 24, HTTPS `fetch` with TLS verification and `redirect:error`. No credentials or JWTs logged or committed.

## Actual HTTPS test matrix

| ID | Action | Observed | Verdict |
|---|---|---|---|
| LIVE-00 | `GET /api/health` | 200; `success:true` | PASS |
| AUTH-02.1 | Register new synthetic user | 201, access/refresh JWT issued | PASS |
| AUTH-02.2 | `GET /api/auth/me` using bearer JWT | 200 | PASS |
| AUTH-02.3 | Password login | 200 | PASS |
| AUTH-02.4 | Refresh using valid token | 200; replacement JWT differs from original | PASS |
| AUTH-02.5 | Retry prior rotated refresh token | 401 | PASS |
| AUTH-02.6 | Logout with newly issued refresh token | 200 | PASS (response only) |
| AUTH-02.7 | Retry logged-out refresh token | 401 | PASS — revocation proven for that token |
| PDF-01.1 | Upload one syntactically valid PDF (621 bytes) | 201, response omitted `.blob.vercel-storage.com` URL | PASS |
| PDF-01.2 | Guest direct PDF download | 401 | PASS |
| PDF-01.3 | Authenticated download | 200; exact 621 bytes and SHA256 equality | PASS |
| PDF-01.4 | Soft-delete test post `id=1` | 200 | PASS |
| PDF-01.5 | Authenticated download after deletion | 404 | PASS |

**Interpretation:** AUTH-02 token rotation/reuse/logout revocation worked for the tested session. PDF-01 verifies one actual private storage round-trip with strict byte comparison and backend visibility revocation. No claim of direct storage-key URL resistance beyond returned payload review, full authorization matrix or other file sizes.

## Cleanup inventory (owner action, pending)

- Test identity **created by this cloud runner**: `dep01c-live-39816112003-aa9ea81a@example.invalid`. Random password and tokens existed only in GitHub runner memory. Account remains until owner-controlled deletion.
- Post **id=1** was **soft-deleted**, not hard-deleted. `document_files` row and private Blob object are still expected to exist; blob object name is an internal UUID key, deliberately not exposed in the upload response.
- Two historical synthetic accounts from prior failed JWT test also remain: `dep01c-20261022t154651z-a@example.invalid`, `dep01c-20261022t154651z-b@example.invalid`.
- **Do not rerun PR #35 workflow before owner approves additional test fixtures.** A re-run generates another account + private PDF object.
- Recommended **read-only reconciliation** inside the isolated TiDB test database before any removal:

```sql
USE mini_study_network;
SELECT u.id AS user_id, u.email, p.id AS post_id, p.status,
       df.storage_key, df.size_bytes, df.sha256
FROM users AS u
LEFT JOIN posts AS p ON p.user_id = u.id
LEFT JOIN document_files AS df ON df.post_id = p.id
WHERE u.email IN (
  'dep01c-live-39816112003-aa9ea81a@example.invalid',
  'dep01c-20261022t154651z-a@example.invalid',
  'dep01c-20261022t154651z-b@example.invalid'
);
```

Owner must first identify the private Blob UUID via read-only query, then delete that exact private object using their own authenticated Vercel access and confirm provider deletion, then reconcile child/parent SQL rows using verified schema constraints. This assistant **did not execute cleanup** and must not label it done.

## Not covered — future QA

- DOC boundaries **10,485,760 B inclusive and 10,485,761 B**; spoofed/dual multipart files; no orphan on failure.
- Cross-account authenticated download vs unauthorized mutation, 403 ownership checks, Admin moderation (hide/delete), later access denial from multiple users.
- Whole-app browser workflows for PDF; PDF viewer; CSP/CORS from alternative networks.
- TiDB raw SQL, foreign key/JSON/transaction rollback checks and persistence after Render restart/redeploy/idle.
- Paid-route comprehensive denial, quota/rate limit, full security audit; no G5/G6/DEP-02 human acceptance.

## Provenance and change control

User explicitly requested `AUTH-02 → PDF-01`. Tests run only through a dedicated same-repository Draft PR #35, whose GitHub Actions workflow is restricted to exact PR base/head; it uses no repository/cloud secrets. The Render auto-deployed source branch `feat/dep01c-render-tidb-blob-poc-20261022` is unchanged. PR #34 contains documentation/evidence only. No app redeploy, paid account, credential change, merge to `main`, production personal data or real student file was involved.
