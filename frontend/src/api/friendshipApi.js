import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }});
export const getFriendships = () => axios.get(`${GATEWAY_BASE_URL}/friendships/list`, authHeader());
export const addFriend = (data) => axios.post(`${GATEWAY_BASE_URL}/friendships`, data, authHeader());
export const removeFriend = (friendshipId) => axios.delete(`${GATEWAY_BASE_URL}/friendships/${friendshipId}`, authHeader());
