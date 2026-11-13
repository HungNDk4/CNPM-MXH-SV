# CNPM-MXH-SV online QA release

This branch serves the built Vite React app from the same-origin Express service.
It does not change database schema, production, Render PoC, or DNS.

## Build and start (production)
`npm --prefix server ci && npm --prefix client ci && npm --prefix client run build`
`NODE_ENV=production node server/src/index.js`

Required service variables (values entered only in provider secret settings):
- `NODE_ENV=production`; `DB_AUTO_SYNC=false`; `CLIENT_URL=https://<QA-subdomain>`.
- `DB_HOST`, `DB_PORT=4000`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` from the approved **qa-acceptance** TiDB branch.
- `TIDB_CLOUD=true` and `DB_SSL_MODE=require` (verified TLS).
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: distinct strong non-demo secrets.
- `DOCUMENT_STORAGE_DRIVER=vercel-blob`, `BLOB_READ_WRITE_TOKEN` from a **private** Vercel Blob store.
- `PUBLIC_IMAGE_STORAGE_DRIVER=vercel-blob`, `PUBLIC_IMAGE_BLOB_READ_WRITE_TOKEN` from a separate **public** Vercel Blob store.
- `PORT` is provided by Render; do not hard-code.

The code rejects production startup with ephemeral image storage unless explicitly
configured as persistent. Never assert `PUBLIC_IMAGES_PERSISTENT=true` on Render Free.

## Data and exposure gates
Before serving public accounts:
1. Verify `qa-acceptance` parent/branch and `DATABASE()`, compare existing schema to migrations in `database/migrations`.
2. Take a documented backup/recovery point; run only verified missing additive changes once with a separate authorized operator, never the CRUD-only QA user.
3. Use non-production demo accounts/data and confirmed provider secret settings. No password or tokens in git/PR/CI logs.
4. Verify persistent PDF and images, JWT rotation and lock behavior, rate limits, no private PDF direct URL, and cross-account isolation on cloud.
5. Inspect domain/HTTPS and restart persistence. Free Render may sleep; do not advertise guaranteed uptime.

## CI evidence
`.github/workflows/qa-online-release.yml` builds real production React,
starts production Express on localhost backed by an isolated MySQL 8 service,
runs Playwright Chromium through registration, My Posts, PDF, role enforcement
and account moderation. Screenshots are uploaded as a workflow artifact.

Passing disposable MySQL8 CI does NOT establish cloud TiDB, public Blob, Render
HTTPS or persistence certification. Do not conflate these acceptance gates.
