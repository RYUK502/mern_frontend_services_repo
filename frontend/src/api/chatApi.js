import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }});
export const getMessages = (conversationId) => axios.get(`${GATEWAY_BASE_URL}/messages/${conversationId}`, authHeader());
export const sendMessage = (data) => axios.post(`${GATEWAY_BASE_URL}/messages`, data, authHeader());
