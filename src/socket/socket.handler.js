const { info } = require('../utils/logger');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    info(`🔌 Socket connected: ${socket.id}`);

    // Join user to their personal room
    socket.on('join-user-room', (userId) => {
      socket.join(`user-${userId}`);
      info(`👤 User ${userId} joined their room`);
    });

    // Join conversation room
    socket.on('join-conversation', (conversationId) => {
      socket.join(`conversation-${conversationId}`);
      info(`💬 Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Handle new message
    socket.on('send-message', (data) => {
      info('📨 New message:', data);
      
      // Broadcast to conversation room
      socket.to(`conversation-${data.conversationId}`).emit('new-message', data);
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(`conversation-${data.conversationId}`).emit('user-stopped-typing', {
        userId: data.userId
      });
    });

    // Handle appointment notifications
    socket.on('appointment-update', (data) => {
      info('📅 Appointment update:', data);
      
      // Notify relevant users
      if (data.patientId) {
        io.to(`user-${data.patientId}`).emit('appointment-notification', data);
      }
      if (data.doctorId) {
        io.to(`user-${data.doctorId}`).emit('appointment-notification', data);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      info(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler; 