const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Middleware xác thực JWT Access Token.
 * Đính kèm req.user nếu token hợp lệ.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không có token xác thực. Vui lòng đăng nhập.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token đã hết hạn. Vui lòng làm mới token.',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ.',
        code: 'TOKEN_INVALID',
      });
    }

    // Lấy thông tin user từ DB (kiểm tra user vẫn tồn tại và active)
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'full_name', 'role', 'is_active', 'avatar_url'],
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại hoặc đã bị khóa.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware phân quyền theo role.
 * Dùng sau authenticate().
 * @param {...string} roles - Các role được phép truy cập (e.g. 'admin', 'student')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện thao tác này.',
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
