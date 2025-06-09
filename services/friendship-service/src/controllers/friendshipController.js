const Friendship = require('../models/Friendship');
const axios = require('axios');

exports.sendRequest = async (req, res) => {
  const { recipientId } = req.body;

  const existing = await Friendship.findOne({
    requester: req.user.id,
    recipient: recipientId
  });

  if (existing) return res.status(400).json({ message: 'Request already sent' });

  const request = new Friendship({
    requester: req.user.id,
    recipient: recipientId
  });

  await request.save();
  res.status(201).json(request);
};



exports.acceptRequest = async (req, res) => {
  const { requesterId } = req.body;
  const recipientId = req.user.id;

  const request = await Friendship.findOneAndUpdate(
    { requester: requesterId, recipient: recipientId },
    { status: 'accepted' },
    { new: true }
  );

  if (!request) return res.status(404).json({ message: 'Request not found' });

  // Add each user to the other's friends array via user-service
  try {
    // Assuming USER_SERVICE_URL is set in env, e.g., http://user-service:PORT or http://localhost:5001
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5001';
    // Add recipient to requester's friends
    await axios.post(`${USER_SERVICE_URL}/users/add-friend`, {
      userId: requesterId,
      friendId: recipientId
    });
    // Add requester to recipient's friends
    await axios.post(`${USER_SERVICE_URL}/users/add-friend`, {
      userId: recipientId,
      friendId: requesterId
    });
  } catch (err) {
    // Log full error details for debugging
    if (err.response) {
      console.error('Failed to update friends in user-service:', {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      });
    } else if (err.request) {
      console.error('No response from user-service:', err.request);
    } else {
      console.error('Error setting up request to user-service:', err.message);
    }
  }

  res.json(request);
};

exports.rejectRequest = async (req, res) => {
  const request = await Friendship.findOneAndUpdate(
    { requester: req.body.requesterId, recipient: req.user.id },
    { status: 'rejected' },
    { new: true }
  );

  if (!request) return res.status(404).json({ message: 'Request not found' });

  res.json(request);
};

exports.removeFriend = async (req, res) => {
  const result = await Friendship.findOneAndDelete({
    $or: [
      { requester: req.user.id, recipient: req.body.friendId },
      { requester: req.body.friendId, recipient: req.user.id }
    ],
    status: 'accepted'
  });

  res.json({ message: result ? 'Friend removed' : 'Friend not found' });
};

exports.getFriends = async (req, res) => {
  const friendships = await Friendship.find({
    $or: [
      { requester: req.user.id, status: 'accepted' },
      { recipient: req.user.id, status: 'accepted' }
    ]
  });

  const friendIds = friendships.map(f =>
    f.requester === req.user.id ? f.recipient : f.requester
  );

  res.json(friendIds);
};



exports.getPending = async (req, res) => {
  const requests = await Friendship.find({
    recipient: req.user.id,
    status: 'pending'
  });

  // Get unique requester IDs
  const requesterIds = [...new Set(requests.map(r => r.requester))];

  let usersMap = {};
  try {
    const { data: users } = await axios.post(
      'http://localhost:5002/users/batch',
      { ids: requesterIds }
    );
    usersMap = users.reduce((map, user) => {
      map[user._id] = user;
      return map;
    }, {});
  } catch (e) {
    // fallback: empty map, or handle error as needed
  }

  // Attach user info to each request
  const populated = requests.map(reqObj => ({
    ...reqObj.toObject(),
    requesterUser: usersMap[reqObj.requester] || null
  }));

  res.json(populated);
};
