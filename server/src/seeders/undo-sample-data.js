'use strict';
require('dotenv').config();
const { assertDisposableEnvironment, assertDatabaseIdentity } = require('./fe66-disposable-guard');
const dbName = assertDisposableEnvironment();
const { Op } = require('sequelize');
const { sequelize, User, Post, Comment, Like, Follow, Bookmark, Notification, Order, DocumentAccess, DocumentFile, RefreshToken, ModerationAuditLog } = require('../models');
const MARKER = '[FE66_DISPOSABLE_FIXTURE_V1]';
const SAMPLE_EMAILS = Array.from({ length: 10 }, (_, i) => 'fe66-student-' + i + '@example.invalid');
const EXPECTED = { users: 10, posts: 18, comments: 1, likes: 2, follows: 1, bookmarks: 1, notifications: 1 };
async function inspect(transaction) {
  for (const model of [Order, DocumentAccess, DocumentFile, RefreshToken, ModerationAuditLog]) {
    if (await model.count({ transaction })) throw new Error('REFUSED: unrelated data exists in ' + model.tableName);
  }
  const [users, posts, comments, likes, follows, bookmarks, notifications] = await Promise.all([
    User.findAll({ transaction }), Post.findAll({ transaction }), Comment.findAll({ transaction }),
    Like.findAll({ transaction }), Follow.findAll({ transaction }), Bookmark.findAll({ transaction }),
    Notification.findAll({ transaction }),
  ]);
  const actual = { users: users.length, posts: posts.length, comments: comments.length, likes: likes.length, follows: follows.length, bookmarks: bookmarks.length, notifications: notifications.length };
  if (Object.values(actual).every(v => v === 0)) return { actual, empty: true };
  for (const [name, expected] of Object.entries(EXPECTED)) {
    if (actual[name] !== expected) throw new Error('REFUSED: fixture cardinality mismatch for ' + name);
  }
  const ids = new Set(users.map(u => u.id));
  const postIds = new Set(posts.map(p => p.id));
  const commentIds = new Set(comments.map(c => c.id));
  if (users.some(u => !SAMPLE_EMAILS.includes(u.email) || u.bio !== MARKER || u.role !== 'student') ||
      posts.some(p => !ids.has(p.user_id) || !p.content?.startsWith(MARKER + '\n')) ||
      comments.some(c => !ids.has(c.user_id) || !postIds.has(c.post_id) || !c.content.startsWith(MARKER)) ||
      likes.some(l => !ids.has(l.user_id) || !(l.target_type === 'post' ? postIds.has(l.target_id) : commentIds.has(l.target_id))) ||
      follows.some(f => !ids.has(f.follower_id) || !ids.has(f.following_id)) ||
      bookmarks.some(b => !ids.has(b.user_id) || !postIds.has(b.post_id)) ||
      notifications.some(n => !ids.has(n.actor_id) || !ids.has(n.recipient_id) ||
        (n.post_id != null && !postIds.has(n.post_id)) || (n.comment_id != null && !commentIds.has(n.comment_id)))) {
    throw new Error('REFUSED: foreign or modified ownership detected.');
  }
  return { actual, empty: false, users, posts, comments };
}
async function undo() {
  await assertDatabaseIdentity(sequelize, dbName);
  const apply = process.argv.includes('--apply');
  if (apply && process.env.FE66_ROLLBACK_CONFIRM !== dbName) {
    throw new Error('REFUSED: --apply requires FE66_ROLLBACK_CONFIRM equal to exact disposable DB_NAME.');
  }
  await sequelize.transaction(async transaction => {
    const data = await inspect(transaction);
    console.log(JSON.stringify({ database: dbName, mode: apply ? 'APPLY' : 'DRY_RUN', ...data.actual }));
    if (!apply || data.empty) return;
    const userIds = data.users.map(u => u.id);
    const postIds = data.posts.map(p => p.id);
    const commentIds = data.comments.map(c => c.id);
    await Notification.destroy({ where: { recipient_id: { [Op.in]: userIds } }, transaction });
    if (process.env.FE66_TEST_FAIL_STAGE === 'rollback-after-notifications') {
      throw new Error('FE66 injected rollback failure after first deletion');
    }
    await Like.destroy({ where: { user_id: { [Op.in]: userIds } }, transaction });
    await Bookmark.destroy({ where: { user_id: { [Op.in]: userIds } }, transaction });
    await Follow.destroy({ where: { follower_id: { [Op.in]: userIds } }, transaction });
    await Comment.destroy({ where: { id: { [Op.in]: commentIds } }, transaction });
    await Post.destroy({ where: { id: { [Op.in]: postIds } }, transaction });
    await User.destroy({ where: { id: { [Op.in]: userIds } }, transaction });
    console.log('FE66 rollback committed on disposable DB only.');
  });
}
undo().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(() => sequelize.close());
