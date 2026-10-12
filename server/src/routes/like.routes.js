const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { Like } = require('../models');
const { createError } = require('../middlewares/error.middleware');

// POST /api/likes - Toggle like
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { target_type, target_id } = req.body;
    if (!['post', 'comment'].includes(target_type)) throw createError('target_type không hợp lệ.', 400);

    const existing = await Like.findOne({
      where: { user_id: req.user.id, target_type, target_id },
    });

    if (existing) {
      await existing.destroy();
      return res.json({ success: true, liked: false, message: 'Đã bỏ thích.' });
    }

    await Like.create({ user_id: req.user.id, target_type, target_id });
    res.json({ success: true, liked: true, message: 'Đã thích.' });
  } catch (error) { next(error); }
});

// GET /api/likes/count?target_type=post&target_id=1
router.get('/count', async (req, res, next) => {
  try {
    const { target_type, target_id } = req.query;
    const count = await Like.count({ where: { target_type, target_id } });
    res.json({ success: true, data: { count } });
  } catch (error) { next(error); }
});

module.exports = router;
