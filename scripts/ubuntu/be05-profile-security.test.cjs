'use strict';

// BE-05 API safety and password/session lifecycle on disposable MySQL8 ONLY.
// CI runs this as a fresh Node process from the existing QA-01 integration step.
// No production data, schema mutation, cloud access, or shared CI workflow edits.
const assert = require('node:assert/strict');
const test = require('node:test');
const http = require('node:http');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');

const serverRequire = createRequire(path.join(__dirname, '../../server/package.json'));
const bcrypt = serverRequire('bcryptjs');
const app = require('../../server/src/app');
const { User, RefreshToken, sequelize } = require('../../server/src/models');

test('BE-05: Profile DTO, strict self-update and password refresh revocation', { timeout: 120000 }, async () => {
  assert.equal(process.env.NODE_ENV, 'test', 'Refuse non-test runtime');
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Run only in isolated CI');
  assert.equal(process.env.DB_HOST, '127.0.0.1', 'Never access cloud MySQL');
  assert.equal(process.env.DB_NAME, 'mini_study_network', 'Only disposable CI database');
  assert.ok(process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET);

  const server = http.createServer(app);
  const identities = [];
  let listening = false;
  let count = 0;

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    listening = true;
    const origin = 'http://127.0.0.1:' + server.address().port;
    const marker = randomUUID().slice(0, 12);
    const aEmail = 'be05-a-' + marker + '@example.test';
    const bEmail = 'be05-b-' + marker + '@example.test';
    const initialPass = 'BE05-Initial-' + marker;
    const nextPass = 'BE05-Rotated-' + marker;
    const bPass = 'BE05-Other-' + marker;

    async function req(method, endpoint, body, token) {
      const r = await fetch(origin + endpoint, {
        method,
        headers: {
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const raw = await r.text();
      let json;
      try { json = JSON.parse(raw); } catch { json = null; }
      return { status: r.status, json, raw };
    }
    function expect(r, status) {
      assert.equal(r.status, status, 'Expected HTTP ' + status + ', got ' + r.status +
        ': ' + (r.json?.message ?? ''));
      assert.equal(r.json?.success, status >= 200 && status < 300);
      return r.json;
    }
    async function step(label, fn) {
      await fn();
      count++;
      console.log('BE05 PASS [' + count + '] ' + label);
    }
    function safeProfile(json) {
      const p = json.data;
      assert.deepEqual(Object.keys(p).sort(), [
        'id', 'full_name', 'avatar_url', 'bio', 'university', 'major', 'created_at'
      ].sort(), 'Only PublicProfile fields may appear in response');
      const raw = JSON.stringify(json);
      for (const secret of ['password_hash', 'wallet_balance', 'refreshToken', 'is_active', '"email"', '"role"']) {
        assert.ok(!raw.includes(secret), 'Sensitive property in response: ' + secret);
      }
      return p;
    }

    let a, b, tokenA, tokenB, refreshA1, refreshA2, refreshB;
    await step('two disposable students register and get separate JWT sessions', async () => {
      const ar = await req('POST', '/api/auth/register', {
        full_name: 'BE05 Student A', email: aEmail, password: initialPass,
      });
      if (ar.json?.data?.user?.id) identities.push(ar.json.data.user.id);
      expect(ar, 201);
      const br = await req('POST', '/api/auth/register', {
        full_name: 'BE05 Student B', email: bEmail, password: bPass,
      });
      if (br.json?.data?.user?.id) identities.push(br.json.data.user.id);
      expect(br, 201);
      a = ar.json.data.user;
      b = br.json.data.user;
      tokenA = ar.json.data.accessToken;
      refreshA1 = ar.json.data.refreshToken;
      tokenB = br.json.data.accessToken;
      refreshB = br.json.data.refreshToken;
      assert.notEqual(a.id, b.id);
      const second = await req('POST', '/api/auth/login', { email: aEmail, password: initialPass });
      expect(second, 200);
      refreshA2 = second.json.data.refreshToken;
      assert.notEqual(refreshA1, refreshA2);
    });

    await step('public profile only includes allowlisted active user fields', async () => {
      const aGuest = safeProfile(expect(await req('GET', '/api/users/' + a.id), 200));
      const aOwner = safeProfile(expect(await req('GET', '/api/users/' + a.id, undefined, tokenA), 200));
      assert.equal(aGuest.id, a.id);
      assert.equal(aOwner.full_name, 'BE05 Student A');
      expect(await req('GET', '/api/users/999999999'), 404);
      expect(await req('GET', '/api/users/-1'), 422);
      expect(await req('GET', '/api/users/foobar'), 422);
    });

    await step('self-profile update trims fields and returns safe full public DTO', async () => {
      const payload = { full_name: '  BE05 Safe Name  ', university: '  Demo University  ',
        major: '  Software  ', bio: '  safe introductory text  ',
        avatar_url: 'https://example.org/avatars/synthetic.png' };
      const result = safeProfile(expect(await req('PUT', '/api/users/profile', payload, tokenA), 200));
      assert.equal(result.full_name, 'BE05 Safe Name');
      assert.equal(result.university, 'Demo University');
      assert.equal(result.bio, 'safe introductory text');
      assert.equal(result.avatar_url, payload.avatar_url);
      assert.equal((await User.findByPk(a.id)).full_name, 'BE05 Safe Name');
    });

    await step('malicious fields and invalid profile inputs reject without privilege change', async () => {
      const invalid = [
        { role: 'admin', email: 'attacker@example.test' },
        { wallet_balance: 999999, full_name: 'Admin Inject' },
        { is_active: false }, {},
        { full_name: '' }, { full_name: 'a'.repeat(101) },
        { major: { value: 'injected' } },
        { university: 'a'.repeat(201) },
        { bio: 'b'.repeat(1001) },
        { avatar_url: 'http://insecure.invalid/img.png' },
        { avatar_url: 'javascript:alert(1)' },
        { avatar_url: 'https://user:pass@example.org/img.png' },
        { avatar_url: 'x'.repeat(501) },
      ];
      for (const payload of invalid) expect(await req('PUT', '/api/users/profile', payload, tokenA), 422);
      expect(await req('PUT', '/api/users/profile', { full_name: 'no token' }), 401);
      const user = await User.findByPk(a.id);
      assert.equal(user.role, 'student');
      assert.equal(user.is_active, true);
      assert.equal(user.email, aEmail);
      assert.equal(user.full_name, 'BE05 Safe Name');
      assert.equal(String(user.wallet_balance), '0.00');
    });

    await step('partial owner edit and nullable clearing do not update other account', async () => {
      safeProfile(expect(await req('PUT', '/api/users/profile', { bio: null, avatar_url: null }, tokenA), 200));
      const first = safeProfile(expect(await req('GET', '/api/users/' + a.id), 200));
      const other = safeProfile(expect(await req('GET', '/api/users/' + b.id), 200));
      assert.equal(first.bio, null);
      assert.equal(first.avatar_url, null);
      assert.equal(first.full_name, 'BE05 Safe Name');
      assert.equal(other.full_name, 'BE05 Student B');
    });

    await step('wrong/weak/same/overlong passwords rejected without revocation', async () => {
      const bad = [
        { current_password: 'wrong-' + marker, new_password: nextPass, status: 400 },
        { current_password: initialPass, new_password: 'short', status: 422 },
        { current_password: initialPass, new_password: initialPass, status: 422 },
        { current_password: initialPass, new_password: 'á'.repeat(40), status: 422 },
        { current_password: initialPass, new_password: 123, status: 422 },
        { current_password: '', new_password: nextPass, status: 422 },
        { current_password: initialPass, new_password: nextPass, role: 'admin', status: 422 },
      ];
      for (const { status, ...payload } of bad) {
        expect(await req('PUT', '/api/users/change-password', payload, tokenA), status);
      }
      expect(await req('PUT', '/api/users/change-password', {
        current_password: initialPass, new_password: nextPass,
      }), 401);
      assert.equal(await RefreshToken.count({ where: { user_id: a.id, revoked: false } }), 2);
      assert.ok(await bcrypt.compare(initialPass, (await User.findByPk(a.id)).password_hash));
    });

    await step('password change atomically revokes A refresh tokens but leaves B intact', async () => {
      expect(await req('PUT', '/api/users/change-password', {
        current_password: initialPass, new_password: nextPass,
      }, tokenA), 200);
      const updated = await User.findByPk(a.id);
      assert.ok(await bcrypt.compare(nextPass, updated.password_hash));
      assert.equal(await RefreshToken.count({ where: { user_id: a.id, revoked: false } }), 0);
      assert.equal(await RefreshToken.count({ where: { user_id: b.id, revoked: false } }), 1);
      expect(await req('POST', '/api/auth/refresh', { refreshToken: refreshA1 }), 401);
      expect(await req('POST', '/api/auth/refresh', { refreshToken: refreshA2 }), 401);
      expect(await req('POST', '/api/auth/refresh', { refreshToken: refreshB }), 200);
      // Stateless access JWT remains usable until expiration; not an immediate
      // all-session access-token logout claim.
      expect(await req('GET', '/api/auth/me', undefined, tokenA), 200);
      expect(await req('GET', '/api/auth/me', undefined, tokenB), 200);
    });

    await step('previous password denied; new password authenticates', async () => {
      expect(await req('POST', '/api/auth/login', {
        email: aEmail, password: initialPass,
      }), 401);
      const fresh = expect(await req('POST', '/api/auth/login', {
        email: aEmail, password: nextPass,
      }), 200);
      assert.equal(fresh.data.user.id, a.id);
    });

    await step('deactivated users no longer appear in public profile', async () => {
      await User.update({ is_active: false }, { where: { id: b.id } });
      expect(await req('GET', '/api/users/' + b.id), 404);
      expect(await req('GET', '/api/users/' + a.id), 200);
    });

    console.log('BE05 RESULT: ' + count + '/' + count + ' groups PASS; removing synthetic identities');
  } finally {
    try {
      if (identities.length) await User.destroy({ where: { id: identities } });
    } finally {
      if (listening) await new Promise(resolve => server.close(resolve));
      await sequelize.close();
    }
  }
});
