import { CREATED, OK, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import ChatService from '../services/index.service.js';

export default class MessageController {
  static async send(req, res) {
    try {
      const msg = await ChatService.sendMessage({
        room: req.body.room,
        sender: req.body.sender,
        text: req.body.text
      });
      return new CREATED({ metadata: msg }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error sending message').send(res);
    }
  }

  static async history(req, res) {
    try {
      const messages = await ChatService.getHistory(req.params.room);
      return new OK({ metadata: messages }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching history').send(res);
    }
  }
}
