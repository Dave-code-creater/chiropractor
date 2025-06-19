const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const InsuranceDetailController = require('../controllers/insurance.controller.js');
const PainController = require('../controllers/pain.controller.js');
const DetailsDescriptionController = require('../controllers/details_description.controller.js');
const HealthConditionController = require('../controllers/health_condition.controller.js');
const PreliminaryController = require('../controllers/preliminary.controller.js');
const RecoveryController = require('../controllers/recovery.controller.js');
const WorkImpactController = require('../controllers/work_impact.controller.js');
const ReportGroupController = require('../controllers/report_group.controller.js');
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



router.post('/report-groups', asyncHandler(ReportGroupController.create));
router.get('/report-groups/:id', asyncHandler(ReportGroupController.getByID));
router.put('/report-groups/:id', asyncHandler(ReportGroupController.update));
router.delete('/report-groups/:id', asyncHandler(ReportGroupController.delete));

router.post('/report-groups/:id/recovery', asyncHandler(RecoveryController.create));
router.get('/report-groups/:id/recovery', asyncHandler(RecoveryController.getByID));
router.put('/report-groups/:id/recovery', asyncHandler(RecoveryController.update));
router.delete('/report-groups/:id/recovery', asyncHandler(RecoveryController.delete));

router.post('/report-groups/:id/work-impact', asyncHandler(WorkImpactController.create));
router.get('/report-groups/:id/work-impact', asyncHandler(WorkImpactController.getByID));
router.put('/report-groups/:id/work-impact', asyncHandler(WorkImpactController.update));
router.delete('/report-groups/:id/work-impact', asyncHandler(WorkImpactController.delete));

router.post('/insurance-details', asyncHandler(InsuranceDetailController.create));
router.get('/insurance-details/:id', asyncHandler(InsuranceDetailController.getByID));
router.put('/insurance-details/:id', asyncHandler(InsuranceDetailController.update));
router.delete('/insurance-details/:id', asyncHandler(InsuranceDetailController.delete));

router.post('/pain-descriptions', asyncHandler(PainController.create));
router.get('/pain-descriptions', asyncHandler(PainController.getByID));
router.put('/pain-descriptions', asyncHandler(PainController.update));
router.delete('/pain-descriptions', asyncHandler(PainController.delete));

router.post('/details-descriptions', asyncHandler(DetailsDescriptionController.create));
router.get('/details-descriptions', asyncHandler(DetailsDescriptionController.getById));
router.put('/details-descriptions', asyncHandler(DetailsDescriptionController.update));
router.delete('/details-descriptions', asyncHandler(DetailsDescriptionController.delete));

router.post('/health-conditions', asyncHandler(HealthConditionController.create));
router.get('/health-conditions', asyncHandler(HealthConditionController.getByID));
router.put('/health-conditions', asyncHandler(HealthConditionController.update));
router.delete('/health-conditions', asyncHandler(HealthConditionController.delete));

router.post('/patient-intake', asyncHandler(PreliminaryController.create));
router.get('/patient-intake', asyncHandler(PreliminaryController.getByID));
router.put('/patient-intake', asyncHandler(PreliminaryController.update));
router.delete('/patient-intake', asyncHandler(PreliminaryController.delete));

module.exports = router;
