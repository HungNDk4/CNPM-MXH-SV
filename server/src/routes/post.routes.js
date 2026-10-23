const router = require('express').Router();
const { getPosts, getPostById, createPost, updatePost, deletePost } = require('../controllers/post.controller');
const { authenticate, optionalAuthenticate, authorize } = require('../middlewares/auth.middleware');
const { moderatePost } = require('../controllers/moderation.controller');

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
