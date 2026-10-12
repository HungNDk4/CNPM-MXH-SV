const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: { msg: 'Họ tên không được để trống.' } },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    unique: true,
    validate: { isEmail: { msg: 'Email không hợp lệ.' } },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar_url:    { type: DataTypes.STRING(500), defaultValue: null },
  bio:           { type: DataTypes.TEXT,        defaultValue: null },
  university:    { type: DataTypes.STRING(200), defaultValue: null },
  major:         { type: DataTypes.STRING(200), defaultValue: null },
  wallet_balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
  },
  role: {
    type: DataTypes.ENUM('student', 'admin'),
    defaultValue: 'student',
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
