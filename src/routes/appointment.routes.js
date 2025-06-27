const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const asyncHandler = require('../utils/asyncHandler');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

// Placeholder routes - to be implemented with actual controllers
router.get('/', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Appointments retrieved successfully', 200, []);
  response.send(res);
}));

router.post('/', asyncHandler(AppointmentController.createAppointment));

router.get('/:id', asyncHandler(AppointmentController.getAppointmentById));

router.put('/:id', asyncHandler(AppointmentController.updateAppointment));

router.delete('/:id', asyncHandler(AppointmentController.cancelAppointment));

// Doctor routes
router.get('/doctors', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Doctors retrieved successfully', 200, []);
  response.send(res);
}));

router.post('/quick-schedule', asyncHandler(AppointmentController.quickSchedule));

module.exports = router; 