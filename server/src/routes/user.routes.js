'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User, RefreshToken, sequelize } = require('../models');
const { authenticate } = require('../middlewares/auth.middleware');
const { createError } = require('../middlewares/error.middleware');

// Keep the public profile and profile-update response on the same safe DTO.
const PUBLIC_FIELDS = ['id', 'full_name', 'avatar_url', 'bio', 'university', 'major', 'created_at'];
const EDITABLE = {
  full_name: 100,
  bio: 1000,
  university: 200,
  major: 200,
  avatar_url: 500,
};

const profileId = value => {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) ||
      !Number.isSafeInteger(Number(value))) {
    throw createError('ID hồ sơ không hợp lệ.', 422);
  }
  return Number(value);
};

const nonEmptyObject = value =>
  value && typeof value === 'object' && !Array.isArray(value);

function validatedProfileUpdate(payload) {
  if (!nonEmptyObject(payload) || !Object.keys(payload).length ||
      Object.keys(payload).some(name => !Object.hasOwn(EDITABLE, name))) {
    throw createError('Trường cập nhật hồ sơ không hợp lệ.', 422);
  }
  const updates = {};
  for (const [key, max] of Object.entries(EDITABLE)) {
    if (!Object.hasOwn(payload, key)) continue;
    const value = payload[key];
    // Null is a supported clear operation for all nullable fields.
    if (value === null && key !== 'full_name') {
      updates[key] = null;
      continue;
    }
    if (typeof value !== 'string') {
      throw createError('Giá trị hồ sơ không hợp lệ: ' + key, 422);
    }
    const normalized = value.trim();
    if (key === 'full_name' && !normalized) {
      throw createError('Họ tên không được để trống.', 422);
    }
    if (normalized.length > max) {
      throw createError('Nội dung hồ sơ vượt giới hạn: ' + key, 422);
    }
    if (key === 'avatar_url' && normalized) {
      try {
        const url = new URL(normalized);
        if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) {
          throw new Error('Invalid HTTPS URL');
        }
      } catch {
        throw createError('Ảnh đại diện phải là URL HTTPS hợp lệ.', 422);
      }
    }
    updates[key] = key === 'full_name' ? normalized : normalized || null;
  }
  return updates;
}

async function publicProfile(id) {
  return User.findOne({
    where: { id, is_active: true },
    attributes: PUBLIC_FIELDS,
  });
}

// GET /api/users/:id — active public projection only; never expose account data.
router.get('/:id', async (req, res, next) => {
  try {
    const user = await publicProfile(profileId(req.params.id));
    if (!user) throw createError('Người dùng không tồn tại.', 404);
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
});

// PUT /api/users/profile — partial self-update; response is PublicProfile,
// not the sparse auth middleware's User instance.
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const changes = validatedProfileUpdate(req.body);
    await User.update(changes, { where: { id: req.user.id, is_active: true } });
    const profile = await publicProfile(req.user.id);
    if (!profile) throw createError('Người dùng không tồn tại.', 404);
    res.json({ success: true, message: 'Cập nhật profile thành công.', data: profile });
  } catch (error) { next(error); }
});

// PUT /api/users/change-password — revoke all refresh sessions atomically
// with the password hash. Existing stateless access JWTs expire normally.
router.put('/change-password', authenticate, async (req, res, next) => {
  try {
    const payload = req.body;
    if (!nonEmptyObject(payload) ||
        Object.keys(payload).some(key => !['current_password', 'new_password'].includes(key)) ||
        typeof payload.current_password !== 'string' ||
        typeof payload.new_password !== 'string' ||
        !payload.current_password || payload.new_password.length < 6 ||
        Buffer.byteLength(payload.new_password, 'utf8') > 72) {
      throw createError('Mật khẩu phải hợp lệ và dài từ 6 đến 72 byte UTF-8.', 422);
    }
    const user = await User.findByPk(req.user.id);
    if (!user || !user.is_active) throw createError('Tài khoản không tồn tại.', 401);
    const matches = await bcrypt.compare(payload.current_password, user.password_hash);
    if (!matches) throw createError('Mật khẩu hiện tại không đúng.', 400);
    if (await bcrypt.compare(payload.new_password, user.password_hash)) {
      throw createError('Mật khẩu mới phải khác mật khẩu hiện tại.', 422);
    }

    const password_hash = await bcrypt.hash(payload.new_password, 12);
    await sequelize.transaction(async transaction => {
      await User.update({ password_hash }, { where: { id: user.id }, transaction });
      await RefreshToken.update(
        { revoked: true },
        { where: { user_id: user.id, revoked: false }, transaction }
      );
    });
    res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) { next(error); }
});

module.exports = router;
