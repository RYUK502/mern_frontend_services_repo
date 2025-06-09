import React, { useState } from 'react';
import './LoginPage.css';
import { login } from '../api/authApi';

const LoginPage = ({ onSwitchToRegister, onLoginSuccess }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await login(form);
      localStorage.setItem('jwt', res.data.token);
      setSuccess(true);
      setMessage('Login successful!');
      // After login, fetch user info to get username
      const token = res.data.token;
      let username;
      let role;
      try {
        const { getCurrentUser } = await import('../api/userApi');
        const userRes = await getCurrentUser();
        console.log('getCurrentUser response:', userRes.data);
        username = userRes.data.username;
        role = userRes.data.role;
      } catch (e) {
        username = undefined;
        role = undefined;
      }
      if (onLoginSuccess) onLoginSuccess(role, username);


    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {success ? (
        <div>
          <div className="auth-message" style={{ color: 'green' }}>{message}</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}
      <div className="mt-4 text-center">
        <span>Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
        >
          Register
        </button>
      </div>
      {message && !success && <div className="auth-message">{message}</div>}
    </div>
  );
};

export default LoginPage;