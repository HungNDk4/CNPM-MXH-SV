'use strict';
const router = require('express').Router();
const multer = require('multer');
const {
  getPosts,
  getPostById,
  getTrendingTopics,
  createPost,
  uploadImagesForPost,
  updatePost,
  deletePost,
} = require('../controllers/post.controller');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth.middleware');
const { moderatePost, listModerationAuditLogs } = require('../controllers/moderation.controller');
const { saveBookmark, removeBookmark, listBookmarks } = require('../controllers/bookmark.controller');
const { createError } = require('../middlewares/error.middleware');

const uploadPostImages = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },
}).array('images', 4);

function parsePostUpload(req, res, next) {
  uploadPostImages(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(createError('Ảnh đính kèm vượt quá dung lượng tối đa 5 MB.', 413));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(createError('Tối đa 4 ảnh cho mỗi bài viết.', 422));
    }
    if (error instanceof multer.MulterError) {
      return next(createError('Lỗi tải tệp ảnh: ' + error.code, 422));
    }
    return next(error);
  });
}

// EXT-01: static /bookmarks MUST precede dynamic /:id.
router.get('/bookmarks', authenticate, listBookmarks);
router.post('/:id/bookmark', authenticate, saveBookmark);
router.delete('/:id/bookmark', authenticate, removeBookmark);

// EXT-03 static Admin audit read; before generic post ID route.
router.get('/moderation/audit-logs', authenticate, authorize('admin'), listModerationAuditLogs);

// Optional authentication is scoped in the controller to active/free PDF metadata.
router.get('/trending-topics', optionalAuthenticate, getTrendingTopics);
router.get('/', optionalAuthenticate, getPosts);
router.get('/:id', optionalAuthenticate, getPostById);

// Protected routes
router.post('/', authenticate, parsePostUpload, createPost);
router.post('/:id/images', authenticate, parsePostUpload, uploadImagesForPost);
router.put('/:id', authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

// BE-08: explicit Admin-only post-publication hide/soft-delete.
router.patch('/:id/moderation', authenticate, authorize('admin'), moderatePost);

module.exports = router;
