require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const postRoutes = require('./routes/postRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

// Serve uploads directory statically
const path = require('path');
const uploadsAbsolutePath = require('path').resolve(__dirname, '../uploads');
console.log('STATIC SERVING uploads from:', uploadsAbsolutePath);
app.use('/uploads', express.static(uploadsAbsolutePath));

// Mount media upload routes
app.use('/media', mediaRoutes);

app.use('/', postRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`Post service running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));
