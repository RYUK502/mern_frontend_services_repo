import React, { useState } from 'react';
import './RegisterPage.css';
import { register } from '../api/authApi'; // Adjust path as needed

const RegisterPage = ({ onSwitchToLogin }) => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
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
    setSuccess(false);
    try {
      console.log('Register submit:', form);
      const res = await register(form);
      console.log('Register response:', res);
      setSuccess(true);
      setMessage('Registration successful! Awaiting admin approval.');
    } catch (err) {
      console.error('Register error:', err);
      setMessage(
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please check your connection and input.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} autoComplete="off">
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          required
          autoComplete="username"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          autoComplete="new-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-blue-600 hover:underline bg-transparent border-none p-0 m-0 cursor-pointer"
        >
          Login
        </button>
      </div>
      {message && (
        <div className="auth-message" style={{ color: success ? 'green' : 'red' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default RegisterPage;