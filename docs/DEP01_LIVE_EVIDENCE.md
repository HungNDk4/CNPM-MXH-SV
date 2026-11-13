# DEP-01 Stage A — Live HTTPS PoC evidence
**Recorded:** 2026-10-19 (Human A screenshot); **Scope:** safe isolated proof only.
**Truth label:** USER-OBSERVED WEB+HEALTH PASS; DEP-A01 REVIEW. DEP-01 and full website NOT DONE.

## Deployed environment (Vercel connector verified)
| Property | Verified value |
|---|---|
| Vercel account | `hunny-17`, Hobby (no new paid plan) |
| Project | `mini-study-network-dep01` |
| Project ID | `prj_YZzSucZKTjpzzghzVBFmZf02ZY21` |
| Deployment ID | `dpl_Umv7RsTsnEycnxyKXzQsrbLRrwtq` |
| Deployment state | `READY` |
| Alias | https://mini-study-network-dep01.vercel.app/ |
| Actual target | `production` (provider assigned despite requested staging; **isolated PoC only**, not the CNPM product) |
| Source | Only `poc/dep01-cloud-isolated/index.html`, `api/health.js`, `package.json`, `vercel.json` |
| Legacy app/payment/files | NOT included |
| Database/Blob | NOT connected |
| Github actions | 5/5 PASS on PoC scaffold branch prior to deployment; CI not cloud integration test |

## Browser proof provided by Human A
Human A opened `https://mini-study-network-dep01.vercel.app/` in a **Chrome Incognito** window and shared a screenshot. It visibly shows:
- URL in the incognito browser, loaded without Vercel login wall.
- Page heading `DEP-01 — PoC cloud cô lập`.
- Status `API thử nghiệm: phản hồi thành công`.
- Subtext `Database: NOT_CONNECTED · PDF: NOT_CONNECTED · VNPay: NOT_INCLUDED`.

The HTML's JS fetches `/api/health` and only sets this success message after an HTTP `ok` response and matching `service` and `stage=HTTPS_HEALTH_ONLY`. Thus the user-observed browser successfully fetched and parsed the cloud health handler. This is direct evidence of login-free HTTPS *for that request*.

**Limits:** Screenshot was on the user's device; the assistant's separate external HTTP requests failed to resolve the URL due to its execution environment's DNS/network restriction. We therefore do NOT claim an independently recorded raw HTTP status/header, a test from a different mobile network, or continuous 24/7 availability. Dashboard SSO/protection fields alone cannot override the incognito observation for this tested alias; evaluate deployment protection separately if access behavior changes.

## Remaining stage gates
| Gate | State |
|---|---|
| Browser-based public HTTPS landing + JS health call | **PASS — user-observed** |
| Vercel deployment build READY and alias | **PASS — provider verified** |
| Raw API GET/HEAD/POST from independent network | NOT RUN |
| Repeated checks over different times / uptime guarantee | NOT RUN; free Hobby not an SLA |
| TiDB + Sequelize migrations/integration (DEP-A02) | NOT RUN |
| Blob Private authenticated upload/download 10 MiB (DEP-A03) | NOT RUN |
| Guest metadata/login-only PDF, admin hidden file tests | NOT RUN |
| Persist DB/PDF across redeploy and paid routes disabled | NOT RUN |

## Next
1. From a device on another network (e.g. mobile data), load the same URL and directly open `/api/health` to confirm guest HTTP JSON.
2. Review whether project requires optional deployment access policy changes; do NOT change other projects' protection.
3. For DEP-A02, establish an explicitly approved disposable **TiDB Cloud Starter** test account/instance under $0 spending limit or choose another MySQL-compatible free solution. No credentials in repository or chat.
4. Preserve `main` and PR chain #1→#7; production CNPM app not yet ready for exposure.
