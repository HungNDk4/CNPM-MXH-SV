# MASTER PLAN / WBS — Mini Study Network
Version 0.1 · 2026-10-17 · DRAFT · Two human members + AI support.
**Purpose:** executable, traceable delivery plan; no arbitrary dates or percent-complete claims. Status/owners live ONLY in [TASK_BOARD.md](TASK_BOARD.md).

## Operating principles
- Requirements/design outputs are AI-authored drafts and reviewed by the user; the other teammate reviews technical feasibility.
- Work as small feature slices: FR → UC → API/schema/UI → code → tests → PR. Changes to approved rules require decision record.
- A phase passes only with its acceptance gate. Source existence ≠ runtime tested.
- P0 privacy/payment problems cannot be bypassed for an enabled paid-document feature.
- Only use VNPay Sandbox; no real payouts/wallet operations.

## Phase P0 — Foundation & control system
**Goal:** reproducible collaboration, branch discipline, official repo state.
Tasks: OPS-01 baseline source audit; OPS-02 docs/workflow/CI foundation (PR #1); OPS-03 cross-session plan/worktree controls (this workstream); OPS-04 human review/merge strategy and two-person owners.
Deliverables: repo guidelines, SRS draft, tech stack playbook, this plan, worktree registry, log, CI, state and task board.
Gate **G0**: reviewer approves scope; PR dependencies merged safely; CI frontend build + server syntax + ops docs checks PASS on final HEAD; local setup smoke evidence added; no unsupported claim that DB/payment E2E passed.
Dependencies: none. Important: PR #1 is still DRAFT at planning baseline; do not infer merger.

## Phase P1 — Requirements & use cases
**Goal:** lock an implementable MVP for student learning network.
Tasks: AN-01 actors/personas & scope; AN-02 FR/NFR and measurable acceptance; AN-03 business rules and permission matrix; AN-04 Use Case diagram + specifications; AN-05 requirements traceability review.
Deliverables: Charter v1, SRS reviewed, actors/UC catalog, UC specs (normal/alternate/error), matrix FR→UC→test; Decision Log approvals.
Gate **G1**: all MVP FR have actor, trigger, preconditions, success/exception paths, acceptance; unresolved payment/school verification explicitly scoped or deferred. Human-approved baseline, not just AI generated.
Dependencies: G0; source audit. Can research while PR awaiting merge, but do not present approval as granted.

## Phase P2 — Architecture & system design
**Goal:** design sufficient to implement without divergent modules.
Tasks: DS-01 context/component design + deployment/dev boundaries; DS-02 ERD and SQL↔Sequelize reconciliation; DS-03 API contract, response DTO and authorization map; DS-04 UI flows/wireframes and loading/error/empty states; DS-05 sequence/activity diagrams for auth/posts/document/payment; DS-06 threat model and design review.
Deliverables: versioned architecture, ERD, API tables & error contracts, UI screen map, diagrams with source and review notes, data migration plan.
Gate **G2**: every G1 use case maps to design components, schema and API; security invariants documented, cross-layer consistency reviewed by both humans. No production deployment requirement.
Dependencies: G1; a security spike may occur earlier on an isolated branch with review.

## Phase P3 — Security and backend stability
**Goal:** eliminate known P0 vulnerabilities before public file/payment demos.
Tasks: SEC-01 paid file URL leakage in list/detail/static paths; SEC-02 verified VNPay callback with idempotent state transitions; BE-01 guest optional auth feed; BE-02 schema drift/migration safe strategy; QA-01 automated auth/privacy/payment regression foundation.
Deliverables: validated response DTO, protected document access strategy, safe payment state machine or disabled paid flow, code/test PRs.
Gate **G3**: tests fail on old security regression and pass on fix; no double-credit on repeated/competing callbacks; guest feed contract works; DB migration tested against disposable DB; evidence captured.
Dependencies: G2 decisions concerning paid files; if paid flow deferred, disable access to unsafe endpoints rather than declaring them tested.

## Phase P4 — Core application end-to-end
**Goal:** usable MVP from browser to MySQL with two accounts.
Tasks: FE-01 post detail and comments/replies; FE-02 like/unlike; FE-03 search/filter/pagination; FE-04 profile & password management; FE-05 create/edit/delete posts and authorization; BE-03 admin moderation.
Deliverables: complete UI pages with empty/loading/error states, scoped backend enhancements, API tests and screenshots.
Gate **G4**: end-to-end demo guest→register/login→post→search/detail→comment/like→profile→moderate; negative ownership tests pass.
Dependencies: G1/G2; G3 for exposing data.

## Phase P5 — Documents and optional Sandbox payments
**Goal:** verified document sharing; paid-document flow only if approved.
Tasks: DOC-01 determine URL-only vs upload/private storage; DOC-02 secure download + entitlement; PAY-01 order/history UI; PAY-02 VNPay Sandbox integration/negative cases.
Deliverables: document flow, access control, Sandbox evidence and explicit financial assumptions (if approved).
Gate **G5**: free docs accessible per rules; paid docs never accessible without entitlement, failed/replayed payments do not grant access; evidence real Sandbox or feature documented as deferred.
Dependencies: G3, G4, and ADR on whether paid docs mandatory.

## Phase P6 — System test, hardening & reproducible demo
**Goal:** demo build reproducible by another teammate.
Tasks: QA-02 integration tests with seeded disposable MySQL; QA-03 E2E smoke/multi-browser; QA-04 error, security & responsive regression; OPS-05 deployment/config rehearsal; QA-05 bug triage, freeze candidate.
Deliverables: test run records and screenshots, reproducible setup, release notes, known limitations, bug backlog.
Gate **G6**: all in-scope acceptance tests have evidence; no open P0; CI passes; both teammates can reproduce core demo on a clean setup.
Dependencies: G4 and chosen G5 scope.

## Phase P7 — Academic report, defense & final handoff
**Goal:** align report with implemented system, no fictional claims.
Tasks: DOCS-01 final UML/ERD screenshots and evidence references; DOCS-02 full report and architecture rationale; DOCS-03 user/admin manuals; DEMO-01 defense script and scenario; OPS-06 final archive/handoff.
Deliverables: final report, diagrams, usage guide, demo and source snapshot.
Gate **G7**: report references final commit and observed tests, reviewers sign off, known gaps explicitly listed.
Dependencies: G6.

## Work allocation model
- Human A (the user): product/problem and academic analysis owner; reviews all requirements/design/acceptance outputs; may also code.
- Human B: independent implementation/review capacity; exact module assignments OPEN pending agreement.
- AI: research, draft, implementation PRs and test automation; cannot sign off for either human.
- No invented deadlines, staffing expertise, instructor requirements, payments approval. Record actual assignments in TASK_BOARD and approvals in DECISIONS.

## Dependency map
```text
G0 → G1 → G2 → G3 → G4 → G6 → G7
              ↘   G5 ───↗
G3 security fixes may be prioritized as a safety spike before all G2 docs are final.
```

## Priority / interruptions
P0 security or data corruption preempts any feature PR. New feature scope only via DECISIONS update + traceability + board. No AI modifies payment logic or schema merely to unblock a demo.

## Acceptance packet for EACH task
Task ID & owner, FR/UC links, current branch and commit, related PR, changed file manifest, tests actually run with PASS/FAIL/SKIP, human review decision, operational handoff. See [SESSION_HANDOFF_TEMPLATE.md](SESSION_HANDOFF_TEMPLATE.md).
