#!/usr/bin/env node
'use strict';
// Read-only smoke against an ACTUAL public Render deployment (NOT local CI).
// Usage: node scripts/dep01c-live-render-smoke.cjs https://app-name.onrender.com
// Does not create users/posts, read secrets or upload any PDFs.
const assert = require('node:assert/strict');

async function main() {
  if (process.argv.length !== 3) {
    throw new Error('Usage: node scripts/dep01c-live-render-smoke.cjs https://your-app.onrender.com');
  }
  const base = new URL(process.argv[2]);
  if (base.protocol !== 'https:' || base.username || base.password ||
      base.port || base.pathname !== '/' || base.search || base.hash ||
      !/^[a-z0-9-]+\.onrender\.com$/i.test(base.hostname)) {
    throw new Error('Use ONLY an exact HTTPS *.onrender.com service origin; no credentials');
  }

  let count = 0;
  async function check(name, url, expectedStatus, expectedType, verify) {
    // Allow Render Free cold start; no retries that mask a persistent error.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 110_000);
    try {
      const res = await fetch(new URL(url, base), {
        signal: controller.signal,
        redirect: 'error',
        headers: { 'Cache-Control': 'no-cache' },
      });
      assert.equal(res.status, expectedStatus, name + ' status');
      const contentType = res.headers.get('content-type') || '';
      assert.match(contentType, expectedType, name + ' content type');
      const body = await res.text();
      if (verify) verify(body, res);
      console.log('PASS LIVE-RENDER [' + (++count) + '] ' + name);
    } finally { clearTimeout(timeout); }
  }

  console.log('Remote service origin: ' + base.origin);
  await check('Express /api/health', '/api/health', 200, /application\/json/, body => {
    const payload = JSON.parse(body);
    assert.equal(payload.success, true);
  });
  for (const route of ['/', '/login', '/register', '/documents/1']) {
    await check('React SPA GET ' + route, route, 200, /text\/html/, body => {
      assert.match(body, /<html|<!doctype html/i);
      assert.match(body, /<script/i);
    });
  }
  await check('Unknown API remains JSON 404', '/api/definitely-not-a-route', 404,
    /application\/json/, body => assert.equal(JSON.parse(body).success, false));
  await check('Guest PDF bytes denied before document lookup',
    '/api/documents/1/download', 401, /application\/json/, body => {
      assert.equal(JSON.parse(body).success, false);
      assert.ok(!body.includes('%PDF-'));
    });
  await check('No public legacy /uploads path', '/uploads/secret.pdf', 404,
    /application\/json/, body => assert.equal(JSON.parse(body).success, false));

  console.log('\nREAD-ONLY LIVE RENDER HTTP SMOKE: ' + count + '/' + count + ' PASS');
  console.log('NOT PROVEN by this smoke: Render Free plan/account, real TiDB SQL, 10MiB Blob upload/download, durability after redeploy, browser interactions.');
}

main().catch(error => { console.error('FAIL LIVE-RENDER:', error.message); process.exitCode = 1; });
