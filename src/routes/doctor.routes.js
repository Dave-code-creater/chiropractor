const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const doctorController = require('../controllers/doctor.controller');

// All doctor routes require authentication and doctor role
router.use(authenticate);
router.use(authorize(['doctor']));

// Get doctor's assigned patients
router.get('/:doctorId/patients', doctorController.getDoctorPatients);

// Get patient details by doctor
router.get('/:doctorId/patients/:patientId', doctorController.getPatientDetails);

// Get doctor's dashboard stats
router.get('/:doctorId/stats', doctorController.getDoctorStats);

module.exports = router;