'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Follow = sequelize.define('Follow', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  follower_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  following_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'user_follows', timestamps: false,
  indexes: [
    { name: 'uq_follows_pair', unique: true, fields: ['follower_id', 'following_id'] },
    { name: 'idx_follows_followers', fields: ['following_id', 'created_at', 'id'] },
    { name: 'idx_follows_following', fields: ['follower_id', 'created_at', 'id'] },
  ],
});
module.exports = Follow;