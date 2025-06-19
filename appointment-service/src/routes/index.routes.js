const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const appointmentRoutes = require('./appointments.routes.js');

const router = Router();
router.use('/', healthRoutes);
router.use('/', appointmentRoutes);

module.exports = router;
