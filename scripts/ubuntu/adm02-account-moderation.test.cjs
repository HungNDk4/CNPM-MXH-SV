'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const bcrypt = require('../../server/node_modules/bcryptjs');
const jwt = require('../../server/node_modules/jsonwebtoken');
const { Op } = require('../../server/node_modules/sequelize');

// Explicit double guard: NEVER run this write-capable suite on TiDB QA/main.
if (process.env.ADM02_DISPOSABLE_MYSQL !== 'true' ||
    process.env.NODE_ENV !== 'test' ||
    process.env.DB_HOST !== '127.0.0.1' ||
    process.env.DB_PORT !== '3306' ||
    process.env.DB_NAME !== 'mini_study_network' ||
    process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('ADM-02 suite requires explicitly authorized disposable GitHub MySQL8');
}

const app = require('../../server/src/app');
const { sequelize, User, RefreshToken, AccountModerationAuditLog } = require('../../server/src/models');

test('ADM-02 real HTTP + isolated MySQL8: roles, status, JWT, audit, concurrency, rollback', {
  timeout: 120_000,
}, async () => {
  const server = http.createServer(app);
  const userIds = [];
  const unique = randomUUID().slice(0, 14);
  const hash = await bcrypt.hash('adm02-test-only-secret-' + unique, 10);
  let listening = false;
  const savedCreate = AccountModerationAuditLog.create;
  try {
    await sequelize.authenticate();
    async function user(role, suffix) {
      const account = await User.create({
        full_name: 'ADM02 Test ' + suffix, email: 'adm02-' + unique + '-' + suffix + '@example.test',
        password_hash: hash, role, is_active: true,
      });
      userIds.push(account.id);
      return account;
    }
    const adminA = await user('admin', 'admina');
    const adminB = await user('admin', 'adminb');
    const student = await user('student', 'student');
    const student2 = await user('student', 'student2');
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    listening = true;
    const origin = 'http://127.0.0.1:' + server.address().port;
    async function api(method, path, token, body) {
      const response = await fetch(origin + path, {
        method,
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      });
      return { status: response.status, body: await response.json() };
    }
    const adminToken = admin => jwt.sign({
      id: admin.id, email: admin.email, role: 'admin',
    }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const tokenA = adminToken(adminA);
    const tokenB = adminToken(adminB);
    const loginStudent = await api('POST', '/api/auth/login', null, {
      email: student.email, password: 'adm02-test-only-secret-' + unique,
    });
    assert.equal(loginStudent.status, 200);
    const access = loginStudent.body.data.accessToken;
    const refresh = loginStudent.body.data.refreshToken;

    // Existing auth/router guards; no private user fields in list.
    assert.equal((await api('GET', '/api/admin/users')).status, 401);
    assert.equal((await api('GET', '/api/admin/users', access)).status, 403);
    const list = await api('GET', '/api/admin/users?page=1&limit=2&status=active', tokenA);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 2);
    assert.ok(list.body.pagination.total >= 4);
    assert.ok(list.body.data.every(x => x.email && !('password_hash' in x) &&
      !('wallet_balance' in x) && !('token' in x)));
    const found = await api('GET', '/api/admin/users?search=' + encodeURIComponent(unique), tokenA);
    assert.equal(found.status, 200);
    assert.ok(found.body.pagination.total >= 4);
    assert.equal((await api('GET', '/api/admin/users?limit=100', tokenA)).status, 422);
    assert.equal((await api('GET', '/api/admin/users?page=0', tokenA)).status, 422);
    assert.equal((await api('GET', '/api/admin/users?status=other', tokenA)).status, 422);

    const targetPath = '/api/admin/users/' + student.id + '/status';
    assert.equal((await api('PATCH', targetPath, null, { is_active: false, reason: 'Safe review' })).status, 401);
    assert.equal((await api('PATCH', targetPath, access, { is_active: false, reason: 'Safe review' })).status, 403);
    assert.equal((await api('PATCH', '/api/admin/users/x/status', tokenA,
      { is_active: false, reason: 'Safe review' })).status, 422);
    assert.equal((await api('PATCH', '/api/admin/users/999999999/status', tokenA,
      { is_active: false, reason: 'Safe review' })).status, 404);
    for (const body of [
      { is_active: 'false', reason: 'Safe review' },
      { is_active: false, reason: 'four' },
      { is_active: false, reason: 'z'.repeat(501) },
      { is_active: false, reason: 'Safe review', role: 'admin' },
    ]) {
      assert.equal((await api('PATCH', targetPath, tokenA, body)).status, 422);
    }
    assert.equal((await api('PATCH', '/api/admin/users/' + adminA.id + '/status',
      tokenA, { is_active: false, reason: 'Self lock forbidden' })).status, 409);

    // The old JWT must fail immediately because auth reads active state per request.
    const lock = await api('PATCH', targetPath, tokenA,
      { is_active: false, reason: 'Vi phạm quy định cộng đồng' });
    assert.equal(lock.status, 200, JSON.stringify(lock.body));
    assert.equal(lock.body.data.changed, true);
    assert.equal(lock.body.data.account.is_active, false);
    assert.equal((await api('GET', '/api/auth/me', access)).status, 401);
    assert.equal((await api('POST', '/api/auth/refresh', null, { refreshToken: refresh })).status, 401);
    assert.equal((await api('POST', '/api/auth/login', null, {
      email: student.email, password: 'adm02-test-only-secret-' + unique,
    })).status, 403);
    const tokenRecord = await RefreshToken.findOne({ where: { token: refresh } });
    assert.equal(Boolean(tokenRecord.revoked), true);
    const secondLock = await api('PATCH', targetPath, tokenA,
      { is_active: false, reason: 'Lặp lại yêu cầu khóa' });
    assert.equal(secondLock.status, 200);
    assert.equal(secondLock.body.data.changed, false);
    assert.equal(await AccountModerationAuditLog.count({ where: { target_user_id: student.id } }), 1);

    const lockedList = await api('GET', '/api/admin/users?status=locked&search=' + unique, tokenA);
    assert.equal(lockedList.status, 200);
    assert.ok(lockedList.body.data.some(x => x.id === student.id));

    const unlocked = await api('PATCH', targetPath, tokenA,
      { is_active: true, reason: 'Khôi phục sau rà soát' });
    assert.equal(unlocked.status, 200);
    assert.equal(unlocked.body.data.account.is_active, true);
    assert.equal((await api('POST', '/api/auth/refresh', null, { refreshToken: refresh })).status, 401);
    assert.equal((await api('POST', '/api/auth/login', null, {
      email: student.email, password: 'adm02-test-only-secret-' + unique,
    })).status, 200);
    const auditList = await api('GET', '/api/admin/users/audit-logs?target_user_id=' + student.id, tokenA);
    assert.equal(auditList.status, 200);
    assert.equal(auditList.body.pagination.total, 2);
    assert.equal((await api('GET', '/api/admin/users/audit-logs', access)).status, 403);

    // Atomic rollback: if the audit fails the status and refresh-token update roll back.
    const student2Login = await api('POST', '/api/auth/login', null, {
      email: student2.email, password: 'adm02-test-only-secret-' + unique,
    });
    assert.equal(student2Login.status, 200);
    const refresh2 = student2Login.body.data.refreshToken;
    const target2 = '/api/admin/users/' + student2.id + '/status';
    try {
      AccountModerationAuditLog.create = async () => {
        throw new Error('ADM02_FORCED_AUDIT_FAILURE');
      };
      const aborted = await api('PATCH', target2, tokenA, {
        is_active: false, reason: 'Mô phỏng audit thất bại',
      });
      assert.equal(aborted.status, 500);
    } finally {
      AccountModerationAuditLog.create = savedCreate;
    }
    assert.equal(Boolean((await User.findByPk(student2.id)).is_active), true);
    assert.equal(Boolean((await RefreshToken.findOne({ where: { token: refresh2 } })).revoked), false);

    // Two admins contend on the same account, producing ONE audit event.
    const concurrent = await Promise.all([
      api('PATCH', target2, tokenA, { is_active: false, reason: 'Cùng khóa tài khoản A' }),
      api('PATCH', target2, tokenB, { is_active: false, reason: 'Cùng khóa tài khoản B' }),
    ]);
    assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 200]);
    assert.equal(concurrent.filter(r => r.body.data.changed).length, 1);
    assert.equal(await AccountModerationAuditLog.count({ where: { target_user_id: student2.id } }), 1);

    // Another admin can lock and restore an admin without removing the last admin.
    const lockAdmin = await api('PATCH', '/api/admin/users/' + adminB.id + '/status', tokenA, {
      is_active: false, reason: 'Kiểm tra khóa tài khoản quản trị',
    });
    assert.equal(lockAdmin.status, 200);
    assert.equal((await api('GET', '/api/admin/users', tokenB)).status, 401);
    const restoreAdmin = await api('PATCH', '/api/admin/users/' + adminB.id + '/status', tokenA, {
      is_active: true, reason: 'Kết thúc kiểm tra Admin',
    });
    assert.equal(restoreAdmin.status, 200);
  } finally {
    AccountModerationAuditLog.create = savedCreate;
    if (listening) await new Promise(resolve => server.close(resolve));
    if (userIds.length) {
      // Disposable database only; deleting ONLY fixture-owned rows.
      await AccountModerationAuditLog.destroy({ where: {
        [Op.or]: [
          { target_user_id: { [Op.in]: userIds } },
          { actor_admin_id: { [Op.in]: userIds } },
        ],
      } });
      await RefreshToken.destroy({ where: { user_id: { [Op.in]: userIds } } });
      await User.destroy({ where: { id: { [Op.in]: userIds } } });
    }
    await sequelize.close();
  }
});
