# DEP-01 — PUBLIC HTTPS APP DEPLOYMENT READINESS
**Date:** 2026-10-21. **Status:** PREPARATION / REVIEW — no production application deployment, no provider selection, no cloud DB/Blob created.

## 1. Verified baseline (avoid confusing PoC and complete website)
- Source baseline: `integration/team-dev-20261020` @ `7bbe302623191d5f28e967424ae529df307a13e7`. PRs #20–#29 integrated payment shutdown, security, private PDF routes and React upload/download; PDF E2E CI evidence exists on **separate Draft PR #30**, not yet merged to this baseline.
- GitHub [E2E PR #30](https://github.com/HungNDk4/CNPM-MXH-SV/pull/30) latest tested HEAD `31a546784db087880d4f8bdaeb12a8aa98073c63`, run [39592227079](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39592227079) 7/7 PASS (12 scenarios); as of inspection Draft, 0 reviews, independent human sign-off pending, test report is behind source revision and needs correction. This branch deliberately does not consume #30 yet.
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

**Proposed fastest sequence if modest spend is acceptable:** trial L1 with **one disposable app & DB**, check actual Railway subscription/volume eligibility and migration first. **If absolutely zero fixed subscription is mandatory:** evaluate L2 only after explicit acceptance of the upload/download/storage rewrite and quota limits. No resource creation until lane, account ownership, and maximum spending are accepted.

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
1. **G-DEP01-0 — Review:** approve PR #30 after safety/report corrections; independently review merged integration revision; Human A/Human B select hosting lane + cloud spending/owner.
2. **G-DEP01-1 — Provision only a sandbox:** named nonproduction project and isolated disposable remote DB/storage, no real user data; record HTTPS URL, account owner, quota and rollback. No credit card or paid upgrade without human approval.
3. **G-DEP01-2 — DB health and compatibility:** remote TLS `authenticate`, import reviewed schema+migration once, verify Sequelize model timestamps, add records/read/transactions/rollback and delete only test fixtures.
4. **G-DEP01-3 — HTTP + SPA:** production Vite build, deep-link refresh fallback, backend health, guest feed, auth register/login/refresh across public HTTPS with correct CORS/rewrites. No Vite dev proxy in deployment.
5. **G-DEP01-4 — private 10 MiB PDF security:** actual browser upload size 1..10MiB; 10MiB+1 denied; spoofed PDF denied; guest 401 downloads; authenticated student allowed; cross-user 403 changes; hidden/deleted deny; HTTP response must not expose private object URLs.
6. **G-DEP01-5 — persistence & operations:** redeploy backend, confirm DB rows and PDF bytes survive; simulate storage outage, verify no orphan published post; backup/restore, HTTPS cert & repeat third-party network checks, budget guard/alerts.
7. **G-DEP01-6 — publish signoff:** both humans accept live-URL behavior and rollback. Only then promote public application site and document a student-friendly demo runbook.

## 6. Handoff/decision required — not a request for any credentials
- Choose L1 (faster, potential recurring fee), L2 (more refactor, quotas), or L3 (ops heavy). Document provider account owner, max monthly charge in local currency or $0 hard limit, backup owner and demo time window.
- **Preparation complete once this file passes docs checks and PR is reviewed; deployment NOT STARTED**. Existing health-only Vercel project must not be repurposed silently as the full application.
