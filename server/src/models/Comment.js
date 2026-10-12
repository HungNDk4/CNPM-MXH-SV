const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id:        { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  post_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  user_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  parent_id: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: null },
  content:   { type: DataTypes.TEXT, allowNull: false },
  status:    { type: DataTypes.ENUM('active', 'deleted'), defaultValue: 'active' },
}, {
  tableName:  'comments',
  timestamps: true,
  underscored: true,
});

module.exports = Comment;
