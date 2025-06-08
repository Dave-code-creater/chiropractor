import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { send, history } from '../controllers/message.controller.js';

const router = Router();
router.get('/', healthCheck);
router.post('/messages', send);
router.get('/history/:room', history);

export default router;
