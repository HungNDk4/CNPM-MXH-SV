'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// No destructive FK: historical actor and Post numeric IDs are retained.
// Rows are only created by Admin moderation transactions. No mutation route.
const ModerationAuditLog = sequelize.define('ModerationAuditLog', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  actor_admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  post_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  previous_status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted'), allowNull: false,
  },
  new_status: { type: DataTypes.ENUM('hidden', 'deleted'), allowNull: false },
  created_at: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'moderation_audit_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_moderation_audit_recent', fields: ['created_at', 'id'] },
    { name: 'idx_moderation_audit_post_recent', fields: ['post_id', 'created_at', 'id'] },
  ],
});
module.exports = ModerationAuditLog;
