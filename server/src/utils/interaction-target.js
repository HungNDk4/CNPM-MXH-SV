'use strict';

// BE-04 — shared content visibility checks for Comments/Likes. Do not expose
// hidden/deleted/paid content via secondary IDs when the Post DTO rejects it.
const { Post, Comment } = require('../models');
const { createError } = require('../middlewares/error.middleware');

function positiveId(value) {
  if ((typeof value !== 'number' && typeof value !== 'string') ||
      !/^[1-9]\d*$/.test(String(value))) {
    throw createError('ID không hợp lệ.', 422);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw createError('ID không hợp lệ.', 422);
  return id;
}

async function readablePost(id, viewer) {
  const post = await Post.findByPk(positiveId(id));
  // Only active/free posts are interactable; admins must use a separately
  // reviewed moderation endpoint to inspect suppressed content.
  if (!post || post.status !== 'active' || Number(post.price) !== 0) {
    throw createError('Bài viết không tồn tại.', 404);
  }
  // Current API contract keeps question/discussion member-only. A free active
  // document's safe metadata may be public, without private PDF bytes.
  if (post.post_type !== 'document' && !viewer) {
    throw createError('Yêu cầu đăng nhập để xem bài viết.', 401);
  }
  return post;
}

async function readableLikeTarget(type, id, viewer) {
  if (type !== 'post' && type !== 'comment') {
    throw createError('target_type không hợp lệ.', 422);
  }
  const targetId = positiveId(id);
  if (type === 'post') {
    await readablePost(targetId, viewer);
    return targetId;
  }
  const comment = await Comment.findByPk(targetId);
  if (!comment || comment.status !== 'active') {
    throw createError('Bình luận không tồn tại.', 404);
  }
  await readablePost(comment.post_id, viewer);
  if (comment.parent_id !== null) {
    const parent = await Comment.findByPk(comment.parent_id);
    if (!parent || parent.status !== 'active' || parent.post_id !== comment.post_id ||
        parent.parent_id !== null) {
      throw createError('Bình luận không tồn tại.', 404);
    }
  }
  return targetId;
}

module.exports = { positiveId, readablePost, readableLikeTarget };
