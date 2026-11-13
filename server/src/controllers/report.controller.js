'use strict';

const { Post, User, PostReport, ModerationAuditLog, sequelize } = require('../models');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');

const ALLOWED_REASONS = ['spam', 'inappropriate', 'copyright', 'harassment', 'other'];
const ALLOWED_STATUSES = ['pending', 'reviewed', 'dismissed'];

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

/**
 * POST /api/posts/:id/report
 * Authenticated student reports a post
 */
async function createPostReport(req, res, next) {
  try {
    const postId = positiveId(req.params.id);
    const { reason, details } = req.body || {};

    if (!reason || typeof reason !== 'string' || !ALLOWED_REASONS.includes(reason)) {
      throw createError('Lý do báo cáo không hợp lệ. Vui lòng chọn một lý do hợp lệ.', 422);
    }

    if (details !== undefined && details !== null) {
      if (typeof details !== 'string' || details.length > 500) {
        throw createError('Mô tả chi tiết không được vượt quá 500 ký tự.', 422);
      }
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      throw createError('Bài viết không tồn tại.', 404);
    }

    if (post.status !== 'active') {
      throw createError(
        post.status === 'deleted'
          ? 'Không thể báo cáo bài viết đã bị xóa.'
          : 'Không thể báo cáo bài viết đã bị ẩn.',
        400
      );
    }

    if (Number(post.user_id) === Number(req.user.id)) {
      throw createError('Bạn không thể tự báo cáo bài viết của chính mình.', 400);
    }

    try {
      const report = await PostReport.create({
        reporter_id: req.user.id,
        post_id: postId,
        reason,
        details: details?.trim() || null,
        status: 'pending',
      });

      return res.status(201).json({
        success: true,
        message: 'Báo cáo bài viết thành công. Ban quản trị sẽ sớm xem xét.',
        data: {
          id: report.id,
          post_id: postId,
          reason: report.reason,
          details: report.details,
          status: report.status,
          created_at: report.created_at,
        },
      });
    } catch (createErr) {
      if (createErr.name === 'SequelizeUniqueConstraintError') {
        throw createError('Bạn đã gửi báo cáo cho bài viết này rồi.', 409);
      }
      throw createErr;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/reports
 * Admin lists and filters reports with pagination
 */
async function listReports(req, res, next) {
  try {
    const page = boundedQuery(req.query.page, 'page', 1, 10000);
    const limit = boundedQuery(req.query.limit, 'limit', 10, 50);
    const statusFilter = req.query.status;

    if (statusFilter !== undefined && statusFilter !== '' && !ALLOWED_STATUSES.includes(statusFilter)) {
      throw createError('Trạng thái lọc báo cáo không hợp lệ.', 422);
    }

    const where = {};
    if (statusFilter) {
      where.status = statusFilter;
    }

    const [{ count, rows }, pendingCount] = await Promise.all([
      PostReport.findAndCountAll({
        where,
        attributes: ['id', 'reporter_id', 'post_id', 'reason', 'details', 'status', 'created_at', 'updated_at'],
        include: [
          {
            model: User,
            as: 'reporter',
            attributes: ['id', 'full_name', 'avatar_url', 'email'],
          },
          {
            model: Post,
            as: 'post',
            attributes: ['id', 'title', 'post_type', 'status', 'created_at'],
            include: [
              {
                model: User,
                as: 'author',
                attributes: ['id', 'full_name', 'avatar_url'],
              },
            ],
          },
        ],
        order: [['created_at', 'DESC'], ['id', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      }),
      PostReport.count({ where: { status: 'pending' } }),
    ]);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
        pendingCount,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/reports/:id
 * Admin approves (hides post + marks report reviewed + writes audit log) or dismisses report
 */
async function handleReport(req, res, next) {
  try {
    const reportId = positiveId(req.params.id);
    const { action, reason: adminReason } = req.body || {};

    if (!['approve', 'dismiss'].includes(action)) {
      throw createError('Hành động không hợp lệ. Chỉ chấp nhận approve hoặc dismiss.', 422);
    }

    if (adminReason !== undefined && adminReason !== null) {
      if (typeof adminReason !== 'string' || adminReason.length > 500) {
        throw createError('Lý do xử lý không được vượt quá 500 ký tự.', 422);
      }
    }

    await sequelize.transaction(async (transaction) => {
      const report = await PostReport.findByPk(reportId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!report) {
        throw createError('Báo cáo không tồn tại.', 404);
      }

      if (report.status !== 'pending') {
        throw createError('Báo cáo này đã được xử lý trước đó.', 409);
      }

      if (action === 'dismiss') {
        await report.update({ status: 'dismissed' }, { transaction });
      } else if (action === 'approve') {
        await report.update({ status: 'reviewed' }, { transaction });

        const post = await Post.findByPk(report.post_id, {
          attributes: ['id', 'status'],
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (post && post.status === 'active') {
          const prior = post.status;
          await Post.update({ status: 'hidden' }, {
            where: { id: post.id },
            transaction,
          });

          const auditReason = adminReason?.trim() || `Vi phạm tiêu chuẩn cộng đồng (Bị báo cáo: ${report.reason})`;
          await ModerationAuditLog.create({
            actor_admin_id: req.user.id,
            post_id: post.id,
            previous_status: prior,
            new_status: 'hidden',
            reason: auditReason,
          }, { transaction });
        }
      }
    });

    res.json({
      success: true,
      message: action === 'approve'
        ? 'Đã duyệt vi phạm và ẩn bài viết thành công.'
        : 'Đã bác bỏ báo cáo.',
      data: { id: reportId, action },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPostReport,
  listReports,
  handleReport,
};

