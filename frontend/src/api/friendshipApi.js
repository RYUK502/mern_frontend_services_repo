import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
});

// Send a friend request
export const sendFriendRequest = (recipientId) =>
  axios.post(`${GATEWAY_BASE_URL}/friendships/request`, { recipientId }, authHeader());

// Accept a friend request
export const acceptFriendRequest = (requesterId) =>
  axios.post(`${GATEWAY_BASE_URL}/friendships/accept`, { requesterId }, authHeader());

// Reject a friend request
export const rejectFriendRequest = (requesterId) =>
  axios.post(`${GATEWAY_BASE_URL}/friendships/reject`, { requesterId }, authHeader());

// Remove a friend (expects friendId in body)
export const removeFriend = (friendId) =>
  axios.delete(`${GATEWAY_BASE_URL}/friendships/remove`, {
    ...authHeader(),
    data: { friendId }
  });

// List all friends
export const getFriendships = () =>
  axios.get(`${GATEWAY_BASE_URL}/friendships/list`, authHeader());

// List pending requests
export const getPendingFriendships = () =>
  axios.get(`${GATEWAY_BASE_URL}/friendships/pending`, authHeader());