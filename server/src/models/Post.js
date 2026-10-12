const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
    validate: { notEmpty: { msg: 'Tiêu đề không được để trống.' } },
  },
  content:   { type: DataTypes.TEXT,        defaultValue: null },
  post_type: {
    type: DataTypes.ENUM('question', 'document', 'discussion'),
    defaultValue: 'question',
  },
  file_url:  { type: DataTypes.STRING(500), defaultValue: null },
  file_name: { type: DataTypes.STRING(255), defaultValue: null },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    validate: { min: { args: [0], msg: 'Giá không được âm.' } },
  },
  subject:    { type: DataTypes.STRING(200), defaultValue: null },
  tags:       { type: DataTypes.JSON,        defaultValue: null },
  view_count: { type: DataTypes.INTEGER.UNSIGNED, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('active', 'hidden', 'deleted'),
    defaultValue: 'active',
  },
}, {
  tableName: 'posts',
  timestamps: true,
  underscored: true,
});

module.exports = Post;
