'use strict';

// BE-09: real HTTP + disposable MySQL8. Runs in a fresh process after DOC-04,
// never edits real cloud/Render/TiDB, and deletes only the created test users.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post } = require('../../server/src/models');

test('BE-09: secure social Post create/edit ownership and field validation', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' &&
    process.env.DB_NAME && process.env.JWT_ACCESS_SECRET,
  'Use disposable loopback MySQL8 with CI-only JWT');
  const server = http.createServer(app), createdIds = [];
  const marker = randomUUID().slice(0, 13);
  let base, active = false, a, b, admin, postId, hiddenId, steps = 0;

  async function call(method, route, body, token) {
    const r = await fetch(base + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: r.status, data: await r.json() };
  }
  const create = (payload, token = a.token) => call('POST', '/api/posts', payload, token);
  const edit = (id, payload, token = a.token) =>
    call('PUT', '/api/posts/' + id, payload, token);
  function status(r, code) {
    assert.equal(r.status, code, 'Expected ' + code + ' got ' + r.status +
      ': ' + JSON.stringify(r.data));
    assert.equal(r.data.success, code >= 200 && code < 300);
  }
  async function check(name, fn) {
    await fn();
    console.log('BE09 PASS [' + String(++steps).padStart(2, '0') + '] ' + name);
  }
  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
    });
    active = true;
    base = 'http://127.0.0.1:' + server.address().port;
    for (const who of ['a', 'b', 'admin']) {
      const r = await call('POST', '/api/auth/register', {
        full_name: 'BE09 ' + who, email: 'be09-' + who + '-' + marker + '@example.test',
        password: 'BE09-ci-only-password',
      });
      if (r.data?.data?.user?.id) createdIds.push(r.data.data.user.id);
      status(r, 201);
      const actor = { id: r.data.data.user.id, token: r.data.data.accessToken };
      if (who === 'a') a = actor;
      else if (who === 'b') b = actor;
      else admin = actor;
    }
    await User.update({ role: 'admin' }, { where: { id: admin.id } });

    await check('Guest cannot create or edit posts', async () => {
      status(await call('POST', '/api/posts', { title: 'Guest rejected' }), 401);
      status(await call('PUT', '/api/posts/1', { title: 'Guest edit rejected' }), 401);
    });

    await check('Valid question and discussion normalize text/tags, preserve safe DTO', async () => {
      const r = await create({
        title: '  BE09 sample question  ',
        content: '  Hello  ', subject: '  CNPM  ', tags: ['  node  ', 'security'],
        post_type: 'question', price: 0,
      });
      status(r, 201); postId = r.data.data.id;
      assert.equal(r.data.data.title, 'BE09 sample question');
      assert.equal(r.data.data.content, 'Hello');
      assert.equal(r.data.data.subject, 'CNPM');
      assert.deepEqual(r.data.data.tags, ['node', 'security']);
      assert.equal(r.data.data.user_id, a.id);
      assert.equal(r.data.data.price, '0.00');
      for (const field of ['file_url', 'file_name', 'storage_key', 'password_hash']) {
        assert.ok(!Object.hasOwn(r.data.data, field));
      }
      const second = await create({ title: 'Discussion BE09', post_type: 'discussion' });
      status(second, 201);
      assert.equal(second.data.data.post_type, 'discussion');
      const defaultType = await create({ title: 'Default question BE09' });
      status(defaultType, 201);
      assert.equal(defaultType.data.data.post_type, 'question');
    });

    await check('Invalid/malicious create bodies denied without database changes', async () => {
      const before = await Post.count({ where: { user_id: a.id } });
      const cases = [
        {}, [], { title: ' ' }, { title: 3 },
        { title: 'x'.repeat(301) }, { title: 'x', post_type: 'document' },
        { title: 'x', post_type: 'other' }, { title: 'x', price: 1 },
        { title: 'x', price: -5 }, { title: 'x', price: true },
        { title: 'x', file_url: '/uploads/private.pdf' },
        { title: 'x', file_name: 'file.pdf' }, { title: 'x', user_id: b.id },
        { title: 'x', status: 'active' }, { title: 'x', role: 'admin' },
        { title: 'x', view_count: 1000000 },
        { title: 'x', content: {} }, { title: 'x', content: 'c'.repeat(10001) },
        { title: 'x', subject: 'z'.repeat(201) },
        { title: 'x', tags: ['valid', 7] },
        { title: 'x', tags: [''] }, { title: 'x', tags: Array(13).fill('tag') },
        { title: 'x', tags: ['t'.repeat(41)] },
      ];
      for (const payload of cases) status(await create(payload), 422);
      // express.json(strict=true) rejects the syntactically-valid scalar JSON
      // literal null at the parser boundary with 400, before route validation.
      status(await create(null), 400);
      assert.equal(await Post.count({ where: { user_id: a.id } }), before);
    });

    await check('Owner partial update and field clearing are safe', async () => {
      const result = await edit(postId, {
        title: '  Updated title  ', content: null, subject: '',
        tags: ['  qa  ', 'web'],
      });
      status(result, 200);
      assert.equal(result.data.data.title, 'Updated title');
      assert.equal(result.data.data.content, null);
      assert.equal(result.data.data.subject, null);
      assert.deepEqual(result.data.data.tags, ['qa', 'web']);
      assert.equal(result.data.data.user_id, a.id);
      assert.equal((await Post.findByPk(postId)).status, 'active');
    });

    await check('Update cannot inject privileged fields or invalid values, no partial write', async () => {
      const original = await Post.findByPk(postId);
      const cases = [
        {}, [], { title: '' }, { title: 'x'.repeat(301) },
        { title: 'x', content: 'c'.repeat(10001) },
        { title: 'x', subject: [] }, { title: 'x', tags: {} },
        { title: 'x', tags: ['x'.repeat(41)] },
        { title: 'x', tags: Array(13).fill('x') },
        { title: 'x', user_id: b.id }, { title: 'x', price: 0 },
        { title: 'x', file_url: '/unsafe.pdf' },
        { title: 'x', file_name: 'leak.pdf' }, { title: 'x', post_type: 'document' },
        { title: 'x', view_count: 999 }, { title: 'x', role: 'admin' },
        { title: 'x', status: 'active' }, { title: 'x', status: 'invalid' },
      ];
      for (const payload of cases) status(await edit(postId, payload), 422);
      status(await edit(postId, null), 400);
      const latest = await Post.findByPk(postId);
      assert.equal(latest.title, original.title);
      assert.equal(latest.user_id, a.id);
      assert.equal(latest.status, 'active');
    });

    await check('Cross-account editing/deleting denied, malformed ids fail closed', async () => {
      status(await edit(postId, { title: 'Hijacked' }, b.token), 403);
      status(await call('DELETE', '/api/posts/' + postId, undefined, b.token), 403);
      for (const id of ['0', '1e5', 'bad', '999999999999999999999']) {
        status(await edit(id, { title: 'Bad' }), 422);
        status(await call('DELETE', '/api/posts/' + id, undefined, a.token), 422);
      }
      status(await edit('4294967295', { title: 'Nonexistent' }), 404);
      assert.equal((await Post.findByPk(postId)).title, 'Updated title');
    });

    await check('Owner may hide an active post but cannot restore/edit after hiding', async () => {
      const newPost = await create({ title: 'BE09 hide', post_type: 'question' });
      status(newPost, 201); hiddenId = newPost.data.data.id;
      status(await edit(hiddenId, { status: 'hidden' }), 200);
      assert.equal((await Post.findByPk(hiddenId)).status, 'hidden');
      status(await edit(hiddenId, { status: 'active' }), 403);
      status(await edit(hiddenId, { title: 'Bypass moderation' }), 403);
      assert.equal((await Post.findByPk(hiddenId)).status, 'hidden');
    });

    await check('Admin still must pass field validation; unrelated post stays intact', async () => {
      status(await edit(postId, { status: 'hidden', role: 'admin' }, admin.token), 422);
      status(await edit(postId, { title: 'Admin reviewed title' }, admin.token), 200);
      assert.equal((await Post.findByPk(postId)).user_id, a.id);
      assert.equal((await Post.findByPk(hiddenId)).status, 'hidden');
    });

    console.log('BE-09 RESULT: ' + steps + '/8 MySQL8 HTTP groups PASS');
  } finally {
    if (createdIds.length) await User.destroy({ where: { id: createdIds } }).catch(() => {});
    if (active) await new Promise((resolve, reject) =>
      server.close(err => err ? reject(err) : resolve()));
    await sequelize.close();
  }
});
