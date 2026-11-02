'use strict';
// EXT-04: real HTTP + disposable MySQL8, isolated process and three users.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { randomUUID } = require('node:crypto');
process.env.NODE_ENV = 'test';
const app = require('../../server/src/app');
const { sequelize, User, Post, Comment, Notification } = require('../../server/src/models');

test('EXT-04: inbox, event provenance, ownership and safe content gates', { timeout: 120_000 }, async () => {
  assert.ok(process.env.DB_HOST === '127.0.0.1' && process.env.DB_NAME &&
    process.env.JWT_ACCESS_SECRET && process.env.JWT_REFRESH_SECRET,
  'Only isolated loopback MySQL8 is allowed');
  const server = http.createServer(app), ids = [], tag = randomUUID().slice(0, 12);
  let started = false, url, a, b, c, post, root, reply, steps = 0;

  async function call(method, endpoint, token, body) {
    const response = await fetch(url + endpoint, {
      method,
      headers: {
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, json: await response.json() };
  }
  function expect(result, status) {
    assert.equal(result.status, status,
      'Expected ' + status + ', got ' + result.status + ': ' + JSON.stringify(result.json));
    assert.equal(result.json.success, status >= 200 && status < 300);
    return result.json;
  }
  async function check(label, fn) {
    await fn();
    console.log('EXT04 PASS [' + String(++steps).padStart(2,'0') + '] ' + label);
  }
  const inbox = (who, query = '') => call('GET', '/api/users/me/notifications' + query, who?.token);
  const unread = who => call('GET','/api/users/me/notifications/unread-count', who?.token);
  const read = (who, id) => call('PATCH','/api/users/me/notifications/' + id + '/read', who?.token);
  const allRead = who => call('PATCH','/api/users/me/notifications/read-all', who?.token);
  const follow = (who, target) => call('POST','/api/users/' + target.id + '/follow', who.token);
  const unfollow = (who, target) => call('DELETE','/api/users/' + target.id + '/follow', who.token);
  const comment = (who, parentId) => call('POST','/api/comments',who.token,{
    post_id: post.id, content: 'EXT04 test comment ' + tag,
    ...(parentId === undefined ? {} : { parent_id: parentId }),
  });
  const like = (who, target_type, target_id) =>
    call('POST','/api/likes',who.token,{ target_type,target_id });
  const by = who => Notification.findAll({ where:{recipient_id:who.id},order:[['id','ASC']] });
  const ownEventTypes = async who => (await by(who)).map(x=>x.event_type);

  try {
    await sequelize.authenticate();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0,'127.0.0.1',resolve);
    });
    started = true;
    url = 'http://127.0.0.1:' + server.address().port;

    await check('Three active isolated student accounts and active free Post', async () => {
      for (const letter of ['a','b','c']) {
        const result = expect(await call('POST','/api/auth/register',undefined,{
          full_name:'EXT04 '+letter,email:'ext04-'+letter+'-'+tag+'@example.test',
          password:'ext04-regression-password-2026',
        }),201);
        const actor = { id:result.data.user.id,token:result.data.accessToken };
        ids.push(actor.id);
        if (letter==='a') a=actor;
        else if (letter==='b') b=actor;
        else c=actor;
      }
      post = await Post.create({ user_id:a.id,title:'EXT04 '+tag,post_type:'question',
        content:'Synthetic public post',status:'active',price:0 });
      assert.equal((await by(a)).length,0);
      assert.equal((await by(b)).length,0);
    });

    await check('Inbox, unread and read routes require auth, validate input and ownership', async () => {
      for (const response of [
        await inbox(null),await unread(null),await read(null,1),await allRead(null),
      ]) expect(response,401);
      for (const q of ['?page=0','?limit=51','?page=abc','?unread_only=yes',
        '?unread_only=1','?page=9007199254740992']) {
        expect(await inbox(a,q),422);
      }
      for (const id of ['0','abc','9007199254740992']) expect(await read(a,id),422);
      expect(await read(a,4294967295),404);
      assert.equal(expect(await unread(a),200).data.count,0);
      assert.deepEqual(expect(await inbox(a),200).data,[]);
    });

    await check('Follow emits one recipient event only when relation created', async () => {
      expect(await follow(b,a),200);
      expect(await follow(b,a),200);
      assert.deepEqual(await ownEventTypes(a),['follow']);
      assert.equal((await by(a))[0].actor_id,b.id);
      expect(await unfollow(b,a),200);
      assert.deepEqual(await ownEventTypes(a),['follow']);
      assert.equal(expect(await unread(a),200).data.count,1);
    });

    await check('Root comment notifies author; own root comment creates no event', async () => {
      root = expect(await comment(b),201).data;
      expect(await comment(a),201);
      assert.deepEqual(await ownEventTypes(a),['follow','comment']);
      const event=(await by(a)).find(x=>x.event_type==='comment');
      assert.equal(event.comment_id,root.id);
      assert.equal(event.post_id,post.id);
      assert.equal(event.actor_id,b.id);
    });

    await check('Reply notifies root comment owner only, self reply suppressed', async () => {
      reply=expect(await comment(c,root.id),201).data;
      expect(await comment(b,root.id),201);
      assert.deepEqual(await ownEventTypes(b),['reply']);
      assert.equal((await by(b))[0].actor_id,c.id);
      assert.equal((await by(b))[0].comment_id,reply.id);
      assert.deepEqual(await ownEventTypes(a),['follow','comment']);
    });

    await check('Like add emits event; unlike does not; self-like suppressed', async () => {
      assert.equal(expect(await like(b,'post',post.id),200).liked,true);
      assert.equal(expect(await like(b,'post',post.id),200).liked,false);
      assert.equal(expect(await like(a,'comment',root.id),200).liked,true);
      assert.equal(expect(await like(a,'post',post.id),200).liked,true);
      assert.equal(expect(await like(b,'comment',reply.id),200).liked,true);
      assert.deepEqual(await ownEventTypes(a),['follow','comment','like_post']);
      assert.deepEqual(await ownEventTypes(b),['reply','like_comment']);
      assert.deepEqual(await ownEventTypes(c),['like_comment']);
    });

    await check('Inbox sorted, safe DTO, unread pagination and isolation', async () => {
      const first=expect(await inbox(a,'?page=1&limit=1'),200);
      const second=expect(await inbox(a,'?page=2&limit=1'),200);
      assert.equal(first.pagination.total,3);
      assert.equal(first.pagination.totalPages,3);
      assert.notEqual(first.data[0].id,second.data[0].id);
      const empty=expect(await inbox(a,'?page=4&limit=1'),200);
      assert.deepEqual(empty.data,[]);
      const mine=expect(await inbox(b,'?unread_only=true'),200);
      assert.equal(mine.pagination.total,2);
      assert.deepEqual(mine.data.map(x=>x.event_type).sort(),['like_comment','reply']);
      const all=expect(await inbox(a),200);
      assert.equal(all.data.length,3);
      assert.equal(expect(await unread(a),200).data.count,3);
      assert.equal(expect(await unread(b),200).data.count,2);
      for (const entry of [...mine.data,...all.data]) {
        assert.deepEqual(Object.keys(entry).sort(),
          ['id','event_type','actor_id','post_id','comment_id','is_read','created_at'].sort());
        assert.ok(!JSON.stringify(entry).includes('content'));
        assert.ok(!JSON.stringify(entry).includes('file_url'));
        assert.ok(!JSON.stringify(entry).includes('token'));
        assert.ok(!JSON.stringify(entry).includes('email'));
      }
    });

    await check('Mark one read, idempotence and read-all scoped to own account', async () => {
      const idsA=(await by(a)).map(x=>Number(x.id));
      expect(await read(b,idsA[0]),404);
      expect(await read(a,idsA[0]),200);
      expect(await read(a,idsA[0]),200);
      assert.equal(expect(await unread(a),200).data.count,2);
      assert.equal(expect(await inbox(a,'?unread_only=true'),200).pagination.total,2);
      assert.equal(expect(await allRead(a),200).data.updated,2);
      assert.equal(expect(await allRead(a),200).data.updated,0);
      assert.equal(expect(await unread(a),200).data.count,0);
      assert.equal(expect(await unread(b),200).data.count,2);
    });

    await check('Fail-closed hidden content and deactivated actor in inbox/count', async () => {
      await Post.update({status:'hidden'},{where:{id:post.id}});
      const hidden=expect(await inbox(b),200);
      assert.equal(hidden.pagination.total,0);
      assert.equal(expect(await unread(b),200).data.count,0);
      const follows=expect(await inbox(a),200);
      assert.deepEqual(follows.data.map(x=>x.event_type),['follow']);
      await User.update({is_active:false},{where:{id:b.id}});
      assert.deepEqual(expect(await inbox(a),200).data,[]);
      assert.equal(expect(await unread(a),200).data.count,0);
      expect(await call('POST','/api/comments',a.token,{
        post_id:post.id,content:'should be denied',
      }),404);
      await Post.update({status:'active'},{where:{id:post.id}});
      await User.update({is_active:true},{where:{id:b.id}});
    });

    await check('Notification insertion failure rolls back successful Comment creation', async () => {
      const prior=await Comment.count({where:{post_id:post.id}});
      const original=Notification.create;
      try {
        Notification.create=async()=>{throw new Error('EXT04 injected notification insert failure');};
        expect(await comment(b),500);
      } finally {
        Notification.create=original;
      }
      assert.equal(await Comment.count({where:{post_id:post.id}}),prior);
      const success=expect(await comment(b),201);
      assert.ok(success.data.id);
      assert.deepEqual((await by(a)).map(x=>x.event_type).slice(-1),['comment']);
    });

    console.log('EXT-04 RESULT: '+steps+'/10 MySQL8 HTTP groups PASS');
  } finally {
    if(ids.length) await User.destroy({where:{id:ids}}).catch(()=>{});
    if(started) await new Promise((resolve,reject)=>
      server.close(error=>error?reject(error):resolve()));
    await sequelize.close();
  }
});
