require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Serve uploads statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
app.use('/users', userRoutes);
app.use('/auth', authRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`User service running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('MongoDB error:', err));
