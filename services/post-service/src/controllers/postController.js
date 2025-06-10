const Post = require('../models/Post');
const axios = require('axios');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:5001/api/users';

async function enrichPostsWithUsers(posts, token) {
  if (!posts || posts.length === 0) {
    return [];
  }

  const userIds = [...new Set(posts.map(p => p.userId.toString()))];
  
  try {
    const usersResponse = await axios.post(`${USER_SERVICE_URL}/batch`, {
      ids: userIds
    }, {
      headers: { Authorization: token }
    });
    
    const usersMap = usersResponse.data.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    return posts.map(post => ({
      ...post,
      user: usersMap[post.userId.toString()] || { username: 'Unknown User', avatar: '' }
    }));
  } catch (err) {
    console.error('Failed to fetch users for posts:', err.message);
    return posts.map(post => ({ 
      ...post, 
      user: { username: 'Unknown User', avatar: '' } 
    }));
  }
}

exports.createPost = async (req, res) => {
  const { content, media } = req.body;
  const post = new Post({ userId: req.user.id, content, media, status: 'pending' });
  await post.save();
  res.status(201).json(post);
};

exports.updatePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: 'Post not found' });
  }

  // Only author or admin can update
  if (post.userId !== req.user.id && !(req.user.isAdmin === true || req.user.role === 'admin')) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  // Only text content can be edited. Media is permanent.
  if (req.body.content !== undefined) {
    post.content = req.body.content;
  }
  post.status = 'pending'; // After edit, post should be re-approved by admin
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
  await post.deleteOne();
  res.json({ message: 'Post deleted' });
};

exports.getUserPosts = async (req, res) => {
  let query;
  if (req.user.id === req.params.userId || req.user.isAdmin === true || req.user.role === 'admin') {
    query = { userId: req.params.userId };
  } else {
    query = { userId: req.params.userId, status: 'approved' };
  }
  try {
    const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
    const enrichedPosts = await enrichPostsWithUsers(posts, req.headers.authorization);
    res.json(enrichedPosts);
  } catch (err) {
    console.error('Error in getUserPosts:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({ status: 'approved' }).sort({ createdAt: -1 }).lean();
    const enrichedPosts = await enrichPostsWithUsers(posts, req.headers.authorization);
    res.json(enrichedPosts);
  } catch (err) {
    console.error('Error in getAllPosts:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
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
  if (!(req.user.isAdmin === true || req.user.role === 'admin')) {
    return res.status(403).json({ message: 'Admin only' });
  }
  try {
    const posts = await Post.find({ status: 'pending' }).sort({ createdAt: -1 }).lean();
    const enrichedPosts = await enrichPostsWithUsers(posts, req.headers.authorization);
    res.json(enrichedPosts);
  } catch (err) {
    console.error('Error in getPendingPosts:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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
