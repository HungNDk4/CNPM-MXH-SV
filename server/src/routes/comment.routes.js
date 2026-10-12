const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { Comment } = require('../models');
const { createError } = require('../middlewares/error.middleware');

// GET /api/comments?post_id=1
router.get('/', async (req, res, next) => {
  try {
    const { post_id } = req.query;
    if (!post_id) throw createError('Cần truyền post_id.', 400);
    const comments = await Comment.findAll({
      where: { post_id, status: 'active', parent_id: null },
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

// POST /api/comments
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { post_id, content, parent_id } = req.body;
    const comment = await Comment.create({ post_id, user_id: req.user.id, content, parent_id: parent_id || null });
    res.status(201).json({ success: true, data: comment });
  } catch (error) { next(error); }
});

// DELETE /api/comments/:id
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) throw createError('Comment không tồn tại.', 404);
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') throw createError('Không có quyền.', 403);
    await comment.update({ status: 'deleted' });
    res.json({ success: true, message: 'Xóa comment thành công.' });
  } catch (error) { next(error); }
});

module.exports = router;
