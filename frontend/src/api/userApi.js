import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }});

// Get current logged-in user
// Get current logged-in user
export const getCurrentUser = () => axios.get(`${GATEWAY_BASE_URL}/auth/me`, authHeader());

export const getUser = (id) => axios.get(`${GATEWAY_BASE_URL}/users/${id}`, authHeader());
export const updateUser = (id, data) => axios.put(`${GATEWAY_BASE_URL}/users/${id}`, data, authHeader());
export const deleteUser = (id) => axios.delete(`${GATEWAY_BASE_URL}/users/${id}`, authHeader());
