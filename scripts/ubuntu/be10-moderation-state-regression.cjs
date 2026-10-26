'use strict';

// BE-10: regression for the legacy Admin restore/edit bypass. Real Express
// HTTP + disposable MySQL8 + synthetic private PDF. No cloud, no migrations.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');

process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, DocumentFile } = require('../../server/src/models');
const storage = require('../../server/src/services/private-document-storage');

test('BE-10: suppressed Post cannot be restored or edited by any role', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' &&
    process.env.DB_NAME && process.env.JWT_ACCESS_SECRET,
  'Run only against disposable loopback MySQL8 with test JWT');
  const srv = http.createServer(app);
  const idList = [], keys = [];
  const marker = randomUUID().slice(0, 14);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
  let url, opened = false, owner, stranger, admin, questionId, docId, cleanId, count = 0;

  async function call(method, route, { token, body } = {}) {
    const response = await fetch(url + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined || body instanceof FormData ?
          {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} :
        { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    let data;
    try { data = JSON.parse(bytes.toString()); } catch { data = null; }
    return { status: response.status, data, bytes };
  }
  const assertStatus = (r, expected) => {
    assert.equal(r.status, expected, 'HTTP ' + expected + ' expected, got ' +
      r.status + ': ' + JSON.stringify(r.data));
    if (r.data && typeof r.data.success === 'boolean') {
      assert.equal(r.data.success, expected >= 200 && expected < 300);
    }
  };
  const edit = (id, body, token = admin.token) =>
    call('PUT', '/api/posts/' + id, { token, body });
  const moderate = (id, status, token = admin.token) =>
    call('PATCH', '/api/posts/' + id + '/moderation',
      { token, body: { status } });
  async function check(name, fn) {
    await fn();
    console.log('BE10 PASS [' + String(++count).padStart(2, '0') + '] ' + name);
  }

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      srv.once('error', reject);
      srv.listen(0, '127.0.0.1', resolve);
    });
    opened = true;
    url = 'http://127.0.0.1:' + srv.address().port;

    await check('Three disposable users; Admin role granted only by CI database', async () => {
      for (const role of ['owner', 'stranger', 'admin']) {
        const r = await call('POST', '/api/auth/register', {
          body: {
            full_name: 'BE10 ' + role,
            email: 'be10-' + role + '-' + marker + '@example.test',
            password: 'BE10-disposable-test-password',
          },
        });
        if (r.data?.data?.user?.id) idList.push(r.data.data.user.id);
        assertStatus(r, 201);
        const actor = { id: r.data.data.user.id, token: r.data.data.accessToken };
        if (role === 'owner') owner = actor;
        else if (role === 'stranger') stranger = actor;
        else admin = actor;
      }
      await User.update({ role: 'admin' }, { where: { id: admin.id } });
    });

    await check('Normal active Post edits and owner/guest access rules remain', async () => {
      const initial = await call('POST', '/api/posts', {
        token: owner.token,
        body: { title: 'BE10 Question ' + marker,
          post_type: 'question', content: 'Original' },
      });
      assertStatus(initial, 201);
      questionId = initial.data.data.id;
      assertStatus(await edit(questionId, { title: '  Owner edit allowed ' },
        owner.token), 200);
      const adminEdit = await edit(questionId, { content: 'Admin edit active allowed' });
      assertStatus(adminEdit, 200);
      assert.equal(adminEdit.data.data.content, 'Admin edit active allowed');
      assertStatus(await edit(questionId, { title: 'Unauthorized' }, stranger.token), 403);
      assertStatus(await call('PUT', '/api/posts/' + questionId,
        { body: { title: 'Guest denied' } }), 401);
      assert.equal((await Post.findByPk(questionId)).user_id, owner.id);
    });

    await check('Owner may hide an active social Post, nobody can restore it', async () => {
      assertStatus(await edit(questionId, { status: 'hidden' }, owner.token), 200);
      const original = await Post.findByPk(questionId);
      assert.equal(original.status, 'hidden');
      for (const actor of [owner, admin]) {
        for (const payload of [
          { status: 'active' }, { status: 'active', title: 'resurrect' },
          { title: 'edit hidden row' }, { content: 'edit suppressed' },
          { status: 'deleted' }, { status: 'hidden' },
        ]) {
          assertStatus(await edit(questionId, payload, actor.token), 403);
        }
      }
      const after = await Post.findByPk(questionId);
      assert.equal(after.status, 'hidden');
      assert.equal(after.title, original.title);
      assert.equal(after.content, original.content);
      assertStatus(await call('GET', '/api/posts/' + questionId,
        { token: admin.token }), 404);
    });

    await check('Valid free PDF uploads, Admin hide via dedicated moderation endpoint', async () => {
      const form = new FormData();
      form.set('title', 'BE10 PDF ' + marker);
      form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'be10.pdf');
      const uploaded = await call('POST', '/api/documents',
        { token: owner.token, body: form });
      assertStatus(uploaded, 201);
      docId = uploaded.data.data.id;
      const entry = await DocumentFile.findOne({ where: { post_id: docId } });
      assert.ok(entry && entry.storage_key);
      keys.push(entry.storage_key);
      const original = await call('GET', '/api/documents/' + docId + '/download',
        { token: stranger.token });
      assertStatus(original, 200);
      assert.deepEqual(original.bytes, pdf);
      assertStatus(await moderate(docId, 'hidden'), 200);
      assert.equal((await Post.findByPk(docId)).status, 'hidden');
    });

    await check('Legacy generic PUT cannot alter hidden PDF or reopen bytes', async () => {
      const previous = await Post.findByPk(docId);
      for (const actor of [owner, admin]) {
        for (const payload of [
          { status: 'active' },
          { status: 'active', title: 'Legacy Admin bypass' },
          { title: 'Silently retitle suppressed PDF' },
          { subject: 'Overwritten' },
          { tags: ['override'] },
          { status: 'deleted' },
        ]) {
          assertStatus(await edit(docId, payload, actor.token), 403);
        }
      }
      const current = await Post.findByPk(docId);
      assert.equal(current.status, 'hidden');
      assert.equal(current.title, previous.title);
      assert.deepEqual(current.tags, previous.tags);
      for (const actor of [owner, stranger, admin]) {
        assertStatus(await call('GET', '/api/documents/' + docId + '/download',
          { token: actor.token }), 404);
      }
      const guestFeed = await call('GET',
        '/api/posts?type=document&search=BE10');
      assertStatus(guestFeed, 200);
      assert.ok(!guestFeed.data.data.some(p => p.id === docId));
      assertStatus(await call('GET', '/api/posts/' + docId), 404);
      assertStatus(await call('GET', '/api/comments?post_id=' + docId,
        { token: owner.token }), 404);
      assertStatus(await call('GET',
        '/api/likes/count?target_type=post&target_id=' + docId,
        { token: owner.token }), 404);
    });

    await check('Admin soft-deletes hidden PDF, no restoration, no file purge', async () => {
      assertStatus(await moderate(docId, 'deleted'), 200);
      assertStatus(await moderate(docId, 'deleted'), 200);
      assertStatus(await moderate(docId, 'hidden'), 409);
      assert.equal((await Post.findByPk(docId)).status, 'deleted');
      for (const actor of [owner, admin]) {
        assertStatus(await edit(docId, { status: 'active' }, actor.token), 403);
        assertStatus(await edit(docId, { title: 'Edit deleted row' }, actor.token), 403);
      }
      assert.ok(await DocumentFile.findOne({ where: { post_id: docId } }),
        'Soft delete must not physically remove document before retention policy');
      assertStatus(await call('GET', '/api/documents/' + docId + '/download',
        { token: owner.token }), 404);
    });

    await check('Admin cannot use status active on active content; safe edits preserved', async () => {
      const r = await call('POST', '/api/posts', {
        token: owner.token,
        body: { title: 'BE10 Active ' + marker, post_type: 'discussion' },
      });
      assertStatus(r, 201);
      cleanId = r.data.data.id;
      assertStatus(await edit(cleanId, { status: 'active' }), 422);
      assertStatus(await edit(cleanId,
        { status: 'active', title: 'No-op activation' }), 422);
      const ok = await edit(cleanId, { title: 'BE10 healthy post' });
      assertStatus(ok, 200);
      assert.equal(ok.data.data.status, 'active');
      assert.equal(ok.data.data.title, 'BE10 healthy post');
      assertStatus(await call('GET', '/api/posts/' + cleanId,
        { token: stranger.token }), 200);
    });

    await check('Existing Admin hide/delete transitions still work for active posts', async () => {
      assertStatus(await moderate(cleanId, 'hidden'), 200);
      assertStatus(await moderate(cleanId, 'hidden'), 200);
      assertStatus(await edit(cleanId, { title: 'Must remain hidden' }), 403);
      assertStatus(await moderate(cleanId, 'deleted'), 200);
      assertStatus(await moderate(cleanId, 'hidden'), 409);
      assert.equal((await Post.findByPk(cleanId)).status, 'deleted');
    });

    console.log('BE-10 RESULT: ' + count + '/8 MySQL8 HTTP groups PASS');
  } finally {
    if (idList.length) await User.destroy({ where: { id: idList } }).catch(() => {});
    for (const key of keys) await storage.remove(key).catch(() => {});
    if (opened) await new Promise((resolve, reject) =>
      srv.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});
