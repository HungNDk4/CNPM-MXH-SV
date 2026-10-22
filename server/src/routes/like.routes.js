const router = require('express').Router();
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');
const { Like } = require('../models');
const { readableLikeTarget } = require('../utils/interaction-target');

// POST /api/likes — toggle only existing active/free visible targets.
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { target_type, target_id } = req.body;
    const targetId = await readableLikeTarget(target_type, target_id, req.user);
    const existing = await Like.findOne({
      where: { user_id: req.user.id, target_type, target_id: targetId },
    });
    if (existing) {
      await existing.destroy();
      return res.json({ success: true, liked: false, message: 'Đã bỏ thích.' });
    }
    await Like.create({ user_id: req.user.id, target_type, target_id: targetId });
    res.json({ success: true, liked: true, message: 'Đã thích.' });
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
