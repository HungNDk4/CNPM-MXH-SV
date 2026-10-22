# Online Deployment Feasibility — Mini Study Network
**Original feasibility options (2026-10-18), historical analysis.** **CURRENT 2026-10-22:** Human A selected and created **Render Free + TiDB Cloud Starter MySQL-compatible + Vercel Blob Private**. Actual public Render preview and API health are **PASS on one observed visit**, TiDB connected; PDF cloud E2E/storage durability/release QA pending. See [DEP-01C runbook](DEP01C_RENDER_TIDB_PRIVATE_BLOB_RUNBOOK.md). The candidate table below is historical and is **not** the currently deployed architecture.

## What “online anytime” means
A link should resolve and allow the lecturer to browse the site without waking a student's computer. Persistent users/posts/PDFs must survive app redeploys and restarts. Free tiers do not guarantee 100% uptime or unlimited quotas. Document incidents, quota ceilings and recovery rather than promise a contractual SLA.

## Primary low-subscription feasibility candidate (NOT an architectural approval)
| Layer | Option | Limits and risks |
|---|---|---|
| Frontend | Vercel Hobby + React/Vite at *.vercel.app | HTTPS and free non-commercial/personal hosting under usage policies; no paid domain required |
| API backend | Existing Express deployed to Vercel Functions (refactor entry point as necessary) | Provider supports Express, but request/response payload 4.5 MB; no persistent local filesystem, serverless cold/usage limitations |
| Relational DB | TiDB Cloud Starter, MySQL-compatible, through Sequelize v6 dialect=mysql | Free row storage 5 GiB and 50 million request units/month; zero spending limit/no card for eligible free instances; **NOT identical to MySQL 8** — ORM, DDL, FK, ENUM, JSON, migration and transactions need runtime integration tests |
| File storage | Vercel Blob **Private** on Hobby | 1 GB free storage + operation/transfer limits; user-uploaded PDFs require authenticated access and **client-direct upload** for approved 10 MiB limit |
| Download | Server-side authenticated streaming private Blob content | Guest can see safe metadata but cannot obtain bytes, signed-in user may fetch active free documents, hidden/deleted cannot be fetched even via direct API |

**10 MiB PDF critical path:** Vercel Functions reject request bodies above 4.5 MB. Do NOT POST the entire PDF through an Express Function. Browser must obtain narrowly scoped upload permission from authenticated backend, send PDF directly to private blob storage, then server verifies actual uploaded object's byte size (1..10,485,760), MIME/signature/content policy and ownership, cleans invalid/orphan uploads, writes DB metadata and marks post `active` only after validation + persistence (ADR-013). Do not grant permanent read links that would bypass backend login and moderation checks. Streaming may be required to serve 10 MiB responses from Functions.

**Cost guardrail:** Vercel Hobby free plans typically stop access when quotas are exhausted rather than producing extra Hobby charges. TiDB Starter zero spending limit prevents paid overages but can refuse new connections at quota. 1 GB Blob holds at most ~95 maximally sized 10 MiB PDFs before overhead; actual sizes vary. This is a small demo quota, not production capacity.

## Alternatives (not selected)
1. **Oracle Always Free VM running original Node/Express + actual MySQL 8 + private persistent disk:** fewer app rewrites, but account verification/card requirements may apply, free machine capacity is not assured, maintenance/backup/TLS/security become the team's responsibility, idle resources may be reclaimed. Do not provision until discussed.
2. **Render Free**: provides public Node backend but sleeps after 15 minutes idle, startup approximately a minute, ephemeral filesystem. Public URL alone does not satisfy a strong always-ready UX requirement.
3. **Cloudflare R2 private object storage:** 10 GB-month and operation quotas in Standard free tier; overage can bill, additional provider/configuration required. Alternative if Vercel Blob 1 GB too small.
4. **Cloudflare Workers+D1+R2:** free-tier potential but substantial Express+Sequelize/MySQL architecture rewrite. Not recommended without a formal scope change.
5. **Laptop + tunnel:** access depends on student's powered-on machine/network, not an acceptable final deployment.

## DEP-01 proof-of-concept checklist (all NOT RUN)
- DEP-T01: independent device opens HTTPS React UI without teammate laptop powered on.
- DEP-T02: Express auth/posts API works under Vercel Function within usage limits; JWT refresh, error handling and secrets tested.
- DEP-T03: MySQL-compatible TiDB: test full Sequelize v6 migrations and schema (FK, ENUM, JSON, unique indexes, transactions, rollback) on a disposable instance.
- DEP-T04: private client-direct PDF upload exactly 10 MiB succeeds; 10 MiB+1, spoofed MIME, multiple file attempts, unauthenticated token issuance rejected; invalid object cleaned.
- DEP-T05: Guest active document metadata allowed, direct PDF download 401; logged-in active student streams 10 MiB successfully, admin hidden/deleted PDF inaccessible (including cached/direct URLs).
- DEP-T06: data/PDF files persist through redeployment/restart; outside-network access after inactivity measured.
- DEP-T07: free-quotas/alert/zero-spend policy, backup/restore/recovery documented and human approved.
None of these tests has been executed, and no deployment exists.

## No-cost is not the same as uninterrupted service
Do not promise 100% uptime with Hobby/free tiers. Set an explicit educational-usage scope, monitor quotas and have a backup demo recording/local fallback for failures, **without misrepresenting a local fallback as satisfying the online requirement**.

## Official sources checked 2026-10-18
- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/plans/hobby
- https://vercel.com/docs/vercel-blob/private-storage
- https://vercel.com/docs/vercel-blob/client-upload
- https://vercel.com/docs/vercel-blob/usage-and-pricing
- https://docs.pingcap.com/tidbcloud/select-cluster-tier/
- https://docs.pingcap.com/developer/dev-guide-third-party-tools-compatibility/
- https://render.com/docs/free
- https://developers.cloudflare.com/r2/pricing/
- https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
