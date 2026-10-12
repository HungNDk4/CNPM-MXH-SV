/**
 * Global Error Handler Middleware
 * Phải là middleware cuối cùng trong app.js
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Sequelize Validation Error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(422).json({ success: false, message: 'Dữ liệu không hợp lệ.', errors: messages });
  }

  // Sequelize Unique Constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'Dữ liệu đã tồn tại.', field: err.errors[0]?.path });
  }

  // Default 500
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi hệ thống, vui lòng thử lại.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Helper để tạo lỗi có statusCode
 */
const createError = (message, statusCode = 500) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };
