'use strict';
/* FE66 P2: real Express HTTP + isolated MySQL 8 contract regression. No cloud. */
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { assertDisposableEnvironment } = require('../../server/src/seeders/fe66-disposable-guard');
const expectedDatabase = assertDisposableEnvironment();
if (process.env.GITHUB_ACTIONS !== 'true' || !process.env.RUNNER_TEMP ||
    !process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
  throw new Error('REFUSED: FE66 P2 contract regression is restricted to isolated GitHub Actions CI.');
}
const jwt = require('../../server/node_modules/jsonwebtoken');
const app = require('../../server/src/app');
const { sequelize, User, Post, Bookmark, Follow, Notification, ModerationAuditLog } =
  require('../../server/src/models');
const ids = { users: [], posts: [], audit: [] };
let server;
let origin;
let steps = 0;
function token(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}
async function call(method, route, actor, body) {
  const res = await fetch(origin + route, {
    method,
    headers: {
      ...(actor ? { Authorization: 'Bearer ' + token(actor) } : {}),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  return { status: res.status, json: await res.json() };
}
async function expect(method, route, actor, body, status = 200) {
  const response = await call(method, route, actor, body);
  assert.equal(response.status, status,
    method + ' ' + route + ' => ' + response.status + ', wanted ' + status + ', body=' + JSON.stringify(response.json));
  assert.equal(response.json.success, status >= 200 && status < 300);
  return response.json;
}
async function check(label, fn) {
  await fn();
  console.log('FE66-P2-' + String(++steps).padStart(2, '0') + ' PASS ' + label);
}
function pageShape(dto, count, page, limit) {
  assert.ok(Array.isArray(dto.data), 'data must be an array for frontend .data.data');
  assert.deepEqual(Object.keys(dto.pagination).sort(),
    ['limit','page','total','totalPages'].sort());
  assert.equal(dto.pagination.total, count);
  assert.equal(dto.pagination.page, page);
  assert.equal(dto.pagination.limit, limit);
  assert.equal(dto.pagination.totalPages, Math.ceil(count / limit));
}
test('FE66 P2: Notifications + Follow + Bookmarks + Admin Audit contracts', { timeout: 150000 }, async () => {
  try {
    const [[meta]] = await sequelize.query('SELECT DATABASE() AS db_name, VERSION() AS version');
    assert.equal(meta.db_name, expectedDatabase);
    assert.match(meta.version, /^8[.]/);
    for (const model of [User, Post, Bookmark, Follow, Notification, ModerationAuditLog]) {
      assert.equal(await model.count(), 0, 'test DB not empty: ' + model.tableName);
    }
    server = http.createServer(app);
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    origin = 'http://127.0.0.1:' + server.address().port;
    const accounts = [];
    for (const [n,role] of [['Alpha','student'],['Beta','student'],['Gamma','student'],['Moderator','admin']]) {
      const user = await User.create({
        full_name: 'P2 ' + n, email: 'fe66p2-' + n.toLowerCase() + '@example.invalid',
        password_hash: 'isolated-test-only', role, is_active: true
      });
      accounts.push(user);
      ids.users.push(user.id);
    }
    const [studentA, studentB, studentC, moderator] = accounts;
    const createPost = async (label, type = 'question') => {
      const p = await Post.create({
        user_id: studentA.id, title: 'P2 ' + label, content: 'Contract regression fixture',
        post_type: type, status: 'active', price: 0
      });
      ids.posts.push(p.id);
      return p;
    };
    const post1 = await createPost('Question');
    const post2 = await createPost('Document', 'document');
    const post3 = await createPost('Hidden notification candidate');
    await check('guest/authentication gates for all four endpoint families', async () => {
      for (const route of [
        '/api/users/me/notifications',
        '/api/users/me/notifications/unread-count',
        '/api/users/' + studentB.id + '/follow-stats',
        '/api/posts/bookmarks',
        '/api/posts/moderation/audit-logs'
      ]) await expect('GET', route, null, undefined, 401);
      await expect('POST','/api/users/' + studentB.id + '/follow',null,undefined,401);
      await expect('POST','/api/posts/' + post1.id + '/bookmark',null,undefined,401);
      await expect('PATCH','/api/posts/' + post1.id + '/moderation',null,{status:'hidden'},401);
    });
    await check('Follow POST idempotency, stats and no-self constraint', async () => {
      const first = await expect('POST','/api/users/' + studentB.id + '/follow',studentA);
      assert.deepEqual(first.data, { user_id: studentB.id, following: true });
      await expect('POST','/api/users/' + studentB.id + '/follow',studentA);
      await expect('POST','/api/users/' + studentB.id + '/follow',studentC);
      assert.equal(await Follow.count({where:{following_id:studentB.id}}),2);
      const s = await expect('GET','/api/users/' + studentB.id + '/follow-stats',studentA);
      assert.deepEqual(s.data, {user_id:studentB.id,followers:2,following:0,is_following:true});
      await expect('POST','/api/users/' + studentA.id + '/follow',studentA,undefined,422);
      await expect('POST','/api/users/invalid/follow',studentA,undefined,422);
      await expect('POST','/api/users/99999999/follow',studentA,undefined,404);
    });
    await check('Follow list pagination, public DTO, and user isolation', async () => {
      const followers = await expect('GET','/api/users/' + studentB.id + '/followers?page=1&limit=1',studentA);
      pageShape(followers,2,1,1);
      assert.deepEqual(Object.keys(followers.data[0]).sort(),
        ['id','full_name','avatar_url','university'].sort());
      const following = await expect('GET','/api/users/' + studentA.id + '/following?page=1&limit=1',studentA);
      pageShape(following,1,1,1);
      assert.equal(following.data[0].id, studentB.id);
      await expect('GET','/api/users/' + studentB.id + '/followers?page=0',studentA,undefined,422);
      await expect('GET','/api/users/99999999/followers',studentA,undefined,404);
      const removed = await expect('DELETE','/api/users/' + studentB.id + '/follow',studentA);
      assert.equal(removed.data.following,false);
      assert.equal((await expect('GET','/api/users/' + studentB.id + '/follow-stats',studentA)).data.followers,1);
      assert.equal(await Follow.count({where:{follower_id:studentC.id,following_id:studentB.id}}),1);
    });
    await check('Bookmarks CRUD DTO, pagination and per-user isolation', async () => {
      for (const post of [post1,post2]) {
        const saved = await expect('POST','/api/posts/' + post.id + '/bookmark',studentA);
        assert.deepEqual(saved.data,{post_id:post.id,bookmarked:true});
      }
      await expect('POST','/api/posts/' + post1.id + '/bookmark',studentA);
      assert.equal(await Bookmark.count({where:{user_id:studentA.id}}),2);
      const list = await expect('GET','/api/posts/bookmarks?page=1&limit=1',studentA);
      pageShape(list,2,1,1);
      assert.equal(list.data[0].price,'0.00');
      assert.ok(!('password_hash' in (list.data[0].author || {})));
      const other = await expect('GET','/api/posts/bookmarks',studentB);
      pageShape(other,0,1,10);
      const notOwner = await expect('DELETE','/api/posts/' + post1.id + '/bookmark',studentB);
      assert.equal(notOwner.data.bookmarked,false);
      assert.equal(await Bookmark.count({where:{user_id:studentA.id}}),2);
    });
    await check('Bookmarks stale/hidden post, errors and no enumeration', async () => {
      await post2.update({status:'hidden'});
      const list = await expect('GET','/api/posts/bookmarks',studentA);
      pageShape(list,1,1,10);
      assert.equal(list.data[0].id,post1.id);
      await expect('POST','/api/posts/' + post2.id + '/bookmark',studentB,undefined,404);
      await expect('POST','/api/posts/99999999/bookmark',studentA,undefined,404);
      await expect('POST','/api/posts/x/bookmark',studentA,undefined,422);
      await expect('GET','/api/posts/bookmarks?limit=0',studentA,undefined,422);
      const stale = await expect('DELETE','/api/posts/' + post2.id + '/bookmark',studentA);
      assert.equal(stale.data.bookmarked,false);
      assert.equal(await Bookmark.count({where:{user_id:studentA.id}}),1);
    });
    await check('Notifications list envelope, unread count, visibility and ownership', async () => {
      const created=[];
      for (const [actor, post] of [[studentB,post1],[studentC,post1],[studentB,post3]]) {
        const note = await Notification.create({
          recipient_id: studentA.id, actor_id: actor.id, event_type:'comment',
          post_id:post.id, is_read:false
        });
        created.push(note);
      }
      await post3.update({status:'hidden'});
      const inbox = await expect('GET','/api/users/me/notifications?page=1&limit=1',studentA);
      pageShape(inbox,2,1,1);
      assert.deepEqual(Object.keys(inbox.data[0]).sort(),
        ['id','event_type','actor_id','post_id','comment_id','is_read','created_at'].sort());
      assert.equal((await expect('GET','/api/users/me/notifications/unread-count',studentA)).data.count,2);
      assert.equal((await expect('GET','/api/users/me/notifications/unread-count',studentB)).data.count,2);
      const otherRead=await expect('PATCH','/api/users/me/notifications/' + created[0].id + '/read',studentB,undefined,404);
      assert.equal(otherRead.success,false);
      await expect('PATCH','/api/users/me/notifications/notanid/read',studentA,undefined,422);
      await expect('PATCH','/api/users/me/notifications/99999999/read',studentA,undefined,404);
      const read=await expect('PATCH','/api/users/me/notifications/' + created[0].id + '/read',studentA);
      assert.equal(read.data.is_read,true);
      assert.equal((await expect('GET','/api/users/me/notifications/unread-count',studentA)).data.count,1);
      const all=await expect('PATCH','/api/users/me/notifications/read-all',studentA);
      assert.equal(all.data.updated,1);
      assert.equal((await expect('GET','/api/users/me/notifications/unread-count',studentA)).data.count,0);
      const hidden=await Notification.findByPk(created[2].id);
      assert.equal(hidden.is_read,false,'hidden-post notification must remain unmodified');
      await expect('GET','/api/users/me/notifications?unread_only=invalid',studentA,undefined,422);
      await expect('GET','/api/users/me/notifications?limit=51',studentA,undefined,422);
    });
    await check('Admin audit authorization and empty response DTO', async () => {
      await expect('GET','/api/posts/moderation/audit-logs',studentA,undefined,403);
      await expect('PATCH','/api/posts/' + post1.id + '/moderation',studentA,{status:'hidden'},403);
      const empty=await expect('GET','/api/posts/moderation/audit-logs?page=1&limit=1',moderator);
      pageShape(empty,0,1,1);
      await expect('PATCH','/api/posts/' + post1.id + '/moderation',moderator,{status:'active'},422);
      await expect('PATCH','/api/posts/x/moderation',moderator,{status:'hidden'},422);
      await expect('GET','/api/posts/moderation/audit-logs?page=0',moderator,undefined,422);
      await expect('GET','/api/posts/moderation/audit-logs?post_id=bad',moderator,undefined,422);
    });
    await check('Admin moderation atomic audit, filtering, pagination and forbidden restoration', async () => {
      const first=await expect('PATCH','/api/posts/' + post1.id + '/moderation',moderator,{status:'hidden'});
      assert.deepEqual(first.data,{id:post1.id,status:'hidden'});
      await expect('PATCH','/api/posts/' + post1.id + '/moderation',moderator,{status:'hidden'});
      assert.equal(await ModerationAuditLog.count({where:{post_id:post1.id}}),1);
      const second=await expect('PATCH','/api/posts/' + post1.id + '/moderation',moderator,{status:'deleted'});
      assert.equal(second.data.status,'deleted');
      await expect('PATCH','/api/posts/' + post1.id + '/moderation',moderator,{status:'hidden'},409);
      assert.equal((await Post.findByPk(post1.id)).status,'deleted');
      const all=await expect('GET','/api/posts/moderation/audit-logs?page=1&limit=1',moderator);
      pageShape(all,2,1,1);
      const filtered=await expect('GET','/api/posts/moderation/audit-logs?post_id=' + post1.id,moderator);
      pageShape(filtered,2,1,10);
      assert.deepEqual(Object.keys(filtered.data[0]).sort(),
        ['id','actor_admin_id','post_id','previous_status','new_status','created_at'].sort());
      assert.equal(filtered.data[0].actor_admin_id,moderator.id);
      const nonexistent=await expect('GET','/api/posts/moderation/audit-logs?post_id=99999999',moderator);
      pageShape(nonexistent,0,1,10);
    });
    console.log('FE66 P2 contract regression PASS: ' + steps + ' scenario groups on actual Express + MySQL 8');
  } finally {
    try {
      // Isolated service/database has been independently verified empty on entry.
      // Audit is intentionally FK-independent: clear it before student fixtures.
      if (ids.posts.length) await ModerationAuditLog.destroy({where:{post_id:ids.posts}}).catch(()=>{});
      if (ids.users.length) await User.destroy({where:{id:ids.users}}).catch(()=>{});
    } finally {
      if (server) await new Promise((resolve,reject)=>
        server.close(err=>err?reject(err):resolve()));
      await sequelize.close();
    }
  }
});
