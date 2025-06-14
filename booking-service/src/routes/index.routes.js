const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const BookingController = require('../controllers/booking.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');

const router = Router();

router.get('/', HealthController.healthCheck);
router.use(jwtMiddleware);

router.post('/bookings', BookingController.create);
router.get('/bookings/:id', BookingController.getById);
router.put('/bookings/:id', BookingController.update);
router.delete('/bookings/:id', BookingController.delete);
router.get('/bookings', BookingController.list);

module.exports = router;
