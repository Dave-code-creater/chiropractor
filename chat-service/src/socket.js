const jwt = require('jsonwebtoken');
const Message = require('./models/message.model.js');
const Conversation = require('./models/conversation.model.js');

function initSocket(server) {
  const { Server } = require('socket.io');
  const io = new Server(server, { cors: { origin: '*' } });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Invalid token'));
    try {
      const payload = jwt.verify(token, process.env.PUBLIC_KEY);
      socket.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const me = socket.user.sub;

    socket.on('join', (convoId) => {
      socket.join(convoId);
    });

    socket.on('message', async ({ conversationId, content }) => {
      const convo = await Conversation.findOne({ _id: conversationId, participants: me });
      if (!convo) return socket.emit('error', 'Forbidden');
      const msg = await Message.create({ conversation: conversationId, sender: me, content });
      convo.updatedAt = Date.now();
      await convo.save();
      io.to(conversationId).emit('message', msg);
    });
  });

  return io;
}

module.exports = initSocket;
