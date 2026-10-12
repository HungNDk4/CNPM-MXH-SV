const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { User, RefreshToken } = require('../models');
const { createError } = require('../middlewares/error.middleware');

// ── Helpers ──────────────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
  });

  return { accessToken, refreshToken };
};

// ── Controllers ──────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { full_name, email, password, university, major } = req.body;

    // Kiểm tra email tồn tại
    const exists = await User.findOne({ where: { email } });
    if (exists) throw createError('Email đã được sử dụng.', 409);

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({ full_name, email, password_hash, university, major });

    const { accessToken, refreshToken } = generateTokens(user);

    // Lưu refresh token vào DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at: expiresAt });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      data: {
        user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) throw createError('Email hoặc mật khẩu không đúng.', 401);
    if (!user.is_active) throw createError('Tài khoản đã bị khóa.', 403);

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) throw createError('Email hoặc mật khẩu không đúng.', 401);

    const { accessToken, refreshToken } = generateTokens(user);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({ user_id: user.id, token: refreshToken, expires_at: expiresAt });

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: {
        user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role, avatar_url: user.avatar_url },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
const refreshAccessToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw createError('Thiếu refresh token.', 400);

    const stored = await RefreshToken.findOne({ where: { token: refreshToken, revoked: false } });
    if (!stored || new Date() > stored.expires_at) {
      throw createError('Refresh token không hợp lệ hoặc đã hết hạn.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw createError('Refresh token không hợp lệ.', 401);
    }

    const user = await User.findByPk(decoded.id);
    if (!user) throw createError('Người dùng không tồn tại.', 401);

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Rotate refresh token
    await stored.update({ revoked: true });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({ user_id: user.id, token: newRefreshToken, expires_at: expiresAt });

    res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.update({ revoked: true }, { where: { token: refreshToken } });
    }
    res.json({ success: true, message: 'Đăng xuất thành công.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user });
};

module.exports = { register, login, refreshAccessToken, logout, getMe };
