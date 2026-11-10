'use strict';

const { Op } = require('sequelize');
const { User, RefreshToken, AccountModerationAuditLog, sequelize } = require('../models');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');

const ACCOUNT_FIELDS = ['id', 'full_name', 'email', 'role', 'is_active', 'created_at'];
const AUDIT_FIELDS = ['id', 'actor_admin_id', 'target_user_id', 'previous_active', 'new_active', 'reason', 'created_at'];

function boundedInt(value, label, fallback, max) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw createError(label + ' phải là số nguyên dương.', 422);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > max) {
    throw createError(label + ' vượt giới hạn.', 422);
  }
  return parsed;
}

function validatedChange(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      Object.keys(payload).length !== 2 ||
      !Object.hasOwn(payload, 'is_active') || !Object.hasOwn(payload, 'reason') ||
      typeof payload.is_active !== 'boolean' ||
      typeof payload.reason !== 'string') {
    throw createError('Chỉ chấp nhận is_active (boolean) và reason (string).', 422);
  }
  const reason = payload.reason.trim();
  if (reason.length < 5 || reason.length > 500 || /[\x00-\x1f\x7f]/.test(reason)) {
    throw createError('Lý do phải từ 5–500 ký tự, không chứa ký tự điều khiển.', 422);
  }
  return { isActive: payload.is_active, reason };
}

function safeAccount(row) {
  const account = row.get({ plain: true });
  return Object.fromEntries(ACCOUNT_FIELDS.map(field => [field, account[field]]));
}

async function listAccounts(req, res, next) {
  try {
    const page = boundedInt(req.query.page, 'page', 1, 10000);
    const limit = boundedInt(req.query.limit, 'limit', 20, 50);
    const status = req.query.status === undefined ? 'all' : req.query.status;
    if (!['all', 'active', 'locked'].includes(status)) {
      throw createError('Bộ lọc trạng thái không hợp lệ.', 422);
    }
    const searchInput = req.query.search === undefined ? '' : req.query.search;
    if (typeof searchInput !== 'string' || searchInput.length > 100 ||
        /[\x00-\x1f\x7f]/.test(searchInput)) {
      throw createError('Từ khóa tìm kiếm không hợp lệ.', 422);
    }
    const search = searchInput.trim();
    const where = {};
    if (status !== 'all') where.is_active = status === 'active';
    if (search) {
      // Escape LIKE wildcards so callers cannot request an unrestricted wildcard scan.
      const escaped = search.replace(/[\\%_]/g, '\\$&');
      where[Op.or] = [
        { full_name: { [Op.like]: '%' + escaped + '%' } },
        { email: { [Op.like]: '%' + escaped + '%' } },
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where, attributes: ACCOUNT_FIELDS, order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit, offset: (page - 1) * limit,
    });
    res.json({
      success: true,
      data: rows.map(safeAccount),
      pagination: { total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) },
    });
  } catch (error) { next(error); }
}

async function setAccountStatus(req, res, next) {
  try {
    const targetId = positiveId(req.params.id);
    const { isActive, reason } = validatedChange(req.body);
    const actorId = req.user.id;
    if (targetId === actorId && !isActive) {
      throw createError('Admin không thể tự khóa tài khoản của mình.', 409);
    }

    // Lock all admin rows in a deterministic order first. This serializes
    // competing administrative changes and guards against two-admin last-lock races.
    // Refresh rotation locks one user before issuing tokens; account lock waits for it.
    let result;
    await sequelize.transaction(async transaction => {
      const admins = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'role', 'is_active'],
        order: [['id', 'ASC']],
        transaction, lock: transaction.LOCK.UPDATE,
      });
      const actor = admins.find(admin => admin.id === actorId);
      if (!actor || !actor.is_active) throw createError('Admin không còn quyền thao tác.', 403);

      const target = await User.findByPk(targetId, {
        transaction, lock: transaction.LOCK.UPDATE,
      });
      if (!target) throw createError('Tài khoản không tồn tại.', 404);
      if (target.id === actorId && !isActive) {
        throw createError('Admin không thể tự khóa tài khoản của mình.', 409);
      }

      const previousActive = Boolean(target.is_active);
      if (previousActive === isActive) {
        result = { account: safeAccount(target), changed: false };
        return;
      }

      if (target.role === 'admin' && !isActive &&
          admins.filter(admin => admin.is_active).length <= 1) {
        throw createError('Không thể khóa Admin hoạt động cuối cùng.', 409);
      }

      const [updated] = await User.update({ is_active: isActive }, {
        where: { id: targetId, is_active: previousActive }, transaction,
      });
      if (updated !== 1) throw createError('Trạng thái tài khoản đã thay đổi.', 409);

      if (!isActive) {
        await RefreshToken.update({ revoked: true }, {
          where: { user_id: targetId, revoked: false }, transaction,
        });
      }

      await AccountModerationAuditLog.create({
        actor_admin_id: actorId,
        target_user_id: targetId,
        previous_active: previousActive,
        new_active: isActive,
        reason,
      }, { transaction });

      const account = safeAccount(target);
      account.is_active = isActive;
      result = { account, changed: true };
    });

    res.json({
      success: true,
      message: result.changed
        ? (isActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.')
        : 'Tài khoản đã ở trạng thái yêu cầu.',
      data: result,
    });
  } catch (error) { next(error); }
}

async function listAccountAudit(req, res, next) {
  try {
    const page = boundedInt(req.query.page, 'page', 1, 10000);
    const limit = boundedInt(req.query.limit, 'limit', 20, 50);
    const target = req.query.target_user_id === undefined ? null : positiveId(req.query.target_user_id);
    const { rows, count } = await AccountModerationAuditLog.findAndCountAll({
      ...(target === null ? {} : { where: { target_user_id: target } }),
      attributes: AUDIT_FIELDS,
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit, offset: (page - 1) * limit,
    });
    res.json({ success: true, data: rows, pagination: {
      total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)),
    } });
  } catch (error) { next(error); }
}

module.exports = { listAccounts, setAccountStatus, listAccountAudit };
