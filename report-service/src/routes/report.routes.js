const { Router } = require('express');
const ReportController = require('../controllers/report.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');

const router = Router();

router.use(jwtMiddleware);

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Create report
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/', ReportController.create);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get report by id
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
router.get('/:id', ReportController.getById);

/**
 * @swagger
 * /reports/{id}:
 *   put:
 *     summary: Update report
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
router.put('/:id', ReportController.update);

/**
 * @swagger
 * /reports/{id}:
 *   delete:
 *     summary: Delete report
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
router.delete('/:id', ReportController.delete);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: List reports
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', ReportController.list);

/**
 * @swagger
 * /reports/owner/{ownerId}:
 *   get:
 *     summary: List reports by owner
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/owner/:ownerId', ReportController.listByOwner);

module.exports = router;
