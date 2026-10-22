'use strict';

// BE-04 real MySQL 8 HTTP regression. Called by the existing SEC-01 test with
// its disposable user fixtures so no CI workflow or shared front-end files change.
const assert = require('node:assert/strict');
const { Post, Comment, Like } = require('../../server/src/models');

module.exports = async function runBE04({ request, step, tokenA, tokenB, idA, idB, uid, free, hidden, deleted, paid }) {
  const http = (path, method = 'GET', token, body) =>
    request(path, { method, token, body });
  const expect = async (code, path, method = 'GET', token, body) => {
    const res = await http(path, method, token, body);
    assert.equal(res.status, code, method + ' ' + path + ' expected ' + code +
      ' but got ' + res.status + ': ' + (res.data?.message || '(no public error)'));
    return res;
  };
  const post = await Post.create({
    user_id: idA, title: 'BE04 question ' + uid, post_type: 'question',
    content: 'security scope fixture', price: 0, status: 'active',
  });
  const other = await Post.create({
    user_id: idA, title: 'BE04 second question ' + uid, post_type: 'question',
    content: 'second fixture', price: 0, status: 'active',
  });
  const hiddenQuestion = await Post.create({
    user_id: idA, title: 'BE04 hidden question ' + uid, post_type: 'discussion',
    content: 'must not be read', price: 0, status: 'hidden',
  });

  await step('BE04 active question detail requires auth; free document metadata remains public', async () => {
    await expect(401, '/api/posts/' + post.id);
    await expect(200, '/api/posts/' + post.id, 'GET', tokenB);
    await expect(200, '/api/posts/' + free.id);
    await expect(404, '/api/posts/' + hiddenQuestion.id, 'GET', tokenA);
    await expect(404, '/api/posts/' + hiddenQuestion.id, 'GET', tokenB);
  });

  await step('BE04 active/free document comments and likes can be read; member question requires auth', async () => {
    const root = await expect(201, '/api/comments', 'POST', tokenA, {
      post_id: free.id, content: 'Free document discussion',
    });
    assert.ok(root.data?.data?.id);
    const listing = await expect(200, '/api/comments?post_id=' + free.id);
    assert.ok(listing.data?.data?.some(c => c.id === root.data.data.id));
    await expect(200, '/api/likes/count?target_type=post&target_id=' + free.id);
    await expect(401, '/api/comments?post_id=' + post.id);
    await expect(401, '/api/likes/count?target_type=post&target_id=' + post.id);
    await expect(401, '/api/likes/count?target_type=comment&target_id=' + root.data.data.id, 'GET', 'invalid.jwt.token');
  });

  await step('BE04 root + one-level reply accepted and listed, cross-account delete denied', async () => {
    const r = await expect(201, '/api/comments', 'POST', tokenA, {
      post_id: post.id, content: '  root text  ',
    });
    const root = r.data.data;
    assert.equal(root.content, 'root text');
    const child = await expect(201, '/api/comments', 'POST', tokenB, {
      post_id: post.id, parent_id: root.id, content: 'reply by B',
    });
    const replyId = child.data.data.id;
    const feed = await expect(200, '/api/comments?post_id=' + post.id, 'GET', tokenA);
    const rendered = feed.data.data.find(c => c.id === root.id);
    assert.ok(rendered?.replies?.some(c => c.id === replyId));
    await expect(403, '/api/comments/' + root.id, 'DELETE', tokenB);
    assert.equal((await Comment.findByPk(root.id)).status, 'active');

    // Prevent orphan, cross-post, deleted parent and a second nesting level.
    await expect(422, '/api/comments', 'POST', tokenB, {
      post_id: other.id, parent_id: root.id, content: 'cross post',
    });
    await expect(422, '/api/comments', 'POST', tokenA, {
      post_id: post.id, parent_id: replyId, content: 'too deeply nested',
    });
    await expect(422, '/api/comments', 'POST', tokenA, {
      post_id: post.id, parent_id: 999999999, content: 'missing parent',
    });
    await expect(422, '/api/comments', 'POST', tokenA, {
      post_id: post.id, parent_id: 0, content: 'zero parent',
    });
    assert.equal(await Comment.count({ where: { post_id: other.id } }), 0);
    assert.equal(await Comment.count({ where: { post_id: post.id } }), 2);

    await expect(200, '/api/comments/' + root.id, 'DELETE', tokenA);
    await expect(404, '/api/likes/count?target_type=comment&target_id=' + root.id, 'GET', tokenA);
    await expect(404, '/api/likes/count?target_type=comment&target_id=' + replyId, 'GET', tokenA);
    await expect(422, '/api/comments', 'POST', tokenB, {
      post_id: post.id, parent_id: root.id, content: 'deleted parent',
    });
    const after = await expect(200, '/api/comments?post_id=' + post.id, 'GET', tokenB);
    assert.ok(!after.data.data.some(c => c.id === root.id));
  });

  await step('BE04 reject malformed ids/content/target types before DB writes', async () => {
    const total = await Comment.count({ where: { post_id: post.id } });
    for (const invalid of ['', 'abc', '-1', '1.5', '999999999999999999999999']) {
      await expect(422, '/api/comments?post_id=' + encodeURIComponent(invalid), 'GET', tokenA);
    }
    await expect(400, '/api/comments', 'GET', tokenA);
    await expect(422, '/api/comments', 'POST', tokenA, { post_id: 0, content: 'valid' });
    await expect(422, '/api/comments', 'POST', tokenA, { post_id: post.id, content: '   ' });
    await expect(422, '/api/comments', 'POST', tokenA, { post_id: post.id, content: 'x'.repeat(2001) });
    await expect(422, '/api/comments', 'POST', tokenA, { post_id: post.id, content: { injected: 'x' } });
    await expect(404, '/api/comments', 'POST', tokenA, { post_id: 999999999, content: 'valid' });
    await expect(422, '/api/likes', 'POST', tokenA, { target_type: 'invalid', target_id: post.id });
    await expect(422, '/api/likes', 'POST', tokenA, { target_type: 'post', target_id: 'NaN' });
    await expect(422, '/api/likes/count?target_type=comment&target_id=0', 'GET', tokenA);
    await expect(404, '/api/likes', 'POST', tokenA, { target_type: 'post', target_id: 999999999 });
    assert.equal(await Comment.count({ where: { post_id: post.id } }), total);
  });

  await step('BE04 normal like/unlike and count on active question and comment', async () => {
    const comment = await expect(201, '/api/comments', 'POST', tokenB, {
      post_id: other.id, content: 'regular comment',
    });
    const commentId = comment.data.data.id;
    const countUrl = '/api/likes/count?target_type=post&target_id=' + other.id;
    const commentUrl = '/api/likes/count?target_type=comment&target_id=' + commentId;
    let count = await expect(200, countUrl, 'GET', tokenA);
    assert.equal(count.data.data.count, 0);
    let result = await expect(200, '/api/likes', 'POST', tokenA, {
      target_type: 'post', target_id: other.id,
    });
    assert.equal(result.data.liked, true);
    count = await expect(200, countUrl, 'GET', tokenB);
    assert.equal(count.data.data.count, 1);
    result = await expect(200, '/api/likes', 'POST', tokenA, {
      target_type: 'post', target_id: other.id,
    });
    assert.equal(result.data.liked, false);
    assert.equal((await expect(200, countUrl, 'GET', tokenA)).data.data.count, 0);
    assert.equal((await expect(200, '/api/likes', 'POST', tokenA,
      { target_type: 'comment', target_id: commentId })).data.liked, true);
    assert.equal((await expect(200, commentUrl, 'GET', tokenB)).data.data.count, 1);
    await expect(200, '/api/comments/' + commentId, 'DELETE', tokenB);
    await expect(404, commentUrl, 'GET', tokenA);
    await expect(404, '/api/likes', 'POST', tokenA, {
      target_type: 'comment', target_id: commentId,
    });
  });

  await step('BE04 hidden/deleted/paid post denies comments/likes/detail for guest and students', async () => {
    for (const suppressed of [hidden, deleted, paid, hiddenQuestion]) {
      for (const token of [undefined, tokenA, tokenB]) {
        await expect(404, '/api/comments?post_id=' + suppressed.id, 'GET', token);
        await expect(404, '/api/likes/count?target_type=post&target_id=' + suppressed.id, 'GET', token);
        await expect(404, '/api/posts/' + suppressed.id, 'GET', token);
      }
      await expect(404, '/api/comments', 'POST', tokenA, {
        post_id: suppressed.id, content: 'should not write',
      });
      await expect(404, '/api/likes', 'POST', tokenA, {
        target_type: 'post', target_id: suppressed.id,
      });
    }
  });

  await step('BE04 moderation hide revokes secondary reads/writes and owner cannot unhide', async () => {
    const active = await expect(201, '/api/comments', 'POST', tokenA, {
      post_id: other.id, content: 'visible before moderation',
    });
    const commentId = active.data.data.id;
    await expect(200, '/api/likes', 'POST', tokenB, { target_type: 'post', target_id: other.id });
    await expect(200, '/api/likes', 'POST', tokenB, { target_type: 'comment', target_id: commentId });
    await other.update({ status: 'hidden' }); // simulates authorized moderation
    for (const token of [undefined, tokenA, tokenB]) {
      await expect(404, '/api/posts/' + other.id, 'GET', token);
      await expect(404, '/api/comments?post_id=' + other.id, 'GET', token);
      await expect(404, '/api/likes/count?target_type=post&target_id=' + other.id, 'GET', token);
      await expect(404, '/api/likes/count?target_type=comment&target_id=' + commentId, 'GET', token);
    }
    await expect(404, '/api/likes', 'POST', tokenA,
      { target_type: 'comment', target_id: commentId });
    await expect(404, '/api/comments', 'POST', tokenA,
      { post_id: other.id, content: 'after moderation' });
    await expect(404, '/api/comments/' + commentId, 'DELETE', tokenB);
    await expect(403, '/api/posts/' + other.id, 'PUT', tokenA, { status: 'active' });
    await expect(403, '/api/posts/' + other.id, 'PUT', tokenA, { title: 'edit to bypass moderation' });
    assert.equal((await Post.findByPk(other.id)).status, 'hidden');
    assert.equal(await Like.count({ where: { target_type: 'post', target_id: other.id } }), 1,
      'Hidden likes may be retained internally but must not be exposed');
  });

  // Cleanup: all rows are scoped to existing SEC-01 test users (ON DELETE CASCADE).
  // The parent test always removes those users, including on assertion failures.
  console.log('BE04 regression assertions completed using SEC-01 disposable fixtures', idB);
};
