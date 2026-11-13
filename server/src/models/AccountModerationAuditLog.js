'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Append-only administrative events. Historical actor/target IDs intentionally
// have no cascading FK; account deletion must never erase moderation evidence.
const AccountModerationAuditLog = sequelize.define('AccountModerationAuditLog', {
  id: { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  actor_admin_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  target_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  previous_active: { type: DataTypes.BOOLEAN, allowNull: false },
  new_active: { type: DataTypes.BOOLEAN, allowNull: false },
  reason: { type: DataTypes.STRING(500), allowNull: false },
  created_at: { type: DataTypes.DATE(3), allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'account_moderation_audit_logs',
  timestamps: false,
  indexes: [
    { name: 'idx_account_audit_recent', fields: ['created_at', 'id'] },
    { name: 'idx_account_audit_target_recent', fields: ['target_user_id', 'created_at', 'id'] },
  ],
});
module.exports = AccountModerationAuditLog;
