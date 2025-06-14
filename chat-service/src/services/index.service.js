const {
  saveMessage,
  getMessagesByRoom,
  getMessagesByUserId,
} = require('../repositories/message.repo.js');

class ChatService {
  static async send(data) {
    return saveMessage({
      room: data.room,
      sender: data.sender,
      receiver: data.receiver,
      text: data.text,
      ts: new Date(),
    });
  }

  static async historyByRoom(room) {
    return getMessagesByRoom(room);
  }

  static async historyByUser(userId) {
    return getMessagesByUserId(userId);
  }
}

module.exports = ChatService;
