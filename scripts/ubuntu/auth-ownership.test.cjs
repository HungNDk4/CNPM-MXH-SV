'use strict';

// QA-01 / Issue #14: real MySQL Auth + cross-user ownership regression.
// Creates two uniquely named fixture users and a question post.
// Cleanup targets ONLY user IDs created by this script (FK cascades their posts/tokens).
// No DB schema reset, truncation, payment, file upload, or cloud access.
const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');

process.env.NODE_ENV = 'test';
const serverRequire = createRequire(path.join(__dirname, '../../server/package.json'));
const jwt = serverRequire('jsonwebtoken');
const app = require('../../server/src/app');
const { sequelize, User, Post, RefreshToken } = require('../../server/src/models');

test('QA-01 two students: auth, token lifecycle and post ownership', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_NAME && process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET,
    'Set DB_* and JWT_* in a disposable CI DB or dedicated local test environment first');

  const server = http.createServer(app);
  let listening = false;
  let url;
  const fixtureIds = [];
  const marker = randomUUID();
  const emailA = 'qa01-a-' + marker + '@example.test';
  const emailB = 'qa01-b-' + marker + '@example.test';
  const passwordA = 'Qa01!-' + randomUUID();
  const passwordB = 'Qa01!-' + randomUUID();
  let idA, idB, tokenA, tokenB, refreshA, postId;
  let passed = 0;

  async function request(method, route, body, token) {
    const response = await fetch(url + route, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const json = await response.json();
    return { status: response.status, json };
  }

  function expectHttp(result, code) {
    assert.equal(result.status, code, 'Expected HTTP ' + code + ', received ' + result.status);
    assert.equal(result.json.success, code >= 200 && code < 300,
      'Expected success flag to match HTTP status');
  }

  async function check(name, action) {
    await action();
    passed++;
    console.log('PASS [' + String(passed).padStart(2, '0') + '] ' + name);
  }

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    listening = true;
    url = 'http://127.0.0.1:' + server.address().port;

    await check('Register student A', async () => {
      const r = await request('POST', '/api/auth/register', {
        full_name: 'QA-01 Student A', email: emailA, password: passwordA
      });
      // Capture ID before further assertions, for cleanup even if verification fails.
      idA = r.json?.data?.user?.id;
      if (idA) fixtureIds.push(idA);
      expectHttp(r, 201);
      assert.ok(idA);
      assert.equal(r.json.data.user.role, 'student');
    });

    await check('Register student B', async () => {
      const r = await request('POST', '/api/auth/register', {
        full_name: 'QA-01 Student B', email: emailB, password: passwordB
      });
      idB = r.json?.data?.user?.id;
      if (idB) fixtureIds.push(idB);
      expectHttp(r, 201);
      assert.ok(idB);
      assert.notEqual(idA, idB);
    });

    await check('Reject duplicate and invalid registration', async () => {
      expectHttp(await request('POST', '/api/auth/register', {
        full_name: 'Duplicate', email: emailA, password: passwordA
      }), 409);
      expectHttp(await request('POST', '/api/auth/register', {
        full_name: 'Invalid', email: 'not-an-email', password: passwordA
      }), 422);
      expectHttp(await request('POST', '/api/auth/register', {
        full_name: 'Short password', email: 'short-' + marker + '@example.test',
        password: '12'
      }), 422);
    });

    await check('Reject wrong password', async () => {
      expectHttp(await request('POST', '/api/auth/login', {
        email: emailA, password: 'wrong-' + randomUUID()
      }), 401);
    });

    await check('Login both accounts with unique credentials', async () => {
      const a = await request('POST', '/api/auth/login', { email: emailA, password: passwordA });
      const b = await request('POST', '/api/auth/login', { email: emailB, password: passwordB });
      expectHttp(a, 200);
      expectHttp(b, 200);
      tokenA = a.json.data.accessToken;
      refreshA = a.json.data.refreshToken;
      tokenB = b.json.data.accessToken;
      assert.ok(tokenA && refreshA && tokenB);
    });

    await check('JWT token identifies correct student', async () => {
      const a = await request('GET', '/api/auth/me', undefined, tokenA);
      const b = await request('GET', '/api/auth/me', undefined, tokenB);
      expectHttp(a, 200);
      expectHttp(b, 200);
      assert.equal(a.json.data.id, idA);
      assert.equal(b.json.data.id, idB);
    });

    await check('Reject missing, invalid and expired access JWTs', async () => {
      expectHttp(await request('GET', '/api/auth/me'), 401);
      expectHttp(await request('GET', '/api/auth/me', undefined, 'invalid.jwt.token'), 401);
      const expired = jwt.sign({ id: idA, email: emailA, role: 'student' },
        process.env.JWT_ACCESS_SECRET, { expiresIn: -10 });
      const r = await request('GET', '/api/auth/me', undefined, expired);
      expectHttp(r, 401);
      assert.equal(r.json.code, 'TOKEN_EXPIRED');
    });

    await check('Refresh rotates token and blocks old token reuse', async () => {
      const rotated = await request('POST', '/api/auth/refresh', { refreshToken: refreshA });
      expectHttp(rotated, 200);
      const next = rotated.json.data.refreshToken;
      assert.ok(next && next !== refreshA);
      expectHttp(await request('POST', '/api/auth/refresh', { refreshToken: refreshA }), 401);
      refreshA = next;
    });

    await check('Reject missing, invalid, expired and DB-expired refresh tokens', async () => {
      expectHttp(await request('POST', '/api/auth/refresh', {}), 400);
      expectHttp(await request('POST', '/api/auth/refresh', { refreshToken: 'invalid.jwt' }), 401);

      const jwtExpired = jwt.sign({
        id: idA, email: emailA, role: 'student', jti: randomUUID()
      }, process.env.JWT_REFRESH_SECRET, { expiresIn: -10 });
      await RefreshToken.create({
        user_id: idA, token: jwtExpired,
        expires_at: new Date(Date.now() + 300_000)
      });
      expectHttp(await request('POST', '/api/auth/refresh', { refreshToken: jwtExpired }), 401);

      const dbExpired = jwt.sign({
        id: idA, email: emailA, role: 'student', jti: randomUUID()
      }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1h' });
      await RefreshToken.create({
        user_id: idA, token: dbExpired,
        expires_at: new Date(Date.now() - 60_000)
      });
      expectHttp(await request('POST', '/api/auth/refresh', { refreshToken: dbExpired }), 401);
    });

    await check('Logout revokes currently active refresh token', async () => {
      expectHttp(await request('POST', '/api/auth/logout', { refreshToken: refreshA }), 200);
      expectHttp(await request('POST', '/api/auth/refresh', { refreshToken: refreshA }), 401);
    });

    await check('A creates a question owned by A', async () => {
      const r = await request('POST', '/api/posts', {
        title: 'QA01 original ' + marker,
        content: 'Ownership test',
        post_type: 'question', subject: 'CNPM'
      }, tokenA);
      expectHttp(r, 201);
      postId = r.json.data.id;
      assert.ok(postId);
      assert.equal(r.json.data.user_id, idA);
    });

    await check('B cannot edit or delete A post (403), DB unchanged', async () => {
      const original = await Post.findByPk(postId);
      assert.ok(original);
      const initialTitle = original.title;
      expectHttp(await request('PUT', '/api/posts/' + postId,
        { title: 'Malicious edit from student B' }, tokenB), 403);
      expectHttp(await request('DELETE', '/api/posts/' + postId, undefined, tokenB), 403);
      const after = await Post.findByPk(postId);
      assert.equal(after.title, initialTitle);
      assert.equal(after.status, 'active');
      assert.equal(after.user_id, idA);
    });

    await check('A can update own post and B can read active question', async () => {
      const changed = 'QA01 edited ' + marker;
      const updated = await request('PUT', '/api/posts/' + postId, {
        title: changed
      }, tokenA);
      expectHttp(updated, 200);
      const readByB = await request('GET', '/api/posts/' + postId, undefined, tokenB);
      expectHttp(readByB, 200);
      assert.equal(readByB.json.data.title, changed);
      assert.equal((await Post.findByPk(postId)).user_id, idA);
    });

    await check('Only A can soft-delete own post, detail then 404', async () => {
      expectHttp(await request('DELETE', '/api/posts/' + postId, undefined, tokenA), 200);
      const row = await Post.findByPk(postId);
      assert.equal(row.status, 'deleted');
      expectHttp(await request('GET', '/api/posts/' + postId, undefined, tokenA), 404);
    });

    await check('Inactive B cannot log in or authenticate', async () => {
      await User.update({ is_active: false }, { where: { id: idB } });
      expectHttp(await request('POST', '/api/auth/login', {
        email: emailB, password: passwordB
      }), 403);
      expectHttp(await request('GET', '/api/auth/me', undefined, tokenB), 401);
    });

    const guest = await request('GET', '/api/posts');
    assert.equal(guest.status, 401, 'Known current behavior: guest feed rejects unauthenticated users');
    console.log('KNOWN GAP: Guest GET /api/posts returns 401 (ADR-002 OPEN; NOT an approval).');
    console.log('QA-01 RESULT: ' + passed + '/15 checks PASS; DB fixture cleanup follows');
  } finally {
    try {
      if (fixtureIds.length) {
        // Only newly created fixture students; foreign keys cascade test post/token rows.
        await User.destroy({ where: { id: fixtureIds } });
      }
    } finally {
      try {
        if (listening) await new Promise((resolve, reject) =>
          server.close(err => err ? reject(err) : resolve()));
      } finally {
        await sequelize.close();
      }
    }
  }
});
