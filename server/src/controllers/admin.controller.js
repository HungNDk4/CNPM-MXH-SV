'use strict';

const { sequelize, Post, User, Comment, Like } = require('../models');
const { createError } = require('../middlewares/error.middleware');

function positiveInt(value, fallback, max) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  if (!Number.isSafeInteger(num) || num <= 0) return fallback;
  return Math.min(num, max);
}

const escapeLike = (value) => value.replace(/[\\%_]/g, '\\$&');

/**
 * GET /api/posts/admin/overview
 * System-wide real statistics, post status distribution, interaction metrics, and daily trends.
 */
const getAdminOverview = async (req, res, next) => {
  try {
    // 1. Post counts by status
    const statusRows = await Post.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });
    const postsByStatus = { active: 0, hidden: 0, deleted: 0 };
    let totalPosts = 0;
    for (const row of statusRows) {
      const c = Number(row.count) || 0;
      if (postsByStatus[row.status] !== undefined) {
        postsByStatus[row.status] = c;
      }
      totalPosts += c;
    }

    // 2. Post counts by type (active posts)
    const typeRows = await Post.findAll({
      where: { status: 'active' },
      attributes: ['post_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['post_type'],
      raw: true,
    });
    const postsByType = { question: 0, document: 0, discussion: 0 };
    for (const row of typeRows) {
      if (postsByType[row.post_type] !== undefined) {
        postsByType[row.post_type] = Number(row.count) || 0;
      }
    }

    // 3. Interactions (likes on posts, active comments, total views)
    const totalLikes = await Like.count({ where: { target_type: 'post' } });
    const totalComments = await Comment.count({ where: { status: 'active' } });
    const totalViewsResult = await Post.sum('view_count', { where: { status: 'active' } });
    const totalViews = Number(totalViewsResult) || 0;

    // 4. Activity trends: posts created per day over the last 14 days
    const [trendRows] = await sequelize.query(
      `SELECT DATE(created_at) AS date, COUNT(id) AS count
       FROM posts
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    res.json({
      success: true,
      data: {
        metrics: {
          total_posts: totalPosts,
          active_posts: postsByStatus.active,
          hidden_posts: postsByStatus.hidden,
          deleted_posts: postsByStatus.deleted,
          total_likes: totalLikes,
          total_comments: totalComments,
          total_views: totalViews,
          engagement: totalLikes + totalComments,
        },
        posts_by_type: postsByType,
        daily_trends: (trendRows || []).map((r) => ({
          date: r.date,
          count: Number(r.count) || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/admin/analytics
 * Rankings: most-liked, most-commented, most-viewed active posts & engagement comparison by type.
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Top 5 most-liked active posts
    const [topLiked] = await sequelize.query(
      `SELECT p.id, p.title, p.post_type, p.view_count, p.created_at,
              u.id AS author_id, u.full_name AS author_name,
              COUNT(l.id) AS like_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.target_type = 'post' AND l.target_id = p.id
       WHERE p.status = 'active'
       GROUP BY p.id, u.id
       ORDER BY like_count DESC, p.id DESC
       LIMIT 5`
    );

    // 2. Top 5 most-commented active posts
    const [topCommented] = await sequelize.query(
      `SELECT p.id, p.title, p.post_type, p.view_count, p.created_at,
              u.id AS author_id, u.full_name AS author_name,
              COUNT(c.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN comments c ON c.post_id = p.id AND c.status = 'active'
       WHERE p.status = 'active'
       GROUP BY p.id, u.id
       ORDER BY comment_count DESC, p.id DESC
       LIMIT 5`
    );

    // 3. Top 5 most-viewed active posts
    const topViewed = await Post.findAll({
      where: { status: 'active' },
      attributes: ['id', 'title', 'post_type', 'view_count', 'created_at'],
      include: [{ model: User, as: 'author', attributes: ['id', 'full_name'] }],
      order: [['view_count', 'DESC'], ['id', 'DESC']],
      limit: 5,
    });

    // 4. Engagement comparisons by post type
    const [typeEngagement] = await sequelize.query(
      `SELECT p.post_type,
              COUNT(DISTINCT p.id) AS post_count,
              COALESCE(SUM(p.view_count), 0) AS total_views,
              (SELECT COUNT(l.id) FROM likes l JOIN posts p2 ON l.target_type = 'post' AND l.target_id = p2.id WHERE p2.post_type = p.post_type AND p2.status = 'active') AS total_likes,
              (SELECT COUNT(c.id) FROM comments c JOIN posts p3 ON c.post_id = p3.id WHERE p3.post_type = p.post_type AND p3.status = 'active' AND c.status = 'active') AS total_comments
       FROM posts p
       WHERE p.status = 'active'
       GROUP BY p.post_type`
    );

    res.json({
      success: true,
      data: {
        top_liked: (topLiked || []).map((p) => ({
          id: p.id,
          title: p.title,
          post_type: p.post_type,
          view_count: Number(p.view_count) || 0,
          like_count: Number(p.like_count) || 0,
          created_at: p.created_at,
          author_id: p.author_id,
          author_name: p.author_name,
        })),
        top_commented: (topCommented || []).map((p) => ({
          id: p.id,
          title: p.title,
          post_type: p.post_type,
          view_count: Number(p.view_count) || 0,
          comment_count: Number(p.comment_count) || 0,
          created_at: p.created_at,
          author_id: p.author_id,
          author_name: p.author_name,
        })),
        top_viewed: topViewed.map((p) => ({
          id: p.id,
          title: p.title,
          post_type: p.post_type,
          view_count: Number(p.view_count) || 0,
          created_at: p.created_at,
          author_id: p.author?.id,
          author_name: p.author?.full_name,
        })),
        by_type: (typeEngagement || []).map((t) => ({
          post_type: t.post_type,
          post_count: Number(t.post_count) || 0,
          total_views: Number(t.total_views) || 0,
          total_likes: Number(t.total_likes) || 0,
          total_comments: Number(t.total_comments) || 0,
          engagement: (Number(t.total_likes) || 0) + (Number(t.total_comments) || 0),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/posts/admin/manage
 * Full list of posts across all statuses (active, hidden, deleted) with filters & pagination.
 */
const getAdminPosts = async (req, res, next) => {
  try {
    const page = positiveInt(req.query.page, 1, 10000);
    const limit = positiveInt(req.query.limit, 15, 50);
    const status = req.query.status && ['active', 'hidden', 'deleted'].includes(req.query.status)
      ? req.query.status
      : undefined;
    const type = req.query.type && ['question', 'document', 'discussion'].includes(req.query.type)
      ? req.query.type
      : undefined;
    const search = typeof req.query.search === 'string' && req.query.search.trim()
      ? req.query.search.trim()
      : undefined;

    const where = {};
    if (status) where.status = status;
    if (type) where.post_type = type;

    // Search condition
    let searchCondition = '';
    const replacements = { limit, offset: (page - 1) * limit };

    if (search) {
      replacements.searchPattern = `%${escapeLike(search)}%`;
      searchCondition = `AND (p.title LIKE :searchPattern OR u.full_name LIKE :searchPattern)`;
    }

    let statusCondition = '';
    if (status) {
      replacements.status = status;
      statusCondition = `AND p.status = :status`;
    }

    let typeCondition = '';
    if (type) {
      replacements.type = type;
      typeCondition = `AND p.post_type = :type`;
    }

    // Count query
    const [countResult] = await sequelize.query(
      `SELECT COUNT(p.id) AS total
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE 1=1 ${statusCondition} ${typeCondition} ${searchCondition}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    );
    const total = Number(countResult?.total || 0);

    // Rows query
    const [rows] = await sequelize.query(
      `SELECT p.id, p.title, p.content, p.post_type, p.status, p.price,
              p.view_count, p.created_at, p.updated_at,
              u.id AS author_id, u.full_name AS author_name, u.email AS author_email,
              (SELECT COUNT(*) FROM likes l WHERE l.target_type = 'post' AND l.target_id = p.id) AS like_count,
              (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'active') AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE 1=1 ${statusCondition} ${typeCondition} ${searchCondition}
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT :limit OFFSET :offset`,
      { replacements }
    );

    res.json({
      success: true,
      data: (rows || []).map((r) => ({
        id: r.id,
        title: r.title,
        content: r.content,
        post_type: r.post_type,
        status: r.status,
        price: Number(r.price || 0).toFixed(2),
        view_count: Number(r.view_count) || 0,
        like_count: Number(r.like_count) || 0,
        comment_count: Number(r.comment_count) || 0,
        created_at: r.created_at,
        updated_at: r.updated_at,
        author: {
          id: r.author_id,
          full_name: r.author_name,
          email: r.author_email,
        },
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminOverview,
  getAdminAnalytics,
  getAdminPosts,
};

