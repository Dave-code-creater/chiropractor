const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const ProfileController = require('../controllers/profile.controller.js');
const EmergencyContactController = require('../controllers/emergency.controller.js');
const InsuranceDetailController = require('../controllers/insurance.controller.js');
const PainController = require('../controllers/pain.controller.js');
const DetailsDescriptionController = require('../controllers/details_description.controller.js');
const HealthConditionController = require('../controllers/health_condition.controller.js');
const PreliminaryController = require('../controllers/preliminary.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const asyncHandler = require('../helper/asyncHandler.js');
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
router.post('/profiles', asyncHandler(ProfileController.create));
router.post('/patient-intake', asyncHandler(ProfileController.create));

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
router.get('/profiles/:id', asyncHandler(ProfileController.getById));

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
router.put('/profiles/:id', asyncHandler(ProfileController.update));
router.delete('/profiles/:id', asyncHandler(ProfileController.delete));

router.post('/emergency-contacts', asyncHandler(EmergencyContactController.create));
router.get('/emergency-contacts/:id', asyncHandler(EmergencyContactController.getById));
router.put('/emergency-contacts/:id', asyncHandler(EmergencyContactController.update));
router.delete('/emergency-contacts/:id', asyncHandler(EmergencyContactController.delete));

router.post('/insurance-details', asyncHandler(InsuranceDetailController.create));
router.get('/insurance-details/:id', asyncHandler(InsuranceDetailController.getById));
router.put('/insurance-details/:id', asyncHandler(InsuranceDetailController.update));
router.delete('/insurance-details/:id', asyncHandler(InsuranceDetailController.delete));

router.post('/pain-descriptions', asyncHandler(PainController.create));
router.get('/pain-descriptions/:id', asyncHandler(PainController.getByID));
router.put('/pain-descriptions/:id', asyncHandler(PainController.update));
router.delete('/pain-descriptions/:id', asyncHandler(PainController.delete));

router.post('/details-descriptions', asyncHandler(DetailsDescriptionController.create));
router.get('/details-descriptions/:id', asyncHandler(DetailsDescriptionController.getById));
router.put('/details-descriptions/:id', asyncHandler(DetailsDescriptionController.update));
router.delete('/details-descriptions/:id', asyncHandler(DetailsDescriptionController.delete));

router.post('/health-conditions', asyncHandler(HealthConditionController.create));
router.get('/health-conditions/:id', asyncHandler(HealthConditionController.getByID));
router.put('/health-conditions/:id', asyncHandler(HealthConditionController.update));
router.delete('/health-conditions/:id', asyncHandler(HealthConditionController.delete));

router.post('/preliminaries', asyncHandler(PreliminaryController.create));
router.get('/preliminaries/:id', asyncHandler(PreliminaryController.getByID));
router.put('/preliminaries/:id', asyncHandler(PreliminaryController.update));
router.delete('/preliminaries/:id', asyncHandler(PreliminaryController.delete));

module.exports = router;
