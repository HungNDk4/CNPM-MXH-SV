# FE-01 — Physical phone/tablet acceptance checklist

**Status:** NOT RUN (requires a real human-owned Android/iOS device and a preview containing PR #36; the current Render LIVE website does **not** contain FE-01).

## Setup without deploying the production branch
On a trusted private Wi-Fi, a teammate may run the FE-01 PR checkout with a disposable local MySQL database and locally generated test-only JWT secrets. Start Express with the existing documented local dev setup, then run Vite with `npm --prefix client run dev -- --host 0.0.0.0`. Open `http://<laptop-LAN-IP>:5173` from the phone on that same Wi-Fi. Use only dummy posts/comments; do **not** connect this test checkout to Render's TiDB credentials, real student data or Private Blob cloud. Restrict LAN access and stop the dev servers after testing.

If the phone cannot reach the Vite host, record BLOCKED and verify local firewall, proxy settings and trusted network. Do not change provider deployment or expose the test server on the public internet just to pass this check.

## What to do manually
1. Record device model, operating system version, browser/version, browser text scale, portrait/landscape, viewport size and date. Test one narrow Android phone and an iPhone/iOS Safari if available; a tablet is useful for 768 px.
2. Login as disposable Student A; open a seeded question/discussion. Verify navbar logo/actions never overlap, headline wraps, no sideways scrolling, and browser bars do not obscure touch controls.
3. Create a comment then reply. With the mobile on-screen keyboard open, confirm focus remains visible, text area can scroll and the `Gửi` button remains reachable.
4. Like/unlike a post and comment; observe count and unknown initial liked state after reload. Do not claim per-viewer initial liked state is persisted until backend API supports it.
5. Delete your own reply; after refresh it disappears. Login as Student B and confirm owner delete controls are absent, and backend rejects cross-user DELETE 403.
6. Logout; opening `/posts/:id` shows a login prompt rather than the post text. Test nonexistent ID and document redirection.
7. Check font zoom 200% and rotating device to landscape; focus and buttons remain usable.
8. Save screenshots and a short PASS/FAIL note in [PR #36](https://github.com/HungNDk4/CNPM-MXH-SV/pull/36). User/browser/device identifiers should not expose private or real student data.

## Existing Chromium evidence (not a physical device)
- [CI responsive matrix 320/375/390/768/1280 px](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39824367930): PASS.
- [Screenshots artifact](https://github.com/HungNDk4/CNPM-MXH-SV/actions/runs/39824367930/artifacts/12446565680): available; captured during CSS fade, so use newest artifact after animation capture fix for visual comparison.
- [Backend hardening Issue #37](https://github.com/HungNDk4/CNPM-MXH-SV/issues/37): separate security gate before public deploy.
