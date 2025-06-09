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

    socket.on('private_message', ({ senderId, receiverId, content }) => {
      // Send directly to receiver
      io.to(receiverId).emit('private_message', { senderId, content });
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
