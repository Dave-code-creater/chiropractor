const { Router } = require('express');
const { rbac } = require('../middlewares/rbac.middleware.js');
const MessageController = require('../controllers/message.controller.js');

const router = Router();

// Simple JWT middleware inline to avoid import issues
const jwtAuth = (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.use(jwtAuth);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               conversation_id:
 *                 type: integer
 *               content:
 *                 type: string
 *               sender_type:
 *                 type: string
 *                 enum: [user, doctor, staff, admin]
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/', rbac('patient', 'staff', 'doctor'), MessageController.sendMessage);

module.exports = router; 