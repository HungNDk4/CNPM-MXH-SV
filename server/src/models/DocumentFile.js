'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Private: never expose DocumentFile through public Post JSON.
module.exports = sequelize.define('DocumentFile', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  post_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  storage_key: { type: DataTypes.STRING(70), allowNull: false, unique: true },
  original_name: { type: DataTypes.STRING(180), allowNull: false },
  mime_type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'application/pdf' },
  size_bytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  sha256: { type: DataTypes.CHAR(64), allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'document_files', timestamps: false, underscored: true });
