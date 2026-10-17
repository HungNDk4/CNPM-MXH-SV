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
| FR-11 | Free documents | Publish/access free learning material; storage choice DOC-01 OPEN |
| FR-12 | Moderation | Minimal admin controls for inappropriate posts/accounts; exact policy OPEN |

## Proposed MVP user journeys
1. Discover posts → register/login → post a question → another user comments/likes → owner edits/deletes.
2. Share FREE learning material → discover/read its description → access material using the method approved in DOC-01.
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

## Next product decision: DOC-01 (OPEN)
How should students share FREE documents?
- **A. External link only:** enter a Google Drive/other document URL. Simple implementation; availability/access policies depend on the external provider.
- **B. Upload to website:** user uploads files for direct access. Needs storage, size/MIME validation, copyright/moderation and permissions.
- **C. Both:** upload or external URL; most flexible but larger QA and architecture scope.

**Pending questions:** anonymous feed access, who qualifies as student, admin moderation depth, team role assignments and instructor/deadline constraints. Never infer these have been approved.

**Related:** docs/DECISIONS.md ADR-003/004, docs/SRS.md, docs/ops/TASK_BOARD.md.
