# DEP-01 — PUBLIC HTTPS APP DEPLOYMENT READINESS
**Date:** 2026-10-21. **Status:** PREPARATION / REVIEW — no production application deployment, no provider selection, no cloud DB/Blob created.

## Approved project time horizon and spending preference (Human A, 2026-10-21)
- **Scope: short-term coursework demo, presentation and final defense only, approximately 1–3 months**, NOT a long-term public community service. After the course, take sanitized backup/evidence and decommission any cloud resources so nothing keeps consuming quota or charging.
- **Student-cost policy:** first attempt **$0 recurring fee** using only actually eligible free quotas/trials; **no card, paid plan, spending limit above $0, or change of vendor/account without separate explicit Human A approval**. Zero-fee preference is NOT authorization to claim any provider selected or an environment fully provisioned.
- **Usability gate remains ADR-015:** the public HTTPS URL must be available to the lecturer when student computers are offline, including after an idle period. Free tiers may sleep or stop at quota; do not promise 24/7 SLA. For an assessment window, verify externally before the event, keep sanitized backup and an offline demo recording for emergency fallback, without treating a recording as proof of live access.
- **Priority lane for evaluation (not approval to provision):** test **L1 on Railway Free** only if its exact current free account/resource allowance allows the service to run throughout the needed demo window and a persistent volume is supported. Railway lists 30-day $5 trial, then $1/month of free *usage credit*, max 0.5 GB volume and 0.5 GB RAM; that credit may be exhausted before a whole month of always-on backend. The user did NOT select L1 or agree to pay. If L1 cannot satisfy the $0 + reliable-access constraints, evaluate L2 Vercel/TiDB/Blob with required 10 MiB upload/download rewrite, or propose a different free provider for approval. No storage shortcuts and no lowering the 10 MiB contract.
- **PoC rule:** start with a disposable, synthetic-data-only project; never deploy legacy `main` or publish real data; do not start cloud writes until provider scope and account ownership are explicitly authorized.



## 1. Verified baseline (avoid confusing PoC and complete website)
- Source baseline: `integration/team-dev-20261020` @ `7bbe302623191d5f28e967424ae529df307a13e7`. PRs #20–#29 integrated payment shutdown, security, private PDF routes and React upload/download; PDF E2E CI evidence exists on **separate Ready-for-Review PR #30**, not yet merged to this baseline.
- GitHub [E2E PR #30](https://github.com/HungNDk4/CNPM-MXH-SV/pull/30) latest verified HEAD `0771428336d3a46d0b81128d99229763d85e4114`, run [39595181401](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39595181401) 7/7 PASS (12 scenarios); Ready for Review, independent human sign-off still pending; local Windows frontend is ACL-BLOCKED while local backend 5/5 PASS. This branch deliberately does not consume #30 yet.
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
1. **G-DEP01-0 — Review:** accept PR #30 after two-person/human review (CI already 7/7 at 0771428, local frontend ACL-blocked); independently review merged integration revision; Human A/Human B confirm FREE hosting lane, account owner, actual $0 spend cap and 1–3 month lifetime.
2. **G-DEP01-1 — Provision only a sandbox:** named nonproduction project and isolated disposable remote DB/storage, no real user data; record HTTPS URL, account owner, quota and rollback. No credit card or paid upgrade without human approval.
3. **G-DEP01-2 — DB health and compatibility:** remote TLS `authenticate`, import reviewed schema+migration once, verify Sequelize model timestamps, add records/read/transactions/rollback and delete only test fixtures.
4. **G-DEP01-3 — HTTP + SPA:** production Vite build, deep-link refresh fallback, backend health, guest feed, auth register/login/refresh across public HTTPS with correct CORS/rewrites. No Vite dev proxy in deployment.
5. **G-DEP01-4 — private 10 MiB PDF security:** actual browser upload size 1..10MiB; 10MiB+1 denied; spoofed PDF denied; guest 401 downloads; authenticated student allowed; cross-user 403 changes; hidden/deleted deny; HTTP response must not expose private object URLs.
6. **G-DEP01-5 — persistence & operations:** redeploy backend, confirm DB rows and PDF bytes survive; simulate storage outage, verify no orphan published post; backup/restore, HTTPS cert & repeat third-party network checks, budget guard/alerts.
7. **G-DEP01-6 — publish signoff:** both humans accept live-URL behavior and rollback. Only then promote public application site and document a student-friendly demo runbook.

## 6. Handoff/decision required — not a request for any credentials
- Duration **1–3 months for class demo** and first-pass **$0 recurring-fee preference** are now recorded; still choose actual L1/L2/L3 provider separately, confirm account owner, **$0 spending cap**, backup owner and the precise demo dates.
- **Preparation complete once this file passes docs checks and PR is reviewed; deployment NOT STARTED**. Existing health-only Vercel project must not be repurposed silently as the full application.
