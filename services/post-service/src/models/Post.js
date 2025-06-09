const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  content: { type: String },
  media: [{ type: String }], // URLs of images/videos
  createdAt: { type: Date, default: Date.now },
  likes: [{ type: String }], // array of userIds who liked
  views: { type: Number, default: 0 }
});

module.exports = mongoose.model('Post', postSchema);
