import { saveMessage, getMessagesByRoom } from '../repositories/index.repo.js';

export default class ChatService {
  static async sendMessage(data) {
    const message = { ...data, ts: new Date() };
    return saveMessage(message);
  }

  static async getHistory(room) {
    return getMessagesByRoom(room);
  }
}
