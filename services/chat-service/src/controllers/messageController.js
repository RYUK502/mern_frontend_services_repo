const Message = require('../models/Message');

exports.sendMessage = async (req, res) => {
  const { receiverId, content, media } = req.body;

  const message = new Message({
    senderId: req.user.id,
    receiverId,
    content,
    media
  });

  await message.save();
  res.status(201).json(message);
};

exports.getChatHistory = async (req, res) => {
  const messages = await Message.find({
    $or: [
      { senderId: req.user.id, receiverId: req.params.receiverId },
      { senderId: req.params.receiverId, receiverId: req.user.id }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
};

// Delete message (sender only)
exports.deleteMessage = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  if (message.senderId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  await message.deleteOne();
  res.json({ success: true });
};

// Update message (sender only)
exports.updateMessage = async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });
  if (message.senderId !== req.user.id) return res.status(403).json({ message: 'Forbidden' });
  message.content = req.body.content;
  await message.save();
  res.json(message);
};

// React to message (sender or receiver)
exports.reactToMessage = async (req, res) => {
  const { emoji } = req.body;
  const message = await Message.findById(req.params.messageId);
  if (!message) return res.status(404).json({ message: 'Message not found' });

  // Debug log for permission troubleshooting
  console.log('ReactToMessage DEBUG:', {
    paramId: req.params.messageId,
    userId: req.user.id,
    senderId: message.senderId,
    receiverId: message.receiverId,
    userIdType: typeof req.user.id,
    senderIdType: typeof message.senderId,
    receiverIdType: typeof message.receiverId,
  });

  if (![message.senderId, message.receiverId].includes(req.user.id)) return res.status(403).json({ message: 'Forbidden' });
  // Update or add reaction
  const existing = message.reactions.find(r => r.userId === req.user.id);
  if (existing) {
    existing.emoji = emoji;
  } else {
    message.reactions.push({ userId: req.user.id, emoji });
  }
  await message.save();
  res.json(message);
};
