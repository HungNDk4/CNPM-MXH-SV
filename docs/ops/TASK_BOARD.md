# TASK BOARD — canonical status and ownership
Baseline 2026-10-17 · status states: `TODO | IN_PROGRESS | BLOCKED | REVIEW | DONE | DEFERRED`.
**This is the only canonical status table.** A phase gate does not become PASS just because associated documents exist.
Owner: `Human A` = user/design reviewer; `Human B` = other teammate; `AI` = assistant executing in branch. Proposed allocation is not a human commitment. `UNASSIGNED` means not accepted.

| Task ID | Priority | Scope / acceptance summary | Owner (proposed) | Status | Dependency | Evidence / PR |
|---|---|---|---|---|---|---|
| OPS-01 | P0 | Audit source and current repository | AI | DONE | None | source read at 0993a421; conversation review |
| OPS-02 | P0 | Foundation docs, workflow and CI | AI + Human A review | REVIEW | None | PR #1 draft; 87eb985e; CI PASS |
| OPS-03 | P0 | Create cross-session control + worktree playbook | AI + Human A review | REVIEW | OPS-02 branch | Draft PR #2; docs/build/syntax CI PASS; human review pending |
| OPS-04 | P0 | Review PR stack, agree 2-person module ownership, merge | Human A + Human B | BLOCKED | OPS-02/03 | Await human approval |
| AN-01 | P1 | Actors/personas, scope and stakeholder assumptions | Human A + AI | TODO | G0 | SRS draft; needs review |
| AN-02 | P1 | FR/NFR measurable acceptance and business rules | Human A + AI | TODO | AN-01 | SRS draft |
| AN-03 | P1 | Permission matrix, account/student verification decisions | Human A + AI | TODO | AN-02 | Decisions pending |
| AN-04 | P1 | Use Case diagram & detailed use case specs | Human A + AI | TODO | AN-02/03 | templates ready |
| AN-05 | P1 | Requirements traceability and sign-off | Human A + Human B | TODO | AN-04 | FR matrix draft |
| DS-01 | P1 | Context, component, deployment diagram | AI + Human A review | TODO | G1 | architecture draft |
| DS-02 | P1 | ERD, cardinality, SQL/ORM reconciliation | AI + Human A review | TODO | G1 | database/schema.sql |
| DS-03 | P1 | API/DTO/access-control contract | AI + Human B review | TODO | G1 | API contract draft |
| DS-04 | P1 | UI sitemap, user flows and wireframes | AI + Human A review | TODO | G1 | source UI |
| DS-05 | P1 | Sequence/activity diagrams for critical flows | AI + Human A review | TODO | DS-01/02/03 | Not started |
| DS-06 | P0 | Threat model, design gate | AI + two humans review | TODO | DS-02/03/05 | P0 vulnerabilities |
| SEC-01 | P0 | No leak of paid-document file URL | UNASSIGNED | BLOCKED | DS-03 + access decision | Bug identified; no code fix |
| SEC-02 | P0 | VNPay idempotency/security tests or gate off unsafe flow | UNASSIGNED | BLOCKED | DS-03/06 | Bug identified; no code fix |
| BE-01 | P1 | Public guest GET feed, optional auth | UNASSIGNED | TODO | DS-03 | route currently blocks guest |
| BE-02 | P1 | Schema consistency + migration plan | UNASSIGNED | TODO | DS-02 | ORM drift |
| QA-01 | P0 | Automated auth/privacy/payment regression tests | UNASSIGNED | TODO | DS-03/SEC-01 | CI currently only syntax/build |
| FE-01 | P1 | Post detail + threaded comments | UNASSIGNED | TODO | DS-03/04 + BE-01 | FE page stub |
| FE-02 | P1 | Like/unlike FE with correct API states | UNASSIGNED | TODO | DS-03/04 | BE route exists |
| FE-03 | P1 | Search/filter/pagination UI | UNASSIGNED | TODO | BE-01/DS-04 | UI placeholders |
| FE-04 | P1 | Profile/edit/password screens | UNASSIGNED | TODO | DS-03/04 | FE page stub |
| FE-05 | P1 | Edit/delete post UI with ownership | UNASSIGNED | TODO | DS-03/04 | BE routes exist |
| BE-03 | P1 | Admin moderation (approved scope) | UNASSIGNED | TODO | AN-03/DS-03 | Design pending |
| DOC-01 | P1 | Decide URL-only vs private upload and copyright policy | Human A + Human B | BLOCKED | AN-02 + decisions | Proposal open |
| DOC-02 | P0 | Secure document access/download | UNASSIGNED | BLOCKED | DOC-01 + SEC-01 | No secure endpoint |
| PAY-01 | P2 | Order/history/payment state UI | UNASSIGNED | DEFERRED | Payment decision + G3 | Sandbox only |
| PAY-02 | P0 | Sandbox full flow/negative/idempotency tests | UNASSIGNED | DEFERRED | SEC-02 + G5 choice | Not tested |
| QA-02 | P1 | Disposable MySQL integration suite | UNASSIGNED | TODO | G4 | No tests |
| QA-03 | P1 | Browser E2E smoke and responsive test | UNASSIGNED | TODO | G4 | No tests |
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

## Next pull
First: review OPS-02/OPS-03 PR stack and confirm scope; then AN-01 + AN-02. Safety bugs SEC-01/SEC-02 remain highest-priority before enabling the paid flow.
