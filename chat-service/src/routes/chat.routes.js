const { Router } = require('express');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac, patientRestriction } = require('../middlewares/rbac.middleware.js');
const Conversation = require('../models/conversation.model.js');
const Message = require('../models/message.model.js');
const User = require('../models/user.model.js');

const router = Router();

router.use(jwtMiddleware);

router.post(
  '/conversations',
  rbac('patient', 'staff', 'doctor'),
  patientRestriction,
  async (req, res) => {
  const me = req.user.sub;
  const { withUserId } = req.body;
  const other = await User.findById(withUserId);
  if (!other) return res.status(404).json({ success: false, error: 'User not found' });
  let convo = await Conversation.findOne({ participants: { $all: [me, withUserId], $size: 2 } });
  if (!convo) {
    convo = await Conversation.create({ participants: [me, withUserId] });
  }
  return res.json({ success: true, metadata: convo });
  }
);

router.get('/conversations', async (req, res) => {
  const me = req.user.sub;
  const convos = await Conversation.find({ participants: me }).sort({ updatedAt: -1 });
  return res.json({ success: true, metadata: convos });
});

router.get('/conversations/:id/messages', async (req, res) => {
  const me = req.user.sub;
  const cId = req.params.id;
  const convo = await Conversation.findOne({ _id: cId, participants: me });
  if (!convo) return res.status(403).json({ success: false, error: 'Forbidden' });
  const messages = await Message.find({ conversation: cId }).sort({ timestamp: 1 });
  return res.json({ success: true, metadata: messages });
});

module.exports = router;
