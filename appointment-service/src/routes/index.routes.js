import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, update, list } from '../controllers/appointment.controller.js';

const router = Router();
router.get('/', healthCheck);
router.post('/appointments', create);
router.get('/appointments', list);
router.get('/appointments/:id', getById);
router.put('/appointments/:id', update);

export default router;
