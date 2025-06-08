import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';
import PostController from '../controllers/post.controller.js';

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', HealthController.healthCheck);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create post
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/posts', PostController.create);

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get post by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/posts/:id', PostController.getById);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: List posts
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/posts', PostController.list);

export default router;
