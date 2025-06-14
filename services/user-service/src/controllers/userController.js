const User = require('../models/User');

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error in getUser:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { bio, avatar },
      { new: true }
    ).select('-email');
    res.json(user);
  } catch (err) {
    console.error('Error in updateProfile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === "") {
      return res.status(400).json({ message: "Query parameter is required" });
    }
    const users = await User.find({ username: { $regex: query, $options: 'i' } }).select('username avatar');
    res.json(users);
  } catch (err) {
    console.error('Error in searchUsers:', err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const target = await User.findById(req.params.targetId);
    if (!target || target.friendRequests.includes(req.user.id))
      return res.status(400).json({ message: 'Request invalid or already sent' });

    target.friendRequests.push(req.user.id);
    await target.save();
    res.json({ message: 'Friend request sent' });
  } catch (err) {
    console.error('Error in sendFriendRequest:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  try {
    const target = await User.findById(req.params.targetId);
    const user = await User.findById(req.user.id);

    if (!target || !user.friendRequests.includes(target._id))
      return res.status(400).json({ message: 'No friend request from user' });

    user.friends.push(target._id);
    target.friends.push(user._id);

    user.friendRequests = user.friendRequests.filter(id => id.toString() !== target._id.toString());
    await user.save();
    await target.save();

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    console.error('Error in acceptFriendRequest:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.rejectFriendRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== req.params.targetId);
    await user.save();
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    console.error('Error in rejectFriendRequest:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.removeFriend = async (req, res) => {
  const user = await User.findById(req.user.id);
  const friend = await User.findById(req.params.friendId);

  if (!user || !friend) return res.status(404).json({ message: 'User not found' });

  user.friends = user.friends.filter(id => id.toString() !== friend._id.toString());
  friend.friends = friend.friends.filter(id => id.toString() !== user._id.toString());

  await user.save();
  await friend.save();
  res.json({ message: 'Friend removed' });
};
