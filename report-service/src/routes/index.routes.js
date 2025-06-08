import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, update, list } from '../controllers/report.controller.js';

const router = Router();
router.get('/', healthCheck);
router.post('/reports', create);
router.get('/reports', list);
router.get('/reports/:id', getById);
router.put('/reports/:id', update);

export default router;
