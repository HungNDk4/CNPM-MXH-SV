# MVP Scope — Option B (Free-first)
**Product decision:** APPROVED by Human A (user) on 2026-10-17. **Detailed SRS/UC:** DRAFT; second teammate review pending.

## Decision
MVP prioritizes student learning social networking and **FREE document sharing**.
VNPay Sandbox, paid documents, checkout, orders and purchased-file rights are **DEFERRED** extensions, not MVP acceptance criteria. This does not approve deployment of existing payment code.

## MVP feature groups (functional details proposed for review)
| ID | Area | Primary outcome |
|---|---|---|
| FR-01/02 | Accounts | Register, login, logout, own profile/session |
| FR-03/09 | Discovery | Feed, search, categories, pagination (guest reading pending ADR-002) |
| FR-04/05/06 | Posts | Ask, discuss, view post, edit/delete own content |
| FR-07/08 | Interaction | Comment/reply, like/unlike |
| FR-10 | Profile | View user profile, edit own details, change password |
| FR-11 | Free documents | Direct upload of **exactly 1 PDF/post up to 10 MiB**, Guest views active metadata, authenticated download; storage provider DRAFT |
| FR-12 | Moderation | Minimal admin controls for inappropriate posts/accounts; exact policy OPEN |

## Proposed MVP user journeys
1. Discover posts → register/login → post a question → another user comments/likes → owner edits/deletes.
2. Upload FREE PDF → guest discovers/list/views public metadata → login required to download PDF; hidden/deleted documents unavailable.
3. Edit own profile/password → other accounts cannot edit it.
4. Admin hides a violating post; student cannot call admin API.
5. Direct requests to deferred paid/checkout APIs are denied, not just hidden in the UI.

## Safety gate (mandatory despite deferment)
Existing code contains paid-document fields, payment/order routes and callbacks. Before a public MVP demo:
- Disable/deny **server-side** creation/checkout/payment callbacks and paid document access, with negative tests, unless an explicit reviewed secure feature flag strategy is implemented.
- Prevent exposure of paid file URLs through post list/detail/static uploads. Never rely on hiding buttons as an access-control mechanism.
- Do not delete payment schema/data/code casually; full idempotency and Sandbox tests are deferred only **after** unsafe endpoints are verifiably inaccessible.
- Record results as PASS only after actually testing.

## Explicitly OUT of required MVP
VNPay Sandbox, paid documents and order history; real-money payouts; livestream, realtime chat, follows/friends, groups/clubs, AI recommendations, university enrollment verification unless later agreed.

## DOC-01 CONFIRMED: upload PDF trực tiếp (Human A, 2026-10-17)
Students upload PDF files through the website; **external-link-only is not the selected core document flow**. Current source only supports entering `file_url`; upload has not been implemented. See [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md).

**ADR-012 CONFIRMED (2026-10-18):** each document post must upload **exactly one valid PDF**, maximum **10 MiB (10,485,760 bytes inclusive)**; oversize/multiple/empty or wrong type is denied at backend. **Remaining design proposals (NOT approved yet):** private storage, controlled download endpoint details, MIME/content validation strategy, hosting, antivirus/scan, quotas and moderation.
**ADR-011 CONFIRMED (2026-10-18):** guest may view document list/title/description; PDF download requires login. Backend enforces 401 for unauthenticated requests; no public static PDF link. See [DOCUMENT_ACCESS_POLICY.md](DOCUMENT_ACCESS_POLICY.md).

**Pending questions:** anonymous access to non-document feed content (ADR-002), who qualifies as student, admin moderation depth, team role assignments and instructor/deadline constraints. Never infer these have been approved.

**Related:** docs/DECISIONS.md ADR-003/004, docs/SRS.md, docs/ops/TASK_BOARD.md.

**PDF limit decision reference:** [DOCUMENT_UPLOAD_SPEC.md](DOCUMENT_UPLOAD_SPEC.md) · ADR-012 in [DECISIONS.md](DECISIONS.md). Upload flow is not implemented or QA-verified yet.
