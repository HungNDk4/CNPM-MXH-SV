'use strict';
const { Post, User, PostImage, sequelize } = require('../models');
const { createError } = require('../middlewares/error.middleware');
const { Op } = require('sequelize');
const { toSafePost } = require('../utils/post.dto');
const { positiveId } = require('../utils/interaction-target');
const { validateCreatePost, validateEditPost } = require('../utils/post-input');
const { savePostImages } = require('../services/post-image-storage');

/**
 * Computed subqueries for engagement metrics (eliminates N+1 queries)
 */
const postEngagementAttributes = (userId) => [
  [
    sequelize.literal(
      '(SELECT COUNT(*) FROM `likes` WHERE `likes`.`target_type` = "post" AND `likes`.`target_id` = `Post`.`id`)'
    ),
    'like_count',
  ],
  [
    sequelize.literal(
      '(SELECT COUNT(*) FROM `comments` WHERE `comments`.`post_id` = `Post`.`id` AND `comments`.`status` = "active")'
    ),
    'comment_count',
  ],
  userId
    ? [
        sequelize.literal(
          `(SELECT COUNT(*) > 0 FROM \`likes\` WHERE \`likes\`.\`target_type\` = "post" AND \`likes\`.\`target_id\` = \`Post\`.\`id\` AND \`likes\`.\`user_id\` = ${Number(userId)})`
        ),
        'is_liked',
      ]
    : [sequelize.literal('0'), 'is_liked'],
  userId
    ? [
        sequelize.literal(
          `(SELECT COUNT(*) > 0 FROM \`bookmarks\` WHERE \`bookmarks\`.\`post_id\` = \`Post\`.\`id\` AND \`bookmarks\`.\`user_id\` = ${Number(userId)})`
        ),
        'is_bookmarked',
      ]
    : [sequelize.literal('0'), 'is_bookmarked'],
];

/**
 * GET /api/posts?page=1&limit=10&type=document&subject=cnpm&search=react
 */
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
    const authorId = req.query.author_id !== undefined
      ? positiveIntQuery(req.query.author_id, 'author_id', undefined, 1000000)
      : undefined;
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
    if (authorId !== undefined) where.user_id = authorId;
    if (subject !== undefined) where.subject = { [Op.like]: '%' + escapeLike(subject) + '%' };
    if (search !== undefined) {
      const pattern = '%' + escapeLike(search) + '%';
      where[Op.or] = [
        { title: { [Op.like]: pattern } },
        { content: { [Op.like]: pattern } },
        sequelize.literal(`\`Post\`.\`tags\` LIKE ${sequelize.escape(pattern)}`),
      ];
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      const bounds = {};
      if (minPrice !== undefined) bounds[Op.gte] = minPrice;
      if (maxPrice !== undefined) bounds[Op.lte] = maxPrice;
      where[Op.and] = [{ price: bounds }];
    }

    const userId = req.user ? Number(req.user.id) : null;
    const { count, rows } = await Post.findAndCountAll({
      where,
      attributes: {
        include: postEngagementAttributes(userId),
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university', 'major'] },
        { model: PostImage, as: 'images', attributes: ['id', 'image_url', 'sort_order'], required: false },
      ],
      distinct: true,
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
    const id = positiveId(req.params.id);
    const userId = req.user ? Number(req.user.id) : null;
    const post = await Post.findByPk(id, {
      attributes: {
        include: postEngagementAttributes(userId),
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university', 'major'] },
        { model: PostImage, as: 'images', attributes: ['id', 'image_url', 'sort_order'], required: false },
      ],
    });
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    if (post.status !== 'active' || Number(post.price) !== 0) {
      throw createError('Bài viết không tồn tại.', 404);
    }
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
 * Supports both JSON and multipart form data with images (up to 4)
 */
const createPost = async (req, res, next) => {
  try {
    const values = validateCreatePost(req.body);
    const files = req.files || [];

    const post = await sequelize.transaction(async (transaction) => {
      const created = await Post.create({ ...values, user_id: req.user.id }, { transaction });
      if (files.length > 0) {
        await savePostImages(files, created.id, transaction);
      }
      return created;
    });

    const fullPost = await Post.findByPk(post.id, {
      attributes: {
        include: postEngagementAttributes(req.user.id),
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university'] },
        { model: PostImage, as: 'images', attributes: ['id', 'image_url', 'sort_order'], required: false },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Đăng bài thành công.',
      data: toSafePost(fullPost),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/posts/:id/images
 * Upload images for an existing post (up to 4 images total)
 */
const uploadImagesForPost = async (req, res, next) => {
  try {
    const id = positiveId(req.params.id);
    const post = await Post.findByPk(id);
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    if (post.user_id !== req.user.id && req.user.role !== 'admin') {
      throw createError('Không có quyền thêm ảnh vào bài viết này.', 403);
    }

    const files = req.files || [];
    if (!files.length) {
      throw createError('Vui lòng chọn ít nhất một hình ảnh.', 422);
    }

    const existingCount = await PostImage.count({ where: { post_id: id } });
    if (existingCount + files.length > 4) {
      throw createError(`Bài viết đã có ${existingCount} ảnh, tối đa 4 ảnh cho mỗi bài viết.`, 422);
    }

    const saved = await sequelize.transaction(async (transaction) => {
      return savePostImages(files, id, transaction);
    });

    res.status(201).json({
      success: true,
      message: 'Tải ảnh lên thành công.',
      data: saved.map(img => img.image_url),
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
    const id = positiveId(req.params.id);
    const post = await Post.findByPk(id);
    if (!post) throw createError('Bài viết không tồn tại.', 404);
    const admin = req.user.role === 'admin';
    if (!admin && post.user_id !== req.user.id) {
      throw createError('Không có quyền sửa bài.', 403);
    }
    if (post.status !== 'active') {
      throw createError('Không thể sửa bài viết đã ẩn hoặc xóa.', 403);
    }
    const changes = validateEditPost(req.body);

    const where = { id, status: post.status };
    if (!admin) where.user_id = req.user.id;
    const [affected] = await Post.update(changes, { where });
    if (affected !== 1) throw createError('Trạng thái bài viết đã thay đổi.', 409);

    const updated = await Post.findByPk(id, {
      attributes: {
        include: postEngagementAttributes(req.user.id),
      },
      include: [
        { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university'] },
        { model: PostImage, as: 'images', attributes: ['id', 'image_url', 'sort_order'], required: false },
      ],
    });
    res.json({ success: true, message: 'Cập nhật thành công.', data: toSafePost(updated) });
  } catch (error) {
    next(error);
  }
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
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/trending-topics
 * Returns Top real subjects/topics based on active post counts
 */
const getTrendingTopics = async (req, res, next) => {
  try {
    const topics = await Post.findAll({
      where: {
        status: 'active',
        subject: { [Op.ne]: null },
      },
      attributes: [
        'subject',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['subject'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true,
    });

    const data = topics
      .filter((t) => t.subject && t.subject.trim())
      .map((t) => ({
        topic: t.subject,
        count: Number(t.count) || 0,
        query: t.subject,
      }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPostById,
  getTrendingTopics,
  createPost,
  uploadImagesForPost,
  updatePost,
  deletePost,
};
