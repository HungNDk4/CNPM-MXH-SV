'use strict';

// EXT-03: auditable, atomic Admin-only Post transitions; no restore.
// Existing BE-08/BE-10 public status and idempotency contracts are unchanged.
const { Post, User, ModerationAuditLog, sequelize } = require('../models');
const { Op } = require('sequelize');
const { toSafePost } = require('../utils/post.dto');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');

const LOG_FIELDS = [
  'id', 'actor_admin_id', 'post_id', 'previous_status', 'new_status', 'reason', 'created_at',
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
        !Object.hasOwn(payload, 'status') ||
        Object.keys(payload).some(key => !['status', 'reason'].includes(key)) ||
        !['hidden', 'deleted'].includes(payload.status)) {
      throw createError('Chỉ cho phép status hidden/deleted và reason tùy chọn.', 422);
    }
    // Existing status-only clients remain supported; the new admin UI supplies a reason.
    const reason = Object.hasOwn(payload, 'reason') ? validateReason(payload.reason) : null;

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
        reason,
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


// ADM-01: bound reason text; reject control characters, empty or enormous input.
function validateReason(value) {
  if (typeof value !== 'string' || value.trim().length < 5 ||
      value.trim().length > 500 || /[\u0000-\u001f\u007f]/.test(value)) {
    throw createError('Lý do kiểm duyệt phải từ 5 đến 500 ký tự hợp lệ.', 422);
  }
  return value.trim();
}
function statusFilter(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !['active', 'hidden', 'deleted'].includes(value)) {
    throw createError('Trạng thái lọc không hợp lệ.', 422);
  }
  return value;
}
function typeFilter(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !['question', 'discussion', 'document'].includes(value)) {
    throw createError('Loại bài không hợp lệ.', 422);
  }
  return value;
}
function titleFilter(value) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
    throw createError('Từ khóa tìm kiếm không hợp lệ.', 422);
  }
  return value.trim().replace(/[\\%_]/g, '\\$&');
}
const ADMIN_POST_FIELDS = ['id','user_id','title','post_type','subject','status','created_at'];
const ADMIN_AUTHOR_FIELDS = ['id','full_name'];
function compactAdminPost(record) {
  const p = record.get({ plain: true });
  return {
    id: p.id, user_id: p.user_id, title: p.title, post_type: p.post_type,
    subject: p.subject ?? null, status: p.status,
    created_at: p.created_at ?? null,
    author: p.author ? { id: p.author.id, full_name: p.author.full_name } : null,
  };
}
// Every route using these controllers MUST be authenticated and admin-authorized.
async function listAdminPosts(req, res, next) {
  try {
    const page = boundedQuery(req.query.page, 'page', 1, 10000);
    const limit = boundedQuery(req.query.limit, 'limit', 10, 50);
    const status = statusFilter(req.query.status);
    const type = typeFilter(req.query.type);
    const search = titleFilter(req.query.search);
    const authorId = req.query.author_id === undefined ? undefined : positiveId(req.query.author_id);
    const where = {};
    if (status !== undefined) where.status = status;
    if (type !== undefined) where.post_type = type;
    if (authorId !== undefined) where.user_id = authorId;
    if (search !== undefined) where.title = { [Op.like]: '%' + search + '%' };
    const { count, rows } = await Post.findAndCountAll({
      where, attributes: ADMIN_POST_FIELDS,
      include: [{ model: User, as: 'author', attributes: ADMIN_AUTHOR_FIELDS }],
      order: [['created_at','DESC'],['id','DESC']], limit,
      offset: (page - 1) * limit,
    });
    res.json({ success: true, data: rows.map(compactAdminPost),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
  } catch (error) { next(error); }
}
async function getAdminPostById(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    const post = await Post.findByPk(id, {
      include: [{ model: User, as: 'author',
        attributes: ['id', 'full_name', 'avatar_url', 'university'] }],
    });
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    // SEC-01 projection excludes storage_key, file_url, file_name and token data.
    res.json({ success: true, data: toSafePost(post) });
  } catch (error) { next(error); }
}

module.exports = { moderatePost, listModerationAuditLogs, listAdminPosts, getAdminPostById };
