import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, list } from '../controllers/post.controller.js';

const router = Router();
router.get('/', healthCheck);
router.post('/posts', create);
router.get('/posts', list);
router.get('/posts/:id', getById);

export default router;
