# Storage & Infrastructure Cost Review — Mini Study Network
**Date:** 2026-10-18 · Status: DRAFT alternatives / cost guardrail confirmed as goal by Human A. **No provider selected or billed service authorized.**

## Requirement ADR-014 / NFR-08
This is a two-person university course project. Avoid unnecessary recurring expenses or subscriptions. **Proposed, not approved exact budget:** 0 VND recurring service costs during development and classroom/local demo. Actual existing hardware/internet/power costs are not zero. No user approval to provide a payment card, register billable accounts or deploy any hosting.

## Comparative options (official plans reviewed 2026-10-18)
| Option | Published free tier / incremental cost | Benefits | Trade-offs |
|---|---|---|---|
| **Local private disk on the backend host (recommended first)** | No external service subscription, local storage capacity required | Fastest, works with existing Express + MySQL stack, easy local class demo | Host must be running, no inherent public 24/7 availability; student must handle backups, permissions, machine loss |
| Cloudflare R2 **Standard** | 10 GB-month/month, 1M Class A ops/month, 10M Class B ops/month free, free internet egress **subject to plan conditions** | Strong file storage option if remote demo needed; S3-compatible | R2 activation/billing, overages can cost money; **not** a free backend/MySQL host; bucket must remain private |
| Supabase Storage Free | 1 GB storage, limited egress and usage | Managed storage convenient for small demos | Smaller cap, plan restrictions/free-tier policies; no guarantee other Node/MySQL hosting is free |

**Primary sources**
- Cloudflare R2 Standard pricing/free tier, updated 2026-10-01: https://developers.cloudflare.com/r2/pricing/
- Supabase Free usage and Storage Size: https://supabase.com/docs/guides/platform/billing-on-supabase and https://supabase.com/docs/guides/platform/manage-your-usage/storage-size
- Local files in serverless functions are not a suitable persistence assumption (e.g. Vercel recommends object storage): https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions

## Recommended **local development/demo** architecture (not yet adopted)
```text
Client browser (React/Vite)
  -> Node.js/Express on demo laptop/LAN
      -> MySQL localhost (user/post/file metadata)
      -> private PDF directory on persistent local disk
           (outside /uploads static web path, not tracked by Git)
      -> GET /api/documents/:postId/download (backend authenticates and checks active/free post)
```
- No public static files, no raw disk path or permanent URL in metadata, do not store uploaded PDF blobs directly inside MySQL.
- Application uploads exactly 1 PDF per post, <=10 MiB (ADR-012), validates content, stores to generated filename and commits DB atomically/compensates on failure; active immediately after success (ADR-013).
- Limit total demo files and back up only sanitized sample PDFs, plus metadata and migration/seed scripts. Backups stored outside repo; don't commit real student documents.
- Split `DocumentStorage` local adapter vs future remote cloud **only if necessary**. Avoid prematurely building cloud abstractions that inflate student workload.

## Student cost controls for any future cloud option
1. Confirm whether online public demo is mandatory; local classroom demo does not require public cloud.
2. Before provisioning any cloud, list all monthly cost categories: backend execution, DB, storage, egress, domain, email/OTP and backups. A free object-storage plan does NOT make the whole app free.
3. Review exact latest quotas, activation/payment-method requirements, hard spending caps/alerts and overage policy. Free tiers are not guarantees of a $0 bill.
4. Do not configure a billable account/subscription/credit card without explicit Human A permission; use usage alarms and quotas if later approved.
5. Keep R2/Supabase object bucket private; direct public/signed URLs can bypass the decided login-only PDF download policy if carelessly exposed.

## Decision still OPEN
- Will teacher/class need **a link online at any time**, or is a laptop/LAN classroom demo enough?
- What is the actual approved monetary cap, if any? Human A only said cost should not inflate.
- Where are **durable storage and backups** hosted? What PDF retention/deletion policy is needed?
- No hosting purchase, setup or external service registration was performed. Save technical architecture decision separately after answers.

## Requirement correction (2026-10-18) — Final demo MUST be online
Human A has explicitly required an online HTTPS link accessible at arbitrary times without student laptop. Therefore earlier "local disk on team backend machine" is **development-only**, NOT adequate final architecture. Keep 0-VND monthly subscription as a target only, not a guarantee or exact approved budget.

**Candidate PoC, NOT approved:** Vercel Hobby (static React, Express serverless) + TiDB Cloud Starter MySQL-compatible (5 GiB row data + 50M RUs/month) + **Vercel Blob Private** (Hobby 1 GB free) with browser direct upload. Vercel Functions have **4.5 MB request body limit**, so never POST a 10 MiB PDF via Express function. Authenticated direct Blob upload + server-verified size/content + gated `active` publish is required. Private download through authenticated streaming. TiDB compatibility with Sequelize v6/schema remains to be verified.
Render Free sleeps after 15 minutes; R2 has a wider 10 GB-month Standard free allocation but potentially billable overages and additional operations. Free quotas may suspend service without fees. No account, service, storage bucket, billing setting, custom domain or code change performed.

See [ONLINE_DEPLOYMENT_OPTIONS.md](ONLINE_DEPLOYMENT_OPTIONS.md) for options and test gates.
