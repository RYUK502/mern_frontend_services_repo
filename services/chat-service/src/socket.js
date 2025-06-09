const { Server } = require("socket.io");

function setupSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', socket => {
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
