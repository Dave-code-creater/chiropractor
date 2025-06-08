import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { register, login } from '../controllers/auth.controller.js';

const router = Router();
router.get('/', healthCheck);
router.post('/register', register);
router.post('/login', login);

export default router;
