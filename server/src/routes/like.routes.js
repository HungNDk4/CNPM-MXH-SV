const router = require('express').Router();
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { Like, Post, Comment, sequelize } = require('../models');
const { createInteractionNotification } = require('../services/notification.service');
const { readableLikeTarget } = require('../utils/interaction-target');

// POST /api/likes — toggle only existing active/free visible targets.
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { target_type, target_id } = req.body;
    const targetId = await readableLikeTarget(target_type, target_id, req.user);
    const target = target_type === 'post' ?
      await Post.findByPk(targetId, { attributes: ['id','user_id'] }) :
      await Comment.findByPk(targetId, { attributes: ['id','user_id','post_id'] });
    const result = await sequelize.transaction(async transaction => {
      const existing = await Like.findOne({
        where: { user_id: req.user.id, target_type, target_id: targetId }, transaction,
      });
      if (existing) {
        await existing.destroy({ transaction });
        return false;
      }
      await Like.create({ user_id: req.user.id, target_type, target_id: targetId }, { transaction });
      await createInteractionNotification({
        recipientId: target.user_id, actorId: req.user.id,
        eventType: target_type === 'post' ? 'like_post' : 'like_comment',
        postId: target_type === 'post' ? targetId : target.post_id,
        commentId: target_type === 'comment' ? targetId : null, transaction,
      });
      return true;
    });
    res.json({ success: true, liked: result, message: result ? 'Đã thích.' : 'Đã bỏ thích.' });
  } catch (error) { next(error); }
});

// GET /api/likes/count — counts cannot reveal suppressed posts/comments.
router.get('/count', optionalAuthenticate, async (req, res, next) => {
  try {
    const { target_type, target_id } = req.query;
    const targetId = await readableLikeTarget(target_type, target_id, req.user);
    const count = await Like.count({ where: { target_type, target_id: targetId } });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
});

module.exports = router;
