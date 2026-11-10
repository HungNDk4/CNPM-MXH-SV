'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PostReport = sequelize.define('PostReport', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  reporter_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  post_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  reason: {
    type: DataTypes.ENUM('spam', 'inappropriate', 'copyright', 'harassment', 'other'),
    allowNull: false,
  },
  details: {
    type: DataTypes.STRING(500),
    allowNull: true,
    defaultValue: null,
  },
  status: {
    type: DataTypes.ENUM('pending', 'reviewed', 'dismissed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  created_at: {
    type: DataTypes.DATE(3),
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updated_at: {
    type: DataTypes.DATE(3),
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'post_reports',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      name: 'uq_post_reports_reporter_post',
      fields: ['reporter_id', 'post_id'],
    },
    {
      name: 'idx_post_reports_status_created',
      fields: ['status', 'created_at'],
    },
  ],
});

module.exports = PostReport;

