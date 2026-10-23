'use strict';

// BE-07 isolated MySQL8 HTTP regression. Runs as a distinct Node process from QA-01.
// It only creates and deletes unique synthetic users, never uses real TiDB/Render.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');

process.env.NODE_ENV = 'test';
const jwt = createRequire(path.join(__dirname, '../../server/package.json'))('jsonwebtoken');
const app = require('../../server/src/app');
const { sequelize, User, RefreshToken } = require('../../server/src/models');

test('BE-07 refresh token account binding + atomic rotation', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_NAME && process.env.JWT_REFRESH_SECRET && process.env.JWT_ACCESS_SECRET,
    'Use disposable MySQL8 and CI-only JWT secrets');
  const server = http.createServer(app);
  let started = false;
  let userA, userB, accessA, refreshA, refreshB;
  const created = [];
  const marker = randomUUID().slice(0, 12);
  let checks = 0;

  async function request(pathname, body, accessToken) {
    const response = await fetch('http://127.0.0.1:' + server.address().port + pathname, {
      method: 'POST',
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, data: await response.json() };
  }
  const refresh = (token) => request('/api/auth/refresh', { refreshToken: token });
  const httpCode = (result, expected) =>
    assert.equal(result.status, expected, 'Expected ' + expected + ', got ' + JSON.stringify(result.data));
  async function check(name, fn) {
    await fn();
    console.log('BE07 PASS [' + String(++checks).padStart(2, '0') + '] ' + name);
  }

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    started = true;
    const password = 'BE07-CI-password-2026-' + marker;

    for (const suffix of ['a', 'b']) {
      const result = await request('/api/auth/register', {
        full_name: 'BE07 Synthetic ' + suffix,
        email: 'be07-' + suffix + '-' + marker + '@example.test',
        password,
      });
      if (result.data?.data?.user?.id) created.push(result.data.data.user.id);
      httpCode(result, 201);
      if (suffix === 'a') {
        userA = result.data.data.user.id;
        accessA = result.data.data.accessToken;
        refreshA = result.data.data.refreshToken;
      } else {
        userB = result.data.data.user.id;
        refreshB = result.data.data.refreshToken;
      }
    }

    await check('Valid refresh rotates token, old token denied, new token works', async () => {
      const first = await refresh(refreshA);
      httpCode(first, 200);
      assert.notEqual(first.data.data.refreshToken, refreshA);
      httpCode(await refresh(refreshA), 401);
      refreshA = first.data.data.refreshToken;
      const second = await refresh(refreshA);
      httpCode(second, 200);
      refreshA = second.data.data.refreshToken;
      const tokenRow = await RefreshToken.findOne({ where: { token: refreshA } });
      assert.equal(tokenRow.user_id, userA);
      assert.equal(tokenRow.revoked, false);
    });

    await check('Reject missing, object, array, numeric and oversized tokens without 500', async () => {
      for (const token of [undefined, null, '', 3, {}, ['x'], 'x'.repeat(513)]) {
        const r = await refresh(token);
        httpCode(r, 400);
        assert.equal(r.data.success, false);
      }
      httpCode(await refresh('malformed.jwt.token'), 401);
    });

    await check('Reject JWT bound to a different stored account (no session minted)', async () => {
      // Real signed synthetic JWT stored under account A but claims account B.
      const fake = jwt.sign({
        id: userB, role: 'student', email: 'be07-mismatch@example.test', jti: randomUUID(),
      }, process.env.JWT_REFRESH_SECRET, { expiresIn: '1h' });
      const saved = await RefreshToken.create({
        user_id: userA, token: fake, expires_at: new Date(Date.now() + 3_600_000),
      });
      httpCode(await refresh(fake), 401);
      assert.equal((await saved.reload()).revoked, false);
    });

    await check('Reject validly signed JWT without required identity/jti claims', async () => {
      const malformed = jwt.sign({ id: userA }, process.env.JWT_REFRESH_SECRET,
        { expiresIn: '1h' });
      await RefreshToken.create({
        user_id: userA, token: malformed, expires_at: new Date(Date.now() + 3_600_000),
      });
      httpCode(await refresh(malformed), 401);
    });

    await check('Concurrent duplicate refresh requests yield exactly one success', async () => {
      const outcomes = await Promise.all([refresh(refreshA), refresh(refreshA)]);
      assert.deepEqual(outcomes.map(r => r.status).sort(), [200, 401]);
      const winning = outcomes.find(r => r.status === 200);
      assert.ok(winning.data.data.accessToken && winning.data.data.refreshToken);
      assert.notEqual(winning.data.data.refreshToken, refreshA);
      httpCode(await refresh(refreshA), 401);
      refreshA = winning.data.data.refreshToken;
      const stored = await RefreshToken.findAll({
        where: { user_id: userA, revoked: false },
      });
      // Includes forged fixtures intentionally; exactly one token from the
      // concurrent pair should be minted, regardless of those synthetic rows.
      assert.equal(stored.filter(t => t.token === refreshA).length, 1);
    });

    await check('Inactive account cannot refresh; another student remains unaffected', async () => {
      await User.update({ is_active: false }, { where: { id: userA } });
      httpCode(await refresh(refreshA), 401);
      const b = await refresh(refreshB);
      httpCode(b, 200);
      refreshB = b.data.data.refreshToken;
      await User.update({ is_active: true }, { where: { id: userA } });
    });

    await check('Password change revokes all A sessions but does not revoke B', async () => {
      // Fetching new access JWT ensures current auth after reactivation.
      const a = await request('/api/auth/login', {
        email: 'be07-a-' + marker + '@example.test', password,
      });
      httpCode(a, 200);
      const secondary = a.data.data.refreshToken;
      const changed = await fetch('http://127.0.0.1:' + server.address().port +
        '/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessA,
        },
        body: JSON.stringify({
          current_password: password,
          new_password: 'BE07-New-password-2026-' + marker,
        }),
      });
      assert.equal(changed.status, 200, await changed.text());
      httpCode(await refresh(refreshA), 401);
      httpCode(await refresh(secondary), 401);
      const other = await refresh(refreshB);
      httpCode(other, 200);
      refreshB = other.data.data.refreshToken;
    });

    console.log('BE-07 RESULT: ' + checks + '/7 MySQL8 HTTP groups PASS');
  } finally {
    if (created.length) {
      await User.destroy({ where: { id: created } }).catch(() => {});
    }
    if (started) await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()));
    await sequelize.close();
  }
});
