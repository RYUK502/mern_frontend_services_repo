require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function seedAdmin() {
  await mongoose.connect(process.env.MONGO_URI);
  const password = 'admin123'; // You can change this password
  const hash = await bcrypt.hash(password, 10);

  const admin = new User({
    username: 'admin',
    email: 'admin@example.com',
    password: hash,
    isApproved: true,
    role: 'admin',
    bio: 'Admin user',
    avatar: '',
    friends: [],
    friendRequests: []
  });

  await User.deleteOne({ email: admin.email }); // Remove existing admin if exists
  await admin.save();
  console.log('Admin user seeded:', { email: admin.email, password });
  mongoose.disconnect();
}

seedAdmin().catch(err => { console.error(err); mongoose.disconnect(); });
