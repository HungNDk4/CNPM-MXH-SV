# TASK BOARD — canonical status and ownership
Baseline 2026-10-17 · status states: `TODO | IN_PROGRESS | BLOCKED | REVIEW | DONE | DEFERRED`.
**This is the only canonical status table.** A phase gate does not become PASS just because associated documents exist.
Owner clarification (2026-10-20): `Human A` = user, **now confirmed Core Backend at role level**; `Human B` = other teammate, **Frontend + Analysis/Design proposed and pending own acceptance of task scope**; `AI` = assistant executing only on explicitly allowed branches. Existing `Owner (proposed)` column is older planning data, **NOT task acceptance** and is not auto-changed by role selection. Exact package mapping in `docs/CORE_BACKEND_TEAM_HANDOFF_20261020.md`. `UNASSIGNED` means not accepted.

| Task ID | Priority | Scope / acceptance summary | Owner (proposed) | Status | Dependency | Evidence / PR |
|---|---|---|---|---|---|---|
| OPS-01 | P0 | Audit source and current repository | AI | DONE | None | source read at 0993a421; conversation review |
| OPS-02 | P0 | Foundation docs, workflow and CI | AI + Human A review | REVIEW | None | PR #1 draft; 87eb985e; CI PASS |
| OPS-03 | P0 | Create cross-session control + worktree playbook | AI + Human A review | REVIEW | OPS-02 branch | Draft PR #2; docs/build/syntax CI PASS; human review pending |
| OPS-04 | P0 | Review PR stack, agree 2-person module ownership, merge | Human A + Human B | BLOCKED | OPS-02/03 | Await human approval; [issue #18](https://github.com/HungNDk4/CNPM-MXH-SV/issues/18) |
| AN-00 | P1 | Human A confirms free-first MVP; VNPay Sandbox extension | Human A | DONE | None | User confirmed Option B 2026-10-17; ADR-003/004; details SRS still DRAFT |
| AN-06 | P1 | Human A confirms Guest document metadata browse; authenticated PDF download only | Human A | DONE | DOC-01 | User confirmed access policy 2026-10-18; ADR-011 + DOCUMENT_ACCESS_POLICY (QA NOT RUN) |
| AN-07 | P1 | Human A confirms max 10 MiB PDF, exactly 1 PDF per document post | Human A | DONE | DOC-01 | ADR-012 on 2026-10-18; T-UP-LIM cases specified, runtime QA NOT RUN |
| AN-08 | P1 | Human A confirms immediate PDF publish + Admin hide/delete after posting | Human A | DONE | DOC-01 + ADR-011/012 | ADR-013 confirmed 2026-10-18; T-PUBLISH-01..06 NOT RUN |
| AN-09 | P1 | Record low-cost/no-cost-inflation constraint for two-student project | Human A + AI | DONE | AN-00 | Human A stated budget concern 2026-10-18, ADR-014; **zero recurring fee target is PROPOSED, not vendor approval** |
| AN-10 | P0 | Human A requires a public online HTTPS website accessible at any time | Human A | DONE | AN-09 | ADR-015 confirmed 2026-10-18; provider/SLA NOT approved |
| DEP-01 | P0 | Source audit + isolated online Express/SQL/PDF feasibility before provider selection | AI + Human B review | IN_PROGRESS | AN-10; DEP-A02..06 pending | DEP01_FEASIBILITY_AUDIT; **isolated Vercel health-only deployment READY + guest/incognito browser evidence**; TiDB/Blob/app tests NOT RUN |
| DEP-01A | P0 | Offline Express handler smoke + source readiness audit, with CI evidence | AI + Human B review | REVIEW | DEP-01 branch + Human B review | Draft PR #7 initial commit 4c75b208; 4-job CI PASS, cloud tests NOT RUN |
| DEP-01B | P0 | Create safe standalone Vercel-ready HTTPS/health app scaffold + offline CI | AI + Human B review | REVIEW | DEP-01A; cloud access gated | poc/dep01-cloud-isolated; PR #7 commit 3ebee966; 5/5 CI PASS (39143252600); Vercel team 403; not cloud deployed |
| DEP-A01 | P0 | Isolated Vercel HTTPS/Node health page reachable without login | Human A + AI | REVIEW | DEP-01B offline CI PASS; user browser verification | **Vercel READY** project `mini-study-network-dep01`; user Chrome Incognito screenshot 2026-10-19 shows webpage + API success without login. Production alias was assigned, despite staging intent. Different-network and repeated uptime checks NOT RUN |
| DEP-A02 | P0 | Disposable TiDB MySQL-compatible + Sequelize v6 connectivity PoC | Human A + AI | BLOCKED | TiDB connector or verified account/credentials under secure setup | No TiDB resource created; no DB E2E |
| DEP-02 | P0 | Publish tested online demo and verify persistence across redeploy | UNASSIGNED | BLOCKED | DEP-01 approval, SEC-01/03/04, G4/G5 | Public HTTPS/DB/PDF/runtime proof required, NOT RUN |
| AN-01 | P1 | Actors/personas, scope and stakeholder assumptions | Human A + AI | TODO | G0 | SRS draft; needs review; [issue #17](https://github.com/HungNDk4/CNPM-MXH-SV/issues/17) |
| AN-02 | P1 | FR/NFR measurable acceptance and business rules | Human A + AI | TODO | AN-01 | SRS draft; [issue #17](https://github.com/HungNDk4/CNPM-MXH-SV/issues/17) |
| AN-03 | P1 | Permission matrix, account/student verification decisions | Human A + AI | TODO | AN-02 | Decisions pending |
| AN-04 | P1 | Use Case diagram & detailed use case specs | Human A + AI | TODO | AN-02/03 | templates ready; [issue #17](https://github.com/HungNDk4/CNPM-MXH-SV/issues/17) |
| AN-05 | P1 | Requirements traceability and sign-off | Human A + Human B | TODO | AN-04 | FR matrix draft |
| DS-01 | P1 | Context, component, deployment diagram | AI + Human A review | TODO | G1 | architecture draft |
| DS-02 | P1 | ERD, cardinality, SQL/ORM reconciliation | AI + Human A review | TODO | G1 | database/schema.sql |
| DS-03 | P1 | API/DTO/access-control contract | AI + Human B review | REVIEW | G1; both-human G03 acceptance pending | [Issue #11](https://github.com/HungNDk4/CNPM-MXH-SV/issues/11): API Contract v1 candidate DRAFT v0.1 + synthetic mocks on docs/api-contract-v1-20261021 from integration dffe5ae; static checks PASS; neither human has approved; #13 implementation NOT STARTED |
| DS-04 | P1 | UI sitemap, user flows and wireframes | AI + Human A review | TODO | G1 | source UI; [issue #17](https://github.com/HungNDk4/CNPM-MXH-SV/issues/17) |
| DS-05 | P1 | Sequence/activity diagrams for critical flows | AI + Human A review | TODO | DS-01/02/03 | Not started |
| DS-06 | P0 | Threat model, design gate | AI + two humans review | TODO | DS-02/03/05 | P0 vulnerabilities |
| SEC-01 | P0 | No leak of paid-document file URL | AI + Human A review | DONE | DS-03 + access decision | PR #20, #21, #24; pdf-security.test.cjs 18/18 PASS |
| SEC-02 | P2 | Full VNPay idempotent callbacks, payment QA for extension | UNASSIGNED | DEFERRED | Explicit reopening of payment scope | Payment source unsafe; routes gated by SEC-03 |
| SEC-03 | P0 | Hard-disable/gate paid APIs, paid document paths and callbacks with negative tests before MVP demo | AI + Human A review | DONE | AN-00 + security review | PR #20 (8a4a3b6); paid endpoints return 404/disabled; negative tests PASS |
| BE-01 | P1 | Public guest GET feed, optional auth | AI + Human A review | DONE | DS-03 | Feed public/optional-auth contract; guest/auth validated |
| BE-02 | P1 | Schema consistency + migration plan | AI + Human A review | DONE | DS-02 | Schema and migrations synchronized with Sequelize models |
| QA-01 | P0 | Auth/privacy tests + verify paid endpoints DENIED in MVP | AI + Human A review | DONE | DS-03/SEC-01/SEC-03 | auth-ownership.test.cjs 15/15 PASS; BE-05 9/9 PASS; BE-07 7/7 PASS |
| FE-01 | P1 | Post detail + threaded comments | Human B + AI | DONE | DS-03/04 + BE-01 | PostDetailPage.jsx connected; E2E validated |
| FE-02 | P1 | Like/unlike FE with correct API states | Human B + AI | DONE | DS-03/04 | PostCard and PostDetailPage reactions connected |
| FE-03 | P1 | Search/filter/pagination UI | Human B + AI | DONE | BE-01/DS-04 | SearchPage.jsx and quick-search floating panel connected |
| FE-04 | P1 | Profile/edit/password screens | Human B + AI | DONE | DS-03/04 | ProfilePage.jsx connected; BE-05 password change PASS |
| FE-05 | P1 | Edit/delete post UI with ownership | Human B + AI | DONE | DS-03/04 | Edit/delete post modals and ownership guards active |
| BE-03 | P1 | Admin hide/delete after PDF publication | Human A + AI | DONE | AN-03/DS-03/ADR-013 | PR #86; be08-admin-moderation-regression.cjs 7/7 PASS |
| DOC-01 | P1 | Human A selects direct PDF upload for free documents | Human A | DONE | AN-00 | User confirmed B 2026-10-17; ADR-010; detailed spec in DOCUMENT_UPLOAD_SPEC.md |
| DOC-02 | P1 | Finish PDF storage/retention/moderation API design without paid infrastructure | Human A + AI | DONE | DOC-01 + ADR-011/012/013 | DOC02_PRIVATE_STORAGE_DESIGN.md approved |
| DOC-03 | P1 | Implement authenticated single-PDF upload, validation and storage | Human A + AI | DONE | DOC-02 design approval + SEC-04 | PR #24 (8c18548); pdf-upload regression PASS |
| DOC-04 | P1 | Implement authenticated PDF download, guest metadata/login CTA, cleanup and UI | Human A + AI | DONE | DOC-03 + DOC-02 design approval | PR #25 (84d3013); pdf-download regression PASS |
| SEC-04 | P0 | Replace vulnerable Multer 1.x with reviewed patched release before upload implementation | AI + Human A review | DONE | DOC-01 + compatibility check | PR #23 (2dc4a7a); Multer 2.4.0 upgraded and CI locked |
| ADM-02 | P1 | Admin account moderation API, atomic lock, refresh revocation & audit | Human A + AI | DONE | AN-03/DS-03 | PR #89 merged (309e9a9); migration 20261110_adm02_account_audit.sql; adm02-account-moderation.test.cjs PASS |
| BE-11 | P1 | Authenticated owner-only My Posts API, pagination & sorting | Human A + AI | DONE | DS-03 | PR #90 merged (0f459d2); be11-my-posts.test.cjs PASS |
| FE-06 | P1 | Frontend integration for ADM-02 user moderation and BE-11 My Posts | Human B + AI | DONE | ADM-02/BE-11 | PR #91 merged (434cf82); fe-adm02-be11-contract.test.cjs PASS; AdminUsersPage & MyPostsPage |
| PAY-01 | P2 | Order/history/payment state UI | UNASSIGNED | DEFERRED | New explicit scope decision | VNPay Sandbox extension only |
| PAY-02 | P2 | Sandbox full flow/negative/idempotency tests | UNASSIGNED | DEFERRED | SEC-02 + scope reopened | NOT TESTED; out of MVP |
| QA-02 | P1 | Disposable MySQL integration suite | UNASSIGNED | REVIEW | G4 / Ubuntu CI | Ubuntu 24.04 + real MySQL 8 auth, refresh-token uniqueness/rotation, post CRUD smoke PASS run 39288366164; full integration suite still NOT RUN |
| QA-03 | P1 | E2E-01 full-stack browser smoke (responsive/manual hardware follow-up) | AI + Human A review | REVIEW | Preview integration + DOC-03/04 | Draft PR #30; Chromium/Vite/Express/MySQL 8/private PDF 12 scenario checks PASS at 31a5467, Actions 39592227079 (7/7 jobs); device/responsive/local Windows NOT RUN |
| QA-04 | P1 | Security/regression review | UNASSIGNED | TODO | G4/G5 | No tests |
| OPS-05 | P1 | Deployment/setup rehearsal | Human B + AI | TODO | G4 | README draft |
| QA-05 | P1 | Triage defects and release freeze | Two humans | TODO | QA-02/03/04 | No release |
| DOCS-01 | P1 | Final diagrams and traceability | Human A + AI | TODO | G6 | DRAFT diagrams |
| DOCS-02 | P1 | Academic report matched to source/test | Human A + AI | TODO | G6 | Not started |
| DOCS-03 | P1 | User/admin manuals | Human B + AI | TODO | G6 | Not started |
| DEMO-01 | P1 | Demonstration and defense scenario | Two humans + AI | TODO | G6 | Not started |
| OPS-06 | P1 | Final release archive and handoff | Two humans | TODO | G7 | Not started |

## Status transitions
- TODO → IN_PROGRESS only when owner/branch/acceptance clear.
- IN_PROGRESS → REVIEW only after commit/PR and test evidence (or honest NOT TESTED).
- REVIEW → DONE only after human approval and required tests.
- BLOCKED → TODO/IN_PROGRESS when explicit blocker resolved; record SESSION_LOG.
- DEFERRED when excluded from current approved scope; do not silently drop task.
- Never let AI mark human approval or runtime QA PASS merely from static review.

| OPS-07 | P1 | Ubuntu 24.04 reproducible local development instructions and real MySQL CI | AI + Human B review | REVIEW | Existing Node/Vite/Sequelize source | Draft PR #8, Ubuntu/MySQL integration + frontend/back+PoC checks 6/6 PASS on initial fixed commit 01077636; human laptop Ubuntu NOT RUN |

## Next pull
**OPS-07 Ubuntu environment PREPARED and CI validated** on PR #8 (dependent on #7), commit `01077636`: https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39288366164 **6/6 PASS**, including Ubuntu 24.04/MySQL 8 DB integration smoke and refresh-token unique JWT `jti` regression. Status REVIEW until human review and actual local Ubuntu setup; final doc HEAD requires CI recheck. Human A should run docs/UBUNTU_SETUP.md on their Ubuntu machine; never share .env/password. Existing cloud PoC separate. Main not changed. P0 SEC-01/03/04 and full PDF and DB E2E NOT RUN; no public backend deployment.
