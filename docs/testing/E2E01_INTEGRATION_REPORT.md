# E2E01 INTEGRATION REPORT — 2026-10-21

**Task:** QA-03 / E2E-01. **State:** REVIEW — automated CI E2E PASS, manual student machine / cloud NOT RUN. **Repo:** HungNDk4/CNPM-MXH-SV.

## 1. Branch and source evidence

- Base: `integration/team-dev-20261020` @ `7bbe302623191d5f28e967424ae529df307a13e7`; reviewed branch comparison was identical.
- Working remote branch: `test/e2e01-fullstack-20261021` → [Draft PR #30](https://github.com/HungNDk4/CNPM-MXH-SV/pull/30). **No merge to main or integration.** Main remains `0993a42154feb37e8842ef8bb3ed4d0a03627889` when checked.
- Tested code head: `31a546784db087880d4f8bdaeb12a8aa98073c63`, [GitHub Actions run 39592227079](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39592227079), **7/7 jobs SUCCESS** (frontend build, backend syntax, docs check, DEP01 smoke/scaffold, MySQL regression and new real-browser E2E).
- Changed application business/frontend files: **none**. Test harness: `client/e2e/e2e01.test.cjs`; CI: `.github/workflows/ci.yml`.

## 2. Environment actually executed

**Verified GitHub-hosted ephemeral runner, not user workstation:** Ubuntu 24.04; Node from repo `.nvmrc` (Node 24); MySQL 8.0 service; schema `database/schema.sql` and `database/migrations/20261021_document_files.sql` imported against a fresh disposable DB; `npm ci` backend and frontend; pinned Playwright 1.56.1 installed CI-only with real Chromium; Express on port 5000, Vite on 5173, MySQL on 3306, private PDF storage at CI temporary directory. `NODE_ENV=test` prevents schema auto alteration; **E2E_DISPOSABLE_DB=true is required for the E2E script**. No production data or credentials used.

Existing Ubuntu/MySQL tests and frontend production build were executed in separate jobs in the same workflow run. This exercises the React UI through a real browser, not a mock of React components.

## 3. Actual browser/API assertions — 12/12 checkpoints PASS

| # | Observed condition | Outcome |
|---|---|---|
| 01 | Browser/Vite proxy to live Express health | PASS |
| 02 | Register A through React, obtain JWT | PASS |
| 03 | Upload PDF through React multipart, post active/free, document detail renders | PASS |
| 04 | Browser download bytes exactly equal uploaded PDF | PASS |
| 05 | Guest feed and detail show safe metadata, require login to download | PASS |
| 06 | Guest/malformed JWT denied 401, static private PDF routes denied 404 | PASS |
| 07 | Register B via React; B can download A's free PDF; B cannot edit/delete A's post (403) | PASS |
| 08 | Expired Blob download in Chromium auto-refreshes once, rotates JWT and retries original PDF | PASS |
| 09 | Invalid PDF rejected 415; 10 MiB+1 rejected 413 | PASS |
| 10 | Exactly 10 MiB PDF accepted and matching DocumentFile size recorded | PASS |
| 11 | Hidden/deleted document yields 404 in metadata/download even using stale ID | PASS |
| 12 | Logout/login via React; refresh rotation succeeds, reused refresh denied 401 | PASS |

All 12 checkpoints were logged in job **E2E-01 Chrome + React + Express + MySQL + PDF**. Node test-runner result **1/1 test PASS, 0 failures**. Separate upstream MySQL/Auth/Upload/Download security tests all passed in existing job. Synthetic test accounts and PDF files were removed by test cleanup.

## 4. Defects, debugging, and confidence limits

- First GitHub workflow change had unsupported job-level `runner.temp` expression; fixed CI environment to isolated `/tmp/e2e01-private`.
- First browser run asserted a heading immediately after route navigation, before React finished rendering; replaced the flaky immediate count assertion with an explicit browser wait. Failed run [39590875943](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39590875943) is preserved. These were **test harness defects**, not confirmed application bugs.
- No backend/frontend business defect was reproduced by the final executed scenarios; **this is not proof that all possible defects are absent**.
- **NOT RUN:** manual Windows/WSL worktree reproduction, viewport/responsive/mobile test, independent cloud DB, public HTTPS app, object storage durability, rollback/redeploy persistence, load test, concurrent refresh races, full comments/likes/profile/admin browser paths and production security audit.
- React automatic retry of an expired **Blob download** was explicitly simulated on Chromium and PASS on Actions run 39592227079. This is not proof of all concurrent refresh races or all network failures.

## 5. Reproduction and guardrails

CI reproduces with a **fresh disposable MySQL 8 service** and pinned Chromium; open PR #30 and run the workflow. For local reproduction use an **empty throwaway localhost database named `e2e01_*` only** (never the team's regular `mini_study_network`), set all required DB/JWT test env vars, `NODE_ENV=test`, `E2E_DISPOSABLE_DB=true`, `DOCUMENT_PRIVATE_DIR` to a new private test-only directory, and explicitly disable auto schema sync. Prepare isolated copies of the schema and DOC-03 migration with `CREATE DATABASE` / `USE mini_study_network` replaced by the disposable database name *before running either SQL script*; do not run the originals unmodified locally; `npm ci` in both app folders, install Playwright 1.56.1 CI-only in client, start server and Vite on 5000/5173 and run `node --test client/e2e/e2e01.test.cjs`. Never point test vars at the team's persistent DB.

This audit reflects tested source commit `31a5467`; the subsequent documentation/local-test guard correction needs a fresh CI check on its own exact HEAD. Final **QA-03 verdict: REVIEW / automated browser E2E PASS**, subject to human acceptance; local environment + responsive verification **PARTIAL**, and cloud deployment **NOT RUN**. No cloud resources created, no merge to main.
