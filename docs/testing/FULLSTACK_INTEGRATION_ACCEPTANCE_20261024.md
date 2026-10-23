# FULL-STACK INTEGRATION / FE API HANDOFF — ACCEPTANCE MATRIX

**Date:** 24/10/2026 (ICT). **Project:** Mini Study Network — `HungNDk4/CNPM-MXH-SV`. **Target:** `integration/team-dev-20261020` @ `488306e4e72272c3a55bfd230ca895908da69879`. **Verdict:** **PARTIAL FULL-STACK** — merged Backend MVP + EXT-01..04 + integrated Auth/PDF UI tested; **NOT full React social/extension UI acceptance**.

**Scope of this report:** source+CI evidence consolidation and new exact-HEAD QA on docs-only branch. No React/Node API implementation changes, production database mutations, Render/Blob/TiDB deploy, mobile-device tests or `main` merge.

## 1. Implementation vs real integration

| Group | Merged Backend | Integrated React UI | Real test/evidence | Acceptance |
|---|---|---|---|---|
| Auth register/login/refresh/logout | Yes | Yes | Real Chromium E2E01 12-scenario suite plus MySQL8 Auth/refresh regression | **PASS for exercised flows** |
| Free PDF upload / metadata / download / access | Yes | Yes | Real Chromium, actual Vite proxy + Express + MySQL8 + PDF private filesystem; boundary 10 MiB, guest vs B, 401/404 | **PASS for exercised flows** |
| Public doc feed / guest document detail | Yes | Yes | Chromium E2E01 | **PASS** |
| Posts social feed/create/edit | Yes | React Home + Create Post, not comprehensive browser coverage | Backend MySQL8 suites; social CRUD browser acceptance incomplete | **PARTIAL** |
| Root Comments / Replies / Likes | Yes | **No on current integration** (Post Detail is stub) | Backend BE-04 + QA-04 + EXT04 real MySQL8; FE-01 PR #36 has separate Chromium evidence only | **BACKEND PASS / FE PENDING** |
| EXT-01 Bookmarks | Yes | No | EXT-01 9/9 real MySQL8 HTTP groups | **BACKEND PASS / FE PENDING** |
| EXT-02 Follow System | Yes | No | EXT-02 9/9 real MySQL8 HTTP groups | **BACKEND PASS / FE PENDING** |
| EXT-03 Admin Audit Log | Yes | No | EXT-03 9/9 real MySQL8 HTTP; atomic rollback check | **BACKEND PASS / Admin UI N/A** |
| EXT-04 In-app Notifications | Yes | No | EXT-04 10/10 real MySQL8 HTTP; rollback/privacy/read-state | **BACKEND PASS / FE PENDING** |
| Account profile / password | Yes | Profile route/component exists, browser UI coverage incomplete | BE-05/Auth MySQL8 security regression | **BACKEND PASS / FE QA PENDING** |
| Payment / paid PDFs / VNPay | Not mounted / deferred | Legacy `orderAPI` & placeholder `/payment/result` exist | API 404/security tests, not a paid feature | **OUT OF SCOPE** |
| Public cloud full-stack acceptance | Separate DEP-01C draft PR #33 | Separate Render/TiDB/Blob PoC | GitHub CI uses **local ephemeral MySQL8 and private disk**, not provider infrastructure | **NOT ACCEPTED HERE** |

**Important:** FE-01 [Draft PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36), head `37b5c2c50f844e437cdb70ba2967e477febad530`, has its own [CI #39825835720](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39825835720) 7/7 SUCCESS and 10 FE01 scenarios. But it is **unmerged**, built from an older integration base, and GitHub currently reports **mergeable=false**. Those checks **cannot** be counted as E2E proof for FE-01+EXT04 on the latest shared commit. Rebase/resolve PR conflict and run combined E2E later under FE owner's separate approval.

## 2. Exact integrated GitHub Actions evidence

| Evidence | GitHub Actions | Observed result |
|---|---|---|
| Authoritative integration HEAD after EXT-04 merge | [Run #40015007328](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/40015007328) | **7/7 jobs completed SUCCESS**, at `488306e4e72272c3a55bfd230ca895908da69879` |
| Chromium E2E-01 | E2E-01 Chrome + React + Express + MySQL + PDF job | **12/12 named browser scenarios PASS; 0 failed** |
| EXT-01 Bookmarks | Ubuntu 24.04 + MySQL8 job | **9/9 real HTTP groups PASS** |
| EXT-02 Follow | same MySQL8 job | **9/9 real HTTP groups PASS** |
| EXT-03 Admin Audit | same MySQL8 job | **9/9 real HTTP groups PASS** |
| EXT-04 Notifications | same MySQL8 job | **10/10 real HTTP groups PASS** |
| QA-04 and Backend Final | same MySQL8 job | **QA-04 8/8, Backend Final 7/7** |
| Frontend production build / Backend syntax | separate Actions jobs | SUCCESS |

Actual test environment: GitHub ephemeral Ubuntu 24.04 runners, Node from `.nvmrc`, disposable MySQL 8.0 service, `database/schema.sql` and DocumentFile migration, isolated filesystem PDF store, Vite on 5173, Express on 5000, pinned Playwright 1.56.1 and real Chromium. `client/e2e/e2e01.test.cjs` checks *real rendered UI and HTTP*; MySQL8 scripts exercise Backend HTTP separately in the same workflow. They are **not the same E2E scenarios** and must be reported separately, not added as if one browser suite covered everything.

### The 12 existing Chromium scenarios

1. React/Vite proxy to live Express health.
2. Student A registers via React and gets JWT.
3. React uploads actual PDF multipart; document detail renders.
4. Browser PDF download bytes match original.
5. Guest safe doc metadata and login-required download.
6. Guest/malformed token and static PDF URL access denied.
7. Student B free document download works; cross-user edit/delete denied.
8. Expired Blob download refreshes JWT once and retries.
9. Invalid PDF rejected; over-10-MiB PDF rejected.
10. Exactly 10 MiB PDF accepted.
11. Hidden/deleted PDF inaccessible using stale IDs.
12. Logout/login and one-time refresh token rotation/reuse rejection.

The user-facing view being tested in E2E01 is **primarily Auth and PDF**. It does not cover integrated React Posts Comments/Likes/Follow/Bookmarks/Notifications UIs because these screens are not shipped on current integration.

## 3. API↔React source compatibility check

| Caller/wrapper | Current source status | Action |
|---|---|---|
| `client/src/lib/axios.js` | `baseURL:'/api'`; Bearer header; on `TOKEN_EXPIRED` refresh token and retry once; handles Blob JSON 401 | Retain; no cloud guarantees |
| `authAPI`, `postAPI`, `commentAPI`, `likeAPI`, `userAPI`, `documentAPI` | Existing FE wrappers match mounted Backend paths | Maintain on FE branches; no Backend API rewrite needed |
| `orderAPI` | Still defined in FE source but `/api/orders` is **not mounted** | Do not call; leave payment out of MVP |
| `bookmarkAPI` | Not implemented | Human B adds wrapper only after contract review |
| `followAPI` | Not implemented | Human B adds wrapper and optional Follow screen |
| `notificationAPI` | Not implemented | Human B adds wrapper and inbox/unread badge UI |
| `auditLogAPI` | Not implemented | Only if Admin UI assigned; never expose log to students |
| `client/src/pages/posts/PostDetailPage.jsx` | Placeholder on integration | FE-01 PR #36 review/rebase/merge separately, then rerun combined Chrome |

Response mapping gotchas: `AxiosResponse.data.data` usually holds items, feed/inbox `AxiosResponse.data.pagination` is a sibling, Like toggles return `AxiosResponse.data.liked` at top level; PDF download uses authenticated Blob (not a public path). No Backend `likedByMe` exists, so initial Like state in FE remains unresolved.

## 4. Integration acceptance gates / tasks left

- **Green today:** Core Backend MVP + EXT-01→04 merged/verified on integration; Auth/PDF React E2E PASS; no conflicts between completed Backend extensions and FE-01/cloud PR file lists.
- **Not green yet:** FE-01 PR #36 is Draft/unmerged and not tested atop EXT04; integrated React Post Detail remains stub. Profile UI/Posts full browser regression, Bookmark UI, Follow UI, Notifications UI and Admin log UI have no combined UI acceptance. No manual device QA or deployed provider verification.
- **Team Human B (FE) handoff:** use [current canonical API contract](../handoff/CORE_BACKEND_MVP_API_HANDOFF.md). FE-01 rebase/review via its existing PR (no duplicate feature PR), then add extension service wrappers and UI on separately assigned FE branches; Human A does not modify FE as part of this task.
- **Next combined QA after actual FE merge:** add real Chromium checks for Post Detail+Comments/Replies/Likes (including 2-user owner-403 and guest gates), Bookmark add/remove/hidden status, Follow unique+self/active, Notifications badge/list/read and moderation suppression, Admin audit read 401/403/200, refreshed session; ensure all tests run against exact combined integration HEAD.
- **Before using an existing DB:** assess and manually apply reviewed EXT-01/02/03/04 additive migrations (see canonical handoff); current ephemeral CI schema includes them automatically. Real Render+TiDB+Vercel Blob path requires a separate live acceptance plan and permissions.

### Reproducibility

- CI workflows: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml); existing E2E script: [`client/e2e/e2e01.test.cjs`](../../client/e2e/e2e01.test.cjs); MySQL chain: [`scripts/ubuntu/pdf-download.test.cjs`](../../scripts/ubuntu/pdf-download.test.cjs).
- CI Node test job loads real schema on a **throwaway MySQL 8 service**. Do **not** run it against a persistent local/student/production DB; browser test explicitly requires `E2E_DISPOSABLE_DB=true` and isolated private PDF directory. Use `database/schema.sql` only on a fresh throwaway DB.
- The docs handoff branch should have its **own exact commit CI run** with raw logs checked. Prior integration CI is preserved as the accepted starting baseline; it cannot prove a new docs commit passed until checked.

## 5. Final classification

**ACCEPTED:** Source-verified Backend MVP/EXT01–04 and integrated React **Auth/PDF** flows, in ephemeral CI.

**NOT YET ACCEPTED:** full React social feed/detail + Comments/Likes UI, extension UI, production/cloud. This does not invalidate passed Backend tests or block the FE team from building against the frozen contracts.

**No production code change or cloud deploy is made by this documentation-only handoff.**
