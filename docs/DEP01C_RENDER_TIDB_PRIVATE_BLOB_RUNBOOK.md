# DEP-01C — Render Free + TiDB Cloud Starter + Vercel Blob Private

**Current status (2026-10-22 23:22 ICT): Render LIVE; registration/login/logout PASS from browser and matching Render HTTP logs; authenticated cloud PDF/10MiB acceptance and refresh revocation PENDING.** No release approval.

## DEP-01C auth recovery — 2026-10-22 23:22 ICT (current)

**Register PASS (201), Login PASS (200), Logout response PASS (200)** on new Render Free deployment. Render deployment `dep-dbd38o2vcj2c739h61sg` (source `71499dfd63d21feb019d6144efcadc7ee9232951`) is LIVE following a configuration deployment at 16:06 UTC. Human A observed successful browser registration, login and logout. Render request logs corroborate `POST /api/auth/register` 201 at 16:14:38.811Z, `POST /api/auth/logout` 200 at 16:15:12.440Z and `POST /api/auth/login` 200 at 16:22:34.422Z.

Both access and refresh JWT signing run before registration/login success per deployed `auth.controller.js`, so their signing inputs were usable at those requests. No credential values were inspected. Logout 200 alone does NOT prove refresh revocation. Refresh rotation/reuse, real cloud private PDF bytes, 10MiB/+1, SHA256, two-user permissions, hidden/delete and redeploy persistence remain untested.

Prior 22:49 ICT auth HTTP500 remains below as historical evidence. DEP-01C remains IN_PROGRESS; DEP-02 release BLOCKED. Two synthetic users from the old failed attempt still require controlled cleanup.

## Historical post-OAuth live acceptance — 2026-10-22 22:49 ICT (auth FAIL before config deployment)

Real registration and correct-password login returned HTTP500 `secretOrPrivateKey must have a value`; Render logs point to `JWT_ACCESS_SECRET` signing. Fresh MCP scoped reads still403; authenticated CLI metadata fallback PASS (Private store, 0 objects; Blob token key exists without value disclosure). Health, limited TiDB user insert/read/uniqueness and independent denial checks PASS. Authenticated PDF/10MiB/bytes/permissions blocked; persistence NOT RUN. No credentials/env/deploy changes. Two synthetic users remain for owner cleanup. See [full post-OAuth report and exact next checkpoint](testing/DEP01C_POST_OAUTH_REPORT.md).

## DEP-01C — LIVE infrastructure checkpoint (2026-10-22, 16:26 ICT)

**Verified on the real Render Free preview, not a production release approval.** This section supersedes the historical "offline/no hosted website" statements below for this **feature branch only**.

- **Actual application URL:** https://mini-study-network-dep01-demo.onrender.com/ ; Human A opened the website successfully. Render app logs show `GET /` **200** at 09:26:09Z, plus compiled CSS/JS **200**.
- **Health check PASS:** Human A copied `{"success":true,"message":"API is running 🚀","timestamp":"2026-10-22T09:26:36.401Z"}` from public `/api/health`. The independently inspected Render request log shows **`GET /api/health 200` at 09:26:36.406Z**, corroborating that observation.
- **Real provider deploy:** `srv-dbcg9rbrjlhs73bc8870`, deployment `dep-dbctc429lscs73f209t0` status **live**, source `71499dfd63d21feb019d6144efcadc7ee9232951`, Free plan, region Singapore. Render logs: `Build successful`, `MySQL connected successfully`, `Server running`, `Your service is live`.
- **TiDB Starter:** MySQL Compatible, Singapore, $0 spending limit selected; Human A ran `SHOW TABLES` and demonstrated **8/8** expected tables in `mini_study_network` (including `document_files`). This proves schema presence, **not** full FK/JSON/transactions/schema-vs-ORM compatibility testing. Runtime `Sequelize.authenticate()` succeeded from Render; independent TLS packet/certificate handshake was not inspected.
- **Vercel Blob Private:** existing private store; Render now passes startup credential validation, but Blob put/get/delete, PDF bytes, durability and access rules on real cloud are **NOT TESTED**.
- **CI:** exact deployed source SHA GitHub Actions run [39753376890](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39753376890) **7/7 jobs succeeded**, including disposable MySQL 8/Chromium E2E. This is **not** actual cloud PDF E2E.
- **Open checks:** register/login/refresh, guest feed content beyond observed HTTP 200, 10MiB boundary, private PDF byte streaming, cross-user authorization, hidden/deleted revocation, paid-endpoint lockdown, TiDB write transactions, redeploy persistence, quota/recovery and off-network repeated monitoring. DEP-01C overall **IN_PROGRESS / partial infrastructure PASS**, **not G5/G6 or public release sign-off**.
- **Operational risk:** Render currently reports `autoDeploy=yes` (despite `render.yaml` requesting off). Do not push documentation to its live source branch merely to update status; use a stacked docs-only review branch to prevent an unintended redeploy. No billing, secret, schema, service or application mutations in this checkpoint.

**Next:** an isolated cloud acceptance run with test-only accounts and a disposable PDF, strict denial/byte-equality/size/cleanup tests, then a controlled persistence test and Human A/B review. Do not expose secret values in logs/PRs or claim uninterrupted 24/7 Free-tier uptime.

## Historical initial Render API-key blocker — 2026-10-22 (superseded by OAuth and live service)

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
