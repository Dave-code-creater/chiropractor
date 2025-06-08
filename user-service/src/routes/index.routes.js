import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, update } from '../controllers/profile.controller.js';

const router = Router();
router.get('/', healthCheck);
router.post('/profiles', create);
router.get('/profiles/:id', getById);
router.put('/profiles/:id', update);

export default router;
