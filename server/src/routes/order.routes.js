const router = require('express').Router();
const { createOrder, getMyOrders } = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/',   authenticate, createOrder);
router.get('/my',  authenticate, getMyOrders);

module.exports = router;
