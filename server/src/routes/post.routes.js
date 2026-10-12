const router = require('express').Router();
const { getPosts, getPostById, createPost, updatePost, deletePost } = require('../controllers/post.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Public routes (có thể có token, có thể không)
router.get('/',    authenticate, getPosts);     // dùng authenticate để kiểm tra access, không bắt buộc
router.get('/:id', authenticate, getPostById);

// Protected routes
router.post('/',       authenticate, createPost);
router.put('/:id',    authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
