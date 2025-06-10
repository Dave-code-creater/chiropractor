const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const ProfileController = require('../controllers/profile.controller.js');
const EmergencyContactController = require('../controllers/emergency.controller.js');
const InsuranceDetailController = require('../controllers/insurance.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');

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
router.use(jwtMiddleware);

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

module.exports = router;
