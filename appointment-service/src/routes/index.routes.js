const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const appointmentRoutes = require('./appointment.routes.js');

const router = Router();

router.use('/', healthRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;
