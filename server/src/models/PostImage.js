'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = sequelize.define('PostImage', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  post_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  storage_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mime_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'image/jpeg',
  },
  size_bytes: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  sort_order: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'post_images',
  timestamps: false,
  underscored: true,
});

