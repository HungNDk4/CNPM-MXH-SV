const router = require('express').Router();
const { getPosts, getPostById, createPost, updatePost, deletePost } = require('../controllers/post.controller');
const { authenticate, optionalAuthenticate } = require('../middlewares/auth.middleware');

// Optional authentication is scoped in the controller to active/free PDF metadata.
router.get('/',    optionalAuthenticate, getPosts);
router.get('/:id', optionalAuthenticate, getPostById);

// Protected routes
router.post('/',       authenticate, createPost);
router.put('/:id',    authenticate, updatePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
