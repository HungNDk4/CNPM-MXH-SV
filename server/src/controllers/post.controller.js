const { Post, User } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { Op } = require('sequelize');
const { toSafePost } = require('../utils/post.dto');

/**
 * GET /api/posts?page=1&limit=10&type=document&subject=cnpm&search=react
 */
const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, subject, search, minPrice, maxPrice } = req.query;
    if (!req.user && type !== 'document') throw createError('Yêu cầu đăng nhập để xem bài viết.', 401);
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // No paid/legacy documents appear in feed, even with price filters.
    const where = {
      status: 'active',
      [Op.or]: [{ post_type: { [Op.ne]: 'document' } }, { price: 0 }],
    };
    if (type)    where.post_type = type;
    if (subject) where.subject = { [Op.like]: `%${subject}%` };
    if (search)  where.title   = { [Op.like]: `%${search}%` };
    if (minPrice !== undefined) where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    if (maxPrice !== undefined) where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };

    const { count, rows } = await Post.findAndCountAll({
      where,
      include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university'] }],
      order:   [['created_at', 'DESC']],
      limit:   parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: rows.map(toSafePost),
      pagination: {
        total: count,
        page:  parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
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
    const post = await Post.findByPk(req.params.id, {
      include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url'] }],
    });
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    // ADR-002 is still open for general guest posts.
    if (!req.user && post.post_type !== 'document') {
      throw createError('Yêu cầu đăng nhập để xem bài viết.', 401);
    }
    // Guests/students/owners cannot view hidden, deleted or paid documents.
    if (post.status === 'deleted' ||
        (post.post_type === 'document' &&
         (post.status !== 'active' || Number(post.price) !== 0))) {
      throw createError('Bài viết không tồn tại.', 404);
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
    const { title, content, post_type, price, subject, tags } = req.body;
    // Legacy JSON file_url/paid-document creation is not the approved PDF
    // upload workflow. Fail closed until a separate private upload API exists.
    if (post_type === 'document' ||
        Object.hasOwn(req.body, 'file_url') ||
        Object.hasOwn(req.body, 'file_name') ||
        (price !== undefined && Number(price) !== 0)) {
      throw createError('Chức năng đăng tài liệu qua URL hoặc bài trả phí không được hỗ trợ.', 422);
    }

    const post = await Post.create({
      user_id: req.user.id, title, content, post_type,
      price: 0, subject, tags,
    });

    res.status(201).json({
      success: true,
      message: 'Đăng bài thành công.',
      data: toSafePost(post),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/posts/:id
 */
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    if (post.user_id !== req.user.id && req.user.role !== 'admin') throw createError('Không có quyền sửa bài.', 403);
    // Owners may not reactivate documents hidden/deleted by moderation.
    if (post.post_type === 'document' && post.status !== 'active') {
      throw createError('Không thể sửa tài liệu đã ẩn hoặc xóa.', 403);
    }

    const allowed = ['title', 'content', 'subject', 'tags', 'status'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await post.update(updates);
    res.json({ success: true, message: 'Cập nhật thành công.', data: toSafePost(post) });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/posts/:id
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    if (post.user_id !== req.user.id && req.user.role !== 'admin') throw createError('Không có quyền xóa.', 403);

    await post.update({ status: 'deleted' }); // Soft delete
    res.json({ success: true, message: 'Xóa bài viết thành công.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPosts, getPostById, createPost, updatePost, deletePost };
