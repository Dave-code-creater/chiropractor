const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const ProfileController = require('../controllers/profile.controller.js');
const EmergencyContactController = require('../controllers/emergency.controller.js');
const InsuranceDetailController = require('../controllers/insurance.controller.js');
const PatientIntakeController = require('../controllers/patientIntake.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const lowercaseMiddleware = require('../middlewares/lowercase.middleware.js');
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
router.use(
  lowercaseMiddleware([
    'month_of_birth',
    'monthOfBirth',
    'accident_date',
    'accidentDate',
    'accident_time_period',
    'accidentTimePeriod',
    'ssn',
    'homePhone',
    'workPhone',
    'spousePhone',
    'contact1Phone',
    'first_name',
    'last_name',
    'middle_name',
    'gender',
    'emergency_contact_name',
    'emergency_contact_phone',
    'emergency_contact_relationship',
  ])
);

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

router.post('/emergency-contacts', asyncHandler(EmergencyContactController.create));
router.get('/emergency-contacts/:id', asyncHandler(EmergencyContactController.getById));
router.put('/emergency-contacts/:id', asyncHandler(EmergencyContactController.update));

router.post('/insurance-details', asyncHandler(InsuranceDetailController.create));
router.get('/insurance-details/:id', asyncHandler(InsuranceDetailController.getById));
router.put('/insurance-details/:id', asyncHandler(InsuranceDetailController.update));

router.post('/patient-intake', asyncHandler(PatientIntakeController.create));
router.get('/patient-intake', asyncHandler(PatientIntakeController.getById));
router.put('/patient-intake', asyncHandler(PatientIntakeController.update));

module.exports = router;
