import axios from 'axios';
import { GATEWAY_BASE_URL } from './gateway';

export const login = (credentials) =>
  axios.post(`${GATEWAY_BASE_URL}/auth/login`, credentials, {
    headers: { 'Content-Type': 'application/json' }
  });

export const register = (data) =>
  axios.post(`${GATEWAY_BASE_URL}/auth/register`, data, {
    headers: { 'Content-Type': 'application/json' }
  });

// Logout endpoint
export const logout = () =>
  axios.post(`${GATEWAY_BASE_URL}/auth/logout`, {}, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('jwt')}`
    }
  });