const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    path: '/api/messages/socket.io/',
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
    const jwt = require('jsonwebtoken');
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log('Socket connection rejected: no token');
      socket.disconnect();
      return;
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
    } catch (err) {
      console.log('Socket connection rejected: invalid token');
      socket.disconnect();
      return;
    }
    console.log('Socket connected:', socket.id);

    const Message = require('./models/Message');

    socket.on('private_message', async ({ senderId, receiverId, content }) => {
      // Save message to DB
      try {
        const msg = new Message({ senderId, receiverId, content });
        await msg.save();
        // Emit to receiver
        io.to(receiverId).emit('private_message', { senderId, content, createdAt: msg.createdAt });
        // Optionally, emit to sender for confirmation
        socket.emit('private_message', { senderId, content, createdAt: msg.createdAt });
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    socket.on('join', (userId) => {
      socket.join(userId);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
}

module.exports = setupSocket;
