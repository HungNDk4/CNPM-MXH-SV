# DEP-01 — Online Deployment Feasibility Audit
**Date:** 2026-10-18 | **Status:** IN_PROGRESS — offline source verification complete when CI passes; cloud PoC NOT RUN.
**Human-approved constraints:** Public HTTPS link accessible to lecturer at arbitrary times without student laptops (ADR-015); minimize student costs (ADR-014). PDF: 1 file/post, <=10 MiB, guest sees safe metadata, authenticated users download, auto-publish on verified upload, admin post-moderates (ADR-010..013).
**Decision boundary:** Vercel/TiDB/Blob are **candidates only**. No cloud account, provider, architecture, payment method or subscription has been selected/approved. No production rollout.

## 1. What DEP-01 actually verified
Reviewed repository `HungNDk4/CNPM-MXH-SV` at branch `docs/pdf-upload-limits-20261018` HEAD `2f6b28052076232dc93e889325a14aac4266dfeb`. The audit script in `scripts/dep01-readiness.mjs` reads exact source files and reports static findings, without any credentials/network/deployment; `scripts/dep01-readiness.test.mjs` checks the reporting contract and size-limit incompatibility. A CI pass confirms ONLY these static audit checks ran; it does **not** make the stack deployable.

### Source-specific findings
| ID | Exact file / evidence | Finding | Consequence |
|---|---|---|---|
| DEP-S01 | `server/src/app.js` exports `module.exports = app` | Express app can be adapted for Function entry | **ADAPTABLE** with wrapper/config; not yet tested on platform |
| DEP-S02 | `server/src/index.js` invokes `sequelize.authenticate()` and `app.listen(PORT)` | Conventional long-running bootstrap | Create isolated serverless entry; do not put `listen` on Function handler; connection lifecycle/pool tests |
| DEP-S03 | `client/src/lib/axios.js` sets `baseURL:'/api'`; `client/vite.config.js` proxies only in dev | Same-origin production API routing not defined | Vercel root configuration/rewrite or split-app proxy; test SPA deep links |
| DEP-S04 | `server/src/config/database.js`: Sequelize dialect `mysql`, default `DB_HOST`, port 3306, pool max=10 | TiDB protocol candidate only, concurrency pools per warm Function | Need real remote TLS/timeout/pool testing; avoid `sync({alter:true})` as deploy migration |
| DEP-S05 | SQL `refresh_tokens` table lacks `updated_at`; `server/src/models/index.js` uses `timestamps:true` | Existing schema/ORM drift | Fix via reviewed migration/model contract before Cloud DB |
| DEP-S06 | `post.controller.js` accepts `file_url` directly; `Post.js` has `file_url` | No safe PDF upload byte pipeline | New one-file+10 MiB object metadata, verify private object before active; no raw file URL in DTO |
| DEP-S07 | `app.js` exposes `/uploads` static | Does not enforce login for PDF download | Must protect all private PDF objects via server-side authorization |
| DEP-S08 | `app.js` mounts `/api/orders`, `/api/payment` | Deferred VNPay/payment endpoints exposed in source | **P0 SEC-03** disable backend paid paths before internet exposure |
| DEP-S09 | `server/package.json`: `multer:^1.4.5-lts.1` | Outdated vulnerable multipart stack | Upgrade/test patched dependency (SEC-04), review CVEs before direct upload handlers |
| DEP-S10 | No root `vercel.json` at baseline | No verified Vercel routing/SPA/function config | Add only after choosing provider and testing, don't guess production config |
| DEP-S11 | Approved PDF **10,485,760 bytes** vs Vercel Function body **4,500,000 bytes** | Conventional server-proxy upload is impossible at allowed size | Authenticated **browser direct-to-private-object** upload with finalize validation; stream private download |

### Security-critical observations
1. **No production deploy yet:** `getPosts` returns full `Post` rows, including `file_url`; `/uploads` static; old paid routes mounted. Public deployment would create unnecessary risk. SEC-01 and SEC-03 MUST be fixed and negative-tested first.
2. PDF must never become `active` on mere client callback. Verify object exists, byte size, allowed type/file signature/content, uploader/intent binding, single file claim, and durable DB commit. Aborted/invalid uploads cleaned; tokens scoped and expired. Hidden/deleted must revoke download at backend even if a stale URL was saved.
3. Frontend `/api` routing and Vercel single-project or separate backend project choice are **not resolved**. CORS currently allows `CLIENT_URL` default localhost; must configure actual domain if split.
4. SQL `schema.sql` has multiple FKs, ENUMs, JSON, DECIMAL and timestamp policies. MySQL protocol compatibility is not a substitute for Sequelize integration tests.
5. In serverless, in-memory rate limiting may not provide consistent multi-instance global quotas. Validate ingress abuse/cost rate limits against deployment behavior.

## 2. Architecture comparison (ranked as candidates, NOT approvals)
| Option | No fixed subscription target | Adaptation effort | Data/security notes | Recommendation |
|---|---|---|---|---|
| **Vercel Hobby + TiDB Starter + Vercel Blob Private** | Plausible within Free/Hobby quotas; 1GB Blob / 5GiB TiDB row budget; function usage caps | **Medium-to-high**: serverless adapter, MySQL protocol PoC, tokenized browser upload, streaming download | No server disk persistence; no read URL bypass; quota exhaustion may disable service | **Candidate A: conditional feasibility** |
| **Oracle Always Free VM + MySQL 8 + private disk or object storage** | Plausible free if eligible/available; account verification may require card | **Medium ops, lower app rewrite**: always-on Express/MySQL process, TLS/backups/patching | Resource capacity and idle reclamation; server patch/security and persistent disk/backups are team's duty | Candidate B: contingency if SQL/serverless incompatibility |
| **Render Free + external DB/blob** | Free URL within usage constraints | Lower initial app rewrite | Sleep after idle ~15 min; nonpersistent local disk; cold start delays | Not preferred for “anytime ready” lecturer access |
| **Local laptop / tunnel** | Zero provider subscription | Easy | PC must be online; public URL not reliable | **Does not satisfy ADR-015** |

**Cost caveat:** no provider offers unlimited/guaranteed 24/7 with zero-cost SLA. Blob 1GB represents **1024/10≈102.4 MiB-sized units** (if 1 GiB; the vendor's 1 GB allocation may use decimal units, which is **~95** full 10 MiB files); estimate conservative ~95 max-sized PDFs **before** overhead/usage accounting. Quotas and plan rules require current checks upon account activation. Do not promise exact count as capacity reservation.

## 3. Feasibility phase gates
| Gate | Environment | Pass condition | Current |
|---|---|---|---|
| DEP-A00 | GitHub/source | Source mapping, hard blockers, auditable local script, offline CI | **Static evidence drafted; verify CI latest PR HEAD** |
| DEP-A01 | Vercel preview | Public HTTPS React/Vite, SPA deep links, `/api/health`, Node Function entry, no paid routes | **NOT RUN / no approved linked project** |
| DEP-A02 | Disposable TiDB Cloud Starter | Sequelize v6 `mysql2` connection over TLS; migrations/schema diff, FK/ENUM/JSON/index/DECIMAL/unique/refresh token, transactions/rollbacks | **NOT RUN / no cloud credentials** |
| DEP-A03 | Vercel Blob Private | Authenticated token issuance, direct 10 MiB upload, 10MiB+1 reject, 1 file/post, content verification, orphan cleanup | **NOT RUN / no private Blob store** |
| DEP-A04 | Live browser+API | Guest safe PDF metadata, guest byte download 401, authenticated download 10 MiB, hidden/deleted/paid deny, upload auto-publish on commit | **NOT RUN / not implemented** |
| DEP-A05 | Persistence/off-network | Teacher-like external network reads site after idle; database and PDF survive redeployment; quota/recovery checks | **NOT RUN / no deployment** |
| DEP-A06 | Budget/ownership | Actual limits, billability, data owner, backup/restore, zero-spend configuration reviewed by both humans | **NOT RUN / no provider approval** |

## 4. DEP-01 next concrete implementation sequence (after Human A and Human B review)
1. Select ONE disposable hosting PoC only after checking platform account scope and no-card/zero-spend eligibility. **Do not enable Git auto-deploy directly on existing source:** payment/file P0 risks.
2. Create a *safe minimal* proof separate from main app first: health route only, no DB secrets or legacy paid routes. Verify public HTTPS and SPA fallback.
3. Connect a disposable sample schema to TiDB or real MySQL VM; run migrations in test DB and reject incompatible DDL rather than silently altering production.
4. Create private test Blob store; implement token flow with content bounds and authorized streaming, use synthetic PDF fixture without personal data; verify 10 MiB acceptance/rejection boundaries.
5. Once isolated PoCs pass, design reviewed migration strategy and integrate branches with tests, hard-disable legacy paid APIs before any public MVP deployment. Final cutover only after G0/G1/G2 and security gates pass.

## 5. Evidence & links
- Source audit: `scripts/dep01-readiness.mjs` and `scripts/dep01-readiness.test.mjs` (read-only; CI job must not imply DEP-A01..06 passed).
- Provider docs: [Vercel Express](https://vercel.com/kb/guide/ship-a-express-app-on-vercel), [Function payload limit](https://vercel.com/docs/functions/limitations), [Private Blob](https://vercel.com/docs/vercel-blob/private-storage), [Browser upload](https://vercel.com/docs/vercel-blob/client-upload), [Hobby](https://vercel.com/docs/plans/hobby), [Blob quotas](https://vercel.com/docs/vercel-blob/usage-and-pricing), [TiDB spending limits](https://docs.pingcap.com/tidbcloud/manage-serverless-spend-limit/), [Render Free](https://render.com/docs/free).
- Legacy specs: [ONLINE_DEPLOYMENT_OPTIONS.md](ONLINE_DEPLOYMENT_OPTIONS.md), [SRS.md](SRS.md), [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md).

**Verdict:** `CONDITIONAL / BLOCKED BEFORE LIVE POC`. The candidate stack is plausible, but **DEP-01 is not completed**, and no cloud/runtime/Sequelize or PDF E2E test may be called PASS without actual evidence. 

## DEP-A00 offline CI evidence (2026-10-18)
**Draft PR #7:** https://github.com/HungNDk4/CNPM-MXH-SV/pull/7
**Initial validated commit:** `4c75b2086ea1a8cfa013a769095e8fefa7553db2`
**GitHub Actions:** https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39141647075 — **4 of 4 jobs PASS**:
1. Frontend production build — PASS.
2. Backend JavaScript syntax — PASS.
3. Project control static checks — PASS.
4. **DEP-01 offline Express/source probe** — PASS: `/api/health` HTTP handler on localhost, guest feed baseline 401 (known defect), static scanner and reproducibility tests.

**Verdict DEP-A00:** EVIDENCE AVAILABLE / in Human B REVIEW (not formally accepted). **DEP-A01..DEP-A06 remain NOT RUN.** The added audit is informative: its PASS status means it identified baseline blockers, not that blockers were fixed. Follow-up handoff-only commit changes HEAD; verify its own CI before merge.

## Stage A isolated cloud fixture — implementation prepared (NOT cloud deployed)
- User requested isolated cloud PoC, but linked Vercel account has no accessible team. Vercel `get_git_deployment_context` and `list_teams` return empty teams; mapped `get_team` gave 403 Forbidden. Project listing sees historical project metadata, **not authorization to deploy under that scope**. Do not use a different team/personal account.
- `poc/dep01-cloud-isolated` is an independent Node Function/HTML fixture with **no imports from legacy backend, no payment endpoints, no credentials/DB/Blob, no paid APIs, no file upload**. Correct Vercel project root must be this folder only, separate Preview deployment and no production promotion.
- CI smoke verifies GET 200 with `database:NOT_CONNECTED`, `pdfStorage:NOT_CONNECTED`, HEAD 200, POST 405, no dependencies. Passing this still leaves DEP-A01 HTTPS cloud NOT RUN.
- **Next verification:** new CI fifth job; real HTTPS preview only after correct team authorization. See [../poc/dep01-cloud-isolated/README.md](../poc/dep01-cloud-isolated/README.md).

## 2026-10-19 Stage-A actual Vercel deployment and user browser evidence
- **Provider/account:** authenticated Vercel user `hunny-17` (Hobby personal plan). Team listing was empty, but direct project creation on the *authorized existing personal account* succeeded; earlier team 403 did not prevent using personal Hobby. No GitHub app reauthentication was needed.
- **Isolated project:** `mini-study-network-dep01` (`prj_YZzSucZKTjpzzghzVBFmZf02ZY21`). **Deployment:** `dpl_Umv7RsTsnEycnxyKXzQsrbLRrwtq`, Vercel API status `READY`, host https://mini-study-network-dep01.vercel.app/. Source sent: only `poc/dep01-cloud-isolated/{index.html,api/health.js,package.json,vercel.json}`; no code from legacy backend, no environment secrets, storage or payment.
- **Target caveat:** despite requesting staging, provider returned `target:production`; a production alias was assigned. This is the standalone safe PoC, **not** deployment of the CNPM application. Avoid claiming it was a preview deployment.
- **User-supplied visual evidence:** Chrome **Incognito** screenshot 2026-10-19 shows URL `mini-study-network-dep01.vercel.app`, rendered page heading `DEP-01 — PoC cloud cô lập` and status `API thử nghiệm: phản hồi thành công`; text indicates `Database: NOT_CONNECTED · PDF: NOT_CONNECTED · VNPay: NOT_INCLUDED`. Page JS only shows API success when fetch('/api/health') returns 2xx with correct service/stage JSON, so HTTPS browser-to-Function request path has worked.
- **Independent direct check limitation:** this execution environment could not resolve domain for its own HTTP requests; cannot independently record raw response headers, independent-network success, uptime or reliability from this session. Vercel deployment metadata and screenshot are sufficient for **user-observed incognito HTTPS and health API success**, not a contractual 24/7 SLA.
- **Verdict:** DEP-A01 **REVIEW / user browser access verified**, subject to independent-network and repeated availability checks. DEP-A02 TiDB, DEP-A03 Blob, full authentication/document flows, redeploy persistence, quota tests and main-app production remain **NOT RUN**.
- **Evidence:** [DEP01_LIVE_EVIDENCE.md](DEP01_LIVE_EVIDENCE.md). Do not commit user screenshot or machine details to repository; audit is textual.
