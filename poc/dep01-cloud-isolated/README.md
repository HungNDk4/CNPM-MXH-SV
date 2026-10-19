# DEP-01 isolated cloud PoC — Stage A only
**Status:** DEP-A01 cloud deployment NOT RUN until Vercel account scope is authorized. This folder is a **standalone** Vercel root, not the course backend.

## Intended safe scope
- Public HTTPS static page + `GET /api/health` Node Function.
- `POST /api/health` => 405; `HEAD` => 200; API returns DB/Blob `NOT_CONNECTED`.
- No user input persisted, no uploads, no payment/order routes, no credentials and no `/uploads`. Zero npm dependencies.
- Never claim this establishes TiDB, protected Blob 10 MiB, auth, online uptime or the application's production readiness.

## Local offline verification (Node 24)
```bash
cd poc/dep01-cloud-isolated
npm test
```

## How to deploy when team Vercel authorization is restored
1. Confirm authorized personal/team **Hobby** scope, explicit owner and cost restrictions; do not use a team that returns 403.
2. Create a **separate** Vercel PoC project linked to the GitHub repo, with **Root Directory = `poc/dep01-cloud-isolated`**. Verify it does not auto-deploy legacy source.
3. Framework `Other`, no custom build command, no environment variables, no database or Blob token. Deploy **Preview** only from the dedicated PoC branch.
4. Test from independent network: `https://<preview>/`, `GET https://<preview>/api/health` => 200 with stage `HTTPS_HEALTH_ONLY`; `POST` => 405. Capture observed headers/status/build logs/time. Do not claim 'always online' from one request.
5. Disconnect/remove PoC project after reporting if needed; never promote this proof to production.
6. **Next gated stages**: DEP-A02 TiDB disposable database (compatibility only), DEP-A03 Blob Private upload policy + authorization, then DEP-A04 security. Each requires account/team decision and explicit review.

## Provider blocker at 2026-10-18
Vercel connector currently lists projects attached to team scope but `get_team` for the mapped team returns **403 forbidden**. `list_teams` and `get_git_deployment_context` both return zero usable teams. No other scope was chosen and **NO project/deployment was created**. Reauthorize the intended Vercel team/plugin and verify correct plan before Stage A cloud deploy.

## Success criteria
Only DEP-A01 can be marked PASS after **real public HTTPS request evidence**. GitHub Actions or localhost Node smoke PASS is OFFLINE_PREPARED, **not cloud PASS**.

All other goals remain NOT_RUN, including 10 MiB direct Blob flow, paid route shutdown, MySQL-compatible integration and deploy/restart durability.

## 2026-10-19 — Live Stage-A deployment observed (supersedes old 403 blocker)
- Vercel personal Hobby `hunny-17` permitted creating `mini-study-network-dep01` even though list_teams was empty; the previous 403 was team-specific.
- This exact standalone package was uploaded via Vercel connector (no Git auto-link). Deployment `dpl_Umv7RsTsnEycnxyKXzQsrbLRrwtq` is **READY** at https://mini-study-network-dep01.vercel.app/.
- **Actual target = production** (not Preview), even though staging was requested; no sensitive CNPM application code or student data is included.
- Human A supplied **Incognito screenshot** of page and automatic cloud API status success. **DEP-A01 REVIEW / browser success observed**; independent network raw HTTP, long-term uptime, DB and PDF test gates NOT RUN.
- See [../../docs/DEP01_LIVE_EVIDENCE.md](../../docs/DEP01_LIVE_EVIDENCE.md). Do not attempt to deploy the insecure full application to this safe proof project.
