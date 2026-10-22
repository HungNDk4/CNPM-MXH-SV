# Risk Register — Operational / Product
**DRAFT 2026-10-17.** Priorities are review guidance, not validated security test findings.

| ID | Priority | Risk / impact | Mitigation / evidence required | Owner |
|---|---|---|---|---|
| R-01 | P0 | Paid-document `file_url` exposed by feed API | Redaction safe DTO on list/detail; protected file store; negative tests; SEC-01 | Unassigned |
| R-02 | P0 until routes denied | Double-credit seller from VNPay return and IPN callbacks | MVP: SEC-03 server-side disable/deny + negative tests; extension: SEC-02 idempotent DB transition/concurrency tests | Unassigned |
| R-03 | P0 | Static /uploads may disclose paid files even if link hidden | Private storage or validated download endpoint, deny public access | Unassigned |
| R-04 | P1 | Guest feed 401 despite expected public viewing | Optional-auth route and authorization regression | Unassigned |
| R-05 | P1 | SQL/Sequelize schema drift & alter on dev DB | Diff DB model, migrations and disposable test database | Unassigned |
| R-06 | P1 | Frontend placeholder pages block demo | Prioritize core feature slices and acceptance | Unassigned |
| R-07 | P1 | Two humans/AI update same file or branch | Worktree registry, PR ownership, small slices, no direct main changes | Both humans |
| R-08 | P1 | Cross-session context loss or stale notes | PROJECT_CONTROL read-first; remote HEAD checks; logs+handoff | Both humans + AI |
| R-09 | P1 | Fake completion claims when only static check passed | Separate SOURCE/CI/QA/APPROVAL labels | Both humans + AI |
| R-10 | P2 | Versions/docs mismatch or upgrades break the app | Pinned lockfile, major-version docs, CI, ADR before upgrading | AI + reviewer |
| R-11 | P1 | Copyright/privacy breach via uploaded student documents | Policy, upload validation, moderation, removal workflow | Both humans |

**Decision Option B (2026-10-17):** deferring payment does not eliminate R-01/02/03 unless direct API/file access is denied and tested; until then they remain unresolved P0 exposure.

Re-evaluate at each gate. Do not implement real-money operations or expose sensitive files without the P0 gates.

## Online public demo new risks (2026-10-18, ADR-015)
| ID | Priority | Risk | Mitigation / evidence required | Owner |
|---|---|---|---|---|
| R-11 | P0 | Local-only or sleeping free backend means lecturer cannot use link reliably any time | DEP-01 provider selection + off-network uptime/cold-start checks, recovery | Unassigned |
| R-12 | P0 | File bytes saved on ephemeral serverless disk lost after restart | Private durable Blob and relational DB, redeploy persistence smoke, no public static PDFs | Unassigned |
| R-13 | P0 | Vercel Function 4.5 MB payload rejects approved 10 MiB PDF | Client direct private Blob upload; verify bytes/MIME/owner before active, test 10 MiB and 10 MiB+1 | Unassigned |
| R-14 | P1 | TiDB MySQL protocol compatibility is not identical to existing MySQL 8/Sequelize 6 migrations | Disposable TiDB PoC: FK, ENUM, JSON, indexes, auth CRUD, transactions | Unassigned |
| R-15 | P1 | Free quota exhaustion, plan changes or unintended billing interrupt demo | Verified quota/spending limits, snapshots/backup, approval before any paid tier | Human A + Human B |

## DEP-01C live cloud follow-up — 2026-10-22 (risks still open)

| Risk ID | Priority | Current observable risk | Evidence / required mitigation | Owner |
|---|---|---|---|---|
| R-DEP16 | P0 release gate | Website/health up, but production-like Blob bytes and private PDF permissions untested | Run real 10MiB and 10MiB+1 PDF, guest/cross-user/hidden/deleted checks, verify no public token/storage URL leak. | AI + Human A/B review |
| R-DEP17 | P1 | Render Free `autoDeploy=yes`; doc commits to live source branch can restart service | Docs checkpoint on separate stacked branch; control deploys, record commit/status, persistence after redeploy. | Human A + AI |
| R-DEP18 | P1 | Startup TiDB authentication does not prove end-to-end ORM schema/transaction consistency or backup/restore | Synthetic CRUD/FK/index/rollback; review backup/export and DB usage budget. | AI + Human A/B review |
| R-DEP19 | P1 | Free tier idle/cold start, network limits, and actual uptime unknown | Test after idle/off-network and plan a demo fallback; do not advertise an uptime SLA. | Human A + Human B |
| R-DEP20 | P1 | Deployed `npm ci` reported audit vulnerabilities (backend 5, frontend 11), which did **not** cause startup failure | Review `npm audit` advisories for runtime exposure, fix targeted dependencies with regression tests; **do not blindly run `npm audit fix --force`**. | AI + Human B review |

**Proof boundary:** 2026-10-22 Render confirmed LIVE, GET `/api/health` 200 and Sequelize auth success; Human A verified 8 tables. Security/product release gates remain pending. This table documents risks without reclassifying untested protections as PASS.
