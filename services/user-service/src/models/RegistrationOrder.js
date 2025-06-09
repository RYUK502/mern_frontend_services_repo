const mongoose = require('mongoose');

const registrationOrderSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String, // hashed!
  bio: String,
  avatar: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RegistrationOrder', registrationOrderSchema);