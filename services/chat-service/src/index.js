require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const messageRoutes = require('./routes/messageRoutes');
const setupSocket = require('./socket');

const app = express();
app.use(require('cors')());
app.use(express.json());
app.use('/', messageRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  const server = app.listen(process.env.PORT, () => {
    console.log(`Chat service on port ${process.env.PORT}`);
  });

  setupSocket(server);
});
