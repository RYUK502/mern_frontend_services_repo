import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
});

export const getUser = (id) => axios.get(`${GATEWAY_BASE_URL}/users/${id}`, authHeader());

// Note: updateUser should use /users/me, not /users/:id
export const updateUser = (data) => axios.put(`${GATEWAY_BASE_URL}/users/me`, data, authHeader());

// There is NO delete user endpoint in your backend, so this should be removed or implemented.
// export const deleteUser = (id) => axios.delete(`${GATEWAY_BASE_URL}/users/${id}`, authHeader());

// Create a new post (user)
export const createPost = (data) =>
  axios.post(`${GATEWAY_BASE_URL}/posts`, data, authHeader());

// Fetch all approved posts (public feed)
export const fetchApprovedPosts = () =>
  axios.get(`${GATEWAY_BASE_URL}/posts`, authHeader());

// Fetch my posts (all statuses)
export const fetchMyPosts = (userId) =>
  axios.get(`${GATEWAY_BASE_URL}/posts/user/${userId}`, authHeader());

// Update a post (author only)
export const updatePost = (id, data) =>
  axios.put(`${GATEWAY_BASE_URL}/posts/${id}`, data, authHeader());

// Delete a post (admin or author)
export const deletePost = (id) =>
  axios.delete(`${GATEWAY_BASE_URL}/posts/${id}`, authHeader());

// Comment on a post
export const commentOnPost = (id, content) =>
  axios.post(`${GATEWAY_BASE_URL}/posts/${id}/comment`, { content }, authHeader());

// React to a post
export const reactToPost = (id, emoji) =>
  axios.post(`${GATEWAY_BASE_URL}/posts/${id}/react`, { emoji }, authHeader());

// Admin: Fetch all pending posts
export const fetchPendingPosts = () =>
  axios.get(`${GATEWAY_BASE_URL}/posts/admin/pending`, authHeader());

// Admin: Approve a post
export const approvePost = (id) =>
  axios.post(`${GATEWAY_BASE_URL}/posts/admin/${id}/approve`, {}, authHeader());

// Admin: Reject a post
export const rejectPost = (id) =>
  axios.post(`${GATEWAY_BASE_URL}/posts/admin/${id}/reject`, {}, authHeader());