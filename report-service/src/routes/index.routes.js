const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const reportRoutes = require('./reports.routes.js');

const router = Router();
router.use('/', healthRoutes);
router.use('/', reportRoutes);

module.exports = router;
