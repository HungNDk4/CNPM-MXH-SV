# BE-07 — Refresh Token Lifecycle / Session Security

**Scope:** Core Backend Auth refresh only; FE and deploy remain unchanged.
**Base:** integration/team-dev-20261020 @ `a2c0544`, BE-05 integrated; BE-06 PR #42 still Draft and owns Post feed/controller. No overlap with open FE-01/DEP-01C PRs.

## Changes
- Refresh endpoint continues to accept `{refreshToken}` and return `{success:true,data:{accessToken,refreshToken}}`; preserves 400 missing/invalid-type input, 401 invalid/expired/revoked token.
- Reject unsafe JSON types and JWT missing valid id or jti. Verify signature, DB expiry, account ownership `stored.user_id === decoded.id`, and active account status.
- Transaction takes account row lock then refresh token row lock, conditionally marks old token revoked, inserts a new token and commits both together. Same-token concurrent requests cannot both succeed; transaction rollback leaves original token valid on insertion failure.
- New token DB expiry respects the earlier seven-day cap and signed JWT expiration. No new migration or JWT payload keys. BE-05 password change continues to revoke every refresh session.
- Existing stateless access JWTs remain valid until normal expiry; this is not an immediate access-token revoke or "logout all devices" endpoint.

## CI verification
`scripts/ubuntu/be07-refresh-session-regression.cjs` runs in a separate Node process from `scripts/ubuntu/auth-ownership.test.cjs` on **disposable MySQL8** in the existing workflow: rotation, malformed tokens, cross-account binding, invalid JWT identity, concurrent reuse, inactive accounts, BE-05 password change and second-user isolation. Synthetic fixture IDs only, no production data, cloud calls, schema edits or token logging.

**Verdict:** implementation complete; CI acceptance pending on exact final SHA. No merge/deploy.
