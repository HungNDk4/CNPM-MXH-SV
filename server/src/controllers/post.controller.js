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
      order: req.query.sort === 'popular'
        ? [
            [sequelize.literal('(like_count + comment_count)'), 'DESC'],
            ['view_count', 'DESC'],
            ['created_at', 'DESC'],
            ['id', 'DESC']
          ]
        : [['created_at', 'DESC'], ['id', 'DESC']],
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
 * BE-11 / UX-01: GET /api/posts/my
 *
 * Owner-scoped, authenticated list independent of the public free-only feed.
 * Includes own hidden/deleted posts so moderation status is visible to the author.
 * NEVER accepts author_id from the client and NEVER includes private PDF paths.
 */
const getMyPosts = async (req, res, next) => {
  try {
    const permitted = ['page', 'limit', 'type', 'status', 'search', 'sort'];
    if (Object.keys(req.query).some(key => !permitted.includes(key))) {
      throw createError('Tham số danh sách bài viết cá nhân không hợp lệ.', 422);
    }
    const page = positiveIntQuery(req.query.page, 'page', 1, 10000);
    const limit = positiveIntQuery(req.query.limit, 'limit', 10, 50);
    const { type = 'all', status = 'all', sort = 'newest' } = req.query;
    if (typeof type !== 'string' || !['all', 'question', 'discussion', 'document'].includes(type)) {
      throw createError('Loại bài viết không hợp lệ.', 422);
    }
    if (typeof status !== 'string' || !['all', 'active', 'hidden', 'deleted'].includes(status)) {
      throw createError('Trạng thái bài viết không hợp lệ.', 422);
    }
    if (typeof sort !== 'string' || !['newest', 'engagement'].includes(sort)) {
      throw createError('Cách sắp xếp không hợp lệ.', 422);
    }
    const search = textQuery(req.query.search, 'search', 100);
    const userId = Number(req.user.id); // Trusted authenticated DB user; never a query parameter.
    const where = { user_id: userId };
    if (type !== 'all') where.post_type = type;
    if (status !== 'all') where.status = status;
    if (search !== undefined) {
      const pattern = '%' + escapeLike(search) + '%';
      where[Op.or] = [
        { title: { [Op.like]: pattern } },
        { content: { [Op.like]: pattern } },
      ];
    }

    const order = sort === 'engagement'
      ? [[sequelize.literal('(like_count + comment_count)'), 'DESC'],
          ['created_at', 'DESC'], ['id', 'DESC']]
      : [['created_at', 'DESC'], ['id', 'DESC']];
    const { count, rows } = await Post.findAndCountAll({
      where,
      attributes: { include: postEngagementAttributes(userId) },
      include: [
        { model: User, as: 'author', attributes: ['id', 'full_name', 'avatar_url', 'university', 'major'] },
        { model: PostImage, as: 'images', attributes: ['id', 'image_url', 'sort_order'], required: false },
      ],
      distinct: true,
      order,
      limit,
      offset: (page - 1) * limit,
    });
    res.json({
      success: true,
      data: rows.map(toSafePost),
      pagination: { total: count, page, limit, totalPages: Math.max(1, Math.ceil(count / limit)) },
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
    // Admin moderation MUST go through PATCH /:id/moderation, which atomically
    // writes a moderation_audit_logs row. Never provide an unaudited shortcut.
    if (req.user.role === 'admin') {
      throw createError('Quản trị viên phải dùng chức năng kiểm duyệt để ghi nhật ký.', 403);
    }
    if (post.user_id !== req.user.id) {
      throw createError('Không có quyền xóa.', 403);
    }
    if (post.status !== 'active') {
      throw createError('Bài viết đã thay đổi trạng thái.', 409);
    }
    // CAS: a concurrent Admin hide/delete wins over the owner's delete.
    // This also prevents the owner from overwriting a moderated status.
    const [affected] = await Post.update({ status: 'deleted' }, {
      where: { id, user_id: req.user.id, status: 'active' },
    });
    if (affected !== 1) throw createError('Trạng thái bài viết đã thay đổi.', 409);
    res.json({ success: true, message: 'Xóa bài viết thành công.' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/trending-topics
 * Returns Top real tags from active posts, falling back to top subjects
 */
const getTrendingTopics = async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      where: { status: 'active' },
      attributes: ['tags', 'subject'],
      raw: true,
    });

    const tagCounts = new Map();
    for (const p of posts) {
      let tags = [];
      if (Array.isArray(p.tags)) {
        tags = p.tags;
      } else if (typeof p.tags === 'string') {
        try {
          const parsed = JSON.parse(p.tags);
          tags = Array.isArray(parsed) ? parsed : p.tags.split(',');
        } catch {
          tags = p.tags.split(',');
        }
      }
      for (const rawTag of tags) {
        const clean = String(rawTag || '').trim().replace(/^#/, '');
        if (clean) {
          const key = clean.toLowerCase();
          const existing = tagCounts.get(key) || { topic: clean, count: 0, query: clean };
          existing.count += 1;
          tagCounts.set(key, existing);
        }
      }
    }

    let data = Array.from(tagCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Fallback if tags < 5: supplement with top subjects
    if (data.length < 5) {
      const subjectCounts = new Map();
      for (const p of posts) {
        if (p.subject && p.subject.trim()) {
          const s = p.subject.trim();
          subjectCounts.set(s, (subjectCounts.get(s) || 0) + 1);
        }
      }
      const existingQueries = new Set(data.map((d) => d.query.toLowerCase()));
      const topSubjects = Array.from(subjectCounts.entries())
        .filter(([sub]) => !existingQueries.has(sub.toLowerCase()))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5 - data.length)
        .map(([sub, count]) => ({ topic: sub, count, query: sub }));
      data = [...data, ...topSubjects];
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/my-stats
 * Real personal statistics for authenticated student: total posts, likes received, comments received, views.
 */
const getMyPostStats = async (req, res, next) => {
  try {
    const userId = Number(req.user.id);
    const totalPosts = await Post.count({
      where: { user_id: userId, status: 'active' },
    });

    const [likeResult] = await sequelize.query(
      `SELECT COUNT(l.id) AS total_likes
       FROM likes l
       JOIN posts p ON l.target_type = 'post' AND l.target_id = p.id
       WHERE p.user_id = :userId AND p.status = 'active'`,
      { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    );

    const [commentResult] = await sequelize.query(
      `SELECT COUNT(c.id) AS total_comments
       FROM comments c
       JOIN posts p ON c.post_id = p.id
       WHERE p.user_id = :userId AND p.status = 'active' AND c.status = 'active'`,
      { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    );

    const [viewResult] = await sequelize.query(
      `SELECT COALESCE(SUM(view_count), 0) AS total_views
       FROM posts
       WHERE user_id = :userId AND status = 'active'`,
      { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      success: true,
      data: {
        total_posts: totalPosts,
        total_likes: Number(likeResult?.total_likes || 0),
        total_comments: Number(commentResult?.total_comments || 0),
        total_views: Number(viewResult?.total_views || 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getMyPosts,
  getPostById,
  getTrendingTopics,
  getMyPostStats,
  createPost,
  uploadImagesForPost,
  updatePost,
  deletePost,
};

