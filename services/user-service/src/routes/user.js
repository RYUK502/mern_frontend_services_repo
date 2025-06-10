const express = require('express');
const router = express.Router();
const {
  getUser,
  updateProfile,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  getUsersByIds, // Import the new controller
  getAllUsers, // Assuming you have this controller for GET /
  getUserFriends // Assuming you have this for GET /:id/friends
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// Define routes
router.get('/', verifyToken, getAllUsers);
router.get('/search', verifyToken, searchUsers);
router.get('/:id', verifyToken, getUser);
router.get('/:id/friends', verifyToken, getUserFriends);
router.put('/me', verifyToken, updateProfile);
router.post('/friend-request/:targetId', verifyToken, sendFriendRequest);
router.post('/friend-request/:targetId/accept', verifyToken, acceptFriendRequest);
router.post('/friend-request/:targetId/reject', verifyToken, rejectFriendRequest);
router.post('/:friendId/remove', verifyToken, removeFriend);
router.post('/batch', verifyToken, getUsersByIds); // Cleaned up route

module.exports = router;
