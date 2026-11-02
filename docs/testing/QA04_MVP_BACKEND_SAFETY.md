# QA-04 — Core Backend MVP Safety / Negative Regression

**Baseline:** `integration/team-dev-20261020` @ `d442aab964b532fbaf11b9b9335a288b904e352b` with BE-04..BE-10 already merged and 7/7 integrated CI green. This QA package is **not** a BE-11 feature and does not reopen paid/checkout/VNPay scope.

## Goal

Prevent accidental reintroduction of old paid routes and unsafe document disclosure into the **free-first** MVP. `server/src/app.js` deliberately does **not mount** the legacy `/api/orders` and `/api/payment` routers, even though their source/models remain. Tests confirm this at **real HTTP** level rather than trusting code inspection.

Eight MySQL8 groups:
1. Disposable student + DB-authorized Admin fixtures.
2. Guest GET/POST order and forged VNPay return/IPN requests all 404.
3. Same endpoints 404 for both logged-in Student/Admin; no new Orders/DocumentAccess.
4. Paid/legacy URL JSON Post creation denied 422, no DB records inserted.
5. Legitimate single free PDF upload, guest safe metadata and student exact-byte protected download; static URL 404.
6. Seeded legacy paid, hidden and deleted PDF posts invisible to feed/detail/download/comment/likes; original private legacy path never exposed.
7. Generic PUT cannot inject paid/file fields or re-enable post with `status:active`.
8. Admin hide makes PDF unavailable while Order/DocumentAccess counts remain unchanged.

**Execution:** `scripts/ubuntu/qa04-mvp-backend-safety-regression.cjs` in a fresh subprocess from already-registered `scripts/ubuntu/pdf-download.test.cjs`. Synthetic identities and private file keys cleaned by ID/key. No external cloud or payment provider calls, no schema reset/drop/truncate, no Frontend, app routing, CI workflow or deployment modifications.

**Acceptance gate:** QA-04 8/8 MySQL8 real HTTP groups and existing BE04..BE10, SEC01 and DOC04 regressions PASS, full 7/7 GitHub CI jobs incl. Chromium. Only Draft PR is authorized. Public production acceptance, architecture docs and human device QA remain separate.
