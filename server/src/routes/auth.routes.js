const router = require('express').Router();
const { register, login, refreshAccessToken, logout, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { body }  = require('express-validator');
const { validateRequest } = require('../middlewares/validate.middleware');

// Validation rules
const registerRules = [
  body('full_name').trim().notEmpty().withMessage('Họ tên không được để trống.'),
  body('email').isEmail().withMessage('Email không hợp lệ.').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự.'),
];
const loginRules = [
  body('email').isEmail().withMessage('Email không hợp lệ.').normalizeEmail(),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống.'),
];

router.post('/register', registerRules, validateRequest, register);
router.post('/login',    loginRules,    validateRequest, login);
router.post('/refresh',  refreshAccessToken);
router.post('/logout',   logout);
router.get('/me',        authenticate, getMe);

module.exports = router;
