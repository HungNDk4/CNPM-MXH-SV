'use strict';

// BE-11: real HTTP, Express JWT, Sequelize, MySQL8. 100% disposable CI only;
// refuse to run on anyone's local/QA/production database or cloud endpoint.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const path = require('node:path');
const env = process.env;
if (env.BE11_DISPOSABLE_MYSQL !== 'true' || env.GITHUB_ACTIONS !== 'true' ||
    env.NODE_ENV !== 'test' || env.DB_HOST !== '127.0.0.1' ||
    env.DB_PORT !== '3306' || env.DB_NAME !== 'mini_study_network' ||
    env.DB_USER !== 'root' || env.DB_AUTO_SYNC !== 'false') {
  throw new Error('BE-11 regression only runs against authorized disposable MySQL 8 CI');
}
const sr = createRequire(path.join(__dirname, '../../server/package.json'));
const jwt = sr('jsonwebtoken');
const app = require('../../server/src/app');
const { sequelize, User, Post, Like, PostImage } = require('../../server/src/models');

test('BE-11: owner-only My Posts over 51+, pagination, private DTO, filters and status', {
  timeout: 120_000,
}, async () => {
  const server = http.createServer(app);
  const fixtures = [];
  const marker = randomUUID().slice(0, 14);
  let listening = false;
  let likedById;
  try {
    await sequelize.authenticate();
    async function makeUser(suffix) {
      const user = await User.create({
        full_name: 'BE11 ' + suffix,
        email: 'be11-' + marker + '-' + suffix + '@example.test',
        password_hash: '$2b$12$be11.test.only.not.a.valid.account.password.xxx',
        role: 'student',
      });
      fixtures.push(user.id);
      return user;
    }
    const a = await makeUser('owner');
    const b = await makeUser('other');
    const c = await makeUser('empty');
    const postsA = Array.from({ length: 56 }, (_, idx) => ({
      user_id: a.id,
      title: idx === 0 ? 'BE11 unique search ' + marker : 'BE11 owner post ' + marker + ' ' + idx,
      content: idx === 0 ? 'owner search fixture' : 'owner content',
      post_type: idx === 0 ? 'document' : 'question',
      status: idx >= 54 ? (idx === 54 ? 'hidden' : 'deleted') : 'active',
      price: 0,
      ...(idx === 0 ? { file_url: '/private/documents/BE11_SECRET.pdf',
        file_name: 'BE11_PRIVATE_NAME.pdf' } : {}),
    }));
    const authored = await Post.bulkCreate(postsA);
    // This extra foreign fixture verifies search and owner isolation.
    await Post.bulkCreate(Array.from({ length: 3 }, (_, idx) => ({
      user_id: b.id, title: 'BE11 other post ' + marker + ' ' + idx,
      post_type: 'question', status: 'active', price: 0,
    })));
    const liked = await Like.create({
      user_id: b.id, target_type: 'post', target_id: authored[0].id,
    });
    likedById = liked.id;

    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    listening = true;
    const origin = 'http://127.0.0.1:' + server.address().port;
    const token = user => jwt.sign({ id: user.id, role: user.role },
      env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    async function call(route, auth) {
      const r = await fetch(origin + route, {
        headers: auth ? { Authorization: 'Bearer ' + auth } : {},
      });
      return { status: r.status, json: await r.json() };
    }
    const ta = token(a), tb = token(b), tc = token(c);

    assert.equal((await call('/api/posts/my')).status, 401, 'Guest denied');
    const first = await call('/api/posts/my?limit=50&page=1', ta);
    assert.equal(first.status, 200, JSON.stringify(first.json));
    assert.equal(first.json.pagination.total, 56);
    assert.equal(first.json.pagination.totalPages, 2);
    assert.equal(first.json.data.length, 50);
    assert.ok(first.json.data.every(p => p.user_id === a.id));
    assert.ok(first.json.data.every(p => !Object.hasOwn(p, 'file_url') &&
      !Object.hasOwn(p, 'file_name') && !Object.hasOwn(p, 'password_hash')));
    const page2 = await call('/api/posts/my?limit=50&page=2', ta);
    assert.equal(page2.status, 200);
    assert.equal(page2.json.data.length, 6);
    assert.equal(page2.json.pagination.total, 56);
    const allIds = [...first.json.data, ...page2.json.data].map(p => p.id);
    assert.equal(new Set(allIds).size, 56);
    assert.deepEqual(new Set(allIds), new Set(authored.map(p => p.id)));
    assert.equal((await call('/api/posts/my?limit=10&page=999', ta)).json.data.length, 0);

    const foreign = await call('/api/posts/my?limit=50&page=1', tb);
    assert.equal(foreign.status, 200);
    assert.equal(foreign.json.pagination.total, 3);
    assert.ok(foreign.json.data.every(p => p.user_id === b.id));
    const empty = await call('/api/posts/my', tc);
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.json.data, []);
    assert.equal(empty.json.pagination.total, 0);

    assert.equal((await call('/api/posts/my?status=active', ta)).json.pagination.total, 54);
    const hidden = await call('/api/posts/my?status=hidden', ta);
    assert.equal(hidden.status, 200);
    assert.equal(hidden.json.pagination.total, 1);
    assert.equal(hidden.json.data[0].status, 'hidden');
    assert.equal((await call('/api/posts/my?status=deleted', ta)).json.pagination.total, 1);
    assert.equal((await call('/api/posts/my?type=document', ta)).json.pagination.total, 1);
    const ownSearch = await call('/api/posts/my?search=' + marker + '%20owner', ta);
    assert.equal(ownSearch.status, 200);
    assert.equal(ownSearch.json.pagination.total, 0);
    const exactSearch = await call('/api/posts/my?search=' +
      encodeURIComponent('unique search ' + marker), ta);
    assert.equal(exactSearch.status, 200);
    assert.equal(exactSearch.json.pagination.total, 1);
    assert.equal(exactSearch.json.data[0].id, authored[0].id);
    assert.ok(!JSON.stringify(exactSearch.json).includes('BE11_SECRET'));
    assert.ok(!JSON.stringify(exactSearch.json).includes('BE11_PRIVATE_NAME'));
    const searchLiteral = await call('/api/posts/my?search=%25', ta);
    assert.equal(searchLiteral.status, 200);
    assert.equal(searchLiteral.json.pagination.total, 0);

    const popular = await call('/api/posts/my?sort=engagement&limit=10', ta);
    assert.equal(popular.status, 200, JSON.stringify(popular.json));
    assert.equal(popular.json.data[0].id, authored[0].id);
    assert.equal(Number(popular.json.data[0].like_count), 1);

    // A malicious author_id query must never override the JWT owner.
    for (const query of [
      'author_id=' + b.id, 'page=0', 'page=-1', 'limit=51',
      'type=invalid', 'status=blocked', 'sort=invalid', 'search=',
      'search=' + 'x'.repeat(101), 'foo=bar', 'limit=5&status[]=active',
    ]) {
      const r = await call('/api/posts/my?' + query, ta);
      assert.equal(r.status, 422, 'Expected 422 for ' + query);
    }

    await User.update({ is_active: false }, { where: { id: a.id } });
    assert.equal((await call('/api/posts/my', ta)).status, 401, 'Locked JWT denied');
    await User.update({ is_active: true }, { where: { id: a.id } });
    const resumed = await call('/api/posts/my?status=all', ta);
    assert.equal(resumed.status, 200);
    assert.equal(resumed.json.pagination.total, 56);
  } finally {
    try {
      if (listening) await new Promise(resolve => server.close(resolve));
      if (likedById) await Like.destroy({ where: { id: likedById } });
      if (fixtures.length) {
        // ONLY the three synthetic CI users, cascade fixture posts; no resets.
        await User.destroy({ where: { id: fixtures } });
      }
    } finally {
      await sequelize.close();
    }
  }
});
