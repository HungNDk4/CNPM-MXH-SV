'use strict';

// EXT-01 real HTTP + disposable MySQL8; isolated from previous suites.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, Bookmark } = require('../../server/src/models');

test('EXT-01: per-user Bookmarks without private/paid/suppressed disclosure', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET,
  'EXT-01 tests must use disposable loopback MySQL8 and test-only credentials');
  const server = http.createServer(app);
  const ids = [], marker = randomUUID().slice(0, 13);
  const hiddenPath = '/uploads/ext01-private-' + marker + '.pdf';
  let open = false, url, a, b, question1, question2, document, passes = 0;

  async function send(method, route, { token, body } = {}) {
    const result = await fetch(url + route, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: result.status, json: await result.json() };
  }
  function expect(response, code) {
    assert.equal(response.status, code,
      'Expected ' + code + ', got ' + response.status + ': ' + JSON.stringify(response.json));
    assert.equal(response.json.success, code >= 200 && code < 300);
    return response.json;
  }
  function save(id, token = a.token) {
    return send('POST', '/api/posts/' + id + '/bookmark', { token });
  }
  function remove(id, token = a.token) {
    return send('DELETE', '/api/posts/' + id + '/bookmark', { token });
  }
  function list(token = a.token, query = '') {
    return send('GET', '/api/posts/bookmarks' + query, { token });
  }
  async function check(name, fn) {
    await fn();
    console.log('EXT01 PASS [' + String(++passes).padStart(2, '0') + '] ' + name);
  }
  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    open = true;
    url = 'http://127.0.0.1:' + server.address().port;

    await check('Create two separate Student accounts', async () => {
      for (const letter of ['a', 'b']) {
        const result = expect(await send('POST', '/api/auth/register', {
          body: {
            full_name: 'EXT01 ' + letter,
            email: 'ext01-' + letter + '-' + marker + '@example.test',
            password: 'ext01-disposable-test-password',
          },
        }), 201);
        const actor = { id: result.data.user.id, token: result.data.accessToken };
        ids.push(actor.id);
        if (letter === 'a') a = actor;
        else b = actor;
      }
    });

    await check('Login required for all Bookmarks endpoints', async () => {
      expect(await send('GET', '/api/posts/bookmarks'), 401);
      expect(await send('POST', '/api/posts/1/bookmark'), 401);
      expect(await send('DELETE', '/api/posts/1/bookmark'), 401);
      expect(await send('GET', '/api/posts/bookmarks',
        { token: 'malformed.access.token' }), 401);
    });

    await check('Malformed IDs/query rejected before SQL; missing Post is 404', async () => {
      for (const id of ['0', 'abc', '01', '1e6', '9007199254740992']) {
        expect(await save(id), 422);
        expect(await remove(id), 422);
      }
      for (const query of ['?page=0', '?page=-1', '?page=abc', '?limit=0',
        '?limit=51', '?page=999999999999999999999']) {
        expect(await list(a.token, query), 422);
      }
      expect(await save(4294967295), 404);
      assert.equal(await Bookmark.count({ where: { user_id: a.id } }), 0);
    });

    const create = (title, post_type = 'question', status = 'active', price = 0) =>
      Post.create({ user_id: a.id, title: 'EXT01 ' + marker + ' ' + title,
        post_type, status, price,
        ...(post_type === 'document' ? { file_url: hiddenPath, file_name: 'private.pdf' } : {}) });
    question1 = await create('question-one');
    question2 = await create('question-two', 'discussion');
    document = await create('free-pdf', 'document');

    await check('Save active/free Post repeatedly without duplicate rows', async () => {
      for (const post of [question1, question1, question2, document, document]) {
        const result = expect(await save(post.id), 200);
        assert.deepEqual(result.data, { post_id: post.id, bookmarked: true });
      }
      assert.equal(await Bookmark.count({ where: { user_id: a.id } }), 3);
      assert.equal(await Bookmark.count({ where: { user_id: a.id, post_id: question1.id } }), 1);
    });

    await check('Second account Bookmark list and unique pair are isolated', async () => {
      expect(await save(document.id, b.token), 200);
      expect(await save(document.id, b.token), 200);
      let result = expect(await list(b.token), 200);
      assert.deepEqual(result.data.map(p => p.id), [document.id]);
      assert.equal(result.pagination.total, 1);
      result = expect(await list(a.token), 200);
      assert.equal(result.pagination.total, 3);
      assert.equal(await Bookmark.count({ where: { post_id: document.id } }), 2);
    });

    await check('Pagination and SafePost projection hide internal PDF paths', async () => {
      const total = expect(await list(), 200);
      assert.equal(total.pagination.total, 3);
      assert.equal(total.pagination.totalPages, 1);
      assert.equal(total.data.length, 3);
      const first = expect(await list(a.token, '?page=1&limit=1'), 200);
      const second = expect(await list(a.token, '?page=2&limit=1'), 200);
      const third = expect(await list(a.token, '?page=3&limit=1'), 200);
      assert.equal(first.pagination.total, 3);
      assert.equal(first.pagination.totalPages, 3);
      assert.equal(new Set([first.data[0].id, second.data[0].id, third.data[0].id]).size, 3);
      const beyond = expect(await list(a.token, '?page=4&limit=1'), 200);
      assert.deepEqual(beyond.data, []);
      assert.equal(beyond.pagination.total, 3);
      assert.ok(!JSON.stringify(total).includes(hiddenPath), 'File URL must be omitted');
      for (const post of total.data) {
        assert.deepEqual(Object.keys(post).sort(), [
          'id', 'user_id', 'title', 'content', 'post_type', 'subject', 'tags',
          'price', 'view_count', 'status', 'created_at', 'updated_at', 'author'
        ].sort());
        assert.equal(post.price, '0.00');
        assert.equal(post.status, 'active');
        assert.ok(!JSON.stringify(post).includes('storage_key'));
        assert.ok(!JSON.stringify(post).includes('file_url'));
      }
    });

    await check('Saving hidden, deleted, paid or nonexistent Posts is denied', async () => {
      for (const [state, price] of [['hidden', 0], ['deleted', 0], ['active', 1200]]) {
        const fixture = await create('blocked-' + state + '-' + price, 'document', state, price);
        expect(await save(fixture.id), 404);
      }
      assert.equal(await Bookmark.count({ where: { user_id: a.id } }), 3);
    });

    await check('Existing saved Posts disappear from list after hide or paid change', async () => {
      await Post.update({ status: 'hidden' }, { where: { id: document.id } });
      await Post.update({ price: 1000 }, { where: { id: question2.id } });
      const mine = expect(await list(), 200);
      assert.deepEqual(mine.data.map(p => p.id), [question1.id]);
      assert.equal(mine.pagination.total, 1);
      assert.deepEqual(expect(await list(b.token), 200).data, []);
      assert.equal(await Bookmark.count({ where: { user_id: a.id } }), 3,
        'Rows may remain for later self-removal; hidden posts are never returned');
      expect(await save(document.id), 404);
      expect(await save(question2.id), 404);
    });

    await check('Unsave idempotently including stale hidden/paid/missing IDs; original feed works', async () => {
      for (const id of [document.id, question2.id, question1.id, question1.id, 4294967295]) {
        const response = expect(await remove(id), 200);
        assert.deepEqual(response.data, { post_id: id, bookmarked: false });
      }
      assert.equal(await Bookmark.count({ where: { user_id: a.id } }), 0);
      const other = expect(await list(b.token), 200);
      assert.equal(other.pagination.total, 0);
      // B's stale bookmark can be removed without viewing deleted/hidden Post metadata.
      expect(await remove(document.id, b.token), 200);
      assert.equal(await Bookmark.count({ where: { post_id: document.id } }), 0);
      const feed = expect(await send('GET', '/api/posts?type=question',
        { token: a.token }), 200);
      assert.ok(feed.data.some(post => post.id === question1.id));
    });

    console.log('EXT-01 RESULT: ' + passes + '/9 MySQL8 HTTP groups PASS');
  } finally {
    if (ids.length) await User.destroy({ where: { id: ids } }).catch(() => {});
    if (open) await new Promise((resolve, reject) =>
      server.close(error => error ? reject(error) : resolve()));
    await sequelize.close();
  }
});
