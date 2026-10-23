const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const { User, RefreshToken, sequelize } = require('../models');
const { createError } = require('../middlewares/error.middleware');

// ── Helpers ──────────────────────────────────────────────────────
const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
  // Every newly issued refresh token must be unique, even within the same second.
  // Otherwise two login/registration sessions for one user can violate token UNIQUE in MySQL.
  const refreshToken = jwt.sign({ ...payload, jti: randomUUID() }, process.env.JWT_REFRESH_SECRET, {
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
    const refreshToken = req.body?.refreshToken;
    if (refreshToken === undefined || refreshToken === null || refreshToken === '') {
      throw createError('Thiếu refresh token.', 400);
    }
    // Never pass arrays/objects/oversized strings to Sequelize or jwt.verify.
    if (typeof refreshToken !== 'string' || refreshToken.length > 512) {
      throw createError('Refresh token không hợp lệ.', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      throw createError('Refresh token không hợp lệ.', 401);
    }
    if (!decoded || typeof decoded !== 'object' ||
        !Number.isSafeInteger(decoded.id) || decoded.id <= 0 ||
        typeof decoded.jti !== 'string' || !decoded.jti) {
      throw createError('Refresh token không hợp lệ.', 401);
    }

    let issued;
    // Take the account lock before checking token status. This serializes
    // concurrent refresh requests and password-change revocation for the
    // same user. Commit revocation and new token together or roll back both.
    await sequelize.transaction(async transaction => {
      const user = await User.findByPk(decoded.id, {
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!user || !user.is_active) {
        throw createError('Tài khoản không tồn tại hoặc đã bị khóa.', 401);
      }
      const stored = await RefreshToken.findOne({
        where: { token: refreshToken },
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!stored || stored.revoked || stored.user_id !== user.id ||
          !Number.isFinite(new Date(stored.expires_at).getTime()) ||
          new Date(stored.expires_at).getTime() <= Date.now()) {
        throw createError('Refresh token không hợp lệ hoặc đã hết hạn.', 401);
      }

      const [updated] = await RefreshToken.update({ revoked: true }, {
        where: { id: stored.id, user_id: user.id, revoked: false },
        transaction,
      });
      if (updated !== 1) {
        throw createError('Refresh token đã được sử dụng.', 401);
      }

      const tokens = generateTokens(user);
      // Retain the existing DB cap of seven days, and never outlive JWT exp.
      const payload = jwt.decode(tokens.refreshToken);
      const jwtExpiry = payload.exp * 1000;
      const expiresAt = new Date(Math.min(jwtExpiry, Date.now() + 7 * 24 * 60 * 60 * 1000));
      await RefreshToken.create({
        user_id: user.id, token: tokens.refreshToken, expires_at: expiresAt,
      }, { transaction });
      issued = tokens;
    });

    res.json({ success: true, data: issued });
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
