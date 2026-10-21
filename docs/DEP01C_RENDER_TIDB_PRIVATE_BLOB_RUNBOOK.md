# DEP-01C — Render Free + TiDB Cloud Starter + Vercel Blob Private

**Status:** SOURCE PREVIEW / REMOTE CLOUD E2E NOT RUN. Do not call the existing Vercel health-only PoC the complete website. This task implements the *code path* for an isolated 1–3 month coursework demo with a $0 recurring fee target, not permission to buy credits or use real user data.

## Intended topology
- **One Render Free Node/Express service** runs the production React Vite build (same HTTPS origin, so all React `/api` calls go to Express, avoiding Vercel Functions' 4.5MB request/response body limit).
- **TiDB Cloud Starter Free** is MySQL-protocol compatible. Database must be created as a disposable nonproduction instance, TLS enabled and hostname/CA verification on; verify foreign keys, ENUM, JSON, timestamps and transactions before calling schema compatible.
- **Vercel Blob Private** keeps PDF bytes outside Render's ephemeral disk. Private Blob store `store_nrzupcGOuJobNPJs` (SIN) was created empty; token must be set only in the Render dashboard secret config, never in GitHub. `DocumentFile.storage_key` remains an internal UUID PDF key, without provider URL in public DTO.

## Cloud application setup (only after human approves provider/account)
1. TiDB dashboard: create **Starter Free**, isolated test instance, no payment upgrade. Get public endpoint, username with account prefix, database name and password. Import schema and `database/migrations/20261021_document_files.sql` into disposable database only; both SQL scripts contain `USE mini_study_network`, so verify the exact name before executing. Do not migrate real data or run Sequelize alter/sync.
2. Render dashboard: authorize GitHub repo `HungNDk4/CNPM-MXH-SV`, choose the reviewed deployment branch, **plan Free**, use `render.yaml` as non-secret Blueprint configuration or the same build/start commands manually. Keep automatic deploy OFF while human review is pending.
3. Render environment must contain: `NODE_ENV=production`, `SERVE_CLIENT_DIST=true`, `DB_AUTO_SYNC=false`, `TIDB_CLOUD=true`, `TIDB_ENABLE_SSL=true`, `DOCUMENT_STORAGE_DRIVER=vercel-blob`, `DB_HOST/PORT/NAME/USER/PASSWORD`, independent high-entropy `JWT_ACCESS_SECRET/JWT_REFRESH_SECRET`, `CLIENT_URL=https://<actual-render-subdomain>.onrender.com`, and `BLOB_READ_WRITE_TOKEN` for the private store. Never display/copy tokens in issue/PR or logs. Node built-in CA is sufficient for TiDB Starter by default; `TIDB_CA_PATH` optional.
4. Existing local MySQL and disk-backed PDF tests use the default filesystem driver. Production switches only with `DOCUMENT_STORAGE_DRIVER=vercel-blob`. SDK `@vercel/blob >=2.3` needed; `server/package.json` and `server/package-lock.json` must agree before Render `npm ci`. The backend fails closed during startup when storage config is incomplete.

## Release gates: all must actually run, not just pass offline mocks
- `npm ci` both packages; `npm run build` client; backend syntax and offline private Blob adapter/TiDB TLS/static-SPA tests; existing real MySQL + Chromium 12/12.
- **External** Render HTTPS from non-local network and from a device with student computers powered off; document cold-start after 15m idle (about 1min).
- **Actual TiDB** TLS+Sequelize authentication, migration schema, FK/ENUM/JSON, rollback, own-post permission invariants.
- **Actual Blob Private** auth upload max 10,485,760 bytes inclusive, 10MiB+1 rejected (413), spoofed 415, anonymous 401, cross-user free download byte equality, cross-user mutation 403, hidden/deleted 404, no public Blob URL or token in responses.
- Redeploy/sleep+resume while maintaining Post DB state and PDF bytes; monitor $0 limits; no paid tier, billing or invoice without new human approval.
- Clean sample fixtures when finished and delete cloud resources after the 1–3 month coursework window.

## Constraints and rollback
Render Free local files are wiped after idling or redeploy. Render Free may suspend unusually high outbound public-network traffic, including remote TiDB and Blob operations. It provides no uptime SLA. If the real combined stack fails free-tier availability/quota/security gates, mark candidate BLOCKED and do not quietly move to paid tier, bypass auth, downgrade PDF 10MiB, or repurpose `main`.

Official docs:
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://docs.pingcap.com/developer/dev-guide-sample-application-nodejs-sequelize/
- https://vercel.com/docs/vercel-blob/private-storage
- https://vercel.com/docs/vercel-blob/using-blob-sdk
