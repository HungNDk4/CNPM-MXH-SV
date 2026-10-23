# BE-09 — Post Create/Edit Security

**Dependency:** stacked on [BE-06 Draft PR #42](https://github.com/HungNDk4/CNPM-MXH-SV/pull/42), exact head `f858622`; base of this PR must be `feat/be06-feed-search-validation-20261023`. BE-07 #44 and BE-08 #46 are still independent and unmerged. This is **not** a direct PR to integration until #42 is merged.

## Scope

- `POST /api/posts`: allow only `title,content,post_type,subject,tags,price`, require nonempty trimmed title (1–300), restrict types to `question`/`discussion` (default question), forbid paid price (but tolerate explicitly free 0). Author ID always from verified JWT. Reject document/legacy file URL creation through this JSON route; use existing private multipart PDF API.
- `PUT /api/posts/:id`: allow only `title,content,subject,tags,status`, require at least one field, validate types/lengths and unknown/mass-assignment fields. Partial edits normalize text and tag strings. Content max 10,000 characters, subject max 200, up to 12 nonempty tags of max 40 characters each. Null clears optional content/subject/tags; empty title rejected.
- Validate positive integer path ID on PUT/DELETE with `422`; missing real ID 404. Nonowner gets 403, unchanged Post DTO and envelope. An owner can still hide/delete their **active** post but cannot edit or restore a suppressed post. Compare-and-set update includes previous status to avoid racing a moderation change.
- Preserve existing Admin edit capability including **known hidden->active legacy restore**; BE-10 owns that separate unapproved policy. No physical file purge, status schema change, comment/like changes, Frontend work, payment, moderation queue or deployment.

## Automated regression

New `scripts/ubuntu/be09-post-validation-regression.cjs` uses synthetic student A, student B and a database-promoted synthetic Admin with disposable MySQL8; **8 HTTP groups** cover guest denial; successful question/discussion and normalization; malicious create rejected with zero row increase; legitimate partial edits; unknown/invalid fields denied without DB mutation; ownership and bad ID; hidden owner isolation; Admin input validation. It runs through existing **DOC-04** test hook in a separate Node process, not via overlapping BE-06 MySQL test hook or shared CI workflow.

**Verification:** CI not yet executed on exact BE-09 HEAD; require actual BE09 8/8 log and all existing 7 jobs PASS before declaring REVIEW READY. No Render/TiDB/Blob writes or merge/deploy.
