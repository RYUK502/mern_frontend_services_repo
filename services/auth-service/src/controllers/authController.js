const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// URL of the user-service internal API
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002/internal';

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    // Call user-service to create user
    const response = await axios.post(`${USER_SERVICE_URL}/users`, {
      username,
      email,
      password: hashed,
      isApproved: false,
      role: 'user'
    });
    res.status(201).json({ message: 'User created. Awaiting admin approval.' });
  } catch (err) {
    res.status(400).json({ message: err.response?.data?.message || err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Fetch user by email from user-service
    const response = await axios.get(`${USER_SERVICE_URL}/users/email/${encodeURIComponent(email)}`);
    const user = response.data;
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isApproved)
      return res.status(403).json({ message: 'User not approved by admin' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: err.response?.data?.message || 'Invalid credentials' });
  }
};

exports.me = async (req, res) => {
  // Not implemented: would require another user-service call
  res.status(501).json({ message: 'Not implemented: use user-service for user info.' });
};

exports.approveUser = async (req, res) => {
  // Not implemented: would require another user-service call
  res.status(501).json({ message: 'Not implemented: use user-service for approval.' });
};
