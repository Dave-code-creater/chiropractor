import { saveMessage, getMessagesByRoom } from '../repositories/index.repo.js';

export const send = async (req, res) => {
  try {
    const msg = await saveMessage({ room: req.body.room, sender: req.body.sender, text: req.body.text, ts: new Date() });
    res.status(201).json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error sending message' });
  }
};

export const history = async (req, res) => {
  try {
    const messages = await getMessagesByRoom(req.params.room);
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error fetching history' });
  }
};
