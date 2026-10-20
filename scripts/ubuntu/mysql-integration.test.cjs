'use strict';
/* Ubuntu MySQL 8 disposable CI integration; no cloud or payment tests. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');

process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User } = require('../../server/src/models');

test('Ubuntu + MySQL 8: timestamps, register, login, refresh, create/list', { timeout: 60_000 }, async () => {
  const server = http.createServer(app);
  let createdUserId = null;
  let started = false;
  try {
    await sequelize.authenticate();
    const [rows] = await sequelize.query(
      "SELECT TABLE_NAME FROM information_schema.COLUMNS " +
      "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('likes','refresh_tokens') " +
      "AND COLUMN_NAME = 'updated_at' ORDER BY TABLE_NAME"
    );
    assert.deepEqual(rows.map(row => row.TABLE_NAME), ['likes', 'refresh_tokens']);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    started = true;
    const origin = 'http://127.0.0.1:' + server.address().port;
    async function call(route, opts = {}) {
      const response = await fetch(origin + route, {
        method: opts.method || 'GET',
        headers: {
          ...(opts.token ? { Authorization: 'Bearer ' + opts.token } : {}),
          ...(opts.body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(opts.body ? { body: JSON.stringify(opts.body) } : {})
      });
      return { status: response.status, data: await response.json() };
    }
    const health = await call('/api/health');
    assert.equal(health.status, 200);
    assert.equal(health.data.success, true);

    const email = 'ubuntu-smoke-' + randomUUID().slice(0, 10) + '@example.test';
    const register = await call('/api/auth/register', {
      method: 'POST', body: {
        full_name: 'Ubuntu CI Student',
        email,
        password: 'CI_dev_test_password_2026'
      }
    });
    assert.equal(register.status, 201, JSON.stringify(register.data));
    createdUserId = register.data?.data?.user?.id;
    assert.ok(createdUserId);
    assert.ok(register.data?.data?.accessToken);

    const registered = await User.findByPk(createdUserId);
    assert.equal(registered.email, email);
    assert.notEqual(registered.password_hash, 'CI_dev_test_password_2026');

    const login = await call('/api/auth/login', {
      method: 'POST', body: { email, password: 'CI_dev_test_password_2026' }
    });
    assert.equal(login.status, 200, JSON.stringify(login.data));
    assert.ok(login.data?.data?.accessToken);
    assert.ok(login.data?.data?.refreshToken);
    assert.notEqual(login.data.data.refreshToken, register.data.data.refreshToken,
      'Registration/login within one second must issue distinct refresh JWTs');

    const refresh = await call('/api/auth/refresh', {
      method: 'POST', body: { refreshToken: login.data.data.refreshToken }
    });
    assert.equal(refresh.status, 200, JSON.stringify(refresh.data));
    assert.ok(refresh.data?.data?.accessToken);
    assert.notEqual(refresh.data.data.refreshToken, login.data.data.refreshToken,
      'Refresh token rotation must issue a new unique token');
    const reused = await call('/api/auth/refresh', {
      method: 'POST', body: { refreshToken: login.data.data.refreshToken }
    });
    assert.equal(reused.status, 401, 'Revoked refresh token must not be reusable');

    const create = await call('/api/posts', {
      method: 'POST', token: login.data.data.accessToken,
      body: { title: 'Ubuntu CI smoke question', content: 'Testing real MySQL 8', post_type: 'question' }
    });
    assert.equal(create.status, 201, JSON.stringify(create.data));
    assert.ok(create.data?.data?.id);

    const feed = await call('/api/posts?type=question', {
      token: login.data.data.accessToken
    });
    assert.equal(feed.status, 200, JSON.stringify(feed.data));
    assert.ok(feed.data?.data?.some(p => p.id === create.data.data.id));

    // This verifies a KNOWN current defect, not the desired public guest feed.
    const guestFeed = await call('/api/posts');
    assert.equal(guestFeed.status, 401);
  } finally {
    if (createdUserId) {
      // FK cascades remove test user's posts and refresh tokens.
      await User.destroy({ where: { id: createdUserId } }).catch(() => {});
    }
    if (started) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});


// Run SEC-01 independently after the baseline closes its Sequelize pool.
// This reuses the existing disposable MySQL CI job without modifying the
// shared workflow also edited by QA-01 PR #21.
test('SEC-01: Post privacy and protected PDF negative suite', { timeout: 120_000 }, () => {
  const { spawnSync } = require('node:child_process');
  const run = spawnSync(process.execPath,
    ['--test', require.resolve('./pdf-security.test.cjs')],
    { stdio: 'inherit', env: process.env, timeout: 115_000 });
  if (run.error) throw run.error;
  assert.equal(run.status, 0, 'SEC-01 subprocess must PASS');
});
