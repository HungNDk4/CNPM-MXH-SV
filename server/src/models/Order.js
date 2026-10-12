const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id:       { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  buyer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  post_id:  { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  seller_id:{ type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  amount:   { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  // VNPay
  vnp_txn_ref:        { type: DataTypes.STRING(100), unique: true, defaultValue: null },
  vnp_transaction_no: { type: DataTypes.STRING(100), defaultValue: null },
  vnp_response_code:  { type: DataTypes.STRING(10),  defaultValue: null },
  payment_method:     { type: DataTypes.STRING(50),  defaultValue: 'vnpay' },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
  },
  paid_at: { type: DataTypes.DATE, defaultValue: null },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

module.exports = Order;
