require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const verifyAuth = require('./middleware/auth');

const app = express();
app.use(cors());

// PROXY ROUTES FIRST (no express.json() here)
app.use('/api/users', createProxyMiddleware({
  target: process.env.AUTH_USER_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/users': '/users' }
}));

app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_USER_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' }
}));

app.use('/api/posts', verifyAuth, createProxyMiddleware({
  target: process.env.POST_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/posts': '/' }
}));

app.use('/api/messages', verifyAuth, createProxyMiddleware({
  target: process.env.CHAT_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/messages': '/' }
}));

app.use('/api/friendships', verifyAuth, createProxyMiddleware({
  target: process.env.FRIENDSHIP_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/friendships': '/' }
}));

// If you have direct API routes handled by the gateway itself, add express.json() AFTER proxies:
// app.use(express.json());
// app.post('/api/some-direct-route', ...);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});