import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, list } from '../controllers/post.controller.js';

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
router.get('/', healthCheck);

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create blog post
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/posts', create);

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: List posts
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/posts', list);

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
router.get('/posts/:id', getById);

export default router;
