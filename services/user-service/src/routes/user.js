const express = require('express');
const router = express.Router();
const {
  getUser,
  updateProfile,
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend
} = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/:id', verifyToken, getUser);
router.put('/me', verifyToken, updateProfile);
router.get('/search/:username', verifyToken, searchUsers);

router.post('/friend-request/:targetId', verifyToken, sendFriendRequest);
router.post('/friend-request/:targetId/accept', verifyToken, acceptFriendRequest);
router.post('/friend-request/:targetId/reject', verifyToken, rejectFriendRequest);
router.delete('/friend/:friendId', verifyToken, removeFriend);

module.exports = router;
