const crypto = require('crypto');
const qs     = require('qs');
const { Order, Post, DocumentAccess, User } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { sequelize }   = require('../models');

// ── Helpers VNPay ────────────────────────────────────────────────

/**
 * Sắp xếp params theo alphabet và tạo HMAC-SHA512
 */
function vnpaySign(params, secretKey) {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== '' && params[key] !== null && params[key] !== undefined) {
        acc[key] = params[key];
      }
      return acc;
    }, {});

  const signData = qs.stringify(sorted, { encode: false });
  return crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
}

// ── Controllers ──────────────────────────────────────────────────

/**
 * POST /api/orders
 * Tạo đơn hàng và trả về URL thanh toán VNPay
 */
const createOrder = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { post_id } = req.body;
    const buyer_id = req.user.id;

    // Kiểm tra bài viết/tài liệu
    const post = await Post.findByPk(post_id, {
      include: [{ association: 'author', attributes: ['id'] }],
    });
    if (!post || post.status !== 'active') throw createError('Tài liệu không tồn tại.', 404);
    if (post.post_type !== 'document') throw createError('Bài viết này không phải tài liệu có thể mua.', 400);
    if (post.price <= 0) throw createError('Tài liệu này miễn phí, không cần thanh toán.', 400);
    if (post.user_id === buyer_id) throw createError('Bạn không thể mua tài liệu của chính mình.', 400);

    // Kiểm tra đã mua chưa
    const alreadyAccess = await DocumentAccess.findOne({ where: { user_id: buyer_id, post_id } });
    if (alreadyAccess) throw createError('Bạn đã có quyền truy cập tài liệu này.', 409);

    // Kiểm tra đơn pending chưa xử lý
    const pendingOrder = await Order.findOne({ where: { buyer_id, post_id, status: 'pending' } });
    if (pendingOrder) {
      await t.rollback();
      // Tạo lại URL cho đơn cũ
      const paymentUrl = buildVNPayUrl(pendingOrder);
      return res.json({ success: true, data: { order_id: pendingOrder.id, payment_url: paymentUrl } });
    }

    // Tạo mã giao dịch duy nhất
    const vnp_txn_ref = `MSN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = await Order.create({
      buyer_id,
      post_id,
      seller_id: post.user_id,
      amount: post.price,
      vnp_txn_ref,
      status: 'pending',
    }, { transaction: t });

    await t.commit();

    const paymentUrl = buildVNPayUrl(order, req);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công.',
      data: { order_id: order.id, vnp_txn_ref, payment_url: paymentUrl },
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

/**
 * Xây dựng URL thanh toán VNPay
 */
function buildVNPayUrl(order, req) {
  const tmnCode   = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const returnUrl = process.env.VNPAY_RETURN_URL;
  const vnpUrl    = process.env.VNPAY_URL;

  // IP của client
  const ipAddr = (req && (
    req.headers['x-forwarded-for'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress
  )) || '127.0.0.1';

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const createDate =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const params = {
    vnp_Version:    '2.1.0',
    vnp_Command:    'pay',
    vnp_TmnCode:    tmnCode,
    vnp_Locale:     'vn',
    vnp_CurrCode:   'VND',
    vnp_TxnRef:     order.vnp_txn_ref,
    vnp_OrderInfo:  `Thanh toan tai lieu #${order.post_id}`,
    vnp_OrderType:  'other',
    vnp_Amount:     Math.round(order.amount) * 100,  // VNPay dùng đơn vị nhỏ nhất
    vnp_ReturnUrl:  returnUrl,
    vnp_IpAddr:     ipAddr,
    vnp_CreateDate: createDate,
  };

  const secureHash = vnpaySign(params, secretKey);
  params.vnp_SecureHash = secureHash;

  return `${vnpUrl}?${qs.stringify(params, { encode: false })}`;
}

/**
 * GET /api/payment/vnpay-return
 * Callback từ VNPay sau khi thanh toán (redirect về client)
 */
const vnpayReturn = async (req, res, next) => {
  try {
    const params = { ...req.query };
    const secureHash = params['vnp_SecureHash'];
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const signed = vnpaySign(params, process.env.VNPAY_HASH_SECRET);

    if (signed !== secureHash) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/result?status=fail&message=invalid_signature`);
    }

    const responseCode = params['vnp_ResponseCode'];
    const txnRef       = params['vnp_TxnRef'];
    const transactionNo = params['vnp_TransactionNo'];

    const order = await Order.findOne({ where: { vnp_txn_ref: txnRef } });
    if (!order) {
      return res.redirect(`${process.env.CLIENT_URL}/payment/result?status=fail&message=order_not_found`);
    }

    if (responseCode === '00') {
      // Thanh toán thành công
      const t = await sequelize.transaction();
      try {
        await order.update({
          status: 'paid',
          vnp_transaction_no: transactionNo,
          vnp_response_code: responseCode,
          paid_at: new Date(),
        }, { transaction: t });

        // Cấp quyền truy cập tài liệu
        await DocumentAccess.findOrCreate({
          where: { user_id: order.buyer_id, post_id: order.post_id },
          defaults: { order_id: order.id },
          transaction: t,
        });

        // Cộng tiền cho seller
        await User.increment('wallet_balance', {
          by: order.amount,
          where: { id: order.seller_id },
          transaction: t,
        });

        await t.commit();
        return res.redirect(`${process.env.CLIENT_URL}/payment/result?status=success&order_id=${order.id}`);
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      await order.update({ status: 'failed', vnp_response_code: responseCode });
      return res.redirect(`${process.env.CLIENT_URL}/payment/result?status=fail&code=${responseCode}`);
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment/vnpay-ipn
 * IPN (Instant Payment Notification) từ VNPay server-to-server
 */
const vnpayIPN = async (req, res, next) => {
  try {
    const params = { ...req.query };
    const secureHash = params['vnp_SecureHash'];
    delete params['vnp_SecureHash'];
    delete params['vnp_SecureHashType'];

    const signed = vnpaySign(params, process.env.VNPAY_HASH_SECRET);
    if (signed !== secureHash) {
      return res.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    const txnRef       = params['vnp_TxnRef'];
    const responseCode = params['vnp_ResponseCode'];
    const amount       = parseInt(params['vnp_Amount']) / 100;

    const order = await Order.findOne({ where: { vnp_txn_ref: txnRef } });
    if (!order) return res.json({ RspCode: '01', Message: 'Order not found' });
    if (order.status !== 'pending') return res.json({ RspCode: '02', Message: 'Order already processed' });
    if (Math.abs(order.amount - amount) > 1) return res.json({ RspCode: '04', Message: 'Invalid amount' });

    if (responseCode === '00') {
      const t = await sequelize.transaction();
      try {
        await order.update({
          status: 'paid',
          vnp_transaction_no: params['vnp_TransactionNo'],
          vnp_response_code: responseCode,
          paid_at: new Date(),
        }, { transaction: t });

        await DocumentAccess.findOrCreate({
          where: { user_id: order.buyer_id, post_id: order.post_id },
          defaults: { order_id: order.id },
          transaction: t,
        });

        await User.increment('wallet_balance', {
          by: order.amount,
          where: { id: order.seller_id },
          transaction: t,
        });

        await t.commit();
        return res.json({ RspCode: '00', Message: 'Confirm Success' });
      } catch (err) {
        await t.rollback();
        throw err;
      }
    } else {
      await order.update({ status: 'failed', vnp_response_code: responseCode });
      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders
 * Lấy lịch sử mua hàng của user
 */
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      where: { buyer_id: req.user.id },
      include: [{ association: 'document', attributes: ['id', 'title', 'file_name', 'price'] }],
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, vnpayReturn, vnpayIPN, getMyOrders };
