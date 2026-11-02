'use strict';
const { Op } = require('sequelize');
const { Notification, User, Post, Comment } = require('../models');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');

const SAFE_FIELDS = ['id','event_type','actor_id','post_id','comment_id','is_read','created_at'];
function bounded(value, label, fallback, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw createError(label + ' phải là số nguyên dương.', 422);
  }
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n > maximum) throw createError(label + ' vượt giới hạn.', 422);
  return n;
}
function visibleFilter(userId, unreadOnly = false) {
  return {
    where: {
      recipient_id: userId,
      ...(unreadOnly ? { is_read: false } : {}),
      [Op.and]: [
        { [Op.or]: [{ post_id: null }, { '$targetPost.id$': { [Op.ne]: null } }] },
        { [Op.or]: [{ comment_id: null }, { '$targetComment.id$': { [Op.ne]: null } }] },
      ],
    },
    include: [
      { model: User, as: 'actor', attributes: [], required: true, where: { is_active: true } },
      { model: Post, as: 'targetPost', attributes: [], required: false,
        where: { status: 'active', price: 0 } },
      { model: Comment, as: 'targetComment', attributes: [], required: false,
        where: { status: 'active' } },
    ],
    subQuery: false,
  };
}
async function listNotifications(req, res, next) {
  try {
    const page = bounded(req.query.page, 'page', 1, 10000);
    const limit = bounded(req.query.limit, 'limit', 10, 50);
    const flag = req.query.unread_only;
    if (flag !== undefined && flag !== 'true' && flag !== 'false') {
      throw createError('unread_only phải là true hoặc false.', 422);
    }
    const { count, rows } = await Notification.findAndCountAll({
      ...visibleFilter(req.user.id, flag === 'true'),
      attributes: SAFE_FIELDS,
      order: [['created_at','DESC'],['id','DESC']],
      limit, offset: (page - 1) * limit,
    });
    res.json({ success: true, data: rows.map(row => row.get({ plain: true })),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
}
async function unreadCount(req, res, next) {
  try {
    const count = await Notification.count(visibleFilter(req.user.id, true));
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
}
async function readNotification(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    const owned = await Notification.findOne({
      where: { id, recipient_id: req.user.id }, attributes: ['id'],
    });
    if (!owned) throw createError('Thông báo không tồn tại.', 404);
    await Notification.update({ is_read: true }, { where: { id, recipient_id: req.user.id } });
    res.json({ success: true, data: { id, is_read: true } });
  } catch (err) { next(err); }
}
async function readAll(req, res, next) {
  try {
    // Filter with the same active/free visibility policy as inbox/unread count.
    const ids = await Notification.findAll({
      ...visibleFilter(req.user.id, true),
      attributes: ['id'],
    });
    const ownIds = ids.map(row => row.id);
    const [updated] = ownIds.length ?
      await Notification.update({ is_read: true }, {
        where: { id: { [Op.in]: ownIds }, recipient_id: req.user.id, is_read: false },
      }) : [0];
    res.json({ success: true, data: { updated } });
  } catch (err) { next(err); }
}
module.exports = { listNotifications, unreadCount, readNotification, readAll };
