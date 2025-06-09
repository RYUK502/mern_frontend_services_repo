const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String },
  media: [{ type: String }], // URLs of images/videos
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminId: { type: String }, // Admin who approved/rejected
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  comments: [{
    userId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  reactions: [{
    userId: { type: String, required: true },
    emoji: { type: String, required: true }
  }],
  likes: [{ type: String }], // array of userIds who liked
  views: { type: Number, default: 0 }
});

module.exports = mongoose.model('Post', postSchema);
