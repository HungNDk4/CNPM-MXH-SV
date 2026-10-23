'use strict';

// ADR-013: free posts publish immediately; Admin may hide/delete afterwards.
// No restore, reporting/appeals, user-banning or physical document deletion.
const { Post } = require('../models');
const { Op } = require('sequelize');
const { positiveId } = require('../utils/interaction-target');
const { createError } = require('../middlewares/error.middleware');

async function moderatePost(req, res, next) {
  try {
    const id = positiveId(req.params.id);
    const payload = req.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
        Object.keys(payload).length !== 1 ||
        !['hidden', 'deleted'].includes(payload.status)) {
      throw createError('Chỉ cho phép trạng thái hidden hoặc deleted.', 422);
    }
    const allowed = payload.status === 'hidden' ? ['active'] : ['active', 'hidden'];
    // Conditional update: never resurrect soft-deleted rows.
    const [changed] = await Post.update({ status: payload.status }, {
      where: { id, status: { [Op.in]: allowed } },
    });
    if (changed === 0) {
      const existing = await Post.findByPk(id, { attributes: ['id', 'status'] });
      if (!existing) throw createError('Bài viết không tồn tại.', 404);
      if (existing.status !== payload.status) {
        throw createError('Không thể chuyển trạng thái bài viết.', 409);
      }
      // Repeated hide/delete is an idempotent success.
    }
    res.json({
      success: true,
      message: payload.status === 'hidden' ? 'Đã ẩn bài viết.' : 'Đã xóa bài viết.',
      data: { id, status: payload.status },
    });
  } catch (error) { next(error); }
}
module.exports = { moderatePost };
