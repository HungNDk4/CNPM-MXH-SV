# BE-06 — Feed/Search API Query Hardening

**Scope:** Core Backend only. Baseline: `integration/team-dev-20261020` at `a2c0544` (BE-05 merged). Independent feature branch: `feat/be06-feed-search-validation-20261023`. No React, no DB schema/migration, no Render/Blob/TiDB, no shared GitHub CI workflow changes.

## Change summary

- `GET /api/posts`: Validate `page` (1–10000; default 1), `limit` (1–50; default 10), `type` (question/discussion/document), `search` (1–100 chars), `subject` (1–200 chars), and nonnegative two-decimal `minPrice/maxPrice`. Reject arrays, nonnumeric/overflow values, and inverted ranges with existing `422 {success:false,message}` envelope.
- Escape MySQL/TiDB LIKE wildcard characters so user-supplied `%` and `_` perform literal substring matching. Preserve trimmed title-only search and substring subject matching.
- Keep member-only general feed and guest-only active/free document metadata. A supplied invalid JWT still gets `401`; no guest fallback. Exclude **all** legacy paid/hidden/deleted posts from feed even for authenticated students; only free content is in MVP.
- Stable `created_at DESC, id DESC` ordering to avoid duplicate/missing records when timestamps tie. Preserve SafePost projection, `data` and `pagination` contract keys.

## Explicit exclusions

No feed recommendations, trending ranking, new sorting API, comments/likes changes, frontend UI, real-cloud writes, immediate JWT revocation, VNPay or payments, admin moderation API. Cursor paging and race-proof snapshot paging are **not** claimed; offset paging can shift as new posts arrive.

## Regression

`scripts/ubuntu/be06-feed-search-regression.cjs` is run by the existing disposable MySQL8 `mysql-integration.test.cjs` runner. Seven HTTP + SQL check groups: guest 401/public PDFs; status/price visibility; paginated deterministic order; wildcard literals; legacy price filters; invalid query rejection; response contract/DTO safety.

CI acceptance must be verified on the **exact PR HEAD**; initial implementation does not claim tests have run. Do not merge or deploy automatically. Reconfirm contract with Human B before changing Frontend expectations.
