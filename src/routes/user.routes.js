const express = require('express');
const UserController = require('../controllers/user.controller');
const asyncHandler = require('../utils/asyncHandler');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

// Placeholder routes - to be implemented with actual controllers
router.get('/patients', asyncHandler(UserController.getAllPatients));

router.post('/patients', asyncHandler(UserController.createPatient));

router.get('/patients/:id', asyncHandler(UserController.getPatientById));

router.put('/patients/:id', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Patient updated successfully', 200, {});
  response.send(res);
}));

router.delete('/patients/:id', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Patient deleted successfully', 200, {});
  response.send(res);
}));

// Clinical notes routes  
router.post('/clinical-notes', asyncHandler(UserController.createClinicalNotes));

// Vitals routes
router.post('/vitals', asyncHandler(UserController.createVitals));

module.exports = router; 