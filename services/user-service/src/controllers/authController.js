const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RegistrationOrder = require('../models/RegistrationOrder');

exports.register = async (req, res) => {
  try {
    const { username, email, password, bio, avatar } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    // Save registration order (pending approval)
    const order = new RegistrationOrder({ username, email, password: hashed, bio, avatar });
    await order.save();
    res.status(201).json({ message: 'Registration submitted. Awaiting admin approval.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: List all registration orders
exports.listOrders = async (req, res) => {
  try {
    const orders = await RegistrationOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: Approve a registration order (create user, delete order)
exports.approveOrder = async (req, res) => {
  try {
    const order = await RegistrationOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    // Check if user already exists
    const exists = await User.findOne({ email: order.email });
    if (exists) {
      await RegistrationOrder.findByIdAndDelete(order._id);
      return res.status(409).json({ message: 'User already exists. Order deleted.' });
    }
    const user = new User({
      username: order.username,
      email: order.email,
      password: order.password,
      bio: order.bio,
      avatar: order.avatar,
      isApproved: true,
      role: 'user'
    });
    await user.save();
    await RegistrationOrder.findByIdAndDelete(order._id);
    res.json({ message: 'User approved and registered.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: Reject a registration order (delete order)
exports.rejectOrder = async (req, res) => {
  try {
    const order = await RegistrationOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Registration order rejected and deleted.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isApproved)
      return res.status(403).json({ message: 'User not approved by admin' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};
// Logout endpoint (for JWT, simply instruct client to remove token)
exports.logout = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully.' });
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isApproved = true;
    await user.save();
    res.json({ message: 'User approved' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Admin: Reject (delete) a user by id
exports.rejectUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User rejected and deleted.' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
