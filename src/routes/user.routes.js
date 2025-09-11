const express = require('express');
const UserController = require('../controllers/user.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// Patient management
router.post('/patients', authenticate, authorize('doctor', 'admin'), asyncHandler(UserController.createPatient));
router.get('/patients', authenticate, authorize('doctor'), asyncHandler(UserController.getAllPatients));
router.get('/patients/:id', authenticate, authorize('doctor', 'admin', 'patient'), asyncHandler(UserController.getPatientById));
router.put('/patients/:id', authenticate, authorize('doctor', 'admin'), asyncHandler(UserController.updatePatient));
router.post('/patients/:id/clinical-notes', authenticate, authorize('doctor', 'admin'), asyncHandler(UserController.addClinicalNotes));
router.get('/patients/:id/clinical-notes', authenticate, authorize('doctor', 'admin', 'patient'), asyncHandler(UserController.getClinicalNotes));

// User profile
router.get('/profile', authenticate, asyncHandler(UserController.getProfile));
router.put('/profile', authenticate, asyncHandler(UserController.updateProfile));

module.exports = router; 