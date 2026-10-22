# BE-05 — Core Backend Profile/Account Security

**Source branch:** `fix/be05-profile-account-security-20261023` from `integration/team-dev-20261020` at `6b175a70e18105174ce7b15c7fab55d8d70ec868`.

**No overlap** at preflight: open PR #36 owns client FE-01, #33–35 own DEP-01C/PDF/cloud, #31/docs only. No open PR modifies `server/src/routes/user.routes.js` or the existing QA-01 backend regression. FE-04 [Issue #16](https://github.com/HungNDk4/CNPM-MXH-SV/issues/16) is **frontend ownership** and is intentionally untouched.

## BE-05 policy and API contract

- `GET /api/users/:id`: validates positive safe integer IDs, reads only active users, returns existing public-field projection `id, full_name, avatar_url, bio, university, major, created_at`; no email, role, wallet, password hash or tokens.
- `PUT /api/users/profile`: authenticated self-update, partial field allowlist (full_name max100 required when present; bio max1000; university/major max200; avatar_url max500 and HTTPS-only; nullable fields may clear). Reject unknown fields or ill-typed values with HTTP422, including privilege escalation fields `role, is_active, wallet_balance, email`. Re-read safe projection after save and return it in existing `{success:true, message, data}` envelope.
- `PUT /api/users/change-password`: authenticated current password verification, new password 6+ chars, at most 72 UTF-8 bytes (bcrypt truncation protection), disallow same password. Update password hash + revoke **all of that user's RefreshTokens** in a single Sequelize transaction. Refresh token reuse returns401; another user's sessions unaffected.
- Existing **Access JWT remains active until its normal expiry** (15-minute default); this change does not implement immediate access-token invalidation or strict concurrent refresh rotation. No database schema changes. Do not claim full all-session logout.
- No modification of Auth middleware, `auth.controller.js`, React pages, CI workflow, deployment variables or cloud.

## Acceptance plan

A standalone backend Node/Express HTTP regression runs against **disposable MySQL8** from the already existing Ubuntu CI job via the existing QA-01 script. It asserts exact safe DTO shape, owner/self-only edits, active/inactive public visibility, validation and no unintended writes, wrong/same/weak password rejection, two-user isolation and old-refresh revocation with password change. Rate limiter remains enabled; suite runs in a fresh process and tests only synthetic users.

**Status:** implementation staged; CI verdict to be added after actual run. No Render/TiDB provider writes, merge or deployment. 
