# DEP-01C post-OAuth live acceptance — 2026-10-22

## DEP-01C auth recovery — 2026-10-22 23:22 ICT (current)

**Register PASS (201), Login PASS (200), Logout response PASS (200)** on new Render Free deployment. Render deployment `dep-dbd38o2vcj2c739h61sg` (source `71499dfd63d21feb019d6144efcadc7ee9232951`) is LIVE following a configuration deployment at 16:06 UTC. Human A observed successful browser registration, login and logout. Render request logs corroborate `POST /api/auth/register` 201 at 16:14:38.811Z, `POST /api/auth/logout` 200 at 16:15:12.440Z and `POST /api/auth/login` 200 at 16:22:34.422Z.

Both access and refresh JWT signing run before registration/login success per deployed `auth.controller.js`, so their signing inputs were usable at those requests. No credential values were inspected. Logout 200 alone does NOT prove refresh revocation. Refresh rotation/reuse, real cloud private PDF bytes, 10MiB/+1, SHA256, two-user permissions, hidden/delete and redeploy persistence remain untested.

Prior 22:49 ICT auth HTTP500 remains below as historical evidence. DEP-01C remains IN_PROGRESS; DEP-02 release BLOCKED. Two synthetic users from the old failed attempt still require controlled cleanup.

## Historical 22:49 ICT failing acceptance (superseded by later live deployment)

**Verdict: FAIL for working registration/login; authenticated PDF acceptance BLOCKED.** Render infrastructure remains LIVE. This is actual cloud HTTP evidence, not a source-CI result.

## Target and evidence window

- Origin: https://mini-study-network-dep01-demo.onrender.com/
- Render workspace confirmed by Human A: `tea-dbcfvd7b9u1s739pjvs0`.
- Service `srv-dbcg9rbrjlhs73bc8870`, compute `plan=free`, Singapore; `autoDeploy=yes`.
- Latest deployment before/after verification: `dep-dbctc429lscs73f209t0`, LIVE, source `71499dfd63d21feb019d6144efcadc7ee9232951`.
- HTTP tests: **2026-10-22 15:46:51–15:49:03 UTC / 22:46:51–22:49:03 ICT** through WSL Python HTTPS with certificate verification. Windows Node fetch timed out; WSL curl/Python succeeded.
- In-app browser independently rendered the guest homepage, login/register controls and empty document feed. No browser form submission or browser download was completed.
- No service/env/credential/schema/billing changes, deployment, restart, main update or PR merge.

## Vercel recovery

| Check | Status | Observed evidence |
| --- | --- | --- |
| Fresh-session native Vercel MCP | BLOCKED | `list_teams=[]`; scoped project and store reads still HTTP 403 for `hunny-17s-projects` / `team_Jbm1nyd45p2k6a28LQWDi55P`. No claim that new-session reload repaired MCP. |
| Authenticated CLI scope/project | PASS | Existing WSL Vercel CLI 65.0.0 inspected `hunny-17s-projects/mini-study-network-dep01`, project `prj_YZzSucZKTjpzzghzVBFmZf02ZY21`. |
| Private store metadata | PASS | `store_nrzupcGOuJobNPJs`, name `mini-study-dep01-private-pdfs`, Access Private, region sin1, billing state Active, 0 objects / 0B before and after tests. Active is not proof of zero-cost usage/quota. |
| Environment key metadata | PASS | CLI GET project env with `decrypt=false`; selected only key/type/target fields. `BLOB_READ_WRITE_TOKEN` exists, type encrypted, production/preview/development. No values printed, exported or committed. |
| Blob application put/get/delete | BLOCKED | No authenticated application session; metadata/key existence does not authenticate the Render Blob credential or prove byte operations. |

CLI fallback reused existing login and explicit scope. No credential rotation or additional OAuth grant was requested.

## Live HTTP results

| Check | Status | Actual outcome |
| --- | --- | --- |
| HTTPS health; SPA root/login/register/document deep link | PASS | Health JSON `success:true`; five responses HTTP 200. SPA checks assert HTML/script presence, not browser form behavior. |
| TiDB-backed guest document search | PASS | HTTP 200, empty synthetic search result, no internal storage/credential field in that response. |
| Two synthetic account registrations | FAIL | Both HTTP 500 instead of 201, message `secretOrPrivateKey must have a value`. |
| Correct-password login for synthetic B | FAIL | HTTP 500 instead of 200, same signing error. |
| Actual TiDB user insert/read and uniqueness | PASS (limited) | Subsequent registrations using the exact two synthetic emails return 409. Wrong password for B returns 401; correct password reaches JWT signing. This demonstrates user data persisted before the registration error, not a successful auth flow. |
| Invalid register / wrong password / invalid refresh | PASS | 422 / 401 / 401. Valid refresh rotation/logout remain blocked. |
| Guest PDF download/upload | PASS | HTTP 401 for download paths including nonexistent ID and upload with a small valid synthetic PDF. Does not test authenticated file validation or size. |
| Forged JWT download-independent auth/upload | PASS | `GET /api/auth/me` and PDF upload both 401. |
| Unknown API / legacy public uploads / private-documents path | PASS | HTTP 404. |
| Legacy paid endpoints | PASS (tested paths only) | POST `/api/payments/create-payment`, GET `/api/payments/vnpay_return`, GET `/api/payments/vnpay_ipn`, POST `/api/orders`: all 404; GET `/api/admin/users` also 404. No claim about every untested route. |
| Two authenticated students, owner/cross-user 403 | BLOCKED | JWT issuance fails before sessions exist. |
| Valid PDF publish/download, SHA256 equality | BLOCKED | No authenticated upload; no PDF post or Blob object created. |
| Inclusive 10,485,760 bytes and +1 rejection | BLOCKED | NOT EXECUTED after auth failure. An unauthenticated 401 would not prove the limit. |
| Spoofed PDF / exactly-one-file rule | BLOCKED | Authenticated validation not reached. |
| Hidden/deleted revocation; admin moderation | BLOCKED | No document fixture/session; no authorized admin test account. |
| TiDB document transactions/rollback/FK/JSON | BLOCKED / NOT RUN | Document workflow blocked; direct SQL, handshake inspection and schema compatibility tests not run. |
| Restart/redeploy/sleep persistence, quota/recovery | NOT RUN | No restart or deployment triggered, no deliberate idle test. |
| Full browser register/login/PDF workflow | NOT RUN | Browser homepage rendering observed only; HTTP API failures recorded separately. |

Render app logs independently corroborate `POST /api/auth/register 500` at 15:46:56.753Z. Stack: `jsonwebtoken/sign.js:111` → `auth.controller.js:11` in `generateTokens` → registration line 42. Source line 11 signs the access token with `process.env.JWT_ACCESS_SECRET`. **This proves the running process has no usable access signing value at that call.** It does not establish whether the dashboard key is absent, empty, misspelled or unapplied. Refresh signing has not been reached; its effective configuration is unknown. Startup/health currently does not validate JWT secrets.

## Synthetic fixture reconciliation

The two user records persisted before JWT signing failed:
- `dep01c-20261022t154651z-a@example.invalid`
- `dep01c-20261022t154651z-b@example.invalid`

Their numeric IDs were not returned. No account-delete API is exposed, and this session did not request DB credentials or mutate roles. **Physical user cleanup BLOCKED; owner must reconcile exactly these two emails in the isolated test DB.** No document posts, PDF objects or valid sessions were created. The initial runner's zero-user cleanup inventory was incomplete because it recorded users only after a 201; the 409 follow-up corrects that bookkeeping. Use this two-email inventory.

## Next checkpoint

1. In the existing Render service's secure Environment UI, verify **effective nonempty `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`** against the source names. Preserve existing valid values; do not rotate working credentials. Render MCP here supports env writes but **no env inventory/read**, so a blind overwrite would not establish which value is missing.
2. Apply only the necessary correction via the account owner/secure configuration path, then allow the resulting **configuration deployment** on the same Free service. This is a functional auth repair, not a documentation redeploy. Record new deployment ID/source and require successful registration/login before rerunning dependent PDF acceptance.
3. Reconcile the two exact synthetic emails; rerun auth/refresh, two-user permissions, PDF small/10MiB/+1/spoofed/single-file/bytes and revocation, then controlled persistence when safe.
4. Keep DEP-01/DEP-01C IN_PROGRESS, DEP-A02 REVIEW and DEP-02 BLOCKED. Human A/B review remains pending; never infer acceptance from health or offline CI.

Source CI run [39753376890](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39753376890) was rechecked: 7/7 SUCCESS at deployed source. Earlier docs HEAD `a1cd5660364489f17b0a7efc39c9a7840a3b3317`, run [39756469195](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39756469195): 7/7 SUCCESS. These do not override live auth FAIL.
