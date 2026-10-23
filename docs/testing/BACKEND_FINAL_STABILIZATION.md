# Backend Final Stabilization

Baseline `integration/team-dev-20261020` @ `61bb9326bcea4ae71c7c379f41b6ef1980816b53` after QA-04. This is Core Backend closure, no new product module.

Scope: malformed `GET /api/posts/:id` now uses positiveId validation before ORM (422 instead of DB surprises). `POST /api/auth/logout` remains idempotent for empty/unknown token, but rejects object/array/number/boolean/>512-character untrusted refreshToken as 400, preserving successful real refresh revocation.

Integration test: `scripts/ubuntu/backend-final-contract-regression.cjs` runs seven real HTTP/MySQL8 groups, from isolated child process inside existing DOC-04 chain. Two synthetic users + free document model fixture, cleanup by user ID. No payment/cloud/Frontend/deploy, schema, CI YAML or migration changes.

Output handoff: `docs/handoff/CORE_BACKEND_MVP_API_HANDOFF.md`, source-backed endpoint/path/access/DTO/validation map. It explicitly distinguishes old historical `docs/API_CONTRACT.md` from current implementation. Frontend work may start from it after CI verification; do not falsely mark Human B approval.

Gate: final branch MySQL8 7/7 and old suites, full 7/7 GitHub Actions including Chromium; review/merge into integration and rerun exact merged HEAD, document results. No main/deploy.
