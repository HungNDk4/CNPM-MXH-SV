'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// EXT-04: event metadata only. No user-supplied text, secret, file path or push.
const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  recipient_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  actor_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  event_type: { type: DataTypes.ENUM('follow','comment','reply','like_post','like_comment'), allowNull: false },
  post_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
  comment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  created_at: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'notifications', timestamps: false,
  indexes: [
    { name:'idx_notifications_recipient_recent', fields:['recipient_id','created_at','id'] },
    { name:'idx_notifications_recipient_read_recent', fields:['recipient_id','is_read','created_at','id'] },
  ],
});
module.exports = Notification;
