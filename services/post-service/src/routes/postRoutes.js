const express = require('express');
const router = express.Router();
const {
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
  getAllPosts,
  likePost,
  unlikePost,
  getPostStats
} = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);
router.get('/user/:userId', verifyToken, getUserPosts);
router.get('/', verifyToken, getAllPosts);
router.post('/:id/like', verifyToken, likePost);
router.post('/:id/unlike', verifyToken, unlikePost);
router.get('/:id/stats', verifyToken, getPostStats);

module.exports = router;
