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
