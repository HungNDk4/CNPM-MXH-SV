'use strict';
// BE-08: disposable MySQL8 / loopback HTTP and private PDF bytes, no cloud.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, DocumentFile } = require('../../server/src/models');
const storage = require('../../server/src/services/private-document-storage');

test('BE-08: admin-only moderation blocks all secondary reads/writes', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET, 'Dedicated loopback disposable MySQL CI only');
  const server = http.createServer(app);
  const ids = [], storageKeys = [];
  const marker = randomUUID().slice(0, 12);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
  let baseURL, listening = false, owner, admin, docId, questionId, commentId, checks = 0;
  async function request(route, method = 'GET', token, body) {
    const response = await fetch(baseURL + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined || body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
    const raw = Buffer.from(await response.arrayBuffer());
    let json; try { json = JSON.parse(raw.toString()); } catch { json = null; }
    return { status: response.status, json, raw };
  }
  const expect = (r, status) => assert.equal(r.status, status,
    'Expected HTTP ' + status + ' got ' + r.status + ' ' + JSON.stringify(r.json));
  const moderate = (id, status, token) => request('/api/posts/' + id + '/moderation',
    'PATCH', token || admin.token, { status });
  async function check(name, fn) { await fn(); console.log('BE08 PASS [' +
    String(++checks).padStart(2, '0') + '] ' + name); }

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    listening = true;
    baseURL = 'http://127.0.0.1:' + server.address().port;

    await check('Create synthetic student and moderator with DB-only admin promotion', async () => {
      for (const type of ['owner', 'admin']) {
        const r = await request('/api/auth/register', 'POST', null, {
          full_name: 'BE08 ' + type, email: 'be08-' + type + '-' + marker + '@example.test',
          password: 'BE08-ci-2026-password',
        });
        if (r.json?.data?.user?.id) ids.push(r.json.data.user.id);
        expect(r, 201);
        const actor = { id: r.json.data.user.id, token: r.json.data.accessToken };
        if (type === 'owner') owner = actor;
        else admin = actor;
      }
      await User.update({ role: 'admin' }, { where: { id: admin.id } });
    });

    const form = new FormData();
    form.set('title', 'BE08 ' + marker + ' PDF');
    form.set('description', 'Moderation fixture');
    form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'be08.pdf');
    const upload = await request('/api/documents', 'POST', owner.token, form);
    expect(upload, 201);
    docId = upload.json.data.id;
    const metadata = await DocumentFile.findOne({ where: { post_id: docId } });
    assert.ok(metadata?.storage_key);
    storageKeys.push(metadata.storage_key);
    const question = await request('/api/posts', 'POST', owner.token, {
      title: 'BE08 ' + marker + ' question', post_type: 'question', content: 'Test post',
    });
    expect(question, 201);
    questionId = question.json.data.id;

    await check('Guest/student refused; invalid fields and IDs denied without changes', async () => {
      expect(await request('/api/posts/' + docId + '/moderation',
        'PATCH', null, { status: 'hidden' }), 401);
      expect(await moderate(docId, 'hidden', owner.token), 403);
      for (const body of [{}, { status: 'active' }, { status: 9 },
        { status: 'hidden', role: 'admin' }, { status: ['hidden'] }, { status: null }]) {
        expect(await request('/api/posts/' + docId + '/moderation',
          'PATCH', admin.token, body), 422);
      }
      for (const id of ['0', '1e6', '999999999999999999999']) {
        expect(await moderate(id, 'hidden'), 422);
      }
      expect(await moderate('4294967295', 'hidden'), 404);
      assert.equal((await Post.findByPk(docId)).status, 'active');
    });

    await check('Initially public free PDF metadata, download, comments and likes work', async () => {
      const feed = await request('/api/posts?type=document&search=BE08');
      expect(feed, 200);
      assert.ok(feed.json.data.some(row => row.id === docId));
      expect(await request('/api/posts/' + docId), 200);
      const download = await request('/api/documents/' + docId + '/download', 'GET', owner.token);
      expect(download, 200);
      assert.deepEqual(download.raw, pdf);
      const comment = await request('/api/comments', 'POST', owner.token, {
        post_id: docId, content: 'BE08 test comment',
      });
      expect(comment, 201);
      commentId = comment.json.data.id;
      expect(await request('/api/likes', 'POST', owner.token, {
        target_type: 'post', target_id: docId,
      }), 200);
    });

    await check('Admin hide uses safe DTO and is idempotent', async () => {
      const result = await moderate(docId, 'hidden');
      expect(result, 200);
      assert.deepEqual(result.json.data, { id: docId, status: 'hidden' });
      expect(await moderate(docId, 'hidden'), 200);
      assert.equal((await Post.findByPk(docId)).status, 'hidden');
    });

    await check('Hidden PDF unavailable in feed/detail/download/comments/likes, even to Admin', async () => {
      const feed = await request('/api/posts?type=document&search=BE08');
      expect(feed, 200);
      assert.ok(!feed.json.data.some(row => row.id === docId));
      for (const token of [null, owner.token, admin.token]) {
        expect(await request('/api/posts/' + docId, 'GET', token), 404);
      }
      expect(await request('/api/documents/' + docId + '/download', 'GET', owner.token), 404);
      expect(await request('/api/comments?post_id=' + docId), 404);
      expect(await request('/api/comments', 'POST', owner.token,
        { post_id: docId, content: 'Forbidden' }), 404);
      expect(await request('/api/likes/count?target_type=post&target_id=' + docId), 404);
      expect(await request('/api/likes', 'POST', owner.token,
        { target_type: 'comment', target_id: commentId }), 404);
      expect(await request('/api/posts/' + docId, 'PUT', owner.token,
        { status: 'active' }), 403);
      assert.equal((await Post.findByPk(docId)).status, 'hidden');
    });

    await check('Hidden document can be soft-deleted; no physical file purge or resurrection', async () => {
      expect(await moderate(docId, 'deleted'), 200);
      expect(await moderate(docId, 'deleted'), 200);
      expect(await moderate(docId, 'hidden'), 409);
      assert.equal((await Post.findByPk(docId)).status, 'deleted');
      assert.ok(await DocumentFile.findOne({ where: { post_id: docId } }));
      expect(await request('/api/documents/' + docId + '/download', 'GET', owner.token), 404);
    });

    await check('Independent active social Post remains usable, then Admin can hide/delete', async () => {
      expect(await request('/api/posts/' + questionId, 'GET', owner.token), 200);
      expect(await moderate(questionId, 'hidden'), 200);
      expect(await request('/api/posts/' + questionId, 'GET', owner.token), 404);
      expect(await moderate(questionId, 'deleted'), 200);
      assert.equal((await Post.findByPk(questionId)).status, 'deleted');
    });
    console.log('BE-08 RESULT: ' + checks + '/7 real HTTP MySQL8 groups PASS');
  } finally {
    if (ids.length) await User.destroy({ where: { id: ids } }).catch(() => {});
    for (const key of storageKeys) await storage.remove(key).catch(() => {});
    if (listening) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});
