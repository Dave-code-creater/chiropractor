import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';
import ProfileController from '../controllers/profile.controller.js';
import EmergencyContactController from '../controllers/emergency.controller.js';
import InsuranceDetailController from '../controllers/insurance.controller.js';

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
 * /profiles:
 *   post:
 *     summary: Create profile
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/profiles', ProfileController.create);

/**
 * @swagger
 * /profiles/{id}:
 *   get:
 *     summary: Get profile by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/profiles/:id', ProfileController.getById);

/**
 * @swagger
 * /profiles/{id}:
 *   put:
 *     summary: Update profile
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.put('/profiles/:id', ProfileController.update);

router.post('/emergency-contacts', EmergencyContactController.create);
router.get('/emergency-contacts/:id', EmergencyContactController.getById);
router.put('/emergency-contacts/:id', EmergencyContactController.update);

router.post('/insurance-details', InsuranceDetailController.create);
router.get('/insurance-details/:id', InsuranceDetailController.getById);
router.put('/insurance-details/:id', InsuranceDetailController.update);

export default router;
