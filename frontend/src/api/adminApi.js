import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }
});

export const fetchOrders = () =>
  axios.get(`${GATEWAY_BASE_URL}/auth/orders`, authHeader());

export const approveOrder = (id) =>
  axios.post(`${GATEWAY_BASE_URL}/auth/orders/${id}/approve`, {}, authHeader());

export const rejectOrder = (id) =>
  axios.delete(`${GATEWAY_BASE_URL}/auth/orders/${id}/reject`, authHeader());