const router = require('express').Router();
const { getPosts, getPostById, createPost, updatePost, deletePost } = require('../controllers/post.controller');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth.middleware');
const { moderatePost, listModerationAuditLogs } = require('../controllers/moderation.controller');
const { saveBookmark, removeBookmark, listBookmarks } = require('../controllers/bookmark.controller');

// EXT-01: static /bookmarks MUST precede dynamic /:id.
router.get('/bookmarks', authenticate, listBookmarks);
router.post('/:id/bookmark', authenticate, saveBookmark);
router.delete('/:id/bookmark', authenticate, removeBookmark);

// EXT-03 static Admin audit read; before generic post ID route.
router.get('/moderation/audit-logs', authenticate, authorize('admin'), listModerationAuditLogs);

// Optional authentication is scoped in the controller to active/free PDF metadata.
router.get('/',    optionalAuthenticate, getPosts);
router.get('/:id', optionalAuthenticate, getPostById);

// Protected routes
router.post('/',       authenticate, createPost);
router.put('/:id',    authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

// BE-08: explicit Admin-only post-publication hide/soft-delete.
router.patch('/:id/moderation', authenticate, authorize('admin'), moderatePost);

module.exports = router;
