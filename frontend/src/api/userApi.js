import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }});

// Get current logged-in user
// Get current logged-in user
export const getCurrentUser = () => axios.get(`${GATEWAY_BASE_URL}/auth/me`, authHeader());

export const getUser = (id) => axios.get(`${GATEWAY_BASE_URL}/users/${id}`, authHeader());
export const updateUser = (id, data) => axios.put(`${GATEWAY_BASE_URL}/users/${id}`, data, authHeader());
export const updateCurrentUser = (data) => axios.put(`${GATEWAY_BASE_URL}/users/me`, data, authHeader());

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return axios.post(`${GATEWAY_BASE_URL}/users/me/avatar`, formData, {
    ...authHeader(),
    headers: { 'Content-Type': 'multipart/form-data', ...authHeader().headers }
  });
};
export const deleteUser = (id) => axios.delete(`${GATEWAY_BASE_URL}/users/${id}`, authHeader());

// Get all users (for chat list)
export const getAllUsers = () => axios.get(`${GATEWAY_BASE_URL}/users`, authHeader());

// Search for users by username (case-insensitive)
export const searchUsers = (query) =>
  axios.get(`${GATEWAY_BASE_URL}/users/search`, {
    ...authHeader(),
    params: { query },
  });

// Get a user's friends
export const getUserFriends = (id) =>
  axios.get(`${GATEWAY_BASE_URL}/users/${id}/friends`, authHeader());
