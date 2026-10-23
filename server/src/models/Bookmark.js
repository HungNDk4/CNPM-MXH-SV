'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bookmark = sequelize.define('Bookmark', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  post_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  tableName: 'bookmarks',
  timestamps: false,
  indexes: [
    { name: 'uq_bookmarks_user_post', unique: true, fields: ['user_id', 'post_id'] },
    { name: 'idx_bookmarks_user_created', fields: ['user_id', 'created_at', 'id'] },
  ],
});

module.exports = Bookmark;
