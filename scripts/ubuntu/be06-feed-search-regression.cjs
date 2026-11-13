'use strict';

// BE-06 HTTP + MySQL8 feed regression; disposable test accounts only.
// This file runs from mysql-integration.test.cjs so no shared CI changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');

process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post } = require('../../server/src/models');

test('BE-06: bounded feed/filter/search, guest visibility and stable pagination', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_NAME && process.env.JWT_ACCESS_SECRET,
    'Use a disposable MySQL DB and CI-only JWT secret');
  const server = http.createServer(app);
  const marker = randomUUID().replace(/-/g, '').slice(0, 15);
  const subject = 'BE06-' + marker;
  let userId, token, started = false;
  let steps = 0;

  async function call(route, accessToken, method = 'GET', body) {
    const response = await fetch('http://127.0.0.1:' + server.address().port + route, {
      method,
      headers: {
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, json: await response.json() };
  }
  async function check(label, fn) {
    await fn();
    console.log('BE06 PASS [' + String(++steps).padStart(2, '0') + '] ' + label);
  }
  const query = (q, accessToken) => call('/api/posts?' + q, accessToken);
  const ok = (r) => {
    assert.equal(r.status, 200, JSON.stringify(r.json));
    assert.equal(r.json.success, true);
    assert.ok(Array.isArray(r.json.data));
    assert.ok(r.json.pagination);
    return r.json;
  };

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    started = true;

    const registration = await call('/api/auth/register', null, 'POST', {
      full_name: 'BE06 Disposable Student',
      email: 'be06-' + marker + '@example.test',
      password: 'BE06_CI_only_password_2026',
    });
    userId = registration.json?.data?.user?.id;
    assert.equal(registration.status, 201, JSON.stringify(registration.json));
    token = registration.json.data.accessToken;

    const questions = [];
    for (const title of [
      'BE06 ' + marker + ' first',
      'BE06 ' + marker + ' second',
      'BE06 ' + marker + ' 100% done_',
    ]) {
      questions.push(await Post.create({
        user_id: userId, post_type: 'question', subject, title, content: 'BE06 test fixture',
        price: 0, status: 'active',
      }));
    }
    // Identical timestamps exercise deterministic secondary id ordering.
    await Post.update({ createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { where: { id: questions.map(p => p.id) } });

    const freeDocument = await Post.create({
      user_id: userId, post_type: 'document', subject,
      title: 'BE06 ' + marker + ' public PDF', content: 'Safe metadata',
      file_url: '/uploads/private-be06-' + marker + '.pdf', file_name: 'private.pdf',
      price: 0, status: 'active',
    });
    const hidden = await Post.create({
      user_id: userId, post_type: 'document', subject,
      title: 'BE06 ' + marker + ' hidden', price: 0, status: 'hidden',
    });
    const deleted = await Post.create({
      user_id: userId, post_type: 'document', subject,
      title: 'BE06 ' + marker + ' deleted', price: 0, status: 'deleted',
    });
    const paid = await Post.create({
      user_id: userId, post_type: 'document', subject,
      title: 'BE06 ' + marker + ' paid PDF', price: 500, status: 'active',
    });
    const paidDiscussion = await Post.create({
      user_id: userId, post_type: 'discussion', subject,
      title: 'BE06 ' + marker + ' paid discussion', price: 100, status: 'active',
    });

    await check('Guest remains document-only; forbidden/invalid auth is not downgraded', async () => {
      assert.equal((await call('/api/posts')).status, 401);
      assert.equal((await query('type=question')).status, 401);
      assert.equal((await query('type=document', 'invalid.jwt.token')).status, 401);
      const r = ok(await query('type=document&subject=' + subject));
      assert.deepEqual(r.data.map(p => p.id), [freeDocument.id]);
      assert.ok(!JSON.stringify(r).includes('/uploads/'));
    });

    await check('Free-only visibility excludes hidden/deleted/paid across types', async () => {
      const r = ok(await query('subject=' + subject, token));
      const ids = r.data.map(p => p.id);
      assert.equal(ids.length, 4);
      assert.ok(ids.includes(freeDocument.id));
      for (const id of [hidden.id, deleted.id, paid.id, paidDiscussion.id]) {
        assert.ok(!ids.includes(id));
      }
      assert.ok(r.data.every(p => p.status === 'active' && Number(p.price) === 0));
    });

    await check('Page/limit pagination is numerical and stable under timestamp ties', async () => {
      const base = 'type=question&subject=' + subject + '&limit=2';
      const first = ok(await query(base + '&page=1', token));
      const second = ok(await query(base + '&page=2', token));
      assert.equal(first.pagination.total, 3);
      assert.equal(first.pagination.totalPages, 2);
      assert.equal(first.pagination.page, 1);
      assert.equal(first.pagination.limit, 2);
      assert.deepEqual(first.data.map(p => p.id),
        [questions[2].id, questions[1].id]);
      assert.deepEqual(second.data.map(p => p.id), [questions[0].id]);
      assert.equal(second.pagination.page, 2);
      const beyond = ok(await query(base + '&page=3', token));
      assert.deepEqual(beyond.data, []);
      assert.equal(beyond.pagination.total, 3);
    });

    await check('Search/subject are literal contains searches, not SQL wildcards', async () => {
      const base = 'type=question&subject=' + subject;
      const percent = ok(await query(base + '&search=100%25', token));
      assert.deepEqual(percent.data.map(p => p.id), [questions[2].id]);
      const underscore = ok(await query(base + '&search=_', token));
      assert.deepEqual(underscore.data.map(p => p.id), [questions[2].id]);
      const other = ok(await query(base + '&search=no-such-title-' + marker, token));
      assert.deepEqual(other.data, []);
      const spaced = ok(await query(base + '&search=%20second%20', token));
      assert.deepEqual(spaced.data.map(p => p.id), [questions[1].id]);
    });

    await check('Legacy price filters remain bounded; never surface paid content', async () => {
      const base = 'type=document&subject=' + subject;
      assert.deepEqual(ok(await query(base + '&maxPrice=99999.99')).data.map(p => p.id),
        [freeDocument.id]);
      assert.deepEqual(ok(await query(base + '&minPrice=500')).data, []);
      assert.deepEqual(ok(await query(base + '&minPrice=0&maxPrice=0')).data.map(p => p.id),
        [freeDocument.id]);
    });

    await check('Bad page, limit, type, text, price and parameter arrays return HTTP 422', async () => {
      const invalid = [
        'page=0', 'page=-1', 'page=1.5', 'page=99999999999999999',
        'page=10001', 'page=1&page=2', 'limit=0', 'limit=-1', 'limit=51',
        'limit=1.5', 'limit=wat', 'type=bogus',
        'subject=', 'subject=' + 'a'.repeat(201), 'search=%20%20',
        'search=' + 'x'.repeat(101), 'minPrice=-1', 'maxPrice=NaN',
        'maxPrice=Infinity', 'minPrice=0.001', 'maxPrice=100000000',
        'minPrice=5&maxPrice=4',
      ];
      for (const q of invalid) {
        const r = await query('type=question&' + q, token);
        // Duplicate type=bogus is also a malicious array and must be rejected.
        assert.equal(r.status, 422, q + ': ' + JSON.stringify(r.json));
        assert.equal(r.json.success, false);
      }
    });

    await check('Default pagination shape & SafePost DTO remain backwards compatible', async () => {
      const r = ok(await query('type=document&subject=' + subject));
      assert.deepEqual(Object.keys(r.pagination).sort(),
        ['total', 'page', 'limit', 'totalPages'].sort());
      assert.equal(r.pagination.page, 1);
      assert.equal(r.pagination.limit, 10);
      const result = r.data[0];
      assert.ok(result && result.author);
      for (const forbidden of ['file_url', 'file_name', 'password_hash', 'wallet_balance']) {
        assert.ok(!JSON.stringify(result).includes(forbidden), forbidden);
      }
    });

    console.log('BE-06 feed/search MySQL HTTP regression: ' + steps + '/7 groups PASS');
  } finally {
    if (userId) await User.destroy({ where: { id: userId } }).catch(() => {});
    if (started) await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()));
  }
});
