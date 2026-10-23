'use strict';
const { User, Follow, sequelize } = require('../models');
const { createInteractionNotification } = require('../services/notification.service');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');
const PUBLIC = ['id', 'full_name', 'avatar_url', 'university'];
function numberQuery(value, label, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw createError(label + ' phải là số nguyên dương.', 422);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > max) {
    throw createError(label + ' vượt giới hạn.', 422);
  }
  return number;
}
async function requireActive(id) {
  const user = await User.findOne({ where: { id, is_active: true }, attributes: ['id'] });
  if (!user) throw createError('Người dùng không tồn tại.', 404);
}
async function addFollow(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    if (id === req.user.id) throw createError('Không thể theo dõi chính mình.', 422);
    await requireActive(id);
    await sequelize.transaction(async transaction => {
      const [, created] = await Follow.findOrCreate({
        where: { follower_id: req.user.id, following_id: id },
        defaults: { follower_id: req.user.id, following_id: id },
        transaction,
      });
      if (created) await createInteractionNotification({
        recipientId: id, actorId: req.user.id, eventType: 'follow', transaction,
      });
    });
    res.json({ success: true, data: { user_id: id, following: true } });
  } catch (error) { next(error); }
}
async function removeFollow(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    if (id === req.user.id) throw createError('Không thể tự bỏ theo dõi.', 422);
    // Own stale relation can be removed without exposing disabled/missing account.
    await Follow.destroy({ where: { follower_id: req.user.id, following_id: id } });
    res.json({ success: true, data: { user_id: id, following: false } });
  } catch (error) { next(error); }
}
async function listFollows(req, res, next, direction) {
  try {
    const id = positiveId(req.params.id);
    await requireActive(id);
    const page = numberQuery(req.query.page, 'page', 1, 10000);
    const limit = numberQuery(req.query.limit, 'limit', 10, 50);
    const inbound = direction === 'followers';
    const alias = inbound ? 'follower' : 'following';
    const { count, rows } = await Follow.findAndCountAll({
      where: inbound ? { following_id: id } : { follower_id: id },
      include: [{
        model: User, as: alias, attributes: PUBLIC,
        required: true, where: { is_active: true },
      }],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit, offset: (page - 1) * limit,
    });
    res.json({ success: true,
      data: rows.map(row => row[alias].get({ plain: true })),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) { next(error); }
}
async function followStats(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    await requireActive(id);
    const [followers, following, exists] = await Promise.all([
      Follow.count({ where: { following_id: id },
        include: [{ model: User, as: 'follower', where: { is_active: true }, required: true }] }),
      Follow.count({ where: { follower_id: id },
        include: [{ model: User, as: 'following', where: { is_active: true }, required: true }] }),
      req.user.id === id ? Promise.resolve(null) :
        Follow.findOne({ where: { follower_id: req.user.id, following_id: id } }),
    ]);
    res.json({ success: true, data: {
      user_id: id, followers, following, is_following: Boolean(exists),
    } });
  } catch (error) { next(error); }
}
module.exports = { addFollow, removeFollow, listFollows, followStats };