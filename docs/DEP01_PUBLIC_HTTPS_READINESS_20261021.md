# DEP-01 — PUBLIC HTTPS APP DEPLOYMENT READINESS
**Date:** 2026-10-21. **Status:** PROVIDER-TERMS RESEARCH PASS / REAL CLOUD E2E NOT RUN — free-first candidate Render Free + TiDB Starter + private Vercel Blob, conditional on real eligibility, security adaptation, and account authorization; full website not deployed.

## Approved project time horizon and spending preference (Human A, 2026-10-21)
- **Scope: short-term coursework demo, presentation and final defense only, approximately 1–3 months**, NOT a long-term public community service. After the course, take sanitized backup/evidence and decommission any cloud resources so nothing keeps consuming quota or charging.
- **Student-cost policy:** first attempt **$0 recurring fee** using only actually eligible free quotas/trials; **no card, paid plan, spending limit above $0, or change of vendor/account without separate explicit Human A approval**. Zero-fee preference is NOT authorization to claim any provider selected or an environment fully provisioned.
- **Usability gate remains ADR-015:** the public HTTPS URL must be available to the lecturer when student computers are offline, including after an idle period. Free tiers may sleep or stop at quota; do not promise 24/7 SLA. For an assessment window, verify externally before the event, keep sanitized backup and an offline demo recording for emergency fallback, without treating a recording as proof of live access.
- **Priority lane (research-only decision):** evaluate **Render Free full-stack Express+React / TiDB Cloud Starter MySQL-compatible / Vercel Blob Private** first. It meets documented $0 candidate capability only with secure external Blob storage adapter, TLS DB compatibility, and acceptance of Render cold-start (~1 minute). Railway Free is demoted for any sustained running application because $1 usage credit does not cover realistic always-on memory costs. Actual cloud compatibility and eligibility remain unverified; no account, vendor, billing or deployment authorization inferred.
- **PoC rule:** start with a disposable, synthetic-data-only project; never deploy legacy `main` or publish real data; do not start cloud writes until provider scope and account ownership are explicitly authorized.



## 2026-10-21 — Independent provider terms cross-check: $0 candidate decision (READ FIRST)
**Decision:** `D1-DOCS-PASS / D2-LIVE-PENDING`. A viable **conditional $0 architecture** can be designed from official free-tier specifications, but none of the *full* app's cloud paths has passed a real external HTTPS browser + remote MySQL + remote private 10 MiB PDF integration test. **Do not call DEP-01 DONE or claim it is already deployed.** These are vendor-plan facts and implementation requirements; cloud account eligibility, third-party SLA, and the actual executable deploy still need proof.

### A. Recommended first cloud PoC (zero-subscription, noncommercial coursework)
- **Full-stack HTTPS web server:** `Render Free Web Service`. Serve production-built React `client/dist` via the **same Express instance** after API routes and before SPA 404 (preserve `/api/*` 404 JSON); same-origin browser `/api` avoids a Vercel edge/function proxy for 10 MiB uploads/downloads and avoids cross-origin JWT refresh changes. Build from repo root with locked `npm ci` per package, build client, start `node server/src/index.js`; bind Render `PORT` on `0.0.0.0`; isolate deployment branch from unfinished `main`.
- **MySQL-compatible managed database:** `TiDB Cloud Starter (MySQL-compatible Free)` — per official plan: up to **5 GiB row data and 50 million RUs/month**, no credit card required for first eligible free instances. Sequelize v6/mysql2 needs remote TLS connection configuration, SQL schema and DOC-03 migration compatibility checks; do not assume SQL 8-specific FK/ENUM/TIMESTAMP/index semantics are identical. Run migrations only on disposable `mini_study_network` instance with synthetic rows, explicit rollback and owner tests. Ensure no spending limit enabling paid usage.
- **Private PDF blob store:** `Vercel Blob Private (existing authorized Vercel Hobby account)` — Hobby includes **1 GB stored blobs, 10 GB Blob data transfer, 10k simple and 2k advanced operations** monthly. SDK `@vercel/blob` `put()`/`get()` supports private blobs from **outside Vercel** using a server-only `BLOB_READ_WRITE_TOKEN`; file maximum is far above 10 MiB. Browser **does not** see the blob URL/token; `POST /api/documents` streams/accepts at most 10,485,760 bytes through Render Express, verifies bytes, then `put(access:'private')`; DB `DocumentFile` stores a random internal key, not publicly accessible URL. On authenticated `GET /api/documents/:id/download`, recheck active/free post + JWT every time, stream private `get()` from Render to browser, never issue a long-lived public/signed URL. Keep compensating delete, one file/post, size/signature/hash/content length, hidden/deleted 404. No local disk dependence; no downgrade to public Blob.
- **Capacity plan:** cap synthetic/demo PDF total to **at most 40 full-size 10 MiB PDFs** until real quota testing, so storage uses ~0.42 GB (decimal), with operational margin; store and transfer quotas can still be exhausted and service can then stop. Restrict sharing to demo data; run report/defense after cold-start warmup.

**Known free-tier compromises:**
1. Render Free idles after **15 minutes**; incoming request wakes it, taking **about 1 minute**. Link is independent of laptops, but immediate first-load availability/zero cold-start latency is **NOT** satisfied. It gets **750 running instance hours/month**; no persistent local disks. External TiDB/Blob calls may trigger Render free traffic restrictions or bandwidth exhaustion. Without adding a payment method, Render suspends rather than charging on bandwidth overage. A lecturer requiring immediate first-byte loading (no warmup) invalidates this candidate.
2. TiDB Starter has quotas, SQL differences; project must not rely on MariaDB/SQL Server semantics or use `sequelize.sync({alter:true})` on cloud DB.
3. Vercel Blob Hobby hard-stops access at quota rather than billing extra; private storage access and external SDK token behavior must be tested using real PDF data *before* publish. Private object keys/tokens must not leak via `SafePost`.
4. A free provider does **not** guarantee uptime or freedom from account verification, abuse throttling, unannounced terms changes or resource suspensions. Keep an offline fallback recording, without counting it as online acceptance.

### B. Provider candidates explicitly downgraded
| Hosting lane | Decision for 1–3 months | Evidence / reason |
|---|---|---|
| Railway Free backend + its 0.5GB volume | **NOT THE DEFAULT for sustained $0 link** | After up to 30-day $5 trial, only **$1 resource credit/month**. Memory alone at **0.25GB average** costs ~$2.50/month based on official $10/GB-month rate (CPU/volume/network extra); 0.5GB ~ $5/month. Thus free credit cannot cover even a modest continuously running Express app. Railway remains conditional for intermittent use or if actual usage verified <= $1; do not call 24/7 $0. |
| Render Free backend + local PDF folder | **REJECT** | No persistent disk, all uploaded files lost on sleep/redeploy. Use separate private Vercel Blob store instead. |
| Vercel Functions + 10 MiB PDF through current Express controller | **REJECT unmodified** | Vercel Functions request and response body 4.5 MB limit conflicts with 10 MiB PDF. Redesign needed; cannot silently lower size. |
| Koyeb Free | **LOW PRIORITY** | Free 512 MB/0.1 vCPU, sleeps after 1 hour; no volumes. Starter needs valid payment method; not preferred for no-card demo. |
| Render free Postgres / Supabase Postgres as existing MySQL DB | **REJECT unmodified** | Different dialect would require Sequelize model migrations; Render free Postgres expires in 30 days. TiDB candidate preserves MySQL protocol pending actual cloud SQL tests. |
| Cloudflare R2 Standard free | **POSSIBLE BACKUP, NOT $0 HARD GUARANTEED BY DEFAULT** | 10GB-month storage included, but requires R2 checkout subscription and can charge overage; explicit user approval/billing guard required. |

### C. Go/no-go acceptance before real website publication
| Gate | Mandatory real evidence | Status |
|---|---|---|
| D1 — documented capacity/terms | Official plan pages, $0 policy, exact source architecture, no false durable disk | **PASS for feasibility research**, not user/provider approval |
| D2 — account eligibility | Render Free provision allowed, TiDB MySQL Starter free, Vercel Hobby private Blob store allowed; check payment method/eligible scope | **NOT RUN** |
| D3 — actual cloud database | TLS Sequelize connect, schema + DOC-03 migration, FK/ENUM/JSON/DECIMAL/index/transactions and rollback, auth ownership | **NOT RUN** |
| D4 — secured blob adapter | Private 10MiB upload and byte-accurate authorized download, >10MiB 413, spoof 415, hidden/deleted deny and orphan cleanup | **NOT RUN** |
| D5 — public HTTPS browser | Real Render `*.onrender.com` HTTPS React SPA deep links, guest safe metadata, register/login/refresh, 2 users, PDF bytes, auth/ownership, no laptop on | **NOT RUN** |
| D6 — reliability & shutdown | Cold start observed, redeploy persistence, quota email/alerts, sanitized backup/restore and 1–3mo decommission checklist | **NOT RUN** |

**Next engineering sequence AFTER explicit environment authorization:** isolated cloud deployment branch & PR (not main); safe `render.yaml` or reviewed Render UI config, provider token *only in host secrets*, injectable private blob storage adapter, Sequelize/TiDB TLS guard, Express production built React routes; CI builds and database tests; disposable real cloud E2E; only then approve lecturer-facing HTTPS link. Keep old private-disk implementation as local/CI regression baseline; never break its proven E2E path.

**Official sources (checked 2026-10-21):**
- Render Free: https://render.com/docs/free ; Render Express HTTPS: https://render.com/docs/web-services ; monorepo: https://render.com/docs/monorepo-support ; no-card billing: https://render.com/docs/faq
- TiDB Starter Free: https://docs.pingcap.com/tidbcloud/select-cluster-tier/ ; SQL compatibility: https://docs.pingcap.com/tidbcloud/mysql-compatibility/
- Vercel Blob Hobby quota (updated 2026-09-23): https://vercel.com/docs/vercel-blob/usage-and-pricing ; private: https://vercel.com/docs/vercel-blob/private-storage ; external SDK + `get()`: https://vercel.com/docs/vercel-blob/using-blob-sdk
- Railway credit/cost: https://docs.railway.com/pricing/free-trial ; https://docs.railway.com/pricing/plans
- Koyeb free limitations/payment method: https://www.koyeb.com/docs/reference/instances ; https://www.koyeb.com/docs/reference/organizations
- Cloudflare R2 free/checkout: https://developers.cloudflare.com/r2/pricing/ ; https://developers.cloudflare.com/r2/get-started/


## 1. Verified baseline (avoid confusing PoC and complete website)
- **Current integrated HEAD:** `integration/team-dev-20261020` @ `f5c974b3d3f7aa41374949a5b7e7078a60d15ee9` after PR #30. Planning baseline was `7bbe3026`; QA/browser test files are now integrated, but `main` remains separate.
- GitHub [E2E PR #30](https://github.com/HungNDk4/CNPM-MXH-SV/pull/30) **MERGED 2026-10-21T12:16:47Z** with merge commit `f5c974b3d3f7aa41374949a5b7e7078a60d15ee9`; source HEAD `0771428336d3a46d0b81128d99229763d85e4114`, [Actions 39595181401](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39595181401) 7/7 SUCCESS and Chromium 12/12. Local backend 5/5 PASS; Windows local frontend ACL-BLOCKED. Review records empty on GitHub at verification; merge alone does not establish independent sign-off.
- Existing Vercel project `mini-study-network-dep01` (id `prj_YZzSucZKTjpzzghzVBFmZf02ZY21`) has a READY isolated **health-only** deployment `dpl_Umv7RsTsnEycnxyKXzQsrbLRrwtq`, HTTPS alias https://mini-study-network-dep01.vercel.app. It is NOT React+Express+database+PDF production; no sensitive source or file API present.
- `main` stays untouched. **ADR-015:** public HTTPS must work without student laptop; **ADR-014:** low/no cost is a constraint, not authorization for a billable provider.

## 2. Current product source blockers (verified against integration)
| ID | Source | Blocker before real public website |
|---|---|---|
| DEP-B01 | `client/src/lib/axios.js`, `client/vite.config.js` | Browser uses relative `/api`; production must route it to Express. Vite proxy works ONLY in dev. A Vercel frontend needs `/api/:path*` external-origin rewrite ordered before SPA fallback, or serve built React from the same Express origin. Do not hardcode an unapproved API hostname. |
| DEP-B02 | `server/src/index.js` | Long-running Express bootstrap with `sequelize.authenticate()` and `listen(PORT)`; native Function requires a tested adapter and connection strategy. A container/VM/long-running service can retain existing code. |
| DEP-B03 | `server/src/controllers/document.controller.js`, `server/src/routes/document.routes.js` | Multipart POST sends file (up to 10,485,760 bytes) through Express and private memory storage; **Vercel Function 4.5 MB body cap** makes this incompatible with Vercel Functions. A persistent Express host can use current flow; serverless requires scoped direct private Blob upload and server-verified finalize. |
| DEP-B04 | `server/src/services/private-document-storage.js` | Production requires absolute persistent `DOCUMENT_PRIVATE_DIR` and explicit `DOCUMENT_STORAGE_PERSISTENT=true`. Ephemeral serverless filesystem will lose PDF files. Backup/reconcile strategy required. |
| DEP-B05 | `server/src/config/database.js` | Sequelize MySQL uses env host/user/password without verified cloud TLS configuration/managed DB migration. Remote TiDB is MySQL-protocol compatible, not proven identical; verify FK, ENUM, JSON, DECIMAL, indexes, transactions, token rotation, and rollback on disposable DB. |
| DEP-B06 | `database/schema.sql`, `database/migrations/20261021_document_files.sql` | Schema/migration proven on isolated MySQL 8 CI, **not** applied to any cloud DB. No auto-alter on persistent DB; use reviewed explicit migration and backup/restore test. |
| DEP-B07 | `client/src/App.jsx` | SPA deep routes `/documents/:id`, `/posts/:id`, `/login` need rewrite/fallback on HTTP GET refresh, or Express static fallback with API precedence. |
| DEP-B08 | `server/src/app.js`, `server/src/config/database.js` | Set real `CLIENT_URL` and CORS for split-site configuration; confirm trust proxy/rate limit under host topology, restrictive response cache, request limits, error logs and security headers. |

## 3. Candidate lanes — NO architectural/vendor approval yet
| Lane | Frontend / Backend / DB / PDF | Fit for 10 MiB, code impact | Cost/reliability |
|---|---|---|---|
| **L1 — quickest code-preserving functional PoC** | Static React Vite on Vercel Hobby (or same-origin served by Express) / **long-running Express** on Railway with **persistent mounted volume** / external managed MySQL-compatible DB with verified TLS (e.g. TiDB Starter) / private volume for PDF | Can retain existing multipart API + private storage; needs hosted API routing, production env, cloud DB smoke, backup/restore and host billing check. | Railway advertises Free after trial with $1/mo resources and 0.5 GB volume; serious disk/memory/quota limitations. Hobby is $5 minimum/month; not a zero-cost commitment. Always-online reliability and spend guard need explicit acceptance. |
| **L2 — no fixed subscription candidate, larger refactor** | Vercel Hobby React + Express Functions / TiDB Starter / Vercel Blob Private | Requires re-architecture: JWT-authorized **browser-direct** PDF upload; verify bytes and size server-side before publish; gated reads/no reusable public URL. Function 4.5 MB body **and response** means 10 MiB download also needs a measured streaming/relay method; do NOT call existing controller cloud-ready. | Hobby/Starter/Blob have free quotas but limit exhaustion can interrupt website; no guaranteed 24/7. Vercel Hobby restricted to personal noncommercial use. |
| **L3 — self-managed VM alternative** | Oracle Always Free VM + Express + MySQL 8 + private persistent disk + HTTPS reverse proxy | Less API refactor; more security ops, TLS, OS upgrades, backups, capacity planning, account eligibility. | Capacity not guaranteed, card verification/provider maintenance may be necessary. |

**For this 1–3 month student demo, prioritize a real $0 trial/Free feasibility check first.** L1 is preferable for low code churn *only if* Railway Free credits suffice for the required evaluation window; otherwise L2 is a candidate with substantial private-PDF refactor and new E2E work. Neither lane nor a provider account is selected. No resource creation until lane, account ownership and **$0 hard spend cap** are agreed; any move to paid service requires a new explicit approval.

Official/current information (checked 2026-10-21):
- Vercel Functions 4.5 MB req/response: https://vercel.com/docs/functions/limitations
- External rewrites: https://vercel.com/docs/routing/rewrites
- Vite SPA fallback: https://vercel.com/docs/frameworks/frontend/vite
- Vercel Blob direct upload/private: https://vercel.com/docs/vercel-blob/client-upload ; https://vercel.com/changelog/vercel-private-blob-is-now-generally-available
- Railway pricing: https://railway.com/pricing ; https://docs.railway.com/pricing/plans
- Railway public HTTPS: https://docs.railway.com/networking/public-networking
- TiDB Starter quotas (MySQL-compatible): https://docs.pingcap.com/tidbcloud/select-cluster-tier/
- Vercel Hobby noncommercial: https://vercel.com/docs/limits/fair-use-guidelines

## 4. Deployment configuration (names only, NEVER commit values)
| Responsibility | Required config at deployment (secrets managed by host) |
|---|---|
| Backend server | `NODE_ENV=production`, platform `PORT`, `DB_AUTO_SYNC=false` |
| DB | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`; cloud TLS configuration requires source-backed adapter if provider needs it |
| Tokens | Distinct long random `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, expiry settings |
| Browser/API | External public HTTPS origin for `CLIENT_URL`; same-origin `/api` routing or reviewed explicit API origin; no localhost fallbacks |
| Private PDF | **Only for volume-backed long-running server:** absolute `DOCUMENT_PRIVATE_DIR`, `DOCUMENT_STORAGE_PERSISTENT=true`; ensure mount path is outside web root and backed up |
| Operations | Non-production sample data, rate limits, process health, backup/restore, error alerts, storage quota/spend caps; no default demo credentials |

Do not deploy from `main` while stacked PR #1–#10 are unresolved. Any real preview must take an reviewed feature integration commit, never unreviewed legacy main.

## 5. Acceptance gates in strict order
1. **G-DEP01-0 — Review:** PR #30 already MERGED into integration (f5c974b) with CI/browser PASS. Human A/B review integrated revision and PR #31 plan; confirm genuinely $0 suitable account/provider, private storage, ownership and quota for 1–3 months. No provisioning implied by QA merge.
2. **G-DEP01-1 — Provision only a sandbox:** named nonproduction project and isolated disposable remote DB/storage, no real user data; record HTTPS URL, account owner, quota and rollback. No credit card or paid upgrade without human approval.
3. **G-DEP01-2 — DB health and compatibility:** remote TLS `authenticate`, import reviewed schema+migration once, verify Sequelize model timestamps, add records/read/transactions/rollback and delete only test fixtures.
4. **G-DEP01-3 — HTTP + SPA:** production Vite build, deep-link refresh fallback, backend health, guest feed, auth register/login/refresh across public HTTPS with correct CORS/rewrites. No Vite dev proxy in deployment.
5. **G-DEP01-4 — private 10 MiB PDF security:** actual browser upload size 1..10MiB; 10MiB+1 denied; spoofed PDF denied; guest 401 downloads; authenticated student allowed; cross-user 403 changes; hidden/deleted deny; HTTP response must not expose private object URLs.
6. **G-DEP01-5 — persistence & operations:** redeploy backend, confirm DB rows and PDF bytes survive; simulate storage outage, verify no orphan published post; backup/restore, HTTPS cert & repeat third-party network checks, budget guard/alerts.
7. **G-DEP01-6 — publish signoff:** both humans accept live-URL behavior and rollback. Only then promote public application site and document a student-friendly demo runbook.

## 6. Handoff/decision required — not a request for any credentials
- Duration **1–3 months for class demo** and first-pass **$0 recurring-fee preference** are now recorded; still choose actual L1/L2/L3 provider separately, confirm account owner, **$0 spending cap**, backup owner and the precise demo dates.
- **Preparation complete once this file passes docs checks and PR is reviewed; deployment NOT STARTED**. Existing health-only Vercel project must not be repurposed silently as the full application.
