const ChatService = require('../services/index.service.js');
const { CREATED, OK, InternalServerError } = require('../utils/httpResponses.js');

class MessageController {
  static async send(req, res) {
    try {
      const msg = await ChatService.send(req.body);
      return new CREATED({ metadata: msg }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error sending message').send(res);
    }
  }

  static async history(req, res) {
    try {
      const messages = await ChatService.historyByRoom(req.params.room);
      return new OK({ metadata: messages }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching history').send(res);
    }
  }

  static async historyByUser(req, res) {
    try {
      const messages = await ChatService.historyByUser(req.params.id);
      return new OK({ metadata: messages }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching history').send(res);
    }
  }

  static async inbox(req, res) {
    try {
      const list = await ChatService.inboxForUser(req.user.sub);
      return new OK({ metadata: list }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching inbox').send(res);
    }
  }
}

module.exports = MessageController;
