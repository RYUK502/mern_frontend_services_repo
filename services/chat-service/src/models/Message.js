const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  content: { type: String },
  media: { type: String }, // image/video URL
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  reactions: [
    {
      userId: { type: String, required: true },
      emoji: { type: String, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
