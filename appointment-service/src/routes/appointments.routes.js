const { Router } = require('express');
const AppointmentController = require('../controllers/appointment.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac } = require('../middlewares/rbac.middleware.js');

const router = Router();
router.use(jwtMiddleware);

router.post('/appointments', AppointmentController.create);
router.get('/appointments/:id', AppointmentController.getById);
router.put('/appointments/:id', AppointmentController.update);
router.delete('/appointments/:id', AppointmentController.delete);
router.get('/appointments', rbac('doctor', 'user'), AppointmentController.list);
router.get('/doctors/:doctorId/appointments', rbac('doctor'), AppointmentController.listDoctorAppointments);

module.exports = router;
