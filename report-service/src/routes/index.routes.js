const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const reportRoutes = require('./report.routes.js');

const router = Router();

router.use('/', healthRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
