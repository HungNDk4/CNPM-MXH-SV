# DEP-01C — Render Free + TiDB Cloud Starter + Vercel Blob Private

**Status:** SOURCE PREVIEW / REMOTE CLOUD E2E NOT RUN. Do not call the existing Vercel health-only PoC the complete website. This task implements the *code path* for an isolated 1–3 month coursework demo with a $0 recurring fee target, not permission to buy credits or use real user data.

## Latest operational attempt — 2026-10-22

**BLOCKED on Render API authentication.** Human A supplied the existing service `srv-dbcg9rbrjlhs73bc8870`, deploy `dep-dbcg9s3rjlhs73bc8b70`. Reuse this service; do not provision another one. The service's current Free plan, runtime state, public origin and live environment have **not** been independently verified.

- Checked out PR #33 source head `fa1014b4cbdb7fc74d54295ee323d4f43c9eeebb` on the specified feature branch with a clean working tree. Exact-head source CI [39654759429](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39654759429) succeeded; this is not cloud runtime evidence.
- Ran `node scripts/dep01c-render-env.cjs --dry-run`, then repeated with the supplied service ID in the child process environment. Both exited **1** before reading/writing Render because `RENDER_API_KEY` is absent. The service ID is now known; the helper's generic error mentions both inputs, but **only the API key remains missing from the Render preflight inputs**. An unauthenticated GET of this exact service's Render API endpoint returned **HTTP 401**. The dashboard deploy link was inaccessible through the available web reader.
- The namespaced private inputs `DEP01_TIDB_DB_HOST`, `DEP01_TIDB_DB_PORT`, `DEP01_TIDB_DB_NAME`, `DEP01_TIDB_DB_USER`, `DEP01_TIDB_DB_PASSWORD`, `DEP01_PRIVATE_BLOB_TOKEN` are absent from both the execution process and user environment. This does **not** prove their corresponding Render variables are missing: remote environment inventory is blocked by authentication. Do not substitute a development DB or invent credentials.
- Vercel management API read of the existing store succeeded: `store_nrzupcGOuJobNPJs`, `access=private`, `status=available`, `region=sin1`, `count=0`, `size=0`, quota not exceeded. No secret values were printed or copied. This proves store metadata access only, **not** authenticated application Blob reads/writes or TiDB connectivity.
- **NOT RUN:** `--apply`, missing-JWT initialization, Render redeploy, live Deploy Logs, real HTTPS `/api/health`, TiDB SQL/TLS authentication, application Blob byte operations and cloud E2E. No configuration, deployment, billing or cloud data was changed. The earlier filesystem-startup error in Issue #32 is human-provided historical evidence, not a freshly observed runtime error.
- Local helper safety tests `node --test scripts/ubuntu/dep01c-render-env.test.cjs`: **4/4 PASS** (mocked Render responses). They do not establish provider access or live configuration success.

To unblock, expose `RENDER_API_KEY` privately to the actual Codex execution process, keeping the known service ID. Never paste it into chat/GitHub or place it in source, logs or command-line arguments. Rerun the same dry-run to verify service repo/branch/Free plan and inventory; then apply the already-authorized configuration. Only after required keys and actual TiDB/private-Blob connectivity are verified should the existing Free service be redeployed and its real HTTPS origin tested. No new approval for routine configuration is needed; provider credentials are the missing prerequisite.

## Intended topology
- **One Render Free Node/Express service** runs the production React Vite build (same HTTPS origin, so all React `/api` calls go to Express, avoiding Vercel Functions' 4.5MB request/response body limit).
- **TiDB Cloud Starter Free** is MySQL-protocol compatible. Database must be created as a disposable nonproduction instance, TLS enabled and hostname/CA verification on; verify foreign keys, ENUM, JSON, timestamps and transactions before calling schema compatible.
- **Vercel Blob Private** keeps PDF bytes outside Render's ephemeral disk. Private Blob store `store_nrzupcGOuJobNPJs` (SIN) was created empty; token must be set only in the Render dashboard secret config, never in GitHub. `DocumentFile.storage_key` remains an internal UUID PDF key, without provider URL in public DTO.

## Cloud application setup (only after human approves provider/account)
1. TiDB dashboard: create **Starter Free**, isolated test instance, no payment upgrade. Get public endpoint, username with account prefix, database name and password. Import schema and `database/migrations/20261021_document_files.sql` into disposable database only; both SQL scripts contain `USE mini_study_network`, so verify the exact name before executing. Do not migrate real data or run Sequelize alter/sync.
2. Render dashboard: authorize GitHub repo `HungNDk4/CNPM-MXH-SV`, choose the reviewed deployment branch, **plan Free**, use `render.yaml` as non-secret Blueprint configuration or the same build/start commands manually. Keep automatic deploy OFF while human review is pending.
3. Render environment must contain: `NODE_ENV=production`, `SERVE_CLIENT_DIST=true`, `DB_AUTO_SYNC=false`, `TIDB_CLOUD=true`, `TIDB_ENABLE_SSL=true`, `DOCUMENT_STORAGE_DRIVER=vercel-blob`, `DB_HOST/PORT/NAME/USER/PASSWORD`, independent high-entropy `JWT_ACCESS_SECRET/JWT_REFRESH_SECRET`, `CLIENT_URL=https://<actual-render-subdomain>.onrender.com`, and `BLOB_READ_WRITE_TOKEN` for the private store. Never display/copy tokens in issue/PR or logs. Node built-in CA is sufficient for TiDB Starter by default; `TIDB_CA_PATH` optional.
4. Existing local MySQL and disk-backed PDF tests use the default filesystem driver. Production switches only with `DOCUMENT_STORAGE_DRIVER=vercel-blob`. SDK `@vercel/blob >=2.3` needed; `server/package.json` and `server/package-lock.json` must agree before Render `npm ci`. The backend fails closed during startup when storage config is incomplete.

## Codex-assisted environment setup for EXISTING Render Web Service

The account owner created Render's Web Service **manually**, so `render.yaml` will NOT automatically update that existing service. To let Codex do the non-secret updates safely, this branch ships `scripts/dep01c-render-env.cjs` with offline CI guards.

**Prerequisite: give the Codex execution environment access to its own existing Render account credential.** Set `RENDER_API_KEY` and `RENDER_SERVICE_ID` (the actual Render dashboard URL has `/web/srv-...`) in a private terminal/secret manager. **Never paste an API key, DB password or Vercel Blob token into chat, a GitHub issue, commits, Actions secrets in a PR from an untrusted branch, or the command-line arguments.** The script intentionally cannot guess credentials or acquire a Render token on its own.

Usage from this checked-out feature branch:

```bash
node scripts/dep01c-render-env.cjs --dry-run
node scripts/dep01c-render-env.cjs --apply
```

The script fetches the Render service, refuses to write unless it is **exactly** the `HungNDk4/CNPM-MXH-SV` Web Service on the `feat/dep01c-render-tidb-blob-poc-20261022` branch and **Free plan**. It updates **individual** non-secret keys (`NODE_ENV`, `SERVE_CLIENT_DIST`, `DB_AUTO_SYNC`, `DOCUMENT_STORAGE_DRIVER`, `TIDB_CLOUD`, `TIDB_ENABLE_SSL`, `DB_SSL_MODE`) without replacing other settings; initializes missing JWT secrets from cryptographic random bytes and derives `CLIENT_URL` if Render returns a valid HTTPS `onrender.com` origin.

If the Codex process has **specifically opt-in** `DEP01_TIDB_DB_HOST`, `DEP01_TIDB_DB_PORT`, `DEP01_TIDB_DB_NAME`, `DEP01_TIDB_DB_USER`, `DEP01_TIDB_DB_PASSWORD` and `DEP01_PRIVATE_BLOB_TOKEN` available privately, the script can set those missing service values without printing them. **Never use arbitrary local `DB_PASSWORD` or a development database.** Preexisting values are retained, including JWTs and cloud credentials. Output contains **names only**; no secret values. It does not deploy automatically and does not modify billing, branch or service plan. Missing credentials are reported by key name and block full activation.

**Next:** After Codex confirms `--apply` succeeded with no missing required keys, authorize a Render **Save and deploy** / API deploy of the existing Free Web Service, inspect the **real** backend startup logs and run the external HTTPS script. If TiDB or private Blob store is not configured yet, Codex must report `BLOCKED` and **not** fabricate credentials or deploy an incomplete application.

Official Render API proof: https://api-docs.render.com/reference/update-env-var (single-key PUT; the bulk endpoint replaces/deletes omitted keys and MUST NOT be used). 

## Exact external Render proof: not yet executed

**Necessary third-party prerequisite:** no connected Render or TiDB admin tool is available to this session. The existing Render service/deploy IDs have now been supplied (see latest operational attempt), but Render API authentication and the actual public HTTPS origin are still unavailable. **We cannot honestly report a verified `*.onrender.com` deployment at this point.**

For the existing manually created service, use the helper to verify GitHub repository `HungNDk4/CNPM-MXH-SV`, branch `feat/dep01c-render-tidb-blob-poc-20261022` and actual Free plan. Do not create a duplicate service, deploy `main`, choose any paid plan, connect paid add-ons or turn on auto-deploy. `render.yaml` is a configuration reference; it does not automatically update a manually created service. Missing JWT secrets are generated by the helper only after authenticated service inspection, while preexisting values are retained.

**Before hitting deploy**, configure isolated TiDB Starter Free and import reviewed schema + `document_files` migration using TiDB's authenticated query console; the schema contains `USE mini_study_network`, so verify matching database name. Separately authorize the Vercel private Blob store and put `BLOB_READ_WRITE_TOKEN` in Render **only**; Vercel team scope may require reauthorization. Missing DB or Blob credentials intentionally causes Express startup to fail, so a “Live” URL is NOT expected until these genuine gates pass. Never paste secrets into GitHub or ChatGPT.

When Render displays the live HTTPS `*.onrender.com` address, run from any internet-connected terminal (or arrange independent external HTTP verification):

```bash
node scripts/dep01c-live-render-smoke.cjs https://YOUR-ACTUAL-SERVICE.onrender.com
```

This script **only reads public HTML/health**, checks guest PDF auth 401, unknown API 404, private legacy URL 404, and validates the hostname. It waits for a genuine Render Free cold start. It cannot prove provider's actual Free plan or real PDF bytes; read the Render dashboard Free badge, then perform the separate authenticated cloud PDF integration acceptance (10 MiB exact bytes, hidden/deleted and owner gates), database persistence and redeploy tests. **Never mark DEP-01C PASS from source CI or a health page alone.**


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
