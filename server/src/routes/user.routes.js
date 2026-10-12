const router = require('express').Router();
const { authenticate } = require('../middlewares/auth.middleware');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const { createError } = require('../middlewares/error.middleware');

// GET /api/users/:id - Public profile
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: ['id', 'full_name', 'avatar_url', 'bio', 'university', 'major', 'created_at'],
    });
    if (!user) throw createError('Người dùng không tồn tại.', 404);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

// PUT /api/users/profile - Update own profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { full_name, bio, university, major, avatar_url } = req.body;
    await req.user.update({ full_name, bio, university, major, avatar_url });
    res.json({ success: true, message: 'Cập nhật profile thành công.', data: req.user });
  } catch (error) { next(error); }
});

// PUT /api/users/change-password
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) throw createError('Mật khẩu hiện tại không đúng.', 400);
    const salt = await bcrypt.genSalt(12);
    await user.update({ password_hash: await bcrypt.hash(new_password, salt) });
    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) { next(error); }
});

module.exports = router;
