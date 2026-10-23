'use strict';

// SEC-01 / Issue #13: Post DTO and protected PDF regression on disposable MySQL.
// Creates two unique users, model-only legacy documents and a synthetic static
// sentinel. Cleans only owned user IDs and the sentinel directory; no DROP/TRUNCATE.
const test = require('node:test');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post } = require('../../server/src/models');

test('SEC-01: private PDF/static guard + SafePost + guest permissions', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_NAME && process.env.JWT_ACCESS_SECRET, 'DB/JWT env required');
  const server = http.createServer(app);
  let running = false;
  let origin;
  const users = [];
  const uid = randomUUID().slice(0, 16);
  const sentinel = 'SEC01-SYNTHETIC-PDF-BYTES-' + uid;
  const uploads = path.join(__dirname, '../../server/uploads');
  const fixtureDir = path.join(uploads, '.sec01-' + uid);
  const fakeName = 'private-' + uid + '.pdf';
  const fakeRel = '/uploads/.sec01-' + uid + '/' + fakeName;
  let steps = 0;

  async function request(route, { method = 'GET', token, body } = {}) {
    const res = await fetch(origin + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    return { status: res.status, data, text, type: res.headers.get('content-type') };
  }

  async function step(name, action) {
    await action();
    console.log('PASS [' + String(++steps).padStart(2, '0') + '] ' + name);
  }

  function hasSafePostShape(p) {
    assert.ok(p, 'Post DTO missing');
    const keys = [
      'id', 'user_id', 'title', 'content', 'post_type', 'subject', 'tags',
      'price', 'view_count', 'status', 'created_at', 'updated_at', 'author'
    ];
    assert.deepEqual(Object.keys(p).sort(), keys.sort());
    assert.equal(typeof p.price, 'string');
    if (p.author !== null) {
      assert.deepEqual(Object.keys(p.author).sort(),
        ['id', 'full_name', 'avatar_url', 'university'].sort());
    }
    assert.ok(!JSON.stringify(p).includes(sentinel), 'Raw sentinel leaked through Post DTO');
  }

  try {
    await sequelize.authenticate();
    fs.mkdirSync(fixtureDir, { recursive: true });
    fs.writeFileSync(path.join(fixtureDir, fakeName), sentinel);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    running = true;
    origin = 'http://127.0.0.1:' + server.address().port;

    let a, b, tokenA, tokenB;
    await step('Register two fixture students', async () => {
      a = await request('/api/auth/register', {
        method: 'POST', body: {
          full_name: 'SEC01 Student A', email: 'sec01-a-' + uid + '@example.test',
          password: 'Local-test-password-A-' + uid
        }
      });
      if (a.data?.data?.user?.id) users.push(a.data.data.user.id);
      b = await request('/api/auth/register', {
        method: 'POST', body: {
          full_name: 'SEC01 Student B', email: 'sec01-b-' + uid + '@example.test',
          password: 'Local-test-password-B-' + uid
        }
      });
      if (b.data?.data?.user?.id) users.push(b.data.data.user.id);
      assert.equal(a.status, 201);
      assert.equal(b.status, 201);
      tokenA = a.data.data.accessToken;
      tokenB = b.data.data.accessToken;
    });

    const idA = a.data.data.user.id;
    const legacy = {
      user_id: idA, post_type: 'document', content: 'Safe metadata',
      subject: 'CNPM', file_url: fakeRel, file_name: fakeName
    };
    const free = await Post.create({ ...legacy, title: 'SEC01 visible PDF ' + uid, price: 0, status: 'active' });
    const hidden = await Post.create({ ...legacy, title: 'SEC01 hidden PDF ' + uid, price: 0, status: 'hidden' });
    const deleted = await Post.create({ ...legacy, title: 'SEC01 deleted PDF ' + uid, price: 0, status: 'deleted' });
    const paid = await Post.create({ ...legacy, title: 'SEC01 paid PDF ' + uid, price: 5000, status: 'active' });

    await step('Static URL denies existing synthetic private PDF', async () => {
      const paths = [
        fakeRel,
        fakeRel + '?download=1',
        fakeRel.replace('private-', '%70rivate-'),
        fakeRel.replace('/uploads/', '//uploads/')
      ];
      for (const uri of paths) {
        const r = await request(uri);
        assert.equal(r.status, 404, 'Raw path must not be routable: ' + uri);
        assert.ok(!r.text.includes(sentinel));
      }
    });

    await step('Guest document download requires active login (401)', async () => {
      const r = await request('/api/documents/' + free.id + '/download');
      assert.equal(r.status, 401);
      assert.ok(!r.text.includes(sentinel));
    });

    await step('Guest general feed/question requests remain 401', async () => {
      assert.equal((await request('/api/posts')).status, 401);
      assert.equal((await request('/api/posts?type=question')).status, 401);
      assert.equal((await request('/api/posts?type=discussion')).status, 401);
    });

    await step('Bad Authorization cannot fall back to guest', async () => {
      const r = await fetch(origin + '/api/posts?type=document', {
        headers: { Authorization: 'Bearer bad.jwt.token' }
      });
      assert.equal(r.status, 401);
      assert.equal((await request('/api/posts/' + free.id, { token: 'bad.jwt.token' })).status, 401);
    });

    await step('Guest active/free PDF metadata is safe', async () => {
      const r = await request('/api/posts?type=document');
      assert.equal(r.status, 200);
      assert.ok(r.data.data.some(p => p.id === free.id));
      assert.ok(!r.data.data.some(p => [hidden.id, deleted.id, paid.id].includes(p.id)));
      for (const p of r.data.data) hasSafePostShape(p);
      assert.ok(!r.text.includes(fakeRel));
      assert.ok(!r.text.includes('file_url'));
    });

    await step('Guest cannot discover paid PDF via price filters', async () => {
      for (const query of ['type=document&minPrice=500', 'type=document&maxPrice=99999', 'type=document&search=SEC01']) {
        const r = await request('/api/posts?' + query);
        assert.equal(r.status, 200);
        assert.ok(!r.data.data.some(p => [paid.id, hidden.id, deleted.id].includes(p.id)));
      }
    });

    await step('Signed-in student feed also excludes paid/hidden documents', async () => {
      for (const token of [tokenA, tokenB]) {
        const r = await request('/api/posts?type=document', { token });
        assert.equal(r.status, 200);
        assert.ok(r.data.data.some(p => p.id === free.id));
        assert.ok(!r.data.data.some(p => [hidden.id, deleted.id, paid.id].includes(p.id)));
        for (const p of r.data.data) hasSafePostShape(p);
      }
    });

    await step('Guest + both students may view free PDF safe detail', async () => {
      for (const token of [undefined, tokenA, tokenB]) {
        const r = await request('/api/posts/' + free.id, { token });
        assert.equal(r.status, 200);
        hasSafePostShape(r.data.data);
        assert.equal(r.data.data.id, free.id);
        assert.ok(!r.text.includes(fakeRel));
      }
    });

    await step('Paid, hidden and deleted PDF detail denied for all roles', async () => {
      for (const token of [undefined, tokenA, tokenB]) {
        for (const p of [paid, hidden, deleted]) {
          const r = await request('/api/posts/' + p.id, { token });
          assert.equal(r.status, 404);
          assert.ok(!r.text.includes(fakeRel));
        }
      }
    });

    await step('Legacy JSON document creation and injected paid/file fields denied', async () => {
      const before = await Post.count({ where: { user_id: idA } });
      for (const body of [
        { title: 'bad-doc', post_type: 'document' },
        { title: 'bad-url', post_type: 'question', file_url: fakeRel },
        { title: 'bad-file-name', post_type: 'question', file_name: fakeName },
        { title: 'bad-price', post_type: 'question', price: 1 }
      ]) {
        const r = await request('/api/posts', { method: 'POST', token: tokenA, body });
        assert.equal(r.status, 422);
      }
      assert.equal(await Post.count({ where: { user_id: idA } }), before);
    });

    let questionId;
    await step('Normal question creation returns SafePost without file fields', async () => {
      const r = await request('/api/posts', {
        method: 'POST', token: tokenA,
        body: { title: 'SEC01 question ' + uid, content: 'Hello', post_type: 'question' }
      });
      assert.equal(r.status, 201);
      hasSafePostShape(r.data.data);
      questionId = r.data.data.id;
      assert.equal(r.data.data.author, null);
    });

    await step('Question permission regression and owner update returns SafePost', async () => {
      assert.equal((await request('/api/posts/' + questionId)).status, 401);
      assert.equal((await request('/api/posts/' + questionId,
        { method: 'PUT', token: tokenB, body: { title: 'unauthorized' } })).status, 403);
      const r = await request('/api/posts/' + questionId,
        { method: 'PUT', token: tokenA, body: { title: 'SEC01 updated ' + uid } });
      assert.equal(r.status, 200);
      hasSafePostShape(r.data.data);
      assert.equal(r.data.data.title, 'SEC01 updated ' + uid);
    });

    await step('Owner can soft-delete question; detail is 404', async () => {
      assert.equal((await request('/api/posts/' + questionId,
        { method: 'DELETE', token: tokenA })).status, 200);
      assert.equal((await request('/api/posts/' + questionId, { token: tokenA })).status, 404);
    });

    await step('Hidden document cannot be reactivated by owner', async () => {
      const r = await request('/api/posts/' + hidden.id, {
        method: 'PUT', token: tokenA, body: { status: 'active' }
      });
      assert.equal(r.status, 403);
      assert.equal((await Post.findByPk(hidden.id)).status, 'hidden');
    });

    await step('Authenticated general feed safe serializer excludes paid documents', async () => {
      const r = await request('/api/posts?search=SEC01', { token: tokenB });
      assert.equal(r.status, 200);
      assert.ok(!r.data.data.some(p => p.id === paid.id));
      assert.ok(r.data.data.some(p => p.id === free.id));
      for (const p of r.data.data) hasSafePostShape(p);
    });

    await step('BE04 isolated process regression (independent rate-limit counter)', async () => {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [require('node:path').join(__dirname, 'be04-interactions-regression.cjs')], {
          env: process.env, stdio: 'inherit',
        });
        child.once('error', reject);
        child.once('close', code => code === 0 ? resolve() :
          reject(new Error('BE04 isolated security regression exited with status ' + code)));
      });
    });

    await step('BE08 isolated moderation regression', async () => {
      await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [path.join(__dirname, 'be08-admin-moderation-regression.cjs')], {
          env: process.env, stdio: 'inherit',
        });
        child.once('error', reject);
        child.once('close', code => code === 0 ? resolve() :
          reject(new Error('BE08 MySQL moderation regression exited ' + code)));
      });
    });

    console.log('SEC-01 RESULT: ' + steps + '/' + steps + ' checks PASS; fixture cleanup follows');
  } finally {
    try {
      if (users.length) await User.destroy({ where: { id: users } });
    } finally {
      try {
        if (running) await new Promise((resolve, reject) =>
          server.close(err => err ? reject(err) : resolve()));
      } finally {
        await sequelize.close();
        fs.rmSync(fixtureDir, { recursive: true, force: true });
      }
    }
  }
});
