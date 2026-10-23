'use strict';

// EXT-01 — saved posts: no paid/private PDF, no hidden/deleted enumeration.
const { Bookmark, Post, User } = require('../models');
const { positiveId, readablePost } = require('../utils/interaction-target');
const { toSafePost } = require('../utils/post.dto');
const { createError } = require('../middlewares/error.middleware');

function boundedQuery(value, label, fallback, max) {
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

async function saveBookmark(req, res, next) {
  try {
    const postId = positiveId(req.params.id);
    // Same active/free visibility policy as Likes & Comments. No PDF bytes here.
    await readablePost(postId, req.user);
    await Bookmark.findOrCreate({
      where: { user_id: req.user.id, post_id: postId },
      defaults: { user_id: req.user.id, post_id: postId },
    });
    res.json({ success: true, data: { post_id: postId, bookmarked: true } });
  } catch (error) { next(error); }
}

async function removeBookmark(req, res, next) {
  try {
    const postId = positiveId(req.params.id);
    // Removal must still succeed for stale hidden/deleted/now-missing Posts,
    // without revealing any Post visibility or existence to this account.
    await Bookmark.destroy({
      where: { user_id: req.user.id, post_id: postId },
    });
    res.json({ success: true, data: { post_id: postId, bookmarked: false } });
  } catch (error) { next(error); }
}

async function listBookmarks(req, res, next) {
  try {
    const page = boundedQuery(req.query.page, 'page', 1, 10000);
    const limit = boundedQuery(req.query.limit, 'limit', 10, 50);
    const { count, rows } = await Bookmark.findAndCountAll({
      where: { user_id: req.user.id },
      include: [{
        model: Post, as: 'post', required: true,
        where: { status: 'active', price: 0 },
        include: [{
          model: User, as: 'author',
          attributes: ['id', 'full_name', 'avatar_url', 'university'],
        }],
      }],
      order: [['created_at', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    });
    res.json({
      success: true,
      data: rows.map(bookmark => toSafePost(bookmark.post)),
      pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
    });
  } catch (error) { next(error); }
}

module.exports = { saveBookmark, removeBookmark, listBookmarks };
