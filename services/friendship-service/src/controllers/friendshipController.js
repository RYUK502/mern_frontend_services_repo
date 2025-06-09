const Friendship = require('../models/Friendship');

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
  const request = await Friendship.findOneAndUpdate(
    { requester: req.body.requesterId, recipient: req.user.id },
    { status: 'accepted' },
    { new: true }
  );

  if (!request) return res.status(404).json({ message: 'Request not found' });

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

  res.json(requests);
};
