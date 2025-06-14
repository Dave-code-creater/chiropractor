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

  static async inboxForUser(userId) {
    const doctorId = parseInt(process.env.DOCTOR_ID || '1', 10);
    const staffId = parseInt(process.env.STAFF_ID || '2', 10);
    const messages = await getMessagesByUserId(userId);
    const contacts = new Set([doctorId, staffId]);
    for (const m of messages) {
      if (m.sender !== userId) contacts.add(m.sender);
      if (m.receiver !== userId) contacts.add(m.receiver);
    }
    return Array.from(contacts);
  }
}

module.exports = ChatService;
