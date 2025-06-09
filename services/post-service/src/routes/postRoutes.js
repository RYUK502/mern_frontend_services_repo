const express = require('express');
const router = express.Router();
const {
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
  getAllPosts,
  reactToPost,
  commentOnPost,
  getPendingPosts,
  approvePost,
  rejectPost
} = require('../controllers/postController');
const { verifyToken } = require('../middleware/authMiddleware');

// User routes
router.post('/', verifyToken, createPost);
router.put('/:id', verifyToken, updatePost);
router.delete('/:id', verifyToken, deletePost);
router.get('/user/:userId', verifyToken, getUserPosts);
router.get('/', verifyToken, getAllPosts);

// Comments & Reactions
router.post('/:id/react', verifyToken, reactToPost);
router.post('/:id/comment', verifyToken, commentOnPost);

// Admin moderation
router.get('/admin/pending', verifyToken, getPendingPosts);
router.post('/admin/:id/approve', verifyToken, approvePost);
router.post('/admin/:id/reject', verifyToken, rejectPost);

module.exports = router;
