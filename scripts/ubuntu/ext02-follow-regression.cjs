'use strict';
// EXT-02 real HTTP / isolated MySQL8, no live data or external provider.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Follow } = require('../../server/src/models');

test('EXT-02 directed Follow API, permissions and privacy', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET, 'Disposable loopback MySQL8 only');
  const server = http.createServer(app), userIds = [];
  const tag = randomUUID().slice(0, 12);
  let started = false, origin, a, b, c, groups = 0;

  async function call(method, route, token, body) {
    const response = await fetch(origin + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, json: await response.json() };
  }
  function ok(response, status) {
    assert.equal(response.status, status, 'Expected ' + status + ', got ' +
      response.status + ': ' + JSON.stringify(response.json));
    assert.equal(response.json.success, status >= 200 && status < 300);
    return response.json;
  }
  async function step(label, fn) {
    await fn();
    console.log('EXT02 PASS [' + String(++groups).padStart(2, '0') + '] ' + label);
  }
  const postFollow = (token, id) => call('POST', '/api/users/' + id + '/follow', token);
  const unfollow = (token, id) => call('DELETE', '/api/users/' + id + '/follow', token);
  const followers = (token, id, query = '') =>
    call('GET', '/api/users/' + id + '/followers' + query, token);
  const following = (token, id, query = '') =>
    call('GET', '/api/users/' + id + '/following' + query, token);
  const stats = (token, id) => call('GET', '/api/users/' + id + '/follow-stats', token);

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    started = true;
    origin = 'http://127.0.0.1:' + server.address().port;

    await step('Three synthetic accounts and untouched public profile', async () => {
      for (const letter of ['a', 'b', 'c']) {
        const result = ok(await call('POST', '/api/auth/register', undefined, {
          full_name: 'EXT02 ' + letter,
          email: 'ext02-' + letter + '-' + tag + '@example.test',
          password: 'ext02-disposable-regression-password',
        }), 201);
        const entry = { id: result.data.user.id, token: result.data.accessToken };
        userIds.push(entry.id);
        if (letter === 'a') a = entry;
        else if (letter === 'b') b = entry;
        else c = entry;
      }
      const profile = ok(await call('GET', '/api/users/' + b.id), 200);
      assert.equal(profile.data.id, b.id);
      assert.ok(!Object.hasOwn(profile.data, 'email'));
    });

    await step('Every Follow endpoint requires login', async () => {
      for (const [method, endpoint] of [
        ['POST', '/api/users/' + b.id + '/follow'],
        ['DELETE', '/api/users/' + b.id + '/follow'],
        ['GET', '/api/users/' + b.id + '/followers'],
        ['GET', '/api/users/' + b.id + '/following'],
        ['GET', '/api/users/' + b.id + '/follow-stats'],
      ]) {
        ok(await call(method, endpoint), 401);
      }
      ok(await stats('not-a-valid-token', b.id), 401);
    });

    await step('Malformed, self and absent user IDs are correctly denied', async () => {
      for (const bad of ['0', 'abc', '01', '9007199254740992']) {
        ok(await postFollow(a.token, bad), 422);
        ok(await unfollow(a.token, bad), 422);
      }
      ok(await postFollow(a.token, a.id), 422);
      ok(await unfollow(a.token, a.id), 422);
      ok(await postFollow(a.token, 4294967295), 404);
      ok(await stats(a.token, 4294967295), 404);
      assert.equal(await Follow.count(), 0);
    });

    await step('Idempotent Follow is unique per follower and target', async () => {
      for (let j = 0; j < 3; j++) {
        const response = ok(await postFollow(a.token, b.id), 200);
        assert.deepEqual(response.data, { user_id: b.id, following: true });
      }
      assert.equal(await Follow.count({
        where: { follower_id: a.id, following_id: b.id },
      }), 1);
      ok(await postFollow(c.token, b.id), 200);
      ok(await postFollow(b.token, a.id), 200);
      ok(await postFollow(a.token, c.id), 200);
      assert.equal(await Follow.count(), 4);
    });

    await step('Follower/following lists are paginated and safe by design', async () => {
      const incoming = ok(await followers(a.token, b.id, '?page=1&limit=1'), 200);
      assert.equal(incoming.pagination.total, 2);
      assert.equal(incoming.pagination.totalPages, 2);
      assert.equal(incoming.data.length, 1);
      const next = ok(await followers(a.token, b.id, '?page=2&limit=1'), 200);
      assert.equal(new Set([incoming.data[0].id, next.data[0].id]).size, 2);
      const outgoing = ok(await following(a.token, a.id), 200);
      assert.deepEqual(new Set(outgoing.data.map(x => x.id)), new Set([b.id, c.id]));
      assert.equal(outgoing.pagination.total, 2);
      const gone = ok(await followers(a.token, b.id, '?page=3&limit=1'), 200);
      assert.deepEqual(gone.data, []);
      for (const person of [...incoming.data, ...next.data, ...outgoing.data]) {
        assert.deepEqual(Object.keys(person).sort(), ['id', 'full_name', 'avatar_url', 'university'].sort());
        for (const secret of ['email', 'password_hash', 'wallet_balance', 'token']) {
          assert.ok(!JSON.stringify(person).includes('"' + secret + '"'));
        }
      }
    });

    await step('Stats use active relation counts and caller-specific follow flag', async () => {
      const fromA = ok(await stats(a.token, b.id), 200);
      assert.deepEqual(fromA.data, {
        user_id: b.id, followers: 2, following: 1, is_following: true,
      });
      const fromB = ok(await stats(b.token, b.id), 200);
      assert.equal(fromB.data.is_following, false);
      const fromC = ok(await stats(c.token, a.id), 200);
      assert.equal(fromC.data.is_following, false);
      assert.equal(fromC.data.followers, 1);
      assert.equal(fromC.data.following, 2);
    });

    await step('Other users cannot erase relationship owned by somebody else', async () => {
      ok(await unfollow(b.token, c.id), 200);
      assert.equal(await Follow.count({
        where: { follower_id: a.id, following_id: c.id },
      }), 1);
      const mine = ok(await unfollow(a.token, b.id), 200);
      assert.deepEqual(mine.data, { user_id: b.id, following: false });
      ok(await unfollow(a.token, b.id), 200);
      assert.equal((await stats(a.token, b.id)).json.data.is_following, false);
      ok(await postFollow(a.token, b.id), 200);
    });

    await step('Bad page/limit and inactive accounts fail closed', async () => {
      for (const query of ['?page=0', '?page=x', '?limit=51', '?limit=-1', '?page=999999999999999']) {
        ok(await followers(a.token, b.id, query), 422);
        ok(await following(a.token, b.id, query), 422);
      }
      await User.update({ is_active: false }, { where: { id: c.id } });
      ok(await postFollow(a.token, c.id), 404);
      ok(await stats(a.token, c.id), 404);
      ok(await followers(a.token, c.id), 404);
      ok(await following(a.token, c.id), 404);
      ok(await stats(c.token, b.id), 401);
      const active = ok(await following(a.token, a.id), 200);
      assert.deepEqual(active.data.map(x => x.id), [b.id]);
      const s = ok(await stats(a.token, b.id), 200);
      assert.equal(s.data.followers, 1);
      ok(await unfollow(a.token, c.id), 200);
      assert.equal(await Follow.count({ where: { follower_id: a.id, following_id: c.id } }), 0);
    });

    await step('Cascade deletes physical relations; original Profile API still works', async () => {
      // Deleting disposable C removes its incoming/outgoing rows through FK.
      await User.destroy({ where: { id: c.id } });
      assert.equal(await Follow.count({ where: { follower_id: c.id } }), 0);
      assert.equal(await Follow.count({ where: { following_id: c.id } }), 0);
      ok(await postFollow(a.token, c.id), 404);
      ok(await call('GET', '/api/users/' + a.id), 200);
      const fresh = ok(await stats(a.token, b.id), 200);
      assert.equal(fresh.data.followers, 1);
      assert.equal(fresh.data.following, 1);
    });

    console.log('EXT-02 RESULT: ' + groups + '/9 MySQL8 HTTP groups PASS');
  } finally {
    if (userIds.length) await User.destroy({ where: { id: userIds } }).catch(() => {});
    if (started) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});
