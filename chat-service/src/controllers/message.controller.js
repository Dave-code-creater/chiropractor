const {
  saveMessage,
  getMessagesByRoom,
  getMessagesByUserId,
} = require('../repositories/message.repo.js');
const { CREATED, OK, InternalServerError } = require('../utils/httpResponses.js');

class MessageController {
  static async send(req, res) {
    try {
      const msg = await saveMessage({
        room: req.body.room,
        sender: req.body.sender,
        receiver: req.body.receiver,
        text: req.body.text,
        ts: new Date(),
      });
      return new CREATED({ metadata: msg }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error sending message').send(res);
    }
  }

  static async history(req, res) {
    try {
      const messages = await getMessagesByRoom(req.params.room);
      return new OK({ metadata: messages }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching history').send(res);
    }
  }
  static async historyByUser(req, res) {
    try {
      const messages = await getMessagesByUserId(req.params.id);
      return new OK({ metadata: messages }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching history').send(res);
    }
  }
}

module.exports = MessageController;
