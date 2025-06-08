import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';
import AuthController from '../controllers/auth.controller.js';

const router = Router();

router.get('/', HealthController.healthCheck);

router.post('/register', AuthController.signUp);
router.post('/login', AuthController.signIn);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.signOut);

export default router;
