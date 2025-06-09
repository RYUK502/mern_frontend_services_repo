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

// Admin: Fetch all posts pending moderation
export const fetchPosts = () =>
  axios.get(`${GATEWAY_BASE_URL}/admin/posts`, authHeader());

// Admin: Approve a post
export const approvePost = (id) =>
  axios.post(`${GATEWAY_BASE_URL}/admin/posts/${id}/approve`, {}, authHeader());

// Admin: Reject a post
export const rejectPost = (id) =>
  axios.post(`${GATEWAY_BASE_URL}/admin/posts/${id}/reject`, {}, authHeader());