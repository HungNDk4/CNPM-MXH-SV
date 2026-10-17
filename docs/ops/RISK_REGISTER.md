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
