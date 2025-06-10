require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const routes = require('./routes/friendshipRoutes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/friendships', routes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('USER_SERVICE_URL:', process.env.USER_SERVICE_URL);
  app.listen(process.env.PORT, () =>
    console.log(`Friendship service on port ${process.env.PORT}`)
  );
});
