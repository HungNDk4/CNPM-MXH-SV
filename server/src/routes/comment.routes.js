const router = require('express').Router();
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { Comment } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { positiveId, readablePost } = require('../utils/interaction-target');

const MAX_COMMENT_LENGTH = 2000;

// GET /api/comments?post_id=1 — never enumerate suppressed posts through comments.
router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    if (req.query.post_id === undefined) throw createError('Cần truyền post_id.', 400);
    const postId = positiveId(req.query.post_id);
    await readablePost(postId, req.user);
    const comments = await Comment.findAll({
      where: { post_id: postId, status: 'active', parent_id: null },
      include: [
        { association: 'author', attributes: ['id', 'full_name', 'avatar_url'] },
        { association: 'replies', where: { status: 'active' }, required: false,
          include: [{ association: 'author', attributes: ['id', 'full_name', 'avatar_url'] }] },
      ],
      order: [['created_at', 'ASC']],
    });
    res.json({ success: true, data: comments });
  } catch (error) { next(error); }
});

// POST /api/comments — parent must belong to same active/free post and be root.
router.post('/', authenticate, async (req, res, next) => {
  try {
    const postId = positiveId(req.body.post_id);
    await readablePost(postId, req.user);
    if (typeof req.body.content !== 'string' || !req.body.content.trim() ||
        req.body.content.trim().length > MAX_COMMENT_LENGTH) {
      throw createError('Nội dung bình luận phải có từ 1 đến 2000 ký tự.', 422);
    }
    let parentId = null;
    if (req.body.parent_id !== undefined && req.body.parent_id !== null) {
      parentId = positiveId(req.body.parent_id);
      const parent = await Comment.findByPk(parentId);
      if (!parent || parent.status !== 'active' || parent.post_id !== postId ||
          parent.parent_id !== null) {
        throw createError('Bình luận cha không hợp lệ hoặc không thuộc bài viết.', 422);
      }
    }
    const comment = await Comment.create({
      post_id: postId, user_id: req.user.id,
      content: req.body.content.trim(), parent_id: parentId,
    });
    res.status(201).json({ success: true, data: comment });
  } catch (error) { next(error); }
});

// DELETE /api/comments/:id — require active visible parent post and ownership.
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(positiveId(req.params.id));
    if (!comment || comment.status !== 'active') throw createError('Comment không tồn tại.', 404);
    await readablePost(comment.post_id, req.user);
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      throw createError('Không có quyền.', 403);
    }
    await comment.update({ status: 'deleted' });
    res.json({ success: true, message: 'Xóa comment thành công.' });
  } catch (error) { next(error); }
});

module.exports = router;
