'use strict';

// EXT-03: auditable, atomic Admin-only Post transitions; no restore.
// Existing BE-08/BE-10 public status and idempotency contracts are unchanged.
const { Post, ModerationAuditLog, sequelize } = require('../models');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');

const LOG_FIELDS = [
  'id', 'actor_admin_id', 'post_id', 'previous_status', 'new_status', 'created_at',
];

function boundedQuery(value, label, fallback, max) {
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

async function moderatePost(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
        Object.keys(payload).length !== 1 ||
        !['hidden', 'deleted'].includes(payload.status)) {
      throw createError('Chỉ cho phép trạng thái hidden hoặc deleted.', 422);
    }

    // Lock and change row together. An audit insertion failure rolls back
    // the Post update, so no moderation can succeed without its event.
    await sequelize.transaction(async transaction => {
      const post = await Post.findByPk(id, {
        attributes: ['id', 'status'], transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!post) throw createError('Bài viết không tồn tại.', 404);
      const prior = post.status;
      if (prior === payload.status) return; // repeated action: no extra event
      if (prior === 'deleted' || (prior === 'hidden' && payload.status !== 'deleted')) {
        throw createError('Không thể chuyển trạng thái bài viết.', 409);
      }
      // Keep CAS as an additional defense if DB transaction behavior changes.
      const [changed] = await Post.update({ status: payload.status }, {
        where: { id, status: prior }, transaction,
      });
      if (changed !== 1) throw createError('Trạng thái bài viết đã thay đổi.', 409);
      await ModerationAuditLog.create({
        actor_admin_id: req.user.id,
        post_id: id,
        previous_status: prior,
        new_status: payload.status,
      }, { transaction });
    });

    res.json({
      success: true,
      message: payload.status === 'hidden' ? 'Đã ẩn bài viết.' : 'Đã xóa bài viết.',
      data: { id, status: payload.status },
    });
  } catch (error) { next(error); }
}

async function listModerationAuditLogs(req, res, next) {
  try {
    const page = boundedQuery(req.query.page, 'page', 1, 10000);
    const limit = boundedQuery(req.query.limit, 'limit', 10, 50);
    const postId = req.query.post_id === undefined ? null :
      positiveId(req.query.post_id);
    const { count, rows } = await ModerationAuditLog.findAndCountAll({
      ...(postId === null ? {} : { where: { post_id: postId } }),
      attributes: LOG_FIELDS,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    res.json({
      success: true,
      data: rows.map(row => {
        const plain = row.get({ plain: true });
        return Object.fromEntries(LOG_FIELDS.map(field => [field, plain[field]]));
      }),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) { next(error); }
}

module.exports = { moderatePost, listModerationAuditLogs };
