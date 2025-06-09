const Post = require('../models/Post');

exports.createPost = async (req, res) => {
  const { content, media } = req.body;
  const post = new Post({ userId: req.user.id, content, media });
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
  if (!post || post.userId !== req.user.id)
    return res.status(403).json({ message: 'Not allowed' });

  await post.remove();
  res.json({ message: 'Post deleted' });
};

exports.getUserPosts = async (req, res) => {
  const posts = await Post.find({ userId: req.params.userId }).sort({ createdAt: -1 });
  res.json(posts);
};

exports.getAllPosts = async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
};

exports.likePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  if (!post.likes.includes(req.user.id)) {
    post.likes.push(req.user.id);
    await post.save();
  }

  res.json({ message: 'Liked' });
};

exports.unlikePost = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  post.likes = post.likes.filter(id => id !== req.user.id);
  await post.save();
  res.json({ message: 'Unliked' });
};

exports.getPostStats = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });

  res.json({
    likes: post.likes.length,
    views: post.views
  });
};
