const { Router } = require('express');
const ReportController = require('../controllers/report.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');

const router = Router();
router.use(jwtMiddleware);

router.post('/reports', ReportController.create);
router.get('/reports/:id', ReportController.getById);
router.put('/reports/:id', ReportController.update);
router.delete('/reports/:id', ReportController.delete);
router.get('/reports', ReportController.list);

module.exports = router;
