const User          = require('./User');
const Post          = require('./Post');
const Comment       = require('./Comment');
const Order         = require('./Order');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ── Like model (inline nhỏ gọn) ──────────────────────────────────
const Like = sequelize.define('Like', {
  id:          { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:     { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  target_type: { type: DataTypes.ENUM('post', 'comment'), allowNull: false },
  target_id:   { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
}, { tableName: 'likes', timestamps: true, underscored: true,
     indexes: [{ unique: true, fields: ['user_id', 'target_type', 'target_id'] }] });

// ── DocumentAccess model ─────────────────────────────────────────
const DocumentAccess = sequelize.define('DocumentAccess', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  post_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  order_id:   { type: DataTypes.INTEGER.UNSIGNED, defaultValue: null },
  granted_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'document_access', timestamps: false,
     indexes: [{ unique: true, fields: ['user_id', 'post_id'] }] });

// ── RefreshToken model ───────────────────────────────────────────
const RefreshToken = sequelize.define('RefreshToken', {
  id:         { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  user_id:    { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  token:      { type: DataTypes.STRING(512), allowNull: false, unique: true },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'refresh_tokens', timestamps: true, underscored: true });

// ── Associations ─────────────────────────────────────────────────
// User <-> Post
User.hasMany(Post,    { foreignKey: 'user_id', as: 'posts' });
Post.belongsTo(User,  { foreignKey: 'user_id', as: 'author' });

// Post <-> Comment
Post.hasMany(Comment,    { foreignKey: 'post_id', as: 'comments' });
Comment.belongsTo(Post,  { foreignKey: 'post_id', as: 'post' });
Comment.belongsTo(User,  { foreignKey: 'user_id', as: 'author' });
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

// Like
User.hasMany(Like, { foreignKey: 'user_id' });
Like.belongsTo(User, { foreignKey: 'user_id', as: 'liker' });

// Order
User.hasMany(Order, { foreignKey: 'buyer_id',  as: 'purchases' });
User.hasMany(Order, { foreignKey: 'seller_id', as: 'sales' });
Post.hasMany(Order, { foreignKey: 'post_id',   as: 'orders' });
Order.belongsTo(User, { foreignKey: 'buyer_id',  as: 'buyer' });
Order.belongsTo(User, { foreignKey: 'seller_id', as: 'seller' });
Order.belongsTo(Post, { foreignKey: 'post_id',   as: 'document' });

// DocumentAccess
User.hasMany(DocumentAccess, { foreignKey: 'user_id' });
Post.hasMany(DocumentAccess, { foreignKey: 'post_id' });
DocumentAccess.belongsTo(User,  { foreignKey: 'user_id' });
DocumentAccess.belongsTo(Post,  { foreignKey: 'post_id' });
DocumentAccess.belongsTo(Order, { foreignKey: 'order_id' });

// RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Post, Comment, Like, Order, DocumentAccess, RefreshToken };
