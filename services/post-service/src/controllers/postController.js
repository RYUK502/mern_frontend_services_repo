const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  const { content, media } = req.body;
  const post = new Post({ userId: req.user.id, content, media, status: 'pending' });
  await post.save();
  res.status(201).json(post);
};

exports.updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post || post.userId !== req.user.id)
    return res.status(403).json({ message: 'Not allowed' });

  post.content = req.body.content || post.content;
  post.media = req.body.media || post.media;
  await post.save();
  res.json(post);
};

exports.deletePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  // Only author or admin can delete
  if (post.userId !== req.user.id && !(req.user.isAdmin === true || req.user.role === 'admin')) {
    return res.status(403).json({ message: 'Not allowed' });
  }
  await post.remove();
  res.json({ message: 'Post deleted' });
};

exports.getUserPosts = async (req, res) => {
  // User can see all their posts, admin can see any user's posts, others only approved
  if (req.user.id === req.params.userId || req.user.isAdmin === true || req.user.role === 'admin') {
    const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    return res.json(posts);
  }
  // Others see only approved
  const posts = await Post.find({ userId: req.params.userId, status: 'approved' }).sort({ createdAt: -1 });
  res.json(posts);
};

exports.getAllPosts = async (req, res) => {
  // Only approved posts are public
  const posts = await Post.find({ status: 'approved' }).sort({ createdAt: -1 });
  res.json(posts);
};

// --- Reactions ---
exports.reactToPost = async (req, res) => {
  const { emoji } = req.body;
  const post = await Post.findById(req.params.id);
  if (!post || post.status !== 'approved') return res.status(404).json({ message: 'Post not found or not public' });
  // Update or add reaction
  const existing = post.reactions.find(r => r.userId === req.user.id);
  if (existing) {
    existing.emoji = emoji;
  } else {
    post.reactions.push({ userId: req.user.id, emoji });
  }
  await post.save();
  res.json(post);
};

// --- Comments ---
exports.commentOnPost = async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'No comment' });
  const post = await Post.findById(req.params.id);
  if (!post || post.status !== 'approved') return res.status(404).json({ message: 'Post not found or not public' });
  post.comments.push({ userId: req.user.id, content });
  await post.save();
  res.json(post);
};

// --- Admin Moderation ---
exports.getPendingPosts = async (req, res) => {
  console.log('DEBUG req.user:', req.user);
  if (!(req.user.isAdmin === true || req.user.role === 'admin')) {
    console.log('DEBUG admin check failed:', req.user);
    return res.status(403).json({ message: 'Admin only' });
  }
  const posts = await Post.find({ status: 'pending' }).sort({ createdAt: -1 });
  res.json(posts);
};

const axios = require('axios');

exports.approvePost = async (req, res) => {
  if (!(req.user.isAdmin === true || req.user.role === 'admin')) {
    console.log('DEBUG admin check failed:', req.user);
    return res.status(403).json({ message: 'Admin only' });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    console.log('DEBUG post not found:', req.params.id);
    return res.status(404).json({ message: 'Post not found' });
  }
  post.status = 'approved';
  post.adminId = req.user.id;
  post.approvedAt = new Date();
  await post.save();
  console.log('DEBUG post approved:', post);

  // Notify chat-service for friend_post notification
  try {
    await axios.post('http://chat-service:PORT/api/notify/friend-post', {
      userId: post.userId,
      username: req.user.username, // You may want to fetch this from user-service if not present
      content: post.content,
      postId: post._id,
      createdAt: post.approvedAt,
    });
  } catch (err) {
    console.error('Failed to notify chat-service for friend post:', err.message);
  }

  res.json(post);
};

exports.rejectPost = async (req, res) => {
  if (!(req.user.isAdmin === true || req.user.role === 'admin')) {
    console.log('DEBUG admin check failed:', req.user);
    return res.status(403).json({ message: 'Admin only' });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    console.log('DEBUG post not found:', req.params.id);
    return res.status(404).json({ message: 'Post not found' });
  }
  post.status = 'rejected';
  post.adminId = req.user.id;
  post.rejectedAt = new Date();
  await post.save();
  console.log('DEBUG post rejected:', post);
  res.json(post);
};
