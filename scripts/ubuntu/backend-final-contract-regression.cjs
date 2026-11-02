'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post } = require('../../server/src/models');

test('BACKEND FINAL: bounded logout payloads and Post detail IDs', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET,
  'Disposable loopback MySQL8 only');
  const server = http.createServer(app), ids = [];
  const suffix = randomUUID().slice(0, 12);
  let opened = false, base, a, b, questions, document, passes = 0;
  async function send(method, path, { token, body } = {}) {
    const r = await fetch(base + path, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: r.status, data: await r.json() };
  }
  function expect(r, code) {
    assert.equal(r.status, code, 'Expected ' + code + ' got ' + r.status +
      ': ' + JSON.stringify(r.data));
    assert.equal(r.data.success, code >= 200 && code < 300);
  }
  async function check(label, fn) {
    await fn();
    console.log('BACKEND FINAL PASS [' + String(++passes).padStart(2, '0') + '] ' + label);
  }
  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
    });
    opened = true;
    base = 'http://127.0.0.1:' + server.address().port;

    await check('Two synthetic students registered in isolated DB', async () => {
      for (const who of ['a', 'b']) {
        const result = await send('POST', '/api/auth/register', {
          body: { full_name: 'Backend Final ' + who,
            email: 'backend-final-' + who + '-' + suffix + '@example.test',
            password: 'backend-final-ci-password' },
        });
        if (result.data?.data?.user?.id) ids.push(result.data.data.user.id);
        expect(result, 201);
        const entry = { id: result.data.data.user.id,
          access: result.data.data.accessToken,
          refresh: result.data.data.refreshToken };
        if (who === 'a') a = entry; else b = entry;
      }
    });

    await check('Empty, null, unknown token logout remains idempotent 200', async () => {
      for (const body of [undefined, {}, { refreshToken: null },
        { refreshToken: '' }, { refreshToken: 'unused-unknown-token' }]) {
        expect(await send('POST', '/api/auth/logout', { body }), 200);
      }
      expect(await send('POST', '/api/auth/refresh',
        { body: { refreshToken: a.refresh } }), 200);
    });

    await check('Malformed logout token types are 400 rather than 500', async () => {
      for (const refreshToken of [{}, [], 7, false, ['fake.jwt'],
        { jwt: 'fake' }, 'a'.repeat(513)]) {
        const response = await send('POST', '/api/auth/logout',
          { body: { refreshToken } });
        expect(response, 400);
        assert.ok(!JSON.stringify(response.data).includes('Sequelize'));
      }
      expect(await send('POST', '/api/auth/refresh',
        { body: { refreshToken: b.refresh } }), 200);
    });

    await check('Valid logout revokes only selected refresh token', async () => {
      const login = await send('POST', '/api/auth/login', {
        body: { email: 'backend-final-a-' + suffix + '@example.test',
          password: 'backend-final-ci-password' },
      });
      expect(login, 200);
      const token = login.data.data.refreshToken;
      expect(await send('POST', '/api/auth/logout',
        { body: { refreshToken: token } }), 200);
      expect(await send('POST', '/api/auth/refresh',
        { body: { refreshToken: token } }), 401);
      expect(await send('GET', '/api/auth/me', { token: a.access }), 200);
    });

    await check('Malformed Post detail path IDs are consistently rejected 422', async () => {
      for (const id of ['0', 'bad', '1e3', '01', '9007199254740992']) {
        for (const token of [undefined, a.access]) {
          expect(await send('GET', '/api/posts/' + id, { token }), 422);
        }
      }
      expect(await send('GET', '/api/posts/4294967295',
        { token: a.access }), 404);
    });

    await check('Social post detail still requires membership and uses safe DTO', async () => {
      const created = await send('POST', '/api/posts', { token: a.access,
        body: { title: 'Final Q ' + suffix, post_type: 'question', content: 'Sample' } });
      expect(created, 201);
      questions = created.data.data.id;
      expect(await send('GET', '/api/posts/' + questions), 401);
      const detail = await send('GET', '/api/posts/' + questions,
        { token: b.access });
      expect(detail, 200);
      assert.equal(detail.data.data.id, questions);
      for (const key of ['file_url', 'file_name', 'storage_key', 'password_hash']) {
        assert.ok(!JSON.stringify(detail.data).includes('"' + key + '"'));
      }
    });

    await check('Guest document metadata safe and suppressed posts return 404', async () => {
      const doc = await Post.create({ user_id: a.id,
        title: 'Final doc ' + suffix, post_type: 'document', price: 0,
        status: 'active', file_url: '/uploads/private-' + suffix + '.pdf' });
      document = doc.id;
      const visible = await send('GET', '/api/posts/' + document);
      expect(visible, 200);
      assert.ok(!JSON.stringify(visible.data).includes('/uploads/'));
      await Post.update({ status: 'hidden' }, { where: { id: document } });
      expect(await send('GET', '/api/posts/' + document), 404);
      expect(await send('GET', '/api/posts/' + document,
        { token: a.access }), 404);
      await Post.update({ status: 'deleted' }, { where: { id: document } });
      expect(await send('GET', '/api/posts/' + document), 404);
    });
    console.log('BACKEND FINAL RESULT: ' + passes + '/7 MySQL8 HTTP groups PASS');
  } finally {
    if (ids.length) await User.destroy({ where: { id: ids } }).catch(() => {});
    if (opened) await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()));
    await sequelize.close();
  }
});
