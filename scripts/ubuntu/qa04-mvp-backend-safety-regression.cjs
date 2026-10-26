'use strict';

// QA-04 / SEC-03: final free-first MVP safety-boundary regression.
// Disposable localhost MySQL8 only. No real payment, credentials or cloud APIs.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');

process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, Order, DocumentAccess, DocumentFile } = require('../../server/src/models');
const storage = require('../../server/src/services/private-document-storage');

test('QA-04: paid APIs stay unmounted and free/private PDF boundaries hold', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET,
  'Only isolated loopback MySQL8 and disposable secrets may run this test');
  const server = http.createServer(app);
  const ids = [], storageKeys = [];
  const marker = randomUUID().slice(0, 14);
  const pdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
  const sentinel = '/uploads/qa04-secret-' + marker + '.pdf';
  let listening = false, origin, student, admin, fileId, legacyPaidId, steps = 0;

  async function send(route, { method = 'GET', token, body } = {}) {
    const result = await fetch(origin + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined || body instanceof FormData ?
          {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} :
        { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
    const bytes = Buffer.from(await result.arrayBuffer());
    let json;
    try { json = JSON.parse(bytes.toString()); } catch { json = null; }
    return { status: result.status, json, bytes, headers: result.headers };
  }
  function expect(result, code) {
    assert.equal(result.status, code, 'Expected HTTP ' + code + ', got ' +
      result.status + ' ' + JSON.stringify(result.json));
    if (result.json && typeof result.json.success === 'boolean') {
      assert.equal(result.json.success, code >= 200 && code < 300);
    }
  }
  async function check(name, fn) {
    await fn();
    console.log('QA04 PASS [' + String(++steps).padStart(2, '0') + '] ' + name);
  }
  function assertSafeProjection(result, blocked) {
    assert.ok(result.json && result.json.success);
    const text = JSON.stringify(result.json);
    for (const field of ['file_url', 'file_name', 'storage_key', 'password_hash']) {
      assert.ok(!text.includes('"' + field + '"'), 'Unexpected protected field ' + field);
    }
    assert.ok(!text.includes(sentinel), 'Legacy file URL leaked');
    if (blocked !== undefined) {
      assert.ok(!result.json.data.some(p => p.id === blocked), 'Suppressed content leaked');
    }
  }

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    listening = true;
    origin = 'http://127.0.0.1:' + server.address().port;

    await check('Fixture student/Admin identities are disposable and DB-authorized', async () => {
      for (const actor of ['student', 'admin']) {
        const r = await send('/api/auth/register', {
          method: 'POST',
          body: {
            full_name: 'QA04 ' + actor,
            email: 'qa04-' + actor + '-' + marker + '@example.test',
            password: 'Qa04-disposable-2026-password',
          },
        });
        if (r.json?.data?.user?.id) ids.push(r.json.data.user.id);
        expect(r, 201);
        const person = { id: r.json.data.user.id, token: r.json.data.accessToken };
        if (actor === 'student') student = person;
        else admin = person;
      }
      await User.update({ role: 'admin' }, { where: { id: admin.id } });
      assert.equal((await User.findByPk(admin.id)).role, 'admin');
    });

    const legacyEndpoints = [
      ['GET', '/api/orders/my'],
      ['POST', '/api/orders'],
      ['GET', '/api/payment/vnpay-return?vnp_ResponseCode=00&vnp_Amount=10000'],
      ['GET', '/api/payment/vnpay-ipn?vnp_ResponseCode=00&vnp_Amount=10000'],
      ['POST', '/api/payment/vnpay-ipn'],
    ];
    let initialOrders, initialAccess;
    await check('Guest cannot access any legacy order/checkout/VNPay callback route', async () => {
      initialOrders = await Order.count();
      initialAccess = await DocumentAccess.count();
      for (const [method, route] of legacyEndpoints) {
        const r = await send(route, {
          method, body: method === 'POST' ? { post_id: 1, price: 999, status: 'paid' } : undefined,
        });
        expect(r, 404);
        assert.ok(!r.bytes.includes(pdf), 'Raw PDF exposed from legacy route');
      }
    });

    await check('Student and Admin cannot activate unmounted paid routes', async () => {
      for (const token of [student.token, admin.token]) {
        for (const [method, route] of legacyEndpoints) {
          expect(await send(route, {
            method, token,
            body: method === 'POST' ? { post_id: 1, amount: 999, status: 'paid' } : undefined,
          }), 404);
        }
      }
      assert.equal(await Order.count(), initialOrders);
      assert.equal(await DocumentAccess.count(), initialAccess);
    });

    await check('Legacy paid/file URL creation rejected with no unintended Post write', async () => {
      const before = await Post.count({ where: { user_id: student.id } });
      const bad = [
        { title: 'Paid', post_type: 'document', price: 1 },
        { title: 'URL', post_type: 'document', file_url: sentinel },
        { title: 'Question paid', post_type: 'question', price: 999 },
        { title: 'File path injection', post_type: 'question', file_url: sentinel },
        { title: 'Identity injection', user_id: admin.id, post_type: 'question' },
      ];
      for (const body of bad) expect(await send('/api/posts', {
        method: 'POST', token: student.token, body,
      }), 422);
      assert.equal(await Post.count({ where: { user_id: student.id } }), before);
    });

    await check('Approved free PDF upload, guest safe metadata and authenticated private download', async () => {
      const form = new FormData();
      form.set('title', 'QA04 free document ' + marker);
      form.append('file', new Blob([pdf], { type: 'application/pdf' }), 'qa04.pdf');
      const upload = await send('/api/documents', {
        method: 'POST', token: student.token, body: form,
      });
      expect(upload, 201);
      fileId = upload.json.data.id;
      const metadata = await DocumentFile.findOne({ where: { post_id: fileId } });
      assert.ok(metadata && metadata.storage_key);
      storageKeys.push(metadata.storage_key);

      const guestList = await send('/api/posts?type=document&search=QA04');
      expect(guestList, 200);
      assertSafeProjection(guestList);
      assert.ok(guestList.json.data.some(row => row.id === fileId));
      expect(await send('/api/documents/' + fileId + '/download'), 401);
      const valid = await send('/api/documents/' + fileId + '/download',
        { token: student.token });
      expect(valid, 200);
      assert.deepEqual(valid.bytes, pdf);
      assert.equal(valid.headers.get('cache-control'), 'private, no-store');
      expect(await send('/uploads/' + metadata.storage_key), 404);
    });

    await check('Legacy paid/hidden/deleted PDF metadata, bytes and interactions remain denied', async () => {
      const legacy = {
        user_id: student.id, title: 'QA04 legacy paid ' + marker,
        post_type: 'document', file_url: sentinel,
        file_name: 'secret.pdf', price: 1000, status: 'active',
      };
      const paid = await Post.create(legacy);
      legacyPaidId = paid.id;
      const hidden = await Post.create({ ...legacy, title: 'QA04 hidden ' + marker,
        price: 0, status: 'hidden' });
      const deleted = await Post.create({ ...legacy, title: 'QA04 deleted ' + marker,
        price: 0, status: 'deleted' });
      const feed = await send('/api/posts?type=document&search=QA04');
      expect(feed, 200);
      for (const p of [paid, hidden, deleted]) {
        assertSafeProjection(feed, p.id);
        for (const token of [undefined, student.token, admin.token]) {
          expect(await send('/api/posts/' + p.id, { token }), 404);
        }
        expect(await send('/api/documents/' + p.id + '/download',
          { token: student.token }), 404);
        expect(await send('/api/likes/count?target_type=post&target_id=' + p.id,
          { token: student.token }), 404);
        expect(await send('/api/comments?post_id=' + p.id,
          { token: student.token }), 404);
      }
      expect(await send(sentinel), 404);
      assert.equal(await Order.count(), initialOrders);
      assert.equal(await DocumentAccess.count(), initialAccess);
    });

    await check('Generic PUT never injects paid price/path or unapproved restore', async () => {
      const old = await Post.findByPk(fileId);
      for (const token of [student.token, admin.token]) {
        for (const body of [
          { price: 999 }, { file_url: sentinel }, { file_name: 'attack.pdf' },
          { post_type: 'document', price: 1 }, { status: 'active' },
        ]) {
          expect(await send('/api/posts/' + fileId, {
            method: 'PUT', token, body,
          }), 422);
        }
      }
      assert.equal((await Post.findByPk(fileId)).title, old.title);
      assert.equal(Number((await Post.findByPk(fileId)).price), 0);
      assert.equal((await Post.findByPk(fileId)).status, 'active');
    });

    await check('Admin hide enforces PDF invisibility with no payment side effects', async () => {
      const hidden = await send('/api/posts/' + fileId + '/moderation', {
        method: 'PATCH', token: admin.token, body: { status: 'hidden' },
      });
      expect(hidden, 200);
      const feed = await send('/api/posts?type=document&search=QA04');
      expect(feed, 200);
      assertSafeProjection(feed, fileId);
      for (const token of [student.token, admin.token]) {
        expect(await send('/api/documents/' + fileId + '/download', { token }), 404);
        expect(await send('/api/posts/' + fileId, {
          method: 'PUT', token, body: { status: 'active' },
        }), 403);
      }
      assert.equal(await Order.count(), initialOrders);
      assert.equal(await DocumentAccess.count(), initialAccess);
    });

    console.log('QA-04 RESULT: ' + steps + '/8 MySQL8 HTTP security groups PASS');
  } finally {
    if (ids.length) await User.destroy({ where: { id: ids } }).catch(() => {});
    for (const key of storageKeys) await storage.remove(key).catch(() => {});
    if (listening) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});
