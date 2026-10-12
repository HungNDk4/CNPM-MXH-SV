const router = require('express').Router();
const { vnpayReturn, vnpayIPN } = require('../controllers/payment.controller');

// VNPay callback routes (không cần authenticate - VNPay gọi trực tiếp)
router.get('/vnpay-return', vnpayReturn);  // Redirect từ VNPay về
router.get('/vnpay-ipn',    vnpayIPN);     // Server-to-server notification

module.exports = router;
