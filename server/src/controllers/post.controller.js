const { Post, User, DocumentAccess, Like } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { Op } = require('sequelize');

/**
 * GET /api/posts?page=1&limit=10&type=document&subject=cnpm&search=react
 */
const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, subject, search, minPrice, maxPrice } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'active' };
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
      data: rows,
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
    if (!post || post.status === 'deleted') throw createError('Bài viết không tồn tại.', 404);

    // Ẩn file_url nếu tài liệu có phí và chưa mua
    let responseData = post.toJSON();
    if (post.price > 0 && post.post_type === 'document') {
      if (!req.user) {
        responseData.file_url = null;
      } else {
        const hasAccess = await DocumentAccess.findOne({
          where: { user_id: req.user.id, post_id: post.id },
        });
        if (!hasAccess && post.user_id !== req.user.id) {
          responseData.file_url = null;
        }
      }
    }

    // Tăng view count
    await post.increment('view_count');

    res.json({ success: true, data: responseData });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts
 */
const createPost = async (req, res, next) => {
  try {
    const { title, content, post_type, price, subject, tags, file_url, file_name } = req.body;

    const post = await Post.create({
      user_id: req.user.id,
      title, content, post_type,
      price: parseFloat(price || 0),
      subject, tags,
      file_url, file_name,
    });

    // Nếu tài liệu miễn phí, tự động cấp quyền cho tác giả
    if (post.post_type === 'document') {
      await DocumentAccess.create({ user_id: req.user.id, post_id: post.id });
    }

    res.status(201).json({ success: true, message: 'Đăng bài thành công.', data: post });
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

    const allowed = ['title', 'content', 'subject', 'tags', 'status'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    await post.update(updates);
    res.json({ success: true, message: 'Cập nhật thành công.', data: post });
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
