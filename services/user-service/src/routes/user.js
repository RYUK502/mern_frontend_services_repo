const mongoose = require('mongoose');
const User = require('../models/User');
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

router.get('/search', verifyToken, searchUsers);
// Place /:id/friends and /:id routes after /search to avoid route conflicts
router.get('/:id/friends', async (req, res) => {
  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Validate all friend IDs
    const invalidFriendIds = (user.friends || []).filter(fid => !mongoose.Types.ObjectId.isValid(fid));
    if (invalidFriendIds.length > 0) {
      return res.status(400).json({ message: 'User has invalid friend IDs', invalidFriendIds });
    }
    // Populate friends
    await user.populate('friends', 'username email avatar bio');
    res.json(user.friends);
  } catch (err) {
    console.error('Error in /users/:id/friends:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
});
router.get('/:id', verifyToken, getUser);
router.put('/me', verifyToken, updateProfile);

router.post('/friend-request/:targetId', verifyToken, sendFriendRequest);
router.post('/friend-request/:targetId/accept', verifyToken, acceptFriendRequest);
router.post('/friend-request/:targetId/reject', verifyToken, rejectFriendRequest);
router.delete('/friend/:friendId', verifyToken, removeFriend);

// Add a friend to a user's friends list (used by friendship service)
router.post('/add-friend', async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: 'Invalid userId or friendId' });
    }
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Only add if not already a friend
    if (!user.friends.map(id => id.toString()).includes(friendId)) {
      user.friends.push(friendId);
      await user.save();
    }
    res.json({ message: 'Friend added' });
  } catch (err) {
    console.error('Error in /users/add-friend:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// Batch fetch users by IDs
router.post('/batch', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: 'ids must be a non-empty array' });
  }
  try {
    const users = await User.find({ _id: { $in: ids } }).select('username avatar');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user's friends


router.get('/:id/friends', async (req, res) => {
  try {
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    // Validate all friend IDs
    const invalidFriendIds = (user.friends || []).filter(fid => !mongoose.Types.ObjectId.isValid(fid));
    if (invalidFriendIds.length > 0) {
      return res.status(400).json({ message: 'User has invalid friend IDs', invalidFriendIds });
    }
    // Populate friends
    await user.populate('friends', 'username email avatar bio');
    res.json(user.friends);
  } catch (err) {
    console.error('Error in /users/:id/friends:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
});

module.exports = router;
