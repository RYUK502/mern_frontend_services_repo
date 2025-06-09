import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` }});
// Get chat history with a specific user
export const getMessages = (receiverId) => axios.get(`${GATEWAY_BASE_URL}/messages/${receiverId}`, authHeader());
// Send a message to a user
export const sendMessage = (data) => axios.post(`${GATEWAY_BASE_URL}/messages`, data, authHeader());
// Delete a message
export const deleteMessage = (messageId) => axios.delete(`${GATEWAY_BASE_URL}/messages/${messageId}`, authHeader());
// Update a message
export const updateMessage = (messageId, content) => axios.put(`${GATEWAY_BASE_URL}/messages/${messageId}`, { content }, authHeader());
// React to a message
export const reactToMessage = (messageId, emoji) => axios.post(`${GATEWAY_BASE_URL}/messages/${messageId}/react`, { emoji }, authHeader());
