const { Post, User } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { Op } = require('sequelize');
const { toSafePost } = require('../utils/post.dto');
const { positiveId } = require('../utils/interaction-target');
const { validateCreatePost, validateEditPost } = require('../utils/post-input');

/**
 * GET /api/posts?page=1&limit=10&type=document&subject=cnpm&search=react
 */
// BE-06: bounded and validated query parsing; malformed input is a 422, never a DB error.
const positiveIntQuery = (value, label, fallback, maximum) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw createError(label + ' phải là số nguyên dương.', 422);
  }
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n > maximum) {
    throw createError(label + ' vượt quá giới hạn.', 422);
  }
  return n;
};

const textQuery = (value, label, maximum) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw createError(label + ' không hợp lệ.', 422);
  }
  return value.trim();
};

const priceQuery = (value, label) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^(?:0|[1-9][0-9]{0,7})(?:\.[0-9]{1,2})?$/.test(value)) {
    throw createError(label + ' phải là giá không âm, tối đa 2 chữ số thập phân.', 422);
  }
  return Number(value);
};

// MySQL/TiDB LIKE wildcards in user text must be matched literally.
const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

const getPosts = async (req, res, next) => {
  try {
    const { type } = req.query;
    // Keep ADR-002/011: only free document metadata is public; other feeds require login.
    if (!req.user && type !== 'document') {
      throw createError('Yêu cầu đăng nhập để xem bài viết.', 401);
    }
    if (type !== undefined && (typeof type !== 'string' ||
        !['question', 'discussion', 'document'].includes(type))) {
      throw createError('Loại bài viết không hợp lệ.', 422);
    }

    const page = positiveIntQuery(req.query.page, 'page', 1, 10000);
    const limit = positiveIntQuery(req.query.limit, 'limit', 10, 50);
    const subject = textQuery(req.query.subject, 'subject', 200);
    const search = textQuery(req.query.search, 'search', 100);
    const minPrice = priceQuery(req.query.minPrice, 'minPrice');
    const maxPrice = priceQuery(req.query.maxPrice, 'maxPrice');
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      throw createError('minPrice không được lớn hơn maxPrice.', 422);
    }

    // Free-first: no paid legacy posts (of any type), suppressed posts or file paths.
    const where = { status: 'active', price: 0 };
    if (type) where.post_type = type;
    if (subject !== undefined) where.subject = { [Op.like]: '%' + escapeLike(subject) + '%' };
    if (search !== undefined) where.title = { [Op.like]: '%' + escapeLike(search) + '%' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      const bounds = {};
      if (minPrice !== undefined) bounds[Op.gte] = minPrice;
      if (maxPrice !== undefined) bounds[Op.lte] = maxPrice;
      where[Op.and] = [{ price: bounds }];
    }

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university'] }],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      success: true,
      data: rows.map(toSafePost),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/:id
 */
const getPostById = async (req, res, next) => {
  try {
    // Validate path ID before a public database query (422, never raw ORM error).
    const id = positiveId(req.params.id);
    const post = await Post.findByPk(id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url'] }],
    });
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    // Suppressed/paid posts must return the same 404 for guests and members.
    // Check visibility before the member-only question/discussion login gate.
    if (post.status !== 'active' || Number(post.price) !== 0) {
      throw createError('Bài viết không tồn tại.', 404);
    }
    // ADR-002 still keeps general social posts member-only.
    if (!req.user && post.post_type !== 'document') {
      throw createError('Yêu cầu đăng nhập để xem bài viết.', 401);
    }

    // Tăng view count
    await post.increment('view_count');

    res.json({ success: true, data: toSafePost(post) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts
 */
const createPost = async (req, res, next) => {
  try {
    const values = validateCreatePost(req.body);
    const post = await Post.create({ ...values, user_id: req.user.id });
    res.status(201).json({
      success: true, message: 'Đăng bài thành công.', data: toSafePost(post),
    });
  } catch (error) { next(error); }
};

/**
 * PUT /api/posts/:id
 */
const updatePost = async (req, res, next) => {
  try {
    const id = positiveId(req.params.id);
    const post = await Post.findByPk(id);
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    const admin = req.user.role === 'admin';
    if (!admin && post.user_id !== req.user.id) {
      throw createError('Không có quyền sửa bài.', 403);
    }
    // BE-10 fail-closed: ADR-013 authorizes hide/delete only, not restore
    // or edits of suppressed content, even by Admin. The BE-08 endpoint is
    // the supported post-publication moderation path.
    if (post.status !== 'active') {
      throw createError('Không thể sửa bài viết đã ẩn hoặc xóa.', 403);
    }
    const changes = validateEditPost(req.body);

    // Compare-and-set protects against concurrent moderation suppressing a post
    // after the owner read it but before the write.
    const where = { id, status: post.status };
    if (!admin) where.user_id = req.user.id;
    const [affected] = await Post.update(changes, { where });
    if (affected !== 1) throw createError('Trạng thái bài viết đã thay đổi.', 409);
    const updated = await Post.findByPk(id);
    res.json({ success: true, message: 'Cập nhật thành công.', data: toSafePost(updated) });
  } catch (error) { next(error); }
};

/**
 * DELETE /api/posts/:id
 */
const deletePost = async (req, res, next) => {
  try {
    const id = positiveId(req.params.id);
    const post = await Post.findByPk(id);
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      throw createError('Không có quyền xóa.', 403);
    }
    await Post.update({ status: 'deleted' }, { where: { id } });
    res.json({ success: true, message: 'Xóa bài viết thành công.' });
  } catch (error) { next(error); }
};

module.exports = { getPosts, getPostById, createPost, updatePost, deletePost };
