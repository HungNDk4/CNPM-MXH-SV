'use strict';
// E2E-01: actual Chromium UI -> Vite proxy -> Express HTTP -> MySQL 8 -> private disk.
// Run only with a disposable DB and DOCUMENT_PRIVATE_DIR; never run against live data.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { randomUUID } = require('node:crypto');
const { chromium } = require('playwright');
const { User, Post, RefreshToken, DocumentFile, sequelize } = require('../../server/src/models');
const storage = require('../../server/src/services/private-document-storage');
const serverRequire = require('node:module').createRequire(require.resolve('../../server/package.json'));
const jwt = serverRequire('jsonwebtoken');

const UI = process.env.E2E_UI_URL || 'http://127.0.0.1:5173';
const API = process.env.E2E_API_URL || 'http://127.0.0.1:5000';
const PDF = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
const MAX = 10 * 1024 * 1024;

function jsonRequest(url, { method = 'GET', token, body } = {}) {
  return fetch(API + url, {
    method,
    headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function pdfForm(buffer, filename = 'e2e.pdf') {
  const form = new FormData();
  form.set('title', 'E2E01 boundary document');
  form.set('description', 'Isolated test PDF');
  form.set('file', new Blob([buffer], { type: 'application/pdf' }), filename);
  return form;
}
function pdfUpload(token, form) {
  return fetch(API + '/api/documents', {
    method: 'POST', headers: { Authorization: 'Bearer ' + token }, body: form,
  });
}
async function registerInBrowser(page, user) {
  await page.goto(UI + '/register');
  await page.locator('#full_name').fill(user.name);
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  const pending = page.waitForResponse(r => r.url().includes('/api/auth/register') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Đăng ký ngay' }).click();
  const response = await pending;
  assert.equal(response.status(), 201, await response.text());
  const payload = await response.json();
  await page.waitForURL(u => u.pathname === '/');
  return payload.data;
}
async function loginInBrowser(page, user) {
  await page.goto(UI + '/login');
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  const pending = page.waitForResponse(r => r.url().includes('/api/auth/login') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const response = await pending;
  assert.equal(response.status(), 200, await response.text());
  await page.waitForURL(u => u.pathname === '/');
  return (await response.json()).data;
}
async function check(label, action) {
  await action();
  console.log('E2E01 PASS — ' + label);
}

test('E2E-01 real Chrome/Vite/Express/MySQL/private PDF', { timeout: 240000 }, async () => {
  if (process.env.E2E_DISPOSABLE_DB !== 'true' || process.env.NODE_ENV !== 'test' ||
      !process.env.DOCUMENT_PRIVATE_DIR ||
      !process.env.DB_NAME || !/^(?:e2e01_[a-z0-9_]+|mini_study_network)$/.test(process.env.DB_NAME)) {
    throw new Error('E2E requires explicit disposable DB, NODE_ENV=test and private test storage');
  }
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.E2E_BROWSER_EXECUTABLE ? { executablePath: process.env.E2E_BROWSER_EXECUTABLE } : {}),
    args: ['--no-sandbox'],
  });
  const contextA = await browser.newContext({ acceptDownloads: true });
  const contextGuest = await browser.newContext({ acceptDownloads: true });
  const page = await contextA.newPage();
  const guest = await contextGuest.newPage();
  const userIds = [];
  const seed = randomUUID().slice(0, 10);
  const A = { name: 'E2E01 A', email: 'e2e01-a-' + seed + '@example.test', password: 'SafeE2EPASS2026' };
  const B = { name: 'E2E01 B', email: 'e2e01-b-' + seed + '@example.test', password: 'SafeE2EPASS2026' };
  const title = 'E2E01 PDF ' + seed;
  let tokenA, tokenB, postId, browserDownloadPath;
  try {
    await sequelize.authenticate();
    await check('HTTP health through Vite proxy + backend', async () => {
      const result = await guest.goto(UI + '/');
      assert.equal(result.status(), 200);
      const health = await guest.request.get(UI + '/api/health');
      assert.equal(health.status(), 200);
      assert.equal((await health.json()).success, true);
    });

    await check('Student A registers in React and obtains real JWT', async () => {
      const auth = await registerInBrowser(page, A);
      userIds.push(auth.user.id);
      tokenA = auth.accessToken;
      assert.ok(auth.refreshToken);
      assert.equal(auth.user.role, 'student');
    });

    await check('React multipart PDF upload creates active free document', async () => {
      await page.goto(UI + '/posts/create');
      await page.getByRole('button', { name: /Chia sẻ tài liệu/ }).click();
      await page.locator('#post-title').fill(title);
      await page.locator('#post-content').fill('Automated E2E document from browser');
      await page.locator('#post-subject').fill('CNPM');
      await page.locator('#post-tags').fill('pdf, test');
      await page.locator('#pdf-file').setInputFiles({
        name: 'e2e01.pdf', mimeType: 'application/pdf', buffer: PDF,
      });
      const pending = page.waitForResponse(r => r.url().includes('/api/documents') && r.request().method() === 'POST');
      await page.getByRole('button', { name: /Chia sẻ PDF/ }).click();
      const response = await pending;
      assert.equal(response.status(), 201, await response.text());
      const payload = await response.json();
      postId = payload.data.id;
      assert.ok(postId);
      assert.equal(payload.data.post_type, 'document');
      assert.equal(Number(payload.data.price), 0);
      assert.equal(payload.data.status, 'active');
      assert.ok(!JSON.stringify(payload).includes('storage_key'));
      await page.waitForURL(u => u.pathname === '/documents/' + postId);
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
    });

    await check('React PDF download returns the original bytes', async () => {
      const pending = page.waitForEvent('download');
      await page.getByRole('button', { name: /Tải PDF/ }).click();
      const download = await pending;
      browserDownloadPath = await download.path();
      assert.deepEqual(await fs.readFile(browserDownloadPath), PDF);
      assert.match(download.suggestedFilename(), /\.pdf$/);
    });

    await check('Guest feed/detail show safe metadata and login CTA', async () => {
      await guest.goto(UI + '/');
      await guest.getByText(title, { exact: true }).waitFor();
      await guest.goto(UI + '/documents/' + postId);
      await guest.getByRole('link', { name: /Đăng nhập để tải/ }).waitFor();
      assert.equal(await guest.getByRole('button', { name: /Tải PDF/ }).count(), 0);
      const publicPost = await jsonRequest('/api/posts/' + postId);
      assert.equal(publicPost.status, 200);
      const body = await publicPost.text();
      for (const forbidden of ['storage_key', 'file_url', 'sha256', 'original_name']) {
        assert.ok(!body.includes(forbidden), forbidden + ' leaked');
      }
    });

    await check('Guest and bad JWT cannot access private bytes or raw URLs', async () => {
      assert.equal((await jsonRequest('/api/documents/' + postId + '/download')).status, 401);
      assert.equal((await jsonRequest('/api/documents/' + postId + '/download', {token:'invalid.jwt'})).status, 401);
      const doc = await DocumentFile.findOne({ where: {post_id:postId} });
      assert.ok(doc);
      assert.equal((await jsonRequest('/uploads/' + doc.storage_key)).status, 404);
      assert.equal((await jsonRequest('/private-documents/' + doc.storage_key)).status, 404);
    });

    await check('Student B registers and downloads Student A free document', async () => {
      const auth = await registerInBrowser(guest, B);
      userIds.push(auth.user.id);
      tokenB = auth.accessToken;
      await guest.goto(UI + '/documents/' + postId);
      const pending = guest.waitForEvent('download');
      await guest.getByRole('button', { name: /Tải PDF/ }).click();
      const downloaded = await pending;
      assert.deepEqual(await fs.readFile(await downloaded.path()), PDF);
      const before = (await Post.findByPk(postId)).toJSON();
      assert.equal((await jsonRequest('/api/posts/' + postId, {
        method:'PUT', token:tokenB, body:{title:'should fail'}
      })).status, 403);
      assert.equal((await jsonRequest('/api/posts/' + postId, {
        method:'DELETE', token:tokenB
      })).status, 403);
      assert.deepEqual((await Post.findByPk(postId)).toJSON(), before);
    });

    await check('Expired Blob download refreshes once, rotates session and retries original PDF', async () => {
      const session = await guest.evaluate(async () => {
        const { useAuthStore } = await import('/src/stores/authStore.js');
        const { user, refreshToken } = useAuthStore.getState();
        return { id: user.id, refreshToken };
      });
      const expiredToken = jwt.sign({
        id: session.id, exp: Math.floor(Date.now() / 1000) - 60,
      }, process.env.JWT_ACCESS_SECRET);
      await guest.evaluate(async accessToken => {
        const { useAuthStore } = await import('/src/stores/authStore.js');
        useAuthStore.getState().setAuth({ ...useAuthStore.getState(), accessToken });
      }, expiredToken);

      let refreshCount = 0;
      const observeRefresh = request => {
        if (new URL(request.url()).pathname === '/api/auth/refresh') refreshCount++;
      };
      guest.on('request', observeRefresh);
      try {
        const denied = guest.waitForResponse(r =>
          new URL(r.url()).pathname === '/api/documents/' + postId + '/download' && r.status() === 401);
        const refreshed = guest.waitForResponse(r =>
          new URL(r.url()).pathname === '/api/auth/refresh');
        const pending = guest.waitForEvent('download');
        await guest.getByRole('button', { name: /Tải PDF/ }).click();
        assert.match((await denied).headers()['content-type'], /application\/json/);
        assert.equal((await refreshed).status(), 200);
        const download = await pending;
        assert.equal(await download.failure(), null);
        assert.deepEqual(await fs.readFile(await download.path()), PDF);
        const current = await guest.evaluate(async () => {
          const { useAuthStore } = await import('/src/stores/authStore.js');
          const { accessToken, refreshToken } = useAuthStore.getState();
          return { accessToken, refreshToken };
        });
        tokenB = current.accessToken;
        assert.notEqual(current.refreshToken, session.refreshToken);
        assert.equal((await RefreshToken.findOne({ where: { token: session.refreshToken } })).revoked, true);
        assert.equal(refreshCount, 1, 'One refresh for one expired download');
      } finally {
        guest.off('request', observeRefresh);
      }
    });

    await check('Server rejects invalid PDF and file over 10 MiB', async () => {
      const invalid = await pdfUpload(tokenB, pdfForm(Buffer.from('not-pdf')));
      assert.equal(invalid.status, 415);
      const oversized = Buffer.alloc(MAX + 1, 0x20);
      oversized.write('%PDF-', 0);
      oversized.write('%%EOF', oversized.length - 5);
      const tooBig = await pdfUpload(tokenB, pdfForm(oversized));
      assert.equal(tooBig.status, 413, await tooBig.text());
    });

    await check('10 MiB inclusive boundary accepted with exact private record', async () => {
      const exact = Buffer.alloc(MAX, 0x20);
      exact.write('%PDF-', 0);
      exact.write('%%EOF', exact.length - 5);
      const response = await pdfUpload(tokenB, pdfForm(exact, 'boundary.pdf'));
      const body = await response.text();
      assert.equal(response.status, 201, body);
      const post = JSON.parse(body).data;
      const file = await DocumentFile.findOne({where:{post_id:post.id}});
      assert.equal(file.size_bytes, MAX);
    });

    await check('Hidden document disappears, stale download denied', async () => {
      const hidden = await jsonRequest('/api/posts/' + postId, {
        method: 'PUT', token: tokenA, body: { status: 'hidden' },
      });
      assert.equal(hidden.status, 200, await hidden.text());
      assert.equal((await jsonRequest('/api/posts/' + postId)).status, 404);
      assert.equal((await jsonRequest('/api/documents/' + postId + '/download', {token:tokenA})).status, 404);
      assert.equal((await jsonRequest('/api/documents/' + postId + '/download', {token:tokenB})).status, 404);
      await guest.goto(UI + '/documents/' + postId);
      await guest.getByText('Tài liệu không tồn tại hoặc đã bị ẩn.').waitFor();
      const del = await jsonRequest('/api/posts/' + postId, {method:'DELETE',token:tokenA});
      assert.equal(del.status, 200, await del.text());
      assert.equal((await jsonRequest('/api/documents/' + postId + '/download', {token:tokenA})).status, 404);
    });

    await check('Logout + login through actual React forms', async () => {
      await page.getByRole('button', { name: 'Đăng xuất' }).click();
      await page.waitForURL(u => u.pathname === '/login');
      const auth = await loginInBrowser(page, A);
      assert.ok(auth.accessToken && auth.refreshToken);
      const rotated = await jsonRequest('/api/auth/refresh', {method:'POST', body:{refreshToken:auth.refreshToken}});
      assert.equal(rotated.status, 200);
      const newer = (await rotated.json()).data;
      assert.notEqual(newer.refreshToken, auth.refreshToken);
      assert.equal((await jsonRequest('/api/auth/refresh', {
        method:'POST', body:{refreshToken:auth.refreshToken},
      })).status, 401);
    });
  } finally {
    try {
      // Remove only own synthetic DB rows and private objects; never clean global storage.
      for (const id of userIds) {
        const [rows] = await sequelize.query(
          'SELECT storage_key FROM document_files WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)',
          { replacements:[id] }
        );
        for (const row of rows) await storage.remove(row.storage_key);
        await User.destroy({where:{id}});
      }
    } finally {
      await contextA.close();
      await contextGuest.close();
      await browser.close();
      await sequelize.close();
    }
  }
});
