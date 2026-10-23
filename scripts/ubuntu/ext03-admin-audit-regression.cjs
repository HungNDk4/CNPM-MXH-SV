'use strict';

// EXT-03 isolated disposable MySQL8 real HTTP tests; no cloud, FE or production.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, ModerationAuditLog } = require('../../server/src/models');

test('EXT-03: Admin audit events match only committed moderation transitions', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET,
  'Only disposable loopback MySQL8 with CI-only secrets allowed');
  const server = http.createServer(app), users = [], tokenId = randomUUID().slice(0, 12);
  let open = false, url, admin, student, docId, questionId, rollbackId, passes = 0;

  async function call(method, route, token, body) {
    const response = await fetch(url + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, json: await response.json() };
  }
  function expect(res, status) {
    assert.equal(res.status, status,
      'Expected ' + status + ' but got ' + res.status + ': ' + JSON.stringify(res.json));
    assert.equal(res.json.success, status >= 200 && status < 300);
    return res.json;
  }
  async function step(name, body) {
    await body();
    console.log('EXT03 PASS [' + String(++passes).padStart(2, '0') + '] ' + name);
  }
  const moderate = (id, status, token = admin.token) =>
    call('PATCH', '/api/posts/' + id + '/moderation', token, { status });
  const audit = (token = admin.token, suffix = '') =>
    call('GET', '/api/posts/moderation/audit-logs' + suffix, token);
  const rows = () => ModerationAuditLog.findAll({ where: { actor_admin_id: admin.id } });

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    open = true;
    url = 'http://127.0.0.1:' + server.address().port;

    await step('Create disposable Student and Admin identities', async () => {
      for (const kind of ['student', 'admin']) {
        const response = expect(await call('POST', '/api/auth/register', null, {
          full_name: 'EXT03 ' + kind,
          email: 'ext03-' + kind + '-' + tokenId + '@example.test',
          password: 'EXT03-regression-password-2026',
        }), 201);
        const actor = { id: response.data.user.id, token: response.data.accessToken };
        users.push(actor.id);
        if (kind === 'student') student = actor;
        else admin = actor;
      }
      await User.update({ role: 'admin' }, { where: { id: admin.id } });
      const doc = await Post.create({
        user_id: student.id, title: 'EXT03 private ' + tokenId,
        post_type: 'document', price: 0, status: 'active',
        file_url: '/uploads/ext03-private-' + tokenId + '.pdf',
      });
      docId = doc.id;
      questionId = (await Post.create({
        user_id: student.id, title: 'EXT03 q ' + tokenId,
        post_type: 'question', price: 0, status: 'active',
      })).id;
      assert.equal((await rows()).length, 0);
    });

    await step('Guest and Student cannot inspect audit or perform Admin moderation', async () => {
      expect(await audit(null), 401);
      expect(await audit(student.token), 403);
      expect(await moderate(docId, 'hidden', student.token), 403);
      expect(await moderate(docId, 'hidden', null), 401);
      assert.equal((await rows()).length, 0);
      assert.equal((await Post.findByPk(docId)).status, 'active');
    });

    await step('Invalid moderation payload/ID and query never create audit', async () => {
      for (const body of [{}, { status: 'active' }, { status: 'hidden', extra: 1 },
        { status: null }, { status: ['deleted'] }]) {
        expect(await call('PATCH', '/api/posts/' + docId + '/moderation',
          admin.token, body), 422);
      }
      expect(await moderate('0', 'hidden'), 422);
      expect(await moderate('bad', 'hidden'), 422);
      expect(await moderate('4294967295', 'hidden'), 404);
      for (const q of ['?page=0', '?limit=51', '?page=x', '?post_id=abc',
        '?post_id=0', '?page=9007199254740992']) {
        expect(await audit(admin.token, q), 422);
      }
      assert.equal((await rows()).length, 0);
    });

    await step('Admin hide is atomic and repeated hide is log-idempotent', async () => {
      const first = expect(await moderate(docId, 'hidden'), 200);
      assert.deepEqual(first.data, { id: docId, status: 'hidden' });
      expect(await moderate(docId, 'hidden'), 200);
      assert.equal((await Post.findByPk(docId)).status, 'hidden');
      const history = await rows();
      assert.equal(history.length, 1);
      assert.equal(history[0].actor_admin_id, admin.id);
      assert.equal(history[0].post_id, docId);
      assert.equal(history[0].previous_status, 'active');
      assert.equal(history[0].new_status, 'hidden');
    });

    await step('Hidden to deleted logs once; forbidden resurrect attempts do not log', async () => {
      expect(await moderate(docId, 'deleted'), 200);
      expect(await moderate(docId, 'deleted'), 200);
      expect(await moderate(docId, 'hidden'), 409);
      assert.equal((await Post.findByPk(docId)).status, 'deleted');
      const history = await ModerationAuditLog.findAll({
        where: { post_id: docId }, order: [['id', 'ASC']],
      });
      assert.equal(history.length, 2);
      assert.deepEqual(history.map(x => [x.previous_status, x.new_status]), [
        ['active', 'hidden'], ['hidden', 'deleted'],
      ]);
    });

    await step('Direct active to deleted records correct source and actor', async () => {
      const res = expect(await moderate(questionId, 'deleted'), 200);
      assert.deepEqual(res.data, { id: questionId, status: 'deleted' });
      const history = await ModerationAuditLog.findAll({ where: { post_id: questionId } });
      assert.equal(history.length, 1);
      assert.equal(history[0].previous_status, 'active');
      assert.equal(history[0].new_status, 'deleted');
      assert.equal(history[0].actor_admin_id, admin.id);
      assert.equal((await rows()).length, 3);
    });

    await step('Audit storage failure must roll back Post update, then retry succeeds', async () => {
      rollbackId = (await Post.create({
        user_id: student.id, title: 'EXT03 rollback ' + tokenId,
        post_type: 'question', price: 0, status: 'active',
      })).id;
      const before = (await rows()).length;
      const original = ModerationAuditLog.create;
      try {
        ModerationAuditLog.create = async () => {
          throw new Error('EXT03 test-only simulated audit insert failure');
        };
        expect(await moderate(rollbackId, 'hidden'), 500);
      } finally {
        ModerationAuditLog.create = original;
      }
      assert.equal((await Post.findByPk(rollbackId)).status, 'active',
        'Moderation must roll back when its audit insert fails');
      assert.equal((await rows()).length, before);
      expect(await moderate(rollbackId, 'hidden'), 200);
      assert.equal((await Post.findByPk(rollbackId)).status, 'hidden');
      assert.equal((await rows()).length, before + 1);
    });

    await step('Read API filters and paginates strict safe audit DTOs', async () => {
      const all = expect(await audit(), 200);
      assert.equal(all.pagination.total, 4);
      assert.equal(all.data.length, 4);
      const one = expect(await audit(admin.token, '?page=1&limit=1'), 200);
      const two = expect(await audit(admin.token, '?page=2&limit=1'), 200);
      assert.equal(one.pagination.totalPages, 4);
      assert.notEqual(one.data[0].id, two.data[0].id);
      const missing = expect(await audit(admin.token, '?page=5&limit=1'), 200);
      assert.deepEqual(missing.data, []);
      const filtered = expect(await audit(admin.token, '?post_id=' + docId), 200);
      assert.equal(filtered.pagination.total, 2);
      assert.ok(filtered.data.every(x => x.post_id === docId));
      for (const row of all.data) {
        assert.deepEqual(Object.keys(row).sort(),
          ['id','actor_admin_id','post_id','previous_status','new_status','created_at'].sort());
        assert.equal(row.actor_admin_id, admin.id);
      }
      for (const secret of ['file_url', 'storage_key', 'email', 'password_hash', 'wallet_balance']) {
        assert.ok(!JSON.stringify(all).includes('"' + secret + '"'));
      }
      assert.ok(!JSON.stringify(all).includes('/uploads/'));
    });

    await step('Existing protected Post/PDF access remains denied after moderation', async () => {
      expect(await call('GET', '/api/posts/' + docId, student.token), 404);
      expect(await call('GET', '/api/posts/' + questionId, student.token), 404);
      expect(await moderate(docId, 'hidden'), 409);
      assert.equal((await rows()).length, 4);
      const denied = await call('GET', '/api/posts/moderation/audit-logs', student.token);
      expect(denied, 403);
    });

    console.log('EXT-03 RESULT: ' + passes + '/9 MySQL8 HTTP groups PASS');
  } finally {
    if (admin?.id) {
      await ModerationAuditLog.destroy({ where: { actor_admin_id: admin.id } }).catch(() => {});
    }
    if (users.length) await User.destroy({ where: { id: users } }).catch(() => {});
    if (open) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});
