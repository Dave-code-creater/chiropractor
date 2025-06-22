const { Router } = require('express');
const healthRoutes = require('./health.routes.js');
const appointmentRoutes = require('./appointment.routes.js');
const doctorRoutes = require('./doctor.routes.js');

const router = Router();

router.use('/', healthRoutes);
router.use('/doctors', doctorRoutes); // Mount doctors directly, not under appointments
router.use('/appointments', appointmentRoutes);

module.exports = router;
